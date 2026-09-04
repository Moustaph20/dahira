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
        "nom": "Créer un membre",
        "description": "Permet de créer un membre",
    },
    {
        "code": "MEMBRE_MODIFIER",
        "nom": "Modifier un membre",
        "description": "Permet de modifier un membre",
    },
    {
        "code": "MEMBRE_DESACTIVER",
        "nom": "Désactiver un membre",
        "description": "Permet de désactiver un membre",
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
        "nom": "Créer un utilisateur",
        "description": "Permet de créer un utilisateur",
    },
    {
        "code": "UTILISATEUR_MODIFIER",
        "nom": "Modifier un utilisateur",
        "description": "Permet de modifier un utilisateur",
    },
    {
        "code": "UTILISATEUR_DESACTIVER",
        "nom": "Désactiver un utilisateur",
        "description": "Permet de désactiver un utilisateur",
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
        "nom": "Créer une cotisation",
        "description": "Permet de créer une cotisation",
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
        "nom": "Créer un paiement",
        "description": "Permet de créer un paiement",
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
    # RÉUNIONS
    # ========================================================

    {
        "code": "REUNION_CONSULTER",
        "nom": "Consulter les réunions",
        "description": "Permet de consulter les réunions",
    },
    {
        "code": "REUNION_CREER",
        "nom": "Créer une réunion",
        "description": "Permet de créer une réunion",
    },
    {
        "code": "REUNION_MODIFIER",
        "nom": "Modifier une réunion",
        "description": "Permet de modifier une réunion",
    },
    {
        "code": "REUNION_SUPPRIMER",
        "nom": "Supprimer une réunion",
        "description": "Permet de supprimer une réunion",
    },
    {
        "code": "REUNION_GERER",
        "nom": "Gérer les réunions",
        "description": "Permet de gérer les réunions du Dahira",
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
        "nom": "Créer un programme",
        "description": "Permet de créer un programme religieux",
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
        "nom": "Gérer les programmes",
        "description": "Permet de gérer les programmes religieux",
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
        "nom": "Créer une Khassida",
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
        "nom": "Créer un Kourel",
        "description": "Permet de créer un Kourel",
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
        "nom": "Créer une communication",
        "description": "Permet de créer une communication",
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
    # ÉVÉNEMENTS
    # ========================================================

    {
        "code": "EVENEMENT_CONSULTER",
        "nom": "Consulter les événements",
        "description": "Permet de consulter les événements",
    },
    {
        "code": "EVENEMENT_CREER",
        "nom": "Créer un événement",
        "description": "Permet de créer un événement",
    },
    {
        "code": "EVENEMENT_MODIFIER",
        "nom": "Modifier un événement",
        "description": "Permet de modifier un événement",
    },
    {
        "code": "EVENEMENT_SUPPRIMER",
        "nom": "Supprimer un événement",
        "description": "Permet de supprimer un événement",
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
        "nom": "Créer une notification",
        "description": "Permet de créer une notification",
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
        "nom": "Créer une fonction",
        "description": "Permet de créer une fonction",
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
    # DÉPENSES
    # ========================================================

    {
        "code": "DEPENSE_CONSULTER",
        "nom": "Consulter les dépenses",
        "description": "Permet de consulter les dépenses",
    },
    {
        "code": "DEPENSE_CREER",
        "nom": "Créer une dépense",
        "description": "Permet d'enregistrer une dépense",
    },
    {
        "code": "DEPENSE_MODIFIER",
        "nom": "Modifier une dépense",
        "description": "Permet de modifier une dépense",
    },
    {
        "code": "DEPENSE_SUPPRIMER",
        "nom": "Supprimer une dépense",
        "description": "Permet de supprimer une dépense",
    },
    {
    "code": "PROFIL_MODIFIER",
    "nom": "Modifier son profil",
    "description": "Permet de modifier les informations de son profil",
    },

    # ========================================================
    # AIDES EXTÉRIEURES
    # ========================================================

    {
        "code": "AIDE_EXTERIEURE_CONSULTER",
        "nom": "Consulter les aides extérieures",
        "description": "Permet de consulter les aides extérieures",
    },
    {
        "code": "AIDE_EXTERIEURE_CREER",
        "nom": "Créer une aide extérieure",
        "description": "Permet d'enregistrer une aide extérieure",
    },
    {
        "code": "AIDE_EXTERIEURE_MODIFIER",
        "nom": "Modifier une aide extérieure",
        "description": "Permet de modifier une aide extérieure",
    },
    {
        "code": "AIDE_EXTERIEURE_SUPPRIMER",
        "nom": "Supprimer une aide extérieure",
        "description": "Permet de supprimer une aide extérieure",
    },

    # ========================================================
    # RELATIONS EXTÉRIEURES
    # ========================================================

    {
        "code": "RELATION_EXTERIEUR_CONSULTER",
        "nom": "Consulter les relations extérieures",
        "description": "Permet de consulter les relations extérieures",
    },
    {
        "code": "RELATION_EXTERIEUR_CREER",
        "nom": "Créer une relation extérieure",
        "description": "Permet d'enregistrer une relation extérieure",
    },
    {
        "code": "RELATION_EXTERIEUR_MODIFIER",
        "nom": "Modifier une relation extérieure",
        "description": "Permet de modifier une relation extérieure",
    },
    {
        "code": "RELATION_EXTERIEUR_SUPPRIMER",
        "nom": "Supprimer une relation extérieure",
        "description": "Permet de supprimer une relation extérieure",
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
        "nom": "Ajouter un élément à la galerie",
        "description": "Permet d'ajouter un élément à la galerie",
    },
    {
        "code": "GALERIE_MODIFIER",
        "nom": "Modifier un élément de la galerie",
        "description": "Permet de modifier un élément de la galerie",
    },
    {
        "code": "GALERIE_SUPPRIMER",
        "nom": "Supprimer un élément de la galerie",
        "description": "Permet de supprimer un élément de la galerie",
    },
]


# ============================================================
# VÉRIFICATION DU NOMBRE DE PERMISSIONS
# ============================================================

EXPECTED_COUNT = 67

if len(PERMISSIONS) != EXPECTED_COUNT:
    raise RuntimeError(
        f"ERREUR : {len(PERMISSIONS)} permissions définies "
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
        print(f"Permissions définies : {len(PERMISSIONS)}")
        print(f"Permissions créées   : {created}")
        print(f"Permissions mises à jour : {updated}")
        print("=" * 60)
        print("Permissions initialisées avec succès.")
        print("=" * 60)
        print()

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


# ============================================================
# EXÉCUTION DIRECTE
# ============================================================

if __name__ == "__main__":
    seed_permissions()