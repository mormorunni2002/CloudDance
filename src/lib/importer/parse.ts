import fs from "fs/promises";
import * as XLSX from "xlsx";
import iconv from "iconv-lite";
import { parse as parseCsv } from "csv-parse/sync";
import { cleanString, normalizeDomain, normalizeText, parseMaybeNumber } from "@/lib/utils";
import { normalizePhoneNumber } from "@/lib/phone";
import { detectImportFileType } from "@/lib/importer/detect";
import type { ParsedContactInput, ParsedFile, ParsedLeadInput } from "@/lib/importer/types";

const CANDIDATE_ENCODINGS = ["utf8", "utf-8", "utf8-bom", "latin1", "win1252"] as const;

type RawRow = Record<string, unknown>;

function decodeBuffer(buffer: Buffer, encoding: (typeof CANDIDATE_ENCODINGS)[number]) {
  if (encoding === "utf8-bom") {
    return iconv.decode(buffer, "utf8").replace(/^\uFEFF/, "");
  }
  if (encoding === "win1252") {
    return iconv.decode(buffer, "win1252");
  }
  return iconv.decode(buffer, encoding);
}

function parseCsvBuffer(buffer: Buffer) {
  let lastError: unknown = null;

  for (const encoding of CANDIDATE_ENCODINGS) {
    try {
      const decoded = decodeBuffer(buffer, encoding);
      const rows = parseCsv(decoded, {
        columns: true,
        bom: true,
        skip_empty_lines: false,
        relax_column_count: true,
        relax_quotes: true,
        trim: false,
      }) as RawRow[];

      const headers = rows.length ? Object.keys(rows[0]) : [];
      return {
        encoding,
        rows,
        headers,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Unable to decode CSV.");
}

function parseXlsxBuffer(buffer: Buffer) {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: false,
    raw: false,
  });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      encoding: null,
      rows: [] as RawRow[],
      headers: [] as string[],
    };
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<RawRow>(worksheet, {
    defval: "",
  });
  const headers = rows.length ? Object.keys(rows[0]) : [];

  return {
    encoding: null,
    rows,
    headers,
  };
}

export async function parseSourceFile(filePath: string): Promise<ParsedFile> {
  const buffer = await fs.readFile(filePath);
  const lower = filePath.toLowerCase();
  const parsed = lower.endsWith(".xlsx") || lower.endsWith(".xls") ? parseXlsxBuffer(buffer) : parseCsvBuffer(buffer);
  const fileType = detectImportFileType(parsed.headers, parsed.rows[0] ?? null);

  return {
    fileType,
    encoding: parsed.encoding,
    headers: parsed.headers,
    rows: parsed.rows,
  };
}

function buildContact(row: RawRow, rowNumber: number): ParsedContactInput | null {
  const firstName = cleanString(row["DMFirst name"]);
  const lastName = cleanString(row["DMLast name"]);
  const email = cleanString(row["DME-mail address"]) || cleanString(row["E-mail address"]);
  const phone = cleanString(row["Telephone number"]);

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || null;
  const meaningful = fullName || email || phone;

  if (!meaningful) return null;

  return {
    firstName,
    lastName,
    fullName,
    email,
    phone,
    rawRowNumber: rowNumber,
  };
}

function mergeContacts(contacts: ParsedContactInput[]) {
  const merged = new Map<string, ParsedContactInput>();

  for (const contact of contacts) {
    const key = [
      normalizeText(contact.fullName),
      normalizeText(contact.email),
      normalizePhoneNumber(contact.phone),
    ]
      .filter(Boolean)
      .join("|");

    if (!key) continue;

    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, contact);
      continue;
    }

    merged.set(key, {
      ...existing,
      firstName: existing.firstName || contact.firstName,
      lastName: existing.lastName || contact.lastName,
      fullName: existing.fullName || contact.fullName,
      email: existing.email || contact.email,
      phone: existing.phone || contact.phone,
      rawRowNumber: Math.min(existing.rawRowNumber, contact.rawRowNumber),
    });
  }

  return Array.from(merged.values());
}

export function parseBrokerageRows(rows: RawRow[]): { leads: ParsedLeadInput[]; counters: { leadRows: number; continuationRows: number } } {
  const leads: ParsedLeadInput[] = [];
  let currentLead: ParsedLeadInput | null = null;
  let leadRows = 0;
  let continuationRows = 0;

  function finalizeCurrentLead() {
    if (!currentLead) return;
    currentLead.contacts = mergeContacts(currentLead.contacts);
    leads.push(currentLead);
    currentLead = null;
  }

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // header row is line 1
    const brokerageName = cleanString(row["Company name Latin alphabet"]);
    const rowType = brokerageName ? "lead" : "continuation";

    if (rowType === "lead") {
      finalizeCurrentLead();
      leadRows += 1;
      currentLead = {
        headerRowNumber: rowNumber,
        brokerageName,
        tradeDescription: cleanString(row["Trade description (English)"]),
        lineOfBusiness: cleanString(row["Trade description (English)"]),
        website: cleanString(row["Website address"]),
        domain: normalizeDomain(row["Domain"]) || normalizeDomain(row["Website address"]),
        phone: cleanString(row["Telephone number"]),
        city: cleanString(row["City"]),
        state: cleanString(row["State"]),
        address: cleanString(row["Address"]),
        agencySize: cleanString(row["Agency size"]),
        npnLicenseInfo: cleanString(row["NPN / license info"]),
        carrierAppointments: cleanString(row["Carrier appointments"]),
        specialtyNiche: cleanString(row["Specialty / niche"]) || cleanString(row["Trade description (English)"]),
        rawMetadata: {
          operatingRevenueThUsd: parseMaybeNumber(row["Operating revenue (Turnover)\nth USD Last avail. yr"]),
          profitBeforeTaxThUsd: parseMaybeNumber(row["P/L before tax\nth USD Last avail. yr"]),
          totalAssetsThUsd: parseMaybeNumber(row["Total assets\nth USD Last avail. yr"]),
          shareholderFundsThUsd: parseMaybeNumber(row["Shareholders funds\nth USD Last avail. yr"]),
          sourceTradeDescription: cleanString(row["Trade description (English)"]),
          sourceDomain: cleanString(row["Domain"]),
          sourceWebsite: cleanString(row["Website address"]),
        },
        contacts: [],
        sourceRows: [],
      };
    } else {
      continuationRows += 1;
      if (!currentLead) {
        return;
      }
    }

    if (!currentLead) return;

    currentLead.sourceRows.push({
      rowNumber,
      rowType,
      payload: row,
    });

    const maybeContact = buildContact(row, rowNumber);
    if (maybeContact) {
      currentLead.contacts.push(maybeContact);
    }

    currentLead.website = currentLead.website || cleanString(row["Website address"]);
    currentLead.domain = currentLead.domain || normalizeDomain(row["Domain"]) || normalizeDomain(row["Website address"]);
    currentLead.phone = currentLead.phone || cleanString(row["Telephone number"]);
    currentLead.lineOfBusiness = currentLead.lineOfBusiness || cleanString(row["Trade description (English)"]);
  });

  finalizeCurrentLead();

  return {
    leads,
    counters: { leadRows, continuationRows },
  };
}
