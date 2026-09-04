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
  ShieldCheck,
  Settings2,
  HandCoins,
  CreditCard,
  Receipt,
  Landmark,
  CalendarCheck,
  Radio,
  Globe2,
  Building2,
  UserRoundCog,
  Images,
} from "lucide-react";

import { useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";


/* ============================================================
   ICONES
   ============================================================ */

const ICONES = {
  dashboard: LayoutDashboard,
  users: Users,
  wallet: Wallet,
  calendar: CalendarDays,
  "calendar-days": CalendarDays,
  "calendar-check": CalendarCheck,
  "calendar-plus": CalendarDays,
  "book-open": BookOpen,
  headphones: Music,
  music: Music,
  megaphone: Megaphone,
  bell: Bell,
  user: Users,
  "user-cog": UserCog,
  "user-round-cog": UserRoundCog,
  shield: ShieldCheck,
  settings: Settings2,
  "hand-coins": HandCoins,
  "credit-card": CreditCard,
  receipt: Receipt,
  landmark: Landmark,
  radio: Radio,
  globe: Globe2,
  building: Building2,
  images: Images,
};


/* ============================================================
   RUBRIQUES KOUREL
   ============================================================

   L'espace Kourel contient uniquement :

   1. Mon Kourel
   2. Programme religieux
   3. Khassidas

   Les répétitions et les déclamations sont gérées
   depuis Programme religieux.
   ============================================================ */

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


/* ============================================================
   COULEURS DU MENU
   ============================================================ */

const COULEURS_MENU = {
  emerald: "from-emerald-500 to-teal-500",
  blue: "from-blue-500 to-indigo-500",
  violet: "from-violet-500 to-purple-500",
  amber: "from-amber-400 to-orange-500",
  rose: "from-rose-500 to-pink-500",
  cyan: "from-cyan-500 to-sky-500",
};


/* ============================================================
   ELEMENT DE NAVIGATION
   ============================================================ */

function NavigationItem({
  item,
  fermerMenu,
  index = 0,
}) {
  const Icon = item?.icone || BookOpen;

  const couleur = item?.couleur || "emerald";

  const gradient =
    COULEURS_MENU[couleur] ||
    COULEURS_MENU.emerald;

  return (
    <NavLink
      to={item.chemin}
      onClick={fermerMenu}
      style={{
        animationDelay: `${index * 35}ms`,
      }}
      className={({ isActive }) =>
        `
        group relative flex items-center gap-3
        overflow-hidden rounded-2xl px-3 py-3
        text-sm font-medium transition-all
        duration-300
        animate-[menuAppear_0.35s_ease-out_both]

        ${
          isActive
            ? "bg-white text-emerald-950 shadow-lg shadow-black/10"
            : "text-white/60 hover:bg-white/[0.08] hover:text-white"
        }
        `
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="
                absolute left-0 top-2 bottom-2
                w-1 rounded-r-full
                bg-gradient-to-b
                from-emerald-400 to-teal-600
              "
            />
          )}

          {isActive && (
            <span
              className="
                pointer-events-none absolute
                -right-8 -top-8 h-20 w-20
                rounded-full bg-emerald-100
                blur-2xl
              "
            />
          )}

          <div
            className={`
              relative z-10 flex h-10 w-10
              shrink-0 items-center justify-center
              rounded-xl transition-all duration-300

              ${
                isActive
                  ? `bg-gradient-to-br ${gradient}
                     text-white shadow-md`
                  : `
                    bg-white/[0.06]
                    text-white/45
                    group-hover:bg-white/10
                    group-hover:text-amber-300
                  `
              }
            `}
          >
            <Icon
              size={18}
              strokeWidth={2}
            />
          </div>

          <div
            className="
              relative z-10 min-w-0 flex-1
            "
          >
            <p
              className={
                isActive
                  ? "truncate font-bold"
                  : "truncate font-medium"
              }
            >
              {item.nom}
            </p>

            {item.description && (
              <p
                className={`
                  mt-0.5 truncate text-[10px]

                  ${
                    isActive
                      ? "text-emerald-700/60"
                      : "text-white/25"
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
              relative z-10 shrink-0
              transition-all duration-300

              ${
                isActive
                  ? "translate-x-0 text-emerald-600"
                  : `
                    -translate-x-1 text-white/10
                    group-hover:translate-x-0
                    group-hover:text-white/40
                  `
              }
            `}
          />
        </>
      )}
    </NavLink>
  );
}


/* ============================================================
   TITRE DE SECTION
   ============================================================ */

