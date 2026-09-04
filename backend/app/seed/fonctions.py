from app.core.database import SessionLocal
from app.models.fonction import Fonction
from app.models.permission import Permission
from app.models.fonction_permission import FonctionPermission


# ============================================================
# DÉFINITION DES FONCTIONS ET DE LEURS PERMISSIONS
# ============================================================

FONCTIONS = {
    # ========================================================
    # ADMINISTRATEUR
    # ========================================================
    "ADMINISTRATEUR": {
        "nom": "ADMINISTRATEUR",
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
            "FINANCE_CONSULTER",
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

    # ========================================================
    # SECRÉTAIRE GÉNÉRAL
    # ========================================================
    "SG": {
        "nom": "SG",
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
            "FINANCE_CONSULTER",
            "DASHBOARD_CONSULTER",
        ],
    },

    # ========================================================
    # ADJOINT SECRÉTAIRE GÉNÉRAL
    # ========================================================
    "ADJOINT_SG": {
        "nom": "ADJOINT_SG",
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

    # ========================================================
    # DIEUWRIGNE
    # ========================================================
    "DIEUWRIGNE": {
        "nom": "DIEUWRIGNE",
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
            "FINANCE_CONSULTER",
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
            "DEPENSE_CREER",
            "DEPENSE_MODIFIER",
            "DEPENSE_SUPPRIMER",
            "AIDE_EXTERIEURE_CONSULTER",
            "AIDE_EXTERIEURE_CREER",
            "AIDE_EXTERIEURE_MODIFIER",
            "AIDE_EXTERIEURE_SUPPRIMER",
            "KOUREL_CONSULTER",
        ],
    },

    # ========================================================
    # ADJOINT RESPONSABLE FINANCIER
    # ========================================================
    "ADJOINT_FINANCIER": {
        "nom": "ADJOINT_FINANCIER",
        "description": "Adjoint au responsable financier",
        "permissions": [
            "MEMBRE_CONSULTER",
            "COTISATION_CREER",
            "COTISATION_CONSULTER",
            "PAIEMENT_CREER",
            "PAIEMENT_CONSULTER",
            "COMMUNICATION_CONSULTER",
            "PROFIL_MODIFIER",
            "FINANCE_CONSULTER",
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

    # ========================================================
    # MEMBRE
    # ========================================================
    "MEMBRE": {
        "nom": "MEMBRE",
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

    # ========================================================
    # RESPONSABLE FINANCIER
    # ========================================================
    "RESPONSABLE_FINANCIER": {
        "nom": "RESPONSABLE_FINANCIER",
        "description": "Responsable de la gestion financière du Dahira",
        "permissions": [
            "MEMBRE_CONSULTER",
            "COTISATION_CREER",
            "COTISATION_CONSULTER",
            "PAIEMENT_CREER",
            "PAIEMENT_CONSULTER",
            "PROFIL_MODIFIER",
            "FINANCE_CONSULTER",
            "DASHBOARD_CONSULTER",
            "COTISATION_ENREGISTRER",
            "COTISATION_MODIFIER",
            "PAIEMENT_ENREGISTRER",
            "PAIEMENT_MODIFIER",
            "NOTIFICATION_CONSULTER",
            "DEPENSE_CONSULTER",
            "DEPENSE_CREER",
            "DEPENSE_MODIFIER",
            "DEPENSE_SUPPRIMER",
            "AIDE_EXTERIEURE_CONSULTER",
            "AIDE_EXTERIEURE_CREER",
            "AIDE_EXTERIEURE_MODIFIER",
            "AIDE_EXTERIEURE_SUPPRIMER",
            "KOUREL_CONSULTER",
        ],
    },

    # ========================================================
    # RESPONSABLE COMMUNICATION
    # ========================================================
    "RESPONSABLE_COMMUNICATION": {
        "nom": "RESPONSABLE_COMMUNICATION",
        "description": "Responsable de la communication du Dahira",
        "permissions": [
            "COTISATION_CONSULTER",
            "PAIEMENT_CONSULTER",
            "FINANCE_CONSULTER",
            "DASHBOARD_CONSULTER",
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

    # ========================================================
    # ADJOINT COMMUNICATION
    # ========================================================
    "ADJOINT_COMMUNICATION": {
        "nom": "ADJOINT_COMMUNICATION",
        "description": "Adjoint du responsable de la communication",
        "permissions": [
            "COTISATION_CONSULTER",
            "PAIEMENT_CONSULTER",
            "FINANCE_CONSULTER",
            "DASHBOARD_CONSULTER",
            "COMMUNICATION_CREER",
            "COMMUNICATION_CONSULTER",
            "COMMUNICATION_MODIFIER",
            "NOTIFICATION_CONSULTER",
            "KOUREL_CONSULTER",
        ],
    },

    # ========================================================
    # RESPONSABLE RELATION EXTÉRIEUR
    # ========================================================
    "RESPONSABLE_RELATION_EXTERIEUR": {
        "nom": "RESPONSABLE_RELATION_EXTERIEUR",
        "description": "Responsable des relations extérieures du Dahira",
        "permissions": [
            "COTISATION_CONSULTER",
            "PAIEMENT_CONSULTER",
            "PROFIL_MODIFIER",
            "FINANCE_CONSULTER",
            "DASHBOARD_CONSULTER",
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

    # ========================================================
    # ADJOINT RELATION EXTÉRIEUR
    # ========================================================
    "ADJOINT_RELATION_EXTERIEUR": {
        "nom": "ADJOINT_RELATION_EXTERIEUR",
        "description": "Adjoint des relations extérieures",
        "permissions": [
            "COTISATION_CONSULTER",
            "PAIEMENT_CONSULTER",
            "PROFIL_MODIFIER",
            "FINANCE_CONSULTER",
            "DASHBOARD_CONSULTER",
            "NOTIFICATION_CONSULTER",
            "KOUREL_CONSULTER",
            "RELATION_EXTERIEUR_CONSULTER",
            "RELATION_EXTERIEUR_CREER",
            "RELATION_EXTERIEUR_MODIFIER",
        ],
    },

    # ========================================================
    # RESPONSABLE ORGANISATION
    # ========================================================
    "RESPONSABLE_ORGANISATION": {
        "nom": "RESPONSABLE_ORGANISATION",
        "description": "Responsable de l'organisation des activités du Dahira",
        "permissions": [
            "COTISATION_CONSULTER",
            "PAIEMENT_CONSULTER",
            "FINANCE_CONSULTER",
            "DASHBOARD_CONSULTER",
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

    # ========================================================
    # ADJOINT ORGANISATION
    # ========================================================
    "ADJOINT_ORGANISATION": {
        "nom": "ADJOINT_ORGANISATION",
        "description": "Adjoint au responsable de l'organisation",
        "permissions": [
            "COTISATION_CONSULTER",
            "PAIEMENT_CONSULTER",
            "FINANCE_CONSULTER",
            "DASHBOARD_CONSULTER",
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
# INITIALISATION DES FONCTIONS
# ============================================================

def seed_fonctions():
    db = SessionLocal()

    try:
        # ----------------------------------------------------
        # Récupérer toutes les permissions nécessaires
        # ----------------------------------------------------
        codes_requis = set()

        for fonction_data in FONCTIONS.values():
            codes_requis.update(fonction_data["permissions"])

        permissions_db = (
            db.query(Permission)
            .filter(Permission.code.in_(codes_requis))
            .all()
        )

        permissions_par_code = {
            permission.code: permission
            for permission in permissions_db
        }

        # ----------------------------------------------------
        # Vérifier les permissions manquantes
        # ----------------------------------------------------
        permissions_manquantes = (
            codes_requis - set(permissions_par_code.keys())
        )

        if permissions_manquantes:
            raise RuntimeError(
                "Permissions manquantes en base de données : "
                + ", ".join(sorted(permissions_manquantes))
            )

        fonctions_creees = 0
        fonctions_mises_a_jour = 0
        associations_creees = 0
        associations_supprimees = 0

        # ----------------------------------------------------
        # Synchronisation
        # ----------------------------------------------------
        for code_fonction, fonction_data in FONCTIONS.items():

            nom = fonction_data["nom"]

            fonction = (
                db.query(Fonction)
                .filter(Fonction.nom == nom)
                .first()
            )

            # ------------------------------------------------
            # Création
            # ------------------------------------------------
            if fonction is None:
                fonction = Fonction(
                    nom=nom,
                    description=fonction_data["description"],
                    actif=True,
                )

                db.add(fonction)
                db.flush()

                fonctions_creees += 1

            # ------------------------------------------------
            # Mise à jour
            # ------------------------------------------------
            else:
                fonction.description = fonction_data["description"]
                fonction.actif = True

                fonctions_mises_a_jour += 1

            # ------------------------------------------------
            # Permissions attendues
            # ------------------------------------------------
            permissions_attendues = {
                permissions_par_code[code]
                for code in fonction_data["permissions"]
            }

            permissions_attendues_ids = {
                permission.id
                for permission in permissions_attendues
            }

            # ------------------------------------------------
            # Associations existantes
            # ------------------------------------------------
            associations_existantes = (
                db.query(FonctionPermission)
                .filter(
                    FonctionPermission.fonction_id == fonction.id
                )
                .all()
            )

            associations_existantes_ids = {
                association.permission_id
                for association in associations_existantes
            }

            # ------------------------------------------------
            # Supprimer les anciennes permissions
            # ------------------------------------------------
            for association in associations_existantes:
                if association.permission_id not in permissions_attendues_ids:
                    db.delete(association)
                    associations_supprimees += 1

            # ------------------------------------------------
            # Ajouter les nouvelles permissions
            # ------------------------------------------------
            for permission in permissions_attendues:
                if permission.id not in associations_existantes_ids:
                    db.add(
                        FonctionPermission(
                            fonction_id=fonction.id,
                            permission_id=permission.id,
                        )
                    )

                    associations_creees += 1

        # ----------------------------------------------------
        # Validation
        # ----------------------------------------------------
        db.commit()

        print()
        print("=" * 60)
        print("SEED DES FONCTIONS TERMINÉ")
        print("=" * 60)
        print(f"Fonctions définies        : {len(FONCTIONS)}")
        print(f"Fonctions créées          : {fonctions_creees}")
        print(f"Fonctions mises à jour    : {fonctions_mises_a_jour}")
        print(f"Associations créées       : {associations_creees}")
        print(f"Associations supprimées   : {associations_supprimees}")
        print("=" * 60)

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


# ============================================================
# EXÉCUTION DIRECTE
# ============================================================

if __name__ == "__main__":
    seed_fonctions()