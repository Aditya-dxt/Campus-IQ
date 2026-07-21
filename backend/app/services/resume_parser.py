from pathlib import Path

import fitz  # PyMuPDF
from docx import Document


def extract_pdf_text(file_path: str) -> str:
    """
    Extract text from a PDF file.
    """

    document = fitz.open(file_path)

    text = ""

    for page in document:
        text += page.get_text()

    document.close()

    return text.strip()


def extract_docx_text(file_path: str) -> str:
    """
    Extract text from a DOCX file.
    """

    document = Document(file_path)

    text = "\n".join(
        paragraph.text
        for paragraph in document.paragraphs
    )

    return text.strip()


def extract_resume_text(file_path: str) -> str:
    extension = Path(file_path).suffix.lower()

    if extension == ".pdf":
        return clean_text(
            extract_pdf_text(file_path)
        )

    if extension == ".docx":
        return clean_text(
            extract_docx_text(file_path)
        )

    raise ValueError("Unsupported resume format.")
def clean_text(text: str) -> str:
    """
    Clean extracted resume text.
    """

    text = text.replace("\x00", "")

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    return "\n".join(lines)