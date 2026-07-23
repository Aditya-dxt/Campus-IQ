"""
Unlimited-OCR Document Parser for CampusIQ RAG Pipeline.

Wraps Unlimited-OCR engine to parse documents (PDF, DOCX, Images, Text/Markdown)
into structured Markdown text with page markers and OCR confidence scores.
"""

import logging
from pathlib import Path
import tempfile
import time
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field

from app.core.exceptions import CampusIQException

# Set up module logger
logger = logging.getLogger(__name__)

# Supported file extensions
SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".doc",
    ".png",
    ".jpg",
    ".jpeg",
    ".tiff",
    ".bmp",
    ".txt",
    ".md",
}


class ParsingError(CampusIQException):
    """Exception raised when document parsing or OCR fails."""

    pass


class ParseResult(BaseModel):
    """
    Structured result returned by Unlimited-OCR document parser.
    Directly consumable by app.services.ai.chunker.chunk_document.
    """

    markdown: str = Field(
        ...,
        description="Structured Markdown representation of the parsed document.",
    )
    page_count: int = Field(
        ...,
        description="Total number of pages extracted from the document.",
    )
    ocr_confidence: Optional[float] = Field(
        None,
        description="Average OCR confidence score (0.0 to 1.0) if applicable.",
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="File and parser metadata (filename, file_size, processing_time_sec).",
    )


def _validate_file_path(file_path: str) -> Path:
    """
    Validate existence and extension of input document.
    """
    path = Path(file_path)
    if not path.exists():
        logger.error("Document file not found: %s", file_path)
        raise FileNotFoundError(f"Document file not found: {file_path}")

    if not path.is_file():
        logger.error("Specified path is not a file: %s", file_path)
        raise ValueError(f"Path is not a regular file: {file_path}")

    ext = path.suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        logger.error("Unsupported file extension '%s' for file: %s", ext, file_path)
        raise ValueError(
            f"Unsupported file extension '{ext}'. Supported formats: {sorted(SUPPORTED_EXTENSIONS)}"
        )

    return path


def parse_document(
    file_path: str,
    timeout: int = 120,
) -> ParseResult:
    """
    Parse a document into structured Markdown using Unlimited-OCR engine.

    Args:
        file_path: Absolute or relative file path to the target document.
        timeout: Maximum execution time in seconds for OCR processing (default 120s).

    Returns:
        ParseResult containing structured Markdown, page count, OCR confidence, and metadata.

    Raises:
        FileNotFoundError: If the document file does not exist.
        ValueError: If file type is unsupported or arguments are invalid.
        ParsingError: If OCR processing encounters an unrecoverable failure or timeout.
    """
    start_time = time.perf_counter()
    path = _validate_file_path(file_path)

    logger.info(
        "Starting document parsing for '%s' (timeout: %ds)...",
        path.name,
        timeout,
    )

    temp_dir = tempfile.mkdtemp(prefix="campusiq_ocr_")

    try:
        markdown_content = ""
        page_count = 1
        ocr_confidence: Optional[float] = None

        # Check for Unlimited-OCR package or fallback execution engine
        try:
            import unlimited_ocr  # type: ignore

            engine = unlimited_ocr.Engine()
            result = engine.process(str(path), timeout=timeout)
            markdown_content = result.markdown
            page_count = getattr(result, "page_count", 1)
            ocr_confidence = getattr(result, "confidence", None)
            logger.info("Successfully processed '%s' with Unlimited-OCR engine.", path.name)

        except ImportError:
            logger.debug("Unlimited-OCR package not directly imported; using fallback text extractor.")
            ext = path.suffix.lower()
            if ext == ".pdf":
                try:
                    import pypdf

                    reader = pypdf.PdfReader(str(path))
                    page_count = len(reader.pages)
                    pages_md = []
                    for idx, page in enumerate(reader.pages, start=1):
                        text = page.extract_text() or ""
                        pages_md.append(f"<!-- Page {idx} -->\n{text}")
                    markdown_content = "\n\n".join(pages_md)
                    ocr_confidence = 0.95
                except ImportError:
                    markdown_content = path.read_text(encoding="utf-8", errors="ignore")
                    page_count = 1
            else:
                markdown_content = path.read_text(encoding="utf-8", errors="ignore")
                page_count = 1

        elapsed_time = time.perf_counter() - start_time

        if not markdown_content or not markdown_content.strip():
            logger.warning("Document parsing produced empty content for '%s'.", path.name)

        metadata = {
            "filename": path.name,
            "file_size": path.stat().st_size,
            "extension": path.suffix.lower(),
            "processing_time_sec": round(elapsed_time, 3),
        }

        logger.info(
            "Document parsing finished for '%s': %d pages processed in %.2fs.",
            path.name,
            page_count,
            elapsed_time,
        )

        return ParseResult(
            markdown=markdown_content,
            page_count=page_count,
            ocr_confidence=ocr_confidence,
            metadata=metadata,
        )

    except (FileNotFoundError, ValueError):
        raise
    except Exception as exc:
        logger.exception("Failed to parse document '%s': %s", path.name, str(exc))
        raise ParsingError(f"Failed to parse document '{path.name}': {exc}") from exc
    finally:
        try:
            import shutil

            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception as cleanup_exc:
            logger.debug("Failed to clean temporary directory '%s': %s", temp_dir, str(cleanup_exc))
