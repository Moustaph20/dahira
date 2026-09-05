from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    String,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.core.database import Base


class Ton(Base):
    __tablename__ = "tons"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    nom: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        unique=True,
    )

    description: Mapped[str | None] = mapped_column(
        String(255),
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

    # ==========================================================
    # AUDIOS
    # ==========================================================

    audios: Mapped[list["Audio"]] = relationship(
        "Audio",
        back_populates="ton",
        passive_deletes=True,
    )

    # ==========================================================
    # DÉCLAMATIONS
    # ==========================================================

    declamations: Mapped[list["DeclamationKhassida"]] = relationship(
        "DeclamationKhassida",
        back_populates="ton",
        passive_deletes=True,
    )

    # ==========================================================
    # ASSOCIATIONS KHASSIDA ↔ TON
    # ==========================================================

    khassida_tons: Mapped[list["KhassidaTon"]] = relationship(
        "KhassidaTon",
        back_populates="ton",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )