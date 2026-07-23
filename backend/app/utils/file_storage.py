from pathlib import Path
from shutil import copyfileobj
from uuid import uuid4

from fastapi import UploadFile

# Allowed file extensions for CampusIQ document processing
ALLOWED_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
    ".pptx",
    ".png",
    ".jpg",
    ".jpeg",
    ".tiff",
    ".bmp",
    ".md",
}

# Maximum upload size (25 MB)
MAX_FILE_SIZE = 25 * 1024 * 1024


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
            f"Unsupported file extension '{extension}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}"
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
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > MAX_FILE_SIZE:
        raise ValueError(
            f"File size exceeds maximum limit of {MAX_FILE_SIZE // (1024 * 1024)} MB."
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
    folder: str = "study_materials",
) -> str:
    """
    Save uploaded file to local storage.

    Args:
        file: Uploaded file
        filename: Generated unique filename
        folder: Upload subfolder

    Returns:
        Relative file path stored in system.
    """
    upload_dir = Path("uploads") / folder
    upload_dir.mkdir(parents=True, exist_ok=True)

    destination = upload_dir / filename

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