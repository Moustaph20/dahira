from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.fonction import Fonction
from app.models.permission import Permission
from app.models.fonction_permission import FonctionPermission


FONCTIONS = [
    ("ADMINISTRATEUR", "Administrateur du système"),
    ("SG", "Secrétaire Général"),
    ("ADJOINT_SG", "Adjoint au Secrétaire Général"),
    ("DIEUWRIGNE_FINANCIER", "Dieuwrigne / Responsable financier"),
    ("ADJOINT_FINANCIER", "Adjoint au responsable financier"),
    ("MEMBRE", "Membre cotisant"),
]


PERMISSIONS = [
    ("DASHBOARD_CONSULTER", "Consulter le tableau de bord"),
    ("MEMBRE_CREER", "Créer un membre"),
    ("MEMBRE_MODIFIER", "Modifier un membre"),
    ("MEMBRE_CONSULTER", "Consulter les membres"),

    ("UTILISATEUR_CREER", "Créer un compte utilisateur"),
    ("UTILISATEUR_MODIFIER", "Modifier un compte utilisateur"),

    ("COTISATION_CREER", "Enregistrer une cotisation"),
    ("COTISATION_CONSULTER", "Consulter les cotisations"),

    ("PAIEMENT_CREER", "Enregistrer un paiement"),
    ("PAIEMENT_CONSULTER", "Consulter les paiements"),

    ("REUNION_GERER", "Gérer les réunions"),
    ("PROGRAMME_GERER", "Gérer les programmes"),

    ("COMMUNICATION_CREER", "Créer une communication"),
    ("COMMUNICATION_CONSULTER", "Consulter les communications"),

    ("PROFIL_MODIFIER", "Modifier son profil"),
]


PERMISSIONS_PAR_FONCTION = {
    "ADMINISTRATEUR": [
        "DASHBOARD_CONSULTER",
        "MEMBRE_CREER",
        "MEMBRE_MODIFIER",
        "MEMBRE_CONSULTER",
        "UTILISATEUR_CREER",
        "UTILISATEUR_MODIFIER",
        "COTISATION_CREER",
        "COTISATION_CONSULTER",
        "PAIEMENT_CREER",
        "PAIEMENT_CONSULTER",
        "REUNION_GERER",
        "PROGRAMME_GERER",
        "COMMUNICATION_CREER",
        "COMMUNICATION_CONSULTER",
        "PROFIL_MODIFIER",
    ],

    "SG": [
        "MEMBRE_CREER",
        "MEMBRE_MODIFIER",
        "MEMBRE_CONSULTER",
        "UTILISATEUR_CREER",
        "UTILISATEUR_MODIFIER",
        "REUNION_GERER",
        "PROGRAMME_GERER",
        "COMMUNICATION_CREER",
        "COMMUNICATION_CONSULTER",
        "PROFIL_MODIFIER",
    ],

    "ADJOINT_SG": [
        "MEMBRE_CREER",
        "MEMBRE_MODIFIER",
        "MEMBRE_CONSULTER",
        "UTILISATEUR_CREER",
        "UTILISATEUR_MODIFIER",
        "REUNION_GERER",
        "COMMUNICATION_CONSULTER",
        "PROFIL_MODIFIER",
    ],

    "DIEUWRIGNE_FINANCIER": [
        "DASHBOARD_CONSULTER",
        "MEMBRE_CONSULTER",
        "COTISATION_CREER",
        "COTISATION_CONSULTER",
        "PAIEMENT_CREER",
        "PAIEMENT_CONSULTER",
        "COMMUNICATION_CONSULTER",
        "PROFIL_MODIFIER",
    ],

    "ADJOINT_FINANCIER": [
        "DASHBOARD_CONSULTER",
        "MEMBRE_CONSULTER",
        "COTISATION_CREER",
        "COTISATION_CONSULTER",
        "PAIEMENT_CREER",
        "PAIEMENT_CONSULTER",
        "COMMUNICATION_CONSULTER",
        "PROFIL_MODIFIER",
    ],

    "MEMBRE": [
        "COTISATION_CONSULTER",
        "PAIEMENT_CONSULTER",
        "COMMUNICATION_CONSULTER",
        "PROFIL_MODIFIER",
    ],
}


def get_or_create_fonction(db: Session, code: str, description: str):
    fonction = (
        db.query(Fonction)
        .filter(Fonction.nom == code)
        .first()
    )

    if not fonction:
        fonction = Fonction(
            nom=code,
            description=description
        )
        db.add(fonction)
        db.flush()

    return fonction


def get_or_create_permission(db: Session, code: str, nom: str):
    permission = (
        db.query(Permission)
        .filter(Permission.code == code)
        .first()
    )

    if not permission:
        permission = Permission(
            code=code,
            nom=nom
        )
        db.add(permission)
        db.flush()

    return permission


def seed():
    db = SessionLocal()

    try:
        fonctions = {}
        permissions = {}

        # Création des fonctions
        for code, description in FONCTIONS:
            fonctions[code] = get_or_create_fonction(
                db,
                code,
                description
            )

        # Création des permissions
        for code, nom in PERMISSIONS:
            permissions[code] = get_or_create_permission(
                db,
                code,
                nom
            )

        db.flush()

        # Création des associations fonction -> permission
        for fonction_code, permission_codes in PERMISSIONS_PAR_FONCTION.items():

            fonction = fonctions[fonction_code]

            for permission_code in permission_codes:

                permission = permissions[permission_code]

                association = (
                    db.query(FonctionPermission)
                    .filter(
                        FonctionPermission.fonction_id == fonction.id,
                        FonctionPermission.permission_id == permission.id
                    )
                    .first()
                )

                if not association:
                    association = FonctionPermission(
                        fonction_id=fonction.id,
                        permission_id=permission.id
                    )

                    db.add(association)

        db.commit()

        print("Fonctions, permissions et associations créées avec succès.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed()