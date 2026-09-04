from sqlalchemy import BigInteger, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class KhassidaTon(Base):
    __tablename__ = "khassida_tons"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True
    )

    khassida_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "khassidas.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    ton_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "tons.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )