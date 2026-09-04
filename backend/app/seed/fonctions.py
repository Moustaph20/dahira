from app.core.database import SessionLocal

from app.models.fonction import Fonction
from app.models.permission import Permission
from app.models.fonction_permission import FonctionPermission


FONCTIONS = {

    # ========================================================
    # DIEUWRIGNE
    # ========================================================

    "Dieuwrigne": [
        "MEMBRE_CONSULTER",
        "MEMBRE_CREER",
        "MEMBRE_MODIFIER",
        "MEMBRE_DESACTIVER",

        "COTISATION_CONSULTER",
        "COTISATION_ENREGISTRER",
        "COTISATION_MODIFIER",

        "PAIEMENT_CONSULTER",
        "PAIEMENT_ENREGISTRER",
        "PAIEMENT_MODIFIER",

        "REUNION_CONSULTER",
        "REUNION_CREER",
        "REUNION_MODIFIER",
        "REUNION_SUPPRIMER",

        "PROGRAMME_CONSULTER",
        "PROGRAMME_VALIDER",

        "KHASSIDA_CONSULTER",
        "KHASSIDA_PROGRAMMER",

        "COMMUNICATION_CONSULTER",
        "COMMUNICATION_CREER",
        "COMMUNICATION_MODIFIER",
        "COMMUNICATION_SUPPRIMER",

        "EVENEMENT_CONSULTER",
        "EVENEMENT_CREER",
        "EVENEMENT_MODIFIER",
        "EVENEMENT_SUPPRIMER",

        "NOTIFICATION_CONSULTER",
        "NOTIFICATION_CREER",

        "UTILISATEUR_CONSULTER",
        "UTILISATEUR_CREER",
        "UTILISATEUR_MODIFIER",
        "UTILISATEUR_DESACTIVER",

        "FONCTION_CONSULTER",
        "PERMISSION_CONSULTER",
    ],

    # ========================================================
    # SECRÉTAIRE GÉNÉRAL
    # ========================================================

    "Secrétaire Général": [
        "MEMBRE_CONSULTER",
        "MEMBRE_CREER",
        "MEMBRE_MODIFIER",
        "MEMBRE_DESACTIVER",

        "COTISATION_CONSULTER",

        "PAIEMENT_CONSULTER",

        "REUNION_CONSULTER",
        "REUNION_CREER",
        "REUNION_MODIFIER",

        "PROGRAMME_CONSULTER",

        "COMMUNICATION_CONSULTER",
        "COMMUNICATION_CREER",
        "COMMUNICATION_MODIFIER",

        "EVENEMENT_CONSULTER",

        "NOTIFICATION_CONSULTER",
        "NOTIFICATION_CREER",

        "UTILISATEUR_CONSULTER",
        "UTILISATEUR_CREER",
    ],

    # ========================================================
    # SECRÉTAIRE GÉNÉRAL ADJOINT
    # ========================================================

    "Secrétaire Général Adjoint": [
        "MEMBRE_CONSULTER",
        "MEMBRE_CREER",
        "MEMBRE_MODIFIER",

        "COTISATION_CONSULTER",

        "PAIEMENT_CONSULTER",

        "REUNION_CONSULTER",

        "PROGRAMME_CONSULTER",

        "COMMUNICATION_CONSULTER",

        "EVENEMENT_CONSULTER",

        "NOTIFICATION_CONSULTER",
    ],

    # ========================================================
    # RESPONSABLE COMMUNICATION
    # ========================================================

    "Responsable Communication": [
        "COMMUNICATION_CONSULTER",
        "COMMUNICATION_CREER",
        "COMMUNICATION_MODIFIER",
        "COMMUNICATION_SUPPRIMER",

        "NOTIFICATION_CONSULTER",
        "NOTIFICATION_CREER",

        "EVENEMENT_CONSULTER",
    ],

    # ========================================================
    # RESPONSABLE RELATION EXTÉRIEUR
    # ========================================================

    "Responsable Relation Extérieur": [
        "COMMUNICATION_CONSULTER",
        "COMMUNICATION_CREER",

        "EVENEMENT_CONSULTER",
        "EVENEMENT_CREER",
        "EVENEMENT_MODIFIER",

        "NOTIFICATION_CONSULTER",
    ],

    # ========================================================
    # RESPONSABLE FINANCIER
    # ========================================================

    "Responsable Financier": [
        "COTISATION_CONSULTER",
        "COTISATION_ENREGISTRER",
        "COTISATION_MODIFIER",

        "PAIEMENT_CONSULTER",
        "PAIEMENT_ENREGISTRER",
        "PAIEMENT_MODIFIER",

        "MEMBRE_CONSULTER",

        "EVENEMENT_CONSULTER",
    ],

    # ========================================================
    # RESPONSABLE ORGANISATION
    # ========================================================

    "Responsable Organisation": [
        "MEMBRE_CONSULTER",

        "REUNION_CONSULTER",
        "REUNION_CREER",
        "REUNION_MODIFIER",
        "REUNION_SUPPRIMER",

        "EVENEMENT_CONSULTER",
        "EVENEMENT_CREER",
        "EVENEMENT_MODIFIER",
        "EVENEMENT_SUPPRIMER",

        "NOTIFICATION_CONSULTER",
    ],

    # ========================================================
    # KOUREL
    # ========================================================

    "Membre Kourel": [
        "KHASSIDA_CONSULTER",
        "KHASSIDA_PROGRAMMER",

        "PROGRAMME_CONSULTER",

        "REUNION_CONSULTER",

        "EVENEMENT_CONSULTER",

        "NOTIFICATION_CONSULTER",
    ],

    # ========================================================
    # MEMBRE
    # ========================================================

    "Membre": [
        "COTISATION_CONSULTER",
        "PAIEMENT_CONSULTER",

        "REUNION_CONSULTER",

        "PROGRAMME_CONSULTER",

        "COMMUNICATION_CONSULTER",

        "EVENEMENT_CONSULTER",

        "NOTIFICATION_CONSULTER",
    ],
}


def seed_fonctions():

    db = SessionLocal()

    try:

        for nom_fonction, codes_permissions in FONCTIONS.items():

            # ------------------------------------------------
            # Fonction
            # ------------------------------------------------

            fonction = (
                db.query(Fonction)
                .filter(
                    Fonction.nom == nom_fonction
                )
                .first()
            )

            if not fonction:

                fonction = Fonction(
                    nom=nom_fonction,
                    description=f"Fonction {nom_fonction}",
                    actif=True,
                )

                db.add(fonction)
                db.flush()

            # ------------------------------------------------
            # Permissions
            # ------------------------------------------------

            for code in codes_permissions:

                permission = (
                    db.query(Permission)
                    .filter(
                        Permission.code == code
                    )
                    .first()
                )

                if not permission:
                    print(
                        f"Permission introuvable : {code}"
                    )
                    continue

                association = (
                    db.query(FonctionPermission)
                    .filter(
                        FonctionPermission.fonction_id
                        == fonction.id,

                        FonctionPermission.permission_id
                        == permission.id,
                    )
                    .first()
                )

                if not association:

                    db.add(
                        FonctionPermission(
                            fonction_id=fonction.id,
                            permission_id=permission.id,
                        )
                    )

        db.commit()

        print(
            "Fonctions et permissions initialisées avec succès."
        )

    finally:
        db.close()


if __name__ == "__main__":
    seed_fonctions()