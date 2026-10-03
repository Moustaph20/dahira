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
  CreditCard,
  Receipt,
  CalendarCheck,
  Globe2,
  Images,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";

// ============================================================
// RUBRIQUES KOURÉL
// ============================================================

const RUBRIQUES_KOUREL = [
  {
    label: "Mon Kourel",
    chemin: "/mon-kourel",
    permission: "KOUREL_CONSULTER",
    icon: Users,
    couleur: "amber",
  },
  {
    label: "Programme religieux",
    chemin: "/programme-religieux",
    permission: "KOUREL_CONSULTER",
    icon: CalendarDays,
    couleur: "amber",
  },
  {
    label: "Khassidas",
    chemin: "/khassidas",
    permission: "KOUREL_CONSULTER",
    icon: BookOpen,
    couleur: "amber",
  },
];

// ============================================================
// COULEURS DES ICÔNES
// ============================================================

const COULEURS_MENU = {
  emerald: {
    icon: "from-emerald-500 to-green-600",
    active: "bg-emerald-50 text-emerald-700",
  },

  blue: {
    icon: "from-blue-500 to-indigo-600",
    active: "bg-blue-50 text-blue-700",
  },

  violet: {
    icon: "from-violet-500 to-purple-600",
    active: "bg-violet-50 text-violet-700",
  },

  amber: {
    icon: "from-amber-400 to-orange-500",
    active: "bg-amber-50 text-amber-700",
  },

  rose: {
    icon: "from-rose-500 to-pink-600",
    active: "bg-rose-50 text-rose-700",
  },

  cyan: {
    icon: "from-cyan-500 to-sky-600",
    active: "bg-cyan-50 text-cyan-700",
  },
};

// ============================================================
// ITEM DE NAVIGATION
// ============================================================

function NavigationItem({
  item,
  onNavigate,
}) {
  const Icon = item.icon;

  const couleur =
    COULEURS_MENU[item.couleur] ||
    COULEURS_MENU.emerald;

  return (
    <NavLink
      to={item.chemin}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          "group relative flex items-center gap-3",
          "rounded-2xl px-3 py-2.5",
          "text-[13px] font-semibold",
          "transition-all duration-200",
          "focus:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-emerald-400/60",

          isActive
            ? `${couleur.active} shadow-sm`
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="
                absolute left-0 top-1/2
                h-7 w-1
                -translate-y-1/2
                rounded-r-full
                bg-emerald-500
              "
            />
          )}

          <span
            className={[
              "flex h-9 w-9 shrink-0",
              "items-center justify-center",
              "rounded-xl",
              "bg-gradient-to-br",
              "text-white shadow-sm",
              "transition-all duration-200",
              "group-hover:scale-[1.04]",
              "group-hover:shadow-md",
              couleur.icon,
            ].join(" ")}
          >
            <Icon
              size={17}
              strokeWidth={2.2}
            />
          </span>

          <span className="min-w-0 flex-1 truncate">
            {item.label}
          </span>

          <ChevronRight
            size={15}
            className={[
              "shrink-0 transition-all duration-200",

              isActive
                ? "translate-x-0 opacity-100"
                : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60",
            ].join(" ")}
          />
        </>
      )}
    </NavLink>
  );
}

// ============================================================
// TITRE DE SECTION
// ============================================================

