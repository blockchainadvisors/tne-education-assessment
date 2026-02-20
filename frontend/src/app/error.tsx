"use client";

import Image from "next/image";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <Image
        src="/illustrations/error.png"
        alt=""
        width={320}
        height={320}
        className="h-auto w-72"
        priority
      />
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        An unexpected error occurred. Our team has been notified. Please try
        again or return to the dashboard.
      </p>
      <div className="mt-8 flex gap-3">
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
        <a href="/dashboard" className="btn-ghost">
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
