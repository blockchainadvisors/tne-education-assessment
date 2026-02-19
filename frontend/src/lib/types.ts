// ============================================================
// TNE Assessment Platform - TypeScript Type Definitions
// Mirrors backend Pydantic schemas
// ============================================================

// --- Auth ---

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  tenant_name: string;
  tenant_slug: string;
  country: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// --- Tenant ---

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  country: string;
  institution_type?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- User ---

export type UserRole = "super_admin" | "tenant_admin" | "assessor" | "reviewer" | "viewer";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  tenant_id: string;
  tenant?: Tenant;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- Partner ---

export interface Partner {
  id: string;
  tenant_id: string;
  name: string;
  country: string;
  institution_type?: string;
  partnership_start_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- Assessment Template ---

export type FieldType =
  | "short_text"
  | "long_text"
  | "numeric"
  | "percentage"
  | "yes_no_conditional"
  | "dropdown"
  | "multi_select"
  | "file_upload"
  | "multi_year_gender"
  | "partner_specific"
  | "auto_calculated"
  | "salary_bands";

export interface ItemOption {
  label: string;
  value: string;
}

export interface ItemValidation {
  required?: boolean;
  min_value?: number;
  max_value?: number;
  min_length?: number;
  max_length?: number;
  pattern?: string;
  allowed_file_types?: string[];
  max_file_size_mb?: number;
}

export interface SubField {
  key: string;
  label: string;
  field_type: FieldType;
  options?: ItemOption[];
  validation?: ItemValidation;
}

export interface Item {
  id: string;
  theme_id: string;
  code: string;
  label: string;
  description?: string;
  help_text?: string;
  field_type: FieldType;
  options?: ItemOption[];
  validation?: ItemValidation;
  sub_fields?: SubField[];
  calculation_formula?: string;
  depends_on?: string[];
  order: number;
  is_scoreable: boolean;
  max_score?: number;
  scoring_criteria?: Record<string, number>;
}

export interface Theme {
  id: string;
  template_id: string;
  name: string;
  code: string;
  description?: string;
  order: number;
  max_score?: number;
  items: Item[];
}

export interface AssessmentTemplate {
  id: string;
  name: string;
  version: string;
  description?: string;
  is_active: boolean;
  themes: Theme[];
  created_at: string;
  updated_at: string;
}

// --- Assessment ---

export type AssessmentStatus =
  | "draft"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "scored"
  | "published";

export interface Assessment {
  id: string;
  tenant_id: string;
  template_id: string;
  template?: AssessmentTemplate;
  academic_year: string;
  status: AssessmentStatus;
  overall_score?: number;
  submitted_at?: string;
  scored_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AssessmentResponse {
  id: string;
  assessment_id: string;
  item_id: string;
  item_code: string;
  value: unknown;
  is_valid: boolean;
  validation_errors?: string[];
  updated_at: string;
}

// --- File Upload ---

export interface FileUpload {
  id: string;
  assessment_id: string;
  item_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  uploaded_by: string;
  uploaded_at: string;
}

// --- Scoring ---

export interface ThemeScore {
  theme_id: string;
  theme_name: string;
  theme_code: string;
  score: number;
  max_score: number;
  percentage: number;
  item_scores: Record<string, number>;
}

export interface AssessmentScores {
  assessment_id: string;
  overall_score: number;
  overall_max_score: number;
  overall_percentage: number;
  theme_scores: ThemeScore[];
  scored_at: string;
}

// --- Reports ---

export interface ReportSection {
  title: string;
  content: string;
  theme_code?: string;
}

export interface Report {
  id: string;
  assessment_id: string;
  report_type: "self_assessment" | "benchmark" | "improvement_plan";
  title: string;
  sections: ReportSection[];
  generated_at: string;
  generated_by: string;
}

// --- Benchmarks ---

export interface BenchmarkMetric {
  metric_name: string;
  metric_code: string;
  tenant_value: number;
  peer_mean: number;
  peer_median: number;
  peer_min: number;
  peer_max: number;
  percentile_rank: number;
  z_score: number;
}

export interface BenchmarkComparison {
  assessment_id: string;
  peer_group_size: number;
  peer_group_criteria: Record<string, string>;
  metrics: BenchmarkMetric[];
  generated_at: string;
}

// --- AI Jobs ---

export type AIJobStatus = "pending" | "processing" | "completed" | "failed";
export type AIJobType = "score_assessment" | "generate_report" | "generate_benchmark";

export interface AIJob {
  id: string;
  assessment_id: string;
  job_type: AIJobType;
  status: AIJobStatus;
  result?: unknown;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

// --- API Response Wrappers ---

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ApiError {
  detail: string;
  status_code: number;
}
