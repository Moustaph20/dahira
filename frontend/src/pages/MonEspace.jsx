import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Heart,
  Home,
  Landmark,
  LogOut,
  Menu,
  Megaphone,
  Mic2,
  Moon,
  Music,
  Receipt,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { listerCommunications } from "../services/communications";

import AudioDuJour from "../components/espace/AudioDuJour";


/* =========================================================================
   ICÔNES
========================================================================= */

const icones = {
  wallet: Wallet,
  "credit-card": CreditCard,
  receipt: Receipt,
  landmark: Landmark,
  calendar: Calendar,
  "book-open": BookOpen,
  megaphone: Megaphone,
  bell: Bell,
  users: Users,
  music: Music,
  mic: Mic2,
};


/* =========================================================================
   COULEURS
========================================================================= */

const couleurs = [
  {
    gradient: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  {
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  {
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    text: "text-violet-700",
  },
  {
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  {
    gradient: "from-rose-500 to-pink-600",
    bg: "bg-rose-50",
    text: "text-rose-700",
  },
  {
    gradient: "from-cyan-500 to-sky-600",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
  },
];


/* =========================================================================
   RUBRIQUES FINANCE
   IMPORTANT :
   Chaque rubrique possède SA propre permission.
========================================================================= */

const rubriquesFinance = [
  {
    code: "COTISATIONS",
    label: "Cotisations",
    description: "Consulter les cotisations des membres.",
    route: "/cotisations",
    icone: "wallet",
    permission: "COTISATION_CONSULTER",
  },

  {
    code: "PAIEMENTS",
    label: "Paiements",
    description: "Consulter les paiements enregistrés.",
    route: "/paiements",
    icone: "credit-card",
    permission: "PAIEMENT_CONSULTER",
  },

  {
    code: "DEPENSES",
    label: "Dépenses",
    description: "Consulter les dépenses du Dahira.",
    route: "/finances",
    icone: "receipt",
    permission: "DEPENSE_CONSULTER",
  },

  {
    code: "AIDES_EXTERIEURES",
    label: "Aides extérieures",
    description: "Consulter les aides et contributions externes.",
    route: "/aides-exterieures",
    icone: "landmark",
    permission: "AIDE_EXTERIEURE_CONSULTER",
  },
];


/* =========================================================================
   PERMISSIONS KOUREL
========================================================================= */

const PERMISSIONS_KOUREL = {
  MON_KOUREL: [
    "KOUREL_CONSULTER",
  ],

  PROGRAMME: [
    "PROGRAMME_KOUREL_CONSULTER",
    "REPETITION_CONSULTER",
    "PROGRAMME_CONSULTER",
  ],

  KHASSIDAS: [
    "KHASSIDA_CONSULTER",
  ],

  AUDIOS: [
    "AUDIO_CONSULTER",
    "KHASSIDA_CONSULTER",
  ],

  DECLAMATIONS: [
    "DECLAMATION_CONSULTER",
  ],

  ACTIVITES: [
    "ACTIVITE_KOUREL_CONSULTER",
  ],
};


/* =========================================================================
   RUBRIQUES KOUREL
========================================================================= */

const rubriquesKourel = [
  {
    code: "MON_KOUREL",
    label: "Mon Kourel",
    description:
      "Consulter les informations et les membres de votre Kourel.",
    route: "/mon-kourel",
    icone: "users",
    permissions: PERMISSIONS_KOUREL.MON_KOUREL,
  },

  {
    code: "PROGRAMME_KOUREL",
    label: "Programme du Kourel",
    description:
      "Consulter le programme mensuel de répétition du Kourel.",
    route: "/programme-kourel",
    icone: "calendar",
    permissions: PERMISSIONS_KOUREL.PROGRAMME,
  },

  {
    code: "KHASSIDAS",
    label: "Khassidas",
    description:
      "Consulter les Khassidas utilisées par le Kourel.",
    route: "/khassidas",
    icone: "book-open",
    permissions: PERMISSIONS_KOUREL.KHASSIDAS,
  },

  {
    code: "AUDIOS",
    label: "Audios",
    description:
      "Écouter les audios associés aux Khassidas.",
    route: "/audios",
    icone: "music",
    permissions: PERMISSIONS_KOUREL.AUDIOS,
  },

  {
    code: "DECLAMATIONS",
    label: "Déclamations",
    description:
      "Consulter le programme des déclamations du Kourel.",
    route: "/declamations",
    icone: "mic",
    permissions: PERMISSIONS_KOUREL.DECLAMATIONS,
  },

  {
    code: "ACTIVITES_KOUREL",
    label: "Activités du Kourel",
    description:
      "Consulter les activités et programmes religieux du Kourel.",
    route: "/activites-kourel",
    icone: "calendar",
    permissions: PERMISSIONS_KOUREL.ACTIVITES,
  },
];


/* =========================================================================
   PRIÈRES
========================================================================= */

const PRIERES = [
  {
    nom: "Fajr",
    arabe: "الفجر",
    cle: "Fajr",
    icon: Sunrise,
  },
  {
    nom: "Dhuhr",
    arabe: "الظهر",
    cle: "Dhuhr",
    icon: Sun,
  },
  {
    nom: "Asr",
    arabe: "العصر",
    cle: "Asr",
    icon: Sun,
  },
  {
    nom: "Maghrib",
    arabe: "المغرب",
    cle: "Maghrib",
    icon: Sunset,
  },
  {
    nom: "Isha",
    arabe: "العشاء",
    cle: "Isha",
    icon: Moon,
  },
];


/* =========================================================================
   DOUAS DE LA SEMAINE
========================================================================= */

const DOUAS_SEMAINE = [
  {
    arabe: "رَبِّ زِدْنِي عِلْمًا",
    transliteration: "Rabbi zidnî 'ilmâ",
    traduction:
      "Seigneur, augmente-moi en connaissance.",
    source: "Sourate Ta-Ha, 20:114",
  },

  {
    arabe:
      "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً",
    transliteration:
      "Rabbana âtinâ fid-dunyâ hasanatan wa fil-âkhirati hasanatan",
    traduction:
      "Seigneur, accorde-nous une belle part ici-bas et une belle part dans l'au-delà.",
    source: "Sourate Al-Baqara, 2:201",
  },

  {
    arabe:
      "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ",
    transliteration:
      "Rabbi-ghfir lî wa li-wâlidayya",
    traduction:
      "Seigneur, pardonne-moi ainsi qu'à mes parents.",
    source: "Invocation",
  },

  {
    arabe:
      "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
    transliteration:
      "Allahumma a'inni 'alâ dhikrika wa shukrika wa husni 'ibâdatik",
    traduction:
      "Ô Allah, aide-moi à T'évoquer, à Te remercier et à bien T'adorer.",
    source: "Hadith",
  },

  {
    arabe:
      "رَبِّ اشْرَحْ لِي صَدْرِي",
    transliteration:
      "Rabbi-shrah lî sadrî",
    traduction:
      "Seigneur, ouvre-moi la poitrine et facilite ma tâche.",
    source: "Sourate Ta-Ha, 20:25-26",
  },

  {
    arabe:
      "اللَّهُمَّ اهْدِنِي وَسَدِّدْنِي",
    transliteration:
      "Allahumma-hdinî wa saddidnî",
    traduction:
      "Ô Allah, guide-moi et dirige-moi vers ce qui est juste.",
    source: "Hadith",
  },

  {
    arabe:
      "حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ",
    transliteration:
      "Hasbiyallâhu lâ ilâha illâ Huwa",
    traduction:
      "Allah me suffit. Il n'y a de divinité que Lui.",
    source: "Sourate At-Tawba, 9:129",
  },
];


/* =========================================================================
   RAPPELS
========================================================================= */

const RAPPELS = [
  {
    texte:
      "Les œuvres les plus aimées d'Allah sont celles qui sont régulières, même si elles sont peu nombreuses.",
    source: "Hadith",
  },

  {
    texte:
      "Certes, c'est par l'évocation d'Allah que les cœurs se tranquillisent.",
    source: "Sourate Ar-Ra'd, 13:28",
  },

  {
    texte:
      "Et quiconque place sa confiance en Allah, Il lui suffit.",
    source: "Sourate At-Talaq, 65:3",
  },

  {
    texte:
      "Invoquez-Moi, Je vous répondrai.",
    source: "Sourate Ghafir, 40:60",
  },

  {
    texte:
      "Allah n'impose à aucune âme une charge supérieure à sa capacité.",
    source: "Sourate Al-Baqara, 2:286",
  },

  {
    texte:
      "Et quiconque fait le bien, fût-ce du poids d'un atome, le verra.",
    source: "Sourate Az-Zalzala, 99:7",
  },

  {
    texte:
      "Souvenez-vous de Moi et Je me souviendrai de vous.",
    source: "Sourate Al-Baqara, 2:152",
  },
];


/* =========================================================================
   UTILITAIRES
========================================================================= */

function getPrenom(utilisateur) {
  return (
    utilisateur?.prenom ||
    utilisateur?.membre?.prenom ||
    ""
  );
}


function getNomComplet(utilisateur) {
  const prenom = getPrenom(utilisateur);

  const nom =
    utilisateur?.nom ||
    utilisateur?.membre?.nom ||
    "";

  const complet =
    `${prenom} ${nom}`.trim();

  return (
    complet ||
    utilisateur?.identifiant ||
    "Utilisateur"
  );
}


function getInitiales(utilisateur) {
  const prenom = getPrenom(utilisateur);

  const nom =
    utilisateur?.nom ||
    utilisateur?.membre?.nom ||
    "";

  const mots =
    `${prenom} ${nom}`
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
}


function getFonctionPrincipale(utilisateur) {
  if (
    Array.isArray(
      utilisateur?.fonctions
    ) &&
    utilisateur.fonctions.length > 0
  ) {
    return (
      utilisateur.fonctions[0]?.nom ||
      "Membre"
    );
  }

  return "Membre";
}


function obtenirCodesPermissions(utilisateur) {
  if (
    !Array.isArray(
      utilisateur?.permissions
    )
  ) {
    return [];
  }

  return utilisateur.permissions
    .map((permission) => {
      if (
        typeof permission === "string"
      ) {
        return permission;
      }

      return permission?.code;
    })
    .filter(Boolean);
}


function possedeUnePermission(
  codesPermissions,
  permissionsNecessaires
) {
  if (
    !Array.isArray(
      permissionsNecessaires
    ) ||
    permissionsNecessaires.length === 0
  ) {
    return false;
  }

  return permissionsNecessaires.some(
    (permission) =>
      codesPermissions.includes(
        permission
      )
  );
}


/* =========================================================================
   CARTE RUBRIQUE
========================================================================= */

function CarteEspace({
  item,
  index,
  onNavigate,
  active,
}) {
  const Icon =
    icones[item?.icone] ||
    BookOpen;

  const couleur =
    couleurs[
      index % couleurs.length
    ];

  return (
    <button
      type="button"
      disabled={active}
      onClick={() =>
        onNavigate(item.route)
      }
      className={`
        group
        relative
        w-full
        overflow-hidden
        rounded-[1.75rem]
        border
        border-slate-200
        bg-white
        p-5
        text-left
        shadow-sm
        transition-all
        duration-500
        hover:-translate-y-2
        hover:border-emerald-200
        hover:shadow-2xl
        focus:outline-none
        focus:ring-2
        focus:ring-emerald-500
        focus:ring-offset-2
        ${
          active
            ? "scale-[0.98] opacity-60"
            : ""
        }
      `}
      style={{
        animationDelay:
          `${index * 80}ms`,
      }}
    >
      <div
        className="
          pointer-events-none
          absolute
          -right-16
          -top-16
          h-40
          w-40
          rounded-full
          bg-emerald-200/40
          opacity-0
          blur-3xl
          transition-all
          duration-700
          group-hover:scale-150
          group-hover:opacity-100
        "
      />

      <div className="relative z-10">

        <div className="flex items-start justify-between">

          <div
            className={`
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-gradient-to-br
              ${couleur.gradient}
              text-white
              shadow-lg
              transition-all
              duration-500
              group-hover:rotate-6
              group-hover:scale-110
            `}
          >
            <Icon size={25} />
          </div>

          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              bg-slate-50
              text-slate-400
              transition-all
              duration-300
              group-hover:bg-emerald-50
              group-hover:text-emerald-600
              group-hover:translate-x-1
            "
          >
            <ChevronRight size={18} />
          </div>

        </div>

        <div className="mt-5">

          <h3 className="text-base font-black text-slate-900">
            {item.label}
          </h3>

          <p className="mt-2 min-h-[40px] text-sm leading-5 text-slate-500">
            {item.description}
          </p>

        </div>

        <div className="mt-5 flex items-center gap-2 text-xs font-bold text-emerald-600">

          <span>
            Accéder
          </span>

          <ArrowRight
            size={14}
            className="
              transition-transform
              duration-300
              group-hover:translate-x-1
            "
          />

        </div>

      </div>
    </button>
  );
}


/* =========================================================================
   STATISTIQUE
========================================================================= */

function Statistique({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div
      className="
        group
        rounded-[1.75rem]
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-xl
      "
    >
      <div className="flex items-center justify-between">

        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-2xl
            bg-slate-100
            text-slate-700
            transition-all
            duration-300
            group-hover:bg-emerald-100
            group-hover:text-emerald-700
          "
        >
          <Icon size={20} />
        </div>

        <Sparkles
          size={16}
          className="
            text-emerald-400
            opacity-0
            transition-opacity
            group-hover:opacity-100
          "
        />

      </div>

      <p className="mt-4 text-2xl font-black text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-700">
        {label}
      </p>

      {description && (
        <p className="mt-1 text-xs text-slate-400">
          {description}
        </p>
      )}

    </div>
  );
}


/* =========================================================================
   HORAIRES DE PRIÈRE
========================================================================= */

function HorairesPriere({
  horaires,
  prochainePriere,
  tempsRestant,
}) {
  return (
    <section
      className="
        mt-6
        overflow-hidden
        rounded-[2rem]
        border
        border-emerald-100
        bg-white
        shadow-sm
      "
    >

      <div
        className="
          bg-gradient-to-br
          from-emerald-950
          via-emerald-900
          to-teal-900
          p-6
          text-white
          sm:p-8
        "
      >

        <div
          className="
            flex
            flex-col
            gap-5
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >

          <div>

            <div className="flex items-center gap-2 text-emerald-300">

              <span
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  bg-white/10
                "
              >
                <Clock3 size={18} />
              </span>

              <span
                className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.18em]
                "
              >
                Aujourd'hui
              </span>

            </div>

            <h2 className="mt-3 text-2xl font-black sm:text-3xl">
              Horaires de prière
            </h2>

            <p className="mt-2 text-sm text-emerald-100/70">
              Dakar · Horaires actualisés quotidiennement
            </p>

          </div>


          {prochainePriere && (

            <div
              className="
                rounded-2xl
                border
                border-white/10
                bg-white/10
                px-5
                py-4
                backdrop-blur-xl
              "
            >

              <p className="text-xs font-semibold text-emerald-100/60">
                Prochaine prière
              </p>

              <div className="mt-1 flex items-center gap-3">

                <p className="text-xl font-black">
                  {prochainePriere.nom}
                </p>

                <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-200">
                  dans {tempsRestant}
                </span>

              </div>

            </div>

          )}

        </div>


        <div
          className="
            mt-8
            grid
            grid-cols-2
            gap-3
            sm:grid-cols-5
          "
        >

          {PRIERES.map((priere) => {

            const Icon = priere.icon;

            const heure =
              horaires?.[priere.cle];

            const estProchaine =
              prochainePriere?.cle ===
              priere.cle;

            return (

              <div
                key={priere.cle}
                className={`
                  rounded-2xl
                  border
                  p-4
                  transition-all
                  ${
                    estProchaine
                      ? "border-emerald-300 bg-emerald-400/20 shadow-lg"
                      : "border-white/10 bg-white/5"
                  }
                `}
              >

                <div className="flex items-center justify-between">

                  <Icon
                    size={18}
                    className={
                      estProchaine
                        ? "text-emerald-300"
                        : "text-emerald-100/60"
                    }
                  />

                  {estProchaine && (
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                  )}

                </div>

                <p className="mt-4 text-xs font-semibold text-emerald-100/60">
                  {priere.nom}
                </p>

                <p className="mt-1 text-xl font-black">
                  {heure || "--:--"}
                </p>

              </div>

            );

          })}

        </div>

      </div>

    </section>
  );
}


/* =========================================================================
   DOU'A
========================================================================= */

function DouaSemaine({ doua }) {

  const [copie, setCopie] =
    useState(false);

  async function copier() {

    try {

      await navigator.clipboard.writeText(
        `${doua.arabe}\n\n${doua.transliteration}\n\n${doua.traduction}`
      );

      setCopie(true);

      setTimeout(
        () => setCopie(false),
        1800
      );

    } catch (error) {

      console.error(
        "Impossible de copier la dou'a :",
        error
      );

    }

  }

  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-[2rem]
        border
        border-amber-100
        bg-gradient-to-br
        from-amber-50
        via-white
        to-orange-50
        p-6
        shadow-sm
        sm:p-8
      "
    >

      <div
        className="
          pointer-events-none
          absolute
          -right-20
          -top-20
          h-48
          w-48
          rounded-full
          bg-amber-200/30
          blur-3xl
        "
      />

      <div className="relative">

        <div className="flex items-center gap-3">

          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-amber-100
              text-amber-700
            "
          >
            <Heart size={22} />
          </div>

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
              Chaque semaine
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-900">
              Dou'a de la semaine
            </h2>

          </div>

        </div>

        <div className="mt-7 text-center">

          <p
            dir="rtl"
            className="
              text-2xl
              font-bold
              leading-loose
              text-slate-900
              sm:text-3xl
            "
          >
            {doua.arabe}
          </p>

          <p className="mt-5 text-sm font-semibold italic text-amber-700">
            {doua.transliteration}
          </p>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">
            « {doua.traduction} »
          </p>

          <p className="mt-3 text-xs font-semibold text-slate-400">
            {doua.source}
          </p>

        </div>

        <button
          type="button"
          onClick={copier}
          className="
            mx-auto
            mt-6
            flex
            items-center
            gap-2
            rounded-xl
            bg-amber-100
            px-4
            py-2.5
            text-xs
            font-bold
            text-amber-700
            transition
            hover:bg-amber-200
          "
        >
          {copie ? (
            <>
              <CheckCircle2 size={15} />
              Copiée
            </>
          ) : (
            <>
              <BookOpen size={15} />
              Copier la dou'a
            </>
          )}
        </button>

      </div>

    </section>
  );
}


/* =========================================================================
   RAPPEL
========================================================================= */

function RappelJour({ rappel }) {

  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-[2rem]
        bg-gradient-to-br
        from-violet-950
        via-purple-900
        to-indigo-950
        p-6
        text-white
        shadow-xl
        sm:p-8
      "
    >

      <div
        className="
          pointer-events-none
          absolute
          -bottom-20
          -right-20
          h-48
          w-48
          rounded-full
          bg-violet-400/10
          blur-3xl
        "
      />

      <div className="relative">

        <div className="flex items-center gap-3">

          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-white/10
              text-violet-200
            "
          >
            <Sparkles size={22} />
          </div>

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200/70">
              Méditation
            </p>

            <h2 className="mt-1 text-xl font-black">
              Rappel du jour
            </h2>

          </div>

        </div>

        <p className="mt-8 text-lg font-semibold leading-8 text-white/95 sm:text-xl">
          « {rappel.texte} »
        </p>

        <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-violet-200/60">
          <BookOpen size={14} />
          {rappel.source}
        </div>

      </div>

    </section>
  );
}


