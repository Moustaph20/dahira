from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Reunion(Base):
    __tablename__ = "reunions"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    titre: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    type_reunion: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="MENSUELLE",
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    ordre_du_jour: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    date_reunion: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    lieu: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    adresse: Mapped[str | None] = mapped_column(
        String(300),
        nullable=True,
    )

    latitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    longitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    statut: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PROGRAMMEE",
    )

    compte_rendu: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    actif: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )