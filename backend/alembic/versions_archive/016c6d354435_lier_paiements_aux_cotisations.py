"""lier paiements aux cotisations

Revision ID: 016c6d354435
Revises: 1b5727e30030
Create Date: 2026-08-19 23:00:21.300629

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# ============================================================
# IDENTIFICATION ALEMBIC
# ============================================================

revision: str = "016c6d354435"

down_revision: Union[str, Sequence[str], None] = "1b5727e30030"

branch_labels: Union[str, Sequence[str], None] = None

depends_on: Union[str, Sequence[str], None] = None


# ============================================================
# MIGRATION
# ============================================================

def upgrade() -> None:

    op.add_column(
        "paiements",
        sa.Column(
            "cotisation_id",
            sa.BigInteger(),
            nullable=True
        )
    )

    op.create_foreign_key(
        "fk_paiements_cotisation",
        "paiements",
        "cotisations",
        ["cotisation_id"],
        ["id"],
        ondelete="CASCADE"
    )


# ============================================================
# ANNULATION
# ============================================================

def downgrade() -> None:

    op.drop_constraint(
        "fk_paiements_cotisation",
        "paiements",
        type_="foreignkey"
    )

    op.drop_column(
        "paiements",
        "cotisation_id"
    )