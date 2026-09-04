from app.core.database import SessionLocal
from app.models.permission import Permission


# ============================================================
# LISTE DES 67 PERMISSIONS
# ============================================================

PERMISSIONS = [

    # ========================================================
    # TABLEAU DE BORD
    # ========================================================

    {
        "code": "DASHBOARD_CONSULTER",
        "nom": "Consulter le tableau de bord",
        "description": "Permet de consulter le tableau de bord administratif",
    },

    # ========================================================
    # MEMBRES
    # ========================================================

    {
        "code": "MEMBRE_CONSULTER",
        "nom": "Consulter les membres",
        "description": "Permet de consulter les membres",
    },
    {
        "code": "MEMBRE_CREER",
        "nom": "CrÃ©er un membre",
        "description": "Permet de crÃ©er un membre",
    },
    {
        "code": "MEMBRE_MODIFIER",
        "nom": "Modifier un membre",
        "description": "Permet de modifier un membre",
    },
    {
        "code": "MEMBRE_DESACTIVER",
        "nom": "DÃ©sactiver un membre",
        "description": "Permet de dÃ©sactiver un membre",
    },

    # ========================================================
    # UTILISATEURS
    # ========================================================

    {
        "code": "UTILISATEUR_CONSULTER",
        "nom": "Consulter les utilisateurs",
        "description": "Permet de consulter les utilisateurs",
    },
    {
        "code": "UTILISATEUR_CREER",
        "nom": "CrÃ©er un utilisateur",
        "description": "Permet de crÃ©er un utilisateur",
    },
    {
        "code": "UTILISATEUR_MODIFIER",
        "nom": "Modifier un utilisateur",
        "description": "Permet de modifier un utilisateur",
    },
    {
        "code": "UTILISATEUR_DESACTIVER",
        "nom": "DÃ©sactiver un utilisateur",
        "description": "Permet de dÃ©sactiver un utilisateur",
    },

    # ========================================================
    # COTISATIONS
    # ========================================================

    {
        "code": "COTISATION_CONSULTER",
        "nom": "Consulter les cotisations",
        "description": "Permet de consulter les cotisations",
    },
    {
        "code": "COTISATION_CREER",
        "nom": "CrÃ©er une cotisation",
        "description": "Permet de crÃ©er une cotisation",
    },
    {
        "code": "COTISATION_ENREGISTRER",
        "nom": "Enregistrer une cotisation",
        "description": "Permet d'enregistrer une cotisation",
    },
    {
        "code": "COTISATION_MODIFIER",
        "nom": "Modifier une cotisation",
        "description": "Permet de modifier une cotisation",
    },

    # ========================================================
    # PAIEMENTS
    # ========================================================

    {
        "code": "PAIEMENT_CONSULTER",
        "nom": "Consulter les paiements",
        "description": "Permet de consulter les paiements",
    },
    {
        "code": "PAIEMENT_CREER",
        "nom": "CrÃ©er un paiement",
        "description": "Permet de crÃ©er un paiement",
    },
    {
        "code": "PAIEMENT_ENREGISTRER",
        "nom": "Enregistrer un paiement",
        "description": "Permet d'enregistrer un paiement",
    },
    {
        "code": "PAIEMENT_MODIFIER",
        "nom": "Modifier un paiement",
        "description": "Permet de modifier un paiement",
    },

    # ========================================================
    # RÃ‰UNIONS
    # ========================================================

    {
        "code": "REUNION_CONSULTER",
        "nom": "Consulter les rÃ©unions",
        "description": "Permet de consulter les rÃ©unions",
    },
    {
        "code": "REUNION_CREER",
        "nom": "CrÃ©er une rÃ©union",
        "description": "Permet de crÃ©er une rÃ©union",
    },
    {
        "code": "REUNION_MODIFIER",
        "nom": "Modifier une rÃ©union",
        "description": "Permet de modifier une rÃ©union",
    },
    {
        "code": "REUNION_SUPPRIMER",
        "nom": "Supprimer une rÃ©union",
        "description": "Permet de supprimer une rÃ©union",
    },
    {
        "code": "REUNION_GERER",
        "nom": "GÃ©rer les rÃ©unions",
        "description": "Permet de gÃ©rer les rÃ©unions du Dahira",
    },

    # ========================================================
    # PROGRAMMES RELIGIEUX
    # ========================================================

    {
        "code": "PROGRAMME_CONSULTER",
        "nom": "Consulter les programmes",
        "description": "Permet de consulter les programmes religieux",
    },
    {
        "code": "PROGRAMME_CREER",
        "nom": "CrÃ©er un programme",
        "description": "Permet de crÃ©er un programme religieux",
    },
    {
        "code": "PROGRAMME_MODIFIER",
        "nom": "Modifier un programme",
        "description": "Permet de modifier un programme religieux",
    },
    {
        "code": "PROGRAMME_VALIDER",
        "nom": "Valider un programme",
        "description": "Permet de valider un programme religieux",
    },
    {
        "code": "PROGRAMME_GERER",
        "nom": "GÃ©rer les programmes",
        "description": "Permet de gÃ©rer les programmes religieux",
    },

    # ========================================================
    # KHASSIDAS
    # ========================================================

    {
        "code": "KHASSIDA_CONSULTER",
        "nom": "Consulter les Khassidas",
        "description": "Permet de consulter les Khassidas",
    },
    {
        "code": "KHASSIDA_CREER",
        "nom": "CrÃ©er une Khassida",
        "description": "Permet d'ajouter une Khassida",
    },
    {
        "code": "KHASSIDA_MODIFIER",
        "nom": "Modifier une Khassida",
        "description": "Permet de modifier une Khassida",
    },
    {
        "code": "KHASSIDA_PROGRAMMER",
        "nom": "Programmer une Khassida",
        "description": "Permet de programmer une Khassida",
    },

    # ========================================================
    # KOUREL
    # ========================================================

    {
        "code": "KOUREL_CONSULTER",
        "nom": "Consulter les Kourels",
        "description": "Permet de consulter les Kourels",
    },
    {
        "code": "KOUREL_CREER",
        "nom": "CrÃ©er un Kourel",
        "description": "Permet de crÃ©er un Kourel",
    },
    {
        "code": "KOUREL_MODIFIER",
        "nom": "Modifier un Kourel",
        "description": "Permet de modifier un Kourel",
    },
    {
        "code": "KOUREL_SUPPRIMER",
        "nom": "Supprimer un Kourel",
        "description": "Permet de supprimer un Kourel",
    },

    # ========================================================
    # COMMUNICATIONS
    # ========================================================

    {
        "code": "COMMUNICATION_CONSULTER",
        "nom": "Consulter les communications",
        "description": "Permet de consulter les communications",
    },
    {
        "code": "COMMUNICATION_CREER",
        "nom": "CrÃ©er une communication",
        "description": "Permet de crÃ©er une communication",
    },
    {
        "code": "COMMUNICATION_MODIFIER",
        "nom": "Modifier une communication",
        "description": "Permet de modifier une communication",
    },
    {
        "code": "COMMUNICATION_SUPPRIMER",
        "nom": "Supprimer une communication",
        "description": "Permet de supprimer une communication",
    },

    # ========================================================
    # Ã‰VÃ‰NEMENTS
    # ========================================================

    {
        "code": "EVENEMENT_CONSULTER",
        "nom": "Consulter les Ã©vÃ©nements",
        "description": "Permet de consulter les Ã©vÃ©nements",
    },
    {
        "code": "EVENEMENT_CREER",
        "nom": "CrÃ©er un Ã©vÃ©nement",
        "description": "Permet de crÃ©er un Ã©vÃ©nement",
    },
    {
        "code": "EVENEMENT_MODIFIER",
        "nom": "Modifier un Ã©vÃ©nement",
        "description": "Permet de modifier un Ã©vÃ©nement",
    },
    {
        "code": "EVENEMENT_SUPPRIMER",
        "nom": "Supprimer un Ã©vÃ©nement",
        "description": "Permet de supprimer un Ã©vÃ©nement",
    },

    # ========================================================
    # NOTIFICATIONS
    # ========================================================

    {
        "code": "NOTIFICATION_CONSULTER",
        "nom": "Consulter les notifications",
        "description": "Permet de consulter les notifications",
    },
    {
        "code": "NOTIFICATION_CREER",
        "nom": "CrÃ©er une notification",
        "description": "Permet de crÃ©er une notification",
    },

    # ========================================================
    # FONCTIONS
    # ========================================================

    {
        "code": "FONCTION_CONSULTER",
        "nom": "Consulter les fonctions",
        "description": "Permet de consulter les fonctions",
    },
    {
        "code": "FONCTION_CREER",
        "nom": "CrÃ©er une fonction",
        "description": "Permet de crÃ©er une fonction",
    },
    {
        "code": "FONCTION_MODIFIER",
        "nom": "Modifier une fonction",
        "description": "Permet de modifier une fonction",
    },

    # ========================================================
    # PERMISSIONS
    # ========================================================

    {
        "code": "PERMISSION_CONSULTER",
        "nom": "Consulter les permissions",
        "description": "Permet de consulter les permissions",
    },
    {
        "code": "PERMISSION_MODIFIER",
        "nom": "Modifier les permissions",
        "description": "Permet de modifier les permissions",
    },

    # ========================================================
    # DÃ‰PENSES
    # ========================================================

    {
        "code": "DEPENSE_CONSULTER",
        "nom": "Consulter les dÃ©penses",
        "description": "Permet de consulter les dÃ©penses",
    },
    {
        "code": "DEPENSE_CREER",
        "nom": "CrÃ©er une dÃ©pense",
        "description": "Permet d'enregistrer une dÃ©pense",
    },
    {
        "code": "DEPENSE_MODIFIER",
        "nom": "Modifier une dÃ©pense",
        "description": "Permet de modifier une dÃ©pense",
    },
    {
        "code": "DEPENSE_SUPPRIMER",
        "nom": "Supprimer une dÃ©pense",
        "description": "Permet de supprimer une dÃ©pense",
    },
    {
    "code": "PROFIL_MODIFIER",
    "nom": "Modifier son profil",
    "description": "Permet de modifier les informations de son profil",
    },

    # ========================================================
    # AIDES EXTÃ‰RIEURES
    # ========================================================

    {
        "code": "AIDE_EXTERIEURE_CONSULTER",
        "nom": "Consulter les aides extÃ©rieures",
        "description": "Permet de consulter les aides extÃ©rieures",
    },
    {
        "code": "AIDE_EXTERIEURE_CREER",
        "nom": "CrÃ©er une aide extÃ©rieure",
        "description": "Permet d'enregistrer une aide extÃ©rieure",
    },
    {
        "code": "AIDE_EXTERIEURE_MODIFIER",
        "nom": "Modifier une aide extÃ©rieure",
        "description": "Permet de modifier une aide extÃ©rieure",
    },
    {
        "code": "AIDE_EXTERIEURE_SUPPRIMER",
        "nom": "Supprimer une aide extÃ©rieure",
        "description": "Permet de supprimer une aide extÃ©rieure",
    },

    # ========================================================
    # RELATIONS EXTÃ‰RIEURES
    # ========================================================

    {
        "code": "RELATION_EXTERIEUR_CONSULTER",
        "nom": "Consulter les relations extÃ©rieures",
        "description": "Permet de consulter les relations extÃ©rieures",
    },
    {
        "code": "RELATION_EXTERIEUR_CREER",
        "nom": "CrÃ©er une relation extÃ©rieure",
        "description": "Permet d'enregistrer une relation extÃ©rieure",
    },
    {
        "code": "RELATION_EXTERIEUR_MODIFIER",
        "nom": "Modifier une relation extÃ©rieure",
        "description": "Permet de modifier une relation extÃ©rieure",
    },
    {
        "code": "RELATION_EXTERIEUR_SUPPRIMER",
        "nom": "Supprimer une relation extÃ©rieure",
        "description": "Permet de supprimer une relation extÃ©rieure",
    },

    # ========================================================
    # GALERIE
    # ========================================================

    {
        "code": "GALERIE_CONSULTER",
        "nom": "Consulter la galerie",
        "description": "Permet de consulter la galerie",
    },
    {
        "code": "GALERIE_CREER",
        "nom": "Ajouter un Ã©lÃ©ment Ã  la galerie",
        "description": "Permet d'ajouter un Ã©lÃ©ment Ã  la galerie",
    },
    {
        "code": "GALERIE_MODIFIER",
        "nom": "Modifier un Ã©lÃ©ment de la galerie",
        "description": "Permet de modifier un Ã©lÃ©ment de la galerie",
    },
    {
        "code": "GALERIE_SUPPRIMER",
        "nom": "Supprimer un Ã©lÃ©ment de la galerie",
        "description": "Permet de supprimer un Ã©lÃ©ment de la galerie",
    },


        # ========================================================
    # FINANCES
    # ========================================================

    {
        "code": "FINANCE_CONSULTER",
        "nom": "Consulter les finances",
        "description": "Permet de consulter les finances de la dahira",
    },
]




