from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    String,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.core.database import Base


class Audio(Base):
    __tablename__ = "audios"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    khassida_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "khassidas.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    ton_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "tons.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    titre: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    fichier: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
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

    khassida: Mapped["Khassida"] = relationship(
        "Khassida",
        back_populates="audios",
    )

    ton: Mapped["Ton"] = relationship(
        "Ton",
        back_populates="audios",
    )

    repetitions: Mapped[list["RepetitionKhassida"]] = relationship(
        "RepetitionKhassida",
        back_populates="audio",
    )