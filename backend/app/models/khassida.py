from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    String,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.core.database import Base


class Khassida(Base):
    __tablename__ = "khassidas"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    titre: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    auteur: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
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

    # ==========================================================
    # AUDIOS
    # ==========================================================

    audios: Mapped[list["Audio"]] = relationship(
        "Audio",
        back_populates="khassida",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # ==========================================================
    # RÉPÉTITIONS
    # ==========================================================

    repetitions: Mapped[list["RepetitionKhassida"]] = relationship(
        "RepetitionKhassida",
        back_populates="khassida",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # ==========================================================
    # DÉCLAMATIONS
    # ==========================================================

    declamations: Mapped[list["DeclamationKhassida"]] = relationship(
        "DeclamationKhassida",
        back_populates="khassida",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # ==========================================================
    # TONS ASSOCIÉS
    # ==========================================================

    khassida_tons: Mapped[list["KhassidaTon"]] = relationship(
        "KhassidaTon",
        back_populates="khassida",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )