import { Badge } from "./Badge";

const statusConfig: Record<string, { variant: string; label: string }> = {
  draft: { variant: "default", label: "Draft" },
  in_progress: { variant: "warning", label: "In Progress" },
  submitted: { variant: "info", label: "Submitted" },
  under_review: { variant: "purple", label: "Under Review" },
  scored: { variant: "success", label: "Scored" },
  published: { variant: "brand", label: "Published" },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <Badge variant={config.variant as any}>
      {config.label}
    </Badge>
  );
}
