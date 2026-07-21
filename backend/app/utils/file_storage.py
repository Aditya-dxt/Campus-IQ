from pathlib import Path
from shutil import copyfileobj
from uuid import uuid4

from fastapi import UploadFile

# Base upload directory
UPLOAD_DIR = Path("uploads/resumes")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
}

# Maximum upload size (5 MB)
MAX_FILE_SIZE = 5 * 1024 * 1024


def validate_extension(filename: str) -> str:
    """
    Validate uploaded file extension.

    Returns:
        File extension (e.g. '.pdf')

    Raises:
        ValueError: If extension is not allowed.
    """
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError(
            "Only PDF, DOC, and DOCX files are allowed."
        )

    return extension


def validate_file_size(file: UploadFile) -> int:
    """
    Validate uploaded file size.

    Returns:
        File size in bytes.

    Raises:
        ValueError: If file exceeds maximum size.
    """

    # Move pointer to end
    file.file.seek(0, 2)

    file_size = file.file.tell()

    # Reset pointer
    file.file.seek(0)

    if file_size > MAX_FILE_SIZE:
        raise ValueError(
            "File size must not exceed 5 MB."
        )

    return file_size


def generate_filename(extension: str) -> str:
    """
    Generate a unique filename.

    Example:
        a7b9c7ef-74fd-4dc6-a8a2-53fd0b4f23d1.pdf
    """
    return f"{uuid4()}{extension}"


def save_file(
    file: UploadFile,
    filename: str,
) -> str:
    """
    Save uploaded file to local storage.

    Returns:
        Relative file path stored in database.
    """

    destination = UPLOAD_DIR / filename

    with destination.open("wb") as buffer:
        copyfileobj(file.file, buffer)

    return str(destination)


def delete_file(file_path: str) -> None:
    """
    Delete a file from local storage.
    """

    path = Path(file_path)

    if path.exists():
        path.unlink()