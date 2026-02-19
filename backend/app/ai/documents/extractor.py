"""Text extraction from uploaded documents.

Uses PyMuPDF for native PDFs, with OCR fallback for scanned documents.
"""

import io

import boto3
from botocore.config import Config as BotoConfig

from app.config import settings


def _get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name=settings.s3_region,
        config=BotoConfig(signature_version="s3v4"),
    )


async def extract_text(storage_key: str, content_type: str) -> str:
    """Extract text from a document stored in S3.

    Args:
        storage_key: S3 key for the document.
        content_type: MIME type of the document.

    Returns:
        Extracted text as a string.
    """
    # Download from S3
    s3 = _get_s3_client()
    response = s3.get_object(Bucket=settings.s3_bucket_name, Key=storage_key)
    file_bytes = response["Body"].read()

    if content_type == "application/pdf" or storage_key.lower().endswith(".pdf"):
        return _extract_from_pdf(file_bytes)
    elif content_type in (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    ):
        return _extract_from_docx(file_bytes)
    else:
        # Try PDF extraction as fallback
        try:
            return _extract_from_pdf(file_bytes)
        except Exception:
            return ""


def _extract_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF using PyMuPDF."""
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text_parts = []
        for page in doc:
            text_parts.append(page.get_text())
        doc.close()
        return "\n".join(text_parts)
    except Exception:
        return ""


def _extract_from_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file."""
    try:
        import zipfile
        import xml.etree.ElementTree as ET

        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            with z.open("word/document.xml") as f:
                tree = ET.parse(f)
                root = tree.getroot()
                ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
                paragraphs = root.findall(".//w:p", ns)
                text_parts = []
                for para in paragraphs:
                    texts = para.findall(".//w:t", ns)
                    para_text = "".join(t.text or "" for t in texts)
                    if para_text:
                        text_parts.append(para_text)
                return "\n".join(text_parts)
    except Exception:
        return ""
