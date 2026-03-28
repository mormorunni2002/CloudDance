"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function authenticate(_: string | null, formData: FormData) {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      redirectTo: "/",
    });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Incorrect email or password.";
        default:
          return "Unable to sign in. Check your credentials and try again.";
      }
    }
    throw error;
  }
}
