from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, tenants, users, assessments, responses, files, scoring, reports, benchmarks, admin
from app.config import settings

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 routers
prefix = settings.api_v1_prefix
app.include_router(auth.router, prefix=prefix, tags=["auth"])
app.include_router(tenants.router, prefix=prefix, tags=["tenants"])
app.include_router(users.router, prefix=prefix, tags=["users"])
app.include_router(assessments.router, prefix=prefix, tags=["assessments"])
app.include_router(responses.router, prefix=prefix, tags=["responses"])
app.include_router(files.router, prefix=prefix, tags=["files"])
app.include_router(scoring.router, prefix=prefix, tags=["scoring"])
app.include_router(reports.router, prefix=prefix, tags=["reports"])
app.include_router(benchmarks.router, prefix=prefix, tags=["benchmarks"])
app.include_router(admin.router, prefix=prefix, tags=["admin"])


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
