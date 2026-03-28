import type { LeadStatus, Priority, Role, TaskStatus } from "@prisma/client";

export const leadStatusLabels: Record<LeadStatus, string> = {
  UNWORKED: "Unworked",
  ATTEMPTED: "Attempted",
  CONNECTED: "Connected",
  INTERESTED: "Interested",
  FOLLOW_UP: "Follow Up",
  CLOSED_WON: "Closed Won",
  CLOSED_LOST: "Closed Lost",
  BAD_DATA: "Bad Data",
};

export const roleLabels: Record<Role, string> = {
  ADMIN: "Admin",
  SDR: "Caller / SDR",
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  OPEN: "Open",
  COMPLETED: "Completed",
  CANCELED: "Canceled",
};

export const priorityLabels: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const leadStatusOptions = Object.entries(leadStatusLabels).map(([value, label]) => ({
  value,
  label,
}));

export const priorityOptions = Object.entries(priorityLabels).map(([value, label]) => ({
  value,
  label,
}));

export const defaultDispositionToLeadStatus: Record<string, LeadStatus> = {
  UNWORKED: "UNWORKED",
  ATTEMPTED: "ATTEMPTED",
  CONNECTED: "CONNECTED",
  INTERESTED: "INTERESTED",
  FOLLOW_UP: "FOLLOW_UP",
  CLOSED_WON: "CLOSED_WON",
  CLOSED_LOST: "CLOSED_LOST",
  BAD_DATA: "BAD_DATA",
};

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/queue", label: "Queue" },
  { href: "/leads", label: "Leads" },
  { href: "/imports", label: "Imports", adminOnly: true },
  { href: "/settings/integrations", label: "Integrations" },
];
