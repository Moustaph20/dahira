from getpass import getpass

from app.core.database import SessionLocal
from app.core.security import hasher_mot_de_passe
from app.models.fonction import Fonction
from app.models.membre import Membre
from app.models.utilisateur import Utilisateur
from app.models.utilisateur_fonction import UtilisateurFonction


def create_admin():
    db = SessionLocal()

    try:
        print("=== Création du premier administrateur ===")

        nom = input("Nom : ").strip()
        prenom = input("Prénom : ").strip()
        telephone = input("Téléphone : ").strip()
        lieu = input("Lieu de résidence : ").strip()
        identifiant = input("Identifiant de connexion : ").strip()

        mot_de_passe = getpass("Mot de passe : ")
        confirmation = getpass("Confirmez le mot de passe : ")

        if mot_de_passe != confirmation:
            print("Erreur : les mots de passe ne correspondent pas.")
            return

        fonction = (
            db.query(Fonction)
            .filter(Fonction.nom == "ADMINISTRATEUR")
            .first()
        )

        if not fonction:
            print("Erreur : la fonction ADMINISTRATEUR n'existe pas.")
            return

        membre = Membre(
            nom=nom,
            prenom=prenom,
            telephone=telephone,
            lieu_residence=lieu
        )

        db.add(membre)
        db.flush()

        utilisateur = Utilisateur(
            membre_id=membre.id,
            identifiant=identifiant,
            mot_de_passe_hash=hasher_mot_de_passe(mot_de_passe),
            premiere_connexion=False
        )

        db.add(utilisateur)
        db.flush()

        utilisateur_fonction = UtilisateurFonction(
            utilisateur_id=utilisateur.id,
            fonction_id=fonction.id
        )

        db.add(utilisateur_fonction)

        db.commit()

        print()
        print("Administrateur créé avec succès.")
        print(f"Identifiant : {identifiant}")

    except Exception as e:
        db.rollback()
        print()
        print("Erreur :", e)

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()