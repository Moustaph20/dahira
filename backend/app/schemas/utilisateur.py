from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# CRÉATION D'UTILISATEUR
# ============================================================

class UtilisateurCreate(BaseModel):

    membre_id: int = Field(
        ...,
        gt=0
    )

    identifiant: str = Field(
        ...,
        min_length=3,
        max_length=100
    )

    mot_de_passe: str = Field(
        ...,
        min_length=6,
        max_length=72
    )

    fonction_ids: list[int] = Field(
        default_factory=list
    )


# ============================================================
# MODIFICATION
# ============================================================

class UtilisateurUpdate(BaseModel):

    identifiant: str | None = Field(
        default=None,
        min_length=3,
        max_length=100
    )

    fonction_ids: list[int] | None = None


# ============================================================
# MODIFICATION MOT DE PASSE
# ============================================================

class ModifierMotDePasse(BaseModel):

    mot_de_passe: str = Field(
        ...,
        min_length=6,
        max_length=72
    )


# ============================================================
# FONCTION
# ============================================================

class FonctionUtilisateurResponse(BaseModel):

    id: int
    nom: str
    description: str | None = None

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# UTILISATEUR
# ============================================================

class UtilisateurResponse(BaseModel):

    id: int
    membre_id: int
    identifiant: str

    premiere_connexion: bool
    actif: bool

    dernier_acces: datetime | None
    created_at: datetime

    fonctions: list[FonctionUtilisateurResponse] = []

    model_config = ConfigDict(
        from_attributes=True
    )