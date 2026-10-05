/**
 * Olympus 3D Portfolio - Master Configuration & Shared Celestial Lighting Theme
 * Shared single-source-of-truth constants used across Atmosphere, MountOlympus, Ocean, and Controllers.
 */

export const CELESTIAL_THEME = {
  // Shared Sun Parameters
  sun: {
    position: [40, 120, -120],
    color: "#FFF1D6",           // Pure warm dawn solar illumination
    colorHex: 0xFFF1D6,
    haloColor: "#D97706",       // Restrained amber halo
    haloColorHex: 0xD97706,
    intensity: 2.4,
  },

  // Shared Sky & Atmospheric Fog
  sky: {
    topColor: "#020716",        // Deep celestial midnight
    horizonColor: "#221730",    // Muted dawn slate-violet
    dawnAmber: "#C87B28",       // Restrained horizon amber
    fogColor: "#09121E",
    fogDensity: 0.0022          // Soft distance haze allowing depth staging
  },

  // Ocean Colors (Deep Aegean blue-green, zero electric cyan)
  ocean: {
    deepColor: "#021224",
    shallowColor: "#0A2838",
    specularColor: "#E2D9C8"
  }
};

export const OLYMPUS_CONFIG = {
  title: "ASCENT TO OLYMPUS",
  subtitle: "REALM OF THE PANTHEON",
  author: "Olympian Architect",

  loadingQuotes: [
    "Summoning the eternal mists of Mount Olympus...",
    "Harmonizing celestial spheres and star dust...",
    "Forging the golden thrones upon the highest summit...",
    "Channelling the divine fire of Prometheus...",
    "Opening the gilded gates of the Pantheon..."
  ],

  // Camera Flythrough Path (CatmullRomCurve3 coordinates)
  // Adjusted with distinct Z/Y offsets and safe clearance from mountain geometry
  flythrough: {
    duration: 5.5,
    ease: "power2.inOut",
    baseFOV: 50,
    maxFOV: 63,
    positionWaypoints: [
      [0, 3.0, 140],    // 1. t=0.0: Ocean skim start (195 units from mountain base)
      [0, 8.5, 95],     // 2. t=0.2: Accelerating forward over waters
      [0, 32.0, 42],    // 3. t=0.4: Arcing upward through mid-level clouds
      [0, 68.0, 2],     // 4. t=0.6: Ascending cliff face (50+ units clearance from rock)
      [0, 93.0, -32],   // 5. t=0.8: Emerging above summit plateau
      [0, 97.0, -48]    // 6. t=1.0: Sits elevated at peak with full view of thrones & above UI overlay
    ],
    targetWaypoints: [
      [0, 16.0, 60],    // 1. t=0.0: Looking toward distant mountain silhouette
      [0, 32.0, 20],    // 2. t=0.2: Looking up at glowing cloud mist
      [0, 62.0, -15],   // 3. t=0.4: Tracking the illuminated cliff ridge
      [0, 88.0, -45],   // 4. t=0.6: Framing the golden summit beacon
      [0, 95.0, -66],   // 5. t=0.8: Focusing onto the throne sanctuary
      [0, 95.5, -68]    // 6. t=1.0: Level lookAt centered onto the semi-circle of thrones
    ]
  },

  // Mountain & World Geometry (repositioned with clear depth layering)
  world: {
    mountainPosition: [0, 0, -65],
    mountainHeight: 96,
    cloudLayerAltitude: 42,
    waterLevel: 0,
    sanctuaryPlatform: [0, 93.5, -68],
    torusHaloPosition: [0, 110, -78],
    beaconLightPosition: [0, 95, -68]
  },

  // Peak Thrones Configuration (N=5 interactive navigation destinations)
  thrones: [
    {
      id: "zeus",
      god: "Zeus",
      title: "The Sovereign",
      section: "About Me",
      route: "/about",
      color: "#FDE047",
      glowColor: "#E5A93C",
      position: [-10.5, 94.5, -64],
      rotation: [0, 0.42, 0],
      description: "Architect of scalable systems, master of vision & divine craft."
    },
    {
      id: "apollo",
      god: "Apollo",
      title: "God of Light & Arts",
      section: "Creations & Projects",
      route: "/projects",
      color: "#F59E0B",
      glowColor: "#D97706",
      position: [-5.5, 94.5, -68],
      rotation: [0, 0.22, 0],
      description: "Illuminating digital experiences with cutting-edge 3D & interactive design."
    },
    {
      id: "athena",
      god: "Athena",
      title: "Goddess of Wisdom",
      section: "Skills & Mastery",
      route: "/skills",
      color: "#38BDF8",
      glowColor: "#0284C7",
      position: [0, 94.8, -69.5],
      rotation: [0, 0, 0],
      description: "Tactical mastery in React, WebGL, Full-Stack Architecture & Performance."
    },
    {
      id: "hermes",
      god: "Hermes",
      title: "The Swift Messenger",
      section: "Reach the Oracle",
      route: "/contact",
      color: "#34D399",
      glowColor: "#059669",
      position: [5.5, 94.5, -68],
      rotation: [0, -0.22, 0],
      description: "Send swift digital dispatches across the mortal & immortal realms."
    },
    {
      id: "poseidon",
      god: "Poseidon",
      title: "Lord of the Depths",
      section: "Archive & Experiments",
      route: "/archive",
      color: "#60A5FA",
      glowColor: "#2563EB",
      position: [10.5, 94.5, -64],
      rotation: [0, -0.42, 0],
      description: "Navigating deep experiments, shaders, and uncharted code."
    }
  ]
};
