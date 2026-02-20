"use client";

import Link from "next/link";
import { Shield, Users, Building2, Settings, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui";

const sections = [
  {
    title: "Institution Settings",
    description: "Update institution profile, country, and type.",
    icon: Building2,
    iconBg: "bg-brand-100",
    iconColor: "text-brand-600",
    href: "/admin/settings",
  },
  {
    title: "User Management",
    description: "Invite users, manage roles and permissions.",
    icon: Users,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    href: "/admin/users",
  },
  {
    title: "Partner Institutions",
    description: "Add and manage TNE partner institutions.",
    icon: Shield,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    href: "/admin/partners",
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration"
        description="Manage your institution settings, users, and partner relationships."
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="card flex flex-col items-center py-8 text-center transition-shadow hover:shadow-md"
          >
            <div className={`rounded-full ${s.iconBg} p-3`}>
              <s.icon className={`h-6 w-6 ${s.iconColor}`} />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{s.description}</p>
            <span className="btn-secondary mt-4 inline-flex items-center gap-1.5">
              Manage
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ))}

        {/* System Configuration — still disabled */}
        <div className="card flex flex-col items-center py-8 text-center">
          <div className="rounded-full bg-slate-100 p-3">
            <Settings className="h-6 w-6 text-slate-600" />
          </div>
          <h3 className="mt-4 font-semibold text-slate-900">
            System Configuration
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            API keys, integrations, and system preferences.
          </p>
          <button className="btn-secondary mt-4" disabled>
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
}
