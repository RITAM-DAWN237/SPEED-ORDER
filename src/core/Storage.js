/**
 * StorageManager - LocalStorage persistence for SPEED ORDER:
 * 40+ Vehicles, 7 Highway Maps, 5 Game Modes, Paints, Wheel Rims, and Career Stats.
 */
export class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'speed_order_save_v2';
    this.data = this.load();
  }

  getDefaults() {
    return {
      settings: {
        masterVolume: 80,
        musicVolume: 75,
        sfxVolume: 85,
        resolutionScale: 100,
        graphicsQuality: 'high',
        controlSensitivity: 100,
      },
      stats: {
        racesEntered: 0,
        racesWon: 0,
        topSpeed: 0,
        totalDrift: 0,
        nitroUsed: 0,
        totalDistance: 0,
        totalOvertakes: 0,
        careerEarnings: 15000,
        cash: 15000,
        rep: 1200,
      },
      career: {
        unlockedStages: [1], // Suburb is free
        selectedStage: 1,
        gameMode: 'endless', // 'endless', 'two_way', 'time_trial', 'police_chase', 'free_ride'
        unlockedCars: ['car_01'],
        equippedCar: 'car_01',
        paintColor: 0x3b82f6,
        wheelType: 'sport_5spoke'
      }
    };
  }

  load() {
    try {
      // Check for v2 save or migrate v1
      let raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) {
        raw = localStorage.getItem('speed_order_save_v1');
      }
      if (!raw) return this.getDefaults();
      const parsed = JSON.parse(raw);
      const defaults = this.getDefaults();
      const merged = { ...defaults, ...parsed };
      if (!merged.stats) merged.stats = { ...defaults.stats };
      merged.stats = { ...defaults.stats, ...merged.stats };
      if (!merged.career) merged.career = { ...defaults.career };
      merged.career = { ...defaults.career, ...merged.career };

      if (!merged.career.unlockedCars || !Array.isArray(merged.career.unlockedCars)) {
        merged.career.unlockedCars = ['car_01'];
      }
      if (!merged.career.unlockedCars.includes('car_01')) {
        merged.career.unlockedCars.unshift('car_01');
      }
      if (!merged.career.unlockedStages || !Array.isArray(merged.career.unlockedStages)) {
        merged.career.unlockedStages = [1];
      }
      if (!merged.career.unlockedStages.includes(1)) {
        merged.career.unlockedStages.unshift(1);
      }
      if (!merged.career.selectedStage) {
        merged.career.selectedStage = 1;
      }
      if (!merged.career.gameMode) {
        merged.career.gameMode = 'endless';
      }
      if (!merged.career.wheelType) {
        merged.career.wheelType = 'sport_5spoke';
      }
      return merged;
    } catch (e) {
      return this.getDefaults();
    }
  }

  recordRunStats({ score = 0, distanceKM = 0, topSpeed = 0, overtakes = 0, cashEarned = 0 }) {
    this.data.stats.racesEntered = (this.data.stats.racesEntered || 0) + 1;
    this.data.stats.racesWon = (this.data.stats.racesWon || 0) + 1;
    if (topSpeed > (this.data.stats.topSpeed || 0)) {
      this.data.stats.topSpeed = Math.round(topSpeed);
    }
    this.data.stats.totalDistance = Number(((this.data.stats.totalDistance || 0) + Number(distanceKM)).toFixed(2));
    this.data.stats.totalOvertakes = (this.data.stats.totalOvertakes || 0) + overtakes;
    this.data.stats.totalDrift = Math.round((this.data.stats.totalDrift || 0) + Number(distanceKM) * 1000);
    this.data.stats.nitroUsed = (this.data.stats.nitroUsed || 0) + overtakes * 2;
    this.data.stats.cash = (this.data.stats.cash || 0) + cashEarned;
    this.data.stats.careerEarnings = (this.data.stats.careerEarnings || 0) + cashEarned;
    this.data.stats.rep = (this.data.stats.rep || 0) + Math.round(score * 0.1);
    this.save();
  }

  isStageUnlocked(stageId) {
    if (!this.data.career.unlockedStages) {
      this.data.career.unlockedStages = [1];
    }
    return this.data.career.unlockedStages.includes(Number(stageId));
  }

  unlockStage(stageId, price = 0) {
    const id = Number(stageId);
    if (!this.data.career.unlockedStages) {
      this.data.career.unlockedStages = [1];
    }
    if (this.data.stats.cash >= price && !this.isStageUnlocked(id)) {
      this.data.stats.cash -= price;
      this.data.career.unlockedStages.push(id);
      this.data.career.selectedStage = id;
      this.save();
      return true;
    }
    return false;
  }

  isCarUnlocked(carKey) {
    return this.data.career.unlockedCars.includes(carKey);
  }

  unlockCar(carKey, price = 0) {
    if (this.data.stats.cash >= price && !this.isCarUnlocked(carKey)) {
      this.data.stats.cash -= price;
      this.data.career.unlockedCars.push(carKey);
      this.data.career.equippedCar = carKey;
      this.save();
      return true;
    }
    return false;
  }

  equipCar(carKey) {
    if (this.isCarUnlocked(carKey)) {
      this.data.career.equippedCar = carKey;
      this.save();
      return true;
    }
    return false;
  }

  setGameMode(mode) {
    this.data.career.gameMode = mode;
    this.save();
  }

  setWheelType(wheelType) {
    this.data.career.wheelType = wheelType;
    this.save();
  }

  setPaintColor(colorHex) {
    this.data.career.paintColor = colorHex;
    this.save();
  }

  save() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  updateSetting(key, val) {
    this.data.settings[key] = val;
    this.save();
  }

  get settings() {
    return this.data.settings;
  }

  get stats() {
    return this.data.stats;
  }

  get career() {
    return this.data.career;
  }
}

export const storage = new StorageManager();
