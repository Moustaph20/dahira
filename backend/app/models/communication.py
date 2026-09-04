
# app/models/communication.py

from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Communication(Base):
    __tablename__ = "communications"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    titre: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    contenu: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    type_communication: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="ANNONCE",
    )

    priorite: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="NORMALE",
    )

    date_publication: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    date_expiration: Mapped[datetime | None] = mapped_column(
        DateTime,
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