/* =========================================================================
   COMMUNICATIONS
========================================================================= */

function CommunicationsRecentes({
  communications,
  onNavigate,
}) {

  return (
    <section
      className="
        overflow-hidden
        rounded-[2rem]
        border
        border-slate-200
        bg-white
        shadow-sm
      "
    >

      <div className="border-b border-slate-100 p-6 sm:p-7">

        <div className="flex items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-rose-50
                text-rose-600
              "
            >
              <Megaphone size={22} />
            </div>

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">
                Informations
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-900">
                Communications
              </h2>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              onNavigate(
                "/communications"
              )
            }
            className="
              hidden
              items-center
              gap-1
              text-xs
              font-bold
              text-emerald-600
              sm:flex
            "
          >
            Tout voir
            <ArrowRight size={14} />
          </button>

        </div>

      </div>


      <div className="divide-y divide-slate-100">

        {communications.length === 0 ? (

          <div className="p-8 text-center">

            <div
              className="
                mx-auto
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-slate-100
                text-slate-400
              "
            >
              <Bell size={23} />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-700">
              Aucune communication récente
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Vous serez informé ici des prochaines annonces.
            </p>

          </div>

        ) : (

          communications
            .slice(0, 3)
            .map((communication) => (

              <button
                key={communication.id}
                type="button"
                onClick={() =>
                  onNavigate(
                    `/communications/${communication.id}`
                  )
                }
                className="
                  group
                  flex
                  w-full
                  items-start
                  gap-4
                  p-5
                  text-left
                  transition
                  hover:bg-slate-50
                "
              >

                <div
                  className={`
                    mt-1
                    h-2.5
                    w-2.5
                    shrink-0
                    rounded-full
                    ${
                      communication.priorite ===
                      "URGENTE"
                        ? "bg-rose-500"
                        : communication.priorite ===
                          "IMPORTANTE"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }
                  `}
                />

                <div className="min-w-0 flex-1">

                  <div className="flex flex-wrap items-center gap-2">

                    <h3 className="truncate text-sm font-black text-slate-900">
                      {communication.titre}
                    </h3>

                    {communication.priorite ===
                      "URGENTE" && (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                        URGENT
                      </span>
                    )}

                  </div>

                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                    {communication.contenu}
                  </p>

                  <p className="mt-2 text-[11px] font-semibold text-slate-400">
                    {communication.date_publication
                      ? new Date(
                          communication.date_publication
                        ).toLocaleDateString(
                          "fr-FR"
                        )
                      : ""}
                  </p>

                </div>

                <ChevronRight
                  size={17}
                  className="
                    mt-2
                    shrink-0
                    text-slate-300
                    transition
                    group-hover:translate-x-1
                    group-hover:text-emerald-600
                  "
                />

              </button>

            ))

        )}

      </div>


      <div className="border-t border-slate-100 p-4 sm:hidden">

        <button
          type="button"
          onClick={() =>
            onNavigate(
              "/communications"
            )
          }
          className="
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-slate-50
            px-4
            py-3
            text-xs
            font-bold
            text-emerald-600
          "
        >
          Voir toutes les communications
          <ArrowRight size={14} />
        </button>

      </div>

    </section>
  );
}


