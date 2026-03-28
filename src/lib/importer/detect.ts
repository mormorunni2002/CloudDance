import { createHash } from "crypto";
import type { ImportFileType } from "@prisma/client";

export const BROKER_HEADERS = [
  "Company name Latin alphabet",
  "Trade description (English)",
  "Telephone number",
  "Domain",
  "Website address",
];

export function sha256(content: Buffer) {
  return createHash("sha256").update(content).digest("hex");
}

export function detectImportFileType(headers: string[], firstRow?: Record<string, unknown> | null): ImportFileType {
  const normalizedHeaders = new Set(headers.map((header) => header.trim()));
  const hasBrokerHeaders = BROKER_HEADERS.every((header) => normalizedHeaders.has(header));
  if (hasBrokerHeaders) return "BROKER_LEADS";

  const firstKey = firstRow ? String(Object.keys(firstRow)[0] ?? "").trim() : "";
  const firstValue = firstRow ? String(Object.values(firstRow)[0] ?? "").trim() : "";

  if (headers.includes("List export") || firstKey === "List export" || firstValue === "Orbis") {
    return "SEARCH_SUMMARY";
  }

  return "UNKNOWN";
}
