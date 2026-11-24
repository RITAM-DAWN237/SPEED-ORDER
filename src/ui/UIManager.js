/**
 * UIManager.js - User interface transitions, menu navigation,
 * settings bindings, garage inspector, championship streaks,
 * and Firebase Authentication / Cloud Save modal.
 */

import { storage } from '../core/Storage.js';
import { audio } from '../core/Audio.js';
import { CARS, getCarById } from '../game/CarCatalog.js';
import { getTrackById } from '../tracks/TrackData.js';

export class UIManager {
  constructor(gameApp) {
    this.app = gameApp;
    this.currentScreenId = 'screen-main-menu';
    this.garageCarIndex = 0;
    this.currentDifficulty = storage.progress.difficulty || 'medium';
    this.currentLaps = 3;
    this.currentOpponents = 5;

    this.initDOMElements();
    this.bindEvents();
    this.bindAuthEvents();
    this.refreshSettingsUI();
    this.refreshStatsUI();
    this.refreshChampionshipUI();
    this.refreshGarageUI();
  }

  initDOMElements() {
    this.screens = document.querySelectorAll('.screen');
    this.hud = document.getElementById('racing-hud');
    this.pauseModal = document.getElementById('pause-modal');

    // Status bar
    this.btnSound = document.getElementById('btn-sound-toggle');
    this.btnFullscreen = document.getElementById('btn-fullscreen-toggle');
    this.fpsCounter = document.getElementById('fps-counter');
    this.btnAuthToggle = document.getElementById('btn-auth-toggle');

    // Auth Modal
    this.authModal = document.getElementById('auth-modal');
    this.btnCloseAuth = document.getElementById('btn-close-auth');
    this.btnContinueGuest = document.getElementById('btn-continue-guest');
    this.tabLogin = document.getElementById('tab-login');
    this.tabRegister = document.getElementById('tab-register');
    this.authForm = document.getElementById('auth-form');
    this.authEmail = document.getElementById('auth-email');
    this.authPassword = document.getElementById('auth-password');
    this.authErrorMsg = document.getElementById('auth-error-msg');
    this.btnAuthSubmit = document.getElementById('btn-auth-submit');
    this.btnGoogleLogin = document.getElementById('btn-google-login');
    this.authFormView = document.getElementById('auth-form-view');
    this.authLoggedInView = document.getElementById('auth-logged-in-view');
    this.authUserDisplayName = document.getElementById('auth-user-display-name');
    this.authUserEmail = document.getElementById('auth-user-email');
    this.btnManualSync = document.getElementById('btn-manual-sync');
    this.btnAuthLogout = document.getElementById('btn-auth-logout');

    // Garage elements
    this.garageCarTier = document.getElementById('garage-car-tier');
    this.garageCarStatus = document.getElementById('garage-car-status');
    this.garageCarName = document.getElementById('garage-car-name');
    this.garageCarDesc = document.getElementById('garage-car-desc');
    this.garageUnlockBox = document.getElementById('garage-unlock-box');
    this.garageUnlockText = document.getElementById('garage-unlock-text');
    this.btnSelectCar = document.getElementById('btn-select-car');

    this.specEngine = document.getElementById('spec-engine');
    this.specPower = document.getElementById('spec-power');
    this.specDrive = document.getElementById('spec-drive');
    this.specWeight = document.getElementById('spec-weight');

    this.statValSpeed = document.getElementById('stat-val-speed');
    this.barSpeed = document.getElementById('bar-speed');
    this.statValAccel = document.getElementById('stat-val-accel');
    this.barAccel = document.getElementById('bar-accel');
    this.statValHandling = document.getElementById('stat-val-handling');
    this.barHandling = document.getElementById('bar-handling');
    this.statValBraking = document.getElementById('stat-val-braking');
    this.barBraking = document.getElementById('bar-braking');
    this.statValNitro = document.getElementById('stat-val-nitro');
    this.barNitro = document.getElementById('bar-nitro');

    // Track Select & Setup
    this.btnLaunchRace = document.getElementById('btn-launch-race');
    this.diffButtons = document.querySelectorAll('#difficulty-selector .toggle-btn');
    this.lapsButtons = document.querySelectorAll('#laps-selector .toggle-btn');
    this.oppButtons = document.querySelectorAll('#opponents-selector .toggle-btn');

    // Settings
    this.inputMasterVol = document.getElementById('setting-master-vol');
    this.inputMusicVol = document.getElementById('setting-music-vol');
    this.inputSfxVol = document.getElementById('setting-sfx-vol');
    this.lblMasterVol = document.getElementById('lbl-master-vol');
    this.lblMusicVol = document.getElementById('lbl-music-vol');
    this.lblSfxVol = document.getElementById('lbl-sfx-vol');
    this.inputResScale = document.getElementById('setting-res-scale');
    this.lblResScale = document.getElementById('lbl-res-scale');
    this.inputSensitivity = document.getElementById('setting-sensitivity');
    this.lblSensitivity = document.getElementById('lbl-sensitivity');
    this.qualityButtons = document.querySelectorAll('#setting-quality-group .toggle-btn');
    this.cameraButtons = document.querySelectorAll('#setting-camera-group .toggle-btn');

    // Results screen
    this.resultsBadge = document.getElementById('results-badge');
    this.resultsHeadline = document.getElementById('results-headline');
    this.resTotalTime = document.getElementById('res-total-time');
    this.resBestLap = document.getElementById('res-best-lap');
    this.resTopSpeed = document.getElementById('res-top-speed');
    this.standingsTbody = document.getElementById('standings-tbody');
    this.streakCallout = document.getElementById('results-streak-callout');
    this.streakCalloutTitle = document.getElementById('streak-callout-title');
    this.streakCalloutDesc = document.getElementById('streak-callout-desc');
    this.trackCallout = document.getElementById('results-track-callout');
    this.trackCalloutTitle = document.getElementById('track-callout-title');
    this.trackCalloutDesc = document.getElementById('track-callout-desc');

    // HUD Countdown & Speedometer
    this.hudCountdown = document.getElementById('hud-countdown');
    this.countdownNumber = document.getElementById('countdown-number');
    this.hudPosMain = document.getElementById('hud-pos-main');
    this.hudPosTotal = document.getElementById('hud-pos-total');
    this.hudLapCur = document.getElementById('hud-lap-cur');
    this.hudLapTotal = document.getElementById('hud-lap-total');
    this.hudRaceTime = document.getElementById('hud-race-time');
    this.hudBestLap = document.getElementById('hud-best-lap');
    this.hudSpeed = document.getElementById('hud-speed');
    this.hudGear = document.getElementById('hud-gear');
    this.hudNitroBar = document.getElementById('hud-nitro-bar');
    this.hudAlertBanner = document.getElementById('hud-alert-banner');
  }

