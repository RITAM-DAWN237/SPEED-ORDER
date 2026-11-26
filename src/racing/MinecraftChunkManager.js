import * as THREE from 'three';

/**
 * Deterministic pseudo-random number generator for chunk generation (Minecraft seeded noise style)
 */
function chunkRandom(seed, x, z) {
  let h = Math.imul(seed ^ Math.imul(x, 374761393), 668265263);
  h = Math.imul(h ^ Math.imul(z, 1442968193), 2246822519);
  h = (h ^ (h >>> 13)) >>> 0;
  return h / 4294967296;
}

/**
 * Indian States Highway Biome Metadata (Continuous 50 KM Expedition)
 */
export const INDIAN_STATES = {
  1: { id: 'punjab', name: 'PUNJAB', title: 'GT Road Suburb', icon: '🏡' },
  2: { id: 'rajasthan', name: 'RAJASTHAN', title: 'Thar Desert', icon: '🏜️' },
  3: { id: 'himachal', name: 'HIMACHAL PRADESH', title: 'Rohtang Snow', icon: '❄️' },
  4: { id: 'meghalaya', name: 'MEGHALAYA', title: 'Cherrapunji Monsoon', icon: '🌧️' },
  5: { id: 'assam', name: 'ASSAM', title: 'Kaziranga Forest', icon: '🌲' },
  6: { id: 'kashmir', name: 'KASHMIR', title: 'Chinar Autumn', icon: '🍂' },
  7: { id: 'maharashtra', name: 'MAHARASHTRA', title: 'Mumbai Cyberway', icon: '🏙️' },
  8: { id: 'goa', name: 'GOA', title: 'Marine Drive Beach', icon: '🌊' },
  9: { id: 'kerala', name: 'KERALA', title: 'Wayanad Rainforest', icon: '🌴' },
  10: { id: 'uttar_pradesh', name: 'UTTAR PRADESH', title: 'Taj Mahal Corridor', icon: '🕌' },
  11: { id: 'finish', name: 'FINISH GARAGE', title: 'Grand Finish Garage', icon: '🏁' }
};

/**
 * MinecraftChunkManager: Infinite procedural chunk streaming engine:
 * - World divided into discrete chunks along Z (chunkSize = 65m)
 * - Majestic stepped mountains flanking the highway with rocky terraces and snow caps
 * - Giant Redwoods, Mega Taiga Spruces, and Ancient Canopy Oaks (18m - 26m tall)
 * - Overhead LED electronic highway gantries spanning the 4 lanes
 * - Animated rotating wind turbines on mountain ridges
 * - Roadside highway exit boards, rest stop shelters, and glowstone streetlamps
 * - Floating procedural 3D voxel clouds in the sky
 */
export class MinecraftChunkManager {
  constructor(scene) {
    this.scene = scene;
    this.seed = 987654;

    this.chunkLength = 65; // 65 meters per chunk along Z
    this.roadWidth = 16.0;
    this.laneWidth = 4.0;
    this.viewDistanceAhead = 6; // Load 6 chunks ahead (~390m)
    this.viewDistanceBehind = 2; // Keep 2 chunks behind (~130m)

    this.activeChunks = new Map(); // Key: chunkZ index -> Chunk object
    this.animatedObjects = []; // Wind turbine rotors, clouds
    this.garageDoorMesh = null;
    this.garageDoorClosing = false;

    this.initSharedAssets();
    this.createGlobalClouds();
  }

