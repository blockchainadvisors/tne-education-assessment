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

export interface MessageResponse {
  message: string;
}

// --- Tenant ---

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  country: string;
  institution_type?: string;
  subscription_tier?: string;
  settings?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// --- User ---

export type UserRole = "platform_admin" | "tenant_admin" | "assessor" | "reviewer" | "institution_user";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  tenant_id: string;
  tenant?: Tenant;
  is_active: boolean;
  email_verified?: boolean;
  last_login?: string;
  created_at: string;
  updated_at?: string;
}

// --- Partner ---

export interface Partner {
  id: string;
  tenant_id: string;
  name: string;
  country: string;
  position: number;
  is_active: boolean;
  created_at: string;
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
  field_type: FieldType | string;
  options?: ItemOption[];
  validation?: ItemValidation;
  currencies?: string[];
}

export interface Item {
  id: string;
  theme_id?: string;
  code: string;
  label: string;
  description?: string;
  help_text?: string;
  field_type: FieldType;
  field_config?: Record<string, unknown>;
  options?: ItemOption[];
  validation?: ItemValidation;
  sub_fields?: SubField[];
  calculation_formula?: string;
  depends_on?: string | string[];
  order: number;
  display_order?: number;
  is_required?: boolean;
  is_scoreable: boolean;
  weight?: number;
  max_score?: number;
  scoring_criteria?: Record<string, unknown>;
  scoring_rubric?: Record<string, unknown>;
}

export interface Theme {
  id: string;
  template_id?: string;
  name: string;
  code: string;
  slug?: string;
  description?: string;
  weight?: number;
  order: number;
  display_order?: number;
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
  created_at?: string;
}

// --- Assessment ---

export type AssessmentStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "scored"
  | "report_generated";

export interface Assessment {
  id: string;
  tenant_id: string;
  template_id: string;
  template?: AssessmentTemplate;
  academic_year: string;
  status: AssessmentStatus;
  overall_score?: number | null;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssessmentResponse {
  id: string;
  assessment_id: string;
  item_id: string;
  partner_id?: string | null;
  value: unknown;
  ai_score?: number | null;
  ai_feedback?: string | null;
  created_at?: string;
  updated_at: string;
}

// --- File Upload ---

export interface FileUpload {
  id: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  document_type?: string | null;
  extraction_status?: string;
  extracted_data?: Record<string, unknown> | null;
  created_at: string;
}

// --- Scoring ---

export interface ItemScore {
  item_code: string;
  item_label: string;
  field_type: string;
  ai_score: number | null;
  ai_feedback: string | null;
}

export interface ThemeScore {
  theme_id: string;
  theme_name: string;
  theme_code: string;
  normalised_score?: number | null;
  weighted_score?: number | null;
  score: number | null;
  max_score: number;
  percentage: number;
  ai_analysis?: string | null;
  item_scores: ItemScore[];
}

export interface AssessmentScores {
  assessment_id: string;
  overall_score: number | null;
  overall_max_score: number;
  overall_percentage: number;
  theme_scores: ThemeScore[];
  scored_at?: string | null;
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
  version: number;
  report_type: string;
  title: string;
  executive_summary?: string | null;
  theme_analyses?: Record<string, unknown> | null;
  improvement_recommendations?: unknown;
  sections: ReportSection[];
  generated_at: string;
  generated_by: string;
  pdf_storage_key?: string | null;
}

// --- Benchmarks ---

export interface BenchmarkMetric {
  metric_name: string;
  percentile_10?: number | null;
  percentile_25?: number | null;
  percentile_50?: number | null;
  percentile_75?: number | null;
  percentile_90?: number | null;
  sample_size: number;
  institution_value?: number | null;
}

export interface BenchmarkComparison {
  academic_year: string;
  country?: string | null;
  metrics: BenchmarkMetric[];
}

// --- AI Jobs ---

export type AIJobStatus = "queued" | "processing" | "completed" | "failed";
export type AIJobType = "scoring" | "report_generation" | "document_extraction" | "risk_prediction";

export interface AIJob {
  id: string;
  assessment_id: string;
  job_type: AIJobType;
  status: AIJobStatus;
  progress: number;
  result_data?: Record<string, unknown> | null;
  error_message?: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
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
