"use client";

import { useActionState } from "react";
import { authenticate } from "@/app/(public)/login/actions";

const initialState: string | null = null;

export function LoginForm() {
  const [errorMessage, formAction, pending] = useActionState(authenticate, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="alex@clouddance.insure" className="w-full" />
      </div>
      <div className="space-y-2">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" placeholder="••••••••••••" className="w-full" />
      </div>
      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>
      ) : null}
      <button type="submit" className="button-primary w-full" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
