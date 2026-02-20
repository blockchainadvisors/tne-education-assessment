"use client";

import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";

const variants = {
  error: {
    container: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
    icon: AlertCircle,
    iconColor: "text-red-500",
  },
  success: {
    container: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
  },
  warning: {
    container: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
  },
  info: {
    container: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
    icon: Info,
    iconColor: "text-blue-500",
  },
};

interface AlertProps {
  variant: keyof typeof variants;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ variant, children, className = "" }: AlertProps) {
  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${config.container} ${className}`}
      role="alert"
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.iconColor}`} />
      <div>{children}</div>
    </div>
  );
}
