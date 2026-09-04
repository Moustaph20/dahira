from app.core.database import SessionLocal

from app.models.permission import Permission


PERMISSIONS = [
    # ========================================================
    # MEMBRES
    # ========================================================

    {
    "code": "DASHBOARD_CONSULTER",
    "nom": "Consulter le tableau de bord",
    "description": "Permet de consulter le tableau de bord administratif"
    },

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
    # COTISATIONS
    # ========================================================

    {
        "code": "COTISATION_CONSULTER",
        "nom": "Consulter les cotisations",
        "description": "Permet de consulter les cotisations",
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

    # ========================================================
    # PROGRAMME RELIGIEUX
    # ========================================================

    {
        "code": "PROGRAMME_CONSULTER",
        "nom": "Consulter le programme religieux",
        "description": "Permet de consulter le programme religieux",
    },
    {
        "code": "PROGRAMME_CREER",
        "nom": "Créer un programme religieux",
        "description": "Permet de créer un programme religieux",
    },
    {
        "code": "PROGRAMME_MODIFIER",
        "nom": "Modifier un programme religieux",
        "description": "Permet de modifier un programme religieux",
    },
    {
        "code": "PROGRAMME_VALIDER",
        "nom": "Valider un programme religieux",
        "description": "Permet de valider un programme religieux",
    },

    # ========================================================
    # KHASSIDA / KOUREL
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
]


def seed_permissions():
    db = SessionLocal()

    try:
        for data in PERMISSIONS:

            permission = (
                db.query(Permission)
                .filter(
                    Permission.code == data["code"]
                )
                .first()
            )

            if permission:
                permission.nom = data["nom"]
                permission.description = data["description"]
                permission.actif = True

            else:
                permission = Permission(
                    code=data["code"],
                    nom=data["nom"],
                    description=data["description"],
                    actif=True,
                )

                db.add(permission)

        db.commit()

        print(
            f"{len(PERMISSIONS)} permissions initialisées."
        )

    finally:
        db.close()


if __name__ == "__main__":
    seed_permissions()