"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { TokenResponse } from "@/lib/types";
import { Spinner, Logo } from "@/components/ui";

function MagicLinkContent() {
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
      setError("No sign-in token provided.");
      return;
    }

    async function verify() {
      try {
        const data = await apiClient.post<TokenResponse>(
          "/auth/magic-link/verify",
          { token }
        );
        apiClient.setTokens(data.access_token, data.refresh_token);
        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 1500);
      } catch (err) {
        setStatus("error");
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Sign-in failed. The link may have expired.");
        }
      }
    }

    verify();
  }, [token, router]);

  return (
    <div className="card text-center">
      {status === "verifying" && (
        <>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <Spinner size="lg" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-slate-900">
            Signing you in...
          </h2>
          <p className="text-sm text-slate-600">
            Please wait while we verify your sign-in link.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-slate-900">
            Signed in!
          </h2>
          <p className="text-sm text-slate-600">
            Redirecting you to the dashboard...
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-slate-900">
            Sign-in failed
          </h2>
          <p className="mb-6 text-sm text-red-600">{error}</p>
          <Link href="/login" className="btn-primary inline-block">
            Back to sign in
          </Link>
        </>
      )}
    </div>
  );
}

export default function MagicLinkPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-blue-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4">
          <Logo variant="full" colorScheme="color" size="lg" />
        </div>

        <Suspense
          fallback={
            <div className="card flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          }
        >
          <MagicLinkContent />
        </Suspense>
      </div>
    </div>
  );
}
