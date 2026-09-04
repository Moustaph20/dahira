
from app.core.database import SessionLocal

from app.models.fonction import Fonction
from app.models.permission import Permission
from app.models.fonction_permission import FonctionPermission


# ============================================================
# PERMISSIONS PAR FONCTION
# ============================================================

PERMISSIONS_PAR_FONCTION = {

    # ========================================================
    # ADMINISTRATEUR
    # ========================================================

    "ADMINISTRATEUR": [
        "MEMBRE_CONSULTER",
        "MEMBRE_CREER",
        "MEMBRE_MODIFIER",
        "MEMBRE_DESACTIVER",

        "COTISATION_ENREGISTRER",
        "COTISATION_MODIFIER",

        "PAIEMENT_ENREGISTRER",
        "PAIEMENT_MODIFIER",

        "REUNION_CONSULTER",
        "REUNION_CREER",
        "REUNION_MODIFIER",
        "REUNION_SUPPRIMER",

        "PROGRAMME_CONSULTER",
        "PROGRAMME_CREER",
        "PROGRAMME_MODIFIER",
        "PROGRAMME_VALIDER",

        "EVENEMENT_CONSULTER",
        "EVENEMENT_CREER",
        "EVENEMENT_MODIFIER",
        "EVENEMENT_SUPPRIMER",

        "NOTIFICATION_CONSULTER",
        "NOTIFICATION_CREER",

        "UTILISATEUR_CONSULTER",
        "UTILISATEUR_DESACTIVER",

        "FONCTION_CONSULTER",
        "FONCTION_CREER",
        "FONCTION_MODIFIER",

        "PERMISSION_CONSULTER",
        "PERMISSION_MODIFIER",
    ],

    # ========================================================
    # SECRÉTAIRE GÉNÉRAL
    # ========================================================

    "SG": [
        "MEMBRE_CONSULTER",
        "MEMBRE_CREER",
        "MEMBRE_MODIFIER",
        "MEMBRE_DESACTIVER",

        "REUNION_CONSULTER",
        "REUNION_CREER",
        "REUNION_MODIFIER",

        "PROGRAMME_CONSULTER",

        "EVENEMENT_CONSULTER",
        "EVENEMENT_CREER",
        "EVENEMENT_MODIFIER",

        "NOTIFICATION_CONSULTER",
    ],

    # ========================================================
    # ADJOINT SG
    # ========================================================

    "ADJOINT_SG": [
        "MEMBRE_CONSULTER",
        "MEMBRE_CREER",
        "MEMBRE_MODIFIER",

        "REUNION_CONSULTER",
        "REUNION_CREER",
        "REUNION_MODIFIER",

        "PROGRAMME_CONSULTER",

        "EVENEMENT_CONSULTER",

        "NOTIFICATION_CONSULTER",
    ],

    # ========================================================
    # DIEUWRIGNE + FINANCIER
    # ========================================================

    "DIEUWRIGNE_FINANCIER": [
        # Membres
        "MEMBRE_CONSULTER",
        "MEMBRE_CREER",
        "MEMBRE_MODIFIER",
        "MEMBRE_DESACTIVER",

        # Finances
        "COTISATION_ENREGISTRER",
        "COTISATION_MODIFIER",

        "PAIEMENT_ENREGISTRER",
        "PAIEMENT_MODIFIER",

        # Réunions
        "REUNION_CONSULTER",
        "REUNION_CREER",
        "REUNION_MODIFIER",

        # Programme religieux
        "PROGRAMME_CONSULTER",
        "PROGRAMME_CREER",
        "PROGRAMME_MODIFIER",
        "PROGRAMME_VALIDER",

        # Événements
        "EVENEMENT_CONSULTER",
        "EVENEMENT_CREER",
        "EVENEMENT_MODIFIER",

        # Notifications
        "NOTIFICATION_CONSULTER",
        "NOTIFICATION_CREER",
    ],

    # ========================================================
    # ADJOINT FINANCIER
    # ========================================================

    "ADJOINT_FINANCIER": [
        "MEMBRE_CONSULTER",

        "COTISATION_ENREGISTRER",
        "COTISATION_MODIFIER",

        "PAIEMENT_ENREGISTRER",
        "PAIEMENT_MODIFIER",
    ],

    # ========================================================
    # MEMBRE
    # ========================================================

    "MEMBRE": [
        "MEMBRE_CONSULTER",

        "REUNION_CONSULTER",

        "PROGRAMME_CONSULTER",

        "EVENEMENT_CONSULTER",

        "NOTIFICATION_CONSULTER",
    ],
}


# ============================================================
# SEED
# ============================================================

def seed_fonctions_permissions():

    db = SessionLocal()

    try:

        total_crees = 0

        for nom_fonction, codes_permissions in (
            PERMISSIONS_PAR_FONCTION.items()
        ):

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
                print(
                    f"[ERREUR] Fonction introuvable : "
                    f"{nom_fonction}"
                )
                continue

            print()
            print(
                f"Fonction : {nom_fonction}"
            )

            # ------------------------------------------------
            # Permissions
            # ------------------------------------------------

            for code_permission in codes_permissions:

                permission = (
                    db.query(Permission)
                    .filter(
                        Permission.code
                        == code_permission,
                        Permission.actif.is_(True)
                    )
                    .first()
                )

                if not permission:
                    print(
                        f"  [ERREUR] Permission introuvable : "
                        f"{code_permission}"
                    )
                    continue

                # --------------------------------------------
                # Vérifier association
                # --------------------------------------------

                association = (
                    db.query(FonctionPermission)
                    .filter(
                        FonctionPermission.fonction_id
                        == fonction.id,

                        FonctionPermission.permission_id
                        == permission.id
                    )
                    .first()
                )

                if association:
                    print(
                        f"  [OK] {code_permission}"
                    )
                    continue

                # --------------------------------------------
                # Créer association
                # --------------------------------------------

                association = FonctionPermission(
                    fonction_id=fonction.id,
                    permission_id=permission.id
                )

                db.add(association)

                total_crees += 1

                print(
                    f"  [+] {code_permission}"
                )

        db.commit()

        print()
        print("=" * 60)
        print("AFFECTATION DES PERMISSIONS TERMINÉE")
        print("=" * 60)
        print(
            f"Associations créées : {total_crees}"
        )
        print()

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


# ============================================================
# EXECUTION
# ============================================================

if __name__ == "__main__":
    seed_fonctions_permissions()
