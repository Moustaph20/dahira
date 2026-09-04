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


class Declamation(Base):
    __tablename__ = "declamations"

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

    date_declamation: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    heure: Mapped[time | None] = mapped_column(
        Time,
        nullable=True,
    )

    lieu: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    evenement: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    khassida_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey(
            "khassidas.id",
            ondelete="SET NULL",
        ),
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

    programme = relationship(
        "ProgrammeMensuel",
        back_populates="declamations",
    )

    khassida = relationship(
        "Khassida",
    )

    khassidas = relationship(
        "DeclamationKhassida",
        back_populates="declamation",
        cascade="all, delete-orphan",
    )