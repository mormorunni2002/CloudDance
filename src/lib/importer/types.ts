import type { ImportFileType } from "@prisma/client";

export type ParsedFile = {
  fileType: ImportFileType;
  encoding: string | null;
  headers: string[];
  rows: Record<string, unknown>[];
};

export type ParsedContactInput = {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  title?: string | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  linkedinUrl?: string | null;
  emailVerified?: boolean | null;
  rawRowNumber: number;
};

export type ParsedLeadInput = {
  headerRowNumber: number;
  brokerageName: string;
  tradeDescription?: string | null;
  lineOfBusiness?: string | null;
  website?: string | null;
  domain?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  agencySize?: string | null;
  npnLicenseInfo?: string | null;
  carrierAppointments?: string | null;
  specialtyNiche?: string | null;
  rawMetadata?: Record<string, unknown>;
  contacts: ParsedContactInput[];
  sourceRows: {
    rowNumber: number;
    rowType: "lead" | "continuation";
    payload: Record<string, unknown>;
  }[];
};

export type ImportCounters = {
  totalRows: number;
  leadRows: number;
  continuationRows: number;
  processedRows: number;
  leadsCreated: number;
  leadsUpdated: number;
  contactsCreated: number;
  contactsUpdated: number;
  errorsCount: number;
  skippedRows: number;
};
