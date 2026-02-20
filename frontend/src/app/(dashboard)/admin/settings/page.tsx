"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { PageHeader, Alert, Badge, Spinner } from "@/components/ui";
import { useTenant, useUpdateTenant } from "@/hooks/useAdminData";

export default function SettingsPage() {
  const { data: tenant, isLoading, error } = useTenant();
  const updateTenant = useUpdateTenant();

  const [isEditing, setIsEditing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ name: "", country: "", institution_type: "" });

  useEffect(() => {
    if (tenant) {
      setForm({
        name: tenant.name,
        country: tenant.country,
        institution_type: tenant.institution_type || "",
      });
    }
  }, [tenant]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  function handleCancel() {
    if (tenant) {
      setForm({
        name: tenant.name,
        country: tenant.country,
        institution_type: tenant.institution_type || "",
      });
    }
    setIsEditing(false);
  }

  async function handleSave() {
    try {
      await updateTenant.mutateAsync({
        name: form.name,
        country: form.country,
        institution_type: form.institution_type || undefined,
      });
      setIsEditing(false);
      setSuccess(true);
    } catch {
      // error is on updateTenant.error
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="error">{(error as { detail?: string }).detail || "Failed to load settings."}</Alert>;
  }

  return (
    <div className="space-y-6">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Back to Admin
      </Link>

      <PageHeader
        title="Institution Settings"
        description="View and manage your institution profile."
        actions={
          !isEditing ? (
            <button className="btn-primary" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={updateTenant.isPending}
              >
                {updateTenant.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          )
        }
      />

      {success && <Alert variant="success">Settings updated successfully.</Alert>}
      {updateTenant.error && (
        <Alert variant="error">
          {(updateTenant.error as { detail?: string }).detail || "Failed to save settings."}
        </Alert>
      )}

      {/* Read-only info */}
      <div className="card">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Account Info</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-slate-500">Slug</dt>
            <dd className="mt-1 font-medium text-slate-900">{tenant?.slug}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Subscription Tier</dt>
            <dd className="mt-1">
              <Badge variant="brand">{tenant?.subscription_tier || "standard"}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Created</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {tenant?.created_at
                ? new Date(tenant.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Editable fields */}
      <div className="card">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Institution Details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Name</label>
            {isEditing ? (
              <input
                className="input-field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            ) : (
              <p className="mt-1 font-medium text-slate-900">{tenant?.name}</p>
            )}
          </div>
          <div>
            <label className="label">Country</label>
            {isEditing ? (
              <input
                className="input-field"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            ) : (
              <p className="mt-1 font-medium text-slate-900">{tenant?.country}</p>
            )}
          </div>
          <div>
            <label className="label">Institution Type</label>
            {isEditing ? (
              <input
                className="input-field"
                value={form.institution_type}
                onChange={(e) => setForm({ ...form, institution_type: e.target.value })}
                placeholder="e.g. University, College"
              />
            ) : (
              <p className="mt-1 font-medium text-slate-900">
                {tenant?.institution_type || "—"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
