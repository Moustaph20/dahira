from getpass import getpass

from app.core.database import SessionLocal
from app.core.security import hasher_mot_de_passe

from app.models.fonction import Fonction
from app.models.membre import Membre
from app.models.utilisateur import Utilisateur
from app.models.utilisateur_fonction import UtilisateurFonction
from app.models.permission import Permission
from app.models.fonction_permission import FonctionPermission


def create_admin():
    db = SessionLocal()

    try:
        print("=== Création du premier administrateur ===")
        print()

        nom = input("Nom : ").strip()
        prenom = input("Prénom : ").strip()
        telephone = input("Téléphone : ").strip()
        lieu = input("Lieu de résidence : ").strip()
        identifiant = input("Identifiant de connexion : ").strip()

        mot_de_passe = getpass("Mot de passe : ")
        confirmation = getpass("Confirmez le mot de passe : ")

        if mot_de_passe != confirmation:
            print()
            print("Erreur : les mots de passe ne correspondent pas.")
            return

        if not nom or not prenom or not telephone or not lieu or not identifiant:
            print()
            print("Erreur : tous les champs sont obligatoires.")
            return

        # ==========================================================
        # VERIFIER SI L'IDENTIFIANT EXISTE DEJA
        # ==========================================================

        utilisateur_existant = (
            db.query(Utilisateur)
            .filter(Utilisateur.identifiant == identifiant)
            .first()
        )

        if utilisateur_existant:
            print()
            print("Erreur : cet identifiant existe déjà.")
            return

        # ==========================================================
        # VERIFIER SI LE TELEPHONE EXISTE DEJA
        # ==========================================================

        membre_existant = (
            db.query(Membre)
            .filter(Membre.telephone == telephone)
            .first()
        )

        if membre_existant:
            print()
            print("Erreur : ce numéro de téléphone existe déjà.")
            return

        # ==========================================================
        # CREER / RECUPERER LA FONCTION ADMINISTRATEUR
        # ==========================================================

        fonction = (
            db.query(Fonction)
            .filter(Fonction.nom == "ADMINISTRATEUR")
            .first()
        )

        if not fonction:
            fonction = Fonction(
                nom="ADMINISTRATEUR",
                description="Administrateur principal de l'application",
                actif=True,
            )

            db.add(fonction)
            db.flush()

            print()
            print("Fonction ADMINISTRATEUR créée.")

        # ==========================================================
        # CREER LE MEMBRE
        # ==========================================================

        membre = Membre(
            nom=nom,
            prenom=prenom,
            telephone=telephone,
            lieu_residence=lieu,
            montant_cotisation=0,
            actif=True,
        )

        db.add(membre)
        db.flush()

        # ==========================================================
        # CREER L'UTILISATEUR
        # ==========================================================

        utilisateur = Utilisateur(
            membre_id=membre.id,
            identifiant=identifiant,
            mot_de_passe_hash=hasher_mot_de_passe(mot_de_passe),
            premiere_connexion=False,
            actif=True,
        )

        db.add(utilisateur)
        db.flush()

        # ==========================================================
        # LIER UTILISATEUR -> ADMINISTRATEUR
        # ==========================================================

        utilisateur_fonction = UtilisateurFonction(
            utilisateur_id=utilisateur.id,
            fonction_id=fonction.id,
        )

        db.add(utilisateur_fonction)

        # ==========================================================
        # ATTRIBUER TOUTES LES PERMISSIONS EXISTANTES
        # ==========================================================

        permissions = db.query(Permission).filter(
            Permission.actif.is_(True)
        ).all()

        nombre_permissions = 0

        for permission in permissions:
            liaison_existante = (
                db.query(FonctionPermission)
                .filter(
                    FonctionPermission.fonction_id == fonction.id,
                    FonctionPermission.permission_id == permission.id,
                )
                .first()
            )

            if not liaison_existante:
                db.add(
                    FonctionPermission(
                        fonction_id=fonction.id,
                        permission_id=permission.id,
                    )
                )

                nombre_permissions += 1

        # ==========================================================
        # VALIDATION
        # ==========================================================

        db.commit()

        print()
        print("=" * 50)
        print("ADMINISTRATEUR CRÉÉ AVEC SUCCÈS")
        print("=" * 50)
        print(f"Nom          : {prenom} {nom}")
        print(f"Téléphone    : {telephone}")
        print(f"Identifiant  : {identifiant}")
        print(f"Permissions  : {nombre_permissions}")
        print("=" * 50)

    except Exception as e:
        db.rollback()

        print()
        print("=" * 50)
        print("ERREUR LORS DE LA CRÉATION")
        print("=" * 50)
        print(e)
        print("=" * 50)

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()