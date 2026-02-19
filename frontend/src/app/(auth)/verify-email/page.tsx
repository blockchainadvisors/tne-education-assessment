"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { TokenResponse } from "@/lib/types";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("No verification token provided.");
      return;
    }

    async function verify() {
      try {
        const data = await apiClient.post<TokenResponse>(
          `/auth/verify-email?token=${encodeURIComponent(token!)}`,
        );
        apiClient.setTokens(data.access_token, data.refresh_token);
        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 1500);
      } catch (err) {
        setStatus("error");
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Verification failed. The link may have expired.");
        }
      }
    }

    verify();
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            TNE Assessment
          </h1>
        </div>

        <div className="card text-center">
          {status === "verifying" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                <svg
                  className="h-10 w-10 animate-spin text-indigo-600"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-slate-900">
                Verifying your email...
              </h2>
              <p className="text-sm text-slate-600">
                Please wait while we verify your email address.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-slate-900">
                Email verified!
              </h2>
              <p className="text-sm text-slate-600">
                Redirecting you to the dashboard...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-slate-900">
                Verification failed
              </h2>
              <p className="mb-6 text-sm text-red-600">{error}</p>
              <Link href="/login" className="btn-primary inline-block">
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
