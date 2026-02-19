"""File upload and document intelligence endpoints."""

import uuid

import boto3
from botocore.config import Config as BotoConfig
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user, get_tenant
from app.models.assessment import Assessment
from app.models.file_upload import FileUpload
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.file import FileUploadResponse

router = APIRouter(prefix="/assessments/{assessment_id}/files")


def _get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name=settings.s3_region,
        config=BotoConfig(signature_version="s3v4"),
    )


@router.post("", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    assessment_id: uuid.UUID,
    file: UploadFile,
    response_id: uuid.UUID | None = None,
    tenant: Tenant = Depends(get_tenant),
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a file for an assessment."""
    # Verify assessment belongs to tenant
    result = await db.execute(
        select(Assessment).where(
            Assessment.id == assessment_id, Assessment.tenant_id == tenant.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    # Generate storage key with tenant isolation
    file_id = uuid.uuid4()
    storage_key = f"{tenant.id}/{assessment_id}/{file_id}/{file.filename}"

    # Upload to S3/MinIO
    s3 = _get_s3_client()
    content = await file.read()
    s3.put_object(
        Bucket=settings.s3_bucket_name,
        Key=storage_key,
        Body=content,
        ContentType=file.content_type or "application/octet-stream",
    )

    # Create database record
    upload = FileUpload(
        tenant_id=tenant.id,
        assessment_id=assessment_id,
        response_id=response_id,
        original_filename=file.filename or "unknown",
        storage_key=storage_key,
        content_type=file.content_type or "application/octet-stream",
        file_size=len(content),
    )
    db.add(upload)
    await db.flush()

    # TODO: Phase 2 - trigger document intelligence pipeline via Celery

    return upload


@router.get("", response_model=list[FileUploadResponse])
async def list_files(
    assessment_id: uuid.UUID,
    tenant: Tenant = Depends(get_tenant),
    db: AsyncSession = Depends(get_db),
):
    """List all files for an assessment."""
    result = await db.execute(
        select(FileUpload).where(
            FileUpload.assessment_id == assessment_id,
            FileUpload.tenant_id == tenant.id,
        )
    )
    return result.scalars().all()


@router.get("/{file_id}", response_model=FileUploadResponse)
async def get_file_info(
    assessment_id: uuid.UUID,
    file_id: uuid.UUID,
    tenant: Tenant = Depends(get_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Get file metadata and extraction results."""
    result = await db.execute(
        select(FileUpload).where(
            FileUpload.id == file_id,
            FileUpload.tenant_id == tenant.id,
        )
    )
    upload = result.scalar_one_or_none()
    if not upload:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    return upload


@router.get("/{file_id}/download")
async def download_file(
    assessment_id: uuid.UUID,
    file_id: uuid.UUID,
    tenant: Tenant = Depends(get_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Generate a pre-signed download URL for a file."""
    result = await db.execute(
        select(FileUpload).where(
            FileUpload.id == file_id,
            FileUpload.tenant_id == tenant.id,
        )
    )
    upload = result.scalar_one_or_none()
    if not upload:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    s3 = _get_s3_client()
    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket_name, "Key": upload.storage_key},
        ExpiresIn=3600,
    )
    return {"download_url": url}
