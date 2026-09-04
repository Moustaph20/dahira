from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.core.database import Base


class RepetitionKhassida(Base):
    __tablename__ = "repetition_khassidas"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    repetition_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "repetitions.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    khassida_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "khassidas.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    audio_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "audios.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    ordre: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default="1",
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

    repetition = relationship(
        "Repetition",
        back_populates="khassidas",
    )

    khassida = relationship(
        "Khassida",
        back_populates="repetitions",
    )

    audio = relationship(
        "Audio",
        back_populates="repetitions",
    )