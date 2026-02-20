"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X, Check, Trash2 } from "lucide-react";
import { PageHeader, Alert, Spinner, EmptyState, ConfirmDialog } from "@/components/ui";
import {
  usePartners,
  useCreatePartner,
  useUpdatePartner,
  useDeletePartner,
} from "@/hooks/useAdminData";
import type { Partner } from "@/lib/types";

const MAX_PARTNERS = 5;

interface PartnerForm {
  name: string;
  country: string;
}

const emptyForm: PartnerForm = { name: "", country: "" };

export default function PartnersPage() {
  const { data: partners, isLoading, error } = usePartners();
  const createPartner = useCreatePartner();
  const updatePartner = useUpdatePartner();
  const deletePartner = useDeletePartner();

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<PartnerForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PartnerForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
  const [success, setSuccess] = useState("");

  const count = partners?.length ?? 0;
  const atLimit = count >= MAX_PARTNERS;

  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleAdd() {
    try {
      await createPartner.mutateAsync({
        name: addForm.name,
        country: addForm.country,
        position: count + 1,
      });
      setShowAdd(false);
      setAddForm(emptyForm);
      createPartner.reset();
      showSuccess("Partner added successfully.");
    } catch {
      // error on createPartner.error
    }
  }

  function startEdit(partner: Partner) {
    setEditingId(partner.id);
    setEditForm({ name: partner.name, country: partner.country });
  }

  async function saveEdit(partnerId: string) {
    try {
      await updatePartner.mutateAsync({ id: partnerId, data: editForm });
      setEditingId(null);
      updatePartner.reset();
      showSuccess("Partner updated successfully.");
    } catch {
      // error on updatePartner.error
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deletePartner.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      deletePartner.reset();
      showSuccess("Partner removed.");
    } catch {
      // error on deletePartner.error
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
    return <Alert variant="error">{(error as { detail?: string }).detail || "Failed to load partners."}</Alert>;
  }

  return (
    <div className="space-y-6">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Back to Admin
      </Link>

      <PageHeader
        title="Partner Institutions"
        description={`Manage your TNE partner institutions. ${count}/${MAX_PARTNERS} partners.`}
        actions={
          <button
            className="btn-primary"
            onClick={() => { setShowAdd(!showAdd); createPartner.reset(); }}
            disabled={atLimit}
            title={atLimit ? "Maximum 5 partners" : undefined}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Partner
          </button>
        }
      />

      {success && <Alert variant="success">{success}</Alert>}
      {deletePartner.error && (
        <Alert variant="error">
          {(deletePartner.error as { detail?: string }).detail || "Failed to delete partner."}
        </Alert>
      )}
      {updatePartner.error && (
        <Alert variant="error">
          {(updatePartner.error as { detail?: string }).detail || "Failed to update partner."}
        </Alert>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="card">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">New Partner</h3>
            <button className="btn-ghost btn-sm" onClick={() => { setShowAdd(false); createPartner.reset(); }}>
              <X className="h-4 w-4" />
            </button>
          </div>
          {createPartner.error && (
            <Alert variant="error" className="mt-3">
              {(createPartner.error as { detail?: string }).detail || "Failed to add partner."}
            </Alert>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Institution Name</label>
              <input
                className="input-field"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="Partner University"
              />
            </div>
            <div>
              <label className="label">Country</label>
              <input
                className="input-field"
                value={addForm.country}
                onChange={(e) => setAddForm({ ...addForm, country: e.target.value })}
                placeholder="e.g. Malaysia"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              className="btn-primary"
              onClick={handleAdd}
              disabled={createPartner.isPending || !addForm.name || !addForm.country}
            >
              {createPartner.isPending ? "Adding…" : "Add Partner"}
            </button>
          </div>
        </div>
      )}

      {/* Partners table */}
      {!count ? (
        <EmptyState
          title="No partners"
          description="Add your first TNE partner institution."
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="w-12 px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {partners
                ?.slice()
                .sort((a, b) => a.position - b.position)
                .map((partner) => {
                  const isRow = editingId === partner.id;
                  return (
                    <tr key={partner.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{partner.position}</td>
                      <td className="px-4 py-3">
                        {isRow ? (
                          <input
                            className="input-field py-1 text-sm"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        ) : (
                          <span className="font-medium text-slate-900">{partner.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isRow ? (
                          <input
                            className="input-field py-1 text-sm"
                            value={editForm.country}
                            onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                          />
                        ) : (
                          <span className="text-slate-600">{partner.country}</span>
                        )}
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
                              onClick={() => saveEdit(partner.id)}
                              disabled={updatePartner.isPending}
                              title="Save"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <button
                              className="btn-ghost btn-sm text-brand-600"
                              onClick={() => startEdit(partner)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-ghost btn-sm text-red-600"
                              onClick={() => setDeleteTarget(partner)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Remove Partner"
        description={`Are you sure you want to remove "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel={deletePartner.isPending ? "Removing…" : "Remove"}
        variant="danger"
      />
    </div>
  );
}
