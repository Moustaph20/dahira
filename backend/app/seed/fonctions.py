from app.core.database import SessionLocal
from app.models.fonction import Fonction
from app.models.permission import Permission
from app.models.fonction_permission import FonctionPermission


# ============================================================
# FONCTIONS ET LEURS PERMISSIONS
# ============================================================

FONCTIONS = {
    "ADMINISTRATEUR": {
        "nom": "Administrateur",
        "description": "Administrateur du système",
        "permissions": [
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
            "DASHBOARD_CONSULTER",
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
            "COMMUNICATION_MODIFIER",
            "COMMUNICATION_SUPPRIMER",
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
            "DEPENSE_CONSULTER",
            "AIDE_EXTERIEURE_CONSULTER",
            "KOUREL_CONSULTER",
            "KOUREL_CREER",
            "KOUREL_MODIFIER",
            "KOUREL_SUPPRIMER",
            "GALERIE_CONSULTER",
            "GALERIE_CREER",
            "GALERIE_MODIFIER",
            "GALERIE_SUPPRIMER",
        ],
    },

    "SG": {
        "nom": "Secrétaire Général",
        "description": "Secrétaire Général",
        "permissions": [
            "MEMBRE_CREER",
            "MEMBRE_MODIFIER",
            "MEMBRE_CONSULTER",
            "UTILISATEUR_CREER",
            "UTILISATEUR_MODIFIER",
            "COTISATION_CONSULTER",
            "PAIEMENT_CONSULTER",
            "REUNION_GERER",
            "PROGRAMME_GERER",
            "COMMUNICATION_CREER",
            "COMMUNICATION_CONSULTER",
            "PROFIL_MODIFIER",
            "MEMBRE_DESACTIVER",
            "REUNION_CONSULTER",
            "REUNION_CREER",
            "REUNION_MODIFIER",
            "PROGRAMME_CONSULTER",
            "EVENEMENT_CONSULTER",
            "EVENEMENT_CREER",
            "EVENEMENT_MODIFIER",
            "NOTIFICATION_CONSULTER",
            "DEPENSE_CONSULTER",
            "AIDE_EXTERIEURE_CONSULTER",
            "KOUREL_CONSULTER",
            "KOUREL_CREER",
            "KOUREL_MODIFIER",
            "KOUREL_SUPPRIMER",
        ],
    },

    "ADJOINT_SG": {
        "nom": "Adjoint au Secrétaire Général",
        "description": "Adjoint au Secrétaire Général",
        "permissions": [
            "MEMBRE_CREER",
            "MEMBRE_MODIFIER",
            "MEMBRE_CONSULTER",
            "UTILISATEUR_CREER",
            "UTILISATEUR_MODIFIER",
            "COTISATION_CONSULTER",
            "PAIEMENT_CONSULTER",
            "REUNION_GERER",
            "COMMUNICATION_CONSULTER",
            "PROFIL_MODIFIER",
            "REUNION_CONSULTER",
            "REUNION_CREER",
            "REUNION_MODIFIER",
            "PROGRAMME_CONSULTER",
            "EVENEMENT_CONSULTER",
            "NOTIFICATION_CONSULTER",
            "KOUREL_CONSULTER",
            "KOUREL_CREER",
            "KOUREL_MODIFIER",
            "KOUREL_SUPPRIMER",
        ],
    },

    "DIEUWRIGNE": {
        "nom": "Dieuwrigne",
        "description": "Responsable général du Dahira",
        "permissions": [
            "MEMBRE_CREER",
            "MEMBRE_MODIFIER",
            "MEMBRE_CONSULTER",
            "COTISATION_CREER",
            "COTISATION_CONSULTER",
            "PAIEMENT_CREER",
            "PAIEMENT_CONSULTER",
            "COMMUNICATION_CONSULTER",
            "PROFIL_MODIFIER",
            "DASHBOARD_CONSULTER",
            "MEMBRE_DESACTIVER",
            "COTISATION_ENREGISTRER",
            "COTISATION_MODIFIER",
            "PAIEMENT_ENREGISTRER",
            "PAIEMENT_MODIFIER",
            "REUNION_CONSULTER",
            "REUNION_CREER",
            "REUNION_MODIFIER",
            "PROGRAMME_CONSULTER",
            "PROGRAMME_CREER",
            "PROGRAMME_MODIFIER",
            "PROGRAMME_VALIDER",
            "EVENEMENT_CONSULTER",
            "EVENEMENT_CREER",
            "EVENEMENT_MODIFIER",
            "NOTIFICATION_CONSULTER",
            "NOTIFICATION_CREER",
            "DEPENSE_CONSULTER",
            "AIDE_EXTERIEURE_CONSULTER",
            "KOUREL_CONSULTER",
            "AIDE_EXTERIEURE_CREER",
            "AIDE_EXTERIEURE_MODIFIER",
            "AIDE_EXTERIEURE_SUPPRIMER",
            "DEPENSE_CREER",
            "DEPENSE_MODIFIER",
            "DEPENSE_SUPPRIMER",
        ],
    },

    "ADJOINT_FINANCIER": {
        "nom": "Adjoint au responsable financier",
        "description": "Adjoint au responsable financier",
        "permissions": [
            "MEMBRE_CONSULTER",
            "COTISATION_CREER",
            "COTISATION_CONSULTER",
            "PAIEMENT_CREER",
            "PAIEMENT_CONSULTER",
            "COMMUNICATION_CONSULTER",
            "PROFIL_MODIFIER",
            "DASHBOARD_CONSULTER",
            "COTISATION_ENREGISTRER",
            "COTISATION_MODIFIER",
            "PAIEMENT_ENREGISTRER",
            "PAIEMENT_MODIFIER",
            "NOTIFICATION_CONSULTER",
            "DEPENSE_CONSULTER",
            "AIDE_EXTERIEURE_CONSULTER",
            "KOUREL_CONSULTER",
        ],
    },

    "MEMBRE": {
        "nom": "Membre",
        "description": "Membre cotisant",
        "permissions": [
            "COTISATION_CONSULTER",
            "PAIEMENT_CONSULTER",
            "COMMUNICATION_CONSULTER",
            "PROFIL_MODIFIER",
            "REUNION_CONSULTER",
            "PROGRAMME_CONSULTER",
            "EVENEMENT_CONSULTER",
            "NOTIFICATION_CONSULTER",
            "KOUREL_CONSULTER",
        ],
    },

    "RESPONSABLE_FINANCIER": {
        "nom": "Responsable Financier",
        "description": "Responsable de la gestion financière du Dahira",
        "permissions": [
            "MEMBRE_CONSULTER",
            "COTISATION_CREER",
            "COTISATION_CONSULTER",
            "PAIEMENT_CREER",
            "PAIEMENT_CONSULTER",
            "PROFIL_MODIFIER",
            "DASHBOARD_CONSULTER",
            "COTISATION_ENREGISTRER",
            "COTISATION_MODIFIER",
            "PAIEMENT_ENREGISTRER",
            "PAIEMENT_MODIFIER",
            "NOTIFICATION_CONSULTER",
            "DEPENSE_CONSULTER",
            "AIDE_EXTERIEURE_CONSULTER",
            "KOUREL_CONSULTER",
            "AIDE_EXTERIEURE_CREER",
            "AIDE_EXTERIEURE_MODIFIER",
            "AIDE_EXTERIEURE_SUPPRIMER",
            "DEPENSE_CREER",
            "DEPENSE_MODIFIER",
            "DEPENSE_SUPPRIMER",
        ],
    },

    "RESPONSABLE_COMMUNICATION": {
        "nom": "Responsable Communication",
        "description": "Responsable de la communication du Dahira",
        "permissions": [
            "COTISATION_CONSULTER",
            "PAIEMENT_CONSULTER",
            "COMMUNICATION_CREER",
            "COMMUNICATION_CONSULTER",
            "COMMUNICATION_MODIFIER",
            "COMMUNICATION_SUPPRIMER",
            "NOTIFICATION_CONSULTER",
            "NOTIFICATION_CREER",
            "DEPENSE_CONSULTER",
            "AIDE_EXTERIEURE_CONSULTER",
            "KOUREL_CONSULTER",
        ],
    },

    "ADJOINT_COMMUNICATION": {
        "nom": "Adjoint Communication",
        "description": "Adjoint du responsable de la communication",
        "permissions": [
            "COTISATION_CONSULTER",
            "PAIEMENT_CONSULTER",
            "COMMUNICATION_CREER",
            "COMMUNICATION_CONSULTER",
            "COMMUNICATION_MODIFIER",
            "NOTIFICATION_CONSULTER",
            "KOUREL_CONSULTER",
        ],
    },

    "RESPONSABLE_RELATION_EXTERIEUR": {
        "nom": "Responsable Relation Extérieur",
        "description": "Responsable des relations extérieures du Dahira",
        "permissions": [
            "COTISATION_CONSULTER",
            "PAIEMENT_CONSULTER",
            "PROFIL_MODIFIER",
            "NOTIFICATION_CONSULTER",
            "DEPENSE_CONSULTER",
            "AIDE_EXTERIEURE_CONSULTER",
            "KOUREL_CONSULTER",
            "RELATION_EXTERIEUR_CONSULTER",
            "RELATION_EXTERIEUR_CREER",
            "RELATION_EXTERIEUR_MODIFIER",
            "RELATION_EXTERIEUR_SUPPRIMER",
        ],
    },

    "ADJOINT_RELATION_EXTERIEUR": {
        "nom": "Adjoint Relation Extérieur",
        "description": "Adjoint des relations extérieures",
        "permissions": [
            "COTISATION_CONSULTER",
            "PAIEMENT_CONSULTER",
            "PROFIL_MODIFIER",
            "NOTIFICATION_CONSULTER",
            "KOUREL_CONSULTER",
            "RELATION_EXTERIEUR_CONSULTER",
            "RELATION_EXTERIEUR_CREER",
            "RELATION_EXTERIEUR_MODIFIER",
        ],
    },

    "RESPONSABLE_ORGANISATION": {
        "nom": "Responsable Organisation",
        "description": "Responsable de l'organisation des activités du Dahira",
        "permissions": [
            "COTISATION_CONSULTER",
            "PAIEMENT_CONSULTER",
            "REUNION_CONSULTER",
            "REUNION_CREER",
            "REUNION_MODIFIER",
            "REUNION_SUPPRIMER",
            "PROGRAMME_CONSULTER",
            "EVENEMENT_CONSULTER",
            "EVENEMENT_CREER",
            "EVENEMENT_MODIFIER",
            "EVENEMENT_SUPPRIMER",
            "NOTIFICATION_CONSULTER",
            "DEPENSE_CONSULTER",
            "AIDE_EXTERIEURE_CONSULTER",
            "KOUREL_CONSULTER",
        ],
    },

    "ADJOINT_ORGANISATION": {
        "nom": "Adjoint Organisation",
        "description": "Adjoint au responsable de l'organisation",
        "permissions": [
            "COTISATION_CONSULTER",
            "PAIEMENT_CONSULTER",
            "REUNION_CONSULTER",
            "REUNION_CREER",
            "REUNION_MODIFIER",
            "PROGRAMME_CONSULTER",
            "EVENEMENT_CONSULTER",
            "NOTIFICATION_CONSULTER",
            "KOUREL_CONSULTER",
        ],
    },
}