function SectionTitre({
  children,
}) {
  return (
    <div className="mb-2 mt-5 px-3 first:mt-2">
      <div className="flex items-center gap-2">
        <span className="h-px w-3 bg-slate-300" />

        <span
          className="
            text-[10px]
            font-extrabold
            uppercase
            tracking-[0.18em]
            text-slate-400
          "
        >
          {children}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// LAYOUT PRINCIPAL
// ============================================================

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    utilisateur,
    deconnexion,
    aPermission,
  } = useAuth();

  // ==========================================================
  // ÉTATS
  // ==========================================================

  const [
    menuOuvert,
    setMenuOuvert,
  ] = useState(false);

  const [
    recherche,
    setRecherche,
  ] = useState("");

  // ==========================================================
  // INFORMATIONS UTILISATEUR
  // ==========================================================

  const possedePermission = useCallback(
    (permission) => {
      if (!permission) {
        return true;
      }

      return Boolean(
        aPermission?.(permission)
      );
    },
    [aPermission]
  );

  const prenom =
    utilisateur?.membre?.prenom ||
    utilisateur?.prenom ||
    "";

  const nom =
    utilisateur?.membre?.nom ||
    utilisateur?.nom ||
    "";

  const nomAffiche =
    `${prenom} ${nom}`.trim() ||
    utilisateur?.identifiant ||
    "Utilisateur";

  const fonctionPrincipale =
    utilisateur?.fonctions?.[0]?.nom ||
    utilisateur?.fonction_principale ||
    "Membre";

  const initiales = useMemo(() => {
    const premiereLettrePrenom =
      prenom?.trim()?.[0] || "";

    const premiereLettreNom =
      nom?.trim()?.[0] || "";

    const resultat = (
      `${premiereLettrePrenom}${premiereLettreNom}`
    ).toUpperCase();

    return resultat || "DM";
  }, [prenom, nom]);

  // ==========================================================
  // KOURÉLS
  // ==========================================================

  const kourels =
    utilisateur?.kourels || [];

  const estMembreKourel =
    kourels.length > 0;

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigationDashboard = useMemo(
    () => [
      {
        label: "Tableau de bord",
        chemin: "/dashboard",
        permission: "DASHBOARD_CONSULTER",
        icon: LayoutDashboard,
        couleur: "emerald",
      },
    ],
    []
  );

  const navigationAdministration =
    useMemo(
      () => [
        {
          label: "Utilisateurs",
          chemin: "/utilisateurs",
          permission:
            "UTILISATEUR_CONSULTER",
          icon: UserCog,
          couleur: "blue",
        },

        {
          label: "Galerie",
          chemin: "/galerie",
          permission:
            "GALERIE_CONSULTER",
          icon: Images,
          couleur: "violet",
        },
      ],
      []
    );

  const navigationMembres =
    useMemo(
      () => [
        {
          label: "Membres",
          chemin: "/membres",
          permission:
            "MEMBRE_CONSULTER",
          icon: Users,
          couleur: "blue",
        },
      ],
      []
    );

  // ==========================================================
  // FINANCES
  // ==========================================================

  const navigationFinances =
    useMemo(
      () => [
        {
          label: "Cotisations",
          chemin: "/cotisations",
          permission:
            "COTISATION_CONSULTER",
          icon: Wallet,
          couleur: "emerald",
        },

        {
          label: "Paiements",
          chemin: "/paiements",
          permission:
            "PAIEMENT_CONSULTER",
          icon: CreditCard,
          couleur: "cyan",
        },

        {
          label: "Finances",
          chemin: "/finances",
          permission: null,
          permissions: [
            "DEPENSE_CONSULTER",
            "AIDE_EXTERIEURE_CONSULTER",
          ],
          icon: Receipt,
          couleur: "rose",
        },
      ],
      []
    );

  // ==========================================================
  // ACTIVITÉS
  // ==========================================================

  const navigationActivites =
    useMemo(
      () => [
        {
          label: "Réunions",
          chemin: "/reunions",
          icon: CalendarCheck,
          couleur: "violet",
        },

        {
          label: "Répétitions",
          chemin: "/repetitions",
          permission:
            "KOUREL_CONSULTER",
          icon: Music,
          couleur: "amber",
        },
      ],
      []
    );

  // ==========================================================
  // COMMUNICATION
  // ==========================================================

  const navigationCommunication =
    useMemo(
      () => [
        {
          label: "Communication",
          chemin: "/communication",
          permission:
            "COMMUNICATION_CONSULTER",
          icon: Megaphone,
          couleur: "rose",
        },
      ],
      []
    );

  // ==========================================================
  // RELATIONS EXTÉRIEURES
  // ==========================================================

  const navigationRelations =
    useMemo(
      () => [
        {
          label: "Relations extérieures",
          chemin:
            "/relations-exterieures",
          permission:
            "RELATION_EXTERIEUR_CONSULTER",
          icon: Globe2,
          couleur: "cyan",
        },
      ],
      []
    );

  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================

  const navigationNotifications =
    useMemo(
      () => [
        {
          label: "Notifications",
          chemin: "/notifications",
          permission:
            "NOTIFICATION_CONSULTER",
          icon: Bell,
          couleur: "rose",
        },
      ],
      []
    );

  // ==========================================================
  // VÉRIFICATION DES PERMISSIONS
  // ==========================================================

  const itemAutorise = useCallback(
    (item) => {
      if (item.permissions?.length) {
        return item.permissions.some(
          (permission) =>
            possedePermission(permission)
        );
      }

      return possedePermission(
        item.permission
      );
    },
    [possedePermission]
  );

  // ==========================================================
  // FILTRAGE NAVIGATION
  // ==========================================================

  const filtrerNavigation =
    useCallback(
      (navigation) => {
        const terme =
          recherche
            .trim()
            .toLowerCase();

        return navigation.filter(
          (item) => {
            if (!itemAutorise(item)) {
              return false;
            }

            if (!terme) {
              return true;
            }

            return item.label
              .toLowerCase()
              .includes(terme);
          }
        );
      },
      [
        itemAutorise,
        recherche,
      ]
    );

  // ==========================================================
  // NAVIGATION FINALE
  // ==========================================================

  const navigation = useMemo(
    () => ({
      dashboard:
        filtrerNavigation(
          navigationDashboard
        ),

      administration:
        filtrerNavigation(
          navigationAdministration
        ),

      membres:
        filtrerNavigation(
          navigationMembres
        ),

      finances:
        filtrerNavigation(
          navigationFinances
        ),

      activites:
        filtrerNavigation(
          navigationActivites
        ),

      communication:
        filtrerNavigation(
          navigationCommunication
        ),

      relations:
        filtrerNavigation(
          navigationRelations
        ),

      kourel:
        estMembreKourel
          ? RUBRIQUES_KOUREL.filter(
              (item) => {
                if (
                  !itemAutorise(item)
                ) {
                  return false;
                }

                const terme =
                  recherche
                    .trim()
                    .toLowerCase();

                if (!terme) {
                  return true;
                }

                return item.label
                  .toLowerCase()
                  .includes(terme);
              }
            )
          : [],

      notifications:
        filtrerNavigation(
          navigationNotifications
        ),
    }),
    [
      estMembreKourel,
      filtrerNavigation,
      itemAutorise,
      navigationAdministration,
      navigationActivites,
      navigationCommunication,
      navigationDashboard,
      navigationFinances,
      navigationMembres,
      navigationNotifications,
      navigationRelations,
      recherche,
    ]
  );

  // ==========================================================
  // TOUTES LES RUBRIQUES
  // ==========================================================

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
        ...RUBRIQUES_KOUREL,
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
        navigationNotifications,
      ]
    );

  const aucunResultat =
    recherche.trim().length > 0 &&
    Object.values(navigation).every(
      (rubrique) =>
        rubrique.length === 0
    );

  // ==========================================================
  // TITRE DE PAGE
  // ==========================================================

  const titrePage = useMemo(() => {
    const chemin =
      location.pathname;

    if (
      chemin === "/mon-espace" ||
      chemin === "/"
    ) {
      return "Mon espace";
    }

    if (
      chemin === "/profil" ||
      chemin.startsWith("/profil/")
    ) {
      return "Mon profil";
    }

    if (
      chemin === "/finances" ||
      chemin.startsWith("/finances/")
    ) {
      return "Finances";
    }

    const rubrique =
      toutesLesRubriques.find(
        (item) => {
          if (
            item.chemin === chemin
          ) {
            return true;
          }

          if (
            item.chemin !== "/" &&
            chemin.startsWith(
              `${item.chemin}/`
            )
          ) {
            return true;
          }

          return false;
        }
      );

    return (
      rubrique?.label ||
      "Mon espace"
    );
  }, [
    location.pathname,
    toutesLesRubriques,
  ]);

  // ==========================================================
  // BADGE KOUREL
  // ==========================================================

  const afficherBadgeKourel =
    location.pathname.includes(
      "kourel"
    ) ||
    location.pathname.includes(
      "khassida"
    ) ||
    location.pathname.includes(
      "programme-religieux"
    ) ||
    location.pathname.includes(
      "repetition"
    );

  // ==========================================================
  // ACTIONS
  // ==========================================================

  const fermerMenu = useCallback(
    () => {
      setMenuOuvert(false);
    },
    []
  );

  const ouvrirProfil =
    useCallback(() => {
      fermerMenu();
      setRecherche("");
      navigate("/profil");
    }, [
      fermerMenu,
      navigate,
    ]);

  const retourAccueil =
    useCallback(() => {
      fermerMenu();
      setRecherche("");
      navigate("/");
    }, [
      fermerMenu,
      navigate,
    ]);

  const gererDeconnexion =
    useCallback(() => {
      fermerMenu();
      setRecherche("");
      deconnexion();
      navigate("/login");
    }, [
      deconnexion,
      fermerMenu,
      navigate,
    ]);

  // ==========================================================
  // NAVIGATION : FERMETURE DU MENU
  // ==========================================================

  useEffect(() => {
    setMenuOuvert(false);
    setRecherche("");
  }, [location.pathname]);

  // ==========================================================
  // SCROLL PRINCIPAL
  // ==========================================================
  //
  // IMPORTANT :
  // On ne bloque jamais le scroll général de la page.
  //
  // Lorsqu'une nouvelle route est chargée, la page revient
  // immédiatement au début.
  //
  // Aucun scroll interne n'est imposé au contenu de Outlet.
  // ==========================================================

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [
    location.pathname,
    location.search,
  ]);

  // ==========================================================
  // GESTION DU MENU MOBILE
  // ==========================================================
  //
  // On bloque uniquement le document lorsque le menu mobile
  // est ouvert.
  //
  // Le touchAction n'est volontairement PAS modifié afin de
  // ne pas perturber les champs, le clavier ou le défilement
  // tactile du menu.
  // ==========================================================

  useEffect(() => {
    if (!menuOuvert) {
      return undefined;
    }

    const html =
      document.documentElement;

    const body =
      document.body;

    const ancienOverflowHtml =
      html.style.overflow;

    const ancienOverflowBody =
      body.style.overflow;

    const ancienneOverscrollHtml =
      html.style.overscrollBehavior;

    const ancienneOverscrollBody =
      body.style.overscrollBehavior;

    const anciennePaddingRight =
      body.style.paddingRight;

    const largeurBarreDefilement =
      window.innerWidth -
      document.documentElement
        .clientWidth;

    html.style.overflow =
      "hidden";

    body.style.overflow =
      "hidden";

    html.style.overscrollBehavior =
      "none";

    body.style.overscrollBehavior =
      "none";

    if (
      largeurBarreDefilement > 0
    ) {
      body.style.paddingRight =
        `${largeurBarreDefilement}px`;
    }

    const gererTouche =
      (event) => {
        if (
          event.key === "Escape"
        ) {
          setMenuOuvert(false);
        }
      };

    window.addEventListener(
      "keydown",
      gererTouche
    );

    return () => {
      html.style.overflow =
        ancienOverflowHtml;

      body.style.overflow =
        ancienOverflowBody;

      html.style.overscrollBehavior =
        ancienneOverscrollHtml;

      body.style.overscrollBehavior =
        ancienneOverscrollBody;

      body.style.paddingRight =
        anciennePaddingRight;

      window.removeEventListener(
        "keydown",
        gererTouche
      );
    };
  }, [menuOuvert]);

  // ==========================================================
  // DATE
  // ==========================================================

  const dateTexte = useMemo(
    () =>
      new Intl.DateTimeFormat(
        "fr-FR",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
        }
      ).format(new Date()),
    []
  );

  // ==========================================================
  // RENDU
  // ==========================================================

  return (
    <div
      className="
        min-h-screen
        w-full
        overflow-x-hidden
        bg-[#f6f8f7]
        text-slate-900
      "
    >
      {/* ======================================================
          DÉCORATION
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          fixed inset-0
          z-0
          overflow-hidden
        "
      >
        <div
          className="
            absolute
            -left-32
            -top-32
            h-72
            w-72
            rounded-full
            bg-emerald-200/20
            blur-3xl
          "
        />

        <div
          className="
            absolute
            -right-32
            top-1/3
            h-80
            w-80
            rounded-full
            bg-teal-200/15
            blur-3xl
          "
        />

        <div
          className="
            absolute
            bottom-0
            left-1/3
            h-72
            w-72
            rounded-full
            bg-slate-200/20
            blur-3xl
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
            fixed inset-0
            z-40
            bg-slate-950/45
            backdrop-blur-[2px]
            lg:hidden
          "
        />
      )}

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50",
          "w-[290px] max-w-[88vw]",
          "overflow-hidden",
          "border-r border-emerald-900/20",
          "bg-white",
          "shadow-2xl shadow-slate-900/10",
          "transition-transform duration-300 ease-out",

          menuOuvert
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div
          className="
            absolute inset-x-0 top-0
            h-52
            bg-gradient-to-br
            from-emerald-950
            via-emerald-900
            to-teal-900
          "
        />

        <div
          className="
            absolute
            -right-16
            -top-16
            h-44
            w-44
            rounded-full
            bg-emerald-400/10
            blur-2xl
          "
        />

        <div
          className="
            absolute
            -left-10
            top-28
            h-32
            w-32
            rounded-full
            bg-teal-300/10
            blur-2xl
          "
        />

        <div
          className="
            relative
            flex
            h-full
            min-h-0
            flex-col
          "
        >
          {/* ==================================================
              HEADER SIDEBAR
          ================================================== */}

          <div className="shrink-0 px-5 pb-4 pt-5">
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={retourAccueil}
                className="
                  group
                  flex
                  min-w-0
                  items-center
                  gap-3
                  rounded-2xl
                  text-left
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-white/60
                "
              >
                <div
                  className="
                    relative
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-white/20
                    bg-white/10
                    text-white
                    shadow-lg
                    shadow-black/10
                    backdrop-blur-sm
                    transition-transform
                    duration-200
                    group-hover:scale-105
                  "
                >
                  <Sparkles
                    size={23}
                    strokeWidth={1.8}
                  />

                  <span
                    className="
                      absolute
                      -bottom-1
                      -right-1
                      h-3.5
                      w-3.5
                      rounded-full
                      border-2
                      border-emerald-900
                      bg-amber-400
                    "
                  />
                </div>

                <div className="min-w-0">
                  <div
                    className="
                      truncate
                      text-[16px]
                      font-extrabold
                      tracking-tight
                      text-white
                    "
                  >
                    Dahira Mawahibou
                  </div>

                  <div
                    className="
                      mt-0.5
                      truncate
                      text-[11px]
                      font-medium
                      text-emerald-100/70
                    "
                  >
                    Naafih de Castors
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={fermerMenu}
                aria-label="Fermer le menu"
                className="
                  rounded-xl
                  p-2
                  text-white/60
                  transition
                  hover:bg-white/10
                  hover:text-white
                  lg:hidden
                "
              >
                <X size={19} />
              </button>
            </div>

            {/* PROFIL */}

            <button
              type="button"
              onClick={ouvrirProfil}
              className="
                mt-5
                w-full
                rounded-2xl
                border
                border-white/10
                bg-white/[0.08]
                p-3
                text-left
                backdrop-blur-sm
                transition-all
                duration-200
                hover:bg-white/[0.13]
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-white/60
              "
            >
              <div className="flex items-center gap-3">
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
                    from-amber-300
                    to-orange-500
                    text-sm
                    font-extrabold
                    text-white
                    shadow-md
                  "
                >
                  {initiales}
                </div>

                <div className="min-w-0 flex-1">
                  <div
                    className="
                      truncate
                      text-sm
                      font-bold
                      text-white
                    "
                  >
                    {nomAffiche}
                  </div>

                  <div
                    className="
                      mt-0.5
                      truncate
                      text-[10px]
                      font-medium
                      uppercase
                      tracking-wider
                      text-emerald-100/60
                    "
                  >
                    {fonctionPrincipale}
                  </div>
                </div>

                <ChevronRight
                  size={16}
                  className="
                    shrink-0
                    text-white/40
                  "
                />
              </div>
            </button>
          </div>

          {/* ==================================================
              ZONE NAVIGATION
          ================================================== */}

          <div
            className="
              relative
              flex
              min-h-0
              flex-1
              flex-col
              overflow-hidden
              rounded-t-[28px]
              bg-white
              shadow-[0_-10px_30px_rgba(15,23,42,0.08)]
            "
          >
            {/* RECHERCHE */}

            <div
              className="
                shrink-0
                border-b
                border-slate-100
                px-4
                pb-3
                pt-4
              "
            >
              <div className="relative">
                <Search
                  size={16}
                  className="
                    pointer-events-none
                    absolute
                    left-3.5
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <input
                  type="text"
                  value={recherche}
                  onChange={(event) =>
                    setRecherche(
                      event.target.value
                    )
                  }
                  placeholder="Rechercher..."
                  aria-label="Rechercher dans le menu"
                  className="
                    h-10
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    pl-10
                    pr-10
                    text-sm
                    font-medium
                    text-slate-800
                    outline-none
                    transition-all
                    placeholder:text-slate-400
                    focus:border-emerald-300
                    focus:bg-white
                    focus:ring-4
                    focus:ring-emerald-500/10
                  "
                />

                {recherche && (
                  <button
                    type="button"
                    onClick={() =>
                      setRecherche("")
                    }
                    aria-label="Effacer la recherche"
                    className="
                      absolute
                      right-2.5
                      top-1/2
                      -translate-y-1/2
                      rounded-lg
                      p-1
                      text-slate-400
                      transition
                      hover:bg-slate-200
                      hover:text-slate-700
                    "
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* NAVIGATION */}

            <nav
              className="
                min-h-0
                flex-1
                overflow-y-auto
                overflow-x-hidden
                overscroll-contain
                px-3
                pb-4
                pt-2
                touch-pan-y
              "
            >
              {/* DASHBOARD */}

              {navigation.dashboard.length > 0 && (
                <div>
                  <SectionTitre>
                    Général
                  </SectionTitre>

                  <div className="space-y-1">
                    {navigation.dashboard.map(
                      (item) => (
                        <NavigationItem
                          key={item.chemin}
                          item={item}
                          onNavigate={
                            fermerMenu
                          }
                        />
                      )
                    )}
                  </div>
                </div>
              )}

              {/* ADMINISTRATION */}

              {navigation.administration.length > 0 && (
                <div>
                  <SectionTitre>
                    Administration
                  </SectionTitre>

                  <div className="space-y-1">
                    {navigation.administration.map(
                      (item) => (
                        <NavigationItem
                          key={`${item.chemin}-${item.label}`}
                          item={item}
                          onNavigate={
                            fermerMenu
                          }
                        />
                      )
                    )}
                  </div>
                </div>
              )}

              {/* MEMBRES */}

              {navigation.membres.length > 0 && (
                <div>
                  <SectionTitre>
                    Membres
                  </SectionTitre>

                  <div className="space-y-1">
                    {navigation.membres.map(
                      (item) => (
                        <NavigationItem
                          key={item.chemin}
                          item={item}
                          onNavigate={
                            fermerMenu
                          }
                        />
                      )
                    )}
                  </div>
                </div>
              )}

              {/* FINANCES */}

              {navigation.finances.length > 0 && (
                <div>
                  <SectionTitre>
                    Finances
                  </SectionTitre>

                  <div className="space-y-1">
                    {navigation.finances.map(
                      (item) => (
                        <NavigationItem
                          key={`${item.chemin}-${item.label}`}
                          item={item}
                          onNavigate={
                            fermerMenu
                          }
                        />
                      )
                    )}
                  </div>
                </div>
              )}

              {/* ACTIVITÉS */}

              {navigation.activites.length > 0 && (
                <div>
                  <SectionTitre>
                    Activités
                  </SectionTitre>

                  <div className="space-y-1">
                    {navigation.activites.map(
                      (item) => (
                        <NavigationItem
                          key={`${item.chemin}-${item.label}`}
                          item={item}
                          onNavigate={
                            fermerMenu
                          }
                        />
                      )
                      )}
                  </div>
                </div>
              )}

              {/* COMMUNICATION */}

              {navigation.communication.length > 0 && (
                <div>
                  <SectionTitre>
                    Communication
                  </SectionTitre>

                  <div className="space-y-1">
                    {navigation.communication.map(
                      (item) => (
                        <NavigationItem
                          key={item.chemin}
                          item={item}
                          onNavigate={
                            fermerMenu
                          }
                        />
                      )
                    )}
                  </div>
                </div>
              )}

              {/* RELATIONS */}

              {navigation.relations.length > 0 && (
                <div>
                  <SectionTitre>
                    Relations
                  </SectionTitre>

                  <div className="space-y-1">
                    {navigation.relations.map(
                      (item) => (
                        <NavigationItem
                          key={item.chemin}
                          item={item}
                          onNavigate={
                            fermerMenu
                          }
                        />
                      )
                    )}
                  </div>
                </div>
              )}

              {/* KOUREL */}

              {navigation.kourel.length > 0 && (
                <div>
                  <SectionTitre>
                    Kourel
                  </SectionTitre>

                  <div className="space-y-1">
                    {navigation.kourel.map(
                      (item) => (
                        <NavigationItem
                          key={item.chemin}
                          item={item}
                          onNavigate={
                            fermerMenu
                          }
                        />
                      )
                    )}
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS */}

              {navigation.notifications.length > 0 && (
                <div>
                  <SectionTitre>
                    Services
                  </SectionTitre>

                  <div className="space-y-1">
                    {navigation.notifications.map(
                      (item) => (
                        <NavigationItem
                          key={item.chemin}
                          item={item}
                          onNavigate={
                            fermerMenu
                          }
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
                    mt-8
                    rounded-2xl
                    border
                    border-dashed
                    border-slate-200
                    bg-slate-50
                    p-5
                    text-center
                  "
                >
                  <Search
                    size={22}
                    className="
                      mx-auto
                      text-slate-300
                    "
                  />

                  <p
                    className="
                      mt-2
                      text-xs
                      font-bold
                      text-slate-500
                    "
                  >
                    Aucun résultat
                  </p>

                  <p
                    className="
                      mt-1
                      text-[11px]
                      text-slate-400
                    "
                  >
                    Essayez un autre terme.
                  </p>
                </div>
              )}
            </nav>

            {/* ==================================================
                BAS SIDEBAR
            ================================================== */}

            <div
              className="
                shrink-0
                border-t
                border-slate-100
                bg-white
                p-3
              "
            >
              <button
                type="button"
                onClick={ouvrirProfil}
                className="
                  group
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  py-2.5
                  text-left
                  text-slate-600
                  transition
                  hover:bg-slate-50
                  hover:text-slate-900
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-emerald-400/50
                "
              >
                <CircleUserRound
                  size={17}
                  className="text-slate-400"
                />

                <span className="flex-1 text-xs font-bold">
                  Mon profil
                </span>

                <ChevronRight
                  size={14}
                  className="text-slate-300"
                />
              </button>

              <button
                type="button"
                onClick={retourAccueil}
                className="
                  group
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  py-2.5
                  text-left
                  text-slate-600
                  transition
                  hover:bg-slate-50
                  hover:text-slate-900
                "
              >
                <Home
                  size={17}
                  className="text-slate-400"
                />

                <span className="flex-1 text-xs font-bold">
                  Retour à l'accueil
                </span>

                <ChevronRight
                  size={14}
                  className="text-slate-300"
                />
              </button>

              <button
                type="button"
                onClick={gererDeconnexion}
                className="
                  group
                  mt-1
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  py-2.5
                  text-left
                  text-rose-600
                  transition
                  hover:bg-rose-50
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-rose-400/40
                "
              >
                <LogOut
                  size={17}
                  className="text-rose-400"
                />

                <span className="flex-1 text-xs font-bold">
                  Déconnexion
                </span>

                <ChevronRight
                  size={14}
                  className="text-rose-200"
                />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ======================================================
          BOUTON MENU MOBILE
      ====================================================== */}

      <button
        type="button"
        onClick={() =>
          setMenuOuvert(
            (ouvert) => !ouvert
          )
        }
        aria-label={
          menuOuvert
            ? "Fermer le menu"
            : "Ouvrir le menu"
        }
        aria-expanded={menuOuvert}
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
          border-white/60
          bg-emerald-950
          text-white
          shadow-xl
          shadow-emerald-950/20
          transition-all
          hover:scale-105
          active:scale-95
          lg:hidden
        "
      >
        {menuOuvert ? (
          <X size={20} />
        ) : (
          <Menu size={20} />
        )}
      </button>

      {/* ======================================================
          CONTENU PRINCIPAL
      ====================================================== */}

      <main
        className="
          relative
          z-10
          min-h-screen
          min-w-0
          overflow-x-hidden
          lg:ml-[290px]
        "
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <header
          className="
            sticky
            top-0
            z-30
            border-b
            border-slate-200/70
            bg-white/90
            backdrop-blur-xl
          "
        >
          <div
            className="
              flex
              min-h-[76px]
              items-center
              justify-between
              gap-4
              px-4
              pl-20
              sm:px-6
              sm:pl-20
              lg:px-8
              lg:pl-8
            "
          >
            {/* GAUCHE */}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="
                    hidden
                    h-2
                    w-2
                    rounded-full
                    bg-emerald-500
                    sm:block
                  "
                />

                <span
                  className="
                    hidden
                    text-[10px]
                    font-extrabold
                    uppercase
                    tracking-[0.18em]
                    text-slate-400
                    sm:block
                  "
                >
                  Dahira Mawahibou
                </span>
              </div>

              <div className="mt-0.5 flex items-center gap-2">
                <h1
                  className="
                    truncate
                    text-lg
                    font-extrabold
                    tracking-tight
                    text-slate-900
                    sm:text-xl
                  "
                >
                  {titrePage}
                </h1>

                {afficherBadgeKourel &&
                  estMembreKourel && (
                    <span
                      className="
                        hidden
                        items-center
                        gap-1
                        rounded-full
                        border
                        border-amber-200
                        bg-amber-50
                        px-2
                        py-1
                        text-[9px]
                        font-extrabold
                        uppercase
                        tracking-wider
                        text-amber-700
                        sm:flex
                      "
                    >
                      <Star
                        size={10}
                        fill="currentColor"
                      />

                      Kourel
                    </span>
                  )}
              </div>
            </div>

            {/* DROITE */}

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {/* DATE */}

              <div
                className="
                  hidden
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  px-3
                  py-2
                  text-slate-500
                  md:flex
                "
              >
                <Clock3
                  size={15}
                  className="text-emerald-500"
                />

                <span
                  className="
                    text-[11px]
                    font-bold
                    capitalize
                  "
                >
                  {dateTexte}
                </span>
              </div>

              {/* NOTIFICATIONS */}

              {possedePermission(
                "NOTIFICATION_CONSULTER"
              ) && (
                <button
                  type="button"
                  onClick={() => {
                    fermerMenu();
                    navigate(
                      "/notifications"
                    );
                  }}
                  aria-label="Notifications"
                  className="
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
                    hover:border-emerald-200
                    hover:bg-emerald-50
                    hover:text-emerald-700
                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-emerald-400/50
                  "
                >
                  <Bell size={18} />
                </button>
              )}

              {/* PROFIL */}

              <button
                type="button"
                onClick={ouvrirProfil}
                aria-label="Ouvrir mon profil"
                className="
                  group
                  flex
                  items-center
                  gap-2
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-1.5
                  pr-2.5
                  shadow-sm
                  transition-all
                  duration-200
                  hover:border-emerald-200
                  hover:shadow-md
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-emerald-400/50
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
                    bg-gradient-to-br
                    from-emerald-600
                    to-teal-700
                    text-[11px]
                    font-extrabold
                    text-white
                    shadow-sm
                  "
                >
                  {initiales}
                </div>

                <div
                  className="
                    hidden
                    min-w-0
                    text-left
                    sm:block
                  "
                >
                  <div
                    className="
                      max-w-[130px]
                      truncate
                      text-xs
                      font-extrabold
                      text-slate-800
                    "
                  >
                    {nomAffiche}
                  </div>

                  <div
                    className="
                      mt-0.5
                      max-w-[130px]
                      truncate
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    {fonctionPrincipale}
                  </div>
                </div>

                <ChevronRight
                  size={14}
                  className="
                    hidden
                    text-slate-300
                    transition-transform
                    group-hover:translate-x-0.5
                    sm:block
                  "
                />
              </button>
            </div>
          </div>
        </header>

        {/* ==================================================
            ZONE DE CONTENU
        ================================================== */}

        <div
          className="
            w-full
            min-w-0
            px-4
            pb-8
            pt-4
            sm:px-6
            sm:pt-5
            lg:px-8
            lg:pt-6
          "
        >
          {/* BREADCRUMB */}

          <div
            className="
              mb-5
              hidden
              items-center
              gap-2
              text-[10px]
              font-bold
              text-slate-400
              sm:flex
            "
          >
            <button
              type="button"
              onClick={retourAccueil}
              className="
                transition
                hover:text-emerald-600
              "
            >
              Accueil
            </button>

            <ChevronRight size={12} />

            <span className="text-slate-600">
              {titrePage}
            </span>
          </div>

          {/* ==================================================
              CONTENEUR PAGE
          ================================================== */}

          <section
            className="
              w-full
              min-w-0
              rounded-[26px]
              border
              border-slate-200/70
              bg-white/70
              shadow-sm
              backdrop-blur-sm
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
          </section>
        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <footer
          className="
            px-4
            pb-6
            sm:px-6
            lg:px-8
          "
        >
          <div
            className="
              flex
              flex-col
              items-center
              justify-between
              gap-2
              border-t
              border-slate-200/70
              pt-5
              text-center
              sm:flex-row
              sm:text-left
            "
          >
            <div className="flex items-center gap-2">
              <Sparkles
                size={13}
                className="text-emerald-500"
              />

              <span
                className="
                  text-[10px]
                  font-bold
                  text-slate-400
                "
              >
                Dahira Mawahibou • Naafih de Castors
              </span>
            </div>

            <span
              className="
                text-[10px]
                font-medium
                text-slate-400
              "
            >
              © {new Date().getFullYear()} —
              Tous droits réservés
            </span>
          </div>
        </footer>
      </main>

      {/* ======================================================
          SCROLLBAR
      ====================================================== */}

      <style>{`
        html,
        body {
          max-width: 100%;
          overflow-x: hidden;
        }

        html {
          scroll-behavior: auto;
        }

        body {
          margin: 0;
          overflow-y: auto;
        }

        * {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }

        *::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        *::-webkit-scrollbar-track {
          background: transparent;
        }

        *::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 999px;
        }

        *::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        @media (max-width: 1023px) {
          html,
          body {
            overflow-x: hidden;
          }
        }
      `}</style>
    </div>
  );
}