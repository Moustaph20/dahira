"""ajouter periode aux cotisations

Revision ID: 1b5727e30030
Revises: 
Create Date: 2026-08-19 22:51:39.446100

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1b5727e30030'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    # --------------------------------------------------------
    # Ajouter le montant dû
    # --------------------------------------------------------

    op.add_column(
        "cotisations",
        sa.Column(
            "montant_du",
            sa.Numeric(12, 2),
            nullable=True
        )
    )

    # --------------------------------------------------------
    # Ajouter le mois concerné
    # --------------------------------------------------------

    op.add_column(
        "cotisations",
        sa.Column(
            "mois_concerne",
            sa.String(20),
            nullable=True
        )
    )

    # --------------------------------------------------------
    # Ajouter l'année
    # --------------------------------------------------------

    op.add_column(
        "cotisations",
        sa.Column(
            "annee",
            sa.Integer(),
            nullable=True
        )
    )

    # --------------------------------------------------------
    # MIGRATION DES ANCIENNES DONNÉES
    # --------------------------------------------------------

    op.execute(
        """
        UPDATE cotisations
        SET
            montant_du = montant,

            mois_concerne =
                CASE
                    EXTRACT(
                        MONTH FROM date_cotisation
                    )

                    WHEN 1 THEN 'Janvier'
                    WHEN 2 THEN 'Février'
                    WHEN 3 THEN 'Mars'
                    WHEN 4 THEN 'Avril'
                    WHEN 5 THEN 'Mai'
                    WHEN 6 THEN 'Juin'
                    WHEN 7 THEN 'Juillet'
                    WHEN 8 THEN 'Août'
                    WHEN 9 THEN 'Septembre'
                    WHEN 10 THEN 'Octobre'
                    WHEN 11 THEN 'Novembre'
                    WHEN 12 THEN 'Décembre'
                END,

            annee =
                EXTRACT(
                    YEAR FROM date_cotisation
                )::INTEGER
        """
    )

    # --------------------------------------------------------
    # Rendre les nouvelles colonnes obligatoires
    # --------------------------------------------------------

    op.alter_column(
        "cotisations",
        "montant_du",
        nullable=False
    )

    op.alter_column(
        "cotisations",
        "mois_concerne",
        nullable=False
    )

    op.alter_column(
        "cotisations",
        "annee",
        nullable=False
    )


def downgrade() -> None:

    op.drop_column(
        "cotisations",
        "annee"
    )

    op.drop_column(
        "cotisations",
        "mois_concerne"
    )

    op.drop_column(
        "cotisations",
        "montant_du"
    )