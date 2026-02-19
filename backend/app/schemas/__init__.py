from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, RefreshRequest
from app.schemas.tenant import (
    TenantCreate,
    TenantUpdate,
    TenantResponse,
    PartnerCreate,
    PartnerUpdate,
    PartnerResponse,
)
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.assessment import (
    AssessmentTemplateResponse,
    ThemeResponse,
    ItemResponse,
    AssessmentCreate,
    AssessmentOut,
    AssessmentListResponse,
    ResponseSave,
    ResponseOut,
    BulkResponseSave,
)
from app.schemas.file import FileUploadResponse
from app.schemas.scoring import ThemeScoreResponse, AssessmentScoresResponse
from app.schemas.report import ReportResponse
from app.schemas.benchmark import (
    BenchmarkCompareRequest,
    BenchmarkMetric,
    BenchmarkCompareResponse,
)
from app.schemas.ai_job import AIJobResponse

__all__ = [
    # Auth
    "LoginRequest",
    "RegisterRequest",
    "TokenResponse",
    "RefreshRequest",
    # Tenant
    "TenantCreate",
    "TenantUpdate",
    "TenantResponse",
    "PartnerCreate",
    "PartnerUpdate",
    "PartnerResponse",
    # User
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    # Assessment
    "AssessmentTemplateResponse",
    "ThemeResponse",
    "ItemResponse",
    "AssessmentCreate",
    "AssessmentOut",
    "AssessmentListResponse",
    "ResponseSave",
    "ResponseOut",
    "BulkResponseSave",
    # File
    "FileUploadResponse",
    # Scoring
    "ThemeScoreResponse",
    "AssessmentScoresResponse",
    # Report
    "ReportResponse",
    # Benchmark
    "BenchmarkCompareRequest",
    "BenchmarkMetric",
    "BenchmarkCompareResponse",
    # AI Job
    "AIJobResponse",
]
