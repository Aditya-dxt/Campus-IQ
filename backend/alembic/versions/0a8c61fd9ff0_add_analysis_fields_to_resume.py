"""add analysis fields to resume

Revision ID: 0a8c61fd9ff0
Revises: bb7eded77c5f
Create Date: 2026-07-21 14:56:25.390840

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0a8c61fd9ff0"
down_revision: Union[str, Sequence[str], None] = "bb7eded77c5f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # Add ATS score column
    op.add_column(
        "resumes",
        sa.Column(
            "ats_score",
            sa.Float(),
            nullable=True,
        ),
    )

    # Add analysis_status with a temporary default for existing rows
    op.add_column(
        "resumes",
        sa.Column(
            "analysis_status",
            sa.String(),
            nullable=False,
            server_default="pending",
        ),
    )

    # Remove the server default after existing rows are updated
    op.alter_column(
        "resumes",
        "analysis_status",
        server_default=None,
    )

    # Add analysis feedback column
    op.add_column(
        "resumes",
        sa.Column(
            "analysis_feedback",
            sa.Text(),
            nullable=True,
        ),
    )

    # Add analyzed_at column
    op.add_column(
        "resumes",
        sa.Column(
            "analyzed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column("resumes", "analyzed_at")
    op.drop_column("resumes", "analysis_feedback")
    op.drop_column("resumes", "analysis_status")
    op.drop_column("resumes", "ats_score")