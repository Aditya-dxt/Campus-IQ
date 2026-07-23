"""
Semantic Markdown Chunker for CampusIQ RAG Pipeline.

Parses structured Markdown (e.g. from Unlimited-OCR) into semantic chunks
optimized for vector embedding generation and retrieval in ChromaDB.
"""

from dataclasses import dataclass
import hashlib
import logging
import re
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.core.exceptions import CampusIQException

# Set up module logger
logger = logging.getLogger(__name__)

# Global singleton tokenizer cache
_TOKENIZER_INSTANCE: Any = None
_TOKENIZER_LOAD_ATTEMPTED: bool = False


class ChunkingError(CampusIQException):
    """Exception raised when semantic document chunking fails."""

    pass


def _get_hf_tokenizer() -> Any:
    """
    Lazy-load and cache the HuggingFace AutoTokenizer for sentence-transformers/all-MiniLM-L6-v2.
    Falls back to None if transformers is not installed or loading fails.
    """
    global _TOKENIZER_INSTANCE, _TOKENIZER_LOAD_ATTEMPTED

    if not _TOKENIZER_LOAD_ATTEMPTED:
        _TOKENIZER_LOAD_ATTEMPTED = True
        try:
            from transformers import AutoTokenizer  # type: ignore

            _TOKENIZER_INSTANCE = AutoTokenizer.from_pretrained(
                "sentence-transformers/all-MiniLM-L6-v2"
            )
            logger.info(
                "Successfully initialized HuggingFace AutoTokenizer for sentence-transformers/all-MiniLM-L6-v2."
            )
        except Exception as exc:
            logger.warning(
                "Could not load HuggingFace tokenizer (%s). Falling back to subword regex token estimation.",
                str(exc),
            )
            _TOKENIZER_INSTANCE = None

    return _TOKENIZER_INSTANCE


def count_tokens(text: str) -> int:
    """
    Calculate exact or estimated token count for a text string.

    Uses sentence-transformers/all-MiniLM-L6-v2 tokenizer when available,
    with a subword/punctuation regex fallback for lightweight execution.

    Args:
        text: The string to tokenize.

    Returns:
        Token count integer.
    """
    if not text or not text.strip():
        return 0

    tokenizer = _get_hf_tokenizer()
    if tokenizer is not None:
        try:
            return len(tokenizer.encode(text, add_special_tokens=False))
        except Exception as exc:
            logger.debug("HuggingFace token encoding failed (%s), falling back to regex.", str(exc))

    tokens = re.findall(r"\w+|[^\w\s]", text)
    return len(tokens)


class DocumentChunk(BaseModel):
    """
    Represents a single semantic chunk of a parsed Markdown document.
    Extends metadata for vector database insertion and retrieval.
    """

    chunk_id: str = Field(
        ...,
        description="Deterministic unique chunk identifier.",
    )
    document_id: Optional[str] = Field(
        None,
        description="Identifier of the source document.",
    )
    chunk_index: int = Field(
        ...,
        description="0-based index of the chunk within the document sequence.",
    )
    heading: Optional[str] = Field(
        None,
        description="Active section heading for this chunk.",
    )
    heading_path: List[str] = Field(
        default_factory=list,
        description="Hierarchical list of ancestor headings.",
    )
    page: Optional[int] = Field(
        None,
        description="Alias for page_start for backward compatibility.",
    )
    page_start: Optional[int] = Field(
        None,
        description="Starting OCR page number for this chunk.",
    )
    page_end: Optional[int] = Field(
        None,
        description="Ending OCR page number for this chunk.",
    )
    ocr_confidence: Optional[float] = Field(
        None,
        description="Average OCR confidence score if available.",
    )
    content: str = Field(
        ...,
        description="Markdown text content of the chunk.",
    )
    token_count: int = Field(
        ...,
        description="Token count of the chunk content.",
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Rich metadata dictionary for indexing and filtering.",
    )


@dataclass
class SemanticBlock:
    """
    Internal representation of an atomic Markdown block (paragraph, table, code, etc.).
    """

    content: str
    block_type: str
    heading: Optional[str]
    heading_path: List[str]
    page_start: Optional[int]
    page_end: Optional[int]
    token_count: int