  initSharedAssets() {
    // Road materials with subtle asphalt sheen and contact roughness
    this.roadMat = new THREE.MeshStandardMaterial({ color: 0x2b2e36, roughness: 0.55, metalness: 0.15, flatShading: true });
    this.whiteMarkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.curbMat = new THREE.MeshStandardMaterial({ color: 0x7a808c, roughness: 0.65, metalness: 0.1, flatShading: true });
    this.guardrailMat = new THREE.MeshStandardMaterial({ color: 0x9ba2ad, roughness: 0.35, metalness: 0.65, flatShading: true });
    this.postMat = new THREE.MeshStandardMaterial({ color: 0x545963, roughness: 0.5, metalness: 0.4, flatShading: true });

    // Mountain materials
    this.mountainRockMat = new THREE.MeshStandardMaterial({ color: 0x565c66, roughness: 0.85, metalness: 0.05, flatShading: true });
    this.mountainSlateMat = new THREE.MeshStandardMaterial({ color: 0x6e7682, roughness: 0.8, metalness: 0.1, flatShading: true });
    this.snowCapMat = new THREE.MeshStandardMaterial({ color: 0xf0f5fc, roughness: 0.45, metalness: 0.05, flatShading: true });

    // Biome Palettes
    this.biomes = [
      {
        name: 'Plains',
        grassColor: 0x54a832,
        dirtColor: 0x6e4c27,
        woodColor: 0x694828,
        leavesColor: 0x428a25,
        leavesHighlightColor: 0x52a830,
        treeType: 'OAK'
      },
      {
        name: 'Taiga',
        grassColor: 0x3d7037,
        dirtColor: 0x543c22,
        woodColor: 0x47301c,
        leavesColor: 0x244f2b,
        leavesHighlightColor: 0x2d6135,
        treeType: 'SPRUCE'
      },
      {
        name: 'Savanna',
        grassColor: 0x8a9942,
        dirtColor: 0x73522a,
        woodColor: 0x634626,
        leavesColor: 0x5b6b25,
        leavesHighlightColor: 0x708530,
        treeType: 'ACACIA'
      },
      {
        name: 'Redwood Valley',
        grassColor: 0x4b7835,
        dirtColor: 0x5a3e22,
        woodColor: 0x522d19,
        leavesColor: 0x2d5c2f,
        leavesHighlightColor: 0x3d753f,
        treeType: 'GIANT_REDWOOD'
      }
    ];

    // Infrastructure & Signs
    this.gantrySteelMat = new THREE.MeshStandardMaterial({ color: 0x2d323b, roughness: 0.4, metalness: 0.7, flatShading: true });
    this.ledSignMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    this.highwayGreenMat = new THREE.MeshStandardMaterial({ color: 0x156338, roughness: 0.65, metalness: 0.08, flatShading: true });
    this.lampMat = new THREE.MeshBasicMaterial({ color: 0xffea75 });
    this.fenceMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.75, metalness: 0.05, flatShading: true });
    this.turbineWhiteMat = new THREE.MeshStandardMaterial({ color: 0xe8ecf2, roughness: 0.35, metalness: 0.3, flatShading: true });

    // Marine Drive Beach & Ocean Materials
    this.beachSandMat = new THREE.MeshStandardMaterial({ color: 0xedd191, roughness: 0.85, metalness: 0.05, flatShading: true });
    this.wetSandMat = new THREE.MeshStandardMaterial({ color: 0xcdb276, roughness: 0.4, metalness: 0.25, flatShading: true });
    this.oceanDeepMat = new THREE.MeshStandardMaterial({ color: 0x0077b6, roughness: 0.12, metalness: 0.85, flatShading: true });
    this.oceanShallowMat = new THREE.MeshStandardMaterial({ color: 0x00a8cc, roughness: 0.15, metalness: 0.8, flatShading: true });
    this.oceanFoamMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.promenadeTileMat = new THREE.MeshStandardMaterial({ color: 0xded5c6, roughness: 0.6, metalness: 0.1, flatShading: true });
    this.seawallMat = new THREE.MeshStandardMaterial({ color: 0x8a909a, roughness: 0.7, metalness: 0.2, flatShading: true });
    this.seawallRailMat = new THREE.MeshStandardMaterial({ color: 0x48505e, roughness: 0.4, metalness: 0.6, flatShading: true });
    this.tetrapodMat = new THREE.MeshStandardMaterial({ color: 0x717782, roughness: 0.8, metalness: 0.1, flatShading: true });
    this.marineLampMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.4, metalness: 0.5, flatShading: true });
    this.marineGlowMat = new THREE.MeshBasicMaterial({ color: 0xfff4b8 });

    // Jungle Materials (3D foliage PBR)
    this.jungleGrassMat = new THREE.MeshStandardMaterial({ color: 0x1e6b2c, roughness: 0.68, metalness: 0.05, flatShading: true });
    this.jungleRockMat = new THREE.MeshStandardMaterial({ color: 0x3d473b, roughness: 0.8, metalness: 0.1, flatShading: true });
    this.jungleMossMat = new THREE.MeshStandardMaterial({ color: 0x27592e, roughness: 0.75, metalness: 0.05, flatShading: true });
    this.palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x7a532d, roughness: 0.8, metalness: 0.05, flatShading: true });
    this.palmLeafMat = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.65, metalness: 0.06, flatShading: true });
    this.palmLeafLightMat = new THREE.MeshStandardMaterial({ color: 0x34a832, roughness: 0.62, metalness: 0.06, flatShading: true });
    this.coconutMat = new THREE.MeshStandardMaterial({ color: 0x4e3518, roughness: 0.75, metalness: 0.05, flatShading: true });
    this.umbrellaRedMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.4, metalness: 0.1, flatShading: true });
    this.umbrellaWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.1, flatShading: true });
    this.umbrellaBlueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4, metalness: 0.1, flatShading: true });
    this.umbrellaYellowMat = new THREE.MeshStandardMaterial({ color: 0xffd60a, roughness: 0.4, metalness: 0.1, flatShading: true });
    this.boatHullMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.3, flatShading: true });
    this.boatSailMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.05, flatShading: true });

    // Amazon Rainforest Materials (Rich 3D canopy)
    this.amazonFloorMat = new THREE.MeshStandardMaterial({ color: 0x133e24, roughness: 0.8, metalness: 0.05, flatShading: true });
    this.amazonCanopyMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.68, metalness: 0.05, flatShading: true });
    this.amazonDeepCanopyMat = new THREE.MeshStandardMaterial({ color: 0x0f5132, roughness: 0.72, metalness: 0.05, flatShading: true });
    this.amazonLightCanopyMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.62, metalness: 0.05, flatShading: true });
    this.amazonTrunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.82, metalness: 0.05, flatShading: true });
    this.amazonButtressMat = new THREE.MeshStandardMaterial({ color: 0x3d2c1f, roughness: 0.85, metalness: 0.05, flatShading: true });
    this.amazonVineMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.7, metalness: 0.05, flatShading: true });
    this.amazonRiverMat = new THREE.MeshStandardMaterial({ color: 0x4d3826, roughness: 0.2, metalness: 0.7, flatShading: true });
    this.lilyPadMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6, metalness: 0.05, flatShading: true });
    this.lilyFlowerMat = new THREE.MeshBasicMaterial({ color: 0xf472b6 });

    // 7 Maps Materials: Suburb, Desert, Snowy, Rainy, Forest, Autumn, City Night
    this.suburbLawnMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.75, metalness: 0.05, flatShading: true });
    this.suburbHouseMat1 = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5, metalness: 0.15, flatShading: true });
    this.suburbHouseMat2 = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.5, metalness: 0.15, flatShading: true });
    this.suburbHouseMat3 = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5, metalness: 0.15, flatShading: true });
    this.suburbRoofMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.65, metalness: 0.1, flatShading: true });
    this.suburbRoofMatDark = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.65, metalness: 0.1, flatShading: true });
    this.suburbWhiteFenceMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, metalness: 0.15, flatShading: true });

    this.desertSandMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.85, metalness: 0.05, flatShading: true });
    this.desertRockMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8, metalness: 0.05, flatShading: true });
    this.desertMesaMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8, metalness: 0.05, flatShading: true });
    this.cactusMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.65, metalness: 0.05, flatShading: true });

    this.snowGroundMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45, metalness: 0.08, flatShading: true });
    this.snowPineMat = new THREE.MeshStandardMaterial({ color: 0x1e3a29, roughness: 0.72, metalness: 0.05, flatShading: true });
    this.snowLayerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.1, flatShading: true });
    this.iceRockMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.25, flatShading: true });

    this.rainyGroundMat = new THREE.MeshStandardMaterial({ color: 0x273b2b, roughness: 0.4, metalness: 0.25, flatShading: true });
    this.rainyPuddleMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.85, flatShading: true });
    this.rainySpruceMat = new THREE.MeshStandardMaterial({ color: 0x14281d, roughness: 0.7, metalness: 0.05, flatShading: true });

    this.forestMossMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.75, metalness: 0.05, flatShading: true });
    this.forestRedwoodTrunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.82, metalness: 0.05, flatShading: true });
    this.forestRedwoodFoliageMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.68, metalness: 0.05, flatShading: true });
    this.forestDeepCanopyMat = new THREE.MeshStandardMaterial({ color: 0x0f3d1f, roughness: 0.75, metalness: 0.05, flatShading: true });
    this.forestCanopyMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.68, metalness: 0.05, flatShading: true });

    this.autumnGroundMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8, metalness: 0.05, flatShading: true });
    this.autumnOrangeMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.68, metalness: 0.05, flatShading: true });
    this.autumnGoldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.65, metalness: 0.05, flatShading: true });
    this.autumnRedMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.68, metalness: 0.05, flatShading: true });
    this.autumnTrunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8, metalness: 0.05, flatShading: true });

    this.cityGroundMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6, metalness: 0.3, flatShading: true });
    this.cityBuildingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.35, flatShading: true });
    this.cityBuildingDarkMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.5, metalness: 0.4, flatShading: true });
    this.cityWindowCyan = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.cityWindowYellow = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    this.cityWindowPink = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    this.cityNeonSign = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    // Map 10: Taj Mahal Materials (Ivory marble with soft stone luster)
    this.tajMarbleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.18, flatShading: true });
    this.tajMarbleTrimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.28, metalness: 0.15, flatShading: true });
    this.tajGoldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.22, metalness: 0.88 });
    this.tajSandstoneMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.75, metalness: 0.08, flatShading: true });
    this.tajPoolWaterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.12, metalness: 0.82, flatShading: true });
    this.tajLawnMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.72, metalness: 0.05, flatShading: true });
    this.tajCypressMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.68, metalness: 0.05, flatShading: true });
    this.tajTrunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8, metalness: 0.05, flatShading: true });

    // Grand Finish Garage Materials (50 KM)
    this.garageSteelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.72, flatShading: true });
    this.garageFloorMat = new THREE.MeshStandardMaterial({ color: 0x242d3d, roughness: 0.45, metalness: 0.35, flatShading: true });
    this.garageDoorMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.6, flatShading: true });
    this.garageHazardYellowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    this.garageHazardBlackMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    this.garageNeonCyanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    // Transition Mountain Highway Tunnels (every 5 KM)
    this.tunnelConcreteMat = new THREE.MeshStandardMaterial({ color: 0x3b4252, roughness: 0.85, metalness: 0.2, flatShading: true });
    this.tunnelTileMat = new THREE.MeshStandardMaterial({ color: 0xd8dee9, roughness: 0.35, metalness: 0.15, flatShading: true });
    this.tunnelPortalMat = new THREE.MeshStandardMaterial({ color: 0x2e3440, roughness: 0.88, metalness: 0.1, flatShading: true });
    this.tunnelAmberLightMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    this.tunnelCyanLightMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    this.tunnelSignMat = new THREE.MeshBasicMaterial({ color: 0x0a101d });

    // 1 KM Highway Gas & Refueling Stations
    this.stationCanopyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.5, flatShading: true });
    this.stationTrimMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.stationPumpMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, metalness: 0.35, flatShading: true });
    this.stationTotemMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.4, flatShading: true });
    this.stationGlowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    this.stationNitroGlowMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    // Forest Highway Streetlights (Assam)
    this.streetLightPoleMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.75, flatShading: true });
    this.streetLightBulbMat = new THREE.MeshBasicMaterial({ color: 0xffe066 });

    // Maharashtra City Night & Streetlife Materials
    this.cityFootpathMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7, metalness: 0.15, flatShading: true });
    this.cityCurbMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6, metalness: 0.2, flatShading: true });
    this.cafeAwningRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6, metalness: 0.1, flatShading: true });
    this.cafeAwningBlueMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6, metalness: 0.1, flatShading: true });
    this.cafeAwningWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6, metalness: 0.1, flatShading: true });
    this.cafeWarmGlowMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
    this.cafeWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75, metalness: 0.1, flatShading: true });
    this.cafeParasolMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6, metalness: 0.1, flatShading: true });
    this.cityNeonPinkMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    this.cityNeonGreenMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    this.cityNeonOrangeMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });

    // Pedestrian Materials
    this.citizenSkinMat1 = new THREE.MeshStandardMaterial({ color: 0xe0a97a, roughness: 0.8, metalness: 0.05, flatShading: true });
    this.citizenSkinMat2 = new THREE.MeshStandardMaterial({ color: 0x8d5524, roughness: 0.8, metalness: 0.05, flatShading: true });
    this.citizenClothMat1 = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.7, metalness: 0.1, flatShading: true });
    this.citizenClothMat2 = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.7, metalness: 0.1, flatShading: true });
    this.citizenClothMat3 = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.7, metalness: 0.1, flatShading: true });
    this.citizenClothMat4 = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7, metalness: 0.1, flatShading: true });
    this.citizenDarkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.1, flatShading: true });

    // City Park Materials
    this.parkGrassMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75, metalness: 0.05, flatShading: true });
    this.parkPathMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8, metalness: 0.1, flatShading: true });
    this.parkFountainMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.3, flatShading: true });
    this.parkWaterMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, roughness: 0.1, metalness: 0.9, flatShading: true });
    this.parkCherryMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.65, metalness: 0.05, flatShading: true });

    // State Monument Materials
    this.monumentGoldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.22, metalness: 0.88, flatShading: true });
    this.monumentJaipurPinkMat = new THREE.MeshStandardMaterial({ color: 0xdf6a50, roughness: 0.65, metalness: 0.08, flatShading: true });
    this.monumentBronzeMat = new THREE.MeshStandardMaterial({ color: 0xa0522d, roughness: 0.5, metalness: 0.45, flatShading: true });
    this.monumentBasaltMat = new THREE.MeshStandardMaterial({ color: 0xb59975, roughness: 0.75, metalness: 0.15, flatShading: true });
    this.monumentLateriteMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.78, metalness: 0.08, flatShading: true });
    this.monumentPagodaWoodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85, metalness: 0.05, flatShading: true });
    this.monumentBrassRoofMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.75, flatShading: true });
    this.monumentRootMat = new THREE.MeshStandardMaterial({ color: 0x3f2512, roughness: 0.9, metalness: 0.05, flatShading: true });
    this.monumentBambooMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.65, metalness: 0.1, flatShading: true });

    // Pre-allocated static geometries for Assam Forest (Zero allocations during gameplay, silky 60 FPS)
    this.forestTrunkGeo = new THREE.BoxGeometry(2.6, 26.0, 2.6);
    this.forestBoughGeo = new THREE.BoxGeometry(2.0, 2.0, 15.0);
    this.forestCrownGeo1 = new THREE.BoxGeometry(16.0, 5.5, 16.0);
    this.forestCrownGeo2 = new THREE.BoxGeometry(12.0, 4.2, 12.0);
    this.forestCrownGeo3 = new THREE.BoxGeometry(8.0, 3.5, 8.0);
    this.forestSkyRoofGeo1 = new THREE.BoxGeometry(64.0, 3.2, this.chunkLength + 1);
    this.forestSkyRoofGeo2 = new THREE.BoxGeometry(50.0, 3.6, this.chunkLength + 1);
    this.forestLogRailGeo = new THREE.BoxGeometry(0.4, 0.8, this.chunkLength);
    this.forestLogPostGeo = new THREE.BoxGeometry(0.4, 1.2, 0.4);
  }

  createGlobalClouds() {
    this.cloudsGroup = new THREE.Group();
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });

    for (let c = 0; c < 12; c++) {
      const cloud = new THREE.Group();
      const numBlocks = 4 + Math.floor(Math.random() * 4);
      for (let b = 0; b < numBlocks; b++) {
        const bw = 14 + Math.random() * 12;
        const bh = 5 + Math.random() * 4;
        const bd = 14 + Math.random() * 12;
        const block = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), cloudMat);
        block.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 16);
        cloud.add(block);
      }
      cloud.position.set((Math.random() - 0.5) * 300, 55 + Math.random() * 25, Math.random() * 600);
      this.cloudsGroup.add(cloud);
    }
    this.scene.add(this.cloudsGroup);
  }

  getBiomeForChunk(chunkIndex) {
    if (this.currentStage === 2) {
      // Map 2: Coastal Marine Drive
      return this.biomes[1];
    } else if (this.currentStage === 3) {
      // Map 3: Amazon Rainforest
      return {
        name: 'Amazon Rainforest',
        grassColor: 0x133e24,
        dirtColor: 0x3d2c1f,
        woodColor: 0x4a3525,
        leavesColor: 0x15803d,
        treeType: 'AMAZON_KAPOK'
      };
    }
    // Map 1: Endless Savanna & Plains
    const isSavanna = Math.abs(Math.floor(chunkIndex / 5)) % 2 === 0;
    return isSavanna ? this.biomes[2] : this.biomes[0];
  }

  createChunk(chunkIndex) {
    const chunkZStart = chunkIndex * this.chunkLength;
    const biome = this.getBiomeForChunk(chunkIndex);
    const chunkGroup = new THREE.Group();
    chunkGroup.position.z = chunkZStart;

    // 1. Asphalt Road Surface (16m wide, 65m long)
    const roadGeo = new THREE.PlaneGeometry(this.roadWidth, this.chunkLength);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMesh = new THREE.Mesh(roadGeo, this.roadMat);
    roadMesh.position.set(0, 0, this.chunkLength / 2);
    roadMesh.receiveShadow = true;
    chunkGroup.add(roadMesh);

    // Stone Curb borders
    const curbGeo = new THREE.BoxGeometry(0.5, 0.25, this.chunkLength);
    const curbL = new THREE.Mesh(curbGeo, this.curbMat);
    curbL.position.set(-8.0, 0.1, this.chunkLength / 2);
    curbL.castShadow = true;
    curbL.receiveShadow = true;
    chunkGroup.add(curbL);
    const curbR = new THREE.Mesh(curbGeo, this.curbMat);
    curbR.position.set(8.0, 0.1, this.chunkLength / 2);
    curbR.castShadow = true;
    curbR.receiveShadow = true;
    chunkGroup.add(curbR);

    // 2. Road Markings
    const edgeGeo = new THREE.PlaneGeometry(0.22, this.chunkLength);
    edgeGeo.rotateX(-Math.PI / 2);
    const edgeL = new THREE.Mesh(edgeGeo, this.whiteMarkMat);
    edgeL.position.set(-7.5, 0.02, this.chunkLength / 2);
    chunkGroup.add(edgeL);
    const edgeR = new THREE.Mesh(edgeGeo, this.whiteMarkMat);
    edgeR.position.set(7.5, 0.02, this.chunkLength / 2);
    chunkGroup.add(edgeR);

    // Center divider line
    const centerLineGeo = new THREE.PlaneGeometry(0.28, this.chunkLength);
    centerLineGeo.rotateX(-Math.PI / 2);
    const centerLine = new THREE.Mesh(centerLineGeo, this.whiteMarkMat);
    centerLine.position.set(0, 0.02, this.chunkLength / 2);
    chunkGroup.add(centerLine);

    // Dashed lines between lanes (4m dash, 4m gap)
    const dashLength = 4.0;
    const dashGap = 4.0;
    const dashGeo = new THREE.PlaneGeometry(0.2, dashLength);
    dashGeo.rotateX(-Math.PI / 2);

    for (let z = 0; z < this.chunkLength; z += dashLength + dashGap) {
      const dashL = new THREE.Mesh(dashGeo, this.whiteMarkMat);
      dashL.position.set(-4.0, 0.02, z + dashLength / 2);
      chunkGroup.add(dashL);

      const dashR = new THREE.Mesh(dashGeo, this.whiteMarkMat);
      dashR.position.set(4.0, 0.02, z + dashLength / 2);
      chunkGroup.add(dashR);
    }

    // 3. Unified Dynamic Biome Progression & Interstate Tunnels
    const chunkDistMeters = chunkIndex * this.chunkLength;
    const chunkDistKM = Math.max(0, chunkDistMeters / 1000);

    let biomeIndex = 1;
    if (chunkDistKM < 5.0) biomeIndex = 1; // 0-5 KM: Punjab (Suburb)
    else if (chunkDistKM < 10.0) biomeIndex = 2; // 5-10 KM: Rajasthan (Desert)
    else if (chunkDistKM < 15.0) biomeIndex = 3; // 10-15 KM: Himachal Pradesh (Snow)
    else if (chunkDistKM < 20.0) biomeIndex = 4; // 15-20 KM: Meghalaya (Rain)
    else if (chunkDistKM < 25.0) biomeIndex = 5; // 20-25 KM: Assam (Forest)
    else if (chunkDistKM < 30.0) biomeIndex = 6; // 25-30 KM: Kashmir (Autumn)
    else if (chunkDistKM < 35.0) biomeIndex = 7; // 30-35 KM: Maharashtra (City Night)
    else if (chunkDistKM < 40.0) biomeIndex = 8; // 35-40 KM: Goa (Marine Drive)
    else if (chunkDistKM < 45.0) biomeIndex = 9; // 40-45 KM: Kerala (Rainforest)
    else if (chunkDistKM < 50.0) biomeIndex = 10; // 45-50 KM: Uttar Pradesh (Taj Mahal)
    else biomeIndex = 11; // 50 KM+: Grand Finish Garage!

    // Check if this chunk is part of a 5 KM Interstate Mountain Tunnel Transition
    // Tunnels occur at milestones: 5km, 10km, 15km, 20km, 25km, 30km, 35km, 40km, 45km
    const nearest5KM = Math.round(chunkDistMeters / 5000) * 5000;
    const distTo5KM = chunkDistMeters - nearest5KM;
    const isTransitionTunnel = nearest5KM >= 5000 && nearest5KM <= 45000 && distTo5KM >= -65 && distTo5KM < 65;

    // Famous State Monument right before entering the tunnel (-130m to -65m before the 5km milestone)
    const isPreTunnelMonument = nearest5KM >= 5000 && nearest5KM <= 45000 && distTo5KM >= -130 && distTo5KM < -65;

    if (isPreTunnelMonument) {
      const fromStateIdx = Math.round(nearest5KM / 5000);
      this.buildStateMonument(chunkGroup, chunkIndex, fromStateIdx);
    }

    if (isTransitionTunnel) {
      const fromStateIdx = Math.round(nearest5KM / 5000);
      const toStateIdx = fromStateIdx + 1;
      const isEntry = distTo5KM < 0;
      const isExit = distTo5KM >= 0;
      this.buildTunnelChunk(chunkGroup, chunkIndex, fromStateIdx, toStateIdx, isEntry, isExit);
    } else {
      if (biomeIndex === 1) {
        this.buildSuburbChunk(chunkGroup, chunkIndex);
      } else if (biomeIndex === 2) {
        this.buildDesertChunk(chunkGroup, chunkIndex);
      } else if (biomeIndex === 3) {
        this.buildSnowyChunk(chunkGroup, chunkIndex);
      } else if (biomeIndex === 4) {
        this.buildRainyChunk(chunkGroup, chunkIndex);
      } else if (biomeIndex === 5) {
        this.buildForestChunk(chunkGroup, chunkIndex);
      } else if (biomeIndex === 6) {
        this.buildAutumnChunk(chunkGroup, chunkIndex);
      } else if (biomeIndex === 7) {
        this.buildCityNightChunk(chunkGroup, chunkIndex);
      } else if (biomeIndex === 8) {
        this.buildMarineDriveChunk(chunkGroup, chunkIndex);
      } else if (biomeIndex === 9) {
        this.buildAmazonRainforestChunk(chunkGroup, chunkIndex);
      } else if (biomeIndex === 10) {
        this.buildTajMahalChunk(chunkGroup, chunkIndex);
      } else {
        this.buildFinishGarageChunk(chunkGroup, chunkIndex);
      }
    }

    // Roadside Gas & Refueling Station every 1 KM (1km, 2km, 3km, 4km, 6km, 7km...)
    const currentKM = Math.floor((chunkDistMeters + 35) / 1000);
    const isStationKM = currentKM > 0 && currentKM < 50 && (currentKM % 5 !== 0) && Math.abs((chunkDistMeters + 35) - currentKM * 1000) < 35;
    if (isStationKM && !isTransitionTunnel) {
      this.buildGasStation(chunkGroup, chunkIndex, currentKM);
    }

    // Enable soft shadows across chunk elements (Optimized for 60 FPS: foliage crowns & sky canopy do not cast shadows)
    chunkGroup.traverse(obj => {
      if (obj.isMesh) {
        obj.receiveShadow = true;
        const isFoliageOrSkyCanopy =
          obj.geometry === this.forestSkyRoofGeo1 ||
          obj.geometry === this.forestSkyRoofGeo2 ||
          obj.geometry === this.forestCrownGeo1 ||
          obj.geometry === this.forestCrownGeo2 ||
          obj.geometry === this.forestCrownGeo3 ||
          obj.material === this.forestDeepCanopyMat ||
          obj.material === this.forestRedwoodFoliageMat ||
          obj.material === this.forestCanopyMat;

        if (!obj.material?.isMeshBasicMaterial && !isFoliageOrSkyCanopy) {
          obj.castShadow = true;
        }
      }
    });

    this.scene.add(chunkGroup);

    return {
      index: chunkIndex,
      group: chunkGroup,
      zStart: chunkZStart,
      zEnd: chunkZStart + this.chunkLength
    };
  }

  buildBiomeGatewayArch(chunkGroup, biomeIndex, milestoneKM) {
    const group = new THREE.Group();
    const archH = 10.5;

    // Massive concrete/steel twin support pylons on road shoulders
    [-9.5, 9.5].forEach(px => {
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(1.6, archH, 2.2), this.gantrySteelMat);
      pylon.position.set(px, archH / 2, 8);
      group.add(pylon);

      // Gold milestone beacon topper
      const beacon = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), this.lampMat);
      beacon.position.set(px, archH + 0.6, 8);
      group.add(beacon);
    });

    // Massive overhead triumphal span beam across all 4 lanes
    const span = new THREE.Mesh(new THREE.BoxGeometry(20.6, 2.2, 2.4), this.gantrySteelMat);
    span.position.set(0, archH, 8);
    group.add(span);

    // High-visibility glowing LED billboard banner
    const ledScreen = new THREE.Mesh(new THREE.BoxGeometry(17.5, 1.8, 0.4), this.ledSignMat);
    ledScreen.position.set(0, archH, 9.25);
    group.add(ledScreen);

    // Glowing canvas sign text
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 128;
      const ctx = canvas.getContext ? canvas.getContext('2d') : null;
      if (ctx && typeof ctx.fillText === 'function') {
        ctx.fillStyle = '#0a101d';
        ctx.fillRect(0, 0, 1024, 128);
        ctx.fillStyle = '#ffd60a';
        ctx.font = '900 44px monospace';
        ctx.textAlign = 'center';
        const biomeNames = {
          1: 'MAP 01: SUBURB (PLAINS)',
          2: 'MAP 02: DESERT CANYONS',
          3: 'MAP 03: GLACIAL SNOWY TAIGA',
          4: 'MAP 04: STORMY RAIN HIGHWAY',
          5: 'MAP 05: REDWOOD CATHEDRAL FOREST',
          6: 'MAP 06: GOLDEN AUTUMN SUNSET',
          7: 'MAP 07: CITY NIGHT METROPOLIS',
          8: 'MAP 08: COASTAL MARINE DRIVE',
          9: 'MAP 09: AMAZON RAINFOREST',
          10: 'MAP 10: TAJ MAHAL',
          11: 'GRAND FINISH GARAGE'
        };
        const bName = biomeNames[biomeIndex] || `BIOME ${biomeIndex}`;
        ctx.fillText(`🏁 ${milestoneKM} KM REACHED • ENTERING ${bName} 🏁`, 512, 78);

        const tex = new THREE.CanvasTexture(canvas);
        const signScreen = new THREE.Mesh(new THREE.PlaneGeometry(17.2, 1.6), new THREE.MeshBasicMaterial({ map: tex }));
        signScreen.position.set(0, archH, 9.46);
        group.add(signScreen);
      }
    }

    chunkGroup.add(group);
  }

  // MAP 1: SUBURB (Minecraft Village & Rolling Hills)
  buildSuburbChunk(chunkGroup, chunkIndex) {
    const terrainWidth = 140;
    const groundGeo = new THREE.PlaneGeometry(terrainWidth, this.chunkLength);
    groundGeo.rotateX(-Math.PI / 2);

    [-1, 1].forEach(side => {
      const gMesh = new THREE.Mesh(groundGeo, this.suburbLawnMat);
      gMesh.position.set(side * (this.roadWidth / 2 + terrainWidth / 2), -0.05, this.chunkLength / 2);
      chunkGroup.add(gMesh);

      // Sidewalk
      const swGeo = new THREE.BoxGeometry(2.5, 0.2, this.chunkLength);
      const sw = new THREE.Mesh(swGeo, this.promenadeTileMat);
      sw.position.set(side * 9.5, 0.08, this.chunkLength / 2);
      chunkGroup.add(sw);

      // White picket fence
      for (let fz = 2; fz < this.chunkLength; fz += 4.5) {
        const fencePost = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.9, 0.15), this.suburbWhiteFenceMat);
        fencePost.position.set(side * 11.2, 0.45, fz);
        chunkGroup.add(fencePost);
        const fenceRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 4.5), this.suburbWhiteFenceMat);
        fenceRail.position.set(side * 11.2, 0.65, fz + 2.2);
        chunkGroup.add(fenceRail);
      }

      // Glowstone Streetlamps
      if (chunkIndex % 2 === 0) {
        const lamp = this.createMinecraftLamppost();
        lamp.position.set(side * 8.8, 0, 15);
        chunkGroup.add(lamp);
      }

      // Houses along the sidewalk
      const seedVal = chunkRandom(this.seed, side * 17, chunkIndex);
      const houseX = side * (19 + seedVal * 10);
      const wallMat = seedVal > 0.6 ? this.suburbHouseMat1 : (seedVal > 0.3 ? this.suburbHouseMat2 : this.suburbHouseMat3);
      const roofMat = seedVal > 0.5 ? this.suburbRoofMat : this.suburbRoofMatDark;

      // House main body
      const houseBody = new THREE.Mesh(new THREE.BoxGeometry(11, 6.5, 14), wallMat);
      houseBody.position.set(houseX, 3.25, this.chunkLength / 2);
      chunkGroup.add(houseBody);

      // House roof
      const roof = new THREE.Mesh(new THREE.BoxGeometry(12, 3.2, 15), roofMat);
      roof.position.set(houseX, 7.5, this.chunkLength / 2);
      chunkGroup.add(roof);

      // Chimney
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.0, 1.2), this.suburbRoofMatDark);
      chimney.position.set(houseX + (side > 0 ? -3 : 3), 9.0, this.chunkLength / 2 + 2);
      chunkGroup.add(chimney);

      // Front lawn oak trees
      const tree = this.createStandardVoxelTree(this.biomes[0]);
      tree.position.set(side * (13 + seedVal * 3), 0, 10 + seedVal * 35);
      chunkGroup.add(tree);

      // Front lawn 3D flower shrubs along sidewalk
      for (let sb = 0; sb < 2; sb++) {
        const bush = this.createRoadside3DBush(this.suburbLawnMat, this.lilyFlowerMat, 0.95);
        bush.position.set(side * 11.8, 0, 14 + sb * 25);
        chunkGroup.add(bush);
      }
    });

    // Stepped voxel Minecraft mountains & highway gantries
    this.buildMountains(chunkGroup, chunkIndex);
    this.buildLivelyStructures(chunkGroup, chunkIndex);
  }

  // MAP 2: DESERT (Minecraft Badlands & Cacti)
  buildDesertChunk(chunkGroup, chunkIndex) {
    const terrainWidth = 140;
    const groundGeo = new THREE.PlaneGeometry(terrainWidth, this.chunkLength);
    groundGeo.rotateX(-Math.PI / 2);

    [-1, 1].forEach(side => {
      const gMesh = new THREE.Mesh(groundGeo, this.desertSandMat);
      gMesh.position.set(side * (this.roadWidth / 2 + terrainWidth / 2), -0.05, this.chunkLength / 2);
      chunkGroup.add(gMesh);

      // Guardrails
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.75, this.chunkLength), this.guardrailMat);
      rail.position.set(side * 8.6, 0.7, this.chunkLength / 2);
      chunkGroup.add(rail);

      // Sandstone Mesas & Red Canyon Cliffs
      const seedVal = chunkRandom(this.seed, side * 31, chunkIndex);
      const mesaHeight = 22 + seedVal * 32;
      const mesaX = side * (42 + seedVal * 20);

      const mesaBase = new THREE.Mesh(new THREE.BoxGeometry(38, mesaHeight * 0.6, this.chunkLength + 2), this.desertRockMat);
      mesaBase.position.set(mesaX, mesaHeight * 0.3, this.chunkLength / 2);
      chunkGroup.add(mesaBase);

      const mesaCap = new THREE.Mesh(new THREE.BoxGeometry(26, mesaHeight * 0.4, this.chunkLength * 0.8), this.desertMesaMat);
      mesaCap.position.set(mesaX, mesaHeight * 0.6 + (mesaHeight * 0.2), this.chunkLength / 2);
      chunkGroup.add(mesaCap);

      // Saguaro Cacti along highway borders
      for (let c = 0; c < 3; c++) {
        const cactusZ = 8 + c * 20 + seedVal * 6;
        const cactusX = side * (11.5 + c * 3 + seedVal * 4);
        const cactus = this.createCactus();
        cactus.position.set(cactusX, 0, cactusZ);
        chunkGroup.add(cactus);
      }
    });

    this.buildMountains(chunkGroup, chunkIndex);
    this.buildLivelyStructures(chunkGroup, chunkIndex);
  }

  createCactus() {
    const group = new THREE.Group();
    const h = 4.5 + Math.random() * 2.5;
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.7, h, 0.7), this.cactusMat);
    trunk.position.y = h / 2;
    group.add(trunk);

    // Left Arm
    const armL1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 0.6), this.cactusMat);
    armL1.position.set(-0.8, h * 0.55, 0);
    group.add(armL1);
    const armL2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.0, 0.6), this.cactusMat);
    armL2.position.set(-1.4, h * 0.55 + 0.8, 0);
    group.add(armL2);

    // Right Arm
    const armR1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 0.6), this.cactusMat);
    armR1.position.set(0.8, h * 0.68, 0);
    group.add(armR1);
    const armR2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.0, 0.6), this.cactusMat);
    armR2.position.set(1.4, h * 0.68 + 0.8, 0);
    group.add(armR2);

    return group;
  }



  // MAP 3: SNOWY
  buildSnowyChunk(chunkGroup, chunkIndex) {
    const terrainWidth = 140;
    const groundGeo = new THREE.PlaneGeometry(terrainWidth, this.chunkLength);
    groundGeo.rotateX(-Math.PI / 2);

    [-1, 1].forEach(side => {
      const gMesh = new THREE.Mesh(groundGeo, this.snowGroundMat);
      gMesh.position.set(side * (this.roadWidth / 2 + terrainWidth / 2), -0.05, this.chunkLength / 2);
      chunkGroup.add(gMesh);

      // Frosted guardrails
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.75, this.chunkLength), this.snowLayerMat);
      rail.position.set(side * 8.6, 0.7, this.chunkLength / 2);
      chunkGroup.add(rail);

      // Glacial Snow Peaks
      const seedVal = chunkRandom(this.seed, side * 43, chunkIndex);
      const peakH = 34 + seedVal * 38;
      const peakX = side * (46 + seedVal * 22);

      const baseRock = new THREE.Mesh(new THREE.BoxGeometry(40, peakH * 0.65, this.chunkLength + 2), this.iceRockMat);
      baseRock.position.set(peakX, peakH * 0.32, this.chunkLength / 2);
      chunkGroup.add(baseRock);

      const snowCap = new THREE.Mesh(new THREE.BoxGeometry(28, peakH * 0.35 + 2, this.chunkLength * 0.9), this.snowLayerMat);
      snowCap.position.set(peakX, peakH * 0.65 + (peakH * 0.18), this.chunkLength / 2);
      chunkGroup.add(snowCap);

      // Snow-covered Taiga Pines
      for (let p = 0; p < 4; p++) {
        const treeZ = 6 + p * 15 + seedVal * 5;
        const treeX = side * (12 + p * 3.5);
        const snowTree = this.createSnowPineTree();
        snowTree.position.set(treeX, 0, treeZ);
        chunkGroup.add(snowTree);
      }
    });
  }

  createSnowPineTree() {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.0, 0.8), this.amazonTrunkMat);
    trunk.position.y = 2.0;
    group.add(trunk);

    const layers = [
      { w: 6.0, h: 2.8, y: 3.5 },
      { w: 4.6, h: 2.5, y: 5.8 },
      { w: 3.0, h: 2.2, y: 7.8 }
    ];

    layers.forEach(l => {
      // 3D Pine bough tier with 4 angled corner clusters
      const foliage = new THREE.Mesh(new THREE.BoxGeometry(l.w, l.h, l.w), this.snowPineMat);
      foliage.position.y = l.y;
      group.add(foliage);

      [-1, 1].forEach(cx => {
        [-1, 1].forEach(cz => {
          const cornerBough = new THREE.Mesh(new THREE.BoxGeometry(l.w * 0.42, l.h * 0.75, l.w * 0.42), this.snowPineMat);
          cornerBough.position.set(cx * l.w * 0.38, l.y - 0.2, cz * l.w * 0.38);
          cornerBough.rotation.y = 0.785;
          group.add(cornerBough);
        });
      });

      const snowCover = new THREE.Mesh(new THREE.BoxGeometry(l.w + 0.25, 0.65, l.w + 0.25), this.snowLayerMat);
      snowCover.position.y = l.y + l.h / 2;
      group.add(snowCover);
    });

    const tip = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 1.2), this.snowLayerMat);
    tip.position.y = 10.2;
    group.add(tip);

    return group;
  }



  // MAP 4: RAINY
  buildRainyChunk(chunkGroup, chunkIndex) {
    const terrainWidth = 140;
    const groundGeo = new THREE.PlaneGeometry(terrainWidth, this.chunkLength);
    groundGeo.rotateX(-Math.PI / 2);

    [-1, 1].forEach(side => {
      const gMesh = new THREE.Mesh(groundGeo, this.rainyGroundMat);
      gMesh.position.set(side * (this.roadWidth / 2 + terrainWidth / 2), -0.05, this.chunkLength / 2);
      chunkGroup.add(gMesh);

      // Guardrails
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.75, this.chunkLength), this.guardrailMat);
      rail.position.set(side * 8.6, 0.7, this.chunkLength / 2);
      chunkGroup.add(rail);

      // Puddle reflections alongside highway
      const puddle = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 12), this.rainyPuddleMat);
      puddle.rotateX(-Math.PI / 2);
      puddle.position.set(side * 10.5, 0.02, this.chunkLength * 0.4);
      chunkGroup.add(puddle);

      // Dark rainy spruce trees & foggy mountains
      const seedVal = chunkRandom(this.seed, side * 57, chunkIndex);
      for (let t = 0; t < 3; t++) {
        const tree = this.createGiantTree(this.biomes[1], chunkIndex, t * 23);
        tree.position.set(side * (13 + t * 4), 0, 10 + t * 20);
        chunkGroup.add(tree);
      }
    });

    this.buildMountains(chunkGroup, chunkIndex);
    this.buildLivelyStructures(chunkGroup, chunkIndex);
  }

  // MAP 5: ASSAM FOREST — Optimized Grand Canopy Cathedral (Silky 60 FPS, No Lag, 100% Sky Shielded)
  buildForestChunk(chunkGroup, chunkIndex) {
    const terrainWidth = 140;
    const groundGeo = new THREE.PlaneGeometry(terrainWidth, this.chunkLength);
    groundGeo.rotateX(-Math.PI / 2);

    [-1, 1].forEach(side => {
      // 1. Lush Moss Ground
      const gMesh = new THREE.Mesh(groundGeo, this.forestMossMat);
      gMesh.position.set(side * (this.roadWidth / 2 + terrainWidth / 2), -0.05, this.chunkLength / 2);
      chunkGroup.add(gMesh);

      // 2. Heavy Redwood Log Guardrail (Continuous beam + 3 posts)
      const rail = new THREE.Mesh(this.forestLogRailGeo, this.forestRedwoodTrunkMat);
      rail.position.set(side * 8.6, 0.45, this.chunkLength / 2);
      chunkGroup.add(rail);

      [8, 32, 56].forEach(pz => {
        const post = new THREE.Mesh(this.forestLogPostGeo, this.forestRedwoodTrunkMat);
        post.position.set(side * 8.6, 0.6, pz);
        chunkGroup.add(post);
      });

      // 3. Ancient Overarching Redwood Trees (Curving boughs meeting overhead)
      [16, 48].forEach(tz => {
        const archTree = this.createOptimizedOverarchingTree(side);
        archTree.position.set(side * 11.5, 0, tz);
        chunkGroup.add(archTree);
      });

      // 4. Background Deep Forest Giant Redwoods (X = 24m and X = 38m)
      [10, 42].forEach((tz, i) => {
        const bgTree = this.createOptimizedBackgroundTree(side, i);
        bgTree.position.set(side * (24 + i * 14), 0, tz);
        chunkGroup.add(bgTree);
      });

      // 5. Mossy Boulders alongside shoulder
      [14, 46].forEach((rz, ri) => {
        const rock = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 2.8), this.forestMossMat);
        rock.position.set(side * (10.2 + ri * 1.5), 0.7, rz);
        chunkGroup.add(rock);
      });

      // 6. Forest Streetlights (Assam) along both shoulders
      [18, 50].forEach(lz => {
        const streetlight = this.createForestStreetlight(side);
        streetlight.position.set(side * 9.2, 0, lz);
        chunkGroup.add(streetlight);
      });
    });

    // 7. Continuous Double-Layer High-Altitude Sky Canopy Roof (100% blocks sky, 2 draw calls, no lag)
    const roof1 = new THREE.Mesh(this.forestSkyRoofGeo1, this.forestDeepCanopyMat);
    roof1.position.set(0, 22.0, this.chunkLength / 2);
    chunkGroup.add(roof1);

    const roof2 = new THREE.Mesh(this.forestSkyRoofGeo2, this.forestRedwoodFoliageMat);
    roof2.position.set(0, 25.2, this.chunkLength / 2);
    chunkGroup.add(roof2);

    // Highway signs / structures (no mountains!)
    this.buildLivelyStructures(chunkGroup, chunkIndex);
  }

  createOptimizedOverarchingTree(side) {
    const group = new THREE.Group();
    // 1. Massive Trunk
    const trunk = new THREE.Mesh(this.forestTrunkGeo, this.forestRedwoodTrunkMat);
    trunk.position.y = 13.0;
    group.add(trunk);

    // 2. Overarching Bough Reaching Across Highway
    const bough = new THREE.Mesh(this.forestBoughGeo, this.forestRedwoodTrunkMat);
    bough.position.set(-side * 6.5, 18.0, 0);
    bough.rotation.y = side * Math.PI / 2;
    group.add(bough);

    // 3. Overhanging Foliage Canopy Crown over Highway
    const crown1 = new THREE.Mesh(this.forestCrownGeo1, this.forestRedwoodFoliageMat);
    crown1.position.set(-side * 7.5, 19.5, 0);
    group.add(crown1);

    // 4. Upper Foliage Crown
    const crown2 = new THREE.Mesh(this.forestCrownGeo2, this.forestDeepCanopyMat);
    crown2.position.set(-side * 5.5, 23.0, 0);
    group.add(crown2);

    // 5. Tree Top Crown
    const crown3 = new THREE.Mesh(this.forestCrownGeo3, this.forestCanopyMat);
    crown3.position.set(0, 26.5, 0);
    group.add(crown3);

    return group;
  }

  createOptimizedBackgroundTree(side, i) {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(this.forestTrunkGeo, this.forestRedwoodTrunkMat);
    trunk.position.y = 13.0;
    group.add(trunk);

    const crown1 = new THREE.Mesh(this.forestCrownGeo2, this.forestRedwoodFoliageMat);
    crown1.position.y = 18.0;
    group.add(crown1);

    const crown2 = new THREE.Mesh(this.forestCrownGeo3, this.forestDeepCanopyMat);
    crown2.position.y = 22.5;
    group.add(crown2);

    return group;
  }



  // MAP 6: AUTUMN
  buildAutumnChunk(chunkGroup, chunkIndex) {
    const terrainWidth = 140;
    const groundGeo = new THREE.PlaneGeometry(terrainWidth, this.chunkLength);
    groundGeo.rotateX(-Math.PI / 2);

    [-1, 1].forEach(side => {
      const gMesh = new THREE.Mesh(groundGeo, this.autumnGroundMat);
      gMesh.position.set(side * (this.roadWidth / 2 + terrainWidth / 2), -0.05, this.chunkLength / 2);
      chunkGroup.add(gMesh);

      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.75, this.chunkLength), this.guardrailMat);
      rail.position.set(side * 8.6, 0.7, this.chunkLength / 2);
      chunkGroup.add(rail);

      // Rustic wooden fence
      for (let fz = 2; fz < this.chunkLength; fz += 6) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.1, 0.2), this.fenceMat);
        post.position.set(side * 10.5, 0.55, fz);
        chunkGroup.add(post);
      }

      // Colorful Autumn Canopy Trees
      const seedVal = chunkRandom(this.seed, side * 67, chunkIndex);
      for (let t = 0; t < 3; t++) {
        const tree = this.createAutumnTree(t);
        tree.position.set(side * (13 + t * 4 + seedVal * 2), 0, 10 + t * 20);
        chunkGroup.add(tree);
      }
    });

    this.buildMountains(chunkGroup, chunkIndex);
    this.buildLivelyStructures(chunkGroup, chunkIndex);
  }

  createAutumnTree(index) {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.0, 7.0, 1.0), this.autumnTrunkMat);
    trunk.position.y = 3.5;
    group.add(trunk);

    const foliageColors = [
      { base: this.autumnOrangeMat, high: this.autumnGoldMat },
      { base: this.autumnGoldMat, high: this.autumnOrangeMat },
      { base: this.autumnRedMat, high: this.autumnOrangeMat }
    ];
    const pair = foliageColors[index % foliageColors.length];

    const canopy = this.create3DVolumetricLeaves(8.0, 6.2, 8.0, pair.base, pair.high);
    canopy.position.y = 5.6;
    group.add(canopy);

    return group;
  }



  // MAP 7: MAHARASHTRA / NIGHT CITY (Lively Urban Metropolis)
  buildCityNightChunk(chunkGroup, chunkIndex) {
    const terrainWidth = 140;
    const groundGeo = new THREE.PlaneGeometry(terrainWidth, this.chunkLength);
    groundGeo.rotateX(-Math.PI / 2);

    [-1, 1].forEach(side => {
      // 1. Base dark asphalt ground
      const gMesh = new THREE.Mesh(groundGeo, this.cityGroundMat);
      gMesh.position.set(side * (this.roadWidth / 2 + terrainWidth / 2), -0.05, this.chunkLength / 2);
      chunkGroup.add(gMesh);

      // 2. Elevated Highway Guardrail with warning reflectors
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.95, this.chunkLength), this.guardrailMat);
      rail.position.set(side * 8.6, 0.48, this.chunkLength / 2);
      chunkGroup.add(rail);

      // 3. Double-Headed Highway Streetlights every chunk
      const lamp = this.createMarineDriveLamppost();
      lamp.position.set(side * 9.2, 0, this.chunkLength / 2);
      chunkGroup.add(lamp);

      // 4. Elevated Granite Footpaths / Sidewalks along both sides of highway
      const sidewalkW = 5.2;
      const sidewalkX = side * (9.0 + sidewalkW / 2);
      const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(sidewalkW, 0.28, this.chunkLength), this.cityFootpathMat);
      sidewalk.position.set(sidewalkX, 0.14, this.chunkLength / 2);
      chunkGroup.add(sidewalk);

      // Safety Curb line with glowing yellow hazard striping
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, this.chunkLength), this.cityCurbMat);
      curb.position.set(side * 8.9, 0.16, this.chunkLength / 2);
      chunkGroup.add(curb);

      // 5. People / Citizens roaming along the footpaths
      this.populateFootpathPedestrians(chunkGroup, sidewalkX, chunkIndex);

      // 6. Ground-Floor Lively Establishments: Cafes, Restaurants, or Roadside Parks
      const slotType = Math.abs((chunkIndex * 7 + (side > 0 ? 3 : 5)) % 4);

      if (slotType === 0) {
        // Vibrant Roadside Cafe with striped awning, outdoor tables, umbrellas, and patrons
        this.createCityCafe(chunkGroup, side, 20);
        this.createCitySkyscraper(chunkGroup, side, 48, chunkRandom(this.seed, side * 73, chunkIndex), chunkIndex);
      } else if (slotType === 1) {
        // High-end City Restaurant & Diner with neon signs and glass facade
        this.createCityRestaurant(chunkGroup, side, 18);
        this.createCitySkyscraper(chunkGroup, side, 46, chunkRandom(this.seed, side * 77, chunkIndex), chunkIndex);
      } else if (slotType === 2) {
        // Roadside Municipal Park with emerald lawn, illuminated fountain, benches, and cherry trees
        this.createCityPark(chunkGroup, side, this.chunkLength / 2);
      } else {
        // Dual Majestic Skyscrapers with illuminated corporate lobbies
        this.createCitySkyscraper(chunkGroup, side, 16, chunkRandom(this.seed, side * 83, chunkIndex), chunkIndex);
        this.createCitySkyscraper(chunkGroup, side, 48, chunkRandom(this.seed, side * 89, chunkIndex), chunkIndex);
      }
    });

    // Overhead highway LED gantry every 4 chunks
    this.buildLivelyStructures(chunkGroup, chunkIndex);
  }

  populateFootpathPedestrians(chunkGroup, sidewalkX, chunkIndex) {
    const clothMats = [this.citizenClothMat1, this.citizenClothMat2, this.citizenClothMat3, this.citizenClothMat4];
    const skinMats = [this.citizenSkinMat1, this.citizenSkinMat2];

    const numPeople = 3 + Math.floor(chunkRandom(this.seed, sidewalkX, chunkIndex) * 3);
    for (let p = 0; p < numPeople; p++) {
      const zOffset = 6 + p * 16 + chunkRandom(this.seed, p * 13, chunkIndex) * 8;
      const xJitter = (chunkRandom(this.seed, p * 23, chunkIndex) - 0.5) * 2.2;
      const rotY = chunkRandom(this.seed, p * 31, chunkIndex) > 0.5 ? 0 : Math.PI;
      const cloth = clothMats[p % clothMats.length];
      const skin = skinMats[p % skinMats.length];

      this.createPedestrian(chunkGroup, sidewalkX + xJitter, 0.28, zOffset, rotY, cloth, skin);
    }
  }

  createPedestrian(group, x, y, z, rotY, clothMat, skinMat) {
    const ped = new THREE.Group();
    ped.position.set(x, y, z);
    ped.rotation.y = rotY;

    // Legs
    const legGeo = new THREE.BoxGeometry(0.16, 0.65, 0.18);
    const legL = new THREE.Mesh(legGeo, this.citizenDarkMat);
    legL.position.set(-0.11, 0.32, 0);
    ped.add(legL);

    const legR = new THREE.Mesh(legGeo, this.citizenDarkMat);
    legR.position.set(0.11, 0.32, 0);
    ped.add(legR);

    // Torso / Jacket
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.65, 0.28), clothMat);
    torso.position.set(0, 0.95, 0);
    ped.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.28), skinMat);
    head.position.set(0, 1.42, 0);
    ped.add(head);

    group.add(ped);
  }

  createCityCafe(chunkGroup, side, zCenter) {
    const cafeX = side * 18.5;
    const cafeGroup = new THREE.Group();
    cafeGroup.position.set(cafeX, 0, zCenter);

    // 1. Cafe Main Shopfront (Warm interior glow)
    const facade = new THREE.Mesh(new THREE.BoxGeometry(11.0, 4.2, 8.5), this.cityBuildingDarkMat);
    facade.position.set(side * 2.0, 2.1, 0);
    cafeGroup.add(facade);

    // Glowing storefront glass window
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 7.5), this.cafeWarmGlowMat);
    glass.position.set(side * (-3.4), 1.8, 0);
    cafeGroup.add(glass);

    // 2. Striped Patio Awning (Red & White)
    const awningL = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 8.2), this.cafeAwningRedMat);
    awningL.position.set(side * (-4.2), 3.2, 0);
    awningL.rotation.z = side * 0.22;
    cafeGroup.add(awningL);

    // 3. Cafe Neon Signboard: "☕ CAFE MUMBAI"
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 4.8), this.cityNeonPinkMat);
    sign.position.set(side * (-3.5), 3.8, 0);
    cafeGroup.add(sign);

    // 4. Outdoor Terrace Tables with Parasol Umbrellas
    [-2.2, 2.2].forEach(tz => {
      const tableX = side * (-5.2);
      // Table
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.08, 12), this.cafeWoodMat);
      table.position.set(tableX, 0.85, tz);
      cafeGroup.add(table);

      const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.85, 6), this.stationTotemMat);
      tableLeg.position.set(tableX, 0.42, tz);
      cafeGroup.add(tableLeg);

      // Colorful Parasol Umbrella
      const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.5, 10), this.cafeParasolMat);
      umbrella.position.set(tableX, 2.1, tz);
      cafeGroup.add(umbrella);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.1, 6), this.stationTotemMat);
      pole.position.set(tableX, 1.05, tz);
      cafeGroup.add(pole);

      // Citizen sitting at cafe
      this.createPedestrian(cafeGroup, tableX + side * 0.8, 0, tz + 0.4, side > 0 ? -Math.PI / 2 : Math.PI / 2, this.citizenClothMat2, this.citizenSkinMat1);
    });

    chunkGroup.add(cafeGroup);
  }

  createCityRestaurant(chunkGroup, side, zCenter) {
    const restX = side * 19.5;
    const restGroup = new THREE.Group();
    restGroup.position.set(restX, 0, zCenter);

    // Restaurant Two-Floor Facade
    const body = new THREE.Mesh(new THREE.BoxGeometry(13.0, 5.8, 10.5), this.cityBuildingMat);
    body.position.set(side * 2.5, 2.9, 0);
    restGroup.add(body);

    // Front panoramic glowing dining windows
    const win1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 9.0), this.cityWindowYellow);
    win1.position.set(side * (-3.9), 1.6, 0);
    restGroup.add(win1);

    const win2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 9.0), this.cityWindowCyan);
    win2.position.set(side * (-3.9), 4.2, 0);
    restGroup.add(win2);

    // Vibrant Restaurant Neon Sign: "🍽️ BISTRO 24/7"
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.0, 6.2), this.cityNeonOrangeMat);
    sign.position.set(side * (-4.1), 5.4, 0);
    restGroup.add(sign);

    // Outdoor planter boxes with flowering shrubs
    [-3.8, 3.8].forEach(pz => {
      const planter = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 2.4), this.cityFootpathMat);
      planter.position.set(side * (-5.2), 0.35, pz);
      restGroup.add(planter);

      const bush = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 2.2), this.tajLawnMat);
      bush.position.set(side * (-5.2), 0.9, pz);
      restGroup.add(bush);
    });

    chunkGroup.add(restGroup);
  }

  createCityPark(chunkGroup, side, zCenter) {
    const parkX = side * 22.0;
    const parkGroup = new THREE.Group();
    parkGroup.position.set(parkX, 0, zCenter);

    // 1. Lush Green Park Lawn
    const lawn = new THREE.Mesh(new THREE.BoxGeometry(22.0, 0.15, 42.0), this.parkGrassMat);
    lawn.position.set(0, 0.08, 0);
    parkGroup.add(lawn);

    // 2. Cobblestone Strolling Path
    const path = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 42.0), this.parkPathMat);
    path.position.set(side * (-4.0), 0.1, 0);
    parkGroup.add(path);

    // 3. Central Illuminated Water Fountain
    const fountainRing = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.0, 0.8, 16), this.parkFountainMat);
    fountainRing.position.set(side * 2.0, 0.4, 0);
    parkGroup.add(fountainRing);

    const waterSurface = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 0.1, 16), this.parkWaterMat);
    waterSurface.position.set(side * 2.0, 0.72, 0);
    parkGroup.add(waterSurface);

    const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 2.4, 8), this.parkWaterMat);
    jet.position.set(side * 2.0, 1.8, 0);
    parkGroup.add(jet);

    // 4. Park Benches with Citizens
    [-8.0, 8.0].forEach(bz => {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 2.2), this.parkPathMat);
      bench.position.set(side * (-2.0), 0.35, bz);
      parkGroup.add(bench);

      // Citizen relaxing in park
      this.createPedestrian(parkGroup, side * (-2.0), 0.4, bz, side > 0 ? -Math.PI / 2 : Math.PI / 2, this.citizenClothMat3, this.citizenSkinMat2);

      // Cherry Blossom Tree beside bench
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 4.5, 6), this.tajTrunkMat);
      trunk.position.set(side * 6.5, 2.25, bz);
      parkGroup.add(trunk);

      const foliage = new THREE.Mesh(new THREE.SphereGeometry(2.4, 8, 8), this.parkCherryMat);
      foliage.position.set(side * 6.5, 5.2, bz);
      parkGroup.add(foliage);
    });

    chunkGroup.add(parkGroup);
  }

  createCitySkyscraper(chunkGroup, side, zOffset, seedVal, chunkIndex) {
    const bldgW = 22 + seedVal * 12;
    const bldgD = 24 + seedVal * 12;
    const bldgH = 65 + seedVal * 55; // 65m to 120m tall!
    const bldgX = side * (32 + bldgW / 2);

    const skyGroup = new THREE.Group();
    skyGroup.position.set(bldgX, 0, zOffset);

    // Base Skyscraper Body
    const buildingBody = new THREE.Mesh(new THREE.BoxGeometry(bldgW, bldgH, bldgD), this.cityBuildingMat);
    buildingBody.position.set(0, bldgH / 2, 0);
    skyGroup.add(buildingBody);

    // Window Grid Bands
    const winMat = seedVal > 0.6 ? this.cityWindowCyan : (seedVal > 0.3 ? this.cityWindowYellow : this.cityWindowPink);
    for (let floor = 8; floor < bldgH - 6; floor += 5.5) {
      const winBand = new THREE.Mesh(new THREE.BoxGeometry(bldgW + 0.15, 2.2, bldgD * 0.8), winMat);
      winBand.position.set(0, floor, 0);
      skyGroup.add(winBand);
    }

    // Penthouse Stepped Setback Tier
    const tierH = 14.0;
    const tierW = bldgW * 0.65;
    const tierD = bldgD * 0.65;
    const penthouse = new THREE.Mesh(new THREE.BoxGeometry(tierW, tierH, tierD), this.cityBuildingDarkMat);
    penthouse.position.set(0, bldgH + tierH / 2, 0);
    skyGroup.add(penthouse);

    // Rooftop Communications Antenna Mast with Red Beacon
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.4, 18.0, 6), this.stationTotemMat);
    mast.position.set(0, bldgH + tierH + 9.0, 0);
    skyGroup.add(mast);

    const redBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6, 6), this.stationNitroGlowMat);
    redBeacon.position.set(0, bldgH + tierH + 18.2, 0);
    skyGroup.add(redBeacon);

    // High-Rise Neon Billboard atop building
    if (chunkIndex % 2 === 0) {
      const neonTitles = [this.cityNeonPinkMat, this.cityNeonSign, this.cityNeonGreenMat];
      const signMat = neonTitles[chunkIndex % neonTitles.length];
      const billboard = new THREE.Mesh(new THREE.BoxGeometry(16, 4.2, 0.8), signMat);
      billboard.position.set(0, bldgH + tierH + 3.0, 0);
      skyGroup.add(billboard);
    }

    chunkGroup.add(skyGroup);
  }

  // =========================================================================
  // FAMOUS STATE MONUMENTS BEFORE INTERSTATE TUNNELS (States 1 to 9)
  // =========================================================================
  buildStateMonument(chunkGroup, chunkIndex, stateIdx) {
    const side = 1; // Display prominently on the right-hand vista plaza
    const plazaX = side * 34.0;
    const zCenter = this.chunkLength / 2;
    const mGroup = new THREE.Group();
    mGroup.position.set(plazaX, 0, zCenter);

    if (stateIdx === 1) {
      // PUNJAB: SRI HARMANDIR SAHIB (GOLDEN TEMPLE)
      // Sacred Amrit Sarovar Reflecting Pool
      const pool = new THREE.Mesh(new THREE.BoxGeometry(32.0, 0.4, 32.0), this.tajPoolWaterMat);
      pool.position.set(0, 0.2, 0);
      mGroup.add(pool);

      // Marble Parikrama Promenade
      const walkway = new THREE.Mesh(new THREE.BoxGeometry(36.0, 0.5, 36.0), this.tajMarbleMat);
      walkway.position.set(0, 0.15, 0);
      mGroup.add(walkway);

      // Central Golden Temple Sanctum
      const lowerSanctum = new THREE.Mesh(new THREE.BoxGeometry(12.0, 5.0, 12.0), this.tajMarbleTrimMat);
      lowerSanctum.position.set(0, 2.7, 0);
      mGroup.add(lowerSanctum);

      // Gilded Upper Sanctuary
      const upperGold = new THREE.Mesh(new THREE.BoxGeometry(10.0, 4.0, 10.0), this.monumentGoldMat);
      upperGold.position.set(0, 7.2, 0);
      mGroup.add(upperGold);

      // Radiant Golden Ribbed Dome & Kalash Pinnacle
      const dome = new THREE.Mesh(new THREE.SphereGeometry(3.8, 16, 12), this.monumentGoldMat);
      dome.position.set(0, 11.2, 0);
      mGroup.add(dome);

      const kalash = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2.6, 8), this.monumentGoldMat);
      kalash.position.set(0, 14.8, 0);
      mGroup.add(kalash);

      this.createMonumentSignMesh(mGroup, '🏛️ PUNJAB STATE MONUMENT', 'SRI HARMANDIR SAHIB (GOLDEN TEMPLE)', -18.0, 8.5, 0);

    } else if (stateIdx === 2) {
      // RAJASTHAN: HAWA MAHAL (PALACE OF WINDS)
      // Grand 5-tier Pyramidal Honeycomb Sandstone Facade
      const tiers = [
        { w: 32.0, h: 5.5, d: 5.0, y: 2.75 },
        { w: 26.0, h: 5.0, d: 4.5, y: 7.75 },
        { w: 20.0, h: 4.5, d: 4.0, y: 12.5 },
        { w: 14.0, h: 4.0, d: 3.5, y: 16.75 },
        { w: 8.0,  h: 3.5, d: 3.0, y: 20.5 }
      ];

      tiers.forEach((t, ti) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), this.monumentJaipurPinkMat);
        wall.position.set(0, t.y, 0);
        mGroup.add(wall);

        // Projecting Ornate Jharokha Balconies
        const numJharokhas = Math.floor(t.w / 4.2);
        for (let j = 0; j < numJharokhas; j++) {
          const jx = -t.w / 2 + 2.1 + j * 4.2;
          const jharokha = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 1.2), this.tajMarbleMat);
          jharokha.position.set(jx, t.y, -t.d / 2 - 0.5);
          mGroup.add(jharokha);
        }
      });

      this.createMonumentSignMesh(mGroup, '🏛️ RAJASTHAN STATE MONUMENT', 'HAWA MAHAL (PALACE OF WINDS)', -18.0, 8.5, 0);

    } else if (stateIdx === 3) {
      // HIMACHAL PRADESH: HADIMBA PAGODA TEMPLE
      // 4-Tier Wooden Pagoda Roofed Temple
      const baseSanctum = new THREE.Mesh(new THREE.BoxGeometry(14.0, 4.5, 14.0), this.monumentPagodaWoodMat);
      baseSanctum.position.set(0, 2.25, 0);
      mGroup.add(baseSanctum);

      const roofs = [
        { w: 18.0, y: 5.0 },
        { w: 13.0, y: 8.5 },
        { w: 8.5,  y: 11.5 },
        { w: 4.5,  y: 14.0 }
      ];

      roofs.forEach(rf => {
        const roof = new THREE.Mesh(new THREE.ConeGeometry(rf.w * 0.75, 2.4, 4), this.monumentBrassRoofMat);
        roof.position.set(0, rf.y, 0);
        roof.rotation.y = Math.PI / 4;
        mGroup.add(roof);
      });

      // Brass Kalash Spike
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.2, 6), this.monumentGoldMat);
      spike.position.set(0, 16.2, 0);
      mGroup.add(spike);

      // Surrounding Deodar Cedars
      [-12, 12].forEach(tx => {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 12, 6), this.tajTrunkMat);
        trunk.position.set(tx, 6, 6);
        mGroup.add(trunk);
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(3.5, 10, 6), this.forestDeepCanopyMat);
        leaves.position.set(tx, 14, 6);
        mGroup.add(leaves);
      });

      this.createMonumentSignMesh(mGroup, '🏛️ HIMACHAL STATE MONUMENT', 'HADIMBA PAGODA TEMPLE (MANALI)', -18.0, 8.5, 0);

    } else if (stateIdx === 4) {
      // MEGHALAYA: DOUBLE-DECKER LIVING ROOT BRIDGE
      // Deep River Gorge Plinth
      const gorgeL = new THREE.Mesh(new THREE.BoxGeometry(8.0, 6.0, 32.0), this.forestMossMat);
      gorgeL.position.set(-10, 3.0, 0);
      mGroup.add(gorgeL);

      const gorgeR = new THREE.Mesh(new THREE.BoxGeometry(8.0, 6.0, 32.0), this.forestMossMat);
      gorgeR.position.set(10, 3.0, 0);
      mGroup.add(gorgeR);

      // Lower Living Root Span
      const lowerBridge = new THREE.Mesh(new THREE.BoxGeometry(16.0, 1.2, 3.2), this.monumentRootMat);
      lowerBridge.position.set(0, 5.0, -4.0);
      mGroup.add(lowerBridge);

      // Upper Living Root Span (Double Decker!)
      const upperBridge = new THREE.Mesh(new THREE.BoxGeometry(18.0, 1.2, 3.2), this.monumentRootMat);
      upperBridge.position.set(0, 9.5, 4.0);
      mGroup.add(upperBridge);

      // Ancient Ficus Rubber Tree Anchor Trunks
      [-9, 9].forEach(bx => {
        const ficus = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 14, 8), this.monumentRootMat);
        ficus.position.set(bx, 7, 0);
        mGroup.add(ficus);

        const canopy = new THREE.Mesh(new THREE.SphereGeometry(6.5, 8, 8), this.forestCanopyMat);
        canopy.position.set(bx, 15, 0);
        mGroup.add(canopy);
      });

      this.createMonumentSignMesh(mGroup, '🏛️ MEGHALAYA STATE MONUMENT', 'DOUBLE-DECKER LIVING ROOT BRIDGE', -18.0, 8.5, 0);

    } else if (stateIdx === 5) {
      // ASSAM: KAZIRANGA GREAT ONE-HORNED RHINOCEROS MONUMENT
      // Colossal Sculpted Rhino Plinth
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(18.0, 3.2, 24.0), this.cityBuildingMat);
      plinth.position.set(0, 1.6, 0);
      mGroup.add(plinth);

      // Great One-Horned Rhinoceros (Monumental Bronze & Granite Statue)
      const rhinoBody = new THREE.Mesh(new THREE.BoxGeometry(6.5, 4.5, 11.0), this.monumentBronzeMat);
      rhinoBody.position.set(0, 6.2, 0);
      mGroup.add(rhinoBody);

      const rhinoHead = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.2, 4.5), this.monumentBronzeMat);
      rhinoHead.position.set(0, 6.8, -6.5);
      mGroup.add(rhinoHead);

      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.65, 2.4, 8), this.stationTotemMat);
      horn.position.set(0, 8.8, -7.5);
      horn.rotation.x = -0.35;
      mGroup.add(horn);

      // Kamakhya Temple Shikhara Dome beside it
      const shikhara = new THREE.Mesh(new THREE.ConeGeometry(5.2, 12.0, 12), this.monumentLateriteMat);
      shikhara.position.set(-9.0, 6.0, 6.0);
      mGroup.add(shikhara);

      this.createMonumentSignMesh(mGroup, '🏛️ ASSAM STATE MONUMENT', 'KAZIRANGA RHINOCEROS MONUMENT', -18.0, 8.5, 0);

    } else if (stateIdx === 6) {
      // KASHMIR: PARI MAHAL (PALACE OF FAIRIES)
      // Terraced Mughal Garden Arcades
      const terrace1 = new THREE.Mesh(new THREE.BoxGeometry(26.0, 4.0, 14.0), this.monumentBasaltMat);
      terrace1.position.set(0, 2.0, 6.0);
      mGroup.add(terrace1);

      const terrace2 = new THREE.Mesh(new THREE.BoxGeometry(20.0, 4.5, 12.0), this.monumentBasaltMat);
      terrace2.position.set(0, 6.25, -4.0);
      mGroup.add(terrace2);

      // Arched Pavilion Gallery
      for (let a = -2; a <= 2; a++) {
        const arch = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 1.5), this.tajMarbleMat);
        arch.position.set(a * 3.8, 4.8, 12.0);
        mGroup.add(arch);
      }

      // Golden Chinar Trees in Autumn Glory
      [-11, 11].forEach(cx => {
        const chinar = new THREE.Mesh(new THREE.SphereGeometry(3.5, 8, 8), this.autumnGoldMat);
        chinar.position.set(cx, 7.5, 0);
        mGroup.add(chinar);
      });

      this.createMonumentSignMesh(mGroup, '🏛️ KASHMIR STATE MONUMENT', 'PARI MAHAL (PALACE OF FAIRIES)', -18.0, 8.5, 0);

    } else if (stateIdx === 7) {
      // MAHARASHTRA: GATEWAY OF INDIA
      // Grand Yellow Basalt Triumphal Arch
      const archBase = new THREE.Mesh(new THREE.BoxGeometry(24.0, 2.0, 12.0), this.monumentBasaltMat);
      archBase.position.set(0, 1.0, 0);
      mGroup.add(archBase);

      // Left and Right Arch Pillars
      const pillarL = new THREE.Mesh(new THREE.BoxGeometry(7.0, 14.0, 10.0), this.monumentBasaltMat);
      pillarL.position.set(-6.5, 8.0, 0);
      mGroup.add(pillarL);

      const pillarR = new THREE.Mesh(new THREE.BoxGeometry(7.0, 14.0, 10.0), this.monumentBasaltMat);
      pillarR.position.set(6.5, 8.0, 0);
      mGroup.add(pillarR);

      // Central Roman-Saracenic Arch Span
      const archSpan = new THREE.Mesh(new THREE.BoxGeometry(24.0, 5.0, 10.0), this.monumentBasaltMat);
      archSpan.position.set(0, 16.5, 0);
      mGroup.add(archSpan);

      // 4 Corner Turret Minarets with Domes
      [[-10.5, -4.5], [10.5, -4.5], [-10.5, 4.5], [10.5, 4.5]].forEach(([tx, tz]) => {
        const turret = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 7.0, 8), this.monumentBasaltMat);
        turret.position.set(tx, 20.0, tz);
        mGroup.add(turret);

        const dome = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 8), this.monumentBasaltMat);
        dome.position.set(tx, 24.0, tz);
        mGroup.add(dome);
      });

      this.createMonumentSignMesh(mGroup, '🏛️ MAHARASHTRA STATE MONUMENT', 'GATEWAY OF INDIA (MUMBAI)', -18.0, 8.5, 0);

    } else if (stateIdx === 8) {
      // GOA: BASILICA OF BOM JESUS
      // 3-Tiered Baroque Red Laterite Cathedral Facade
      const bTier1 = new THREE.Mesh(new THREE.BoxGeometry(22.0, 6.0, 10.0), this.monumentLateriteMat);
      bTier1.position.set(0, 3.0, 0);
      mGroup.add(bTier1);

      const bTier2 = new THREE.Mesh(new THREE.BoxGeometry(17.0, 5.5, 9.0), this.monumentLateriteMat);
      bTier2.position.set(0, 8.75, 0);
      mGroup.add(bTier2);

      const bTier3 = new THREE.Mesh(new THREE.BoxGeometry(12.0, 4.5, 8.0), this.monumentLateriteMat);
      bTier3.position.set(0, 13.75, 0);
      mGroup.add(bTier3);

      // Triangular Pediment with Cross
      const pediment = new THREE.Mesh(new THREE.ConeGeometry(7.0, 3.5, 4), this.monumentLateriteMat);
      pediment.position.set(0, 17.5, 0);
      pediment.rotation.y = Math.PI / 4;
      mGroup.add(pediment);

      const cross = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.8, 0.4), this.tajMarbleMat);
      cross.position.set(0, 20.2, 0);
      mGroup.add(cross);

      // Flanking Bell Tower
      const bellTower = new THREE.Mesh(new THREE.BoxGeometry(5.5, 18.0, 5.5), this.monumentLateriteMat);
      bellTower.position.set(13.0, 9.0, 0);
      mGroup.add(bellTower);

      this.createMonumentSignMesh(mGroup, '🏛️ GOA STATE MONUMENT', 'BASILICA OF BOM JESUS', -18.0, 8.5, 0);

    } else if (stateIdx === 9) {
      // KERALA: CHINESE FISHING NETS & FORT KOCHI LIGHTHOUSE
      // Coastal Water Lagoon
      const lagoon = new THREE.Mesh(new THREE.BoxGeometry(26.0, 0.4, 32.0), this.tajPoolWaterMat);
      lagoon.position.set(0, 0.2, 0);
      mGroup.add(lagoon);

      // Giant Cantilevered Bamboo Fishing Net Frame
      const netPole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 14.0, 6), this.monumentBambooMat);
      netPole1.position.set(0, 6.0, 2.0);
      netPole1.rotation.z = -0.55;
      mGroup.add(netPole1);

      const netPole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 14.0, 6), this.monumentBambooMat);
      netPole2.position.set(0, 6.0, -2.0);
      netPole2.rotation.z = -0.55;
      mGroup.add(netPole2);

      // Webbed Fishing Net Mesh
      const netMesh = new THREE.Mesh(new THREE.PlaneGeometry(10.0, 10.0), this.tunnelTileMat);
      netMesh.position.set(-6.0, 2.8, 0);
      netMesh.rotation.x = Math.PI / 2;
      mGroup.add(netMesh);

      // Fort Kochi Coastal Lighthouse (Red & White Banded)
      const lighthouse = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.6, 20.0, 10), this.garageDoorMat);
      lighthouse.position.set(10.0, 10.0, 0);
      mGroup.add(lighthouse);

      const lightLantern = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 2.5, 10), this.tunnelCyanLightMat);
      lightLantern.position.set(10.0, 21.0, 0);
      mGroup.add(lightLantern);

      this.createMonumentSignMesh(mGroup, '🏛️ KERALA STATE MONUMENT', 'CHINESE FISHING NETS & LIGHTHOUSE', -18.0, 8.5, 0);
    }

    chunkGroup.add(mGroup);
  }

  createMonumentSignMesh(group, title, subtitle, x, y, z) {
    if (typeof document === 'undefined') return;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 384;
    const ctx = canvas.getContext ? canvas.getContext('2d') : null;
    if (ctx && typeof ctx.fillText === 'function') {
      ctx.fillStyle = '#0a101d';
      ctx.fillRect(0, 0, 1024, 384);

      // Cyan / Gold accent border
      ctx.strokeStyle = '#ffd200';
      ctx.lineWidth = 12;
      if (ctx.strokeRect) ctx.strokeRect(6, 6, 1012, 372);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '900 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, 512, 110);

      ctx.fillStyle = '#ffd200';
      ctx.font = '900 48px sans-serif';
      ctx.fillText(subtitle, 512, 230);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 32px sans-serif';
      ctx.fillText('🔻 PREPARE TO ENTER INTERSTATE TUNNEL 🔻', 512, 320);

      const tex = new THREE.CanvasTexture(canvas);
      const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(12.0, 4.5), new THREE.MeshBasicMaterial({ map: tex }));
      signMesh.position.set(x, y, z);
      signMesh.rotation.y = -Math.PI / 2; // Facing the highway
      group.add(signMesh);
    }
  }

  buildMountains(chunkGroup, chunkIndex) {
    // Generate mountain peaks on both sides (X = -45 to -95, and X = 45 to 95)
    [-1, 1].forEach(side => {
      const seedVal = chunkRandom(this.seed, side * 19, chunkIndex);
      // Mountain height varies between 32m and 68m!
      const baseHeight = 28 + seedVal * 36;
      const xCenter = side * (48 + seedVal * 24);

      // 3-tiered stepped mountain pyramid blocks
      const tiers = [
        { w: 42, d: this.chunkLength + 2, h: baseHeight * 0.45, mat: this.mountainRockMat, y: 0 },
        { w: 28, d: this.chunkLength * 0.85, h: baseHeight * 0.75, mat: this.mountainSlateMat, y: baseHeight * 0.45 },
        { w: 16, d: this.chunkLength * 0.65, h: baseHeight, mat: this.snowCapMat, y: baseHeight * 0.75 }
      ];

      tiers.forEach(tier => {
        const tierH = tier.h - tier.y;
        const box = new THREE.Mesh(new THREE.BoxGeometry(tier.w, tierH, tier.d), tier.mat);
        box.position.set(xCenter, tier.y + tierH / 2, this.chunkLength / 2);
        chunkGroup.add(box);
      });

      // Spawn Wind Turbine on mountain ridges every 4 chunks
      if (chunkIndex % 4 === 0 && seedVal > 0.4) {
        const turbine = this.createWindTurbine();
        turbine.position.set(xCenter + (side > 0 ? -6 : 6), baseHeight * 0.45 + 0.1, this.chunkLength / 2);
        chunkGroup.add(turbine);
      }
    });
  }

  createWindTurbine() {
    const group = new THREE.Group();
    // Tower
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 28, 8), this.turbineWhiteMat);
    tower.position.y = 14;
    group.add(tower);

    // Nacelle
    const nacelle = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 4.2), this.turbineWhiteMat);
    nacelle.position.set(0, 28, 0);
    group.add(nacelle);

    // 3 Rotor Blades (animated)
    const rotorGroup = new THREE.Group();
    rotorGroup.position.set(0, 28, 2.2);

    for (let b = 0; b < 3; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.6, 12, 0.15), this.turbineWhiteMat);
      blade.position.y = 6;
      const bladeArm = new THREE.Group();
      bladeArm.rotation.z = (b * Math.PI * 2) / 3;
      bladeArm.add(blade);
      rotorGroup.add(bladeArm);
    }

    group.add(rotorGroup);
    this.animatedObjects.push({ obj: rotorGroup, speed: 1.2 + Math.random() * 0.8 });
    return group;
  }



  populateLargeTreesAndNature(chunkGroup, chunkIndex, biome) {
    // 1. Spawning Giant Large Trees along the road verges (12m to 26m from road)
    const numGiantTrees = 2 + Math.floor(chunkRandom(this.seed, 31, chunkIndex) * 2);

    for (let g = 0; g < numGiantTrees; g++) {
      const side = chunkRandom(this.seed, g * 11, chunkIndex) > 0.5 ? 1 : -1;
      const x = side * (12.0 + chunkRandom(this.seed, g * 17, chunkIndex) * 16.0);
      const z = 8 + chunkRandom(this.seed, g * 23, chunkIndex) * (this.chunkLength - 16);

      const giantTree = this.createGiantTree(biome, chunkIndex, g);
      giantTree.position.set(x, 0, z);
      chunkGroup.add(giantTree);
    }

    // 2. Standard trees and flower clusters
    for (let t = 0; t < 3; t++) {
      const side = t % 2 === 0 ? 1 : -1;
      const x = side * (16.0 + chunkRandom(this.seed, t * 29, chunkIndex) * 18.0);
      const z = 12 + chunkRandom(this.seed, t * 37, chunkIndex) * (this.chunkLength - 20);

      const tree = this.createStandardVoxelTree(biome);
      tree.position.set(x, 0, z);
      chunkGroup.add(tree);
    }

    // 3. Glowstone Roadside Streetlamp every chunk (alternating sides)
    const lampSide = chunkIndex % 2 === 0 ? 1 : -1;
    const lamp = this.createMinecraftLamppost();
    lamp.position.set(lampSide * 9.8, 0, this.chunkLength * 0.5);
    chunkGroup.add(lamp);
  }

  create3DVolumetricLeaves(width, height, depth, baseMat, highlightMat = null) {
    const group = new THREE.Group();
    const secMat = highlightMat || baseMat;

    // 1. Central Core Foliage Block
    const coreW = width * 0.78;
    const coreH = height * 0.75;
    const coreD = depth * 0.78;
    const core = new THREE.Mesh(new THREE.BoxGeometry(coreW, coreH, coreD), baseMat);
    core.position.y = height * 0.45;
    group.add(core);

    // 2. Multi-Cluster 3D Leaf Pods on all 4 quadrants + top
    const pods = [
      { x: coreW * 0.32, y: height * 0.45, z: coreD * 0.35, w: width * 0.52, h: height * 0.62, d: depth * 0.52, mat: secMat, rotY: 0.12 },
      { x: -coreW * 0.34, y: height * 0.42, z: coreD * 0.32, w: width * 0.48, h: height * 0.58, d: depth * 0.54, mat: baseMat, rotY: -0.15 },
      { x: coreW * 0.30, y: height * 0.48, z: -coreD * 0.34, w: width * 0.50, h: height * 0.60, d: depth * 0.50, mat: baseMat, rotY: 0.18 },
      { x: -coreW * 0.32, y: height * 0.44, z: -coreD * 0.32, w: width * 0.52, h: height * 0.56, d: depth * 0.52, mat: secMat, rotY: -0.10 },
      // Top Crown Pod
      { x: 0, y: height * 0.78, z: 0, w: width * 0.64, h: height * 0.48, d: depth * 0.64, mat: secMat, rotY: 0.25 },
      // Cantilevered side tufts
      { x: coreW * 0.50, y: height * 0.38, z: 0, w: width * 0.28, h: height * 0.42, d: depth * 0.42, mat: secMat, rotY: 0.05 },
      { x: -coreW * 0.50, y: height * 0.38, z: 0, w: width * 0.28, h: height * 0.42, d: depth * 0.42, mat: baseMat, rotY: -0.05 },
      { x: 0, y: height * 0.38, z: coreD * 0.50, w: width * 0.42, h: height * 0.42, d: depth * 0.28, mat: baseMat, rotY: 0.08 },
      { x: 0, y: height * 0.38, z: -coreD * 0.50, w: width * 0.42, h: height * 0.42, d: depth * 0.28, mat: secMat, rotY: -0.08 }
    ];

    pods.forEach(p => {
      const pod = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.h, p.d), p.mat);
      pod.position.set(p.x, p.y, p.z);
      pod.rotation.y = p.rotY || 0;
      group.add(pod);
    });

    // 3. Protruding 3D Leaf Flanges / Blades (catching specular light and casting multi-angle shadows)
    const bladeGeo = new THREE.BoxGeometry(width * 0.22, height * 0.25, width * 0.22);
    const bladePositions = [
      { x: width * 0.42, y: height * 0.65, z: depth * 0.32, rx: 0.2, rz: 0.3 },
      { x: -width * 0.42, y: height * 0.62, z: -depth * 0.32, rx: -0.2, rz: -0.3 },
      { x: width * 0.35, y: height * 0.85, z: -depth * 0.35, rx: 0.15, rz: -0.25 },
      { x: -width * 0.35, y: height * 0.85, z: depth * 0.35, rx: -0.15, rz: 0.25 },
      { x: 0, y: height * 0.98, z: 0, rx: 0.1, rz: 0.1 }
    ];

    bladePositions.forEach(b => {
      const blade = new THREE.Mesh(bladeGeo, secMat);
      blade.position.set(b.x, b.y, b.z);
      blade.rotation.x = b.rx;
      blade.rotation.z = b.rz;
      group.add(blade);
    });

    return group;
  }

  createRoadside3DBush(foliageMat, flowerMat = null, scale = 1.0) {
    const group = new THREE.Group();
    group.scale.set(scale, scale, scale);

    // Central rounded mound
    const core = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.1, 1.5), foliageMat);
    core.position.y = 0.55;
    group.add(core);

    // 8 Radial 3D Leaf Blades arching outwards in 3D dome
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 1.3), foliageMat);
      blade.position.set(Math.cos(angle) * 0.85, 0.5, Math.sin(angle) * 0.85);
      blade.rotation.y = angle + Math.PI / 2;
      blade.rotation.x = 0.32; // Tilt downward arching
      group.add(blade);
    }

    // Top leaf crown
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.65, 0.9), foliageMat);
    top.position.y = 1.1;
    top.rotation.y = 0.38;
    group.add(top);

    if (flowerMat) {
      const flower = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), flowerMat);
      flower.position.set(0, 1.5, 0);
      group.add(flower);
    }

    return group;
  }

  createGiantTree(biome, chunkIndex, seedOffset) {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: biome.woodColor, roughness: 0.8, metalness: 0.05, flatShading: true });
    const leafMat = new THREE.MeshStandardMaterial({ color: biome.leavesColor, roughness: 0.68, metalness: 0.05, flatShading: true });
    const highLeafMat = new THREE.MeshStandardMaterial({ color: biome.leavesHighlightColor || biome.leavesColor, roughness: 0.65, metalness: 0.05, flatShading: true });

    const treeStyle = chunkRandom(this.seed, seedOffset, chunkIndex);

    if (treeStyle < 0.5) {
      // GIANT SEQUOIA / REDWOOD (Standing 22m tall!)
      const trunkH = 20.0;
      const trunk = new THREE.Mesh(new THREE.BoxGeometry(2.0, trunkH, 2.0), woodMat);
      trunk.position.y = trunkH / 2;
      group.add(trunk);

      // Root buttresses
      [-1, 1].forEach(rx => {
        const root = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.0, 0.8), woodMat);
        root.position.set(rx * 1.2, 1.5, 0);
        group.add(root);
      });

      // 5 massive 3D stepped leaf tiers with protruding clusters
      const tiers = [7.5, 6.2, 5.0, 3.8, 2.2];
      tiers.forEach((size, idx) => {
        const tierLeaves = this.create3DVolumetricLeaves(size, 2.6, size, leafMat, highLeafMat);
        tierLeaves.position.y = 9.0 + idx * 2.6;
        group.add(tierLeaves);
      });
      // Pointed apex tip
      const tip = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.0, 1.2), highLeafMat);
      tip.position.y = 23.5;
      group.add(tip);
    } else {
      // GIANT ANCIENT OAK (Huge 16m spreading 3D leaf canopy)
      const trunkH = 10.0;
      const trunk = new THREE.Mesh(new THREE.BoxGeometry(2.2, trunkH, 2.2), woodMat);
      trunk.position.y = trunkH / 2;
      group.add(trunk);

      // Giant spreading crown (3 staggered 3D volumetric leaf clouds)
      const mainCrown = this.create3DVolumetricLeaves(9.5, 6.0, 9.5, leafMat, highLeafMat);
      mainCrown.position.y = 10.0;
      group.add(mainCrown);

      const topCrown = this.create3DVolumetricLeaves(6.5, 4.2, 6.5, highLeafMat, leafMat);
      topCrown.position.y = 14.5;
      group.add(topCrown);

      const sideBranch = this.create3DVolumetricLeaves(5.5, 3.5, 5.5, leafMat, highLeafMat);
      sideBranch.position.set(2.5, 9.0, -1.5);
      group.add(sideBranch);
    }

    return group;
  }

  createStandardVoxelTree(biome) {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: biome.woodColor, roughness: 0.8, metalness: 0.05, flatShading: true });
    const leafMat = new THREE.MeshStandardMaterial({ color: biome.leavesColor, roughness: 0.68, metalness: 0.05, flatShading: true });
    const highLeafMat = new THREE.MeshStandardMaterial({ color: biome.leavesHighlightColor || biome.leavesColor, roughness: 0.65, metalness: 0.05, flatShading: true });

    const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.0, 6.5, 1.0), woodMat);
    trunk.position.y = 3.25;
    group.add(trunk);

    // Root flares
    [-0.55, 0.55].forEach(rx => {
      const root = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.4, 0.35), woodMat);
      root.position.set(rx, 0.7, 0);
      group.add(root);
    });

    // 3D Volumetric Leaf Cluster Canopy
    const leaves = this.create3DVolumetricLeaves(5.2, 4.4, 5.2, leafMat, highLeafMat);
    leaves.position.y = 5.0;
    group.add(leaves);

    return group;
  }



  createMinecraftLamppost() {
    const group = new THREE.Group();
    const fence = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.5, 0.3), this.fenceMat);
    fence.position.y = 2.25;
    group.add(fence);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 0.25), this.fenceMat);
    arm.position.set(0.45, 4.4, 0);
    group.add(arm);

    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.7), this.lampMat);
    lamp.position.set(0.8, 4.0, 0);
    group.add(lamp);

    return group;
  }



  buildLivelyStructures(chunkGroup, chunkIndex) {
    // 1. OVERHEAD HIGHWAY GANTRY WITH LED DISPLAY (Every 5 chunks)
    if (chunkIndex % 5 === 0) {
      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(0, 0, this.chunkLength * 0.4);

      // Left & Right Support Towers
      const towerL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 9.0, 0.8), this.gantrySteelMat);
      towerL.position.set(-9.2, 4.5, 0);
      gantryGroup.add(towerL);

      const towerR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 9.0, 0.8), this.gantrySteelMat);
      towerR.position.set(9.2, 4.5, 0);
      gantryGroup.add(towerR);

      // Overhead Span Beam
      const span = new THREE.Mesh(new THREE.BoxGeometry(19.2, 1.2, 1.0), this.gantrySteelMat);
      span.position.set(0, 8.8, 0);
      gantryGroup.add(span);

      // LED Electronic Message Board facing player
      const ledSign = new THREE.Mesh(new THREE.BoxGeometry(15.0, 1.8, 0.3), this.gantrySteelMat);
      ledSign.position.set(0, 8.8, 0.6);
      gantryGroup.add(ledSign);

      // Canvas Texture for glowing text
      if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext ? canvas.getContext('2d') : null;
        if (ctx && typeof ctx.fillText === 'function') {
          ctx.fillStyle = '#0a101d';
          ctx.fillRect(0, 0, 512, 128);
          ctx.fillStyle = '#00f0ff';
          ctx.font = '900 42px monospace';
          ctx.textAlign = 'center';
          const messages = [
            '⬆️ 4 LANES OPEN • 100+ KMH',
            '⚠️ SPEED RADAR ACTIVE',
            '🛣️ ENDLESS HIGHWAY JOURNEY',
            '🔥 NITRO ZONE • OVERTAKE'
          ];
          ctx.fillText(messages[Math.abs(chunkIndex) % messages.length], 256, 75);

          const tex = new THREE.CanvasTexture(canvas);
          const signScreen = new THREE.Mesh(new THREE.PlaneGeometry(14.5, 1.6), new THREE.MeshBasicMaterial({ map: tex }));
          signScreen.position.set(0, 8.8, 0.76);
          gantryGroup.add(signScreen);
        } else {
          const signScreen = new THREE.Mesh(new THREE.PlaneGeometry(14.5, 1.6), this.ledSignMat);
          signScreen.position.set(0, 8.8, 0.76);
          gantryGroup.add(signScreen);
        }
      } else {
        const signScreen = new THREE.Mesh(new THREE.PlaneGeometry(14.5, 1.6), this.ledSignMat);
        signScreen.position.set(0, 8.8, 0.76);
        gantryGroup.add(signScreen);
      }

      chunkGroup.add(gantryGroup);
    }

    // 2. GREEN HIGHWAY EXIT / DISTANCE BOARDS (Every 3 chunks)
    if (chunkIndex % 3 === 1) {
      const signGroup = new THREE.Group();
      const signSide = 1; // Right side
      signGroup.position.set(10.8, 0, this.chunkLength * 0.7);

      const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5.5, 0.3), this.postMat);
      post.position.y = 2.75;
      signGroup.add(post);

      const board = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.2, 0.2), this.highwayGreenMat);
      board.position.set(0, 4.5, 0);
      signGroup.add(board);

      chunkGroup.add(signGroup);
    }
  }

  /**
   * Main streaming update: called every frame with player's Z coordinate.
   */
  update(playerZ, deltaTime = 0.016) {
    const currentChunkIndex = Math.floor(playerZ / this.chunkLength);
    const minChunkIndex = currentChunkIndex - this.viewDistanceBehind;
    const maxChunkIndex = currentChunkIndex + this.viewDistanceAhead;

    // 1. Load newly visible chunks ahead
    for (let ci = minChunkIndex; ci <= maxChunkIndex; ci++) {
      if (!this.activeChunks.has(ci)) {
        const newChunk = this.createChunk(ci);
        this.activeChunks.set(ci, newChunk);
      }
    }

    // 2. Unload chunks that fell behind view distance
    for (const [ci, chunk] of this.activeChunks.entries()) {
      if (ci < minChunkIndex || ci > maxChunkIndex + 2) {
        this.scene.remove(chunk.group);
        chunk.group.traverse(obj => {
          if (obj.geometry) obj.geometry.dispose();
        });
        this.activeChunks.delete(ci);
      }
    }

    // 3. Animate rotating wind turbines, rolling ocean waves, and bobbing boats
    const time = Date.now() * 0.002;
    this.animatedObjects.forEach(item => {
      if (item.type === 'wave') {
        item.obj.position.x = item.baseX + Math.sin(time * 2.5 + item.offset) * 1.8;
      } else if (item.type === 'boat') {
        item.obj.position.y = item.baseY + Math.sin(time * 1.8 + item.offset) * 0.35;
        item.obj.rotation.z = Math.sin(time * 1.2 + item.offset) * 0.04;
      } else if (item.type === 'bird') {
        item.obj.rotation.y = item.baseRotY + Math.sin(time * 2.5 + item.offset) * 0.2;
        item.obj.position.y = item.baseY + Math.sin(time * 3 + item.offset) * 0.06;
      } else if (item.type === 'lily') {
        item.obj.position.y = item.baseY + Math.sin(time * 1.5 + item.offset) * 0.04;
        item.obj.rotation.z = Math.sin(time * 0.8 + item.offset) * 0.03;
      } else if (item.obj && item.obj.rotation) {
        item.obj.rotation.z += (item.speed || 1) * 0.02;
      }
    });

    // 4. Smoothly drift clouds along with player progress
    if (this.cloudsGroup) {
      this.cloudsGroup.position.z = playerZ * 0.4;
      this.cloudsGroup.children.forEach((c, idx) => {
        c.position.x += 0.05 * (idx % 2 === 0 ? 1 : -1);
      });
    }

    // 5. Animate garage blast door closing
    if (this.garageDoorClosing && this.garageDoorMesh && this.garageDoorMesh.position.y > 0.0) {
      this.garageDoorMesh.position.y = Math.max(0.0, this.garageDoorMesh.position.y - 14.0 * (deltaTime || 0.016));
    }
  }

  buildMarineDriveChunk(chunkGroup, chunkIndex) {
    // -------------------------------------------------------------
    // LEFT SIDE: DENSE TROPICAL JUNGLE (X < -8)
    // -------------------------------------------------------------
    // Left Guardrail
    const railGeo = new THREE.BoxGeometry(0.35, 0.75, this.chunkLength);
    const railL = new THREE.Mesh(railGeo, this.guardrailMat);
    railL.position.set(-8.6, 0.7, this.chunkLength / 2);
    chunkGroup.add(railL);

    for (let pz = 3; pz < this.chunkLength; pz += 6) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), this.postMat);
      post.position.set(-8.6, 0.45, pz);
      chunkGroup.add(post);
    }

    // Lush Deep Rainforest Floor (Left)
    const terrainWidthL = 140;
    const groundLGeo = new THREE.PlaneGeometry(terrainWidthL, this.chunkLength);
    groundLGeo.rotateX(-Math.PI / 2);
    const groundL = new THREE.Mesh(groundLGeo, this.jungleGrassMat);
    groundL.position.set(-this.roadWidth / 2 - terrainWidthL / 2, -0.05, this.chunkLength / 2);
    chunkGroup.add(groundL);

    // Steep Jungle Mountains & Mossy Cliffs on the Left
    this.buildJungleMountains(chunkGroup, chunkIndex);

    // Dense Jungle Vegetation on the Left
    this.populateJungleNature(chunkGroup, chunkIndex);

    // -------------------------------------------------------------
    // RIGHT SIDE: MARINE DRIVE PROMENADE, BEACH & OCEAN (X > +8)
    // -------------------------------------------------------------
    // 1. Marine Drive Paved Sidewalk Promenade (X = 8.0 to 13.8)
    const promGeo = new THREE.BoxGeometry(5.8, 0.16, this.chunkLength);
    const promMesh = new THREE.Mesh(promGeo, this.promenadeTileMat);
    promMesh.position.set(10.9, 0.08, this.chunkLength / 2);
    chunkGroup.add(promMesh);

    // 2. Concrete Promenade Seawall (X = 13.8)
    const wallGeo = new THREE.BoxGeometry(0.5, 0.85, this.chunkLength);
    const seawall = new THREE.Mesh(wallGeo, this.seawallMat);
    seawall.position.set(13.8, 0.5, this.chunkLength / 2);
    chunkGroup.add(seawall);

    // SeaWall Top Coping Rail
    const railTopGeo = new THREE.BoxGeometry(0.65, 0.15, this.chunkLength);
    const railTop = new THREE.Mesh(railTopGeo, this.seawallRailMat);
    railTop.position.set(13.8, 0.95, this.chunkLength / 2);
    chunkGroup.add(railTop);

    // 3. Iconic Marine Drive Promenade Lampposts (every 18m along Z)
    for (let lz = 6; lz < this.chunkLength; lz += 18) {
      const lamp = this.createMarineDriveLamppost();
      lamp.position.set(13.2, 0.16, lz);
      chunkGroup.add(lamp);

      // Promenade benches facing the ocean
      if (lz % 36 === 6) {
        const bench = this.createPromenadeBench();
        bench.position.set(11.8, 0.16, lz + 5);
        chunkGroup.add(bench);
      }
    }

    // 4. Tetrapod Breakwater Stones (along the base of the seawall)
    for (let tp = 4; tp < this.chunkLength; tp += 9) {
      const tetrapod = this.createTetrapod();
      tetrapod.position.set(14.8 + (tp % 3) * 0.4, 0.2, tp);
      chunkGroup.add(tetrapod);
    }

    // 5. Golden Sandy Beach (X = 14 to 42)
    const beachGeo = new THREE.PlaneGeometry(28, this.chunkLength);
    beachGeo.rotateX(-Math.PI / 2);
    const beachMesh = new THREE.Mesh(beachGeo, this.beachSandMat);
    beachMesh.position.set(28.0, -0.15, this.chunkLength / 2);
    chunkGroup.add(beachMesh);

    // Wet Sand Shoreline (X = 39 to 44)
    const wetGeo = new THREE.PlaneGeometry(5, this.chunkLength);
    wetGeo.rotateX(-Math.PI / 2);
    const wetMesh = new THREE.Mesh(wetGeo, this.wetSandMat);
    wetMesh.position.set(41.5, -0.22, this.chunkLength / 2);
    chunkGroup.add(wetMesh);

    // Beach Coconut Palms (leaning toward the water)
    const numBeachPalms = 2 + Math.floor(chunkRandom(this.seed, 77, chunkIndex) * 2);
    for (let bp = 0; bp < numBeachPalms; bp++) {
      const bx = 18.0 + chunkRandom(this.seed, bp * 13, chunkIndex) * 14.0;
      const bz = 8 + chunkRandom(this.seed, bp * 19, chunkIndex) * (this.chunkLength - 16);
      const palm = this.createCoconutPalm(chunkIndex, bp, 1);
      palm.position.set(bx, -0.15, bz);
      chunkGroup.add(palm);
    }

    // Striped Beach Umbrellas & Loungers
    if (chunkIndex % 2 === 0) {
      const umbrella1 = this.createBeachUmbrella('red');
      umbrella1.position.set(22.0, -0.15, 18.0);
      chunkGroup.add(umbrella1);

      const umbrella2 = this.createBeachUmbrella('blue');
      umbrella2.position.set(24.0, -0.15, 38.0);
      chunkGroup.add(umbrella2);
    }

    // Elevated Wooden Lifeguard Tower every 4 chunks
    if (chunkIndex % 4 === 1) {
      const tower = this.createLifeguardTower();
      tower.position.set(31.0, -0.15, 28.0);
      chunkGroup.add(tower);
    }

    // 6. Vast Ocean Waters (X = 42 to 220)
    const oceanGeo = new THREE.PlaneGeometry(178, this.chunkLength);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMesh = new THREE.Mesh(oceanGeo, this.oceanDeepMat);
    oceanMesh.position.set(131.0, -0.34, this.chunkLength / 2);
    chunkGroup.add(oceanMesh);

    // Shallow turquoise lagoon strip near shore
    const shallowGeo = new THREE.PlaneGeometry(14, this.chunkLength);
    shallowGeo.rotateX(-Math.PI / 2);
    const shallowMesh = new THREE.Mesh(shallowGeo, this.oceanShallowMat);
    shallowMesh.position.set(49.0, -0.3, this.chunkLength / 2);
    chunkGroup.add(shallowMesh);

    // 7. Animated Rolling White Foam Wave Strips
    [43.8, 54.0, 70.0].forEach((waveX, wIdx) => {
      const waveGeo = new THREE.PlaneGeometry(0.8, this.chunkLength);
      waveGeo.rotateX(-Math.PI / 2);
      const waveMesh = new THREE.Mesh(waveGeo, this.oceanFoamMat);
      waveMesh.position.set(waveX, -0.27 + wIdx * 0.02, this.chunkLength / 2);
      chunkGroup.add(waveMesh);

      this.animatedObjects.push({
        type: 'wave',
        obj: waveMesh,
        baseX: waveX,
        offset: chunkIndex * 0.8 + wIdx * 1.5
      });
    });

    // 8. Distant Boats & Yachts floating on water
    if (chunkIndex % 3 === 0) {
      const yacht = this.createOceanYacht();
      const boatX = 85.0 + chunkRandom(this.seed, 91, chunkIndex) * 35.0;
      const boatZ = 15.0 + chunkRandom(this.seed, 93, chunkIndex) * 35.0;
      yacht.position.set(boatX, -0.3, boatZ);
      chunkGroup.add(yacht);

      this.animatedObjects.push({
        type: 'boat',
        obj: yacht,
        baseY: -0.3,
        offset: chunkIndex * 1.2
      });
    }

    // 9. Distant Offshore Lighthouse Islet every 6 chunks
    if (chunkIndex % 6 === 2) {
      const islet = this.createLighthouseIslet();
      islet.position.set(150.0, -0.34, this.chunkLength / 2);
      chunkGroup.add(islet);
    }
  }

  buildJungleMountains(chunkGroup, chunkIndex, side = -1) {
    const seedVal = chunkRandom(this.seed, side * 19, chunkIndex);
    const baseHeight = 32 + seedVal * 36;
    const xCenter = side * (52 + seedVal * 20);

    const tiers = [
      { w: 46, d: this.chunkLength + 2, h: baseHeight * 0.45, mat: this.jungleRockMat, y: 0 },
      { w: 32, d: this.chunkLength * 0.85, h: baseHeight * 0.75, mat: this.jungleMossMat, y: baseHeight * 0.45 },
      { w: 18, d: this.chunkLength * 0.65, h: baseHeight, mat: this.jungleGrassMat, y: baseHeight * 0.75 }
    ];

    tiers.forEach(tier => {
      const tierH = tier.h - tier.y;
      const box = new THREE.Mesh(new THREE.BoxGeometry(tier.w, tierH, tier.d), tier.mat);
      box.position.set(xCenter, tier.y + tierH / 2, this.chunkLength / 2);
      chunkGroup.add(box);
    });
  }

  populateJungleNature(chunkGroup, chunkIndex, side = -1) {
    // 3 to 4 Giant Coconut Palms & Jungle Canopy Trees
    const numTrees = 4 + Math.floor(chunkRandom(this.seed, side * 41, chunkIndex) * 3);
    for (let t = 0; t < numTrees; t++) {
      const x = side * (11.5 + chunkRandom(this.seed, t * 17 + (side > 0 ? 5 : 0), chunkIndex) * 22.0);
      const z = 6 + chunkRandom(this.seed, t * 23 + (side > 0 ? 7 : 0), chunkIndex) * (this.chunkLength - 12);

      if (t % 2 === 0) {
        const palm = this.createCoconutPalm(chunkIndex, t, side);
        palm.position.set(x, 0, z);
        chunkGroup.add(palm);
      } else {
        const canopy = this.createJungleCanopyTree(chunkIndex, t);
        canopy.position.set(x, 0, z);
        chunkGroup.add(canopy);
      }
    }

    // Roadside 3D tropical bushes and jungle ferns
    for (let b = 0; b < 4; b++) {
      const bx = side * (9.8 + (b % 2) * 1.5);
      const bz = 8 + b * 14;
      const bush = this.createRoadside3DBush(this.palmLeafMat, null, 1.25);
      bush.position.set(bx, 0, bz);
      chunkGroup.add(bush);
    }
  }

  createCoconutPalm(chunkIndex, seedOffset, leanDir = 1) {
    const group = new THREE.Group();
    const trunkHeight = 11.0 + chunkRandom(this.seed, seedOffset * 7, chunkIndex) * 3.0;

    // Segmented curved trunk
    const numSegments = 5;
    const segH = trunkHeight / numSegments;
    let currX = 0;
    let currY = 0;

    for (let s = 0; s < numSegments; s++) {
      const segW = 0.9 - s * 0.08;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(segW, segH, segW), this.palmTrunkMat);
      seg.position.set(currX, currY + segH / 2, 0);
      group.add(seg);

      currX += leanDir * 0.45;
      currY += segH;
    }

    // Brown Coconuts
    for (let c = 0; c < 4; c++) {
      const coconut = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), this.coconutMat);
      const angle = (c * Math.PI) / 2;
      coconut.position.set(currX + Math.cos(angle) * 0.35, currY - 0.2, Math.sin(angle) * 0.35);
      group.add(coconut);
    }

    // 6 Star-pattern radiating 3D volumetric palm fronds with angled leaflets
    for (let f = 0; f < 6; f++) {
      const frondAngle = (f * Math.PI * 2) / 6;
      const frondGroup = new THREE.Group();
      frondGroup.position.set(currX, currY, 0);
      frondGroup.rotation.y = frondAngle;

      // Central arched spine segments
      const spine1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 0.22), this.palmTrunkMat);
      spine1.position.set(1.2, 0.25, 0);
      spine1.rotation.z = -0.08;
      frondGroup.add(spine1);

      const spine2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 0.18), this.palmTrunkMat);
      spine2.position.set(3.2, -0.2, 0);
      spine2.rotation.z = -0.22;
      frondGroup.add(spine2);

      const spine3 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.15), this.palmTrunkMat);
      spine3.position.set(4.8, -0.75, 0);
      spine3.rotation.z = -0.42;
      frondGroup.add(spine3);

      // Angled 3D Leaflets protruding along both sides of frond spine
      const leafletOffsets = [
        { dist: 0.8, span: 1.4, y: 0.3, pitch: 0.25 },
        { dist: 1.6, span: 1.6, y: 0.18, pitch: 0.32 },
        { dist: 2.4, span: 1.7, y: -0.05, pitch: 0.38 },
        { dist: 3.2, span: 1.5, y: -0.32, pitch: 0.44 },
        { dist: 4.0, span: 1.2, y: -0.65, pitch: 0.52 },
        { dist: 4.8, span: 0.8, y: -1.02, pitch: 0.60 }
      ];

      leafletOffsets.forEach(lo => {
        [-1, 1].forEach(side => {
          const leafletGeo = new THREE.BoxGeometry(0.35, 0.08, lo.span * 0.5);
          const leaflet = new THREE.Mesh(leafletGeo, side > 0 ? this.palmLeafMat : this.palmLeafLightMat);
          leaflet.position.set(lo.dist, lo.y, side * (lo.span * 0.26));
          leaflet.rotation.x = side * lo.pitch;
          leaflet.rotation.z = -0.15;
          frondGroup.add(leaflet);
        });
      });

      group.add(frondGroup);
    }

    return group;
  }

  createJungleCanopyTree(chunkIndex, seedOffset) {
    const group = new THREE.Group();
    const trunkH = 12.0;
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(2.2, trunkH, 2.2), this.palmTrunkMat);
    trunk.position.y = trunkH / 2;
    group.add(trunk);

    const tiers = [
      { w: 10.5, h: 2.6, y: 9.8 },
      { w: 8.0, h: 2.4, y: 11.8 },
      { w: 5.5, h: 2.0, y: 13.6 }
    ];
    tiers.forEach(t => {
      const canopy = this.create3DVolumetricLeaves(t.w, t.h, t.w, this.jungleGrassMat, this.palmLeafMat);
      canopy.position.y = t.y;
      group.add(canopy);
    });

    return group;
  }



  createMarineDriveLamppost() {
    const group = new THREE.Group();
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4.8, 0.25), this.marineLampMat);
    post.position.y = 2.4;
    group.add(post);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 0.2), this.marineLampMat);
    arm.position.set(-0.6, 4.7, 0);
    group.add(arm);

    const globe = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), this.marineGlowMat);
    globe.position.set(-1.2, 4.4, 0);
    group.add(globe);

    return group;
  }



  createPromenadeBench() {
    const group = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 2.2), this.fenceMat);
    seat.position.y = 0.45;
    group.add(seat);

    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.2), this.seawallMat);
    leg1.position.set(0, 0.2, -0.8);
    group.add(leg1);

    const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.2), this.seawallMat);
    leg2.position.set(0, 0.2, 0.8);
    group.add(leg2);

    return group;
  }



  createTetrapod() {
    const group = new THREE.Group();
    const armGeo = new THREE.BoxGeometry(0.6, 1.4, 0.6);
    const arm1 = new THREE.Mesh(armGeo, this.tetrapodMat);
    group.add(arm1);

    const arm2 = new THREE.Mesh(armGeo, this.tetrapodMat);
    arm2.rotation.z = Math.PI / 3;
    group.add(arm2);

    const arm3 = new THREE.Mesh(armGeo, this.tetrapodMat);
    arm3.rotation.x = Math.PI / 3;
    group.add(arm3);

    return group;
  }



  createBeachUmbrella(color = 'red') {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.8, 0.15), this.fenceMat);
    pole.position.y = 1.4;
    group.add(pole);

    const mat = color === 'red' ? this.umbrellaRedMat : this.umbrellaBlueMat;
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 3.2), mat);
    canopy.position.y = 2.7;
    group.add(canopy);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 1.6), this.umbrellaWhiteMat);
    cap.position.y = 2.95;
    group.add(cap);

    const lounger = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 2.0), this.umbrellaWhiteMat);
    lounger.position.set(0.6, 0.15, 0.4);
    group.add(lounger);

    return group;
  }



  createLifeguardTower() {
    const group = new THREE.Group();
    [-0.9, 0.9].forEach(sx => {
      [-0.9, 0.9].forEach(sz => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.6, 0.25), this.fenceMat);
        leg.position.set(sx, 1.8, sz);
        group.add(leg);
      });
    });

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 2.4), this.umbrellaWhiteMat);
    cabin.position.y = 4.4;
    group.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.4, 2.8), this.umbrellaRedMat);
    roof.position.y = 5.5;
    group.add(roof);

    return group;
  }



  createOceanYacht() {
    const group = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.4, 9.0), this.boatHullMat);
    hull.position.y = 0.5;
    group.add(hull);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 4.5), this.glassMat);
    cabin.position.set(0, 1.5, -0.5);
    group.add(cabin);

    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.2, 7.5, 0.2), this.gantrySteelMat);
    mast.position.set(0, 4.5, 0.5);
    group.add(mast);

    const sail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 5.5, 3.5), this.boatSailMat);
    sail.position.set(0, 4.5, -1.2);
    group.add(sail);

    return group;
  }



  createLighthouseIslet() {
    const group = new THREE.Group();
    const island = new THREE.Mesh(new THREE.BoxGeometry(18.0, 3.5, 18.0), this.jungleRockMat);
    island.position.y = 1.0;
    group.add(island);

    const base = new THREE.Mesh(new THREE.BoxGeometry(4.0, 5.0, 4.0), this.umbrellaWhiteMat);
    base.position.y = 4.5;
    group.add(base);

    const mid = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.0, 3.2), this.umbrellaRedMat);
    mid.position.y = 8.5;
    group.add(mid);

    const lantern = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 2.6), this.marineGlowMat);
    lantern.position.y = 11.2;
    group.add(lantern);

    const dome = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.8, 2.8), this.gantrySteelMat);
    dome.position.y = 12.5;
    group.add(dome);

    return group;
  }



  buildAmazonRainforestChunk(chunkGroup, chunkIndex) {
    // -------------------------------------------------------------
    // MAP 3: AMAZON RAINFOREST — JUNGLE BIOME ON BOTH SIDES OF ROAD
    // -------------------------------------------------------------
    // 1. Weathered Jungle Guardrails along both road shoulders (X = -8.6, +8.6)
    [-8.6, 8.6].forEach(gx => {
      const railGeo = new THREE.BoxGeometry(0.35, 0.75, this.chunkLength);
      const rail = new THREE.Mesh(railGeo, this.guardrailMat);
      rail.position.set(gx, 0.7, this.chunkLength / 2);
      chunkGroup.add(rail);

      for (let pz = 3; pz < this.chunkLength; pz += 6) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), this.amazonButtressMat);
        post.position.set(gx, 0.45, pz);
        chunkGroup.add(post);
      }
    });

    // 2. Lush Tropical Rainforest Floor Grounds (Left and Right)
    const terrainWidth = 140;
    const groundGeo = new THREE.PlaneGeometry(terrainWidth, this.chunkLength);
    groundGeo.rotateX(-Math.PI / 2);

    const groundL = new THREE.Mesh(groundGeo, this.jungleGrassMat);
    groundL.position.set(-this.roadWidth / 2 - terrainWidth / 2, -0.05, this.chunkLength / 2);
    chunkGroup.add(groundL);

    const groundR = new THREE.Mesh(groundGeo, this.jungleGrassMat);
    groundR.position.set(this.roadWidth / 2 + terrainWidth / 2, -0.05, this.chunkLength / 2);
    chunkGroup.add(groundR);

    // 3. Steep Jungle Mountains & Mossy Cliffs on BOTH SIDES (-1 Left, +1 Right)
    this.buildJungleMountains(chunkGroup, chunkIndex, -1);
    this.buildJungleMountains(chunkGroup, chunkIndex, 1);

    // 4. Dense Jungle Nature & Coconut Palms on BOTH SIDES (-1 Left, +1 Right)
    this.populateJungleNature(chunkGroup, chunkIndex, -1);
    this.populateJungleNature(chunkGroup, chunkIndex, 1);

    // 5. Colossal Amazon Emergent Trees (Giant Kapok / Brazil Nut Trees) on BOTH SIDES
    [-1, 1].forEach(side => {
      const numEmergent = 1 + Math.floor(chunkRandom(this.seed, side * 31, chunkIndex) * 2);
      for (let e = 0; e < numEmergent; e++) {
        const x = side * (18.0 + chunkRandom(this.seed, side * 47 + e * 11, chunkIndex) * 24.0);
        const z = 8 + chunkRandom(this.seed, side * 53 + e * 17, chunkIndex) * (this.chunkLength - 16);
        const emergentTree = this.createAmazonEmergentTree(chunkIndex, e + side * 10);
        emergentTree.position.set(x, 0, z);
        chunkGroup.add(emergentTree);
      }
    });

    // 6. Natural Living Canopy Arch over Highway (every 3 chunks)
    if (chunkIndex % 3 === 0) {
      const arch = this.createCanopyArch(chunkIndex);
      arch.position.set(0, 0, this.chunkLength * 0.5);
      chunkGroup.add(arch);
    }

    // 7. Amazon River Tributary & Water Lily Lagoons
    if (chunkIndex % 3 === 1) {
      const river = this.createRiverTributary(1, chunkIndex);
      chunkGroup.add(river);
    } else if (chunkIndex % 3 === 2) {
      const river = this.createRiverTributary(-1, chunkIndex);
      chunkGroup.add(river);
    }

    // 8. Overhead LED Highway Information Gantry (every 5 chunks)
    if (chunkIndex % 5 === 2) {
      this.buildLivelyStructures(chunkGroup, chunkIndex);
    }
  }

  createAmazonEmergentTree(chunkIndex, seedOffset) {
    const group = new THREE.Group();
    const treeH = 28.0 + chunkRandom(this.seed, seedOffset * 13, chunkIndex) * 6.0;

    // 1. Stepped Buttress Roots (Wide base)
    const buttressBase = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.5, 4.8), this.amazonButtressMat);
    buttressBase.position.y = 1.75;
    group.add(buttressBase);

    [-1, 1].forEach(rx => {
      [-1, 1].forEach(rz => {
        const root = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.5, 2.0), this.amazonButtressMat);
        root.position.set(rx * 2.8, 1.25, rz * 2.8);
        group.add(root);
      });
    });

    // 2. Colossal Emergent Trunk
    const trunkH = treeH * 0.72;
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(2.6, trunkH, 2.6), this.amazonTrunkMat);
    trunk.position.y = trunkH / 2 + 1.5;
    group.add(trunk);

    // 3. Massive Flat-Topped 3D Umbrella Canopy
    const crownY = trunkH + 1.5;
    const crownMat = chunkRandom(this.seed, seedOffset, chunkIndex) > 0.5 ? this.amazonCanopyMat : this.amazonDeepCanopyMat;

    const mainCrown = this.create3DVolumetricLeaves(18.0, 4.2, 18.0, crownMat, this.amazonLightCanopyMat);
    mainCrown.position.y = crownY - 1.0;
    group.add(mainCrown);

    const topCrown = this.create3DVolumetricLeaves(12.0, 3.2, 12.0, this.amazonLightCanopyMat, crownMat);
    topCrown.position.y = crownY + 2.4;
    group.add(topCrown);

    [-1, 1].forEach(cx => {
      const sideCrown = this.create3DVolumetricLeaves(7.2, 3.0, 7.2, crownMat, this.amazonLightCanopyMat);
      sideCrown.position.set(cx * 7.5, crownY - 2.2, (cx > 0 ? 3 : -3));
      group.add(sideCrown);
    });

    // 4. Hanging Lianas (Draping down from the crown)
    for (let v = 0; v < 4; v++) {
      const vx = (Math.cos(v * 1.5) * 6.5);
      const vz = (Math.sin(v * 1.5) * 6.5);
      const vineH = 8.0 + (v % 2) * 4.0;
      const vine = new THREE.Mesh(new THREE.BoxGeometry(0.2, vineH, 0.2), this.amazonVineMat);
      vine.position.set(vx, crownY - vineH / 2, vz);
      group.add(vine);
    }

    return group;
  }



  createAmazonPalm(chunkIndex, seedOffset) {
    const group = new THREE.Group();
    const palmH = 14.0 + chunkRandom(this.seed, seedOffset * 7, chunkIndex) * 3.0;

    const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.8, palmH, 0.8), this.amazonTrunkMat);
    trunk.position.y = palmH / 2;
    group.add(trunk);

    const berry = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), this.amazonButtressMat);
    berry.position.y = palmH - 0.5;
    group.add(berry);

    for (let f = 0; f < 6; f++) {
      const angle = (f * Math.PI * 2) / 6;
      const frondGroup = new THREE.Group();
      frondGroup.position.set(0, palmH, 0);
      frondGroup.rotation.y = angle;

      const leaf1 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 0.85), this.amazonCanopyMat);
      leaf1.position.set(1.4, 0.1, 0);
      frondGroup.add(leaf1);

      const leaf2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 0.7), this.amazonLightCanopyMat);
      leaf2.position.set(3.6, -0.4, 0);
      frondGroup.add(leaf2);

      group.add(frondGroup);
    }

    return group;
  }



  createAmazonSubCanopyTree(chunkIndex, seedOffset) {
    const group = new THREE.Group();
    const trunkH = 12.0;
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.6, trunkH, 1.6), this.amazonTrunkMat);
    trunk.position.y = trunkH / 2;
    group.add(trunk);

    const lower = this.create3DVolumetricLeaves(9.2, 3.4, 9.2, this.amazonDeepCanopyMat, this.amazonCanopyMat);
    lower.position.y = 10.2;
    group.add(lower);

    const upper = this.create3DVolumetricLeaves(6.4, 2.6, 6.4, this.amazonCanopyMat, this.amazonLightCanopyMat);
    upper.position.y = 12.8;
    group.add(upper);

    return group;
  }



  createCanopyArch(chunkIndex) {
    const group = new THREE.Group();
    const archH = 8.5;

    [-11.0, 11.0].forEach(tx => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(2.2, archH, 2.2), this.amazonTrunkMat);
      pillar.position.set(tx, archH / 2, 0);
      group.add(pillar);
    });

    const crossBranch = new THREE.Mesh(new THREE.BoxGeometry(24.0, 1.8, 2.2), this.amazonTrunkMat);
    crossBranch.position.set(0, archH, 0);
    group.add(crossBranch);

    const foliage = new THREE.Mesh(new THREE.BoxGeometry(20.0, 2.0, 3.5), this.amazonCanopyMat);
    foliage.position.set(0, archH + 1.2, 0);
    group.add(foliage);

    [-8.0, -5.0, 5.0, 8.0].forEach(vx => {
      const vineL = 2.4;
      const vine = new THREE.Mesh(new THREE.BoxGeometry(0.2, vineL, 0.2), this.amazonVineMat);
      vine.position.set(vx, archH - vineL / 2, (Math.random() - 0.5) * 1.5);
      group.add(vine);
    });

    const macaw = this.createMacaw('red');
    macaw.position.set(2.5, archH + 1.0, 1.2);
    group.add(macaw);

    this.animatedObjects.push({
      type: 'bird',
      obj: macaw,
      baseY: archH + 1.0,
      baseRotY: 0,
      offset: chunkIndex * 1.7
    });

    return group;
  }



  createRiverTributary(side = 1, chunkIndex) {
    const group = new THREE.Group();
    const riverCenter = side * 34.0;
    const riverWidth = 24.0;

    const riverGeo = new THREE.PlaneGeometry(riverWidth, this.chunkLength);
    riverGeo.rotateX(-Math.PI / 2);
    const river = new THREE.Mesh(riverGeo, this.amazonRiverMat);
    river.position.set(riverCenter, -0.22, this.chunkLength / 2);
    group.add(river);

    for (let l = 0; l < 4; l++) {
      const lily = this.createWaterLilyPad();
      const lx = riverCenter + (Math.random() - 0.5) * (riverWidth - 6);
      const lz = 8 + l * 12;
      lily.position.set(lx, -0.2, lz);
      group.add(lily);

      this.animatedObjects.push({
        type: 'lily',
        obj: lily,
        baseY: -0.2,
        offset: chunkIndex + l * 0.9
      });
    }

    const hutX = side * 19.5;
    const hut = this.createStiltHut();
    hut.position.set(hutX, 0, this.chunkLength * 0.45);
    group.add(hut);

    return group;
  }



  createWaterLilyPad() {
    const group = new THREE.Group();
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.08, 12), this.lilyPadMat);
    pad.position.y = 0.04;
    group.add(pad);

    const rim = new THREE.Mesh(new THREE.RingGeometry(1.65, 1.8, 12), this.amazonLightCanopyMat);
    rim.rotateX(-Math.PI / 2);
    rim.position.y = 0.09;
    group.add(rim);

    const flower = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.4), this.lilyFlowerMat);
    flower.position.y = 0.22;
    group.add(flower);

    return group;
  }



  createStiltHut() {
    const group = new THREE.Group();
    [-1.2, 1.2].forEach(sx => {
      [-1.2, 1.2].forEach(sz => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.8, 0.25), this.amazonButtressMat);
        post.position.set(sx, 1.4, sz);
        group.add(post);
      });
    });

    const deck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.2, 3.2), this.fenceMat);
    deck.position.y = 2.8;
    group.add(deck);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.0, 2.6), this.amazonTrunkMat);
    cabin.position.y = 3.9;
    group.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.5, 3.6), this.amazonCanopyMat);
    roof.position.y = 5.1;
    group.add(roof);

    return group;
  }



  createMacaw(color = 'red') {
    const group = new THREE.Group();
    const bodyMat = color === 'red' ? this.macawRedMat : this.macawBlueMat;

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.55, 0.45), bodyMat);
    body.position.y = 0.3;
    group.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.3), bodyMat);
    head.position.set(0, 0.65, 0.1);
    group.add(head);

    const beak = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.22), this.macawYellowMat);
    beak.position.set(0, 0.6, 0.3);
    group.add(beak);

    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.6), this.macawBlueMat);
    wingL.position.set(-0.24, 0.3, -0.1);
    group.add(wingL);

    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.6), this.macawBlueMat);
    wingR.position.set(0.24, 0.3, -0.1);
    group.add(wingR);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.9), this.macawYellowMat);
    tail.position.set(0, 0.15, -0.6);
    tail.rotation.x = -0.3;
    group.add(tail);

    return group;
  }



  // MAP 10: TAJ MAHAL (45 - 50 KM)
  buildTajMahalChunk(chunkGroup, chunkIndex) {
    const terrainWidth = 140;
    const groundGeo = new THREE.PlaneGeometry(terrainWidth, this.chunkLength);
    groundGeo.rotateX(-Math.PI / 2);

    [-1, 1].forEach(side => {
      // Royal Charbagh Manicured Lawn
      const gMesh = new THREE.Mesh(groundGeo, this.tajLawnMat);
      gMesh.position.set(side * (this.roadWidth / 2 + terrainWidth / 2), -0.05, this.chunkLength / 2);
      chunkGroup.add(gMesh);

      // White Marble Shoulder Curb & Jali Railing
      const curb = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, this.chunkLength), this.tajMarbleMat);
      curb.position.set(side * 9.1, 0.17, this.chunkLength / 2);
      chunkGroup.add(curb);

      const jaliRail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, this.chunkLength), this.tajMarbleTrimMat);
      jaliRail.position.set(side * 10.1, 0.6, this.chunkLength / 2);
      chunkGroup.add(jaliRail);

      // Turquoise Reflecting Water Channel (Charbagh Pools)
      const poolGeo = new THREE.PlaneGeometry(7.0, this.chunkLength);
      poolGeo.rotateX(-Math.PI / 2);
      const pool = new THREE.Mesh(poolGeo, this.tajPoolWaterMat);
      pool.position.set(side * 16.5, 0.02, this.chunkLength / 2);
      chunkGroup.add(pool);

      // Marble pool border
      [-1, 1].forEach(pb => {
        const border = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, this.chunkLength), this.tajMarbleMat);
        border.position.set(side * 16.5 + pb * 3.7, 0.1, this.chunkLength / 2);
        chunkGroup.add(border);
      });

      // Cypress Avenue Trees
      for (let z = 6; z < this.chunkLength; z += 14) {
        const cypress1 = this.createTajCypressTree();
        cypress1.position.set(side * 12.0, 0, z);
        chunkGroup.add(cypress1);

        const cypress2 = this.createTajCypressTree();
        cypress2.position.set(side * 21.0, 0, z);
        chunkGroup.add(cypress2);
      }

      // Symmetrical Red Sandstone Pavilions & Chhatris
      const pavilion = this.createTajSandstonePavilion();
      pavilion.position.set(side * 30.0, 0, this.chunkLength * 0.5);
      chunkGroup.add(pavilion);

      // Iconic 36m White Marble Minarets (every 2 chunks)
      if (chunkIndex % 2 === 0) {
        const minaret = this.createTajMinaret();
        minaret.position.set(side * 42.0, 0, this.chunkLength * 0.4);
        chunkGroup.add(minaret);
      }

      // Grand White Marble Central Taj Mahal Mausoleum & Dome (every 3 chunks on alternating sides)
      if (chunkIndex % 3 === (side > 0 ? 1 : 2)) {
        const tajMausoleum = this.createTajMausoleum();
        tajMausoleum.position.set(side * 56.0, 0, this.chunkLength * 0.5);
        chunkGroup.add(tajMausoleum);
      }
    });

    // Ornate Marble Jali Archway spanning over the 4 highway lanes every 3 chunks
    if (chunkIndex % 3 === 0) {
      const archway = this.createTajHighwayArch();
      archway.position.set(0, 0, this.chunkLength * 0.5);
      chunkGroup.add(archway);
    }
  }

  createTajCypressTree() {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.8, 0.35), this.tajTrunkMat);
    trunk.position.y = 0.9;
    group.add(trunk);

    // 5 spiraled, fluted 3D cypress foliage tiers
    const tiers = [
      { w: 2.2, h: 2.6, y: 2.5, rot: 0 },
      { w: 1.8, h: 2.6, y: 4.6, rot: 0.35 },
      { w: 1.4, h: 2.4, y: 6.7, rot: 0.7 },
      { w: 1.0, h: 2.2, y: 8.6, rot: 1.05 },
      { w: 0.6, h: 1.8, y: 10.2, rot: 1.4 }
    ];

    tiers.forEach(t => {
      const foliage = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.w), this.tajCypressMat);
      foliage.position.y = t.y;
      foliage.rotation.y = t.rot;
      group.add(foliage);

      // Fluted vertical ridge fins
      const fin = new THREE.Mesh(new THREE.BoxGeometry(t.w * 1.15, t.h * 0.85, t.w * 0.25), this.tajLawnMat);
      fin.position.y = t.y;
      fin.rotation.y = t.rot + 0.785;
      group.add(fin);
    });

    return group;
  }

  createTajMinaret() {
    const group = new THREE.Group();
    // Octagonal base plinth
    const base = new THREE.Mesh(new THREE.BoxGeometry(5.0, 4.0, 5.0), this.tajMarbleMat);
    base.position.y = 2.0;
    group.add(base);

    // Shaft Tier 1
    const shaft1 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 12.0, 8), this.tajMarbleMat);
    shaft1.position.y = 10.0;
    group.add(shaft1);

    // Balcony Gallery 1
    const bal1 = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 1.6, 0.8, 8), this.tajMarbleTrimMat);
    bal1.position.y = 16.4;
    group.add(bal1);

    // Shaft Tier 2
    const shaft2 = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 10.0, 8), this.tajMarbleMat);
    shaft2.position.y = 21.8;
    group.add(shaft2);

    // Balcony Gallery 2
    const bal2 = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 1.4, 0.8, 8), this.tajMarbleTrimMat);
    bal2.position.y = 27.2;
    group.add(bal2);

    // Shaft Tier 3 & Chhatri Cupola
    const shaft3 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 6.0, 8), this.tajMarbleMat);
    shaft3.position.y = 30.6;
    group.add(shaft3);

    // Cupola dome & gold finial
    const cupola = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), this.tajMarbleMat);
    cupola.position.y = 34.6;
    group.add(cupola);

    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.3, 2.2, 6), this.tajGoldMat);
    finial.position.y = 36.8;
    group.add(finial);

    return group;
  }

  createTajSandstonePavilion() {
    const group = new THREE.Group();
    // Red sandstone base
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(9.0, 1.6, 9.0), this.tajSandstoneMat);
    plinth.position.y = 0.8;
    group.add(plinth);

    // 4 Corner Sandstone Pillars
    [-3.2, 3.2].forEach(px => {
      [-3.2, 3.2].forEach(pz => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.5, 0.8), this.tajSandstoneMat);
        pillar.position.set(px, 3.8, pz);
        group.add(pillar);
      });
    });

    // Roof cornice
    const roof = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.8, 8.5), this.tajSandstoneMat);
    roof.position.y = 6.4;
    group.add(roof);

    // White marble domed chhatri on roof
    const chhatriDome = new THREE.Mesh(new THREE.SphereGeometry(2.4, 8, 8), this.tajMarbleMat);
    chhatriDome.position.y = 8.5;
    group.add(chhatriDome);

    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.6, 6), this.tajGoldMat);
    finial.position.y = 11.2;
    group.add(finial);

    return group;
  }

  createTajMausoleum() {
    const group = new THREE.Group();
    // Elevated Grand Marble Plinth
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(32.0, 5.0, 32.0), this.tajMarbleMat);
    plinth.position.y = 2.5;
    group.add(plinth);

    // Main Mausoleum Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(24.0, 16.0, 24.0), this.tajMarbleMat);
    body.position.y = 13.0;
    group.add(body);

    // Giant central arched iwan portal
    const iwan = new THREE.Mesh(new THREE.BoxGeometry(10.0, 12.0, 2.0), this.tajMarbleTrimMat);
    iwan.position.set(0, 12.0, 12.2);
    group.add(iwan);

    // Central Colossal Onion Dome
    const domeDrum = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 8.5, 5.0, 12), this.tajMarbleMat);
    domeDrum.position.y = 23.5;
    group.add(domeDrum);

    const mainDome = new THREE.Mesh(new THREE.SphereGeometry(9.0, 12, 12), this.tajMarbleMat);
    mainDome.position.y = 30.5;
    group.add(mainDome);

    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.7, 5.5, 8), this.tajGoldMat);
    finial.position.y = 41.5;
    group.add(finial);

    // 4 Corner Subsidiary Domed Chhatris
    [-8.5, 8.5].forEach(cx => {
      [-8.5, 8.5].forEach(cz => {
        const subDome = new THREE.Mesh(new THREE.SphereGeometry(2.6, 8, 8), this.tajMarbleMat);
        subDome.position.set(cx, 24.0, cz);
        group.add(subDome);

        const subFinial = new THREE.Mesh(new THREE.ConeGeometry(0.25, 2.0, 6), this.tajGoldMat);
        subFinial.position.set(cx, 27.2, cz);
        group.add(subFinial);
      });
    });

    return group;
  }

  createTajHighwayArch() {
    const group = new THREE.Group();
    const archH = 10.0;

    // Twin Marble Gate Towers
    [-9.2, 9.2].forEach(tx => {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(2.0, archH, 2.4), this.tajMarbleMat);
      tower.position.set(tx, archH / 2, 0);
      group.add(tower);

      const chhatri = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 8), this.tajMarbleMat);
      chhatri.position.set(tx, archH + 1.2, 0);
      group.add(chhatri);
    });

    // Grand Pointed Arch Span Beam across 4 lanes
    const span = new THREE.Mesh(new THREE.BoxGeometry(19.5, 2.2, 2.4), this.tajMarbleMat);
    span.position.set(0, archH, 0);
    group.add(span);

    // Gold Inlay Crown
    const crest = new THREE.Mesh(new THREE.BoxGeometry(8.0, 1.2, 0.8), this.tajGoldMat);
    crest.position.set(0, archH + 1.6, 0);
    group.add(crest);

    return group;
  }

  // GRAND FINISH GARAGE CHUNK (50 KM)
  buildFinishGarageChunk(chunkGroup, chunkIndex) {
    const isEntranceChunk = (chunkIndex * this.chunkLength >= 50000 && (chunkIndex - 1) * this.chunkLength < 50000) || !this.garageDoorMesh;

    // 1. Garage Enclosed Hangar Frame (22m wide, 11m high, 65m long)
    const hangarWallGeo = new THREE.BoxGeometry(1.2, 11.0, this.chunkLength);
    const wallL = new THREE.Mesh(hangarWallGeo, this.garageSteelMat);
    wallL.position.set(-10.2, 5.5, this.chunkLength / 2);
    chunkGroup.add(wallL);

    const wallR = new THREE.Mesh(hangarWallGeo, this.garageSteelMat);
    wallR.position.set(10.2, 5.5, this.chunkLength / 2);
    chunkGroup.add(wallR);

    // Overhead Hangar Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(22.0, 1.2, this.chunkLength), this.garageSteelMat);
    roof.position.set(0, 11.5, this.chunkLength / 2);
    chunkGroup.add(roof);

    // Interior Garage Floor (Checkered industrial racing tarmac)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(19.2, this.chunkLength), this.garageFloorMat);
    floor.rotateX(-Math.PI / 2);
    floor.position.set(0, 0.04, this.chunkLength / 2);
    chunkGroup.add(floor);

    // Fluorescent ceiling light strips
    for (let lz = 6; lz < this.chunkLength; lz += 12) {
      const light = new THREE.Mesh(new THREE.BoxGeometry(14.0, 0.2, 0.6), this.garageNeonCyanMat);
      light.position.set(0, 10.8, lz);
      chunkGroup.add(light);
    }

    // Racing tire stacks along garage side walls
    for (let tz = 4; tz < this.chunkLength; tz += 10) {
      [-9.0, 9.0].forEach(sx => {
        const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 2.4, 8), this.garageHazardBlackMat);
        stack.position.set(sx, 1.2, tz);
        chunkGroup.add(stack);
      });
    }

    // Overhead Victory LED Sign
    const sign = new THREE.Mesh(new THREE.BoxGeometry(16.0, 2.0, 0.4), this.garageNeonCyanMat);
    sign.position.set(0, 9.2, this.chunkLength * 0.4);
    chunkGroup.add(sign);

    // Heavy Industrial Rollup Blast Garage Door (At 50.0 KM Entrance)
    if (isEntranceChunk) {
      const doorGroup = new THREE.Group();
      // Door mesh: 18.2m wide, 8.8m high, 0.8m thick
      const door = new THREE.Mesh(new THREE.BoxGeometry(18.2, 8.8, 0.8), this.garageDoorMat);
      door.position.y = 4.4;
      doorGroup.add(door);

      // Yellow/Black Hazard Striping along bottom edge of door
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(18.2, 1.2, 0.85), this.garageHazardYellowMat);
      stripe.position.y = 0.6;
      doorGroup.add(stripe);

      // Starts in raised open position (y = 8.8), ready to slide down and seal closed!
      doorGroup.position.set(0, 8.8, 2.0);
      chunkGroup.add(doorGroup);

      this.garageDoorMesh = doorGroup;
    }
  }

  createForestStreetlight(side) {
    const group = new THREE.Group();
    // Concrete base footing
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.65), this.postMat);
    base.position.y = 0.25;
    group.add(base);

    // Tall highway pole (9m high)
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 8.8, 8), this.streetLightPoleMat);
    pole.position.y = 4.8;
    group.add(pole);

    // Cantilevered horizontal outreach arm reaching over highway edge
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.12), this.streetLightPoleMat);
    arm.position.set(-side * 1.1, 9.2, 0);
    arm.rotation.z = side * 0.12;
    group.add(arm);

    // Modern aerodynamic Luminaire head
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 0.45), this.streetLightPoleMat);
    head.position.set(-side * 2.1, 9.05, 0);
    group.add(head);

    // High-luminance warm-white / amber LED emitter bulb facing down
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.32), this.streetLightBulbMat);
    bulb.position.set(-side * 2.1, 8.92, 0);
    group.add(bulb);

    return group;
  }

  buildTunnelChunk(chunkGroup, chunkIndex, fromStateIdx, toStateIdx, isEntry, isExit) {
    const fromState = INDIAN_STATES[fromStateIdx] || { name: `STATE ${fromStateIdx}` };
    const toState = INDIAN_STATES[toStateIdx] || { name: `STATE ${toStateIdx}` };

    // 1. Heavy Reinforced Tunnel Concrete Walls flanking both sides of the 4 lanes
    const wallH = 8.5;
    const wallThick = 1.4;
    [-1, 1].forEach(side => {
      // Concrete outer wall
      const wall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, this.chunkLength), this.tunnelConcreteMat);
      wall.position.set(side * (this.roadWidth / 2 + wallThick / 2), wallH / 2, this.chunkLength / 2);
      chunkGroup.add(wall);

      // Ceramic tile interior lining (reflective highway tunnel tiles)
      const tileLining = new THREE.Mesh(new THREE.BoxGeometry(0.12, wallH - 1.2, this.chunkLength), this.tunnelTileMat);
      tileLining.position.set(side * (this.roadWidth / 2 - 0.06), wallH / 2 + 0.4, this.chunkLength / 2);
      chunkGroup.add(tileLining);

      // Emergency walkway curb along road
      const curb = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.4, this.chunkLength), this.curbMat);
      curb.position.set(side * 8.55, 0.2, this.chunkLength / 2);
      chunkGroup.add(curb);

      // Safety reflector markers every 8m along curb
      for (let rz = 4; rz < this.chunkLength; rz += 8) {
        const marker = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.18), this.garageHazardYellowMat);
        marker.position.set(side * 8.0, 0.45, rz);
        chunkGroup.add(marker);
      }
    });

    // 2. Continuous Overhead Arched Tunnel Roof / Ceiling Slab
    const roof = new THREE.Mesh(new THREE.BoxGeometry(this.roadWidth + wallThick * 2 + 1.0, 1.2, this.chunkLength), this.tunnelConcreteMat);
    roof.position.set(0, wallH + 0.6, this.chunkLength / 2);
    chunkGroup.add(roof);

    // 3. Overhead Dual-Row Linear Tunnel Lighting (Amber & Day-white luminaires every 10m)
    [-4.0, 4.0].forEach(lx => {
      for (let lz = 5; lz < this.chunkLength; lz += 10) {
        const fixture = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 3.2), this.gantrySteelMat);
        fixture.position.set(lx, wallH - 0.05, lz);
        chunkGroup.add(fixture);

        const tube = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 3.0), this.tunnelAmberLightMat);
        tube.position.set(lx, wallH - 0.16, lz);
        chunkGroup.add(tube);
      }
    });

    // 4. Ceiling Ventilation Jet Fans every 30m
    for (let fz = 15; fz < this.chunkLength; fz += 30) {
      const fanHanger = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 2.8, 12), this.gantrySteelMat);
      fanHanger.rotation.x = Math.PI / 2;
      fanHanger.position.set(0, wallH - 0.7, fz);
      chunkGroup.add(fanHanger);
    }

    // 5. Mountain Flanks surrounding the tunnel
    const mountainW = 120;
    const mountainH = 38.0;
    [-1, 1].forEach(side => {
      const rockMass = new THREE.Mesh(new THREE.BoxGeometry(mountainW, mountainH, this.chunkLength), this.mountainRockMat);
      rockMass.position.set(side * (this.roadWidth / 2 + wallThick + mountainW / 2), mountainH / 2 - 2, this.chunkLength / 2);
      chunkGroup.add(rockMass);
    });

    // 6. Tunnel Entry Portal (at entrance) or Exit Portal (at exit)
    if (isEntry) {
      const portalZ = 4.0;
      const portalFacade = new THREE.Mesh(new THREE.BoxGeometry(32.0, 16.0, 4.0), this.tunnelPortalMat);
      portalFacade.position.set(0, 8.0, portalZ);
      chunkGroup.add(portalFacade);

      const ledSign = new THREE.Mesh(new THREE.BoxGeometry(19.0, 2.2, 0.4), this.stationTotemMat);
      ledSign.position.set(0, 10.2, portalZ - 2.1);
      chunkGroup.add(ledSign);

      const signGlow = new THREE.Mesh(new THREE.PlaneGeometry(18.4, 1.8), this.tunnelAmberLightMat);
      signGlow.position.set(0, 10.2, portalZ - 2.32);
      signGlow.rotation.y = Math.PI;
      chunkGroup.add(signGlow);

      this.createTunnelSignMesh(chunkGroup, `🔻 ENTERING TUNNEL ➔ ${toState.name} 🔻`, portalZ - 2.34, 10.2, Math.PI);
    }

    if (isExit) {
      const exitZ = this.chunkLength - 4.0;
      const exitFacade = new THREE.Mesh(new THREE.BoxGeometry(32.0, 16.0, 4.0), this.tunnelPortalMat);
      exitFacade.position.set(0, 8.0, exitZ);
      chunkGroup.add(exitFacade);

      const welcomeSign = new THREE.Mesh(new THREE.BoxGeometry(19.0, 2.4, 0.4), this.stationTotemMat);
      welcomeSign.position.set(0, 10.4, exitZ + 2.1);
      chunkGroup.add(welcomeSign);

      const welcomeGlow = new THREE.Mesh(new THREE.PlaneGeometry(18.4, 2.0), this.stationGlowMat);
      welcomeGlow.position.set(0, 10.4, exitZ + 2.32);
      chunkGroup.add(welcomeGlow);

      this.createTunnelSignMesh(chunkGroup, `🏁 WELCOME TO ${toState.name} 🏁`, exitZ + 2.34, 10.4, 0);
    }
  }

  buildGasStation(chunkGroup, chunkIndex, km) {
    const stationGroup = new THREE.Group();

    // 1. Paved Pitstop Service Apron on right side (X = 8.2 to 32.0)
    const apronW = 24.0;
    const apronL = this.chunkLength;
    const apronGeo = new THREE.PlaneGeometry(apronW, apronL);
    apronGeo.rotateX(-Math.PI / 2);
    const apron = new THREE.Mesh(apronGeo, this.roadMat);
    apron.position.set(8.2 + apronW / 2, 0.03, apronL / 2);
    stationGroup.add(apron);

    // Yellow service curb line
    const curbGeo = new THREE.BoxGeometry(0.35, 0.25, apronL);
    const pitCurb = new THREE.Mesh(curbGeo, this.garageHazardYellowMat);
    pitCurb.position.set(8.2, 0.12, apronL / 2);
    stationGroup.add(pitCurb);

    // 2. Large Modern Canopy Roof over Fuel Pumps (X = 18.0, Y = 6.2, Z = 32.0)
    const canopyW = 16.0;
    const canopyL = 28.0;
    const canopyH = 1.1;
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(canopyW, canopyH, canopyL), this.stationCanopyMat);
    canopy.position.set(18.0, 6.2, 32.0);
    stationGroup.add(canopy);

    const fascia = new THREE.Mesh(new THREE.BoxGeometry(canopyW + 0.3, 0.35, canopyL + 0.3), this.stationTrimMat);
    fascia.position.set(18.0, 6.2, 32.0);
    stationGroup.add(fascia);

    // Canopy Under-deck Lighting Plafonds
    for (let py = -8; py <= 8; py += 8) {
      for (let px = -4; px <= 4; px += 8) {
        const lightPlafond = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.1, 3.0), this.lampMat);
        lightPlafond.position.set(18.0 + px, 5.6, 32.0 + py);
        stationGroup.add(lightPlafond);
      }
    }

    // Heavy Steel Canopy Support Pillars
    [-5.5, 5.5].forEach(sx => {
      [-9.0, 9.0].forEach(sz => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.75, 5.8, 0.75), this.gantrySteelMat);
        pillar.position.set(18.0 + sx, 2.9, 32.0 + sz);
        stationGroup.add(pillar);
      });
    });

    // 3. Multi-Lane Fuel Pump Islands
    [14.5, 21.5].forEach(islandX => {
      const islandPad = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 18.0), this.curbMat);
      islandPad.position.set(islandX, 0.18, 32.0);
      stationGroup.add(islandPad);

      [-4.5, 4.5].forEach(pz => {
        const pumpBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 1.4), this.stationPumpMat);
        pumpBody.position.set(islandX, 1.4, 32.0 + pz);
        stationGroup.add(pumpBody);

        const pumpScreen = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.45), this.ledSignMat);
        pumpScreen.position.set(islandX, 1.9, 32.0 + pz);
        stationGroup.add(pumpScreen);
      });
    });

    // 4. Giant High-Rise LED Price Totem Pillar (Visible from highway)
    const totem = new THREE.Mesh(new THREE.BoxGeometry(1.8, 11.0, 1.8), this.stationTotemMat);
    totem.position.set(11.2, 5.5, 12.0);
    stationGroup.add(totem);

    const priceBoard = new THREE.Mesh(new THREE.BoxGeometry(3.8, 4.2, 1.2), this.stationTotemMat);
    priceBoard.position.set(11.2, 8.8, 12.0);
    stationGroup.add(priceBoard);

    const fuelSign = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 1.6), this.stationGlowMat);
    fuelSign.position.set(11.2, 9.8, 12.0 - 0.62);
    fuelSign.rotation.y = Math.PI;
    stationGroup.add(fuelSign);

    const nitroSign = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 1.6), this.stationNitroGlowMat);
    nitroSign.position.set(11.2, 8.0, 12.0 - 0.62);
    nitroSign.rotation.y = Math.PI;
    stationGroup.add(nitroSign);

    this.createStationSignMesh(stationGroup, `${km} KM PITSTOP\n⛽ REFUEL: $100\n🔥 NITRO: $300`, 11.2, 8.9, 12.0 - 0.64);

    // 5. Convenience Store / Pitstop Kiosk Building behind pumps
    const shop = new THREE.Mesh(new THREE.BoxGeometry(10.0, 4.5, 18.0), this.suburbHouseMat2);
    shop.position.set(29.0, 2.25, 32.0);
    stationGroup.add(shop);

    const shopRoof = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.6, 18.6), this.stationCanopyMat);
    shopRoof.position.set(29.0, 4.6, 32.0);
    stationGroup.add(shopRoof);

    const shopWindow = new THREE.Mesh(new THREE.PlaneGeometry(12.0, 2.8), this.cityWindowCyan);
    shopWindow.position.set(23.95, 2.0, 32.0);
    shopWindow.rotation.y = -Math.PI / 2;
    stationGroup.add(shopWindow);

    chunkGroup.add(stationGroup);
  }

  createTunnelSignMesh(group, text, z, y, rotY) {
    if (typeof document === 'undefined') return;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext ? canvas.getContext('2d') : null;
    if (ctx && typeof ctx.fillText === 'function') {
      ctx.fillStyle = '#0a101d';
      ctx.fillRect(0, 0, 1024, 128);
      ctx.fillStyle = '#ffd60a';
      ctx.font = '900 42px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(text, 512, 78);

      const tex = new THREE.CanvasTexture(canvas);
      const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(18.2, 1.7), new THREE.MeshBasicMaterial({ map: tex }));
      signMesh.position.set(0, y, z);
      signMesh.rotation.y = rotY;
      group.add(signMesh);
    }
  }

  createStationSignMesh(group, text, x, y, z) {
    if (typeof document === 'undefined') return;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext ? canvas.getContext('2d') : null;
    if (ctx && typeof ctx.fillText === 'function') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '900 36px monospace';
      ctx.textAlign = 'center';
      const lines = text.split('\n');
      lines.forEach((line, i) => {
        ctx.fillStyle = i === 0 ? '#38bdf8' : (i === 1 ? '#ffd60a' : '#f43f5e');
        ctx.fillText(line, 256, 120 + i * 110);
      });

      const tex = new THREE.CanvasTexture(canvas);
      const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.8), new THREE.MeshBasicMaterial({ map: tex }));
      signMesh.position.set(x, y, z);
      signMesh.rotation.y = Math.PI;
      group.add(signMesh);
    }
  }

  closeGarageDoor() {
    this.garageDoorClosing = true;
  }

  reset(playerZ = 0, stage = 1) {
    this.currentStage = stage;
    this.garageDoorClosing = false;
    this.garageDoorMesh = null;
    this.clear();
    this.update(playerZ);
  }

  clear() {
    for (const [, chunk] of this.activeChunks.entries()) {
      this.scene.remove(chunk.group);
      chunk.group.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
      });
    }
    this.activeChunks.clear();
    this.animatedObjects = [];
  }
}
