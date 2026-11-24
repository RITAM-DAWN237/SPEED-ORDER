/**
 * CarCatalog.js - Vehicle definitions, performance statistics, unlock conditions and styling
 */

export const CAR_TIERS = {
  STARTER: 'Starter',
  SPORTS: 'Sports',
  RARE: 'Rare',
  SUPERCAR: 'Supercar',
  LEGENDARY: 'Legendary'
};

export const CARS = [
  {
    id: 'viper_gtr',
    name: 'Viper GT-R',
    tier: CAR_TIERS.STARTER,
    description: 'A finely balanced street machine with forgiving handling. Perfect for amateur championship racers.',
    unlockedByDefault: true,
    unlockRequirement: 'Unlocked by default',
    color: '#e63946', // Racing Red
    secondaryColor: '#1d3557', // Carbon dark
    stats: {
      topSpeed: 185, // km/h
      acceleration: 26,
      handling: 0.88,
      braking: 38,
      nitroCapacity: 100,
      nitroBoost: 40
    },
    specs: {
      weight: 1250,
      drive: 'RWD',
      power: '450 HP',
      engine: '3.8L Twin-Turbo V6'
    }
  },
  {
    id: 'apex_turbo',
    name: 'Apex Turbo GT',
    tier: CAR_TIERS.SPORTS,
    description: 'Lightweight track-focused weapon with razor-sharp response and aggressive downforce.',
    unlockedByDefault: true,
    unlockRequirement: 'Unlocked by default',
    color: '#00b4d8', // Electric Cyan
    secondaryColor: '#03045e',
    stats: {
      topSpeed: 215,
      acceleration: 30,
      handling: 0.92,
      braking: 42,
      nitroCapacity: 110,
      nitroBoost: 45
    },
    specs: {
      weight: 1180,
      drive: 'AWD',
      power: '520 HP',
      engine: '4.0L Flat-6 Turbo'
    }
  },
  {
    id: 'thunderbolt_s',
    name: 'Thunderbolt S',
    tier: CAR_TIERS.RARE,
    description: 'High-torque prototype with savage acceleration. Earned through consistent dominance.',
    unlockedByDefault: false,
    unlockRequirement: 'Win 3 consecutive races on EASY difficulty',
    requiredDifficulty: 'easy',
    color: '#ffb703', // Electric Gold
    secondaryColor: '#111111',
    stats: {
      topSpeed: 235,
      acceleration: 34,
      handling: 0.94,
      braking: 45,
      nitroCapacity: 125,
      nitroBoost: 50
    },
    specs: {
      weight: 1150,
      drive: 'RWD',
      power: '610 HP',
      engine: '5.2L V10'
    }
  },
  {
    id: 'monza_v12',
    name: 'Monza V12 Stradale',
    tier: CAR_TIERS.RARE,
    description: 'Italian thoroughbred boasting screaming high-RPM horsepower and aerodynamic stability.',
    unlockedByDefault: false,
    unlockRequirement: 'Win 3 consecutive races on MEDIUM difficulty',
    requiredDifficulty: 'medium',
    color: '#d90429', // Rosso Scuderia
    secondaryColor: '#ffdd00',
    stats: {
      topSpeed: 260,
      acceleration: 37,
      handling: 0.96,
      braking: 48,
      nitroCapacity: 135,
      nitroBoost: 55
    },
    specs: {
      weight: 1220,
      drive: 'RWD',
      power: '750 HP',
      engine: '6.5L Naturally Aspirated V12'
    }
  },
  {
    id: 'phantom_rs',
    name: 'Phantom RS Cyber',
    tier: CAR_TIERS.SUPERCAR,
    description: 'Futuristic hybrid hypercar engineered for extreme cornering g-forces and instant nitro release.',
    unlockedByDefault: false,
    unlockRequirement: 'Win 3 consecutive races on HARD difficulty',
    requiredDifficulty: 'hard',
    color: '#7209b7', // Neon Violet
    secondaryColor: '#4cc9f0',
    stats: {
      topSpeed: 285,
      acceleration: 42,
      handling: 0.98,
      braking: 52,
      nitroCapacity: 145,
      nitroBoost: 65
    },
    specs: {
      weight: 1090,
      drive: 'AWD Quad-Motor',
      power: '980 HP',
      engine: 'Hybrid Twin-Turbo V8 + Tri-E-Motor'
    }
  },
  {
    id: 'hyperion_chrono',
    name: 'Hyperion Chrono X',
    tier: CAR_TIERS.LEGENDARY,
    description: 'The pinnacle of racing engineering. Unrivalled top speed, unmatched downforce and infinite prestige.',
    unlockedByDefault: false,
    unlockRequirement: 'Win 3 consecutive races on LEGEND difficulty',
    requiredDifficulty: 'legend',
    color: '#06d6a0', // Hyper Cyan / Emerald
    secondaryColor: '#f72585',
    stats: {
      topSpeed: 315,
      acceleration: 46,
      handling: 1.0,
      braking: 58,
      nitroCapacity: 160,
      nitroBoost: 75
    },
    specs: {
      weight: 1020,
      drive: 'AWD Active Aero',
      power: '1250 HP',
      engine: 'Hyper-Velocity Quad-Turbo W16'
    }
  }
];

export function getCarById(id) {
  return CARS.find(c => c.id === id) || CARS[0];
}
