from sqlalchemy import (
    BigInteger,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MembreFonction(Base):
    __tablename__ = "membre_fonctions"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    membre_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "membres.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    fonction_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "fonctions.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "membre_id",
            "fonction_id",
            name="uq_membre_fonction",
        ),
    )

    # ============================================================
    # RELATION AVEC MEMBRE
    # ============================================================

    membre = relationship(
        "Membre",
        back_populates="fonctions",
    )

    # ============================================================
    # RELATION AVEC FONCTION
    # ============================================================

    fonction = relationship(
        "Fonction",
        back_populates="membres",
    )