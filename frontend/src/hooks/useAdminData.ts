"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Tenant, User, Partner, UserRole } from "@/lib/types";

// --- Mutation request types (backend accepts these) ---

interface TenantUpdateData {
  name?: string;
  country?: string;
  institution_type?: string;
  settings?: Record<string, unknown>;
}

interface UserCreateData {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}

interface UserUpdateData {
  email?: string;
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
}

interface PartnerCreateData {
  name: string;
  country: string;
  position?: number;
}

interface PartnerUpdateData {
  name?: string;
  country?: string;
  position?: number;
}

// --- Query keys ---

const adminKeys = {
  tenant: ["admin", "tenant"] as const,
  users: ["admin", "users"] as const,
  partners: ["admin", "partners"] as const,
};

// --- Tenant hooks ---

export function useTenant() {
  return useQuery({
    queryKey: adminKeys.tenant,
    queryFn: () => apiClient.get<Tenant>("/tenants/current"),
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TenantUpdateData) =>
      apiClient.put<Tenant>("/tenants/current", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.tenant });
    },
  });
}

// --- User hooks ---

export function useUsers() {
  return useQuery({
    queryKey: adminKeys.users,
    queryFn: () => apiClient.get<User[]>("/users"),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UserCreateData) =>
      apiClient.post<User>("/users", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.users });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdateData }) =>
      apiClient.put<User>(`/users/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.users });
    },
  });
}

// --- Partner hooks ---

export function usePartners() {
  return useQuery({
    queryKey: adminKeys.partners,
    queryFn: () => apiClient.get<Partner[]>("/tenants/current/partners"),
  });
}

export function useCreatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PartnerCreateData) =>
      apiClient.post<Partner>("/tenants/current/partners", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.partners });
    },
  });
}

export function useUpdatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PartnerUpdateData }) =>
      apiClient.put<Partner>(`/tenants/current/partners/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.partners });
    },
  });
}

export function useDeletePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/tenants/current/partners/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.partners });
    },
  });
}
