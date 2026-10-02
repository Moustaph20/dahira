from decimal import Decimal

import phonenumbers

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
        min_length=8,
        max_length=30,
        description=(
            "Numéro de téléphone international "
            "au format E.164."
        ),
    )

    lieu_residence: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    montant_cotisation: Decimal = Field(
        ...,
        ge=0,
        max_digits=12,
        decimal_places=2,
        description=(
            "Montant mensuel de cotisation. "
            "0 signifie que le membre n'est pas cotisant."
        ),
    )

    fonction_ids: list[int] = Field(
        ...,
        min_length=1,
    )

    kourel_ids: list[int] = Field(
        default_factory=list,
        description=(
            "Liste des Kourels auxquels le membre appartient"
        ),
    )

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

    @field_validator("telephone")
    @classmethod
    def valider_telephone(
        cls,
        value: str,
    ) -> str:

        value = value.strip()

        if not value:
            raise ValueError(
                "Le numéro de téléphone est obligatoire."
            )

        # --------------------------------------------------------
        # Le frontend envoie normalement déjà du E.164.
        # On accepte cependant certains formats avec espaces.
        # --------------------------------------------------------

        if not value.startswith("+"):
            raise ValueError(
                "Le numéro doit être au format international, "
                "par exemple +221771234567."
            )

        try:
            numero = phonenumbers.parse(
                value,
                None,
            )
        except phonenumbers.NumberParseException:
            raise ValueError(
                "Le numéro de téléphone est invalide."
            )

        if not phonenumbers.is_possible_number(
            numero
        ):
            raise ValueError(
                "La longueur du numéro de téléphone est invalide."
            )

        if not phonenumbers.is_valid_number(
            numero
        ):
            raise ValueError(
                "Le numéro de téléphone est invalide."
            )

        numero_normalise = (
            phonenumbers.format_number(
                numero,
                phonenumbers.PhoneNumberFormat.E164,
            )
        )

        return numero_normalise

    @field_validator("montant_cotisation")
    @classmethod
    def valider_montant_cotisation(
        cls,
        value: Decimal,
    ) -> Decimal:

        if value < 0:
            raise ValueError(
                "Le montant de cotisation ne peut pas être négatif."
            )

        return value

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


class MembreUpdate(MembreCreate):
    pass