def _extract_page_number(line: str) -> Optional[int]:
    """
    Extract page number from common OCR markdown page markers.

    Examples:
        <!-- Page 5 -->
        --- Page 3 ---
        [Page 12]
        Page 4
    """
    patterns = [
        r"<!--\s*page\s*(\d+)\s*-->",
        r"[\-\*]{3,}\s*page\s*(\d+)",
        r"\[page\s*(\d+)\]",
        r"^page\s*(\d+)$",
    ]
    for pattern in patterns:
        match = re.search(pattern, line.strip(), re.IGNORECASE)
        if match:
            return int(match.group(1))
    return None


def _split_large_paragraph(
    content: str,
    max_tokens: int,
    heading_path: List[str],
    current_page: Optional[int],
) -> List[SemanticBlock]:
    """
    Recursively split an oversized paragraph into smaller semantic paragraph blocks.
    Enforces maximum token size using sentence and clause boundaries.
    """
    sub_blocks: List[SemanticBlock] = []
    heading = heading_path[-1] if heading_path else None

    # 1. Split into sentence units
    sentences = re.split(r"(?<=[.!?])\s+", content)
    current_sentences: List[str] = []
    current_tokens = 0

    for sentence in sentences:
        s_tokens = count_tokens(sentence)

        # If a single sentence exceeds max_tokens, split by clause boundaries
        if s_tokens > max_tokens:
            if current_sentences:
                para_text = " ".join(current_sentences)
                sub_blocks.append(
                    SemanticBlock(
                        content=para_text,
                        block_type="paragraph",
                        heading=heading,
                        heading_path=list(heading_path),
                        page_start=current_page,
                        page_end=current_page,
                        token_count=count_tokens(para_text),
                    )
                )
                current_sentences = []
                current_tokens = 0

            clauses = re.split(r"(?<=[,;:])\s+", sentence)
            curr_clause_list: List[str] = []
            curr_clause_tokens = 0
            for clause in clauses:
                c_tokens = count_tokens(clause)
                if curr_clause_tokens + c_tokens > max_tokens and curr_clause_list:
                    clause_text = " ".join(curr_clause_list)
                    sub_blocks.append(
                        SemanticBlock(
                            content=clause_text,
                            block_type="paragraph",
                            heading=heading,
                            heading_path=list(heading_path),
                            page_start=current_page,
                            page_end=current_page,
                            token_count=count_tokens(clause_text),
                        )
                    )
                    curr_clause_list = [clause]
                    curr_clause_tokens = c_tokens
                else:
                    curr_clause_list.append(clause)
                    curr_clause_tokens += c_tokens

            if curr_clause_list:
                clause_text = " ".join(curr_clause_list)
                sub_blocks.append(
                    SemanticBlock(
                        content=clause_text,
                        block_type="paragraph",
                        heading=heading,
                        heading_path=list(heading_path),
                        page_start=current_page,
                        page_end=current_page,
                        token_count=count_tokens(clause_text),
                    )
                )
        elif current_tokens + s_tokens > max_tokens and current_sentences:
            para_text = " ".join(current_sentences)
            sub_blocks.append(
                SemanticBlock(
                    content=para_text,
                    block_type="paragraph",
                    heading=heading,
                    heading_path=list(heading_path),
                    page_start=current_page,
                    page_end=current_page,
                    token_count=count_tokens(para_text),
                )
            )
            current_sentences = [sentence]
            current_tokens = s_tokens
        else:
            current_sentences.append(sentence)
            current_tokens += s_tokens

    if current_sentences:
        para_text = " ".join(current_sentences)
        sub_blocks.append(
            SemanticBlock(
                content=para_text,
                block_type="paragraph",
                heading=heading,
                heading_path=list(heading_path),
                page_start=current_page,
                page_end=current_page,
                token_count=count_tokens(para_text),
            )
        )

    return sub_blocks


