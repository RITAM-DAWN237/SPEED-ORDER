/**
 * Storage.js - Persistent state management using localStorage & Cloud Firestore sync
 * Handles game settings, car collection, difficulty streaks, track unlocking, and career statistics.
 */

export const TRACK_UNLOCK_ORDER = [
  'goa_marine',
  'switzerland',
  'russia_snow',
  'miami',
  'scotland',
  'tokyo',
  'egypt'
];

const STORAGE_KEYS = {
  SETTINGS: 'wrc_settings',
  PROGRESS: 'wrc_progress',
  STATS: 'wrc_stats'
};

const DEFAULT_SETTINGS = {
  masterVolume: 0.8,
  musicVolume: 0.6,
  sfxVolume: 0.85,
  graphicsQuality: 'high', // 'low', 'medium', 'high'
  resolutionScale: 1.0,
  controlSensitivity: 1.0,
  cameraDistance: 'close', // 'close', 'far', 'hood'
  fullscreen: false
};

const DEFAULT_PROGRESS = {
  selectedCar: 'viper_gtr',
  selectedTrack: 'goa_marine',
  difficulty: 'medium', // 'easy', 'medium', 'hard', 'legend'
  unlockedCars: ['viper_gtr', 'apex_turbo'],
  unlockedTracks: ['goa_marine'], // Initially only one map is unlocked!
  streaks: {
    easy: 0,
    medium: 0,
    hard: 0,
    legend: 0
  },
  bestStreaks: {
    easy: 0,
    medium: 0,
    hard: 0,
    legend: 0
  }
};

const DEFAULT_STATS = {
  totalRaces: 0,
  totalVictories: 0,
  totalDefeats: 0,
  currentStreak: 0,
  bestStreak: 0,
  winsByDifficulty: {
    easy: 0,
    medium: 0,
    hard: 0,
    legend: 0
  },
  carsUnlockedCount: 2,
  tracksUnlockedCount: 1,
  bestLapTime: null,
  bestLapByTrack: {},
  highestSpeed: 0
};

