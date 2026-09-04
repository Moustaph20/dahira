from datetime import date, datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
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


class ProgrammeMensuel(Base):
    __tablename__ = "programmes_mensuels"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    kourel_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "kourels.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    annee: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    mois: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    date_debut: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    date_fin: Mapped[date] = mapped_column(
        Date,
        nullable=False,
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

    kourel = relationship(
        "Kourel",
        back_populates="programmes",
    )

    repetitions = relationship(
        "Repetition",
        back_populates="programme",
        cascade="all, delete-orphan",
    )

    declamations = relationship(
        "Declamation",
        back_populates="programme",
        cascade="all, delete-orphan",
    )