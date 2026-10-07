import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Wallet,
  CalendarDays,
  BookOpen,
  LogOut,
  Menu,
  X,
  Home,
  Megaphone,
  Bell,
  Music,
  ChevronRight,
  Sparkles,
  Search,
  CircleUserRound,
  Clock3,
  Star,
  UserCog,
  Settings2,
  HandCoins,
  CreditCard,
  Receipt,
  Landmark,
  CalendarCheck,
  Globe2,
  Images,
  Repeat2,
} from "lucide-react";

import { useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";


/*
|--------------------------------------------------------------------------
| ICÔNES BACKEND
|--------------------------------------------------------------------------
*/

const ICONES = {
  dashboard: LayoutDashboard,
  users: Users,
  wallet: Wallet,
  calendar: CalendarDays,
  "book-open": BookOpen,
  headphones: Music,
  music: Music,
  megaphone: Megaphone,
  bell: Bell,
  user: CircleUserRound,
  userCog: UserCog,
  settings: Settings2,
  handCoins: HandCoins,
  creditCard: CreditCard,
  receipt: Receipt,
  landmark: Landmark,
  calendarCheck: CalendarCheck,
  globe: Globe2,
  images: Images,
  repeat: Repeat2,
};


/*
|--------------------------------------------------------------------------
| RUBRIQUES KOUREL
|--------------------------------------------------------------------------
*/

const RUBRIQUES_KOUREL = [
  {
    code: "MON_KOUREL",
    nom: "Mon Kourel",
    description: "Mon espace de Kourel",
    chemin: "/mon-kourel",
    permission: "KOUREL_CONSULTER",
    icone: Users,
    couleur: "amber",
  },

  {
    code: "PROGRAMME_RELIGIEUX",
    nom: "Programme religieux",
    description: "Répétitions et déclamations",
    chemin: "/programme-religieux",
    permission: "KOUREL_CONSULTER",
    icone: CalendarDays,
    couleur: "amber",
  },

  {
    code: "KHASSIDAS",
    nom: "Khassidas",
    description: "Khassidas, tons et audios",
    chemin: "/khassidas",
    permission: "KOUREL_CONSULTER",
    icone: BookOpen,
    couleur: "amber",
  },
];


/*
|--------------------------------------------------------------------------
| COULEURS MENU
|--------------------------------------------------------------------------
*/

const COULEURS_MENU = {
  emerald: {
    fond: "bg-emerald-50",
    fondHover: "hover:bg-emerald-50",
    texte: "text-emerald-700",
    texteActif: "text-emerald-950",
    icone: "text-emerald-600",
    bordure: "border-emerald-100",
    point: "bg-emerald-500",
  },

  blue: {
    fond: "bg-blue-50",
    fondHover: "hover:bg-blue-50",
    texte: "text-blue-700",
    texteActif: "text-blue-950",
    icone: "text-blue-600",
    bordure: "border-blue-100",
    point: "bg-blue-500",
  },

  violet: {
    fond: "bg-violet-50",
    fondHover: "hover:bg-violet-50",
    texte: "text-violet-700",
    texteActif: "text-violet-950",
    icone: "text-violet-600",
    bordure: "border-violet-100",
    point: "bg-violet-500",
  },

  amber: {
    fond: "bg-amber-50",
    fondHover: "hover:bg-amber-50",
    texte: "text-amber-700",
    texteActif: "text-amber-950",
    icone: "text-amber-600",
    bordure: "border-amber-100",
    point: "bg-amber-500",
  },

  rose: {
    fond: "bg-rose-50",
    fondHover: "hover:bg-rose-50",
    texte: "text-rose-700",
    texteActif: "text-rose-950",
    icone: "text-rose-600",
    bordure: "border-rose-100",
    point: "bg-rose-500",
  },

  cyan: {
    fond: "bg-cyan-50",
    fondHover: "hover:bg-cyan-50",
    texte: "text-cyan-700",
    texteActif: "text-cyan-950",
    icone: "text-cyan-600",
    bordure: "border-cyan-100",
    point: "bg-cyan-500",
  },
};


/*
|--------------------------------------------------------------------------
| NAVIGATION ITEM
|--------------------------------------------------------------------------
*/

function NavigationItem({
  item,
  fermerMenu,
  index = 0,
}) {
  const Icon = item?.icone || BookOpen;

  const couleur =
    COULEURS_MENU[item?.couleur || "emerald"] ||
    COULEURS_MENU.emerald;

  return (
    <NavLink
      to={item.chemin}
      onClick={fermerMenu}
      style={{
        animationDelay: `${index * 35}ms`,
      }}
      className={({ isActive }) => `
        group
        relative
        flex
        items-center
        gap-3
        overflow-hidden
        rounded-2xl
        border
        px-3
        py-2.5
        text-sm
        transition-all
        duration-200
        animate-[menuAppear_0.3s_ease-out_both]

        ${
          isActive
            ? `${couleur.fond} ${couleur.bordure} ${couleur.texteActif} shadow-sm`
            : `border-transparent text-slate-500 ${couleur.fondHover} hover:border-slate-100 hover:text-slate-900`
        }
      `}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className={`
                absolute
                left-0
                top-2
                bottom-2
                w-1
                rounded-r-full
                ${couleur.point}
              `}
            />
          )}

          <div
            className={`
              relative
              z-10
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              transition-all
              duration-200

              ${
                isActive
                  ? `${couleur.fond} ${couleur.icone}`
                  : "bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-700"
              }
            `}
          >
            <Icon
              size={18}
              strokeWidth={isActive ? 2.2 : 2}
            />
          </div>

          <div
            className="
              relative
              z-10
              min-w-0
              flex-1
            "
          >
            <p
              className={`
                truncate
                ${
                  isActive
                    ? "font-bold"
                    : "font-medium"
                }
              `}
            >
              {item.nom}
            </p>

            {item.description && (
              <p
                className={`
                  mt-0.5
                  truncate
                  text-[10px]
                  ${
                    isActive
                      ? `${couleur.texte} opacity-70`
                      : "text-slate-400"
                  }
                `}
              >
                {item.description}
              </p>
            )}
          </div>

          <ChevronRight
            size={16}
            className={`
              relative
              z-10
              shrink-0
              transition-all
              duration-200

              ${
                isActive
                  ? `${couleur.texte} translate-x-0`
                  : "-translate-x-1 text-slate-200 group-hover:translate-x-0 group-hover:text-slate-400"
              }
            `}
          />
        </>
      )}
    </NavLink>
  );
}


