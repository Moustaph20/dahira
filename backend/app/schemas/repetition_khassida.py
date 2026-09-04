
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RepetitionKhassidaCreate(BaseModel):

    repetition_id: int = Field(
        ...,
        gt=0,
    )

    khassida_id: int = Field(
        ...,
        gt=0,
    )

    audio_id: int = Field(
        ...,
        gt=0,
    )

    ordre: int = Field(
        default=1,
        ge=1,
    )


class RepetitionKhassidaResponse(BaseModel):

    id: int

    repetition_id: int

    khassida_id: int

    audio_id: int

    ordre: int

    actif: bool

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )

