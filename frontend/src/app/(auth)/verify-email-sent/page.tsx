"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { apiClient } from "@/lib/api-client";
import type { MessageResponse } from "@/lib/types";
import { Spinner, Alert, Logo } from "@/components/ui";

function VerifyEmailSentContent() {
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
    <div className="card text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
        <Image
          src="/illustrations/auth-email-sent.png"
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 object-contain"
        />
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
        <Alert variant="success" className="mb-4">
          {message}
        </Alert>
      )}

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <button
        onClick={handleResend}
        disabled={resending || !email}
        className="btn-primary w-full"
      >
        {resending ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner size="sm" className="text-white" />
            Sending...
          </span>
        ) : (
          "Resend verification email"
        )}
      </button>

      <p className="mt-6 text-sm text-slate-500">
        Didn&apos;t receive the email? Check your spam folder or try
        resending.
      </p>

      <p className="mt-4 text-center text-sm text-slate-600">
        <Link
          href="/login"
          className="font-semibold text-brand-600 hover:text-brand-500"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmailSentPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-blue-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4">
          <Image
            src="/illustrations/auth-email-sent.png"
            alt=""
            width={200}
            height={200}
            className="h-auto w-48"
            priority
          />
          <Logo variant="full" colorScheme="color" size="lg" />
        </div>

        <Suspense
          fallback={
            <div className="card flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          }
        >
          <VerifyEmailSentContent />
        </Suspense>
      </div>
    </div>
  );
}