def parse_markdown_blocks(
    markdown: str, max_tokens: int = 500
) -> List[SemanticBlock]:
    """
    Parse Markdown text into atomic semantic blocks while maintaining heading hierarchy and pages.

    Atomicity Rules:
    - Markdown tables (|...|), code blocks (```/~~~), equations ($$/\\[\\]), and headings remain atomic.
    - Paragraphs larger than max_tokens are recursively split into smaller paragraph blocks.

    Args:
        markdown: Raw or OCR Markdown string.
        max_tokens: Maximum allowed token count per block before splitting paragraphs.

    Returns:
        List of SemanticBlock instances.
    """
    blocks: List[SemanticBlock] = []
    lines = markdown.splitlines()
    total_lines = len(lines)
    i = 0

    heading_stack: List[tuple[int, str]] = []
    current_page: Optional[int] = None

    heading_pattern = re.compile(r"^(#{1,6})\s+(.+)$")
    list_pattern = re.compile(r"^\s*([*\-+]|\d+\.)\s+")

    while i < total_lines:
        line = lines[i]
        stripped = line.strip()

        # 1. Skip empty lines
        if not stripped:
            i += 1
            continue

        # 2. Page Markers
        page_num = _extract_page_number(stripped)
        if page_num is not None:
            current_page = page_num
            if stripped == "\f":
                i += 1
                continue
            if stripped.startswith("<!--"):
                i += 1
                continue

        current_heading_path = [text for _, text in heading_stack]
        current_heading = current_heading_path[-1] if current_heading_path else None

        # 3. Code Blocks (``` or ~~~) - Atomic
        if stripped.startswith("```") or stripped.startswith("~~~"):
            fence = stripped[:3]
            code_lines = [line]
            i += 1
            while i < total_lines:
                code_lines.append(lines[i])
                if lines[i].strip().startswith(fence):
                    i += 1
                    break
                i += 1
            content = "\n".join(code_lines)
            tokens = count_tokens(content)
            blocks.append(
                SemanticBlock(
                    content=content,
                    block_type="code",
                    heading=current_heading,
                    heading_path=list(current_heading_path),
                    page_start=current_page,
                    page_end=current_page,
                    token_count=tokens,
                )
            )
            continue

        # 4. Block Equations ($$ or \[) - Atomic
        if stripped.startswith("$$") or stripped.startswith("\\["):
            is_bracket = stripped.startswith("\\[")
            end_delimiter = "\\]" if is_bracket else "$$"
            math_lines = [line]
            if len(stripped) > 2 and stripped.endswith(end_delimiter):
                i += 1
            else:
                i += 1
                while i < total_lines:
                    math_lines.append(lines[i])
                    if lines[i].strip().endswith(end_delimiter):
                        i += 1
                        break
                    i += 1
            content = "\n".join(math_lines)
            tokens = count_tokens(content)
            blocks.append(
                SemanticBlock(
                    content=content,
                    block_type="equation",
                    heading=current_heading,
                    heading_path=list(current_heading_path),
                    page_start=current_page,
                    page_end=current_page,
                    token_count=tokens,
                )
            )
            continue

        # 5. Headings (# Heading) - Updates Heading Hierarchy
        heading_match = heading_pattern.match(stripped)
        if heading_match:
            level = len(heading_match.group(1))
            heading_text = heading_match.group(2).strip()

            # Maintain heading stack hierarchy
            while heading_stack and heading_stack[-1][0] >= level:
                heading_stack.pop()
            heading_stack.append((level, heading_text))

            new_heading_path = [t for _, t in heading_stack]
            new_heading = new_heading_path[-1]

            content = line
            tokens = count_tokens(content)
            blocks.append(
                SemanticBlock(
                    content=content,
                    block_type="heading",
                    heading=new_heading,
                    heading_path=list(new_heading_path),
                    page_start=current_page,
                    page_end=current_page,
                    token_count=tokens,
                )
            )
            i += 1
            continue

        # 6. Markdown Tables (| col | col |) - Atomic
        if stripped.startswith("|") and "|" in stripped[1:]:
            table_lines = []
            while i < total_lines and lines[i].strip().startswith("|"):
                table_lines.append(lines[i])
                i += 1
            content = "\n".join(table_lines)
            tokens = count_tokens(content)
            blocks.append(
                SemanticBlock(
                    content=content,
                    block_type="table",
                    heading=current_heading,
                    heading_path=list(current_heading_path),
                    page_start=current_page,
                    page_end=current_page,
                    token_count=tokens,
                )
            )
            continue

        # 7. Markdown Lists (- item, 1. item)
        if list_pattern.match(line):
            list_lines = []
            while i < total_lines:
                curr_line = lines[i]
                curr_stripped = curr_line.strip()
                if list_pattern.match(curr_line) or (
                    curr_line.startswith("  ") and curr_stripped
                ):
                    list_lines.append(curr_line)
                    i += 1
                else:
                    break
            content = "\n".join(list_lines)
            tokens = count_tokens(content)
            blocks.append(
                SemanticBlock(
                    content=content,
                    block_type="list",
                    heading=current_heading,
                    heading_path=list(current_heading_path),
                    page_start=current_page,
                    page_end=current_page,
                    token_count=tokens,
                )
            )
            continue

        # 8. Standard Paragraph
        para_lines = []
        while i < total_lines:
            curr_line = lines[i]
            curr_stripped = curr_line.strip()

            if not curr_stripped:
                break
            if _extract_page_number(curr_stripped) is not None:
                break
            if (
                curr_stripped.startswith("```")
                or curr_stripped.startswith("~~~")
            ):
                break
            if curr_stripped.startswith("$$") or curr_stripped.startswith(
                "\\["
            ):
                break
            if heading_pattern.match(curr_stripped):
                break
            if curr_stripped.startswith("|") and "|" in curr_stripped[1:]:
                break
            if list_pattern.match(curr_line):
                break

            para_lines.append(curr_line)
            i += 1

        if para_lines:
            content = "\n".join(para_lines)
            tokens = count_tokens(content)

            # Check if paragraph needs recursive splitting
            if tokens > max_tokens:
                split_blocks = _split_large_paragraph(
                    content=content,
                    max_tokens=max_tokens,
                    heading_path=current_heading_path,
                    current_page=current_page,
                )
                blocks.extend(split_blocks)
            else:
                blocks.append(
                    SemanticBlock(
                        content=content,
                        block_type="paragraph",
                        heading=current_heading,
                        heading_path=list(current_heading_path),
                        page_start=current_page,
                        page_end=current_page,
                        token_count=tokens,
                    )
                )

    return blocks


