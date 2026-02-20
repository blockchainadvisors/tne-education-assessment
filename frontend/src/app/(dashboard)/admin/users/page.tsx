"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus, X, Check } from "lucide-react";
import { PageHeader, Alert, Badge, Spinner, EmptyState } from "@/components/ui";
import { useUsers, useCreateUser, useUpdateUser } from "@/hooks/useAdminData";
import type { User, UserRole } from "@/lib/types";

const ROLE_BADGE: Record<UserRole, { label: string; variant: string }> = {
  platform_admin: { label: "Platform Admin", variant: "purple" },
  tenant_admin: { label: "Tenant Admin", variant: "brand" },
  assessor: { label: "Assessor", variant: "info" },
  reviewer: { label: "Reviewer", variant: "warning" },
  institution_user: { label: "User", variant: "default" },
};

const ASSIGNABLE_ROLES: UserRole[] = [
  "tenant_admin",
  "assessor",
  "reviewer",
  "institution_user",
];

interface InviteForm {
  email: string;
  full_name: string;
  password: string;
  role: UserRole;
}

const emptyInvite: InviteForm = {
  email: "",
  full_name: "",
  password: "",
  role: "institution_user",
};

export default function UsersPage() {
  const { data: users, isLoading, error } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState<InviteForm>(emptyInvite);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ role: UserRole; is_active: boolean }>({
    role: "institution_user",
    is_active: true,
  });
  const [success, setSuccess] = useState("");

  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleInvite() {
    try {
      await createUser.mutateAsync(invite);
      setShowInvite(false);
      setInvite(emptyInvite);
      createUser.reset();
      showSuccess("User created successfully.");
    } catch {
      // error on createUser.error
    }
  }

  function startEdit(user: User) {
    setEditingId(user.id);
    setEditForm({ role: user.role, is_active: user.is_active });
  }

  async function saveEdit(userId: string) {
    try {
      await updateUser.mutateAsync({ id: userId, data: editForm });
      setEditingId(null);
      updateUser.reset();
      showSuccess("User updated successfully.");
    } catch {
      // error on updateUser.error
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
    return <Alert variant="error">{(error as { detail?: string }).detail || "Failed to load users."}</Alert>;
  }

  return (
    <div className="space-y-6">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Back to Admin
      </Link>

      <PageHeader
        title="User Management"
        description="Manage team members, roles, and permissions."
        actions={
          <button className="btn-primary" onClick={() => { setShowInvite(!showInvite); createUser.reset(); }}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            Invite User
          </button>
        }
      />

      {success && <Alert variant="success">{success}</Alert>}
      {updateUser.error && (
        <Alert variant="error">
          {(updateUser.error as { detail?: string }).detail || "Failed to update user."}
        </Alert>
      )}

      {/* Invite form */}
      {showInvite && (
        <div className="card">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Invite New User</h3>
            <button className="btn-ghost btn-sm" onClick={() => { setShowInvite(false); createUser.reset(); }}>
              <X className="h-4 w-4" />
            </button>
          </div>
          {createUser.error && (
            <Alert variant="error" className="mt-3">
              {(createUser.error as { detail?: string }).detail || "Failed to create user."}
            </Alert>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Full Name</label>
              <input
                className="input-field"
                value={invite.full_name}
                onChange={(e) => setInvite({ ...invite, full_name: e.target.value })}
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input-field"
                type="email"
                value={invite.email}
                onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input-field"
                type="password"
                value={invite.password}
                onChange={(e) => setInvite({ ...invite, password: e.target.value })}
                placeholder="Temporary password"
              />
            </div>
            <div>
              <label className="label">Role</label>
              <select
                className="input-field"
                value={invite.role}
                onChange={(e) => setInvite({ ...invite, role: e.target.value as UserRole })}
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_BADGE[r].label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              className="btn-primary"
              onClick={handleInvite}
              disabled={createUser.isPending || !invite.email || !invite.full_name || !invite.password}
            >
              {createUser.isPending ? "Creating…" : "Create User"}
            </button>
          </div>
        </div>
      )}

      {/* Users table */}
      {!users?.length ? (
        <EmptyState
          title="No users"
          description="Invite your first team member to get started."
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => {
                const isRow = editingId === user.id;
                const badge = ROLE_BADGE[user.role];
                return (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{user.full_name}</td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      {isRow ? (
                        <select
                          className="input-field py-1 text-xs"
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                        >
                          {ASSIGNABLE_ROLES.map((r) => (
                            <option key={r} value={r}>{ROLE_BADGE[r].label}</option>
                          ))}
                        </select>
                      ) : (
                        <Badge variant={badge.variant as "default" | "brand" | "info" | "warning" | "purple"}>
                          {badge.label}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isRow ? (
                        <select
                          className="input-field py-1 text-xs"
                          value={editForm.is_active ? "active" : "inactive"}
                          onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === "active" })}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      ) : (
                        <Badge variant={user.is_active ? "success" : "default"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {user.last_login
                        ? new Date(user.last_login).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Never"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isRow ? (
                        <div className="flex justify-end gap-1">
                          <button
                            className="btn-ghost btn-sm"
                            onClick={() => setEditingId(null)}
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            className="btn-primary btn-sm"
                            onClick={() => saveEdit(user.id)}
                            disabled={updateUser.isPending}
                            title="Save"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-ghost btn-sm text-brand-600"
                          onClick={() => startEdit(user)}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
