/**
 * UIManager.js - NFS Style UI, Tachometer Needle Animation,
 * Drift Points Display, Underglow Customizer, and Instant Screen Transitions.
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
    this.refreshSettingsUI();
    this.refreshGarageUI();
  }

  initDOMElements() {
    this.screens = document.querySelectorAll('.nfs-screen');
    this.hud = document.getElementById('racing-hud');
    this.pauseModal = document.getElementById('pause-modal');
    this.nosOverlay = document.getElementById('nos-motion-overlay');

    // Status bar
    this.btnSound = document.getElementById('btn-sound-toggle');
    this.btnFullscreen = document.getElementById('btn-fullscreen-toggle');
    this.fpsCounter = document.getElementById('fps-counter');

    // Main Menu Quick Play
    this.btnQuickPlay = document.getElementById('btn-quick-play');

    // Garage elements
    this.garageCarTier = document.getElementById('garage-car-tier');
    this.garageCarStatus = document.getElementById('garage-car-status');
    this.garageCarName = document.getElementById('garage-car-name');
    this.garageCarDesc = document.getElementById('garage-car-desc');
    this.garageUnlockBox = document.getElementById('garage-unlock-box');
    this.btnSelectCar = document.getElementById('btn-select-car');

    this.specPower = document.getElementById('spec-power');
    this.specEngine = document.getElementById('spec-engine');
    this.specDrive = document.getElementById('spec-drive');

    this.statValSpeed = document.getElementById('stat-val-speed');
    this.barSpeed = document.getElementById('bar-speed');
    this.statValAccel = document.getElementById('stat-val-accel');
    this.barAccel = document.getElementById('bar-accel');
    this.statValHandling = document.getElementById('stat-val-handling');
    this.barHandling = document.getElementById('bar-handling');
    this.statValNitro = document.getElementById('stat-val-nitro');
    this.barNitro = document.getElementById('bar-nitro');

    // Track Select & Setup
    this.btnLaunchRace = document.getElementById('btn-launch-race');
    this.diffButtons = document.querySelectorAll('#difficulty-selector .nfs-pill');
    this.lapsButtons = document.querySelectorAll('#laps-selector .nfs-pill');

    // Settings
    this.inputMasterVol = document.getElementById('setting-master-vol');
    this.inputMusicVol = document.getElementById('setting-music-vol');
    this.inputSfxVol = document.getElementById('setting-sfx-vol');
    this.lblMasterVol = document.getElementById('lbl-master-vol');
    this.lblMusicVol = document.getElementById('lbl-music-vol');
    this.lblSfxVol = document.getElementById('lbl-sfx-vol');
    this.qualityButtons = document.querySelectorAll('#setting-quality-group .nfs-pill');
    this.cameraButtons = document.querySelectorAll('#setting-camera-group .nfs-pill');

    // Results screen
    this.resultsBadge = document.getElementById('results-badge');
    this.resultsHeadline = document.getElementById('results-headline');
    this.resTotalTime = document.getElementById('res-total-time');
    this.resBestLap = document.getElementById('res-best-lap');
    this.resTopSpeed = document.getElementById('res-top-speed');
    this.standingsTbody = document.getElementById('standings-tbody');
    this.trackCallout = document.getElementById('results-track-callout');
    this.trackCalloutTitle = document.getElementById('track-callout-title');
    this.trackCalloutDesc = document.getElementById('track-callout-desc');

    // HUD Tachometer & Speedometer
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
    this.tachoNeedle = document.getElementById('tacho-needle');
    this.driftScoreBox = document.getElementById('drift-score-box');
    this.driftPts = document.getElementById('drift-pts');
  }

  bindEvents() {
    // 1. QUICK PLAY BUTTON: Instant launch!
    if (this.btnQuickPlay) {
      this.btnQuickPlay.addEventListener('click', () => {
        audio.playClick();
        const selectedTrack = storage.progress.selectedTrack || 'goa_marine';
        const selectedCar = storage.progress.selectedCar || 'nissan_skyline';
        this.app.startSinglePlayerRace({
          trackId: selectedTrack,
          carId: selectedCar,
          difficulty: this.currentDifficulty,
          laps: this.currentLaps,
          opponents: 5
        });
      });
    }

    // 2. Navigation buttons
    document.querySelectorAll('[data-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        audio.playClick();
        const targetId = btn.getAttribute('data-target');
        this.showScreen(targetId);
      });
    });

    // Sound toggle
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
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
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

    // Garage Underglow Color Picker
    document.querySelectorAll('.neon-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        audio.playClick();
        document.querySelectorAll('.neon-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        const color = dot.getAttribute('data-neon');
        if (this.app.garageVehicle) {
          this.app.garageVehicle.setUnderglowColor(color);
        }
      });
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

    // Difficulty selector
    this.diffButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.diffButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentDifficulty = btn.getAttribute('data-difficulty');
        storage.saveProgress({ difficulty: this.currentDifficulty });
      });
    });

    // Laps selector
    this.lapsButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.lapsButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentLaps = parseInt(btn.getAttribute('data-laps'), 10);
      });
    });

    // Launch race from Track Selection
    this.btnLaunchRace.addEventListener('click', () => {
      const selectedTrack = storage.progress.selectedTrack || 'goa_marine';
      if (!storage.isTrackUnlocked(selectedTrack)) {
        alert('This circuit is locked! Win the previous street race to unlock.');
        return;
      }

      audio.playClick();
      this.app.startSinglePlayerRace({
        trackId: selectedTrack,
        carId: storage.progress.selectedCar || 'nissan_skyline',
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
    this.garageCarName.textContent = car.name.toUpperCase();
    this.garageCarDesc.textContent = car.description;

    this.specPower.textContent = car.specs.power;
    this.specEngine.textContent = car.specs.engine;
    this.specDrive.textContent = car.specs.drive;

    this.statValSpeed.textContent = `${car.stats.topSpeed} KM/H`;
    this.barSpeed.style.width = `${Math.min(100, (car.stats.topSpeed / 320) * 100)}%`;

    this.statValAccel.textContent = `${car.stats.acceleration}`;
    this.barAccel.style.width = `${Math.min(100, (car.stats.acceleration / 50) * 100)}%`;

    this.statValHandling.textContent = `${car.stats.handling.toFixed(2)}`;
    this.barHandling.style.width = `${Math.min(100, car.stats.handling * 100)}%`;

    this.statValNitro.textContent = `${car.stats.nitroCapacity}`;
    this.barNitro.style.width = `${Math.min(100, (car.stats.nitroCapacity / 160) * 100)}%`;

    if (isUnlocked) {
      this.garageCarStatus.textContent = 'UNLOCKED';
      this.garageCarStatus.className = 'car-status-pill unlocked';
      this.garageUnlockBox.classList.add('hidden');

      if (isSelected) {
        this.btnSelectCar.textContent = 'SELECTED (ACTIVE)';
        this.btnSelectCar.className = 'nfs-btn-action';
        this.btnSelectCar.disabled = true;
      } else {
        this.btnSelectCar.textContent = 'SELECT THIS MACHINE';
        this.btnSelectCar.className = 'nfs-btn-action primary';
        this.btnSelectCar.disabled = false;
      }
    } else {
      this.garageCarStatus.textContent = 'LOCKED';
      this.garageCarStatus.className = 'car-status-pill locked';
      this.garageUnlockBox.classList.remove('hidden');
      this.garageUnlockBox.querySelector('span').textContent = car.unlockRequirement;

      this.btnSelectCar.textContent = 'LOCKED MACHINE';
      this.btnSelectCar.className = 'nfs-btn-action disabled';
      this.btnSelectCar.disabled = true;
    }
  }

  refreshSettingsUI() {
    const s = storage.settings;
    this.inputMasterVol.value = s.masterVolume;
    this.lblMasterVol.textContent = `${Math.round(s.masterVolume * 100)}%`;

    this.inputMusicVol.value = s.musicVolume;
    this.lblMusicVol.textContent = `${Math.round(s.musicVolume * 100)}%`;

    this.inputSfxVol.value = s.sfxVolume;
    this.lblSfxVol.textContent = `${Math.round(s.sfxVolume * 100)}%`;

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
      this.resultsBadge.className = 'podium-badge victory';
      this.resultsBadge.textContent = '1ST PLACE — VICTORY!';
      this.resultsHeadline.textContent = 'STREET KING OF THE NIGHT';
    } else {
      audio.playDefeat();
      this.resultsBadge.className = 'podium-badge defeat';
      this.resultsBadge.textContent = `${playerPos}TH PLACE — BUSTED`;
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
    this.resTopSpeed.textContent = `${Math.round(topSpeed)} KM/H`;

    if (streakResult && streakResult.unlockedTrackId) {
      const track = getTrackById(streakResult.unlockedTrackId);
      this.trackCallout.classList.remove('hidden');
      this.trackCalloutTitle.textContent = `🏁 NEW STREET CIRCUIT UNLOCKED!`;
      this.trackCalloutDesc = `${track.name} is now open for racing!`;
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

    if (this.app.trackManager) {
      this.app.trackManager.renderTrackSelectionCards();
    }
  }

  updateHUD({ speed, gear, nitroPercent, pos, totalRacers, lap, totalLaps, raceTime, bestLapTime, rpmRatio, isNitro, isDrifting, driftPoints }) {
    this.hudSpeed.textContent = Math.round(speed);
    this.hudGear.textContent = gear;
    this.hudNitroBar.style.width = `${Math.max(0, Math.min(100, nitroPercent))}%`;
    this.hudPosMain.textContent = pos;
    this.hudPosTotal.textContent = `/${totalRacers}`;
    this.hudLapCur.textContent = lap;
    this.hudLapTotal.textContent = `/${totalLaps}`;

    // Tachometer needle rotation: -120 deg (idle) to +120 deg (redline)
    const needleDeg = -120 + ((rpmRatio || 0) * 240);
    if (this.tachoNeedle) {
      this.tachoNeedle.setAttribute('transform', `rotate(${needleDeg} 100 100)`);
    }

    // Drift Score display
    if (this.driftScoreBox) {
      if (isDrifting || (driftPoints && driftPoints > 0)) {
        this.driftScoreBox.classList.remove('hidden');
        this.driftPts.textContent = `+${Math.round(driftPoints)}`;
      } else {
        this.driftScoreBox.classList.add('hidden');
      }
    }

    // NOS speed blur overlay
    if (this.nosOverlay) {
      if (isNitro) this.nosOverlay.classList.add('active');
      else this.nosOverlay.classList.remove('active');
    }

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
      this.countdownNumber.style.color = '#39ff14';
      setTimeout(() => {
        this.hudCountdown.classList.add('hidden');
        this.countdownNumber.style.color = '#fff';
      }, 900);
    }
  }
}
