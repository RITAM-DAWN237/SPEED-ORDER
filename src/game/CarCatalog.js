/**
 * CarCatalog.js - Iconic Need for Speed Tuner & Supercar Legends
 */

export const CAR_TIERS = {
  TUNER: 'Street Tuner',
  MUSCLE: 'Muscle',
  EXOTIC: 'Exotic Supercar',
  HERO: 'Most Wanted Legend'
};

export const CARS = [
  {
    id: 'nissan_skyline',
    name: 'Nissan Skyline GT-R R34',
    tier: CAR_TIERS.TUNER,
    description: 'The underground king. Twin-turbo RB26DETT with ATTESA all-wheel-drive grip and aggressive aero.',
    unlockedByDefault: true,
    unlockRequirement: 'Unlocked by default',
    color: '#0066cc', // Bayside Blue
    secondaryColor: '#111111',
    underglowColor: '#00f0ff',
    stats: {
      topSpeed: 215,
      acceleration: 30,
      handling: 0.92,
      braking: 42,
      nitroCapacity: 110,
      nitroBoost: 50
    },
    specs: {
      power: '550 HP',
      engine: '2.6L Twin-Turbo RB26',
      drive: 'ATTESA AWD'
    }
  },
  {
    id: 'toyota_supra',
    name: 'Toyota Supra Turbo 2JZ',
    tier: CAR_TIERS.TUNER,
    description: 'Straight-line bullet. Big single turbo 2JZ-GTE producing screaming high-RPM horsepower.',
    unlockedByDefault: true,
    unlockRequirement: 'Unlocked by default',
    color: '#ff6600', // Metallic Orange
    secondaryColor: '#222222',
    underglowColor: '#ff0055',
    stats: {
      topSpeed: 235,
      acceleration: 33,
      handling: 0.89,
      braking: 40,
      nitroCapacity: 120,
      nitroBoost: 55
    },
    specs: {
      power: '680 HP',
      engine: '3.0L Turbo 2JZ-GTE',
      drive: 'RWD Limited Slip'
    }
  },
  {
    id: 'mazda_rx7',
    name: 'Mazda RX-7 FD3S Spirit R',
    tier: CAR_TIERS.TUNER,
    description: 'Rotary-powered drift scalpel with razor-sharp balance and effortless counter-steer initiation.',
    unlockedByDefault: false,
    unlockRequirement: 'Win race on ROOKIE difficulty',
    requiredDifficulty: 'easy',
    color: '#ffcc00', // Sunburst Yellow
    secondaryColor: '#1a1a1a',
    underglowColor: '#39ff14',
    stats: {
      topSpeed: 228,
      acceleration: 32,
      handling: 0.98,
      braking: 44,
      nitroCapacity: 125,
      nitroBoost: 50
    },
    specs: {
      power: '480 HP',
      engine: '1.3L Twin-Turbo 13B-REW',
      drive: 'RWD 50:50 Balance'
    }
  },
  {
    id: 'bmw_m3_gtr',
    name: 'BMW M3 GTR E46 Most Wanted',
    tier: CAR_TIERS.HERO,
    description: 'The iconic silver-and-blue Most Wanted hero car. Screaming 4.0L P60B40 V8 with straight-cut gears.',
    unlockedByDefault: false,
    unlockRequirement: 'Win race on PRO difficulty',
    requiredDifficulty: 'medium',
    color: '#d6d6d6', // Silver with blue stripes
    secondaryColor: '#0044cc',
    underglowColor: '#00f0ff',
    stats: {
      topSpeed: 265,
      acceleration: 38,
      handling: 0.95,
      braking: 48,
      nitroCapacity: 135,
      nitroBoost: 60
    },
    specs: {
      power: '720 HP',
      engine: '4.0L Naturally Aspirated V8',
      drive: 'RWD Straight-Cut'
    }
  },
  {
    id: 'porsche_911',
    name: 'Porsche 911 GT3 RS',
    tier: CAR_TIERS.EXOTIC,
    description: 'Precision German track weapon with massive downforce, rear-engine traction, and launch control.',
    unlockedByDefault: false,
    unlockRequirement: 'Win race on OUTLAW difficulty',
    requiredDifficulty: 'hard',
    color: '#06d6a0', // Viper Green
    secondaryColor: '#000000',
    underglowColor: '#39ff14',
    stats: {
      topSpeed: 290,
      acceleration: 42,
      handling: 0.99,
      braking: 54,
      nitroCapacity: 145,
      nitroBoost: 65
    },
    specs: {
      power: '800 HP',
      engine: '4.0L Flat-6 Boxer',
      drive: 'RWD Active Aero'
    }
  },
  {
    id: 'lamborghini_mvr',
    name: 'Lamborghini Murciélago LP640',
    tier: CAR_TIERS.EXOTIC,
    description: 'Roaring Italian V12 all-wheel-drive brute. Insane high-speed pull and untamed aggression.',
    unlockedByDefault: false,
    unlockRequirement: 'Win race on MOST WANTED difficulty',
    requiredDifficulty: 'legend',
    color: '#7209b7', // Matte Purple
    secondaryColor: '#ff0055',
    underglowColor: '#bf00ff',
    stats: {
      topSpeed: 320,
      acceleration: 46,
      handling: 0.96,
      braking: 58,
      nitroCapacity: 160,
      nitroBoost: 75
    },
    specs: {
      power: '950 HP',
      engine: '6.5L Naturally Aspirated V12',
      drive: 'AWD Viscous'
    }
  }
];

export function getCarById(id) {
  return CARS.find(c => c.id === id) || CARS[0];
}
