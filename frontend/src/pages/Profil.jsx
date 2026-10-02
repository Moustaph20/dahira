
import {
  useRef,
  useState,
} from "react";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  UserRound,
  Phone,
  MapPin,
  BadgeCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from "lucide-react";

import {
  modifierMotDePasse,
} from "../services/auth";

import { useAuth } from "../context/AuthContext";


function Profil() {
  const {
    utilisateur,
  } = useAuth();


  // ==========================================================
  // ÉTAT DU FORMULAIRE
  // ==========================================================

  const [
    ancienMotDePasse,
    setAncienMotDePasse,
  ] = useState("");

  const [
    nouveauMotDePasse,
    setNouveauMotDePasse,
  ] = useState("");

  const [
    confirmationMotDePasse,
    setConfirmationMotDePasse,
  ] = useState("");


  const [
    afficherAncien,
    setAfficherAncien,
  ] = useState(false);

  const [
    afficherNouveau,
    setAfficherNouveau,
  ] = useState(false);

  const [
    afficherConfirmation,
    setAfficherConfirmation,
  ] = useState(false);


  const [
    chargement,
    setChargement,
  ] = useState(false);

  const [
    messageSucces,
    setMessageSucces,
  ] = useState("");

  const [
    messageErreur,
    setMessageErreur,
  ] = useState("");


  // ==========================================================
  // DONNÉES UTILISATEUR
  // ==========================================================

  const nom =
    utilisateur?.nom || "";

  const prenom =
    utilisateur?.prenom || "";

  const nomComplet =
    `${prenom} ${nom}`.trim() ||
    utilisateur?.identifiant ||
    "Utilisateur";

  const initiales = (() => {
    const mots =
      nomComplet
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (mots.length === 0) {
      return "U";
    }

    if (mots.length === 1) {
      return mots[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      mots[0][0] +
      mots[mots.length - 1][0]
    ).toUpperCase();
  })();


  const fonctions =
    Array.isArray(
      utilisateur?.fonctions
    )
      ? utilisateur.fonctions
      : [];


  const kourels =
    Array.isArray(
      utilisateur?.kourels
    )
      ? utilisateur.kourels
      : [];


  // ==========================================================
  // MODIFICATION MOT DE PASSE
  // ==========================================================

  async function handleModifierMotDePasse(
    event
  ) {
    event.preventDefault();

    setMessageSucces("");
    setMessageErreur("");


    // --------------------------------------------------------
    // Vérifications frontend
    // --------------------------------------------------------

    if (
      !ancienMotDePasse ||
      !nouveauMotDePasse ||
      !confirmationMotDePasse
    ) {
      setMessageErreur(
        "Veuillez remplir tous les champs."
      );

      return;
    }


    if (
      nouveauMotDePasse.length < 6
    ) {
      setMessageErreur(
        "Le nouveau mot de passe doit contenir au moins 6 caractères."
      );

      return;
    }


    if (
      nouveauMotDePasse !==
      confirmationMotDePasse
    ) {
      setMessageErreur(
        "Les deux nouveaux mots de passe ne correspondent pas."
      );

      return;
    }


    if (
      ancienMotDePasse ===
      nouveauMotDePasse
    ) {
      setMessageErreur(
        "Le nouveau mot de passe doit être différent de l'ancien."
      );

      return;
    }


    // --------------------------------------------------------
    // Envoi
    // --------------------------------------------------------

    try {
      setChargement(true);

      await modifierMotDePasse(
        ancienMotDePasse,
        nouveauMotDePasse
      );


      // ------------------------------------------------------
      // Succès
      // ------------------------------------------------------

      setMessageSucces(
        "Votre mot de passe a été modifié avec succès."
      );

      setAncienMotDePasse("");
      setNouveauMotDePasse("");
      setConfirmationMotDePasse("");

      // On masque les mots de passe après modification.
      setAfficherAncien(false);
      setAfficherNouveau(false);
      setAfficherConfirmation(false);

    } catch (error) {

      console.error(
        "Erreur modification mot de passe :",
        error
      );


      const detail =
        error?.response?.data?.detail;


      setMessageErreur(
        detail ||
        "Impossible de modifier le mot de passe."
      );


    } finally {
      setChargement(false);
    }
  }


  // ==========================================================
  // CHAMP MOT DE PASSE
  // ==========================================================

  function ChampMotDePasse({
    label,
    value,
    onChange,
    afficher,
    setAfficher,
    placeholder,
  }) {
    const inputRef = useRef(null);


    function basculerAffichage() {
      setAfficher(
        (precedent) => !precedent
      );

      /*
       * On rend le focus au champ après
       * le changement password/text.
       *
       * Cela évite que le clavier mobile
       * se ferme lors du clic sur l'œil.
       */
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }


    return (
      <div>

        <label
          className="
            mb-2 block
            text-xs font-bold
            text-slate-700
          "
        >
          {label}
        </label>


        <div
          className="
            relative
          "
        >

          <LockKeyhole
            size={17}
            className="
              absolute left-4 top-1/2
              -translate-y-1/2
              text-slate-400
            "
          />


          <input
            ref={inputRef}
            type={
              afficher
                ? "text"
                : "password"
            }
            value={value}
            onChange={(event) =>
              onChange(
                event.target.value
              )
            }
            placeholder={placeholder}
            autoComplete="new-password"
            className="
              w-full rounded-2xl
              border border-slate-200
              bg-slate-50
              py-3.5 pl-11 pr-12
              text-sm text-slate-900
              outline-none
              transition
              placeholder:text-slate-400
              focus:border-emerald-400
              focus:bg-white
              focus:ring-4
              focus:ring-emerald-500/10
            "
          />


          <button
            type="button"

            /*
             * Empêche le bouton de prendre
             * le focus du champ sur desktop.
             */
            onMouseDown={(event) => {
              event.preventDefault();
            }}

            /*
             * Empêche la perte de focus
             * lors du toucher sur mobile.
             */
            onTouchStart={(event) => {
              event.preventDefault();
            }}

            onClick={
              basculerAffichage
            }

            className="
              absolute right-3
              top-1/2
              flex h-9 w-9
              -translate-y-1/2
              items-center
              justify-center
              rounded-xl
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
              active:bg-slate-200
            "

            aria-label={
              afficher
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"
            }
          >
            {afficher ? (
              <EyeOff size={17} />
            ) : (
              <Eye size={17} />
            )}
          </button>

        </div>

      </div>
    );
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className="
        mx-auto
        max-w-6xl
      "
    >

      {/* ======================================================
          EN-TÊTE
      ====================================================== */}

      <div
        className="
          mb-8
          flex flex-col
          gap-5
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >

        <div>

          <div
            className="
              mb-2
              flex items-center gap-2
            "
          >

            <div
              className="
                flex h-9 w-9
                items-center
                justify-center
                rounded-xl
                bg-emerald-100
                text-emerald-700
              "
            >
              <UserRound size={18} />
            </div>


            <span
              className="
                text-[10px]
                font-black
                uppercase
                tracking-[0.18em]
                text-emerald-700
              "
            >
              Espace personnel
            </span>

          </div>


          <h1
            className="
              text-2xl
              font-black
              tracking-tight
              text-slate-900
              sm:text-3xl
            "
          >
            Mon profil
          </h1>


          <p
            className="
              mt-2
              max-w-2xl
              text-sm
              text-slate-500
            "
          >
            Consultez vos informations personnelles
            et gérez la sécurité de votre compte.
          </p>

        </div>

      </div>


      {/* ======================================================
          GRILLE
      ====================================================== */}

      <div
        className="
          grid gap-6
          lg:grid-cols-[0.9fr_1.1fr]
        "
      >

        {/* ====================================================
            INFORMATIONS
        ==================================================== */}

        <section
          className="
            overflow-hidden
            rounded-[2rem]
            border border-slate-200
            bg-white
            shadow-sm
          "
        >

          <div
            className="
              border-b
              border-slate-100
              bg-gradient-to-br
              from-emerald-50
              via-white
              to-teal-50
              p-6
              sm:p-7
            "
          >

            <div
              className="
                flex items-center
                gap-4
              "
            >

              <div
                className="
                  flex h-16 w-16
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-gradient-to-br
                  from-emerald-500
                  to-teal-700
                  text-lg
                  font-black
                  text-white
                  shadow-lg
                "
              >
                {initiales}
              </div>


              <div
                className="
                  min-w-0
                "
              >

                <h2
                  className="
                    truncate
                    text-lg
                    font-black
                    text-slate-900
                  "
                >
                  {nomComplet}
                </h2>


                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-500
                  "
                >
                  @{utilisateur?.identifiant}
                </p>

              </div>

            </div>

          </div>


          <div
            className="
              space-y-1
              p-5
              sm:p-7
            "
          >

            {/* PRÉNOM */}

            <div
              className="
                flex items-center
                gap-4 rounded-2xl
                p-3
                transition
                hover:bg-slate-50
              "
            >

              <div
                className="
                  flex h-10 w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-emerald-50
                  text-emerald-600
                "
              >
                <UserRound size={17} />
              </div>


              <div>

                <p
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-400
                  "
                >
                  Prénom
                </p>


                <p
                  className="
                    mt-1
                    text-sm
                    font-semibold
                    text-slate-800
                  "
                >
                  {prenom || "Non renseigné"}
                </p>

              </div>

            </div>


            {/* NOM */}

            <div
              className="
                flex items-center
                gap-4 rounded-2xl
                p-3
                transition
                hover:bg-slate-50
              "
            >

              <div
                className="
                  flex h-10 w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-blue-50
                  text-blue-600
                "
              >
                <BadgeCheck size={17} />
              </div>


              <div>

                <p
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-400
                  "
                >
                  Nom
                </p>


                <p
                  className="
                    mt-1
                    text-sm
                    font-semibold
                    text-slate-800
                  "
                >
                  {nom || "Non renseigné"}
                </p>

              </div>

            </div>


            {/* TÉLÉPHONE */}

            <div
              className="
                flex items-center
                gap-4 rounded-2xl
                p-3
                transition
                hover:bg-slate-50
              "
            >

              <div
                className="
                  flex h-10 w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-violet-50
                  text-violet-600
                "
              >
                <Phone size={17} />
              </div>


              <div>

                <p
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-400
                  "
                >
                  Téléphone
                </p>


                <p
                  className="
                    mt-1
                    text-sm
                    font-semibold
                    text-slate-800
                  "
                >
                  {utilisateur?.telephone ||
                    "Non renseigné"}
                </p>

              </div>

            </div>


            {/* RÉSIDENCE */}

            <div
              className="
                flex items-center
                gap-4 rounded-2xl
                p-3
                transition
                hover:bg-slate-50
              "
            >

              <div
                className="
                  flex h-10 w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-amber-50
                  text-amber-600
                "
              >
                <MapPin size={17} />
              </div>


              <div>

                <p
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-400
                  "
                >
                  Résidence
                </p>


                <p
                  className="
                    mt-1
                    text-sm
                    font-semibold
                    text-slate-800
                  "
                >
                  {utilisateur?.lieu_residence ||
                    "Non renseignée"}
                </p>

              </div>

            </div>


            {/* IDENTIFIANT */}

            <div
              className="
                flex items-center
                gap-4 rounded-2xl
                p-3
                transition
                hover:bg-slate-50
              "
            >

              <div
                className="
                  flex h-10 w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-100
                  text-slate-600
                "
              >
                <KeyRound size={17} />
              </div>


              <div>

                <p
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-400
                  "
                >
                  Identifiant
                </p>


                <p
                  className="
                    mt-1
                    text-sm
                    font-semibold
                    text-slate-800
                  "
                >
                  {utilisateur?.identifiant}
                </p>

              </div>

            </div>


            {/* FONCTIONS */}

            <div
              className="
                mt-3
                border-t
                border-slate-100
                pt-4
              "
            >

              <p
                className="
                  mb-3
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.15em]
                  text-slate-400
                "
              >
                Fonction(s)
              </p>


              <div
                className="
                  flex flex-wrap gap-2
                "
              >

                {fonctions.length > 0 ? (
                  fonctions.map(
                    (fonction) => (
                      <span
                        key={fonction.id}
                        className="
                          rounded-full
                          bg-emerald-50
                          px-3 py-1.5
                          text-xs
                          font-bold
                          text-emerald-700
                        "
                      >
                        {fonction.nom}
                      </span>
                    )
                  )
                ) : (
                  <span
                    className="
                      text-xs
                      text-slate-400
                    "
                  >
                    Membre
                  </span>
                )}

              </div>

            </div>


            {/* KOURELS */}

            {kourels.length > 0 && (
              <div
                className="
                  mt-4
                  border-t
                  border-slate-100
                  pt-4
                "
              >

                <p
                  className="
                    mb-3
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.15em]
                    text-slate-400
                  "
                >
                  Mes Kourels
                </p>


                <div
                  className="
                    flex flex-wrap gap-2
                  "
                >

                  {kourels.map(
                    (kourel) => (
                      <span
                        key={kourel.id}
                        className="
                          rounded-full
                          bg-amber-50
                          px-3 py-1.5
                          text-xs
                          font-bold
                          text-amber-700
                        "
                      >
                        {kourel.nom}
                      </span>
                    )
                  )}

                </div>

              </div>
            )}

          </div>

        </section>


        {/* ====================================================
            SÉCURITÉ
        ==================================================== */}

        <section
          className="
            overflow-hidden
            rounded-[2rem]
            border border-slate-200
            bg-white
            shadow-sm
          "
        >

          <div
            className="
              border-b
              border-slate-100
              bg-gradient-to-br
              from-slate-900
              to-emerald-950
              p-6
              text-white
              sm:p-7
            "
          >

            <div
              className="
                flex items-center
                gap-4
              "
            >

              <div
                className="
                  flex h-12 w-12
                  items-center
                  justify-center
                  rounded-2xl
                  bg-white/10
                  text-emerald-300
                "
              >
                <ShieldCheck
                  size={23}
                />
              </div>


              <div>

                <h2
                  className="
                    text-lg
                    font-black
                  "
                >
                  Sécurité du compte
                </h2>


                <p
                  className="
                    mt-1
                    text-xs
                    text-white/50
                  "
                >
                  Modifiez régulièrement votre mot de passe.
                </p>

              </div>

            </div>

          </div>


          <form
            onSubmit={
              handleModifierMotDePasse
            }
            className="
              space-y-5
              p-6
              sm:p-7
            "
          >

            {/* MESSAGE SUCCÈS */}

            {messageSucces && (
              <div
                className="
                  flex items-start
                  gap-3
                  rounded-2xl
                  border border-emerald-200
                  bg-emerald-50
                  p-4
                  text-sm
                  text-emerald-800
                "
              >

                <CheckCircle2
                  size={18}
                  className="
                    mt-0.5
                    shrink-0
                  "
                />


                <p>
                  {messageSucces}
                </p>

              </div>
            )}


            {/* MESSAGE ERREUR */}

            {messageErreur && (
              <div
                className="
                  flex items-start
                  gap-3
                  rounded-2xl
                  border border-rose-200
                  bg-rose-50
                  p-4
                  text-sm
                  text-rose-800
                "
              >

                <AlertCircle
                  size={18}
                  className="
                    mt-0.5
                    shrink-0
                  "
                />


                <p>
                  {messageErreur}
                </p>

              </div>
            )}


            <ChampMotDePasse
              label="Ancien mot de passe"
              value={
                ancienMotDePasse
              }
              onChange={
                setAncienMotDePasse
              }
              afficher={
                afficherAncien
              }
              setAfficher={
                setAfficherAncien
              }
              placeholder="Votre mot de passe actuel"
            />


            <div
              className="
                border-t
                border-slate-100
                pt-5
              "
            >

              <p
                className="
                  mb-4
                  text-xs
                  font-bold
                  text-slate-500
                "
              >
                Nouveau mot de passe
              </p>


              <div
                className="
                  space-y-5
                "
              >

                <ChampMotDePasse
                  label="Nouveau mot de passe"
                  value={
                    nouveauMotDePasse
                  }
                  onChange={
                    setNouveauMotDePasse
                  }
                  afficher={
                    afficherNouveau
                  }
                  setAfficher={
                    setAfficherNouveau
                  }
                  placeholder="Minimum 6 caractères"
                />


                <ChampMotDePasse
                  label="Confirmer le nouveau mot de passe"
                  value={
                    confirmationMotDePasse
                  }
                  onChange={
                    setConfirmationMotDePasse
                  }
                  afficher={
                    afficherConfirmation
                  }
                  setAfficher={
                    setAfficherConfirmation
                  }
                  placeholder="Retapez le nouveau mot de passe"
                />

              </div>

            </div>


            {/* CONSEIL */}

            <div
              className="
                rounded-2xl
                border border-amber-100
                bg-amber-50
                p-4
              "
            >

              <div
                className="
                  flex gap-3
                "
              >

                <LockKeyhole
                  size={17}
                  className="
                    mt-0.5
                    shrink-0
                    text-amber-600
                  "
                />


                <div>

                  <p
                    className="
                      text-xs
                      font-bold
                      text-amber-800
                    "
                  >
                    Conseil de sécurité
                  </p>


                  <p
                    className="
                      mt-1
                      text-[11px]
                      leading-5
                      text-amber-700
                    "
                  >
                    Utilisez un mot de passe personnel
                    que vous n'utilisez pas sur d'autres
                    services.
                  </p>

                </div>

              </div>

            </div>


            {/* BOUTON */}

            <button
              type="submit"
              disabled={chargement}
              className="
                flex w-full
                items-center
                justify-center
                gap-2
                rounded-2xl
                bg-gradient-to-r
                from-emerald-600
                to-teal-700
                px-5 py-3.5
                text-sm
                font-black
                text-white
                shadow-lg
                shadow-emerald-900/10
                transition
                hover:-translate-y-0.5
                hover:shadow-xl
                disabled:cursor-not-allowed
                disabled:opacity-60
                disabled:hover:translate-y-0
              "
            >

              {chargement ? (
                <>
                  <span
                    className="
                      h-4 w-4
                      animate-spin
                      rounded-full
                      border-2
                      border-white/30
                      border-t-white
                    "
                  />

                  Modification...
                </>
              ) : (
                <>
                  <ShieldCheck
                    size={17}
                  />

                  Modifier mon mot de passe
                </>
              )}

            </button>

          </form>

        </section>

      </div>

    </div>
  );
}


export default Profil;
