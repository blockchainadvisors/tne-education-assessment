"use client";

import { Shield, Users, Building2, Settings } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Administration</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your institution settings, users, and partner relationships.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Tenant Settings */}
        <div className="card flex flex-col items-center py-8 text-center">
          <div className="rounded-full bg-indigo-100 p-3">
            <Building2 className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="mt-4 font-semibold text-slate-900">
            Institution Settings
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Update institution profile, country, and type.
          </p>
          <button className="btn-secondary mt-4" disabled>
            Coming Soon
          </button>
        </div>

        {/* User Management */}
        <div className="card flex flex-col items-center py-8 text-center">
          <div className="rounded-full bg-emerald-100 p-3">
            <Users className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="mt-4 font-semibold text-slate-900">
            User Management
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Invite users, manage roles and permissions.
          </p>
          <button className="btn-secondary mt-4" disabled>
            Coming Soon
          </button>
        </div>

        {/* Partner Management */}
        <div className="card flex flex-col items-center py-8 text-center">
          <div className="rounded-full bg-amber-100 p-3">
            <Shield className="h-6 w-6 text-amber-600" />
          </div>
          <h3 className="mt-4 font-semibold text-slate-900">
            Partner Institutions
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Add and manage TNE partner institutions.
          </p>
          <button className="btn-secondary mt-4" disabled>
            Coming Soon
          </button>
        </div>

        {/* System Settings */}
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
