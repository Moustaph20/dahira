"""ajout gestion communications programmees

Revision ID: ca7c1a182940
Revises: 027717562ea8
Create Date: 2026-10-06
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "ca7c1a182940"
down_revision: Union[str, Sequence[str], None] = "027717562ea8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ============================================================
    # STATUT DE LA COMMUNICATION
    # ============================================================
    #
    # Les communications existantes sont considérées comme
    # déjà publiées.
    #
    op.add_column(
        "communications",
        sa.Column(
            "statut",
            sa.String(length=30),
            nullable=False,
            server_default="PUBLIEE",
        ),
    )

    # ============================================================
    # NOTIFICATION PUSH
    # ============================================================
    #
    # Les anciennes communications sont considérées comme ayant
    # déjà été traitées afin d'éviter de renvoyer leurs anciennes
    # notifications Firebase après la migration.
    #
    op.add_column(
        "communications",
        sa.Column(
            "push_envoye",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    # Les communications existantes sont des communications déjà
    # présentes dans le système. On les marque comme PUBLIEE.
    op.execute(
        sa.text(
            """
            UPDATE communications
            SET statut = 'PUBLIEE'
            WHERE statut IS NULL
            """
        )
    )

    # Pour éviter qu'un futur traitement automatique considère
    # les anciennes communications comme des notifications
    # à envoyer.
    op.execute(
        sa.text(
            """
            UPDATE communications
            SET push_envoye = TRUE
            WHERE statut = 'PUBLIEE'
            """
        )
    )


def downgrade() -> None:
    # Suppression des nouvelles colonnes
    op.drop_column("communications", "push_envoye")
    op.drop_column("communications", "statut")