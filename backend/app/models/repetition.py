from datetime import date, datetime, time

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    String,
    Time,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.core.database import Base


class Repetition(Base):
    __tablename__ = "repetitions"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    programme_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "programmes_mensuels.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    date_repetition: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    heure_debut: Mapped[time | None] = mapped_column(
        Time,
        nullable=True,
    )

    heure_fin: Mapped[time | None] = mapped_column(
        Time,
        nullable=True,
    )

    lieu: Mapped[str | None] = mapped_column(
        String(200),
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

    # ============================================================
    # PROGRAMME
    # ============================================================

    programme = relationship(
        "ProgrammeMensuel",
        back_populates="repetitions",
    )

    # ============================================================
    # KHASSIDAS
    # ============================================================

    khassidas = relationship(
        "RepetitionKhassida",
        back_populates="repetition",
        cascade="all, delete-orphan",
    )