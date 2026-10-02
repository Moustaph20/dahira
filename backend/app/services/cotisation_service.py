from datetime import date
from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.cotisation import Cotisation
from app.models.membre import Membre


MOIS_ORDRE = {
    "Janvier": 1,
    "Février": 2,
    "Mars": 3,
    "Avril": 4,
    "Mai": 5,
    "Juin": 6,
    "Juillet": 7,
    "Août": 8,
    "Septembre": 9,
    "Octobre": 10,
    "Novembre": 11,
    "Décembre": 12,
}


def obtenir_mois_annee_actuels(
    aujourd_hui: date | None = None,
) -> tuple[str, int]:
    """
    Retourne le mois et l'année correspondant à la date fournie.

    Exemple :
        2026-10-02
        -> ("Octobre", 2026)
    """

    aujourd_hui = aujourd_hui or date.today()

    mois_numero = aujourd_hui.month

    mois = next(
        nom
        for nom, numero in MOIS_ORDRE.items()
        if numero == mois_numero
    )

    return mois, aujourd_hui.year


def creer_cotisation_mensuelle_pour_membre(
    membre: Membre,
    mois_concerne: str,
    annee: int,
    db: Session,
    date_enregistrement: date | None = None,
) -> tuple[Cotisation, bool]:
    """
    Crée la cotisation du mois pour un membre actif.

    Retourne :
        (cotisation, True)  -> nouvelle cotisation créée
        (cotisation, False) -> cotisation déjà existante

    Cette fonction est volontairement idempotente :
    l'exécuter plusieurs fois ne doit pas créer plusieurs
    cotisations pour la même période.
    """

    cotisation_existante = (
        db.query(Cotisation)
        .filter(
            Cotisation.membre_id == membre.id,
            Cotisation.mois_concerne == mois_concerne,
            Cotisation.annee == annee,
            Cotisation.actif.is_(True),
        )
        .first()
    )

    if cotisation_existante:
        return cotisation_existante, False

    montant = Decimal(
        str(membre.montant_cotisation or 0)
    )

    cotisation = Cotisation(
        membre_id=membre.id,
        montant=montant,
        montant_du=montant,
        mois_concerne=mois_concerne,
        annee=annee,
        date_cotisation=(
            date_enregistrement or date.today()
        ),
        actif=True,
    )

    db.add(cotisation)

    return cotisation, True


def generer_cotisations_mensuelles(
    db: Session,
    mois_concerne: str | None = None,
    annee: int | None = None,
    date_enregistrement: date | None = None,
) -> dict:
    """
    Génère les cotisations du mois pour tous les membres actifs.

    Si le mois et l'année ne sont pas fournis,
    le mois actuel est utilisé.

    Cette fonction :

    - récupère uniquement les membres actifs ;
    - crée une cotisation pour chaque membre ;
    - utilise son montant_cotisation ;
    - ne crée jamais de doublon ;
    - ne vérifie pas si le mois précédent est payé ;
    - ne modifie aucune cotisation existante.
    """

    if mois_concerne is None or annee is None:
        mois_actuel, annee_actuelle = (
            obtenir_mois_annee_actuels()
        )

        mois_concerne = (
            mois_concerne or mois_actuel
        )

        annee = (
            annee
            if annee is not None
            else annee_actuelle
        )

    if mois_concerne not in MOIS_ORDRE:
        raise ValueError(
            f"Mois invalide : {mois_concerne}"
        )

    membres = (
        db.query(Membre)
        .filter(
            Membre.actif.is_(True)
        )
        .order_by(
            Membre.id.asc()
        )
        .all()
    )

    total_membres = len(membres)

    nombre_creees = 0
    nombre_existantes = 0
    nombre_zero = 0

    cotisations_creees = []

    try:

        for membre in membres:

            cotisation, creee = (
                creer_cotisation_mensuelle_pour_membre(
                    membre=membre,
                    mois_concerne=mois_concerne,
                    annee=annee,
                    db=db,
                    date_enregistrement=date_enregistrement,
                )
            )

            if creee:

                nombre_creees += 1

                if float(
                    membre.montant_cotisation or 0
                ) <= 0:
                    nombre_zero += 1

                cotisations_creees.append(
                    {
                        "id": cotisation.id,
                        "membre_id": membre.id,
                        "montant": float(
                            cotisation.montant or 0
                        ),
                    }
                )

            else:

                nombre_existantes += 1

        db.commit()

    except IntegrityError:

        db.rollback()

        raise

    return {
        "mois": mois_concerne,
        "annee": annee,
        "total_membres_actifs": total_membres,
        "nombre_creees": nombre_creees,
        "nombre_existantes": nombre_existantes,
        "nombre_cotisations_zero": nombre_zero,
        "cotisations_creees": cotisations_creees,
    }