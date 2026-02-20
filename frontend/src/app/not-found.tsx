import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <Image
        src="/illustrations/404.png"
        alt=""
        width={320}
        height={320}
        className="h-auto w-72"
        priority
      />
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Check the URL or head back to the dashboard.
      </p>
      <Link href="/dashboard" className="btn-primary mt-8">
        Go to Dashboard
      </Link>
    </div>
  );
}