def _generate_chunk_id(
    document_id: Optional[str], chunk_index: int, markdown_content: str
) -> str:
    """
    Generate a deterministic chunk ID.

    Format:
        If document_id provided: <document_id>_chunk_0001
        If document_id is None: doc_<content_hash>_chunk_0001
    """
    idx_str = f"{chunk_index + 1:04d}"
    if document_id:
        return f"{document_id}_chunk_{idx_str}"

    content_hash = hashlib.md5(markdown_content.encode("utf-8")).hexdigest()[:8]
    return f"doc_{content_hash}_chunk_{idx_str}"


def chunk_document(
    markdown: str,
    document_id: Optional[str] = None,
    ocr_confidence: Optional[float] = None,
    target_tokens: int = 400,
    max_tokens: int = 500,
    overlap_tokens: int = 50,
) -> List[DocumentChunk]:
    """
    Chunk a Markdown document into semantic chunks optimized for vector retrieval in RAG pipelines.

    Args:
        markdown: Raw or OCR-generated Markdown text.
        document_id: Optional unique identifier of the source document.
        ocr_confidence: Optional average confidence score from OCR parser.
        target_tokens: Desired token count per chunk (default 400, range 350-450).
        max_tokens: Maximum allowed tokens per chunk before forcing a split (default 500).
        overlap_tokens: Target token overlap between consecutive chunks (default 50).

    Returns:
        List of DocumentChunk instances with rich metadata.

    Raises:
        ValueError: If input markdown is not a valid string.
        ChunkingError: If chunking execution fails unexpectedly.
    """
    if not isinstance(markdown, str):
        logger.error("Invalid markdown input: expected string, got %s", type(markdown))
        raise ValueError("Input markdown must be a string.")

    if not markdown.strip():
        logger.info("Empty or whitespace-only markdown provided. Returning empty chunk list.")
        return []

    logger.info(
        "Starting document chunking. Doc ID: %s, Target tokens: %d, Max tokens: %d, Overlap: %d",
        document_id or "N/A",
        target_tokens,
        max_tokens,
        overlap_tokens,
    )

    try:
        blocks = parse_markdown_blocks(markdown, max_tokens=max_tokens)
        if not blocks:
            logger.warning("No semantic blocks extracted from document.")
            return []

        chunks: List[DocumentChunk] = []
        current_blocks: List[SemanticBlock] = []
        current_tokens = 0
        chunk_index = 0

        def build_chunk(
            block_list: List[SemanticBlock], idx: int
        ) -> DocumentChunk:
            chunk_content = "\n\n".join(b.content for b in block_list)
            actual_token_count = count_tokens(chunk_content)

            page_starts = [
                b.page_start for b in block_list if b.page_start is not None
            ]
            page_ends = [
                b.page_end for b in block_list if b.page_end is not None
            ]
            page_start = min(page_starts) if page_starts else None
            page_end = max(page_ends) if page_ends else None

            heading_path: List[str] = []
            for b in block_list:
                if b.heading_path:
                    heading_path = b.heading_path

            heading = heading_path[-1] if heading_path else None
            word_count = len(chunk_content.split())
            chunk_id = _generate_chunk_id(document_id, idx, markdown)

            meta = {
                "chunk_id": chunk_id,
                "document_id": document_id,
                "heading": heading,
                "heading_path": heading_path,
                "page_start": page_start,
                "page_end": page_end,
                "chunk_index": idx,
                "word_count": word_count,
                "token_count": actual_token_count,
                "ocr_confidence": ocr_confidence,
            }

            return DocumentChunk(
                chunk_id=chunk_id,
                document_id=document_id,
                chunk_index=idx,
                heading=heading,
                heading_path=heading_path,
                page=page_start,
                page_start=page_start,
                page_end=page_end,
                ocr_confidence=ocr_confidence,
                content=chunk_content,
                token_count=actual_token_count,
                metadata=meta,
            )

        for block in blocks:
            if block.token_count > max_tokens and block.block_type in (
                "table",
                "code",
                "equation",
                "heading",
            ):
                logger.warning(
                    "Atomic block of type '%s' exceeds max_tokens (%d > %d). "
                    "Preserving as single atomic chunk without splitting.",
                    block.block_type,
                    block.token_count,
                    max_tokens,
                )
                if current_blocks:
                    chunks.append(build_chunk(current_blocks, chunk_index))
                    chunk_index += 1
                    current_blocks = []
                    current_tokens = 0

                chunks.append(build_chunk([block], chunk_index))
                chunk_index += 1
                continue

            if current_tokens + block.token_count > max_tokens and current_blocks:
                chunks.append(build_chunk(current_blocks, chunk_index))
                chunk_index += 1

                overlap_blocks: List[SemanticBlock] = []
                accumulated_overlap = 0
                for prev_block in reversed(current_blocks):
                    if accumulated_overlap + prev_block.token_count <= overlap_tokens:
                        overlap_blocks.insert(0, prev_block)
                        accumulated_overlap += prev_block.token_count
                    else:
                        break

                current_blocks = overlap_blocks + [block]
                current_tokens = sum(b.token_count for b in current_blocks)
            else:
                current_blocks.append(block)
                current_tokens += block.token_count

                if current_tokens >= target_tokens:
                    chunks.append(build_chunk(current_blocks, chunk_index))
                    chunk_index += 1

                    overlap_blocks = []
                    accumulated_overlap = 0
                    for prev_block in reversed(current_blocks):
                        if accumulated_overlap + prev_block.token_count <= overlap_tokens:
                            overlap_blocks.insert(0, prev_block)
                            accumulated_overlap += prev_block.token_count
                        else:
                            break

                    current_blocks = overlap_blocks
                    current_tokens = sum(b.token_count for b in current_blocks)

        if current_blocks:
            final_content = "\n\n".join(b.content for b in current_blocks)
            if not chunks or chunks[-1].content != final_content:
                chunks.append(build_chunk(current_blocks, chunk_index))

        logger.info(
            "Document chunking completed successfully. Doc ID: %s, Total chunks: %d",
            document_id or "N/A",
            len(chunks),
        )
        return chunks

    except Exception as exc:
        logger.exception("Failed to chunk document due to an unexpected error: %s", str(exc))
        raise ChunkingError(f"Failed to chunk document: {exc}") from exc