export class StorageManager {
  constructor() {
    this.settings = this.load(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    this.progress = this.load(STORAGE_KEYS.PROGRESS, DEFAULT_PROGRESS);
    this.stats = this.load(STORAGE_KEYS.STATS, DEFAULT_STATS);

    // Ensure backwards compatibility if stored data lacks unlockedTracks
    if (!Array.isArray(this.progress.unlockedTracks) || this.progress.unlockedTracks.length === 0) {
      this.progress.unlockedTracks = ['goa_marine'];
    }
  }

  load(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      if (!data) return JSON.parse(JSON.stringify(fallback));
      const parsed = JSON.parse(data);
      return { ...fallback, ...parsed };
    } catch (err) {
      console.warn(`[Storage] Failed to read ${key}, using defaults:`, err);
      return JSON.parse(JSON.stringify(fallback));
    }
  }

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error(`[Storage] Failed to save ${key}:`, err);
    }
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.save(STORAGE_KEYS.SETTINGS, this.settings);
    this.onStateChanged();
    return this.settings;
  }

  saveProgress(newProgress) {
    this.progress = { ...this.progress, ...newProgress };
    this.save(STORAGE_KEYS.PROGRESS, this.progress);
    this.onStateChanged();
    return this.progress;
  }

  saveStats(newStats) {
    this.stats = { ...this.stats, ...newStats };
    this.save(STORAGE_KEYS.STATS, this.stats);
    this.onStateChanged();
    return this.stats;
  }

  isTrackUnlocked(trackId) {
    if (!this.progress.unlockedTracks) return trackId === 'goa_marine';
    return this.progress.unlockedTracks.includes(trackId);
  }

  isCarUnlocked(carId) {
    return this.progress.unlockedCars.includes(carId);
  }

  unlockTrack(trackId) {
    if (!this.isTrackUnlocked(trackId)) {
      this.progress.unlockedTracks.push(trackId);
      this.stats.tracksUnlockedCount = this.progress.unlockedTracks.length;
      this.saveProgress(this.progress);
      this.saveStats(this.stats);
      return true;
    }
    return false;
  }

  unlockCar(carId) {
    if (!this.isCarUnlocked(carId)) {
      this.progress.unlockedCars.push(carId);
      this.stats.carsUnlockedCount = this.progress.unlockedCars.length;
      this.saveProgress(this.progress);
      this.saveStats(this.stats);
      return true;
    }
    return false;
  }

  setSelectedCar(carId) {
    if (this.isCarUnlocked(carId)) {
      this.progress.selectedCar = carId;
      this.saveProgress(this.progress);
      return true;
    }
    return false;
  }

  setSelectedTrack(trackId) {
    if (this.isTrackUnlocked(trackId)) {
      this.progress.selectedTrack = trackId;
      this.saveProgress(this.progress);
      return true;
    }
    return false;
  }

  /**
   * Record race result, update streak progression, and unlock next track on victory
   * @param {Object} raceResult { won, difficulty, trackId, bestLap, topSpeed }
   * @returns {Object} { won, streak, unlockedCarId, unlockedTrackId }
   */
  recordRaceResult({ won, difficulty, trackId, bestLap, topSpeed }) {
    this.stats.totalRaces += 1;
    if (topSpeed > this.stats.highestSpeed) {
      this.stats.highestSpeed = Math.round(topSpeed);
    }

    if (bestLap) {
      if (!this.stats.bestLapTime || bestLap < this.stats.bestLapTime) {
        this.stats.bestLapTime = bestLap;
      }
      const trackBest = this.stats.bestLapByTrack[trackId];
      if (!trackBest || bestLap < trackBest) {
        this.stats.bestLapByTrack[trackId] = bestLap;
      }
    }

    let unlockedCarId = null;
    let unlockedTrackId = null;
    const diffKey = difficulty.toLowerCase();

    if (won) {
      this.stats.totalVictories += 1;
      this.stats.winsByDifficulty[diffKey] = (this.stats.winsByDifficulty[diffKey] || 0) + 1;

      // 1. Check Track Progression: Winning one unlocks the next!
      const currentTrackIdx = TRACK_UNLOCK_ORDER.indexOf(trackId);
      if (currentTrackIdx !== -1 && currentTrackIdx + 1 < TRACK_UNLOCK_ORDER.length) {
        const nextTrackId = TRACK_UNLOCK_ORDER[currentTrackIdx + 1];
        if (!this.isTrackUnlocked(nextTrackId)) {
          this.progress.unlockedTracks.push(nextTrackId);
          unlockedTrackId = nextTrackId;
        }
      }

      // 2. Update difficulty-specific streak
      const currentStreak = (this.progress.streaks[diffKey] || 0) + 1;
      this.progress.streaks[diffKey] = currentStreak;

      if (currentStreak > (this.progress.bestStreaks[diffKey] || 0)) {
        this.progress.bestStreaks[diffKey] = currentStreak;
      }

      // 3. Check for exclusive car unlock (3 consecutive wins on that difficulty)
      const REWARD_MAP = {
        easy: 'thunderbolt_s',
        medium: 'monza_v12',
        hard: 'phantom_rs',
        legend: 'hyperion_chrono'
      };

      const rewardCar = REWARD_MAP[diffKey];
      if (currentStreak >= 3 && rewardCar && !this.progress.unlockedCars.includes(rewardCar)) {
        this.progress.unlockedCars.push(rewardCar);
        unlockedCarId = rewardCar;
      }

      this.stats.currentStreak = currentStreak;
      if (currentStreak > this.stats.bestStreak) {
        this.stats.bestStreak = currentStreak;
      }
    } else {
      this.stats.totalDefeats += 1;
      // Reset streak ONLY for this difficulty on defeat
      this.progress.streaks[diffKey] = 0;
      this.stats.currentStreak = 0;
    }

    this.stats.carsUnlockedCount = this.progress.unlockedCars.length;
    this.stats.tracksUnlockedCount = this.progress.unlockedTracks.length;

    this.saveProgress(this.progress);
    this.saveStats(this.stats);

    return {
      won,
      difficulty,
      streak: this.progress.streaks[diffKey],
      unlockedCarId,
      unlockedTrackId
    };
  }

  /**
   * Data payload for Cloud Firestore sync
   */
  getCloudPayload() {
    return {
      progress: this.progress,
      stats: this.stats,
      settings: this.settings,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Merge cloud saved progress when logging in
   */
  mergeCloudData(cloudData) {
    if (!cloudData) return;

    if (cloudData.progress) {
      // Merge unlocked cars (union of both)
      const mergedCars = Array.from(new Set([
        ...this.progress.unlockedCars,
        ...(cloudData.progress.unlockedCars || [])
      ]));

      // Merge unlocked tracks (union of both)
      const mergedTracks = Array.from(new Set([
        ...this.progress.unlockedTracks,
        ...(cloudData.progress.unlockedTracks || ['goa_marine'])
      ]));

      // Merge best streaks (maximum)
      const mergedStreaks = { ...this.progress.streaks };
      const mergedBestStreaks = { ...this.progress.bestStreaks };
      ['easy', 'medium', 'hard', 'legend'].forEach(d => {
        if (cloudData.progress.streaks && cloudData.progress.streaks[d] > (mergedStreaks[d] || 0)) {
          mergedStreaks[d] = cloudData.progress.streaks[d];
        }
        if (cloudData.progress.bestStreaks && cloudData.progress.bestStreaks[d] > (mergedBestStreaks[d] || 0)) {
          mergedBestStreaks[d] = cloudData.progress.bestStreaks[d];
        }
      });

      this.progress = {
        ...this.progress,
        ...cloudData.progress,
        unlockedCars: mergedCars,
        unlockedTracks: mergedTracks,
        streaks: mergedStreaks,
        bestStreaks: mergedBestStreaks
      };
      this.save(STORAGE_KEYS.PROGRESS, this.progress);
    }

    if (cloudData.stats) {
      this.stats = {
        totalRaces: Math.max(this.stats.totalRaces, cloudData.stats.totalRaces || 0),
        totalVictories: Math.max(this.stats.totalVictories, cloudData.stats.totalVictories || 0),
        totalDefeats: Math.max(this.stats.totalDefeats, cloudData.stats.totalDefeats || 0),
        currentStreak: Math.max(this.stats.currentStreak, cloudData.stats.currentStreak || 0),
        bestStreak: Math.max(this.stats.bestStreak, cloudData.stats.bestStreak || 0),
        winsByDifficulty: {
          easy: Math.max(this.stats.winsByDifficulty.easy, cloudData.stats.winsByDifficulty?.easy || 0),
          medium: Math.max(this.stats.winsByDifficulty.medium, cloudData.stats.winsByDifficulty?.medium || 0),
          hard: Math.max(this.stats.winsByDifficulty.hard, cloudData.stats.winsByDifficulty?.hard || 0),
          legend: Math.max(this.stats.winsByDifficulty.legend, cloudData.stats.winsByDifficulty?.legend || 0)
        },
        carsUnlockedCount: this.progress.unlockedCars.length,
        tracksUnlockedCount: this.progress.unlockedTracks.length,
        bestLapTime: (this.stats.bestLapTime && cloudData.stats.bestLapTime)
          ? Math.min(this.stats.bestLapTime, cloudData.stats.bestLapTime)
          : (this.stats.bestLapTime || cloudData.stats.bestLapTime),
        bestLapByTrack: { ...this.stats.bestLapByTrack, ...(cloudData.stats.bestLapByTrack || {}) },
        highestSpeed: Math.max(this.stats.highestSpeed, cloudData.stats.highestSpeed || 0)
      };
      this.save(STORAGE_KEYS.STATS, this.stats);
    }

    if (cloudData.settings) {
      this.settings = { ...this.settings, ...cloudData.settings };
      this.save(STORAGE_KEYS.SETTINGS, this.settings);
    }
  }

  onStateChanged() {
    if (this.onCloudSyncNeeded) {
      this.onCloudSyncNeeded();
    }
  }
}

export const storage = new StorageManager();
