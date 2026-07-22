from uuid import UUID

from sqlalchemy.orm import Session

from app.models.study_material import StudyMaterial
from app.models.user import User
from app.schemas.study_material import (
    StudyMaterialCreate,
    StudyMaterialUpdate,
)


def create_study_material(
    db: Session,
    current_user: User,
    data: StudyMaterialCreate,
    file_name: str,
    file_path: str,
    file_type: str,
    file_size: int,
) -> StudyMaterial:

    study_material = StudyMaterial(
        user_id=current_user.id,
        title=data.title,
        description=data.description,
        subject=data.subject,
        file_name=file_name,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
    )

    db.add(study_material)
    db.commit()
    db.refresh(study_material)

    return study_material


def get_study_materials(
    db: Session,
    current_user: User,
) -> list[StudyMaterial]:

    return (
        db.query(StudyMaterial)
        .filter(
            StudyMaterial.user_id == current_user.id,
            StudyMaterial.is_active == True,
        )
        .order_by(StudyMaterial.created_at.desc())
        .all()
    )


def get_study_material(
    db: Session,
    material_id: UUID,
    current_user: User,
) -> StudyMaterial:

    material = (
        db.query(StudyMaterial)
        .filter(
            StudyMaterial.id == material_id,
            StudyMaterial.user_id == current_user.id,
            StudyMaterial.is_active == True,
        )
        .first()
    )

    if not material:
        raise ValueError("Study material not found.")

    return material


def update_study_material(
    db: Session,
    material: StudyMaterial,
    data: StudyMaterialUpdate,
) -> StudyMaterial:

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(material, key, value)

    db.commit()
    db.refresh(material)

    return material


def delete_study_material(
    db: Session,
    material: StudyMaterial,
) -> None:

    material.is_active = False

    db.commit()