  bindEvents() {
    // Menu navigation buttons
    document.querySelectorAll('[data-target]').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playClick();
        const targetId = btn.getAttribute('data-target');
        this.showScreen(targetId);
      });
    });

    // Sound toggle button
    this.btnSound.addEventListener('click', () => {
      const isMuted = storage.settings.masterVolume === 0;
      const newVol = isMuted ? 0.8 : 0;
      storage.saveSettings({ masterVolume: newVol });
      audio.updateVolumes();
      this.btnSound.textContent = newVol > 0 ? '🔊' : '🔇';
      this.refreshSettingsUI();
    });

    // Fullscreen toggle
    this.btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => { });
      } else {
        document.exitFullscreen().catch(() => { });
      }
    });

    // Garage Next / Prev
    document.getElementById('btn-prev-car').addEventListener('click', () => {
      audio.playClick();
      this.garageCarIndex = (this.garageCarIndex - 1 + CARS.length) % CARS.length;
      this.refreshGarageUI();
      if (this.app.onGarageCarChange) {
        this.app.onGarageCarChange(CARS[this.garageCarIndex].id);
      }
    });

    document.getElementById('btn-next-car').addEventListener('click', () => {
      audio.playClick();
      this.garageCarIndex = (this.garageCarIndex + 1) % CARS.length;
      this.refreshGarageUI();
      if (this.app.onGarageCarChange) {
        this.app.onGarageCarChange(CARS[this.garageCarIndex].id);
      }
    });

    // Select car button
    this.btnSelectCar.addEventListener('click', () => {
      const car = CARS[this.garageCarIndex];
      if (storage.isCarUnlocked(car.id)) {
        audio.playClick();
        storage.setSelectedCar(car.id);
        this.refreshGarageUI();
      }
    });

    // Difficulty selector buttons
    this.diffButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.diffButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentDifficulty = btn.getAttribute('data-difficulty');
        storage.saveProgress({ difficulty: this.currentDifficulty });
      });
    });

    // Laps selector buttons
    this.lapsButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.lapsButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentLaps = parseInt(btn.getAttribute('data-laps'), 10);
      });
    });

    // Opponents selector buttons
    this.oppButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.oppButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentOpponents = parseInt(btn.getAttribute('data-opponents'), 10);
      });
    });

    // Launch Single Player Race
    this.btnLaunchRace.addEventListener('click', () => {
      const selectedTrack = storage.progress.selectedTrack || 'goa_marine';
      if (!storage.isTrackUnlocked(selectedTrack)) {
        alert('This racing location is locked! Complete the previous track to unlock.');
        return;
      }

      audio.playClick();
      this.app.startSinglePlayerRace({
        trackId: selectedTrack,
        carId: storage.progress.selectedCar || 'viper_gtr',
        difficulty: this.currentDifficulty,
        laps: this.currentLaps,
        opponents: this.currentOpponents
      });
    });

    // Settings inputs
    this.inputMasterVol.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.lblMasterVol.textContent = `${Math.round(val * 100)}%`;
      storage.saveSettings({ masterVolume: val });
      audio.updateVolumes();
    });

    this.inputMusicVol.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.lblMusicVol.textContent = `${Math.round(val * 100)}%`;
      storage.saveSettings({ musicVolume: val });
      audio.updateVolumes();
    });

    this.inputSfxVol.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.lblSfxVol.textContent = `${Math.round(val * 100)}%`;
      storage.saveSettings({ sfxVolume: val });
      audio.updateVolumes();
    });

    this.inputResScale.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.lblResScale.textContent = `${val.toFixed(1)}x`;
      storage.saveSettings({ resolutionScale: val });
      if (this.app.onResolutionChange) this.app.onResolutionChange(val);
    });

    this.inputSensitivity.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.lblSensitivity.textContent = `${val.toFixed(1)}x`;
      storage.saveSettings({ controlSensitivity: val });
      if (this.app.input) this.app.input.setSensitivity(val);
    });

    this.qualityButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.qualityButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const q = btn.getAttribute('data-quality');
        storage.saveSettings({ graphicsQuality: q });
        if (this.app.onQualityChange) this.app.onQualityChange(q);
      });
    });

    this.cameraButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.cameraButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const c = btn.getAttribute('data-cam');
        storage.saveSettings({ cameraDistance: c });
        if (this.app.onCameraModeChange) this.app.onCameraModeChange(c);
      });
    });

    // In-game Pause & Resume
    document.getElementById('btn-pause-race').addEventListener('click', () => {
      this.togglePause(true);
    });
    document.getElementById('btn-resume-race').addEventListener('click', () => {
      this.togglePause(false);
    });
    document.getElementById('btn-restart-race').addEventListener('click', () => {
      this.togglePause(false);
      this.app.restartRace();
    });
    document.getElementById('btn-pause-settings').addEventListener('click', () => {
      this.togglePause(false);
      this.showScreen('screen-settings');
    });
    document.getElementById('btn-quit-race').addEventListener('click', () => {
      this.togglePause(false);
      this.app.endRaceAndReturnToMenu();
    });

    // Results Actions
    document.getElementById('btn-replay-race').addEventListener('click', () => {
      audio.playClick();
      this.app.restartRace();
    });
    document.getElementById('btn-results-track').addEventListener('click', () => {
      audio.playClick();
      this.showScreen('screen-track-select');
    });
    document.getElementById('btn-results-garage').addEventListener('click', () => {
      audio.playClick();
      this.showScreen('screen-garage');
    });
    document.getElementById('btn-results-menu').addEventListener('click', () => {
      audio.playClick();
      this.showScreen('screen-main-menu');
    });
  }

  /* ---------------- AUTHENTICATION & CLOUD SAVE EVENTS ---------------- */
  bindAuthEvents() {
    this.isRegisterMode = false;

    // Toggle Modal
    this.btnAuthToggle.addEventListener('click', () => {
      audio.playClick();
      this.authModal.classList.remove('hidden');
      this.authErrorMsg.classList.add('hidden');
    });

    const closeAuth = () => {
      audio.playClick();
      this.authModal.classList.add('hidden');
    };
    this.btnCloseAuth.addEventListener('click', closeAuth);
    this.btnContinueGuest.addEventListener('click', closeAuth);

    // Tab switching
    this.tabLogin.addEventListener('click', () => {
      this.isRegisterMode = false;
      this.tabLogin.classList.add('active');
      this.tabRegister.classList.remove('active');
      this.btnAuthSubmit.textContent = 'SIGN IN';
      this.authErrorMsg.classList.add('hidden');
    });

    this.tabRegister.addEventListener('click', () => {
      this.isRegisterMode = true;
      this.tabRegister.classList.add('active');
      this.tabLogin.classList.remove('active');
      this.btnAuthSubmit.textContent = 'CREATE ACCOUNT & SYNC';
      this.authErrorMsg.classList.add('hidden');
    });

    // Form submit
    this.authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = this.authEmail.value.trim();
      const pass = this.authPassword.value.trim();

      this.btnAuthSubmit.disabled = true;
      this.btnAuthSubmit.textContent = 'CONNECTING...';
      this.authErrorMsg.classList.add('hidden');

      let res;
      if (this.isRegisterMode) {
        res = await this.app.firebase.registerWithEmail(email, pass);
      } else {
        res = await this.app.firebase.loginWithEmail(email, pass);
      }

      this.btnAuthSubmit.disabled = false;
      this.btnAuthSubmit.textContent = this.isRegisterMode ? 'CREATE ACCOUNT & SYNC' : 'SIGN IN';

      if (res.success) {
        audio.playClick();
        this.authModal.classList.add('hidden');
      } else {
        this.authErrorMsg.textContent = res.error;
        this.authErrorMsg.classList.remove('hidden');
      }
    });

    // Google Sign In
    this.btnGoogleLogin.addEventListener('click', async () => {
      audio.playClick();
      const res = await this.app.firebase.loginWithGoogle();
      if (res.success) {
        this.authModal.classList.add('hidden');
      } else {
        this.authErrorMsg.textContent = res.error;
        this.authErrorMsg.classList.remove('hidden');
      }
    });

    // Sign Out
    this.btnAuthLogout.addEventListener('click', async () => {
      audio.playClick();
      await this.app.firebase.logout();
    });

    // Manual Cloud Sync
    this.btnManualSync.addEventListener('click', async () => {
      audio.playClick();
      this.btnManualSync.textContent = 'SYNCING...';
      await this.app.firebase.saveProgressToFirestore();
      setTimeout(() => {
        this.btnManualSync.textContent = 'SYNC COMPLETED ✔';
        setTimeout(() => { this.btnManualSync.textContent = 'SYNC NOW'; }, 1500);
      }, 500);
    });

    // Auth State Changed hook
    this.app.firebase.onAuthChanged = ({ loggedIn, user, name }) => {
      if (loggedIn && user) {
        this.btnAuthToggle.textContent = `👤 ${name.toUpperCase()} (SYNCED)`;
        this.btnAuthToggle.classList.add('logged-in');
        this.authFormView.classList.add('hidden');
        this.authLoggedInView.classList.remove('hidden');
        this.authUserDisplayName.textContent = name;
        this.authUserEmail.textContent = user.email || 'Google User';

        // Refresh UI with cloud-merged data
        this.refreshStatsUI();
        this.refreshChampionshipUI();
        this.refreshGarageUI();
        if (this.app.trackManager) {
          this.app.trackManager.renderTrackSelectionCards();
        }
      } else {
        this.btnAuthToggle.textContent = '👤 LOGIN / CLOUD SAVE';
        this.btnAuthToggle.classList.remove('logged-in');
        this.authFormView.classList.remove('hidden');
        this.authLoggedInView.classList.add('hidden');
      }
    };
  }

  showScreen(screenId) {
    this.currentScreenId = screenId;
    this.screens.forEach(s => s.classList.remove('active'));
    this.hud.classList.add('hidden');
    this.pauseModal.classList.add('hidden');

    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
    }

    if (screenId === 'screen-track-select') {
      if (this.app.trackManager) {
        this.app.trackManager.renderTrackSelectionCards();
      }
    } else if (screenId === 'screen-statistics') {
      this.refreshStatsUI();
    } else if (screenId === 'screen-championship') {
      this.refreshChampionshipUI();
    } else if (screenId === 'screen-garage') {
      const selId = storage.progress.selectedCar;
      const idx = CARS.findIndex(c => c.id === selId);
      if (idx !== -1) this.garageCarIndex = idx;
      this.refreshGarageUI();
      if (this.app.onEnterGarage) {
        this.app.onEnterGarage(CARS[this.garageCarIndex].id);
      }
    } else if (screenId === 'screen-main-menu') {
      if (this.app.onEnterMainMenu) {
        this.app.onEnterMainMenu();
      }
    }
  }

  showHUD() {
    this.screens.forEach(s => s.classList.remove('active'));
    this.hud.classList.remove('hidden');
  }

  togglePause(show) {
    if (show) {
      this.pauseModal.classList.remove('hidden');
      this.app.isPaused = true;
      audio.stopEngine();
    } else {
      this.pauseModal.classList.add('hidden');
      this.app.isPaused = false;
      audio.startEngine();
    }
  }

  refreshGarageUI() {
    const car = CARS[this.garageCarIndex];
    if (!car) return;

    const isUnlocked = storage.isCarUnlocked(car.id);
    const isSelected = storage.progress.selectedCar === car.id;

    this.garageCarTier.textContent = car.tier.toUpperCase();
    this.garageCarName.textContent = car.name;
    this.garageCarDesc.textContent = car.description;

    this.specEngine.textContent = car.specs.engine;
    this.specPower.textContent = car.specs.power;
    this.specDrive.textContent = car.specs.drive;
    this.specWeight.textContent = `${car.specs.weight} KG`;

    this.statValSpeed.textContent = `${car.stats.topSpeed} KM/H`;
    this.barSpeed.style.width = `${Math.min(100, (car.stats.topSpeed / 320) * 100)}%`;

    this.statValAccel.textContent = `${car.stats.acceleration}`;
    this.barAccel.style.width = `${Math.min(100, (car.stats.acceleration / 50) * 100)}%`;

    this.statValHandling.textContent = `${car.stats.handling.toFixed(2)}`;
    this.barHandling.style.width = `${Math.min(100, car.stats.handling * 100)}%`;

    this.statValBraking.textContent = `${car.stats.braking}`;
    this.barBraking.style.width = `${Math.min(100, (car.stats.braking / 60) * 100)}%`;

    this.statValNitro.textContent = `${car.stats.nitroCapacity}`;
    this.barNitro.style.width = `${Math.min(100, (car.stats.nitroCapacity / 160) * 100)}%`;

    if (isUnlocked) {
      this.garageCarStatus.textContent = 'UNLOCKED';
      this.garageCarStatus.className = 'badge-status unlocked';
      this.garageUnlockBox.classList.add('hidden');

      if (isSelected) {
        this.btnSelectCar.textContent = 'SELECTED (ACTIVE)';
        this.btnSelectCar.className = 'btn-action';
        this.btnSelectCar.disabled = true;
      } else {
        this.btnSelectCar.textContent = 'SELECT THIS VEHICLE';
        this.btnSelectCar.className = 'btn-action primary';
        this.btnSelectCar.disabled = false;
      }
    } else {
      this.garageCarStatus.textContent = 'LOCKED';
      this.garageCarStatus.className = 'badge-status locked';
      this.garageUnlockBox.classList.remove('hidden');
      this.garageUnlockText.textContent = car.unlockRequirement;

      this.btnSelectCar.textContent = 'LOCKED VEHICLE';
      this.btnSelectCar.className = 'btn-action disabled';
      this.btnSelectCar.disabled = true;
    }
  }

  refreshChampionshipUI() {
    const streaks = storage.progress.streaks;
    const diffs = ['easy', 'medium', 'hard', 'legend'];

    const rewardCars = {
      easy: 'thunderbolt_s',
      medium: 'monza_v12',
      hard: 'phantom_rs',
      legend: 'hyperion_chrono'
    };

    diffs.forEach(d => {
      const count = streaks[d] || 0;
      const pipsEl = document.getElementById(`pips-${d}`);
      const statusEl = document.getElementById(`status-${d}`);
      const rewardEl = document.getElementById(`reward-${d}`);

      if (pipsEl) {
        const pips = pipsEl.querySelectorAll('.pip');
        pips.forEach((pip, idx) => {
          pip.className = 'pip';
          if (idx < count) {
            pip.classList.add('filled');
            if (count >= 3) pip.classList.add('gold');
          }
        });
      }

      if (statusEl) {
        statusEl.textContent = `Current Streak: ${count} / 3 Wins`;
      }

      if (rewardEl) {
        const isCarUnlocked = storage.isCarUnlocked(rewardCars[d]);
        if (isCarUnlocked) {
          rewardEl.innerHTML = '<span style="color: var(--accent-green)">✔ Reward Unlocked</span>';
        } else {
          rewardEl.textContent = `Reward: Locked (Needs 3 in a row)`;
        }
      }
    });
  }

  refreshStatsUI() {
    const s = storage.stats;
    const formatTime = (sec) => {
      if (!sec) return '--:--.--';
      const m = Math.floor(sec / 60);
      const remSec = (sec % 60).toFixed(2);
      return `${m < 10 ? '0' : ''}${m}:${remSec < 10 ? '0' : ''}${remSec}`;
    };

    document.getElementById('stat-total-races').textContent = s.totalRaces;
    document.getElementById('stat-total-victories').textContent = s.totalVictories;
    document.getElementById('stat-total-defeats').textContent = s.totalDefeats;

    const rate = s.totalRaces > 0 ? Math.round((s.totalVictories / s.totalRaces) * 100) : 0;
    document.getElementById('stat-win-rate').textContent = `${rate}%`;
    document.getElementById('stat-best-streak').textContent = s.bestStreak;
    document.getElementById('stat-highest-speed').textContent = `${s.highestSpeed} km/h`;
    document.getElementById('stat-unlocked-cars').textContent = `${storage.progress.unlockedCars.length} / ${CARS.length}`;
    document.getElementById('stat-best-lap').textContent = formatTime(s.bestLapTime);
  }

  refreshSettingsUI() {
    const s = storage.settings;
    this.inputMasterVol.value = s.masterVolume;
    this.lblMasterVol.textContent = `${Math.round(s.masterVolume * 100)}%`;

    this.inputMusicVol.value = s.musicVolume;
    this.lblMusicVol.textContent = `${Math.round(s.musicVolume * 100)}%`;

    this.inputSfxVol.value = s.sfxVolume;
    this.lblSfxVol.textContent = `${Math.round(s.sfxVolume * 100)}%`;

    this.inputResScale.value = s.resolutionScale;
    this.lblResScale.textContent = `${s.resolutionScale.toFixed(1)}x`;

    this.inputSensitivity.value = s.controlSensitivity;
    this.lblSensitivity.textContent = `${s.controlSensitivity.toFixed(1)}x`;

    this.qualityButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-quality') === s.graphicsQuality);
    });

    this.cameraButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-cam') === s.cameraDistance);
    });
  }

  showResults({ playerWon, playerPos, totalRacers, raceTime, bestLap, topSpeed, streakResult, standings }) {
    this.showScreen('screen-results');

    if (playerWon) {
      audio.playVictory();
      this.resultsBadge.className = 'results-badge victory';
      this.resultsBadge.textContent = '1ST PLACE — VICTORY!';
      this.resultsHeadline.textContent = 'CHAMPION OF THE TRACK';
    } else {
      audio.playDefeat();
      this.resultsBadge.className = 'results-badge defeat';
      this.resultsBadge.textContent = `${playerPos}TH PLACE — DEFEAT`;
      this.resultsHeadline.textContent = 'RACE FINISHED';
    }

    const formatTime = (sec) => {
      if (!sec || isNaN(sec)) return '--:--.--';
      const m = Math.floor(sec / 60);
      const remSec = (sec % 60).toFixed(2);
      return `${m < 10 ? '0' : ''}${m}:${remSec < 10 ? '0' : ''}${remSec}`;
    };

    this.resTotalTime.textContent = formatTime(raceTime);
    this.resBestLap.textContent = formatTime(bestLap);
    this.resTopSpeed.textContent = `${Math.round(topSpeed)} km/h`;

    // 1. Streak and car unlock notification
    if (streakResult && streakResult.unlockedCarId) {
      const car = getCarById(streakResult.unlockedCarId);
      this.streakCallout.classList.remove('hidden');
      this.streakCalloutTitle.textContent = `3-CONSECUTIVE-WIN STREAK COMPLETED!`;
      this.streakCalloutDesc = `New Prototype Unlocked: ${car.name} added to your Garage!`;
    } else {
      this.streakCallout.classList.add('hidden');
    }

    // 2. Track progression unlock notification: Winning unlocks next track!
    if (streakResult && streakResult.unlockedTrackId) {
      const track = getTrackById(streakResult.unlockedTrackId);
      this.trackCallout.classList.remove('hidden');
      this.trackCalloutTitle.textContent = `🏁 NEW RACING LOCATION UNLOCKED!`;
      this.trackCalloutDesc = `${track.name} is now open for championship competition!`;
    } else {
      this.trackCallout.classList.add('hidden');
    }

    // Populate standings table
    this.standingsTbody.innerHTML = '';
    standings.forEach(racer => {
      const tr = document.createElement('tr');
      if (racer.isPlayer) tr.classList.add('highlight');

      const gapStr = racer.pos === 1 ? 'LEADER' : `+${(racer.gap || 0).toFixed(2)}s`;
      tr.innerHTML = `
        <td>#${racer.pos}</td>
        <td>${racer.name} ${racer.isPlayer ? '(YOU)' : ''}</td>
        <td>${racer.carName}</td>
        <td>${formatTime(racer.totalTime)}</td>
        <td>${gapStr}</td>
      `;
      this.standingsTbody.appendChild(tr);
    });

    this.refreshStatsUI();
    this.refreshChampionshipUI();
    if (this.app.trackManager) {
      this.app.trackManager.renderTrackSelectionCards();
    }
  }

  updateHUD({ speed, gear, nitroPercent, pos, totalRacers, lap, totalLaps, raceTime, bestLapTime }) {
    this.hudSpeed.textContent = Math.round(speed);
    this.hudGear.textContent = gear;
    this.hudNitroBar.style.width = `${Math.max(0, Math.min(100, nitroPercent))}%`;
    this.hudPosMain.textContent = pos;
    this.hudPosTotal.textContent = `/${totalRacers}`;
    this.hudLapCur.textContent = lap;
    this.hudLapTotal.textContent = `/${totalLaps}`;

    const format = (sec) => {
      if (!sec) return '00:00.00';
      const m = Math.floor(sec / 60);
      const rem = (sec % 60).toFixed(2);
      return `${m < 10 ? '0' : ''}${m}:${rem < 10 ? '0' : ''}${rem}`;
    };

    this.hudRaceTime.textContent = format(raceTime);
    if (bestLapTime) {
      this.hudBestLap.textContent = format(bestLapTime);
    }
  }

  showCountdown(val) {
    this.hudCountdown.classList.remove('hidden');
    this.countdownNumber.textContent = val;
    if (val === 'GO!') {
      this.countdownNumber.style.color = 'var(--accent-green)';
      setTimeout(() => {
        this.hudCountdown.classList.add('hidden');
        this.countdownNumber.style.color = '#fff';
      }, 900);
    }
  }
}
