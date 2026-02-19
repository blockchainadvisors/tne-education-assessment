import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      {Icon && (
        <div className="rounded-full bg-slate-100 p-4">
          <Icon className="h-8 w-8 text-slate-400" />
        </div>
      )}
      <h3 className={`${Icon ? "mt-4" : ""} text-lg font-semibold text-slate-900`}>
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-slate-600">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
