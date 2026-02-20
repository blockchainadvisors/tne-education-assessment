"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Themes", href: "#themes" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsAuthenticated(!!localStorage.getItem("access_token"));

    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 shadow-sm backdrop-blur-sm"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-8">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Logo variant="full" colorScheme="color" size="md" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          {mounted && isAuthenticated ? (
            <Link href="/dashboard" className="btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Sign In
              </Link>
              <Link href="/register" className="btn-primary">
                Get Started Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}

            <div className="mt-2 border-t border-slate-100 pt-3">
              {mounted && isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="btn-primary w-full text-center"
                  onClick={() => setMenuOpen(false)}
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="btn-secondary mb-2 w-full text-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="btn-primary w-full text-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
