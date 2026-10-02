from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.cotisation import Cotisation
from app.models.membre import Membre
from app.models.notification import Notification
from app.models.utilisateur import Utilisateur

from app.services.notification_service import creer_notification
from app.services.notifications_push import envoyer_notification_push


JOURS_RAPPEL_COTISATION = {5, 10, 20}


def obtenir_mois_annee(aujourd_hui: date) -> tuple[str, int]:
    mois = [
        "Janvier",
        "Février",
        "Mars",
        "Avril",
        "Mai",
        "Juin",
        "Juillet",
        "Août",
        "Septembre",
        "Octobre",
        "Novembre",
        "Décembre",
    ]

    return mois[aujourd_hui.month - 1], aujourd_hui.year


def calculer_reste_cotisation(cotisation: Cotisation) -> Decimal:
    return Decimal(str(cotisation.montant_du or 0))


def rappel_deja_envoye(
    db: Session,
    utilisateur_id: int,
    cotisation_id: int,
    jour_rappel: int,
) -> bool:
    marqueur = (
        f"[RAPPEL_COTISATION:"
        f"{cotisation_id}:{jour_rappel}]"
    )

    notification = (
        db.query(Notification)
        .filter(
            Notification.utilisateur_id == utilisateur_id,
            Notification.type == "COTISATION_RAPPEL",
            Notification.message.contains(marqueur),
        )
        .first()
    )

    return notification is not None


def creer_rappel_cotisation(
    db: Session,
    cotisation: Cotisation,
    membre: Membre,
    utilisateur: Utilisateur,
    jour_rappel: int,
) -> dict:
    reste = calculer_reste_cotisation(cotisation)

    if reste <= 0:
        return {
            "cree": False,
            "raison": "Cotisation déjà soldée.",
        }

    marqueur = (
        f"[RAPPEL_COTISATION:"
        f"{cotisation.id}:{jour_rappel}]"
    )

    montant_total = Decimal(
        str(cotisation.montant or 0)
    )

    if reste >= montant_total:
        message = (
            f"Votre cotisation de "
            f"{cotisation.mois_concerne} "
            f"{cotisation.annee}, d'un montant de "
            f"{montant_total:.0f} FCFA, "
            f"n'a pas encore été réglée. "
            f"Merci de penser à effectuer votre paiement. "
            f"{marqueur}"
        )
    else:
        message = (
            f"Votre cotisation de "
            f"{cotisation.mois_concerne} "
            f"{cotisation.annee} n'est pas encore "
            f"entièrement réglée. "
            f"Il reste {reste:.0f} FCFA à payer. "
            f"Merci de penser à régler le solde restant. "
            f"{marqueur}"
        )

    notification = creer_notification(
        db=db,
        utilisateur_id=utilisateur.id,
        titre="Rappel de cotisation",
        message=message,
        type="COTISATION_RAPPEL",
        route="/cotisations",
    )

    try:
        db.commit()
        db.refresh(notification)
    except Exception as error:
        db.rollback()

        print(
            "ERREUR CRÉATION RAPPEL COTISATION :",
            error,
        )

        return {
            "cree": False,
            "raison": "Impossible de créer la notification.",
        }

    try:
        resultat_push = envoyer_notification_push(
            notification=notification,
            db=db,
        )
    except Exception as error:
        print(
            "ERREUR PUSH RAPPEL COTISATION :",
            error,
        )

        resultat_push = {
            "envoyes": 0,
            "echecs": 1,
            "appareils": 0,
            "message": (
                "Notification créée mais push Firebase échoué."
            ),
        }

    return {
        "cree": True,
        "notification_id": notification.id,
        "membre_id": membre.id,
        "utilisateur_id": utilisateur.id,
        "cotisation_id": cotisation.id,
        "reste": float(reste),
        "push": resultat_push,
    }


def envoyer_rappels_cotisations(
    db: Session,
    aujourd_hui: date | None = None,
) -> dict:
    aujourd_hui = aujourd_hui or date.today()

    jour = aujourd_hui.day
    mois, annee = obtenir_mois_annee(aujourd_hui)

    if jour not in JOURS_RAPPEL_COTISATION:
        return {
            "execute": True,
            "jour": jour,
            "mois": mois,
            "annee": annee,
            "jour_rappel": False,
            "nombre_cotisations": 0,
            "nombre_rappels_crees": 0,
            "nombre_deja_envoyes": 0,
            "nombre_soldes": 0,
            "nombre_sans_utilisateur": 0,
            "details": [],
        }

    cotisations = (
        db.query(Cotisation)
        .join(
            Membre,
            Membre.id == Cotisation.membre_id,
        )
        .filter(
            Cotisation.mois_concerne == mois,
            Cotisation.annee == annee,
            Cotisation.actif.is_(True),
            Membre.actif.is_(True),
        )
        .order_by(Cotisation.id.asc())
        .all()
    )

    nombre_rappels_crees = 0
    nombre_deja_envoyes = 0
    nombre_soldes = 0
    nombre_sans_utilisateur = 0

    details = []

    for cotisation in cotisations:

        reste = calculer_reste_cotisation(cotisation)

        if reste <= 0:
            nombre_soldes += 1
            continue

        membre = cotisation.membre

        if not membre:
            continue

        utilisateur = (
            db.query(Utilisateur)
            .filter(
                Utilisateur.membre_id == membre.id,
                Utilisateur.actif.is_(True),
            )
            .first()
        )

        if not utilisateur:
            nombre_sans_utilisateur += 1

            details.append({
                "cotisation_id": cotisation.id,
                "membre_id": membre.id,
                "rappel": False,
                "raison": (
                    "Aucun utilisateur actif associé."
                ),
            })

            continue

        if rappel_deja_envoye(
            db=db,
            utilisateur_id=utilisateur.id,
            cotisation_id=cotisation.id,
            jour_rappel=jour,
        ):
            nombre_deja_envoyes += 1

            details.append({
                "cotisation_id": cotisation.id,
                "membre_id": membre.id,
                "utilisateur_id": utilisateur.id,
                "rappel": False,
                "raison": "Rappel déjà envoyé.",
            })

            continue

        resultat = creer_rappel_cotisation(
            db=db,
            cotisation=cotisation,
            membre=membre,
            utilisateur=utilisateur,
            jour_rappel=jour,
        )

        if resultat.get("cree"):
            nombre_rappels_crees += 1

        details.append(resultat)

    return {
        "execute": True,
        "jour": jour,
        "mois": mois,
        "annee": annee,
        "jour_rappel": True,
        "nombre_cotisations": len(cotisations),
        "nombre_rappels_crees": nombre_rappels_crees,
        "nombre_deja_envoyes": nombre_deja_envoyes,
        "nombre_soldes": nombre_soldes,
        "nombre_sans_utilisateur": nombre_sans_utilisateur,
        "details": details,
    }