function SectionTitre({
  titre,
  icone: Icon,
  couleur = "white",
  nombre,
}) {
  const couleurs = {
    white: "text-white/25",
    amber: "text-amber-300/70",
    blue: "text-blue-300/70",
    violet: "text-violet-300/70",
    cyan: "text-cyan-300/70",
    rose: "text-rose-300/70",
  };

  return (
    <div
      className="
        mb-3 flex items-center
        justify-between px-2
      "
    >
      <div
        className="
          flex items-center gap-2
        "
      >
        {Icon && (
          <Icon
            size={13}
            className={
              couleurs[couleur] ||
              couleurs.white
            }
          />
        )}

        <p
          className={`
            text-[10px] font-black
            uppercase
            tracking-[0.18em]

            ${
              couleurs[couleur] ||
              couleurs.white
            }
          `}
        >
          {titre}
        </p>
      </div>

      {typeof nombre === "number" && (
        <span
          className="
            rounded-full
            bg-white/[0.05]
            px-2 py-0.5 text-[9px]
            font-bold text-white/25
          "
        >
          {nombre}
        </span>
      )}
    </div>
  );
}


/* ============================================================
   LAYOUT
   ============================================================ */

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    utilisateur,
    deconnexion,
    aPermission,
  } = useAuth();

  const [
    menuOuvert,
    setMenuOuvert,
  ] = useState(false);

  const [
    recherche,
    setRecherche,
  ] = useState("");


  /* ==========================================================
     DONNEES UTILISATEUR
     ========================================================== */

  const kourels = useMemo(
    () =>
      Array.isArray(
        utilisateur?.kourels
      )
        ? utilisateur.kourels
        : [],
    [utilisateur]
  );


  /*
   * Cette information est uniquement
   * informative dans l'interface.
   */

  const estMembreKourel =
    utilisateur?.est_membre_kourel === true ||
    kourels.length > 0;


  /*
   * ==========================================================
   * REGLE CENTRALE DU LAYOUT
   *
   * Une rubrique est affichée uniquement
   * si l'utilisateur possède sa permission.
   * ==========================================================
   */

  const possedePermission = (
    permission
  ) => {
    if (!permission) {
      return true;
    }

    if (
      typeof aPermission !==
      "function"
    ) {
      return false;
    }

    return (
      aPermission(permission) === true
    );
  };


  /* ==========================================================
     INFORMATIONS UTILISATEUR
     ========================================================== */

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


  const initiales = useMemo(() => {
    const mots =
      nomAffiche
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


  /* ==========================================================
     MENU ADMINISTRATION
     ========================================================== */

  const navigationAdministration = useMemo(() => {
    const items = [];

    if (
      possedePermission(
        "UTILISATEUR_CONSULTER"
      )
    ) {
      items.push({
        code: "UTILISATEURS",
        nom: "Utilisateurs",
        description:
          "Comptes et accès",
        chemin: "/utilisateurs",
        permission:
          "UTILISATEUR_CONSULTER",
        icone: UserCog,
        couleur: "blue",
      });
    }


    if (
      possedePermission(
        "GALERIE_CONSULTER"
      )
    ) {
      items.push({
        code: "GALERIE",
        nom: "Galerie",
        description:
          "Photos et vidéos du Dahira",
        chemin: "/galerie",
        permission:
          "GALERIE_CONSULTER",
        icone: Images,
        couleur: "blue",
      });
    }

    return items;
  }, [aPermission]);


  /* ==========================================================
     MENU MEMBRES
     ========================================================== */

  const navigationMembres = useMemo(() => {
    const items = [];

    if (
      possedePermission(
        "MEMBRE_CONSULTER"
      )
    ) {
      items.push({
        code: "MEMBRES",
        nom: "Membres",
        description:
          "Gestion des membres",
        chemin: "/membres",
        permission:
          "MEMBRE_CONSULTER",
        icone: Users,
        couleur: "emerald",
      });
    }

    return items;
  }, [aPermission]);


  /* ==========================================================
     DASHBOARD
     ========================================================== */

  const navigationDashboard = useMemo(() => {
    if (
      !possedePermission(
        "DASHBOARD_CONSULTER"
      )
    ) {
      return [];
    }

    return [
      {
        code: "DASHBOARD",
        nom: "Tableau de bord",
        description:
          "Vue générale",
        chemin: "/dashboard",
        permission:
          "DASHBOARD_CONSULTER",
        icone: LayoutDashboard,
        couleur: "emerald",
      },
    ];
  }, [aPermission]);


  /* ==========================================================
     FINANCES
     ========================================================== */

  const navigationFinances = useMemo(() => {
    const items = [];

    if (
      possedePermission(
        "COTISATION_CONSULTER"
      )
    ) {
      items.push({
        code: "COTISATIONS",
        nom: "Cotisations",
        description:
          "Cotisations des membres",
        chemin: "/cotisations",
        permission:
          "COTISATION_CONSULTER",
        icone: HandCoins,
        couleur: "violet",
      });
    }


    if (
      possedePermission(
        "PAIEMENT_CONSULTER"
      )
    ) {
      items.push({
        code: "PAIEMENTS",
        nom: "Paiements",
        description:
          "Paiements enregistrés",
        chemin: "/paiements",
        permission:
          "PAIEMENT_CONSULTER",
        icone: CreditCard,
        couleur: "violet",
      });
    }


    if (
      possedePermission(
        "DEPENSE_CONSULTER"
      )
    ) {
      items.push({
        code: "DEPENSES",
        nom: "Dépenses",
        description:
          "Dépenses du Dahira",
        chemin: "/finances",
        permission:
          "DEPENSE_CONSULTER",
        icone: Receipt,
        couleur: "violet",
      });
    }


    if (
      possedePermission(
        "AIDE_EXTERIEURE_CONSULTER"
      )
    ) {
      items.push({
        code: "AIDES_EXTERIEURES",
        nom: "Aides extérieures",
        description:
          "Aides et contributions externes",
        chemin: "/finances",
        permission:
          "AIDE_EXTERIEURE_CONSULTER",
        icone: Landmark,
        couleur: "violet",
      });
    }

    return items;
  }, [aPermission]);


  /* ==========================================================
     REUNIONS ET ACTIVITES
     ========================================================== */

  const navigationActivites = useMemo(() => {
    const items = [];

    if (
      possedePermission(
        "REUNION_CONSULTER"
      )
    ) {
      items.push({
        code: "REUNIONS",
        nom: "Réunions",
        description:
          "Réunions du Dahira",
        chemin: "/reunions",
        permission:
          "REUNION_CONSULTER",
        icone: CalendarDays,
        couleur: "cyan",
      });
    }

    /*
     * Programme religieux n'est volontairement
     * plus placé dans cette section.
     *
     * Il appartient à l'Espace Kourel.
     */

    return items;
  }, [aPermission]);


  /* ==========================================================
     COMMUNICATION
     ========================================================== */

  const navigationCommunication = useMemo(() => {
    const items = [];

    if (
      possedePermission(
        "COMMUNICATION_CONSULTER"
      )
    ) {
      items.push({
        code: "COMMUNICATIONS",
        nom: "Communications",
        description:
          "Informations du Dahira",
        chemin: "/communications",
        permission:
          "COMMUNICATION_CONSULTER",
        icone: Megaphone,
        couleur: "rose",
      });
    }

    return items;
  }, [aPermission]);


  /* ==========================================================
     RELATIONS EXTERIEURES
     ========================================================== */

  const navigationRelations = useMemo(() => {
    const items = [];

    if (
      possedePermission(
        "RELATION_EXTERIEUR_CONSULTER"
      )
    ) {
      items.push({
        code: "RELATIONS_EXTERIEURES",
        nom: "Relations extérieures",
        description:
          "Relations et partenaires",
        chemin: "/relations-exterieures",
        permission:
          "RELATION_EXTERIEUR_CONSULTER",
        icone: Globe2,
        couleur: "blue",
      });
    }

    return items;
  }, [aPermission]);


  /* ==========================================================
     KOUREL
     ========================================================== */

  const navigationKourel = useMemo(() => {
    return RUBRIQUES_KOUREL.filter(
      (item) =>
        possedePermission(
          item.permission
        )
    );
  }, [aPermission]);


  /* ==========================================================
     NOTIFICATIONS
     ========================================================== */

  const navigationNotifications = useMemo(() => {
    if (
      !possedePermission(
        "NOTIFICATION_CONSULTER"
      )
    ) {
      return [];
    }

    return [
      {
        code: "NOTIFICATIONS",
        nom: "Notifications",
        description:
          "Mes notifications",
        chemin: "/notifications",
        permission:
          "NOTIFICATION_CONSULTER",
        icone: Bell,
        couleur: "rose",
      },
    ];
  }, [aPermission]);


  /* ==========================================================
     RECHERCHE
     ========================================================== */

  const filtrerNavigation = (
    navigation
  ) => {
    const terme =
      recherche
        .trim()
        .toLowerCase();

    if (!terme) {
      return navigation;
    }

    return navigation.filter(
      (item) =>
        item.nom
          ?.toLowerCase()
          .includes(terme) ||
        item.description
          ?.toLowerCase()
          .includes(terme)
    );
  };


  const dashboardFiltre =
    filtrerNavigation(
      navigationDashboard
    );

  const administrationFiltre =
    filtrerNavigation(
      navigationAdministration
    );

  const membresFiltre =
    filtrerNavigation(
      navigationMembres
    );

  const financesFiltre =
    filtrerNavigation(
      navigationFinances
    );

  const activitesFiltre =
    filtrerNavigation(
      navigationActivites
    );

  const communicationFiltre =
    filtrerNavigation(
      navigationCommunication
    );

  const relationsFiltre =
    filtrerNavigation(
      navigationRelations
    );

  const kourelFiltre =
    filtrerNavigation(
      navigationKourel
    );

  const notificationsFiltre =
    filtrerNavigation(
      navigationNotifications
    );


  /* ==========================================================
     TOUS LES ELEMENTS
     ========================================================== */

  const toutesLesRubriques =
    useMemo(
      () => [
        ...navigationDashboard,
        ...navigationAdministration,
        ...navigationMembres,
        ...navigationFinances,
        ...navigationActivites,
        ...navigationCommunication,
        ...navigationRelations,
        ...navigationKourel,
        ...navigationNotifications,
      ],
      [
        navigationDashboard,
        navigationAdministration,
        navigationMembres,
        navigationFinances,
        navigationActivites,
        navigationCommunication,
        navigationRelations,
        navigationKourel,
        navigationNotifications,
      ]
    );


  const aucunResultat =
    recherche.trim() !== "" &&
    toutesLesRubriques.filter(
      (item) =>
        item.nom
          ?.toLowerCase()
          .includes(
            recherche
              .trim()
              .toLowerCase()
          ) ||
        item.description
          ?.toLowerCase()
          .includes(
            recherche
              .trim()
              .toLowerCase()
          )
    ).length === 0;


  /* ==========================================================
     TITRE PAGE
     ========================================================== */

  const titrePage = useMemo(() => {
    const element =
      toutesLesRubriques.find(
        (item) =>
          location.pathname ===
            item.chemin ||
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

    if (
      location.pathname ===
      "/mon-espace"
    ) {
      return "Mon espace";
    }

    return "Mon espace";
  }, [
    location.pathname,
    toutesLesRubriques,
  ]);


  /* ==========================================================
     ACTIONS
     ========================================================== */

  async function handleLogout() {
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


  function fermerMenu() {
    setMenuOuvert(false);
  }


  function retourAccueil() {
    fermerMenu();
    navigate("/");
  }


  /* ==========================================================
     DATE
     ========================================================== */

  const dateTexte =
    new Date().toLocaleDateString(
      "fr-FR",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
      }
    );


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div
      className="
        min-h-screen
        bg-[#f6f8f7]
        text-slate-900
      "
    >

      {/* ======================================================
          DECORATION
          ====================================================== */}

      <div
        className="
          pointer-events-none fixed
          inset-0 overflow-hidden
        "
      >
        <div
          className="
            absolute -left-40 -top-40
            h-96 w-96 rounded-full
            bg-emerald-300/10 blur-3xl
          "
        />

        <div
          className="
            absolute -bottom-40 -right-40
            h-96 w-96 rounded-full
            bg-teal-300/10 blur-3xl
          "
        />
      </div>


      {/* ======================================================
          OVERLAY MOBILE
          ====================================================== */}

      {menuOuvert && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={fermerMenu}
          className="
            fixed inset-0 z-40
            bg-slate-950/50
            backdrop-blur-sm lg:hidden
          "
        />
      )}


      {/* ======================================================
          SIDEBAR
          ====================================================== */}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex
          h-screen w-[290px] flex-col
          overflow-hidden border-r
          border-white/10
          bg-gradient-to-b
          from-[#062e25]
          via-[#06382d]
          to-[#04251e]
          text-white shadow-2xl
          transition-transform duration-500
          ease-out

          ${
            menuOuvert
              ? "translate-x-0"
              : "-translate-x-full"
          }

          lg:translate-x-0
        `}
      >

        <div
          className="
            pointer-events-none absolute
            -right-24 -top-24 h-64 w-64
            rounded-full bg-emerald-400/10
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none absolute
            -bottom-24 -left-24
            h-64 w-64 rounded-full
            bg-teal-400/10 blur-3xl
          "
        />


        {/* ====================================================
            HEADER SIDEBAR
            ==================================================== */}

        <div
          className="
            relative border-b
            border-white/[0.08]
            px-5 pb-5 pt-6
          "
        >

          <div
            className="
              flex items-center
              justify-between
            "
          >

            <div
              className="
                flex items-center gap-3
              "
            >

              <div
                className="
                  relative flex h-12 w-12
                  shrink-0 items-center
                  justify-center rounded-2xl
                  bg-gradient-to-br
                  from-amber-300 to-orange-500
                  text-xl font-black
                  text-emerald-950 shadow-lg
                "
              >
                ✦
              </div>

              <div
                className="
                  min-w-0
                "
              >
                <h1
                  className="
                    truncate text-[15px]
                    font-black tracking-tight
                  "
                >
                  Dahira Mawahibou
                </h1>

                <p
                  className="
                    mt-0.5 text-xs font-medium
                    text-amber-300
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
                flex h-9 w-9 items-center
                justify-center rounded-xl
                bg-white/[0.06]
                text-white/50
                transition hover:bg-white/10
                hover:text-white lg:hidden
              "
            >
              <X size={18} />
            </button>

          </div>


          {/* ==================================================
              PROFIL
              ================================================== */}

          <div
            className="
              mt-5 rounded-2xl border
              border-white/[0.07]
              bg-white/[0.05] p-3
              backdrop-blur-xl
            "
          >

            <div
              className="
                flex items-center gap-3
              "
            >

              <div
                className="
                  flex h-10 w-10 shrink-0
                  items-center justify-center
                  rounded-xl
                  bg-gradient-to-br
                  from-emerald-400 to-teal-600
                  text-xs font-black text-white
                "
              >
                {initiales}
              </div>

              <div
                className="
                  min-w-0 flex-1
                "
              >
                <p
                  className="
                    truncate text-xs font-bold
                    text-white
                  "
                >
                  {nomAffiche}
                </p>

                <p
                  className="
                    mt-1 truncate text-[10px]
                    text-white/40
                  "
                >
                  {fonctionPrincipale}
                </p>
              </div>

              <CircleUserRound
                size={17}
                className="text-white/20"
              />

            </div>

          </div>

        </div>


        {/* ====================================================
            RECHERCHE
            ==================================================== */}

        <div
          className="
            relative px-5 pt-5
          "
        >
          <div className="relative">

            <Search
              size={16}
              className="
                absolute left-3.5 top-1/2
                -translate-y-1/2
                text-white/25
              "
            />

            <input
              type="text"
              value={recherche}
              onChange={(e) =>
                setRecherche(
                  e.target.value
                )
              }
              placeholder="Rechercher..."
              className="
                w-full rounded-xl
                border border-white/[0.07]
                bg-white/[0.05]
                py-2.5 pl-10 pr-3
                text-xs text-white
                outline-none
                placeholder:text-white/25
                focus:border-emerald-400/30
                focus:bg-white/[0.08]
              "
            />

          </div>
        </div>


        {/* ====================================================
            NAVIGATION
            ==================================================== */}

        <nav
          className="
            relative flex-1
            overflow-y-auto px-4 py-6
          "
        >

          {/* ==================================================
              AUCUN RESULTAT
              ================================================== */}

          {aucunResultat && (
            <div
              className="
                rounded-2xl border
                border-dashed
                border-white/10
                px-4 py-5 text-center
                text-xs text-white/30
              "
            >
              Aucun résultat
            </div>
          )}


          {/* ==================================================
              DASHBOARD
              ================================================== */}

          {dashboardFiltre.length > 0 && (
            <div className="mb-7">

              <SectionTitre
                titre="Accueil"
                nombre={
                  dashboardFiltre.length
                }
              />

              <div className="space-y-1">
                {dashboardFiltre.map(
                  (item, index) => (
                    <NavigationItem
                      key={item.chemin}
                      item={item}
                      index={index}
                      fermerMenu={
                        fermerMenu
                      }
                    />
                  )
                )}
              </div>

            </div>
          )}


          {/* ==================================================
              ADMINISTRATION
              ================================================== */}

          {administrationFiltre.length >
            0 && (
            <div className="mb-7">

              <SectionTitre
                titre="Administration"
                icone={Settings2}
                couleur="blue"
                nombre={
                  administrationFiltre.length
                }
              />

              <div className="space-y-1">
                {administrationFiltre.map(
                  (item, index) => (
                    <NavigationItem
                      key={item.chemin}
                      item={item}
                      index={index}
                      fermerMenu={
                        fermerMenu
                      }
                    />
                  )
                )}
              </div>

            </div>
          )}


          {/* ==================================================
              MEMBRES
              ================================================== */}

          {membresFiltre.length > 0 && (
            <div className="mb-7">

              <SectionTitre
                titre="Membres"
                icone={Users}
                nombre={
                  membresFiltre.length
                }
              />

              <div className="space-y-1">
                {membresFiltre.map(
                  (item, index) => (
                    <NavigationItem
                      key={item.chemin}
                      item={item}
                      index={index}
                      fermerMenu={
                        fermerMenu
                      }
                    />
                  )
                )}
              </div>

            </div>
          )}


          {/* ==================================================
              FINANCES
              ================================================== */}

          {financesFiltre.length > 0 && (
            <div className="mb-7">

              <SectionTitre
                titre="Finances"
                icone={Wallet}
                couleur="violet"
                nombre={
                  financesFiltre.length
                }
              />

              <div className="space-y-1">
                {financesFiltre.map(
                  (item, index) => (
                    <NavigationItem
                      key={item.chemin}
                      item={item}
                      index={index}
                      fermerMenu={
                        fermerMenu
                      }
                    />
                  )
                )}
              </div>

            </div>
          )}


          {/* ==================================================
              REUNIONS & ACTIVITES
              ================================================== */}

          {activitesFiltre.length > 0 && (
            <div className="mb-7">

              <SectionTitre
                titre="Réunions & activités"
                icone={CalendarDays}
                couleur="cyan"
                nombre={
                  activitesFiltre.length
                }
              />

              <div className="space-y-1">
                {activitesFiltre.map(
                  (item, index) => (
                    <NavigationItem
                      key={item.chemin}
                      item={item}
                      index={index}
                      fermerMenu={
                        fermerMenu
                      }
                    />
                  )
                )}
              </div>

            </div>
          )}


          {/* ==================================================
              COMMUNICATION
              ================================================== */}

          {communicationFiltre.length >
            0 && (
            <div className="mb-7">

              <SectionTitre
                titre="Communication"
                icone={Megaphone}
                couleur="rose"
                nombre={
                  communicationFiltre.length
                }
              />

              <div className="space-y-1">
                {communicationFiltre.map(
                  (item, index) => (
                    <NavigationItem
                      key={item.chemin}
                      item={item}
                      index={index}
                      fermerMenu={
                        fermerMenu
                      }
                    />
                  )
                )}
              </div>

            </div>
          )}


          {/* ==================================================
              RELATIONS EXTERIEURES
              ================================================== */}

          {relationsFiltre.length > 0 && (
            <div className="mb-7">

              <SectionTitre
                titre="Relations extérieures"
                icone={Globe2}
                couleur="blue"
                nombre={
                  relationsFiltre.length
                }
              />

              <div className="space-y-1">
                {relationsFiltre.map(
                  (item, index) => (
                    <NavigationItem
                      key={item.chemin}
                      item={item}
                      index={index}
                      fermerMenu={
                        fermerMenu
                      }
                    />
                  )
                )}
              </div>

            </div>
          )}


          {/* ==================================================
              ESPACE KOUREL
              ==================================================

              Cette section contient :

              - Mon Kourel
              - Programme religieux
              - Khassidas

              Les trois utilisent
              KOUREL_CONSULTER pour l'accès.
              ================================================== */}

          {kourelFiltre.length > 0 && (
            <div className="mb-7">

              <SectionTitre
                titre="Espace Kourel"
                icone={Music}
                couleur="amber"
                nombre={
                  kourelFiltre.length
                }
              />

              <div
                className="
                  rounded-[1.4rem]
                  border border-amber-400/10
                  bg-gradient-to-br
                  from-amber-400/[0.08]
                  to-transparent p-2
                "
              >

                {kourelFiltre.map(
                  (item, index) => (
                    <NavigationItem
                      key={item.chemin}
                      item={item}
                      index={index}
                      fermerMenu={
                        fermerMenu
                      }
                    />
                  )
                )}

              </div>

            </div>
          )}


          {/* ==================================================
              NOTIFICATIONS
              ================================================== */}

          {notificationsFiltre.length >
            0 && (
            <div className="mb-3">

              <SectionTitre
                titre="Personnel"
                icone={Bell}
                couleur="rose"
                nombre={
                  notificationsFiltre.length
                }
              />

              <div className="space-y-1">
                {notificationsFiltre.map(
                  (item, index) => (
                    <NavigationItem
                      key={item.chemin}
                      item={item}
                      index={index}
                      fermerMenu={
                        fermerMenu
                      }
                    />
                  )
                )}
              </div>

            </div>
          )}

        </nav>


        {/* ====================================================
            BAS SIDEBAR
            ==================================================== */}

        <div
          className="
            relative border-t
            border-white/[0.08] p-4
          "
        >

          <button
            type="button"
            onClick={() =>
              navigate("/mon-espace")
            }
            className="
              group mb-2 flex w-full
              items-center gap-3
              rounded-xl px-3 py-2.5
              text-xs font-semibold
              text-white/45
              transition hover:bg-white/[0.06]
              hover:text-white
            "
          >

            <div
              className="
                flex h-8 w-8 items-center
                justify-center rounded-lg
                bg-white/[0.05]
              "
            >
              <CircleUserRound size={16} />
            </div>

            Mon espace
          </button>


          <button
            type="button"
            onClick={retourAccueil}
            className="
              group mb-2 flex w-full
              items-center gap-3
              rounded-xl px-3 py-2.5
              text-xs font-semibold
              text-white/45
              transition hover:bg-white/[0.06]
              hover:text-white
            "
          >

            <div
              className="
                flex h-8 w-8 items-center
                justify-center rounded-lg
                bg-white/[0.05]
              "
            >
              <Home size={16} />
            </div>

            Retour à l'accueil
          </button>


          <button
            type="button"
            onClick={handleLogout}
            className="
              group flex w-full
              items-center gap-3
              rounded-xl px-3 py-2.5
              text-xs font-semibold
              text-white/35
              transition
              hover:bg-rose-500/10
              hover:text-rose-300
            "
          >

            <div
              className="
                flex h-8 w-8 items-center
                justify-center rounded-lg
                bg-white/[0.05]
              "
            >
              <LogOut size={16} />
            </div>

            Déconnexion
          </button>

        </div>

      </aside>


      {/* ======================================================
          BOUTON MOBILE
          ====================================================== */}

      {!menuOuvert && (
        <button
          type="button"
          onClick={() =>
            setMenuOuvert(true)
          }
          className="
            fixed left-4 top-4 z-40
            flex h-11 w-11 items-center
            justify-center rounded-2xl
            bg-emerald-950
            text-white shadow-xl lg:hidden
          "
          aria-label="Ouvrir le menu"
        >
          <Menu size={21} />
        </button>
      )}


      {/* ======================================================
          CONTENU PRINCIPAL
          ====================================================== */}

      <main
        className="
          relative min-h-screen
          lg:ml-[290px]
        "
      >

        {/* ====================================================
            HEADER
            ==================================================== */}

        <header
          className="
            sticky top-0 z-30
            border-b border-slate-200/70
            bg-white/85 backdrop-blur-2xl
          "
        >

          <div
            className="
              flex min-h-[76px]
              items-center
              justify-between gap-4
              px-5 sm:px-7 lg:px-9
            "
          >

            <div
              className="
                min-w-0 pl-12 lg:pl-0
              "
            >

              <div
                className="
                  flex items-center gap-2
                "
              >

                <span
                  className="
                    hidden h-2 w-2 rounded-full
                    bg-emerald-500
                    sm:block
                  "
                />

                <p
                  className="
                    text-[10px] font-black
                    uppercase
                    tracking-[0.18em]
                    text-emerald-700
                  "
                >
                  Dahira Mawahibou
                </p>

              </div>


              <div
                className="
                  mt-1 flex items-center gap-2
                "
              >

                <h2
                  className="
                    truncate text-lg font-black
                    tracking-tight
                    text-slate-900
                    sm:text-xl
                  "
                >
                  {titrePage}
                </h2>

                {estMembreKourel &&
                  (
                    location.pathname.includes(
                      "kourel"
                    ) ||
                    location.pathname ===
                      "/programme-religieux" ||
                    location.pathname ===
                      "/khassidas"
                  ) && (
                    <span
                      className="
                        hidden items-center gap-1
                        rounded-full
                        bg-amber-50
                        px-2.5 py-1
                        text-[9px] font-bold
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


            <div
              className="
                flex items-center
                gap-2 sm:gap-4
              "
            >

              <div
                className="
                  hidden items-center gap-2
                  xl:flex
                "
              >

                <Clock3
                  size={15}
                  className="text-slate-300"
                />

                <p
                  className="
                    text-xs font-medium
                    capitalize
                    text-slate-400
                  "
                >
                  {dateTexte}
                </p>

              </div>


              {/* ==============================================
                  NOTIFICATIONS
                  ============================================== */}

              {possedePermission(
                "NOTIFICATION_CONSULTER"
              ) && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/notifications"
                    )
                  }
                  className="
                    relative flex h-10 w-10
                    items-center
                    justify-center
                    rounded-xl border
                    border-slate-200
                    bg-white
                    text-slate-500
                    shadow-sm
                    hover:border-emerald-200
                    hover:bg-emerald-50
                    hover:text-emerald-700
                  "
                  title="Notifications"
                >

                  <Bell size={18} />

                  <span
                    className="
                      absolute right-2 top-2
                      h-2 w-2 rounded-full
                      bg-rose-500
                      ring-2 ring-white
                    "
                  />

                </button>
              )}


              {/* ==============================================
                  PROFIL
                  ============================================== */}

              <div
                className="
                  hidden items-center
                  gap-3 sm:flex
                "
              >

                <div
                  className="text-right"
                >

                  <p
                    className="
                      max-w-[160px]
                      truncate text-xs
                      font-bold text-slate-800
                    "
                  >
                    {nomAffiche}
                  </p>

                  <p
                    className="
                      mt-0.5 max-w-[160px]
                      truncate text-[10px]
                      text-slate-400
                    "
                  >
                    {fonctionPrincipale}
                  </p>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/mon-espace"
                    )
                  }
                  className="
                    relative flex h-11 w-11
                    items-center
                    justify-center
                    rounded-2xl
                    bg-gradient-to-br
                    from-emerald-500
                    to-teal-700
                    text-xs font-black
                    text-white shadow-lg
                    transition
                    hover:-translate-y-0.5
                  "
                  title="Mon espace"
                >
                  {initiales}
                </button>

              </div>

            </div>

          </div>

        </header>


        {/* ====================================================
            BREADCRUMB
            ==================================================== */}

        <div
          className="
            hidden border-b
            border-slate-100
            bg-white/50 px-5 py-2.5
            sm:block sm:px-7 lg:px-9
          "
        >

          <div
            className="
              flex items-center
              justify-between
            "
          >

            <div
              className="
                flex items-center gap-2
                text-[10px]
                text-slate-400
              "
            >

              <Home size={12} />

              <span>
                Dahira
              </span>

              <ChevronRight
                size={11}
              />

              <span
                className="
                  font-semibold
                  text-slate-600
                "
              >
                {titrePage}
              </span>

            </div>


            {estMembreKourel &&
              possedePermission(
                "KOUREL_CONSULTER"
              ) && (
                <div
                  className="
                    flex items-center gap-1.5
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


        {/* ====================================================
            PAGE
            ==================================================== */}

        <div
          className="
            relative
            min-h-[calc(100vh-76px)]
            p-5 sm:p-7 lg:p-9
          "
        >
          <Outlet />
        </div>


        {/* ====================================================
            FOOTER
            ==================================================== */}

        <footer
          className="
            border-t
            border-slate-200/70
            bg-white/40
            px-5 py-6
            sm:px-7 lg:px-9
          "
        >

          <div
            className="
              flex flex-col
              items-center justify-between
              gap-3 text-center
              sm:flex-row sm:text-left
            "
          >

            <div
              className="
                flex items-center gap-2
              "
            >

              <div
                className="
                  flex h-7 w-7
                  items-center
                  justify-center
                  rounded-lg
                  bg-emerald-100
                  text-emerald-700
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
              © {new Date().getFullYear()}
              {" — "}
              Tous droits réservés
            </p>

          </div>

        </footer>


        {/* ====================================================
            STYLES
            ==================================================== */}

        <style>
          {`
            @keyframes menuAppear {
              from {
                opacity: 0;
                transform: translateX(-8px);
              }

              to {
                opacity: 1;
                transform: translateX(0);
              }
            }

            * {
              scrollbar-width: thin;
              scrollbar-color:
                rgba(16, 185, 129, 0.25)
                transparent;
            }

            *::-webkit-scrollbar {
              width: 5px;
              height: 5px;
            }

            *::-webkit-scrollbar-track {
              background: transparent;
            }

            *::-webkit-scrollbar-thumb {
              background:
                rgba(16, 185, 129, 0.25);
              border-radius: 999px;
            }
          `}
        </style>

      </main>

    </div>
  );
}


export default Layout;