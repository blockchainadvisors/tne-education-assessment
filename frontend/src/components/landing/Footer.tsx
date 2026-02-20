import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const platformLinks = [
  { label: "Features", href: "#features" },
  { label: "Assessment Themes", href: "#themes" },
  { label: "How It Works", href: "#how-it-works" },
];

const accountLinks = [
  { label: "Sign In", href: "/login" },
  { label: "Register", href: "/register" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Logo variant="full" colorScheme="white" size="md" />
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              AI-powered quality assessment and benchmarking for transnational
              education partnerships.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold text-white">Platform</h3>
            <ul className="mt-3 space-y-2">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold text-white">Account</h3>
            <ul className="mt-3 space-y-2">
              {accountLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white">Legal</h3>
            <ul className="mt-3 space-y-2">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-slate-800 pt-6">
          <p className="text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} TNE Assessment Platform. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
