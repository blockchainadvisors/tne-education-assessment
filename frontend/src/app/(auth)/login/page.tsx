"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { MessageResponse, TokenResponse } from "@/lib/types";
import { Spinner, Alert } from "@/components/ui";

type Tab = "password" | "magic-link";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePasswordLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const data = await apiClient.post<TokenResponse>("/auth/login", {
        email,
        password,
      });
      apiClient.setTokens(data.access_token, data.refresh_token);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        // Check for email not verified
        if (err.message.includes("Email not verified")) {
          setError(
            "Your email is not verified. Please check your inbox for the verification link."
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Login failed. Please check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const data = await apiClient.post<MessageResponse>("/auth/magic-link", {
        email,
      });
      setMessage(data.message);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to send sign-in link. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-blue-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            TNE Assessment
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Transnational Education Quality Assessment Platform
          </p>
        </div>

        <div className="card">
          <h2 className="mb-6 text-xl font-semibold text-slate-900">
            Sign in to your account
          </h2>

          {/* Tabs */}
          <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setTab("password");
                setError("");
                setMessage("");
              }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tab === "password"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("magic-link");
                setError("");
                setMessage("");
              }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tab === "magic-link"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Magic Link
            </button>
          </div>

          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          {message && (
            <Alert variant="success" className="mb-4">
              {message}
            </Alert>
          )}

          {tab === "password" ? (
            <form onSubmit={handlePasswordLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="label">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field mt-1.5"
                  placeholder="you@institution.edu"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field mt-1.5"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" className="text-white" />
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-5">
              <div>
                <label htmlFor="magic-email" className="label">
                  Email address
                </label>
                <input
                  id="magic-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field mt-1.5"
                  placeholder="you@institution.edu"
                  autoComplete="email"
                />
              </div>

              <p className="text-sm text-slate-500">
                We&apos;ll send a sign-in link to your email. No password
                needed.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" className="text-white" />
                    Sending link...
                  </span>
                ) : (
                  "Send sign-in link"
                )}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-brand-600 hover:text-brand-500"
            >
              Register your institution
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