/*
|--------------------------------------------------------------------------
| TITRE DE SECTION
|--------------------------------------------------------------------------
*/

function SectionTitre({
  children,
  couleur = "emerald",
  nombre,
  icone: Icon,
}) {
  const couleurs = {
    emerald: "text-emerald-700",
    blue: "text-blue-700",
    violet: "text-violet-700",
    amber: "text-amber-700",
    rose: "text-rose-700",
    cyan: "text-cyan-700",
  };

  return (
    <div
      className="
        mb-3
        flex
        items-center
        justify-between
        px-2
      "
    >
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon
            size={13}
            className={
              couleurs[couleur] || couleurs.emerald
            }
          />
        )}

        <p
          className={`
            text-[10px]
            font-black
            uppercase
            tracking-[0.18em]
            ${couleurs[couleur] || couleurs.emerald}
          `}
        >
          {children}
        </p>
      </div>

      {typeof nombre === "number" && (
        <span
          className="
            rounded-full
            bg-slate-100
            px-2
            py-0.5
            text-[9px]
            font-bold
            text-slate-400
          "
        >
          {nombre}
        </span>
      )}
    </div>
  );
}


/*
|--------------------------------------------------------------------------
| LAYOUT PRINCIPAL
|--------------------------------------------------------------------------
*/

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    utilisateur,
    deconnexion,
    aPermission,
  } = useAuth();

  const [menuOuvert, setMenuOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");


  /*
  |--------------------------------------------------------------------------
  | ESPACE UTILISATEUR
  |--------------------------------------------------------------------------
  */

  const espaceUtilisateur = useMemo(() => {
    return Array.isArray(utilisateur?.espace)
      ? utilisateur.espace
      : [];
  }, [utilisateur]);


  /*
  |--------------------------------------------------------------------------
  | KOURELS
  |--------------------------------------------------------------------------
  */

  const kourels = useMemo(() => {
    return Array.isArray(utilisateur?.kourels)
      ? utilisateur.kourels
      : [];
  }, [utilisateur]);

  const estMembreKourel =
    utilisateur?.est_membre_kourel === true ||
    kourels.length > 0;


  /*
  |--------------------------------------------------------------------------
  | PERMISSIONS
  |--------------------------------------------------------------------------
  */

  const possedePermission = useMemo(() => {
    return (permission) => {
      if (!permission) {
        return false;
      }

      if (typeof aPermission === "function") {
        return aPermission(permission);
      }

      const permissions =
        Array.isArray(utilisateur?.permission_codes)
          ? utilisateur.permission_codes
          : [];

      return permissions.includes(permission);
    };
  }, [aPermission, utilisateur]);


  /*
  |--------------------------------------------------------------------------
  | IDENTITÉ
  |--------------------------------------------------------------------------
  */

  const prenom =
    utilisateur?.prenom ||
    utilisateur?.membre?.prenom ||
    "";

  const nom =
    utilisateur?.nom ||
    utilisateur?.membre?.nom ||
    "";

  const nomComplet =
    `${prenom} ${nom}`.trim();

  const nomAffiche =
    nomComplet ||
    utilisateur?.identifiant ||
    "Utilisateur";

  const fonctionPrincipale =
    utilisateur?.fonctions?.[0]?.nom ||
    "Membre";


  /*
  |--------------------------------------------------------------------------
  | INITIALES
  |--------------------------------------------------------------------------
  */

  const initiales = useMemo(() => {
    const mots = nomAffiche
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
  }, [nomAffiche]);


  /*
  |--------------------------------------------------------------------------
  | ADMINISTRATION
  |--------------------------------------------------------------------------
  */

  const navigationAdministration = useMemo(() => {
    const items = [];

    if (possedePermission("UTILISATEUR_CONSULTER")) {
      items.push({
        code: "UTILISATEURS",
        nom: "Utilisateurs",
        description: "Gestion des utilisateurs",
        chemin: "/utilisateurs",
        permission: "UTILISATEUR_CONSULTER",
        icone: UserCog,
        couleur: "blue",
      });
    }

    if (possedePermission("GALERIE_CONSULTER")) {
      items.push({
        code: "GALERIE",
        nom: "Galerie",
        description: "Photos et médias",
        chemin: "/galerie",
        permission: "GALERIE_CONSULTER",
        icone: Images,
        couleur: "cyan",
      });
    }

    return items;
  }, [possedePermission]);


  /*
  |--------------------------------------------------------------------------
  | MEMBRES
  |--------------------------------------------------------------------------
  */

  const navigationMembres = useMemo(() => {
    if (!possedePermission("MEMBRE_CONSULTER")) {
      return [];
    }

    return [
      {
        code: "MEMBRES",
        nom: "Membres",
        description: "Gestion des membres",
        chemin: "/membres",
        permission: "MEMBRE_CONSULTER",
        icone: Users,
        couleur: "emerald",
      },
    ];
  }, [possedePermission]);


  /*
  |--------------------------------------------------------------------------
  | TABLEAU DE BORD
  |--------------------------------------------------------------------------
  */

  const navigationDashboard = useMemo(() => {
    if (!possedePermission("DASHBOARD_CONSULTER")) {
      return [];
    }

    return [
      {
        code: "DASHBOARD",
        nom: "Tableau de bord",
        description: "Vue générale du Dahira",
        chemin: "/dashboard",
        permission: "DASHBOARD_CONSULTER",
        icone: LayoutDashboard,
        couleur: "emerald",
      },
    ];
  }, [possedePermission]);


  /*
  |--------------------------------------------------------------------------
  | FINANCES
  |--------------------------------------------------------------------------
  */

  const navigationFinances = useMemo(() => {
    const items = [];

    if (possedePermission("COTISATION_CONSULTER")) {
      items.push({
        code: "COTISATIONS",
        nom: "Cotisations",
        description: "Suivi des cotisations",
        chemin: "/cotisations",
        permission: "COTISATION_CONSULTER",
        icone: HandCoins,
        couleur: "emerald",
      });
    }

    if (possedePermission("PAIEMENT_CONSULTER")) {
      items.push({
        code: "PAIEMENTS",
        nom: "Paiements",
        description: "Encaissements effectifs",
        chemin: "/paiements",
        permission: "PAIEMENT_CONSULTER",
        icone: CreditCard,
        couleur: "blue",
      });
    }

    if (
      possedePermission("DEPENSE_CONSULTER") ||
      possedePermission("AIDE_EXTERIEURE_CONSULTER")
    ) {
      items.push({
        code: "FINANCES",
        nom: "Finances",
        description: "Dépenses et aides extérieures",
        chemin: "/finances",
        permission: null,
        permissions: [
          "DEPENSE_CONSULTER",
          "AIDE_EXTERIEURE_CONSULTER",
        ],
        icone: Receipt,
        couleur: "violet",
      });
    }

    return items;
  }, [possedePermission]);


  /*
  |--------------------------------------------------------------------------
  | ACTIVITÉS
  |--------------------------------------------------------------------------
  */

  const navigationActivites = useMemo(() => {
    const items = [];

    items.push({
      code: "REUNIONS",
      nom: "Réunions",
      description: "Réunions du Dahira",
      chemin: "/reunions",
      permission: "REUNION_CONSULTER",
      icone: CalendarCheck,
      couleur: "blue",
    });

    if (possedePermission("REPETITION_CONSULTER")) {
      items.push({
        code: "REPETITIONS",
        nom: "Répétitions",
        description: "Programmes de répétition",
        chemin: "/repetitions",
        permission: "REPETITION_CONSULTER",
        icone: Repeat2,
        couleur: "amber",
      });
    }

    return items;
  }, [possedePermission]);


  /*
  |--------------------------------------------------------------------------
  | COMMUNICATION
  |--------------------------------------------------------------------------
  */

  const navigationCommunication = useMemo(() => {
    if (!possedePermission("COMMUNICATION_CONSULTER")) {
      return [];
    }

    return [
      {
        code: "COMMUNICATIONS",
        nom: "Communications",
        description: "Communications du Dahira",
        chemin: "/communications",
        permission: "COMMUNICATION_CONSULTER",
        icone: Megaphone,
        couleur: "rose",
      },
    ];
  }, [possedePermission]);


  /*
  |--------------------------------------------------------------------------
  | RELATIONS EXTÉRIEURES
  |--------------------------------------------------------------------------
  */

  const navigationRelations = useMemo(() => {
    if (!possedePermission("RELATION_EXTERIEUR_CONSULTER")) {
      return [];
    }

    return [
      {
        code: "RELATIONS_EXTERIEURES",
        nom: "Relations extérieures",
        description: "Relations et partenaires",
        chemin: "/relations-exterieures",
        permission: "RELATION_EXTERIEUR_CONSULTER",
        icone: Globe2,
        couleur: "cyan",
      },
    ];
  }, [possedePermission]);


  /*
  |--------------------------------------------------------------------------
  | KOUREL
  |--------------------------------------------------------------------------
  */

  const navigationKourel = useMemo(() => {
    if (!estMembreKourel) {
      return [];
    }

    if (!possedePermission("KOUREL_CONSULTER")) {
      return [];
    }

    return RUBRIQUES_KOUREL;
  }, [
    estMembreKourel,
    possedePermission,
  ]);


  /*
  |--------------------------------------------------------------------------
  | NOTIFICATIONS
  |--------------------------------------------------------------------------
  */

  const navigationNotifications = useMemo(() => {
    if (!possedePermission("NOTIFICATION_CONSULTER")) {
      return [];
    }

    return [
      {
        code: "NOTIFICATIONS",
        nom: "Notifications",
        description: "Notifications et alertes",
        chemin: "/notifications",
        permission: "NOTIFICATION_CONSULTER",
        icone: Bell,
        couleur: "rose",
      },
    ];
  }, [possedePermission]);


  /*
  |--------------------------------------------------------------------------
  | RECHERCHE
  |--------------------------------------------------------------------------
  */

  const filtrerRubriques = (rubriques) => {
    const terme = recherche
      .trim()
      .toLowerCase();

    if (!terme) {
      return rubriques;
    }

    return rubriques.filter((item) =>
      `${item.nom} ${item.description || ""}`
        .toLowerCase()
        .includes(terme)
    );
  };


  const navigationAdministrationFiltre =
    useMemo(
      () =>
        filtrerRubriques(
          navigationAdministration
        ),
      [navigationAdministration, recherche]
    );

  const navigationMembresFiltre =
    useMemo(
      () =>
        filtrerRubriques(
          navigationMembres
        ),
      [navigationMembres, recherche]
    );

  const navigationDashboardFiltre =
    useMemo(
      () =>
        filtrerRubriques(
          navigationDashboard
        ),
      [navigationDashboard, recherche]
    );

  const navigationFinancesFiltre =
    useMemo(
      () =>
        filtrerRubriques(
          navigationFinances
        ),
      [navigationFinances, recherche]
    );

  const navigationActivitesFiltre =
    useMemo(
      () =>
        filtrerRubriques(
          navigationActivites
        ),
      [navigationActivites, recherche]
    );

  const navigationCommunicationFiltre =
    useMemo(
      () =>
        filtrerRubriques(
          navigationCommunication
        ),
      [navigationCommunication, recherche]
    );

  const navigationRelationsFiltre =
    useMemo(
      () =>
        filtrerRubriques(
          navigationRelations
        ),
      [navigationRelations, recherche]
    );

  const navigationKourelFiltre =
    useMemo(
      () =>
        filtrerRubriques(
          navigationKourel
        ),
      [navigationKourel, recherche]
    );

  const navigationNotificationsFiltre =
    useMemo(
      () =>
        filtrerRubriques(
          navigationNotifications
        ),
      [navigationNotifications, recherche]
    );


  /*
  |--------------------------------------------------------------------------
  | TOUTES LES RUBRIQUES
  |--------------------------------------------------------------------------
  */

  const toutesLesRubriques = useMemo(
    () => [
      ...navigationAdministration,
      ...navigationMembres,
      ...navigationDashboard,
      ...navigationFinances,
      ...navigationActivites,
      ...navigationCommunication,
      ...navigationRelations,
      ...navigationKourel,
      ...navigationNotifications,
    ],
    [
      navigationAdministration,
      navigationMembres,
      navigationDashboard,
      navigationFinances,
      navigationActivites,
      navigationCommunication,
      navigationRelations,
      navigationKourel,
      navigationNotifications,
    ]
  );


  const aucunResultat =
    recherche.trim() &&
    toutesLesRubriques.length > 0 &&
    toutesLesRubriques.every(
      (item) =>
        !`${item.nom} ${item.description || ""}`
          .toLowerCase()
          .includes(
            recherche.trim().toLowerCase()
          )
    );


  /*
  |--------------------------------------------------------------------------
  | TITRE PAGE
  |--------------------------------------------------------------------------
  */

  const titrePage = useMemo(() => {
    if (location.pathname === "/profil") {
      return "Mon profil";
    }

    const element = toutesLesRubriques.find(
      (item) =>
        location.pathname === item.chemin ||
        (
          item.chemin !== "/" &&
          location.pathname.startsWith(
            `${item.chemin}/`
          )
        )
    );

    if (element) {
      return element.nom;
    }

    if (location.pathname === "/mon-espace") {
      return "Mon espace";
    }

    return "Mon espace";
  }, [
    location.pathname,
    toutesLesRubriques,
  ]);


  /*
  |--------------------------------------------------------------------------
  | ACTIONS
  |--------------------------------------------------------------------------
  */

  async function handleLogout() {
    try {
      await deconnexion();
    } catch (error) {
      console.error(
        "Erreur déconnexion :",
        error
      );
    } finally {
      navigate("/login", {
        replace: true,
      });
    }
  }


  function fermerMenu() {
    setMenuOuvert(false);
  }


  function ouvrirProfil() {
    setMenuOuvert(false);
    navigate("/profil");
  }


  function retourAccueil() {
    fermerMenu();
    navigate("/");
  }


  /*
  |--------------------------------------------------------------------------
  | DATE
  |--------------------------------------------------------------------------
  */

  const dateTexte =
    new Date().toLocaleDateString(
      "fr-FR",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
      }
    );


  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className="
        min-h-screen
        w-full
        overflow-x-hidden
        bg-slate-50
        text-slate-900
      "
    >

      {/* =========================================================
          FOND DÉCORATIF
      ========================================================= */}

      <div
        className="
          pointer-events-none
          fixed
          inset-0
          z-0
          overflow-hidden
        "
      >
        <div
          className="
            absolute
            -left-40
            -top-40
            h-96
            w-96
            rounded-full
            bg-emerald-200/20
            blur-3xl
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
            bg-amber-200/15
            blur-3xl
          "
        />
      </div>


      {/* =========================================================
          OVERLAY MOBILE
      ========================================================= */}

      {menuOuvert && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={fermerMenu}
          className="
            fixed
            inset-0
            z-40
            bg-slate-950/20
            backdrop-blur-[2px]
            lg:hidden
          "
        />
      )}


      {/* =========================================================
          SIDEBAR
      ========================================================= */}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          flex
          h-screen
          w-[290px]
          flex-col
          overflow-hidden
          border-r
          border-slate-200
          bg-white
          text-slate-900
          shadow-[10px_0_40px_-30px_rgba(15,23,42,0.25)]
          transition-transform
          duration-300
          ease-out

          ${
            menuOuvert
              ? "translate-x-0"
              : "-translate-x-full"
          }

          lg:translate-x-0
        `}
      >

        {/* DÉCORATION SIDEBAR */}

        <div
          className="
            pointer-events-none
            absolute
            -right-24
            -top-24
            h-64
            w-64
            rounded-full
            bg-emerald-100/60
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-24
            -left-24
            h-64
            w-64
            rounded-full
            bg-amber-100/40
            blur-3xl
          "
        />


        {/* =====================================================
            HEADER SIDEBAR
        ===================================================== */}

        <div
          className="
            relative
            border-b
            border-slate-100
            px-5
            pb-5
            pt-6
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
            "
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  relative
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-2xl
                  bg-gradient-to-br
                  from-emerald-500
                  to-teal-600
                  text-xl
                  font-black
                  text-white
                  shadow-lg
                  shadow-emerald-600/15
                "
              >
                <span className="relative z-10">
                  ✦
                </span>

                <span
                  className="
                    absolute
                    inset-0
                    rounded-2xl
                    bg-white/10
                    blur-md
                  "
                />
              </div>


              <div className="min-w-0">

                <h1
                  className="
                    truncate
                    text-[15px]
                    font-black
                    tracking-tight
                    text-slate-900
                  "
                >
                  Dahira Mawahibou
                </h1>

                <p
                  className="
                    mt-0.5
                    text-xs
                    font-semibold
                    text-emerald-600
                  "
                >
                  Naafih de Castors
                </p>

              </div>

            </div>


            <button
              type="button"
              onClick={fermerMenu}
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                border
                border-slate-200
                bg-white
                text-slate-400
                transition
                hover:border-slate-300
                hover:bg-slate-50
                hover:text-slate-700
                lg:hidden
              "
            >
              <X size={18} />
            </button>

          </div>


          {/* PROFIL */}

          <button
            type="button"
            onClick={ouvrirProfil}
            className="
              group
              mt-5
              w-full
              rounded-2xl
              border
              border-slate-100
              bg-slate-50
              p-3
              text-left
              transition-all
              duration-200
              hover:border-emerald-100
              hover:bg-emerald-50/60
              hover:shadow-sm
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-gradient-to-br
                  from-emerald-500
                  to-teal-600
                  text-xs
                  font-black
                  text-white
                  shadow-md
                  shadow-emerald-600/15
                "
              >
                {initiales}
              </div>


              <div className="min-w-0 flex-1">

                <p
                  className="
                    truncate
                    text-xs
                    font-bold
                    text-slate-800
                  "
                >
                  {nomAffiche}
                </p>

                <div
                  className="
                    mt-1
                    flex
                    items-center
                    gap-1.5
                  "
                >

                  <span
                    className="
                      h-1.5
                      w-1.5
                      rounded-full
                      bg-emerald-500
                    "
                  />

                  <p
                    className="
                      truncate
                      text-[10px]
                      text-slate-400
                    "
                  >
                    {fonctionPrincipale}
                  </p>

                </div>

              </div>


              <CircleUserRound
                size={17}
                className="
                  text-slate-300
                  transition
                  group-hover:text-emerald-500
                "
              />

            </div>

          </button>

        </div>


        {/* =====================================================
            RECHERCHE
        ===================================================== */}

        <div className="relative px-5 pt-5">

          <div className="relative">

            <Search
              size={16}
              className="
                absolute
                left-3.5
                top-1/2
                -translate-y-1/2
                text-slate-300
              "
            />

            <input
              type="text"
              value={recherche}
              onChange={(e) =>
                setRecherche(e.target.value)
              }
              placeholder="Rechercher..."
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                py-2.5
                pl-10
                pr-3
                text-xs
                text-slate-800
                outline-none
                placeholder:text-slate-400
                transition
                focus:border-emerald-300
                focus:bg-white
                focus:ring-4
                focus:ring-emerald-500/5
              "
            />

          </div>

        </div>


        {/* =====================================================
            NAVIGATION
        ===================================================== */}

        <nav
          className="
            relative
            flex-1
            overflow-y-auto
            px-4
            py-6
          "
        >

          {/* ADMINISTRATION */}

          {navigationAdministrationFiltre.length > 0 && (
            <div className="mb-7">

              <SectionTitre
                couleur="blue"
                nombre={
                  navigationAdministrationFiltre.length
                }
                icone={Settings2}
              >
                Administration
              </SectionTitre>

              <div className="space-y-1">

                {navigationAdministrationFiltre.map(
                  (item, index) => (
                    <NavigationItem
                      key={item.chemin}
                      item={item}
                      index={index}
                      fermerMenu={fermerMenu}
                    />
                  )
                )}

              </div>

            </div>
          )}


          {/* MEMBRES */}

          {navigationMembresFiltre.length > 0 && (
            <div className="mb-7">

              <SectionTitre
                couleur="emerald"
                nombre={
                  navigationMembresFiltre.length
                }
                icone={Users}
              >
                Membres
              </SectionTitre>

              <div className="space-y-1">

                {navigationMembresFiltre.map(
                  (item, index) => (
                    <NavigationItem
                      key={item.chemin}
                      item={item}
                      index={index}
                      fermerMenu={fermerMenu}
                    />
                  )
                )}

              </div>

            </div>
          )}


          {/* TABLEAU DE BORD */}

          {navigationDashboardFiltre.length > 0 && (
            <div className="mb-7">

              <SectionTitre
                couleur="emerald"
                nombre={
                  navigationDashboardFiltre.length
                }
                icone={LayoutDashboard}
              >
                Tableau de bord
              </SectionTitre>

              <div className="space-y-1">

                {navigationDashboardFiltre.map(
                  (item, index) => (
                    <NavigationItem
                      key={item.chemin}
                      item={item}
                      index={index}
                      fermerMenu={fermerMenu}
                    />
                  )
                )}

              </div>

            </div>
          )}


          {/* FINANCES */}

          {navigationFinancesFiltre.length > 0 && (
            <div className="mb-7">

              <SectionTitre
                couleur="violet"
                nombre={
                  navigationFinancesFiltre.length
                }
                icone={Wallet}
              >
                Finances
              </SectionTitre>

              <div className="space-y-1">

                {navigationFinancesFiltre.map(
                  (item, index) => (
                    <NavigationItem
                      key={item.chemin}
                      item={item}
                      index={index}
                      fermerMenu={fermerMenu}
                    />
                  )
                )}

              </div>

            </div>
          )}


          {/* ACTIVITÉS */}

          {navigationActivitesFiltre.length > 0 && (
            <div className="mb-7">

              <SectionTitre
                couleur="blue"
                nombre={
                  navigationActivitesFiltre.length
                }
                icone={CalendarDays}
              >
                Activités
              </SectionTitre>

              <div className="space-y-1">

                {navigationActivitesFiltre.map(
                  (item, index) => (
                    <NavigationItem
                      key={item.chemin}
                      item={item}
                      index={index}
                      fermerMenu={fermerMenu}
                    />
                  )
                )}

              </div>

            </div>
          )}


          {/* COMMUNICATION */}

          {navigationCommunicationFiltre.length > 0 && (
            <div className="mb-7">

              <SectionTitre
                couleur="rose"
                nombre={
                  navigationCommunicationFiltre.length
                }
                icone={Megaphone}
              >
                Communication
              </SectionTitre>

              <div className="space-y-1">

                {navigationCommunicationFiltre.map(
                  (item, index) => (
                    <NavigationItem
                      key={item.chemin}
                      item={item}
                      index={index}
                      fermerMenu={fermerMenu}
                    />
                  )
                )}

              </div>

            </div>
          )}


          {/* RELATIONS EXTÉRIEURES */}

          {navigationRelationsFiltre.length > 0 && (
            <div className="mb-7">

              <SectionTitre
                couleur="cyan"
                nombre={
                  navigationRelationsFiltre.length
                }
                icone={Globe2}
              >
                Relations
              </SectionTitre>

              <div className="space-y-1">

                {navigationRelationsFiltre.map(
                  (item, index) => (
                    <NavigationItem
                      key={item.chemin}
                      item={item}
                      index={index}
                      fermerMenu={fermerMenu}
                    />
                  )
                )}

              </div>

            </div>
          )}


          {/* ESPACE KOUREL */}

          {estMembreKourel &&
            navigationKourelFiltre.length > 0 && (
              <div className="mb-7">

                <SectionTitre
                  couleur="amber"
                  nombre={
                    navigationKourelFiltre.length
                  }
                  icone={Music}
                >
                  Espace Kourel
                </SectionTitre>

                <div
                  className="
                    rounded-[1.4rem]
                    border
                    border-amber-100
                    bg-amber-50/50
                    p-2
                  "
                >

                  {navigationKourelFiltre.map(
                    (item, index) => (
                      <NavigationItem
                        key={item.chemin}
                        item={item}
                        index={index}
                        fermerMenu={fermerMenu}
                      />
                    )
                  )}

                </div>

              </div>
            )}


          {/* NOTIFICATIONS */}

          {navigationNotificationsFiltre.length > 0 && (
            <div className="mb-4">

              <SectionTitre
                couleur="rose"
                nombre={
                  navigationNotificationsFiltre.length
                }
                icone={Bell}
              >
                Notifications
              </SectionTitre>

              <div className="space-y-1">

                {navigationNotificationsFiltre.map(
                  (item, index) => (
                    <NavigationItem
                      key={item.chemin}
                      item={item}
                      index={index}
                      fermerMenu={fermerMenu}
                    />
                  )
                )}

              </div>

            </div>
          )}


          {/* AUCUN RÉSULTAT */}

          {aucunResultat && (
            <div
              className="
                mt-4
                rounded-2xl
                border
                border-dashed
                border-slate-200
                bg-slate-50
                px-4
                py-5
                text-center
                text-xs
                text-slate-400
              "
            >
              Aucun résultat
            </div>
          )}

        </nav>


        {/* =====================================================
            FOOTER SIDEBAR
        ===================================================== */}

        <div
          className="
            relative
            border-t
            border-slate-100
            bg-white
            p-4
          "
        >

          {/* PROFIL */}

          <button
            type="button"
            onClick={ouvrirProfil}
            className="
              group
              mb-1
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              px-3
              py-2.5
              text-xs
              font-semibold
              text-slate-500
              transition
              hover:bg-emerald-50
              hover:text-emerald-700
            "
          >

            <div
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                bg-emerald-50
                text-emerald-600
                transition
                group-hover:bg-emerald-100
              "
            >
              <CircleUserRound size={16} />
            </div>

            <span>
              Mon profil
            </span>

          </button>


          {/* ACCUEIL */}

          <button
            type="button"
            onClick={retourAccueil}
            className="
              group
              mb-1
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              px-3
              py-2.5
              text-xs
              font-semibold
              text-slate-500
              transition
              hover:bg-slate-50
              hover:text-slate-800
            "
          >

            <div
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                bg-slate-100
                text-slate-500
                transition
                group-hover:bg-slate-200
              "
            >
              <Home size={16} />
            </div>

            <span>
              Retour à l'accueil
            </span>

          </button>


          {/* DÉCONNEXION */}

          <button
            type="button"
            onClick={handleLogout}
            className="
              group
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              px-3
              py-2.5
              text-xs
              font-semibold
              text-slate-400
              transition
              hover:bg-rose-50
              hover:text-rose-600
            "
          >

            <div
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                bg-slate-100
                text-slate-400
                transition
                group-hover:bg-rose-100
                group-hover:text-rose-500
              "
            >
              <LogOut size={16} />
            </div>

            Déconnexion

          </button>

        </div>

      </aside>


      {/* =========================================================
          BOUTON MOBILE
      ========================================================= */}

      {!menuOuvert && (
        <button
          type="button"
          onClick={() =>
            setMenuOuvert(true)
          }
          className="
            fixed
            left-4
            top-4
            z-40
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-2xl
            border
            border-slate-200
            bg-white
            text-emerald-700
            shadow-lg
            shadow-slate-900/10
            transition
            hover:scale-105
            hover:bg-emerald-50
            lg:hidden
          "
          aria-label="Ouvrir le menu"
        >
          <Menu size={21} />
        </button>
      )}


      {/* =========================================================
          CONTENU PRINCIPAL

          IMPORTANT :
          PAS DE z-10 ICI.

          Le Outlet contient notamment les modales de MonKourel.
          Un z-index sur <main> crée un contexte d'empilement qui
          peut empêcher une modale fixed de passer au-dessus du
          reste de l'application.
      ========================================================= */}

      <main
        className="
          relative
          min-h-screen
          lg:ml-[290px]
        "
      >

        {/* =======================================================
            TOPBAR
        ======================================================= */}

        <header
          className="
            sticky
            top-0
            z-30
            border-b
            border-slate-200/80
            bg-white/95
            shadow-[0_4px_20px_-18px_rgba(15,23,42,0.3)]
            backdrop-blur-2xl
          "
        >

          <div
            className="
              flex
              min-h-[76px]
              items-center
              justify-between
              gap-4
              px-5
              sm:px-7
              lg:px-9
            "
          >

            <div
              className="
                min-w-0
                pl-12
                lg:pl-0
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <span
                  className="
                    hidden
                    h-2
                    w-2
                    rounded-full
                    bg-emerald-500
                    shadow-[0_0_10px_rgba(16,185,129,0.35)]
                    sm:block
                  "
                />

                <p
                  className="
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.18em]
                    text-emerald-700
                  "
                >
                  Dahira Mawahibou
                </p>

              </div>


              <div className="mt-1 flex items-center gap-2">

                <h2
                  className="
                    truncate
                    text-lg
                    font-black
                    tracking-tight
                    text-slate-900
                    sm:text-xl
                  "
                >
                  {titrePage}
                </h2>


                {estMembreKourel &&
                  location.pathname.includes(
                    "kourel"
                  ) && (
                    <span
                      className="
                        hidden
                        items-center
                        gap-1
                        rounded-full
                        border
                        border-amber-100
                        bg-amber-50
                        px-2.5
                        py-1
                        text-[9px]
                        font-bold
                        text-amber-700
                        sm:inline-flex
                      "
                    >
                      <Music size={11} />
                      Kourel
                    </span>
                  )}

              </div>

            </div>


            {/* ACTIONS */}

            <div
              className="
                flex
                items-center
                gap-2
                sm:gap-4
              "
            >

              <div
                className="
                  hidden
                  items-center
                  gap-2
                  xl:flex
                "
              >

                <Clock3
                  size={15}
                  className="text-slate-300"
                />

                <p
                  className="
                    text-xs
                    font-medium
                    capitalize
                    text-slate-400
                  "
                >
                  {dateTexte}
                </p>

              </div>


              <div
                className="
                  hidden
                  h-8
                  w-px
                  bg-slate-200
                  xl:block
                "
              />


              {/* NOTIFICATIONS */}

              <button
                type="button"
                onClick={() =>
                  navigate("/notifications")
                }
                className="
                  group
                  relative
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  text-slate-500
                  shadow-sm
                  transition-all
                  hover:-translate-y-0.5
                  hover:border-emerald-200
                  hover:bg-emerald-50
                  hover:text-emerald-700
                "
                title="Notifications"
              >

                <Bell size={18} />

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
                  "
                />

              </button>


              {/* UTILISATEUR */}

              <div
                className="
                  hidden
                  items-center
                  gap-3
                  sm:flex
                "
              >

                <div className="text-right">

                  <p
                    className="
                      max-w-[160px]
                      truncate
                      text-xs
                      font-bold
                      text-slate-800
                    "
                  >
                    {nomAffiche}
                  </p>

                  <p
                    className="
                      mt-0.5
                      max-w-[160px]
                      truncate
                      text-[10px]
                      text-slate-400
                    "
                  >
                    {fonctionPrincipale}
                  </p>

                </div>


                <button
                  type="button"
                  onClick={ouvrirProfil}
                  className="
                    group
                    relative
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-2xl
                    bg-gradient-to-br
                    from-emerald-500
                    to-teal-700
                    text-xs
                    font-black
                    text-white
                    shadow-lg
                    shadow-emerald-700/15
                    transition-all
                    hover:-translate-y-0.5
                    hover:scale-105
                  "
                  title="Mon profil"
                >

                  {initiales}

                  <span
                    className="
                      absolute
                      bottom-0
                      right-0
                      h-3
                      w-3
                      rounded-full
                      border-2
                      border-white
                      bg-emerald-400
                    "
                  />

                </button>

              </div>

            </div>

          </div>

        </header>


        {/* =======================================================
            FIL D'ARIANE
        ======================================================= */}

        <div
          className="
            hidden
            border-b
            border-slate-100
            bg-white
            px-5
            py-2.5
            sm:block
            sm:px-7
            lg:px-9
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
            "
          >

            <div
              className="
                flex
                items-center
                gap-2
                text-[10px]
                text-slate-400
              "
            >

              <Home size={12} />

              <span>
                Dahira
              </span>

              <ChevronRight size={11} />

              <span
                className="
                  font-semibold
                  text-slate-600
                "
              >
                {titrePage}
              </span>

            </div>


            {estMembreKourel && (
              <div
                className="
                  flex
                  items-center
                  gap-1.5
                  text-[10px]
                  font-semibold
                  text-amber-600
                "
              >

                <Sparkles size={12} />

                Membre du Kourel

              </div>
            )}

          </div>

        </div>


        {/* =======================================================
            CONTENU
        ======================================================= */}

        <div
          className="
            relative
            min-h-[calc(100vh-76px)]
            bg-slate-50
            p-5
            sm:p-7
            lg:p-9
          "
        >

          <div
            className="
              w-full
              min-w-0
              rounded-[28px]
              border
              border-slate-200/80
              bg-white
              shadow-[0_18px_50px_-30px_rgba(15,23,42,0.20)]
            "
          >

            <div
              className="
                min-w-0
                p-4
                sm:p-6
                lg:p-8
              "
            >

              <Outlet />

            </div>

          </div>

        </div>


        {/* =======================================================
            FOOTER
        ======================================================= */}

        <footer
          className="
            border-t
            border-slate-200/80
            bg-white
            px-5
            py-6
            sm:px-7
            lg:px-9
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

            <div
              className="
                flex
                items-center
                gap-2
              "
            >

              <div
                className="
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-lg
                  bg-emerald-50
                  text-emerald-600
                "
              >
                <Star size={13} />
              </div>

              <div>

                <p
                  className="
                    text-[10px]
                    font-bold
                    text-slate-700
                  "
                >
                  Dahira Mawahibou Naafih
                </p>

                <p
                  className="
                    text-[9px]
                    text-slate-400
                  "
                >
                  Espace membre
                </p>

              </div>

            </div>


            <p
              className="
                text-[10px]
                text-slate-400
              "
            >
              © {new Date().getFullYear()} —
              Tous droits réservés
            </p>

          </div>

        </footer>

      </main>


      {/* =========================================================
          ANIMATIONS / SCROLLBAR
      ========================================================= */}

      <style>{`

        @keyframes menuAppear {
          from {
            opacity: 0;
            transform: translateX(-6px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(16, 185, 129, 0.20) transparent;
        }

        *::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }

        *::-webkit-scrollbar-track {
          background: transparent;
        }

        *::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.20);
          border-radius: 999px;
        }

        *::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.38);
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

    </div>
  );
}


export default Layout;