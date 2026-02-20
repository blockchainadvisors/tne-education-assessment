"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { apiClient } from "@/lib/api-client";
import type { MessageResponse } from "@/lib/types";
import { Spinner, Alert, Logo } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    tenant_name: "",
    tenant_slug: "",
    country: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from tenant name
      if (field === "tenant_name") {
        updated.tenant_slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }
      return updated;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiClient.post<MessageResponse>("/auth/register", formData);
      router.push(
        `/verify-email-sent?email=${encodeURIComponent(formData.email)}`
      );
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-blue-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center gap-4">
          <Image
            src="/illustrations/auth-register.png"
            alt=""
            width={200}
            height={200}
            className="h-auto w-48"
            priority
          />
          <Logo variant="full" colorScheme="color" size="lg" />
          <p className="text-sm text-slate-600">
            Register your institution to begin assessments
          </p>
        </div>

        <div className="card">
          <h2 className="mb-6 text-xl font-semibold text-slate-900">
            Create your account
          </h2>

          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="full_name" className="label">
                  Full name
                </label>
                <input
                  id="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => updateField("full_name", e.target.value)}
                  className="input-field mt-1.5"
                  placeholder="Dr. Jane Smith"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="email" className="label">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="input-field mt-1.5"
                  placeholder="you@institution.edu"
                  autoComplete="email"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="password" className="label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className="input-field mt-1.5"
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="tenant_name" className="label">
                  Institution name
                </label>
                <input
                  id="tenant_name"
                  type="text"
                  required
                  value={formData.tenant_name}
                  onChange={(e) => updateField("tenant_name", e.target.value)}
                  className="input-field mt-1.5"
                  placeholder="University of Example"
                />
              </div>

              <div>
                <label htmlFor="tenant_slug" className="label">
                  Institution slug
                </label>
                <input
                  id="tenant_slug"
                  type="text"
                  required
                  value={formData.tenant_slug}
                  onChange={(e) => updateField("tenant_slug", e.target.value)}
                  className="input-field mt-1.5"
                  placeholder="university-of-example"
                />
                <p className="mt-1 text-xs text-slate-500">
                  URL-friendly identifier (auto-generated)
                </p>
              </div>

              <div>
                <label htmlFor="country" className="label">
                  Country
                </label>
                <input
                  id="country"
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => updateField("country", e.target.value)}
                  className="input-field mt-1.5"
                  placeholder="United Kingdom"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" className="text-white" />
                  Creating account...
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-600 hover:text-brand-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
