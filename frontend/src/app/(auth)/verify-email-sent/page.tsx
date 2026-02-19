"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { MessageResponse } from "@/lib/types";

export default function VerifyEmailSentPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setMessage("");
    setError("");

    try {
      const data = await apiClient.post<MessageResponse>(
        "/auth/resend-verification",
        { email }
      );
      setMessage(data.message);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to resend. Please try again.");
      }
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            TNE Assessment
          </h1>
        </div>

        <div className="card text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
            <svg
              className="h-8 w-8 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>

          <h2 className="mb-2 text-xl font-semibold text-slate-900">
            Check your email
          </h2>
          <p className="mb-6 text-sm text-slate-600">
            We sent a verification link to{" "}
            {email ? (
              <span className="font-medium text-slate-900">{email}</span>
            ) : (
              "your email address"
            )}
            . Click the link to activate your account.
          </p>

          {message && (
            <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleResend}
            disabled={resending || !email}
            className="btn-primary w-full"
          >
            {resending ? "Sending..." : "Resend verification email"}
          </button>

          <p className="mt-6 text-sm text-slate-500">
            Didn&apos;t receive the email? Check your spam folder or try
            resending.
          </p>

          <p className="mt-4 text-center text-sm text-slate-600">
            <Link
              href="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
