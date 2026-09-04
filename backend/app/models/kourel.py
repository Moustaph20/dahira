from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.core.database import Base


class Kourel(Base):
    __tablename__ = "kourels"

    # ============================================================
    # IDENTIFIANT
    # ============================================================

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    # ============================================================
    # INFORMATIONS DU KOUREL
    # ============================================================

    nom: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        unique=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    actif: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    # ============================================================
    # GESTIONNAIRE
    # ============================================================

    gestionnaire_membre_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey(
            "membres.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    # ============================================================
    # DATES
    # ============================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # ============================================================
    # GESTIONNAIRE
    # ============================================================

    gestionnaire = relationship(
        "Membre",
        back_populates="kourels_geres",
        foreign_keys=[gestionnaire_membre_id],
    )

    # ============================================================
    # MEMBRES DU KOUREL
    # ============================================================

    membres = relationship(
        "KourelMembre",
        back_populates="kourel",
        cascade="all, delete-orphan",
    )

    # ============================================================
    # PROGRAMMES MENSUELS
    # ============================================================

    programmes = relationship(
        "ProgrammeMensuel",
        back_populates="kourel",
        cascade="all, delete-orphan",
    )