# ============================================================
# INITIALISATION
# ============================================================

# ============================================================
# INITIALISATION
# ============================================================

def seed_fonctions():
    db = SessionLocal()

    try:
        created = 0
        updated = 0
        associations_creees = 0
        associations_supprimees = 0

        # ----------------------------------------------------
        # Vérifier que toutes les permissions existent
        # ----------------------------------------------------

        codes_requis = set()

        for data in FONCTIONS.values():
            codes_requis.update(data["permissions"])

        permissions_db = (
            db.query(Permission)
            .filter(Permission.code.in_(codes_requis))
            .all()
        )

        permissions_by_code = {
            permission.code: permission
            for permission in permissions_db
        }

        permissions_manquantes = (
            codes_requis - permissions_by_code.keys()
        )

        if permissions_manquantes:
            raise RuntimeError(
                "Permissions manquantes dans la base :\n"
                + "\n".join(sorted(permissions_manquantes))
                + "\n\n"
                "Exécute d'abord : python -m app.seed.permissions"
            )

        # ----------------------------------------------------
        # Créer / mettre à jour les fonctions
        # ----------------------------------------------------

        for code, data in FONCTIONS.items():

            # Le modèle Fonction ne possède pas de colonne "code".
            # Le nom est donc utilisé comme identifiant unique.
            fonction = (
                db.query(Fonction)
                .filter(Fonction.nom == data["nom"])
                .first()
            )

            if fonction:
                fonction.description = data["description"]
                fonction.actif = True

                updated += 1

            else:
                fonction = Fonction(
                    nom=data["nom"],
                    description=data["description"],
                    actif=True,
                )

                db.add(fonction)
                db.flush()

                created += 1

            # ------------------------------------------------
            # Synchroniser les permissions de la fonction
            # ------------------------------------------------

            permissions_voulues = {
                permissions_by_code[permission_code].id
                for permission_code in data["permissions"]
            }

            associations_existantes = (
                db.query(FonctionPermission)
                .filter(
                    FonctionPermission.fonction_id == fonction.id
                )
                .all()
            )

            permissions_existantes = {
                association.permission_id: association
                for association in associations_existantes
            }

            # -----------------------------------------------
            # Supprimer les anciennes permissions
            # qui ne sont plus présentes dans FONCTIONS
            # -----------------------------------------------

            for permission_id, association in permissions_existantes.items():

                if permission_id not in permissions_voulues:
                    db.delete(association)
                    associations_supprimees += 1

            # -----------------------------------------------
            # Ajouter les nouvelles permissions
            # -----------------------------------------------

            for permission_id in permissions_voulues:

                if permission_id not in permissions_existantes:
                    association = FonctionPermission(
                        fonction_id=fonction.id,
                        permission_id=permission_id,
                    )

                    db.add(association)
                    associations_creees += 1

        db.commit()

        print()
        print("=" * 60)
        print("INITIALISATION DES FONCTIONS")
        print("=" * 60)
        print(f"Fonctions définies            : {len(FONCTIONS)}")
        print(f"Fonctions créées              : {created}")
        print(f"Fonctions mises à jour        : {updated}")
        print(f"Associations créées           : {associations_creees}")
        print(f"Associations supprimées       : {associations_supprimees}")
        print("=" * 60)
        print("Initialisation terminée avec succès.")
        print("=" * 60)
        print()

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_fonctions()