/* =========================================================================
   COMPOSANT PRINCIPAL
========================================================================= */

export default function MonEspace() {

  const {
    utilisateur,
    deconnexion,
  } = useAuth();

  const navigate =
    useNavigate();


  /* =======================================================================
     ÉTATS
  ======================================================================= */

  const [
    menuOuvert,
    setMenuOuvert,
  ] = useState(false);

  const [
    elementActif,
    setElementActif,
  ] = useState(null);

  const [
    heure,
    setHeure,
  ] = useState(
    new Date()
  );

  const [
    horairesPriere,
    setHorairesPriere,
  ] = useState(null);

  const [
    communications,
    setCommunications,
  ] = useState([]);

  const [
    chargementCommunications,
    setChargementCommunications,
  ] = useState(false);


  /* =======================================================================
     HORLOGE
  ======================================================================= */

  useEffect(() => {

    const interval =
      setInterval(() => {

        setHeure(
          new Date()
        );

      }, 1000);

    return () =>
      clearInterval(
        interval
      );

  }, []);


  /* =======================================================================
     PERMISSIONS
  ======================================================================= */

  const permissions =
    useMemo(
      () =>
        obtenirCodesPermissions(
          utilisateur
        ),
      [utilisateur]
    );


  const permissionsSet =
    useMemo(
      () =>
        new Set(
          permissions
        ),
      [permissions]
    );


  const aPermission =
    (permission) =>
      Boolean(
        permission &&
        permissionsSet.has(
          permission
        )
      );


  /* =======================================================================
     HORAIRES DE PRIÈRE
  ======================================================================= */

  useEffect(() => {

    async function chargerHoraires() {

      try {

        const maintenant =
          new Date();

        const jour =
          maintenant.getDate();

        const mois =
          maintenant.getMonth() + 1;

        const annee =
          maintenant.getFullYear();

        const url =
          `https://api.aladhan.com/v1/timings/${jour}-${mois}-${annee}?latitude=14.7167&longitude=-17.4677&method=3`;

        const response =
          await fetch(url);

        if (!response.ok) {
          throw new Error(
            "Impossible de récupérer les horaires."
          );
        }

        const data =
          await response.json();

        if (
          data?.code === 200 &&
          data?.data?.timings
        ) {

          setHorairesPriere(
            data.data.timings
          );

        }

      } catch (error) {

        console.error(
          "Erreur horaires de prière :",
          error
        );

      }

    }

    chargerHoraires();

    const interval =
      setInterval(
        chargerHoraires,
        1000 * 60 * 60 * 6
      );

    return () =>
      clearInterval(
        interval
      );

  }, []);


  /* =======================================================================
     COMMUNICATIONS
  ======================================================================= */

  const peutVoirCommunications =
    aPermission(
      "COMMUNICATION_CONSULTER"
    );


  useEffect(() => {

    if (!peutVoirCommunications) {

      setCommunications([]);

      return;
    }

    async function chargerCommunications() {

      setChargementCommunications(
        true
      );

      try {

        const resultat =
          await listerCommunications({
            actif: true,
          });

        setCommunications(
          Array.isArray(resultat)
            ? resultat
            : []
        );

      } catch (error) {

        console.error(
          "Erreur chargement communications :",
          error
        );

        setCommunications([]);

      } finally {

        setChargementCommunications(
          false
        );

      }

    }

    chargerCommunications();

  }, [
    peutVoirCommunications,
  ]);


  /* =======================================================================
     INFORMATIONS UTILISATEUR
  ======================================================================= */

  const prenomUtilisateur =
    useMemo(
      () =>
        getPrenom(
          utilisateur
        ),
      [utilisateur]
    );

  const nomUtilisateur =
    useMemo(
      () =>
        getNomComplet(
          utilisateur
        ),
      [utilisateur]
    );

  const initiales =
    useMemo(
      () =>
        getInitiales(
          utilisateur
        ),
      [utilisateur]
    );

  const fonctionPrincipale =
    useMemo(
      () =>
        getFonctionPrincipale(
          utilisateur
        ),
      [utilisateur]
    );


  /* =======================================================================
     KOURELS
  ======================================================================= */

  const kourels =
    useMemo(
      () =>
        Array.isArray(
          utilisateur?.kourels
        )
          ? utilisateur.kourels
          : [],
      [utilisateur]
    );


  const estMembreKourel =
    utilisateur?.est_membre_kourel === true ||
    kourels.length > 0;


  /* =======================================================================
     ESPACE BACKEND
     
     IMPORTANT :
     On ne fait PAS confiance aveuglément à utilisateur.espace.
     Chaque rubrique est vérifiée avec utilisateur.permissions.
  ======================================================================= */

  const espaceBackend =
    useMemo(
      () =>
        Array.isArray(
          utilisateur?.espace
        )
          ? utilisateur.espace
          : [],
      [utilisateur]
    );


  /* =======================================================================
     RUBRIQUES FINANCE AUTORISÉES
  ======================================================================= */

  const rubriquesFinanceAutorisees =
    useMemo(() => {

      return rubriquesFinance.filter(
        (rubrique) =>
          aPermission(
            rubrique.permission
          )
      );

    }, [
      permissionsSet,
    ]);


  /* =======================================================================
     RUBRIQUES KOUREL AUTORISÉES
     
     IMPORTANT :
     L'appartenance à un Kourel n'accorde pas automatiquement
     l'accès aux rubriques.
     
     Il faut :
       1. être membre du Kourel ;
       2. posséder la permission correspondante.
  ======================================================================= */

  const rubriquesKourelAutorisees =
    useMemo(() => {

      if (!estMembreKourel) {
        return [];
      }

      return rubriquesKourel.filter(
        (rubrique) =>
          possedeUnePermission(
            permissions,
            rubrique.permissions
          )
      );

    }, [
      estMembreKourel,
      permissions,
    ]);


  /* =======================================================================
     ESPACE BACKEND AUTORISÉ
     
     Les éléments provenant du backend doivent eux aussi être vérifiés.
  ======================================================================= */

  const espaceBackendAutorise =
    useMemo(() => {

      return espaceBackend.filter(
        (item) => {

          if (
            !item ||
            !item.code ||
            !item.route ||
            !item.label
          ) {
            return false;
          }


          /*
           * Si le backend fournit directement la permission
           * de la rubrique, on l'utilise.
           */
          if (item.permission) {

            return aPermission(
              item.permission
            );

          }


          /*
           * Correspondance de sécurité pour les rubriques
           * connues de l'application.
           */

          const correspondances = {
            MEMBRES:
              "MEMBRE_CONSULTER",

            COTISATIONS:
              "COTISATION_CONSULTER",

            PAIEMENTS:
              "PAIEMENT_CONSULTER",

            DEPENSES:
              "DEPENSE_CONSULTER",

            FINANCES:
              "DEPENSE_CONSULTER",

            AIDES_EXTERIEURES:
              "AIDE_EXTERIEURE_CONSULTER",

            COMMUNICATIONS:
              "COMMUNICATION_CONSULTER",

            NOTIFICATIONS:
              "NOTIFICATION_CONSULTER",

            REUNIONS:
              "REUNION_CONSULTER",

            PROGRAMMES:
              "PROGRAMME_CONSULTER",

            KHASSIDAS:
              "KHASSIDA_CONSULTER",

            KOURELS:
              "KOUREL_CONSULTER",

            MON_KOUREL:
              "KOUREL_CONSULTER",

            PROGRAMME_KOUREL:
              "PROGRAMME_KOUREL_CONSULTER",

            REPETITIONS:
              "REPETITION_CONSULTER",

            DECLAMATIONS:
              "DECLAMATION_CONSULTER",

            ACTIVITES_KOUREL:
              "ACTIVITE_KOUREL_CONSULTER",

            AUDIOS:
              "AUDIO_CONSULTER",

            EVENEMENTS:
              "EVENEMENT_CONSULTER",

            UTILISATEURS:
              "UTILISATEUR_CONSULTER",

            FONCTIONS:
              "FONCTION_CONSULTER",

            PERMISSIONS:
              "PERMISSION_CONSULTER",
          };


          const permissionAttendue =
            correspondances[
              item.code
            ];


          /*
           * Si on connaît la permission attendue,
           * elle doit obligatoirement être présente.
           */
          if (permissionAttendue) {

            return aPermission(
              permissionAttendue
            );

          }


          /*
           * Si aucune correspondance n'est connue,
           * on ne l'affiche pas automatiquement.
           *
           * Cela évite qu'une rubrique apparaisse
           * sans permission explicite.
           */
          return false;

        }
      );

    }, [
      espaceBackend,
      permissionsSet,
    ]);


  /* =======================================================================
     ESPACE FINAL
     
     Une seule source visuelle finale.
     
     Priorité :
       1. rubriques backend autorisées ;
       2. rubriques Finance autorisées ;
       3. rubriques Kourel autorisées.
     
     Aucun doublon.
  ======================================================================= */

  const espaceVisible =
    useMemo(() => {

      const resultat = [];
      const codes = new Set();


      /* ---------------------------------------------------------------
         BACKEND
      --------------------------------------------------------------- */

      espaceBackendAutorise.forEach(
        (item) => {

          if (
            codes.has(
              item.code
            )
          ) {
            return;
          }

          codes.add(
            item.code
          );

          resultat.push(
            item
          );

        }
      );


      /* ---------------------------------------------------------------
         FINANCE
      --------------------------------------------------------------- */

      rubriquesFinanceAutorisees.forEach(
        (rubrique) => {

          if (
            codes.has(
              rubrique.code
            )
          ) {
            return;
          }

          codes.add(
            rubrique.code
          );

          resultat.push(
            rubrique
          );

        }
      );


      /* ---------------------------------------------------------------
         KOUREL
      --------------------------------------------------------------- */

      rubriquesKourelAutorisees.forEach(
        (rubrique) => {

          if (
            codes.has(
              rubrique.code
            )
          ) {
            return;
          }

          codes.add(
            rubrique.code
          );

          resultat.push(
            rubrique
          );

        }
      );


      return resultat;

    }, [
      espaceBackendAutorise,
      rubriquesFinanceAutorisees,
      rubriquesKourelAutorisees,
    ]);


  /* =======================================================================
     AUDIO DU JOUR
  ======================================================================= */

  const peutVoirAudioDuJour =
    estMembreKourel &&
    (
      aPermission(
        "AUDIO_CONSULTER"
      ) ||
      aPermission(
        "KHASSIDA_CONSULTER"
      )
    );


  /* =======================================================================
     DOU'A / RAPPEL DU JOUR
  ======================================================================= */

  const numeroJour =
    Math.floor(
      (
        new Date(
          heure.getFullYear(),
          heure.getMonth(),
          heure.getDate()
        ).getTime() -
        new Date(
          heure.getFullYear(),
          0,
          1
        ).getTime()
      ) /
        (1000 * 60 * 60 * 24)
    );

  const indexSpirituel =
    numeroJour %
    DOUAS_SEMAINE.length;

  const douaSemaine =
    DOUAS_SEMAINE[
      indexSpirituel
    ];

  const rappelJour =
    RAPPELS[
      indexSpirituel %
      RAPPELS.length
    ];


  /* =======================================================================
     PROCHAINE PRIÈRE
  ======================================================================= */

  const prochainePriere =
    useMemo(() => {

      if (!horairesPriere) {
        return null;
      }

      const maintenant =
        new Date();

      const minutesActuelles =
        maintenant.getHours() * 60 +
        maintenant.getMinutes();

      for (const priere of PRIERES) {

        const valeur =
          horairesPriere[
            priere.cle
          ];

        if (!valeur) {
          continue;
        }

        const [h, m] =
          valeur
            .split(":")
            .map(Number);

        const minutesPriere =
          h * 60 + m;

        if (
          minutesPriere >
          minutesActuelles
        ) {

          return {
            ...priere,
            minutesPriere,
          };

        }

      }

      return null;

    }, [
      horairesPriere,
      heure,
    ]);


  /* =======================================================================
     TEMPS RESTANT
  ======================================================================= */

  const tempsRestant =
    useMemo(() => {

      if (!prochainePriere) {
        return "--";
      }

      const maintenant =
        heure.getHours() * 60 +
        heure.getMinutes();

      const secondes =
        heure.getSeconds();

      let difference =
        prochainePriere.minutesPriere -
        maintenant;

      if (difference < 0) {
        difference += 24 * 60;
      }

      let totalSecondes =
        difference * 60 -
        secondes;

      if (totalSecondes < 0) {
        totalSecondes = 0;
      }

      const heures =
        Math.floor(
          totalSecondes /
            3600
        );

      const minutes =
        Math.floor(
          (
            totalSecondes %
            3600
          ) / 60
        );

      const secondesRestantes =
        totalSecondes %
        60;

      if (heures > 0) {
        return `${heures}h ${String(
          minutes
        ).padStart(2, "0")}m`;
      }

      return `${minutes}m ${String(
        secondesRestantes
      ).padStart(2, "0")}s`;

    }, [
      prochainePriere,
      heure,
    ]);


  /* =======================================================================
     NAVIGATION
  ======================================================================= */

  function naviguer(route) {

    if (!route) {
      return;
    }

    setElementActif(
      route
    );

    setMenuOuvert(
      false
    );

    setTimeout(() => {

      navigate(
        route
      );

      setElementActif(
        null
      );

    }, 180);

  }


  /* =======================================================================
     DÉCONNEXION
  ======================================================================= */

  async function quitter() {

    try {

      await deconnexion();

    } catch (error) {

      console.error(
        "Erreur déconnexion :",
        error
      );

    } finally {

      navigate(
        "/login",
        {
          replace: true,
        }
      );

    }

  }


  /* =======================================================================
     DATE / HEURE
  ======================================================================= */

  const dateTexte =
    heure.toLocaleDateString(
      "fr-FR",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );

  const heureTexte =
    heure.toLocaleTimeString(
      "fr-FR",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );


  /* =========================================================================
     RENDER
  ========================================================================= */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* ===================================================================
          BACKGROUND
      =================================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div
          className="
            absolute
            -left-40
            -top-40
            h-96
            w-96
            rounded-full
            bg-emerald-300/20
            blur-3xl
            animate-pulse
          "
        />

        <div
          className="
            absolute
            -bottom-40
            -right-40
            h-96
            w-96
            rounded-full
            bg-teal-300/20
            blur-3xl
            animate-pulse
          "
        />

      </div>


      {/* ===================================================================
          HEADER
      =================================================================== */}

      <header
        className="
          sticky
          top-0
          z-50
          border-b
          border-slate-200/70
          bg-white/85
          backdrop-blur-xl
        "
      >

        <div
          className="
            mx-auto
            flex
            max-w-7xl
            items-center
            justify-between
            px-4
            py-4
            sm:px-6
            lg:px-8
          "
        >

          <button
            type="button"
            onClick={() =>
              naviguer(
                "/mon-espace"
              )
            }
            className="group flex items-center gap-3"
          >

            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-2xl
                bg-gradient-to-br
                from-emerald-600
                to-teal-700
                text-white
                shadow-lg
                shadow-emerald-600/20
                transition-transform
                duration-300
                group-hover:scale-105
              "
            >
              <Home size={21} />
            </div>

            <div className="hidden sm:block">

              <p className="text-sm font-black tracking-tight text-slate-900">
                Mon Espace
              </p>

              <p className="text-xs text-slate-400">
                Dahira
              </p>

            </div>

          </button>


          <div className="hidden items-center gap-3 md:flex">

            <div className="hidden text-right lg:block">

              <p className="text-xs capitalize text-slate-400">
                {dateTexte}
              </p>

              <p className="text-sm font-black text-slate-800">
                {heureTexte}
              </p>

            </div>

            <div className="h-8 w-px bg-slate-200" />


            {/* -------------------------------------------------------------
                NOTIFICATIONS
                Visible uniquement avec NOTIFICATION_CONSULTER
            ------------------------------------------------------------- */}

            {aPermission(
              "NOTIFICATION_CONSULTER"
            ) && (

              <button
                type="button"
                onClick={() =>
                  naviguer(
                    "/notifications"
                  )
                }
                className="
                  relative
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-100
                  text-slate-600
                  transition-all
                  hover:bg-emerald-50
                  hover:text-emerald-700
                "
              >

                <Bell size={19} />

                <span
                  className="
                    absolute
                    right-2
                    top-2
                    h-2
                    w-2
                    rounded-full
                    bg-rose-500
                    ring-2
                    ring-white
                    animate-pulse
                  "
                />

              </button>

            )}


            <div className="flex items-center gap-3">

              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-gradient-to-br
                  from-emerald-500
                  to-teal-700
                  text-sm
                  font-black
                  text-white
                  shadow-lg
                "
              >
                {initiales}
              </div>

              <div className="hidden lg:block">

                <p className="text-sm font-bold text-slate-900">
                  {nomUtilisateur}
                </p>

                <p className="text-xs text-slate-400">
                  {fonctionPrincipale}
                </p>

              </div>

            </div>


            <button
              type="button"
              onClick={quitter}
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                text-slate-400
                transition
                hover:bg-rose-50
                hover:text-rose-600
              "
              title="Déconnexion"
            >
              <LogOut size={18} />
            </button>

          </div>


          <button
            type="button"
            onClick={() =>
              setMenuOuvert(true)
            }
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-slate-100
              text-slate-700
              md:hidden
            "
          >
            <Menu size={21} />
          </button>

        </div>

      </header>


      {/* ===================================================================
          MENU MOBILE
      =================================================================== */}

      {menuOuvert && (

        <div className="fixed inset-0 z-[100] md:hidden">

          <button
            type="button"
            aria-label="Fermer"
            onClick={() =>
              setMenuOuvert(false)
            }
            className="
              absolute
              inset-0
              bg-slate-950/40
              backdrop-blur-sm
            "
          />

          <div
            className="
              absolute
              right-0
              top-0
              h-full
              w-[88%]
              max-w-sm
              animate-[slideIn_0.3s_ease-out]
              overflow-y-auto
              bg-white
              p-6
              shadow-2xl
            "
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="font-black text-slate-900">
                  Menu
                </p>

                <p className="text-xs text-slate-400">
                  {nomUtilisateur}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setMenuOuvert(false)
                }
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-100
                "
              >
                <X size={19} />
              </button>

            </div>


            <div className="mt-8 space-y-2">

              {espaceVisible.map(
                (item) => {

                  const Icon =
                    icones[
                      item.icone
                    ] ||
                    BookOpen;

                  return (

                    <button
                      key={
                        item.code
                      }
                      type="button"
                      onClick={() =>
                        naviguer(
                          item.route
                        )
                      }
                      className="
                        group
                        flex
                        w-full
                        items-center
                        gap-4
                        rounded-2xl
                        p-4
                        text-left
                        transition
                        hover:bg-emerald-50
                      "
                    >

                      <div
                        className="
                          flex
                          h-10
                          w-10
                          items-center
                          justify-center
                          rounded-xl
                          bg-emerald-50
                          text-emerald-600
                          transition
                          group-hover:bg-emerald-100
                        "
                      >
                        <Icon size={20} />
                      </div>

                      <div>

                        <p className="font-semibold">
                          {item.label}
                        </p>

                        {item.description && (
                          <p className="mt-0.5 text-xs text-slate-400">
                            {item.description}
                          </p>
                        )}

                      </div>

                    </button>

                  );

                }
              )}

            </div>


            <button
              type="button"
              onClick={quitter}
              className="
                mt-8
                flex
                w-full
                items-center
                gap-3
                rounded-2xl
                bg-rose-50
                p-4
                font-semibold
                text-rose-600
              "
            >
              <LogOut size={19} />
              Déconnexion
            </button>

          </div>

        </div>

      )}


      {/* ===================================================================
          CONTENU
      =================================================================== */}

      <main
        className="
          relative
          mx-auto
          max-w-7xl
          px-4
          py-8
          sm:px-6
          lg:px-8
        "
      >

        {/* =================================================================
            HERO
        ================================================================= */}

        <section
          className="
            relative
            overflow-hidden
            rounded-[2rem]
            bg-gradient-to-br
            from-emerald-950
            via-emerald-900
            to-teal-900
            p-6
            text-white
            shadow-2xl
            shadow-emerald-900/20
            sm:p-8
            lg:p-10
          "
        >

          <div
            className="
              absolute
              -right-20
              -top-20
              h-72
              w-72
              rounded-full
              bg-emerald-400/10
              blur-3xl
              animate-pulse
            "
          />

          <div
            className="
              absolute
              -bottom-32
              left-1/3
              h-72
              w-72
              rounded-full
              bg-teal-300/10
              blur-3xl
            "
          />

          <div
            className="
              relative
              z-10
              grid
              gap-8
              lg:grid-cols-[1fr_auto]
              lg:items-center
            "
          >

            <div>

              <div
                className="
                  mb-5
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-white/10
                  bg-white/10
                  px-3
                  py-1.5
                  text-xs
                  font-semibold
                  text-emerald-100
                  backdrop-blur
                "
              >
                <Sparkles size={14} />
                Bienvenue dans votre espace
              </div>

              <h1
                className="
                  max-w-2xl
                  text-3xl
                  font-black
                  tracking-tight
                  sm:text-4xl
                  lg:text-5xl
                "
              >
                As Salam 'Alaykum{" "}

                <span className="text-emerald-300">
                  {prenomUtilisateur ||
                    "Membre"}
                </span>{" "}

                👋
              </h1>

              <p
                className="
                  mt-4
                  max-w-xl
                  text-sm
                  leading-6
                  text-emerald-100/75
                  sm:text-base
                "
              >
                Retrouvez vos informations,
                vos activités et vos rappels
                spirituels au même endroit.
              </p>


              {estMembreKourel && (

                <div
                  className="
                    mt-6
                    inline-flex
                    items-center
                    gap-3
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/10
                    px-4
                    py-3
                    backdrop-blur
                  "
                >

                  <div
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-xl
                      bg-amber-400/20
                      text-amber-300
                    "
                  >
                    <Music size={18} />
                  </div>

                  <div>

                    <p className="text-xs text-emerald-100/60">
                      Membre du Kourel
                    </p>

                    <p className="text-sm font-bold">
                      {kourels.length === 1
                        ? kourels[0]?.nom ||
                          "Kourel"
                        : `${kourels.length} Kourels`}
                    </p>

                  </div>

                </div>

              )}

            </div>


            <div className="hidden lg:block">

              <div
                className="
                  flex
                  h-36
                  w-36
                  items-center
                  justify-center
                  rounded-[2rem]
                  border
                  border-white/10
                  bg-white/10
                  text-5xl
                  font-black
                  shadow-2xl
                  backdrop-blur-xl
                  transition-transform
                  duration-700
                  hover:rotate-3
                  hover:scale-105
                "
              >
                {initiales}
              </div>

            </div>

          </div>

        </section>


        {/* =================================================================
            HORAIRES DE PRIÈRE
        ================================================================= */}

        <HorairesPriere
          horaires={horairesPriere}
          prochainePriere={
            prochainePriere
          }
          tempsRestant={
            tempsRestant
          }
        />


        {/* =================================================================
            AUDIO DU JOUR — KOUREL
        ================================================================= */}

        {peutVoirAudioDuJour && (
          <section className="mt-6">
            <AudioDuJour />
          </section>
        )}


        {/* =================================================================
            INSPIRATION SPIRITUELLE
        ================================================================= */}

        <section
          className="
            mt-6
            grid
            gap-5
            lg:grid-cols-2
          "
        >

          <DouaSemaine
            doua={douaSemaine}
          />

          <RappelJour
            rappel={rappelJour}
          />

        </section>


        {/* =================================================================
            COMMUNICATIONS
        ================================================================= */}

        {peutVoirCommunications && (

          <section className="mt-6">

            {chargementCommunications ? (

              <div
                className="
                  rounded-[2rem]
                  border
                  border-slate-200
                  bg-white
                  p-8
                  text-center
                  shadow-sm
                "
              >

                <div
                  className="
                    mx-auto
                    h-8
                    w-8
                    animate-spin
                    rounded-full
                    border-2
                    border-slate-200
                    border-t-emerald-600
                  "
                />

                <p className="mt-3 text-xs text-slate-400">
                  Chargement des communications...
                </p>

              </div>

            ) : (

              <CommunicationsRecentes
                communications={
                  communications
                }
                onNavigate={
                  naviguer
                }
              />

            )}

          </section>

        )}


        {/* =================================================================
            STATISTIQUES
        ================================================================= */}

        <section
          className="
            mt-6
            grid
            gap-4
            sm:grid-cols-2
            lg:grid-cols-4
          "
        >

          <Statistique
            icon={Heart}
            label="Statut"
            value={
              utilisateur?.actif
                ? "Actif"
                : "Inactif"
            }
            description="Compte utilisateur"
          />

          <Statistique
            icon={Users}
            label="Kourel"
            value={
              estMembreKourel
                ? kourels.length
                : "—"
            }
            description={
              estMembreKourel
                ? "Kourel(s) affilié(s)"
                : "Aucune affiliation"
            }
          />

          <Statistique
            icon={CheckCircle2}
            label="Permissions"
            value={
              permissions.length
            }
            description="Accès disponibles"
          />

          <Statistique
            icon={BookOpen}
            label="Rubriques"
            value={
              espaceVisible.length
            }
            description="Dans votre espace"
          />

        </section>


        {/* =================================================================
            ACCÈS RAPIDES
        ================================================================= */}

        <section className="mt-10">

          <div
            className="
              flex
              flex-col
              justify-between
              gap-3
              sm:flex-row
              sm:items-end
            "
          >

            <div>

              <div className="flex items-center gap-2 text-emerald-600">

                <Sparkles size={17} />

                <span
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-[0.18em]
                  "
                >
                  Votre espace
                </span>

              </div>

              <h2
                className="
                  mt-2
                  text-2xl
                  font-black
                  tracking-tight
                  text-slate-900
                  sm:text-3xl
                "
              >
                Accès rapides
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Retrouvez uniquement les fonctionnalités
                auxquelles votre compte a accès.
              </p>

            </div>

            <div
              className="
                rounded-full
                bg-slate-100
                px-4
                py-2
                text-xs
                font-semibold
                text-slate-500
              "
            >
              {espaceVisible.length}{" "}
              rubrique
              {espaceVisible.length > 1
                ? "s"
                : ""}
            </div>

          </div>

        </section>


        {/* =================================================================
            CARTES
        ================================================================= */}

        {espaceVisible.length > 0 ? (

          <section
            className="
              mt-6
              grid
              gap-5
              sm:grid-cols-2
              lg:grid-cols-3
            "
          >

            {espaceVisible.map(
              (item, index) => (

                <div
                  key={
                    item.code
                  }
                  className="
                    animate-[fadeUp_0.55s_ease-out_both]
                  "
                >

                  <CarteEspace
                    item={item}
                    index={index}
                    onNavigate={
                      naviguer
                    }
                    active={
                      elementActif ===
                      item.route
                    }
                  />

                </div>

              )
            )}

          </section>

        ) : (

          <section
            className="
              mt-6
              rounded-3xl
              border
              border-dashed
              border-slate-300
              bg-white
              p-10
              text-center
            "
          >

            <div
              className="
                mx-auto
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-2xl
                bg-slate-100
                text-slate-400
              "
            >
              <BookOpen size={28} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              Aucun accès disponible
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Votre compte ne dispose
              actuellement d'aucune rubrique
              accessible.
            </p>

          </section>

        )}


        {/* =================================================================
            ESPACE KOUREL
        ================================================================= */}

        {estMembreKourel &&
          rubriquesKourelAutorisees.length >
            0 && (

          <section
            className="
              mt-10
              overflow-hidden
              rounded-[2rem]
              border
              border-emerald-100
              bg-white
              shadow-sm
            "
          >

            <div
              className="
                bg-gradient-to-r
                from-emerald-50
                via-teal-50
                to-cyan-50
                p-6
                sm:p-8
              "
            >

              <div
                className="
                  flex
                  flex-col
                  gap-6
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >

                <div className="flex items-center gap-4">

                  <div
                    className="
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-2xl
                      bg-gradient-to-br
                      from-emerald-500
                      to-teal-600
                      text-white
                      shadow-lg
                    "
                  >
                    <Music size={25} />
                  </div>

                  <div>

                    <p
                      className="
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-emerald-600
                      "
                    >
                      Espace Kourel
                    </p>

                    <h3
                      className="
                        mt-1
                        text-xl
                        font-black
                        text-slate-900
                      "
                    >
                      {kourels.length === 1
                        ? kourels[0]?.nom ||
                          "Mon Kourel"
                        : `${kourels.length} Kourels`}
                    </h3>

                  </div>

                </div>


                {rubriquesKourelAutorisees.some(
                  (item) =>
                    item.code ===
                    "MON_KOUREL"
                ) && (

                  <button
                    type="button"
                    onClick={() =>
                      naviguer(
                        "/mon-kourel"
                      )
                    }
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      rounded-2xl
                      bg-emerald-700
                      px-5
                      py-3
                      text-sm
                      font-bold
                      text-white
                      shadow-lg
                      shadow-emerald-700/20
                      transition-all
                      hover:-translate-y-0.5
                      hover:bg-emerald-800
                      hover:shadow-xl
                    "
                  >
                    Ouvrir mon Kourel
                    <ArrowRight size={17} />
                  </button>

                )}

              </div>


              {kourels.length > 1 && (

                <div
                  className="
                    mt-6
                    grid
                    gap-3
                    sm:grid-cols-2
                  "
                >

                  {kourels.map(
                    (kourel) => (

                      <button
                        type="button"
                        key={
                          kourel.id
                        }
                        onClick={() =>
                          naviguer(
                            `/kourels/${kourel.id}`
                          )
                        }
                        className="
                          group
                          flex
                          items-center
                          justify-between
                          rounded-2xl
                          border
                          border-emerald-100
                          bg-white/80
                          p-4
                          text-left
                          transition
                          hover:-translate-y-1
                          hover:shadow-md
                        "
                      >

                        <div>

                          <p className="text-sm font-bold text-slate-900">
                            {kourel.nom}
                          </p>

                          {kourel.date_entree && (

                            <p className="mt-1 text-xs text-slate-400">
                              Membre depuis le{" "}
                              {new Date(
                                kourel.date_entree
                              ).toLocaleDateString(
                                "fr-FR"
                              )}
                            </p>

                          )}

                        </div>

                        <ChevronRight
                          size={18}
                          className="
                            text-slate-300
                            transition
                            group-hover:translate-x-1
                            group-hover:text-emerald-600
                          "
                        />

                      </button>

                    )
                  )}

                </div>

              )}

            </div>


            <div className="p-6 sm:p-8">

              <div className="mb-5">

                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-wider
                    text-emerald-600
                  "
                >
                  Activités
                </p>

                <h4 className="mt-1 text-lg font-black text-slate-900">
                  Activités de votre Kourel
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Accédez aux fonctionnalités
                  selon vos permissions.
                </p>

              </div>


              <div
                className="
                  grid
                  gap-3
                  sm:grid-cols-2
                  lg:grid-cols-3
                "
              >

                {rubriquesKourelAutorisees
                  .filter(
                    (item) =>
                      item.code !==
                      "MON_KOUREL"
                  )
                  .map(
                    (item) => {

                      const Icon =
                        icones[
                          item.icone
                        ] ||
                        BookOpen;

                      return (

                        <button
                          type="button"
                          key={
                            item.code
                          }
                          onClick={() =>
                            naviguer(
                              item.route
                            )
                          }
                          className="
                            group
                            rounded-2xl
                            border
                            border-slate-200
                            bg-slate-50
                            p-4
                            text-left
                            transition
                            hover:-translate-y-1
                            hover:border-emerald-200
                            hover:bg-emerald-50
                            hover:shadow-md
                          "
                        >

                          <div className="flex items-center justify-between">

                            <div
                              className="
                                flex
                                h-11
                                w-11
                                items-center
                                justify-center
                                rounded-xl
                                bg-white
                                text-emerald-600
                                shadow-sm
                              "
                            >
                              <Icon size={20} />
                            </div>

                            <ChevronRight
                              size={17}
                              className="
                                text-slate-300
                                transition
                                group-hover:translate-x-1
                                group-hover:text-emerald-600
                              "
                            />

                          </div>

                          <p className="mt-4 text-sm font-bold text-slate-900">
                            {item.label}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {item.description}
                          </p>

                        </button>

                      );

                    }
                  )}

              </div>

            </div>

          </section>

        )}


        {/* =================================================================
            FOOTER
        ================================================================= */}

        <footer
          className="
            mt-12
            border-t
            border-slate-200
            py-8
          "
        >

          <div
            className="
              flex
              flex-col
              items-center
              justify-between
              gap-3
              text-center
              sm:flex-row
              sm:text-left
            "
          >

            <div>

              <p className="text-sm font-bold text-slate-700">
                Dahira
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Votre espace personnel et spirituel
              </p>

            </div>

            <p className="text-xs text-slate-400">
              ©{" "}
              {new Date().getFullYear()}
              {" "}— Tous droits réservés
            </p>

          </div>

        </footer>

      </main>


      {/* ===================================================================
          ANIMATIONS
      =================================================================== */}

      <style>{`

        @keyframes fadeUp {

          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }

        }

        @keyframes slideIn {

          from {
            opacity: 0;
            transform: translateX(100%);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }

        }

      `}</style>

    </div>
  );
}