# ============================================================
# VÃ‰RIFICATION DU NOMBRE DE PERMISSIONS
# ============================================================

EXPECTED_COUNT = 68

if len(PERMISSIONS) != EXPECTED_COUNT:
    raise RuntimeError(
        f"ERREUR : {len(PERMISSIONS)} permissions dÃ©finies "
        f"au lieu de {EXPECTED_COUNT}."
    )


# ============================================================
# INITIALISATION DES PERMISSIONS
# ============================================================

def seed_permissions():
    db = SessionLocal()

    try:
        created = 0
        updated = 0

        for data in PERMISSIONS:

            permission = (
                db.query(Permission)
                .filter(Permission.code == data["code"])
                .first()
            )

            if permission:
                permission.nom = data["nom"]
                permission.description = data["description"]
                permission.actif = True

                updated += 1

            else:
                permission = Permission(
                    code=data["code"],
                    nom=data["nom"],
                    description=data["description"],
                    actif=True,
                )

                db.add(permission)
                created += 1

        db.commit()

        print()
        print("=" * 60)
        print("INITIALISATION DES PERMISSIONS")
        print("=" * 60)
        print(f"Permissions dÃ©finies : {len(PERMISSIONS)}")
        print(f"Permissions crÃ©Ã©es   : {created}")
        print(f"Permissions mises Ã  jour : {updated}")
        print("=" * 60)
        print("Permissions initialisÃ©es avec succÃ¨s.")
        print("=" * 60)
        print()

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


# ============================================================
# EXÃ‰CUTION DIRECTE
# ============================================================

if __name__ == "__main__":
    seed_permissions()
