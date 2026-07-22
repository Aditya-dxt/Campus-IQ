from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.user import User
from app.schemas.study_material import (
    StudyMaterialCreate,
    StudyMaterialResponse,
    StudyMaterialUpdate,
)
from app.services import study_material_service
from app.utils.file_storage import (
    generate_filename,
    save_file,
    validate_extension,
    validate_file_size,
)

router = APIRouter(
    prefix="/study-materials",
    tags=["Study Materials"],
)


@router.post(
    "",
    response_model=StudyMaterialResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_study_material(
    title: str = Form(...),
    description: str | None = Form(None),
    subject: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload study material.
    """

    try:
        extension = validate_extension(file.filename)

        file_size = validate_file_size(file)

        filename = generate_filename(extension)

        file_path = save_file(
            file=file,
            filename=filename,
            folder="study_materials",
        )

        data = StudyMaterialCreate(
            title=title,
            description=description,
            subject=subject,
        )

        return study_material_service.create_study_material(
            db=db,
            current_user=current_user,
            data=data,
            file_name=file.filename,
            file_path=file_path,
            file_type=extension,
            file_size=file_size,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "",
    response_model=list[StudyMaterialResponse],
)
def get_study_materials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return study_material_service.get_study_materials(
        db=db,
        current_user=current_user,
    )


@router.get(
    "/{material_id}",
    response_model=StudyMaterialResponse,
)
def get_study_material(
    material_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return study_material_service.get_study_material(
            db=db,
            material_id=material_id,
            current_user=current_user,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.put(
    "/{material_id}",
    response_model=StudyMaterialResponse,
)
def update_study_material(
    material_id: UUID,
    data: StudyMaterialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        material = study_material_service.get_study_material(
            db=db,
            material_id=material_id,
            current_user=current_user,
        )

        return study_material_service.update_study_material(
            db=db,
            material=material,
            data=data,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.delete(
    "/{material_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_study_material(
    material_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        material = study_material_service.get_study_material(
            db=db,
            material_id=material_id,
            current_user=current_user,
        )

        study_material_service.delete_study_material(
            db=db,
            material=material,
        )

        return

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )