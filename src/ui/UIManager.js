import { storage } from '../core/Storage.js';
import { audio } from '../core/Audio.js';
import { VEHICLES_CATALOG, WHEEL_TYPES } from '../racing/CarModel.js';

/**
 * UIManager - Screen navigation, settings inputs, 40+ garage slider, wheel customizer, game modes, and 7 maps.
 */
export class UIManager {
  constructor(menuScene, renderer) {
    this.menuScene = menuScene;
    this.renderer = renderer;
    this.audio = audio;
    this.storage = storage;
    this.currentCarIndex = 0;

    this.init();
  }

  init() {
    this.bindNavButtons();
    this.bindBackButtons();
    this.bindGameModes();
    this.bindMapSelection();
    this.bindGarageSlider();
    this.bindGarageSwatches();
    this.bindWheelCustomizer();
    this.bindSettings();
    this.bindAudioToggle();
    this.loadStats();
  }

  bindNavButtons() {
    const navButtons = document.querySelectorAll('.menu-btn[data-target]');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        this.audio.playClickSound();
        this.showScreen(target);
      });
    });
  }

  bindBackButtons() {
    const backButtons = document.querySelectorAll('.back-btn[data-back]');
    backButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-back');
        this.audio.playBackSound();
        this.showScreen(target);
      });
    });
  }

  showScreen(screenId) {
    const screens = document.querySelectorAll('.screen-view');
    screens.forEach(s => s.classList.remove('active'));

    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');

      if (screenId === 'screen-garage') {
        this.menuScene.targetDistance = 5.2;
        this.menuScene.orbitAngles.theta = 1.1;
        this.menuScene.orbitAngles.phi = 0.38;
        if (this.refreshGarageUI) {
          const car = VEHICLES_CATALOG[this.currentCarIndex] || VEHICLES_CATALOG[0];
          this.refreshGarageUI(car.id);
        }
      } else {
        this.menuScene.targetDistance = 7.0;
      }

      if (screenId === 'screen-play') {
        this.refreshUnlockedMaps();
        this.refreshGameModes();
      }

      if (screenId === 'screen-stats') {
        this.loadStats();
      }
    }
  }

  bindGameModes() {
    const modeButtons = document.querySelectorAll('.mode-tab-btn[data-mode]');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        this.storage.setGameMode(mode);
        this.audio.playClickSound();
        this.refreshGameModes();
      });
    });
    this.refreshGameModes();
  }

  refreshGameModes() {
    const currentMode = this.storage.career.gameMode || 'endless';
    const modeButtons = document.querySelectorAll('.mode-tab-btn[data-mode]');
    modeButtons.forEach(btn => {
      const mode = btn.getAttribute('data-mode');
      if (mode === currentMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  bindMapSelection() {
    const startBtn = document.getElementById('btn-start-race');
    if (startBtn) {
      startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.audio.playClickSound();
        if (this.onLaunchJourney) {
          this.onLaunchJourney(1);
        }
      });
    }
  }

  refreshUnlockedMaps() {
    const playerCash = this.storage.stats.cash || 0;
    const mapCashEl = document.getElementById('map-player-cash');
    if (mapCashEl) mapCashEl.textContent = `$${playerCash.toLocaleString()}`;
    this.loadStats();
  }

  bindGarageSlider() {
    // Determine initial index
    const equipped = this.storage.career.equippedCar || 'car_01';
    const foundIdx = VEHICLES_CATALOG.findIndex(c => c.id === equipped);
    this.currentCarIndex = foundIdx >= 0 ? foundIdx : 0;

    const btnPrev = document.getElementById('btn-garage-prev');
    const btnNext = document.getElementById('btn-garage-next');
    const sliderInput = document.getElementById('garage-car-slider');

    const updateGarageUI = (carKey) => {
      const playerCash = this.storage.stats.cash;
      const garageCashEl = document.getElementById('garage-player-cash');
      if (garageCashEl) garageCashEl.textContent = `$${playerCash.toLocaleString()}`;
      this.loadStats();

      const car = VEHICLES_CATALOG.find(c => c.id === carKey) || VEHICLES_CATALOG[this.currentCarIndex];
      const isCarUnlocked = this.storage.isCarUnlocked(car.id);
      const isEquipped = (this.storage.career.equippedCar === car.id);

      // Counter Badge
      const counterEl = document.getElementById('garage-car-counter');
      if (counterEl) {
        counterEl.textContent = `CAR [ ${this.currentCarIndex + 1} / ${VEHICLES_CATALOG.length} ]`;
      }
      if (sliderInput) {
        sliderInput.value = this.currentCarIndex;
      }

      // Name & Class
      const nameEl = document.getElementById('garage-car-name');
      const classEl = document.getElementById('garage-car-class');
      if (nameEl) nameEl.textContent = car.name;
      if (classEl) classEl.textContent = car.class;

      // Stats
      const speedBar = document.getElementById('stat-bar-speed');
      const speedVal = document.getElementById('stat-val-speed');
      if (speedBar) speedBar.style.width = `${Math.min(100, Math.round((car.speed / 390) * 100))}%`;
      if (speedVal) speedVal.textContent = `${car.speed} KM/H`;

      const accelBar = document.getElementById('stat-bar-accel');
      const accelVal = document.getElementById('stat-val-accel');
      if (accelBar) accelBar.style.width = car.accel === '1.7s' ? '100%' : `${Math.round(85 - parseFloat(car.accel) * 6)}%`;
      if (accelVal) accelVal.textContent = car.accel;

      const handlBar = document.getElementById('stat-bar-handling');
      const handlVal = document.getElementById('stat-val-handling');
      if (handlBar) handlBar.style.width = car.handling;
      if (handlVal) handlVal.textContent = car.handling;

      const armorBar = document.getElementById('stat-bar-armor');
      const armorVal = document.getElementById('stat-val-armor');
      if (armorBar) armorBar.style.width = car.armor;
      if (armorVal) armorVal.textContent = car.armor;

      // Price Badge & Action Button
      const priceBadge = document.getElementById('garage-car-price-badge');
      const btnEquip = document.getElementById('btn-equip-car');

      if (isCarUnlocked) {
        if (priceBadge) {
          priceBadge.textContent = isEquipped ? '✓ CURRENTLY EQUIPPED' : '✓ VEHICLE OWNED & READY';
          priceBadge.className = 'spec-price-status';
        }
        if (btnEquip) {
          btnEquip.classList.remove('btn-buy-mode');
          btnEquip.querySelector('span').textContent = isEquipped ? '✓ EQUIPPED FOR JOURNEY' : 'EQUIP FOR JOURNEY';
        }
      } else {
        if (priceBadge) {
          priceBadge.textContent = `🔒 LOCKED • PRICE: $${car.price.toLocaleString()}`;
          priceBadge.className = 'spec-price-status locked';
        }
        if (btnEquip) {
          btnEquip.classList.add('btn-buy-mode');
          btnEquip.querySelector('span').textContent = `BUY VEHICLE • $${car.price.toLocaleString()}`;
        }
      }

      // Update 3D garage preview
      if (this.menuScene) {
        const paintColor = this.storage.career.paintColor || car.defaultColor;
        const wheelType = this.storage.career.wheelType || 'sport_5spoke';
        this.menuScene.loadCarModel(car.id, paintColor, wheelType);
      }
    };

    this.refreshGarageUI = updateGarageUI;

    const navigateToCar = (newIdx) => {
      this.currentCarIndex = (newIdx + VEHICLES_CATALOG.length) % VEHICLES_CATALOG.length;
      const car = VEHICLES_CATALOG[this.currentCarIndex];
      this.audio.playClickSound();
      updateGarageUI(car.id);
    };

    if (btnPrev) {
      btnPrev.addEventListener('click', () => navigateToCar(this.currentCarIndex - 1));
    }
    if (btnNext) {
      btnNext.addEventListener('click', () => navigateToCar(this.currentCarIndex + 1));
    }
    if (sliderInput) {
      sliderInput.addEventListener('input', (e) => {
        navigateToCar(Number(e.target.value));
      });
    }

    // Equip / Buy Button
    const btnEquip = document.getElementById('btn-equip-car');
    if (btnEquip) {
      btnEquip.addEventListener('click', () => {
        const car = VEHICLES_CATALOG[this.currentCarIndex];
        const isUnlocked = this.storage.isCarUnlocked(car.id);

        if (isUnlocked) {
          this.audio.playClickSound();
          this.storage.equipCar(car.id);
          btnEquip.querySelector('span').textContent = '✓ EQUIPPED! LAUNCHING JOURNEY...';

          setTimeout(() => {
            const startRaceBtn = document.getElementById('btn-start-race');
            if (startRaceBtn) {
              startRaceBtn.click();
            } else {
              this.showScreen('screen-play');
            }
            updateGarageUI(car.id);
          }, 350);
        } else {
          // Attempt purchase
          const currentCash = this.storage.stats.cash;
          if (currentCash >= car.price) {
            const success = this.storage.unlockCar(car.id, car.price);
            if (success) {
              this.audio.playClickSound();
              updateGarageUI(car.id);
              btnEquip.querySelector('span').textContent = '✓ PURCHASED & EQUIPPED! LAUNCHING...';

              setTimeout(() => {
                const startRaceBtn = document.getElementById('btn-start-race');
                if (startRaceBtn) {
                  startRaceBtn.click();
                } else {
                  this.showScreen('screen-play');
                }
                updateGarageUI(car.id);
              }, 450);
            }
          } else {
            const diff = car.price - currentCash;
            btnEquip.querySelector('span').textContent = `NEED $${diff.toLocaleString()} MORE!`;
            this.audio.playCrashSound();
            setTimeout(() => {
              if (btnEquip && !this.storage.isCarUnlocked(car.id)) {
                btnEquip.querySelector('span').textContent = `BUY VEHICLE • $${car.price.toLocaleString()}`;
              }
            }, 1400);
          }
        }
      });
    }

    // Initial load
    updateGarageUI(VEHICLES_CATALOG[this.currentCarIndex].id);
  }

  bindWheelCustomizer() {
    const rimButtons = document.querySelectorAll('.rim-btn[data-rim]');
    const currentRim = this.storage.career.wheelType || 'sport_5spoke';

    rimButtons.forEach(btn => {
      const rimKey = btn.getAttribute('data-rim');
      if (rimKey === currentRim) btn.classList.add('active');
      else btn.classList.remove('active');

      btn.addEventListener('click', () => {
        rimButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.storage.setWheelType(rimKey);
        this.audio.playClickSound();
        if (this.menuScene) {
          this.menuScene.setCarWheelType(rimKey);
        }
      });
    });
  }

  bindGarageSwatches() {
    const swatches = document.querySelectorAll('.swatches .swatch');
    swatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        swatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        const hex = parseInt(swatch.getAttribute('data-color'), 16);
        this.storage.setPaintColor(hex);
        this.audio.playClickSound();
        if (this.menuScene) {
          this.menuScene.setCarPaintColor(hex);
        }
      });
    });
  }

  bindSettings() {
    const masterSlider = document.getElementById('setting-master-volume');
    const masterVal = document.getElementById('val-master-volume');
    if (masterSlider) {
      masterSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (masterVal) masterVal.textContent = `${val}%`;
        this.storage.updateSetting('masterVolume', val);
        this.audio.setMasterVolume(val);
      });
    }

    const musicSlider = document.getElementById('setting-music-volume');
    const musicVal = document.getElementById('val-music-volume');
    if (musicSlider) {
      musicSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (musicVal) musicVal.textContent = `${val}%`;
        this.storage.updateSetting('musicVolume', val);
        this.audio.setMusicVolume(val);
      });
    }

    const sfxSlider = document.getElementById('setting-sfx-volume');
    const sfxVal = document.getElementById('val-sfx-volume');
    if (sfxSlider) {
      sfxSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (sfxVal) sfxVal.textContent = `${val}%`;
        this.storage.updateSetting('sfxVolume', val);
        this.audio.setSfxVolume(val);
        this.audio.playClickSound();
      });
    }
  }

  bindAudioToggle() {
    const toggleBtn = document.getElementById('audio-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const isMuted = this.audio.toggleAudio();
        toggleBtn.querySelector('.icon').textContent = isMuted ? '🔇' : '🔊';
        toggleBtn.querySelector('.label').textContent = isMuted ? 'AUDIO OFF' : 'AUDIO ON';
      });
    }
  }

  loadStats() {
    const s = this.storage.stats;
    const repEl = document.getElementById('stat-rep');
    const cashEl = document.getElementById('stat-cash');
    if (repEl) repEl.textContent = `${(s.rep || 0).toLocaleString()} XP`;
    if (cashEl) cashEl.textContent = `$${(s.cash || 0).toLocaleString()}`;

    // Statistics Screen Tiles (Saved on Local Browser)
    const racesEnteredEl = document.getElementById('stat-races-entered');
    const racesWonEl = document.getElementById('stat-races-won');
    const topSpeedEl = document.getElementById('stat-top-speed');
    const totalDriftEl = document.getElementById('stat-total-drift');
    const nitroUsedEl = document.getElementById('stat-nitro-used');
    const careerCashEl = document.getElementById('stat-career-cash');

    if (racesEnteredEl) racesEnteredEl.textContent = (s.racesEntered || 0).toLocaleString();
    if (racesWonEl) racesWonEl.textContent = (s.racesWon || s.racesEntered || 0).toLocaleString();
    if (topSpeedEl) topSpeedEl.innerHTML = `${Math.round(s.topSpeed || 0)} <small>KM/H</small>`;
    if (totalDriftEl) totalDriftEl.innerHTML = `${((s.totalDistance || 0)).toFixed(1)} <small>KM</small>`;
    if (nitroUsedEl) nitroUsedEl.innerHTML = `${(s.nitroUsed || 0).toLocaleString()} <small>SEC</small>`;
    if (careerCashEl) careerCashEl.textContent = `$${(s.careerEarnings || s.cash || 0).toLocaleString()}`;
  }
}
