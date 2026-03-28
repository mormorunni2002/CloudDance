import { format } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanString(value: unknown) {
  if (value === null || value === undefined) return null;
  const text = String(value).replace(/\u0000/g, "").trim();
  return text.length ? text : null;
}

export function normalizeText(value: unknown) {
  const cleaned = cleanString(value);
  return cleaned ? cleaned.toLowerCase().replace(/\s+/g, " ").trim() : null;
}

export function normalizeDomain(value: unknown) {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  return cleaned
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "")
    .trim();
}

export function normalizeWebsite(value: unknown) {
  const normalized = normalizeDomain(value);
  return normalized;
}

export function parseInteger(value: unknown) {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  const normalized = cleaned.replace(/,/g, "");
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseMaybeNumber(value: unknown) {
  const cleaned = cleanString(value);
  if (!cleaned || cleaned.toLowerCase() === "n.a.") return null;
  const normalized = cleaned.replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatDateTime(value?: Date | string | null) {
  if (!value) return "—";
  return format(new Date(value), "MMM d, yyyy h:mm a");
}

export function formatDate(value?: Date | string | null) {
  if (!value) return "—";
  return format(new Date(value), "MMM d, yyyy");
}

export function buildPageHref(
  pathname: string,
  current: Record<string, string | string[] | undefined>,
  updates: Record<string, string | number | undefined | null>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
      continue;
    }
    if (value) params.set(key, value);
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === "") {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function truncate(value: string | null | undefined, max = 120) {
  if (!value) return "";
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}
