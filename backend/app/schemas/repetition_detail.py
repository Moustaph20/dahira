from datetime import date, time

from pydantic import BaseModel


# ============================================================
# TON
# ============================================================

class TonRepetitionResponse(BaseModel):

    id: int

    nom: str

    description: str | None = None


# ============================================================
# AUDIO
# ============================================================

class AudioRepetitionResponse(BaseModel):

    id: int

    titre: str

    fichier: str

    description: str | None = None

    ton: TonRepetitionResponse | None = None


# ============================================================
# KHASSIDA
# ============================================================

class KhassidaRepetitionResponse(BaseModel):

    id: int

    titre: str

    auteur: str | None = None

    description: str | None = None

    ordre: int

    audios: list[
        AudioRepetitionResponse
    ]


# ============================================================
# RÉPÉTITION COMPLÈTE
# ============================================================

class RepetitionDetailResponse(BaseModel):

    id: int

    programme_id: int

    date_repetition: date

    heure_debut: time | None = None

    heure_fin: time | None = None

    lieu: str | None = None

    actif: bool

    khassidas: list[
        KhassidaRepetitionResponse
    ]