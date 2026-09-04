from decimal import Decimal

from pydantic import (
    BaseModel,
    Field,
    field_validator,
)


class MembreCreate(BaseModel):

    nom: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    prenom: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    telephone: str = Field(
        ...,
        description="Numéro de téléphone sénégalais",
    )

    lieu_residence: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    montant_cotisation: Decimal = Field(
        ...,
        gt=0,
        max_digits=12,
        decimal_places=2,
    )

    # ============================================================
    # FONCTIONS
    # ============================================================

    fonction_ids: list[int] = Field(
        ...,
        min_length=1,
    )

    # ============================================================
    # KOURELS
    # ============================================================

    kourel_ids: list[int] = Field(
        default_factory=list,
        description="Liste des Kourels auxquels le membre appartient",
    )

    # ============================================================
    # VALIDATION TEXTES
    # ============================================================

    @field_validator(
        "nom",
        "prenom",
        "lieu_residence",
    )
    @classmethod
    def nettoyer_texte(cls, value: str) -> str:

        value = " ".join(
            value.strip().split()
        )

        if not value:
            raise ValueError(
                "Ce champ est obligatoire."
            )

        return value

    # ============================================================
    # TELEPHONE
    # ============================================================

    @field_validator("telephone")
    @classmethod
    def valider_telephone(cls, value: str) -> str:

        value = value.strip()

        chiffres = "".join(
            caractere
            for caractere in value
            if caractere.isdigit()
        )

        if len(chiffres) != 9:
            raise ValueError(
                "Le numéro de téléphone doit contenir 9 chiffres."
            )

        prefixes_valides = (
            "70",
            "71",
            "75",
            "76",
            "77",
            "78",
        )

        if not chiffres.startswith(prefixes_valides):
            raise ValueError(
                "Le numéro de téléphone sénégalais est invalide."
            )

        return chiffres

    # ============================================================
    # COTISATION
    # ============================================================

    @field_validator("montant_cotisation")
    @classmethod
    def valider_montant_cotisation(
        cls,
        value: Decimal,
    ) -> Decimal:

        if value <= 0:
            raise ValueError(
                "Le montant de cotisation doit être supérieur à 0."
            )

        return value

    # ============================================================
    # FONCTIONS
    # ============================================================

    @field_validator("fonction_ids")
    @classmethod
    def valider_fonction_ids(
        cls,
        value: list[int],
    ) -> list[int]:

        fonctions_uniques = list(
            dict.fromkeys(value)
        )

        if not fonctions_uniques:
            raise ValueError(
                "Au moins une fonction doit être attribuée au membre."
            )

        if any(
            fonction_id <= 0
            for fonction_id in fonctions_uniques
        ):
            raise ValueError(
                "Les identifiants des fonctions doivent être valides."
            )

        return fonctions_uniques

    # ============================================================
    # KOURELS
    # ============================================================

    @field_validator("kourel_ids")
    @classmethod
    def valider_kourel_ids(
        cls,
        value: list[int],
    ) -> list[int]:

        kourels_uniques = list(
            dict.fromkeys(value)
        )

        if any(
            kourel_id <= 0
            for kourel_id in kourels_uniques
        ):
            raise ValueError(
                "Les identifiants des Kourels doivent être valides."
            )

        return kourels_uniques


# ============================================================
# MODIFICATION D'UN MEMBRE
# ============================================================

class MembreUpdate(MembreCreate):
    pass