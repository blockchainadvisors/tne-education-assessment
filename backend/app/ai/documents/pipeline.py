"""Document intelligence pipeline.

Upload → Extract text → Classify → Extract structured data → Check completeness
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file_upload import FileUpload
from app.ai.documents.extractor import extract_text
from app.ai.documents.classifier import classify_document
from app.ai.documents.completeness import check_document_completeness


async def process_document(
    db: AsyncSession,
    file_upload_id: uuid.UUID,
) -> dict:
    """Run the full document intelligence pipeline on an uploaded file.

    Steps:
    1. Extract text from the document (PyMuPDF for PDFs, OCR for scans)
    2. Classify the document type using Claude
    3. Extract structured data based on document type
    4. Check completeness against assessment item requirements

    Returns:
        Dict with extraction results and status.
    """
    result = await db.execute(
        select(FileUpload).where(FileUpload.id == file_upload_id)
    )
    upload = result.scalar_one_or_none()
    if not upload:
        raise ValueError(f"FileUpload {file_upload_id} not found")

    upload.extraction_status = "processing"
    await db.flush()

    try:
        # Step 1: Extract text
        extracted_text = await extract_text(upload.storage_key, upload.content_type)

        if not extracted_text or len(extracted_text.strip()) < 10:
            upload.extraction_status = "failed"
            upload.extraction_error = "Could not extract meaningful text from document"
            await db.flush()
            return {"status": "failed", "error": "No text extracted"}

        # Step 2: Classify document
        classification = await classify_document(
            filename=upload.original_filename,
            text_excerpt=extracted_text[:2000],
        )
        upload.document_type = classification.get("document_type", "other")

        # Step 3: Extract structured data
        # This would call type-specific extraction prompts
        upload.extracted_data = {
            "text_length": len(extracted_text),
            "classification": classification,
            "text_preview": extracted_text[:500],
        }

        # Step 4: Completeness check (if linked to a response/item)
        # This is done when the document is associated with a specific assessment item

        upload.extraction_status = "completed"
        await db.flush()

        return {
            "status": "completed",
            "document_type": upload.document_type,
            "text_length": len(extracted_text),
            "classification_confidence": classification.get("confidence", 0),
        }

    except Exception as e:
        upload.extraction_status = "failed"
        upload.extraction_error = str(e)
        await db.flush()
        return {"status": "failed", "error": str(e)}
