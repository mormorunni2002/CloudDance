"use client";

import { useTransition } from "react";
import { assignLeadAction } from "@/app/(app)/actions";

type User = { id: string; name: string | null; email: string; role: string };

export function InlineAssignSelect({
  leadId,
  currentUserId,
  users,
}: {
  leadId: string;
  currentUserId: string | null;
  users: User[];
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const userId = e.target.value;
    const fd = new FormData();
    fd.set("leadId", leadId);
    fd.set("userId", userId);
    startTransition(() => assignLeadAction(fd));
  }

  return (
    <select
      defaultValue={currentUserId ?? ""}
      onChange={handleChange}
      disabled={isPending}
      className={isPending ? "opacity-50" : ""}
    >
      <option value="">Unassigned</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name || u.email} ({u.role})
        </option>
      ))}
    </select>
  );
}
