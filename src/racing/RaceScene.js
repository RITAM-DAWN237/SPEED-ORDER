import * as THREE from 'three';
import { MinecraftChunkManager, INDIAN_STATES } from './MinecraftChunkManager.js';
import { TrafficSpawner } from './TrafficSpawner.js';
import { TrafficRacerPhysics } from './TrafficRacerPhysics.js';
import { InputController } from './InputController.js';
import { CarModel, VEHICLES_CATALOG } from './CarModel.js';
import { audio } from '../core/Audio.js';
import { storage } from '../core/Storage.js';

/**
 * RaceScene: Traffic Racer Endless Highway Game Engine:
 * - 4-lane straight infinite highway
 * - 10 Indian State Biomes + Grand Finish Garage (50 KM)
 * - Mountain Highway Transition Tunnels every 5 KM
 * - Roadside Refueling Pitstops every 1 KM ($100 refuel, $300 nitro)
 * - 5s Nitro Shield Boost (no life loss on crash)
 * - Pause Modal with Resume, Restart, and Main Menu
 */
export class RaceScene {
  constructor() {
    this.isActive = false;
    this.isPaused = false;
    this.gameOverTriggered = false;
    this.victoryTriggered = false;
    this.lives = 3;
    this.invincibleTimer = 0;
    this.fuel = 100.0;
    this.fuelLimpWarningShown = false;
    this.nitroCount = 1;
    this.nitroTimer = 0;
    this.stationNearby = false;
    this.gameMode = 'endless';
    this.timeTrialRemaining = 100.0;
    this.wrongWayTimer = 0;
    this.wrongWayBonusCash = 0;

    // Run statistics tracking (for 50 KM finish garage & game over)
    this.raceStartTime = 0;
    this.raceElapsedTime = 0;
    this.refuelCount = 0;
    this.nitroUsedCount = 0;
    this.runCashEarned = 0;

    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(56, aspect, 0.5, 1200);

    this.setupLighting();

    this.highway = new MinecraftChunkManager(this.scene);
    this.traffic = new TrafficSpawner(this.scene);

    const carType = storage.career.equippedCar || 'car_01';
    const carData = VEHICLES_CATALOG.find(c => c.id === carType) || VEHICLES_CATALOG[0];
    const carColor = storage.career.paintColor || carData.defaultColor;
    const wheelType = storage.career.wheelType || 'sport_5spoke';

    this.playerCar = new CarModel({ type: carType, color: carColor, wheelType, isPlayer: true });
    this.playerCar.mesh.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    this.scene.add(this.playerCar.mesh);

    this.physics = new TrafficRacerPhysics(this.playerCar);
    this.input = new InputController();

    // Hook Close Overtake Bonus (>100 km/h) - 80% reduction: bonus * 0.05
    this.traffic.onCloseOvertake = (speed, dist, isOncoming) => {
      const multiplier = isOncoming ? 2.5 : 1.0;
      const bonus = Math.round((120 + (speed - 100) * 2.5) * multiplier);
      const cashBonus = Math.max(1, Math.round(bonus * 0.05));

      this.physics.addCloseOvertake(bonus);
      this.runCashEarned += cashBonus;
      storage.stats.cash = (storage.stats.cash || 0) + cashBonus;
      storage.save();

      audio.playNitroSound();

      if (this.gameMode === 'time_trial') {
        this.timeTrialRemaining = Math.min(120.0, this.timeTrialRemaining + 2.0);
        this.showCallout(`⚡ OVERTAKE! +${bonus} PTS • +2.0 SEC • +$${cashBonus}`);
      } else if (isOncoming) {
        this.showCallout(`🔥 HEAD-ON CLOSE PASS! +${bonus} PTS • +$${cashBonus}`);
      } else {
        this.showCallout(`⚡ CLOSE OVERTAKE! +${bonus} PTS • +$${cashBonus}`);
      }
    };

    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff8ee, 3.0);
    this.sunLight.position.set(30, 65, -20);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1.0;
    this.sunLight.shadow.camera.far = 160;
    this.sunLight.shadow.camera.left = -28;
    this.sunLight.shadow.camera.right = 28;
    this.sunLight.shadow.camera.top = 36;
    this.sunLight.shadow.camera.bottom = -36;
    this.sunLight.shadow.bias = -0.0006;
    this.sunLight.shadow.normalBias = 0.035;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d7042, 1.4);
    this.scene.add(this.hemiLight);
  }

  applyStageAtmosphere(stage) {
    const s = Number(stage);

    if (s === 2) {
      // Map 2: Desert — Blazing golden sun, red rock canyon horizon & warm dust haze
      this.ambientLight.color.setHex(0xfef3c7);
      this.ambientLight.intensity = 2.8;
      this.sunLight.color.setHex(0xffedd5);
      this.sunLight.intensity = 3.6;
      this.sunLight.position.set(40, 75, -25);
      this.hemiLight.color.setHex(0xf59e0b);
      this.hemiLight.groundColor.setHex(0xb45309);
      this.scene.background = new THREE.Color(0xf59e0b);
      this.scene.fog = new THREE.FogExp2(0xd97706, 0.0022);
    } else if (s === 3) {
      // Map 3: Snowy — Frosty glacial sky, soft winter mist & crisp cool bounce
      this.ambientLight.color.setHex(0xe0f2fe);
      this.ambientLight.intensity = 2.5;
      this.sunLight.color.setHex(0xf1f5f9);
      this.sunLight.intensity = 3.0;
      this.sunLight.position.set(-20, 65, -30);
      this.hemiLight.color.setHex(0xcfd8dc);
      this.hemiLight.groundColor.setHex(0x94a3b8);
      this.scene.background = new THREE.Color(0xdbeafe);
      this.scene.fog = new THREE.FogExp2(0xe2e8f0, 0.0025);
    } else if (s === 4) {
      // Map 4: Rainy — Dark overcast storm sky, sodden wet asphalt & rainy spray
      this.ambientLight.color.setHex(0x94a3b8);
      this.ambientLight.intensity = 2.0;
      this.sunLight.color.setHex(0xcbd5e1);
      this.sunLight.intensity = 2.0;
      this.sunLight.position.set(10, 50, -20);
      this.hemiLight.color.setHex(0x475569);
      this.hemiLight.groundColor.setHex(0x1e293b);
      this.scene.background = new THREE.Color(0x334155);
      this.scene.fog = new THREE.FogExp2(0x1e293b, 0.0035);
    } else if (s === 5) {
      // Map 5: Forest — Dense emerald cathedral canopy, deep shadows, no visible sky
      this.ambientLight.color.setHex(0x14532d);
      this.ambientLight.intensity = 2.4;
      this.sunLight.color.setHex(0x4ade80);
      this.sunLight.intensity = 2.2;
      this.sunLight.position.set(-20, 50, -20);
      this.hemiLight.color.setHex(0x166534);
      this.hemiLight.groundColor.setHex(0x052e16);
      this.scene.background = new THREE.Color(0x052e16);
      this.scene.fog = new THREE.FogExp2(0x052e16, 0.0032);
    } else if (s === 6) {
      // Map 6: Autumn — Golden twilight sunset, amber leaves & warm evening atmosphere
      this.ambientLight.color.setHex(0xffedd5);
      this.ambientLight.intensity = 2.7;
      this.sunLight.color.setHex(0xf97316);
      this.sunLight.intensity = 3.4;
      this.sunLight.position.set(60, 45, -40);
      this.hemiLight.color.setHex(0xf97316);
      this.hemiLight.groundColor.setHex(0x78350f);
      this.scene.background = new THREE.Color(0xf97316);
      this.scene.fog = new THREE.FogExp2(0xc2410c, 0.0016);
    } else if (s === 7) {
      // Map 7: City Night — Deep midnight metropolis, glowing neon skyscraper lights
      this.ambientLight.color.setHex(0x1e293b);
      this.ambientLight.intensity = 1.8;
      this.sunLight.color.setHex(0x38bdf8);
      this.sunLight.intensity = 1.5;
      this.sunLight.position.set(0, 80, 0);
      this.hemiLight.color.setHex(0x0284c7);
      this.hemiLight.groundColor.setHex(0x0f172a);
      this.scene.background = new THREE.Color(0x030712);
      this.scene.fog = new THREE.FogExp2(0x0f172a, 0.0014);
    } else if (s === 8) {
      // Map 8: Coastal Marine Drive — Tropical sunny azure sky, ocean breeze & sea foam mist
      this.ambientLight.color.setHex(0xe0f2fe);
      this.ambientLight.intensity = 2.6;
      this.sunLight.color.setHex(0xfffbe8);
      this.sunLight.intensity = 3.5;
      this.sunLight.position.set(50, 60, -30);
      this.hemiLight.color.setHex(0x38bdf8);
      this.hemiLight.groundColor.setHex(0x1e6b2c);
      this.scene.background = new THREE.Color(0x38bdf8);
      this.scene.fog = new THREE.FogExp2(0x7dd3fc, 0.0016);
    } else if (s === 9) {
      // Map 9: Amazon Rainforest — Primeval tropical jungle on both sides
      this.ambientLight.color.setHex(0xe0f2fe);
      this.ambientLight.intensity = 2.6;
      this.sunLight.color.setHex(0xfffbe8);
      this.sunLight.intensity = 3.5;
      this.sunLight.position.set(-40, 70, -20);
      this.hemiLight.color.setHex(0x38bdf8);
      this.hemiLight.groundColor.setHex(0x1e6b2c);
      this.scene.background = new THREE.Color(0x38bdf8);
      this.scene.fog = new THREE.FogExp2(0x7dd3fc, 0.0012);
    } else if (s === 10) {
      // Map 10: Taj Mahal — Warm sunrise light, ivory marble reflection & golden hue
      this.ambientLight.color.setHex(0xfff1e6);
      this.ambientLight.intensity = 2.8;
      this.sunLight.color.setHex(0xfef08a);
      this.sunLight.intensity = 3.6;
      this.sunLight.position.set(40, 65, -30);
      this.hemiLight.color.setHex(0xfde047);
      this.hemiLight.groundColor.setHex(0x991b1b);
      this.scene.background = new THREE.Color(0xfef3c7);
      this.scene.fog = new THREE.FogExp2(0xfde68a, 0.0010);
    } else {
      // Map 1: Suburb — Sunlit morning suburban highway
      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 2.6;
      this.sunLight.color.setHex(0xfff6e6);
      this.sunLight.intensity = 3.2;
      this.sunLight.position.set(30, 70, -20);
      this.hemiLight.color.setHex(0x87ceeb);
      this.hemiLight.groundColor.setHex(0x4ade80);
      this.scene.background = new THREE.Color(0x87ceeb);
      this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0012);
    }
  }

  startRace(stage = null) {
    if (stage !== null && stage !== undefined) {
      this.currentStage = Number(stage);
      storage.career.selectedStage = this.currentStage;
      storage.save();
    } else {
      this.currentStage = storage.career.selectedStage || 1;
    }

    this.gameMode = storage.career.gameMode || 'endless';
    this.timeTrialRemaining = 100.0;
    this.wrongWayTimer = 0;
    this.wrongWayBonusCash = 0;

    this.isActive = true;
    this.isPaused = false;
    this.gameOverTriggered = false;
    this.victoryTriggered = false;
    this.lives = 3;
    this.invincibleTimer = 0;
    this.fuel = 100.0;
    this.fuelLimpWarningShown = false;
    this.nitroCount = 1;
    this.nitroTimer = 0;
    this.stationNearby = false;
    this.refuelCount = 0;
    this.nitroUsedCount = 0;
    this.raceStartTime = performance.now();
    this.raceElapsedTime = 0;
    this.runCashEarned = 0;
    if (this.physics) this.physics.maxSpeedCap = null;
    this.updateLivesHUD();
    this.updateFuelHUD();
    this.updateNitroHUD();

    // Reload equipped car
    if (this.playerCar) this.scene.remove(this.playerCar.mesh);
    const equippedType = storage.career.equippedCar || 'car_01';
    const carData = VEHICLES_CATALOG.find(c => c.id === equippedType) || VEHICLES_CATALOG[0];
    const defaultColor = storage.career.paintColor || carData.defaultColor;
    const wheelType = storage.career.wheelType || 'sport_5spoke';

    this.playerCar = new CarModel({ type: equippedType, color: defaultColor, wheelType, isPlayer: true });
    this.playerCar.mesh.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    this.scene.add(this.playerCar.mesh);

    this.physics.carModel = this.playerCar;
    this.physics.reset();
    this.physics.updateCamera(this.camera, 1.0);

    this.currentBiomeStage = 1;
    this.applyStageAtmosphere(1);

    // Reset infinite chunk manager
    this.highway.reset(this.physics.z, 1);

    // Configure traffic for game mode
    this.traffic.setGameMode(this.gameMode);
    this.traffic.spawnInitialTraffic(this.physics.z);

    // Update HUD Mode displays
    const modePill = document.getElementById('tr-hud-mode-pill');
    if (modePill) {
      const modeNames = {
        endless: 'ONE-WAY ENDLESS',
        two_way: 'TWO-WAY TRAFFIC',
        time_trial: 'TIME TRIAL (100S)',
        free_ride: 'FREE RIDE'
      };
      modePill.textContent = modeNames[this.gameMode] || 'ENDLESS';
    }

    const timerBox = document.getElementById('tr-box-timer');
    if (timerBox) {
      timerBox.style.display = (this.gameMode === 'time_trial') ? 'flex' : 'none';
    }

    const wrongWayAlert = document.getElementById('hud-wrong-way-alert');
    if (wrongWayAlert) wrongWayAlert.style.display = 'none';

    // Hide Game Over, Victory, Station & Pause modals
    const goModal = document.getElementById('hud-gameover-banner');
    if (goModal) goModal.style.display = 'none';
    const vicModal = document.getElementById('hud-victory-banner');
    if (vicModal) vicModal.style.display = 'none';
    const pauseModal = document.getElementById('hud-pause-modal');
    if (pauseModal) pauseModal.style.display = 'none';
    const stationPrompt = document.getElementById('hud-station-prompt');
    if (stationPrompt) stationPrompt.style.display = 'none';

    audio.startEngine();
  }

  stopRace() {
    this.isActive = false;
    this.isPaused = false;
    audio.stopEngine();
    const pauseModal = document.getElementById('hud-pause-modal');
    if (pauseModal) pauseModal.style.display = 'none';
    const stationPrompt = document.getElementById('hud-station-prompt');
    if (stationPrompt) stationPrompt.style.display = 'none';
  }

  update(deltaTime) {
    if (!this.isActive || this.isPaused) return;

    if (!this.victoryTriggered && !this.gameOverTriggered) {
      this.raceElapsedTime += deltaTime;
    }

    // Handle invulnerability / shield recovery flashing
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= deltaTime;
      if (this.playerCar && this.playerCar.mesh) {
        this.playerCar.mesh.visible = (this.invincibleTimer <= 0) || (Math.floor(Date.now() / 90) % 2 === 0);
      }
    } else if (this.playerCar && this.playerCar.mesh && !this.playerCar.mesh.visible) {
      this.playerCar.mesh.visible = true;
    }

    // Smoothly decelerate into finish garage if expedition conquered
    if (this.victoryTriggered) {
      this.physics.speed = Math.max(0, this.physics.speed - 40 * deltaTime);
    }

    const inputs = this.input.getInputs();

    // 1. Nitro input engagement & 5-second countdown timer
    if (inputs.nitro && this.nitroCount > 0 && this.nitroTimer <= 0) {
      this.activateNitro();
    }

    if (this.nitroTimer > 0) {
      this.nitroTimer = Math.max(0, this.nitroTimer - deltaTime);
      if (this.nitroTimer <= 0) {
        this.camera.fov = 56;
        this.camera.updateProjectionMatrix();
        this.updateNitroHUD();
      } else {
        this.camera.fov = 65;
        this.camera.updateProjectionMatrix();
        // Give strong forward pull during nitro
        this.physics.speed = Math.max(this.physics.speed, 208);
      }
    }

    // 2. Realistic Fuel Consumption & Zero-Fuel 50 km/h Limp Mode
    if (this.physics.speed > 5 && this.fuel > 0) {
      const burnRate = 0.32 + (this.physics.speed / 120) * 0.42;
      this.fuel = Math.max(0, this.fuel - burnRate * deltaTime);
      this.updateFuelHUD();
    }

    if (this.fuel <= 0) {
      this.fuel = 0;
      this.physics.maxSpeedCap = 50; // Zero fuel reduces car's top speed to 50 km/h only!
      if (this.physics.speed > 50) {
        this.physics.speed = Math.max(50, this.physics.speed - 36 * deltaTime);
      }
      if (!this.fuelLimpWarningShown) {
        this.fuelLimpWarningShown = true;
        this.showCallout('⚠️ FUEL EMPTY! 50 KM/H LIMP MODE — DRIVE TO NEXT PITSTOP (1KM)!');
      }
      this.updateFuelHUD();
    } else {
      this.fuelLimpWarningShown = false;
      this.physics.maxSpeedCap = null;
    }

    // 3. Roadside 1 KM Gas Station Pitstop Detection (Prompt shows within 55m of 1km station)
    const currentKM = Math.round(this.physics.z / 1000);
    const distToStation = Math.abs(this.physics.z - currentKM * 1000);
    const isNearStation = currentKM > 0 && currentKM < 50 && (currentKM % 5 !== 0) && distToStation <= 55;
    if (isNearStation !== this.stationNearby) {
      this.stationNearby = isNearStation;
      const stationPrompt = document.getElementById('hud-station-prompt');
      if (stationPrompt) stationPrompt.style.display = isNearStation ? 'flex' : 'none';
    }

    this.physics.update(inputs, deltaTime, this.camera);

    // Feed player X position to traffic system
    this.traffic.setPlayerPosition(this.physics.x);

    // Update traffic cars
    this.traffic.update(deltaTime, this.physics.z, this.physics.speed);

    // Update infinite highway chunks & garage rollup blast door
    this.highway.update(this.physics.z, deltaTime);

    // Keep sunlight and shadow frustum centered smoothly over player car and active road
    if (this.sunLight) {
      this.sunLight.position.set(this.physics.x + 30, 65, this.physics.z - 20);
      this.sunLight.target.position.set(this.physics.x, 0, this.physics.z + 12);
      this.sunLight.target.updateMatrixWorld();
    }

    // Mode-specific logic:
    // 1. Two-Way Oncoming Lane Streaming Bonus
    // When driving in the opposite lane (X > 0, screen-left) at speed > 45 km/h
    const wrongWayAlert = document.getElementById('hud-wrong-way-alert');
    if (this.gameMode === 'two_way' && this.physics.x > 0 && this.physics.speed > 45) {
      if (wrongWayAlert) wrongWayAlert.style.display = 'block';
      this.wrongWayTimer += deltaTime;
      if (this.wrongWayTimer >= 0.5) {
        this.wrongWayTimer = 0;
        this.physics.score += 40;
        this.wrongWayBonusCash += 15;
        this.runCashEarned += 15;
        storage.stats.cash = (storage.stats.cash || 0) + 15;
        storage.save();
        this.showCallout('⚡ OPPOSITE LANE BONUS: +40 PTS / +$15');
      }
    } else {
      if (wrongWayAlert) wrongWayAlert.style.display = 'none';
    }

    // 2. Time Trial Countdown
    if (this.gameMode === 'time_trial' && !this.physics.isCrashed) {
      this.timeTrialRemaining = Math.max(0, this.timeTrialRemaining - deltaTime);
      const timerVal = document.getElementById('tr-hud-timer');
      if (timerVal) timerVal.textContent = this.timeTrialRemaining.toFixed(1);

      if (this.timeTrialRemaining <= 0) {
        this.physics.triggerCrash();
        this.onGameOver('TIME EXPIRED!');
      }
    }

    // 3. Collision Handling with Civilian Traffic (Nitro Ram Immunity & 3 Lives)
    if (!this.physics.isCrashed && !this.victoryTriggered) {
      if (this.invincibleTimer <= 0) {
        const col = this.traffic.checkCollision(this.physics.getBoundingBox());
        if (col.hit) {
          if (this.nitroTimer > 0) {
            // NITRO CRASH IMMUNITY: Crashes do not cost lives while on nitro!
            audio.playCrashSound();
            this.physics.shakeCamera(0.45);
            this.physics.score += 500;
            this.runCashEarned += 100;
            storage.stats.cash = (storage.stats.cash || 0) + 100;
            storage.save();
            this.traffic.clearNearbyVehicles(this.physics.z, 32);
            this.showCallout('💥 NITRO SHIELD RAM! (-0 LIVES) +500 PTS');
          } else if (this.gameMode === 'free_ride' || this.physics.speed < 48) {
            // Slow-speed crash forgiveness (<48 km/h or Free Ride mode)
            this.physics.speed = Math.max(0, this.physics.speed - 24);
            this.physics.shakeCamera(0.24);
            audio.playCrashSound();
            this.showCallout(this.gameMode === 'free_ride' ? 'BUMP! FREE RIDE SHIELD' : 'BUMP! SLOW SPEED IMPACT');
            this.physics.z -= 1.8;
            if (col.hitVehicle) {
              this.physics.x += (this.physics.x >= col.hitVehicle.x ? 0.8 : -0.8);
            }
          } else {
            // Lethal crash: consume 1 life
            this.lives--;
            this.updateLivesHUD();
            audio.playCrashSound();
            this.physics.shakeCamera(0.6);

            if (this.lives > 0) {
              // Chances remain! Grant temporary shield and clear immediate traffic
              this.invincibleTimer = 2.8;
              this.physics.speed = Math.min(this.physics.speed, 50);
              this.traffic.clearNearbyVehicles(this.physics.z, 35);
              const chancesWord = this.lives === 1 ? '1 CHANCE REMAINING!' : `${this.lives} CHANCES REMAINING!`;
              this.showCallout(`💥 CRASH! ${chancesWord}`);
            } else {
              // 0 lives left -> Game Over
              this.physics.triggerCrash();
              this.onGameOver('OUT OF LIVES! CRASHED!');
            }
          }
        }
      }
    }

    // 4. Grand Finish Garage Arrival at 50 KM (Map 10 Taj Mahal ends at 50 KM)
    if (this.physics.z >= 50000 && !this.victoryTriggered && !this.physics.isCrashed) {
      this.victoryTriggered = true;
      this.onVictoryFinish();
    }

    // 5. Unified Continuous 5 KM Biome Transition (Maps 1 to 10 Indian States)
    const distKM = this.physics.distance / 1000;
    const activeStage = Math.min(10, Math.floor(distKM / 5.0) + 1);
    if (activeStage !== this.currentBiomeStage && distKM < 50.0) {
      this.currentBiomeStage = activeStage;
      this.applyStageAtmosphere(activeStage);

      // Milestone Bonus
      const bonusScore = 1500;
      const bonusCash = 500;
      this.physics.score += bonusScore;
      this.runCashEarned += bonusCash;
      storage.stats.cash = (storage.stats.cash || 0) + bonusCash;
      storage.save();

      const st = INDIAN_STATES[activeStage] || { name: `STATE ${activeStage}`, title: '' };
      this.showCallout(`🎉 ${Math.floor(distKM)} KM MILESTONE! ENTERING ${st.name} (${st.title}) (+${bonusScore} PTS / +$${bonusCash})`);
    }

    // Audio engine pitch
    audio.updateEngine(this.physics.speed, false);

    // Update Traffic Racer HUD
    this.updateHUD();
  }

  showCallout(text) {
    const callout = document.getElementById('hud-drift-status');
    if (callout) {
      callout.textContent = text;
      callout.style.opacity = '1';
      callout.style.color = '#ffd60a';
      setTimeout(() => {
        if (callout) callout.style.opacity = '0';
      }, 1200);
    }
  }

  onVictoryFinish() {
    console.log('🏆 50 KM CONQUERED! ENTERING GRAND FINISH GARAGE!');
    audio.playNitroSound();

    // Trigger industrial rollup blast door to close behind car
    if (this.highway && typeof this.highway.closeGarageDoor === 'function') {
      this.highway.closeGarageDoor();
    }

    this.showCallout('🏁 50 KM REACHED! GARAGE DOORS CLOSING!');

    const finalScore = Math.floor(this.physics.score) + 10000;
    const overtakes = this.physics.closeOvertakes;
    const completionBonus = 10000;
    const finalCashEarned = this.runCashEarned + completionBonus;

    storage.stats.cash = (storage.stats.cash || 0) + completionBonus;
    storage.recordRunStats({
      score: finalScore,
      distanceKM: 50.0,
      topSpeed: Math.round(this.physics.speed),
      overtakes: overtakes,
      cashEarned: finalCashEarned,
      racesWon: (storage.stats.racesWon || 0) + 1
    });

    const totalSeconds = Math.max(1, Math.round(this.raceElapsedTime));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    setTimeout(() => {
      const vicModal = document.getElementById('hud-victory-banner');
      if (vicModal) {
        vicModal.style.display = 'flex';
        const overtakesEl = document.getElementById('vic-final-overtakes');
        const refuelsEl = document.getElementById('vic-final-refuels');
        const nitrosEl = document.getElementById('vic-final-nitros');
        const cashEl = document.getElementById('vic-final-cash');
        const timeEl = document.getElementById('vic-final-time');

        if (overtakesEl) overtakesEl.textContent = `${overtakes}`;
        if (refuelsEl) refuelsEl.textContent = `${this.refuelCount}`;
        if (nitrosEl) nitrosEl.textContent = `${this.nitroUsedCount}`;
        if (cashEl) cashEl.textContent = `+$${finalCashEarned.toLocaleString()}`;
        if (timeEl) timeEl.textContent = formattedTime;
      }
    }, 1400);
  }

  updateLivesHUD() {
    const container = document.getElementById('tr-hud-lives');
    if (!container) return;
    const hearts = container.querySelectorAll('.life-heart');
    for (let i = 0; i < 3; i++) {
      if (hearts[i]) {
        if (i < this.lives) {
          hearts[i].textContent = '❤️';
          hearts[i].classList.remove('lost');
          hearts[i].classList.add('active');
        } else {
          hearts[i].textContent = '💔';
          hearts[i].classList.remove('active');
          hearts[i].classList.add('lost');
        }
      }
    }
  }

  onGameOver(reason = 'JOURNEY OVER') {
    if (this.gameOverTriggered) return;
    this.gameOverTriggered = true;
    audio.stopSiren();

    const finalScore = Math.floor(this.physics.score);
    const finalDist = (this.physics.distance / 1000).toFixed(2);
    const overtakes = this.physics.closeOvertakes;
    const cashEarned = this.runCashEarned;

    // Save all run data permanently to browser localStorage
    storage.recordRunStats({
      score: finalScore,
      distanceKM: Number(finalDist),
      topSpeed: Math.round(this.physics.speed),
      overtakes: overtakes,
      cashEarned: cashEarned
    });

    // Show Traffic Racer Game Over Modal
    setTimeout(() => {
      const goModal = document.getElementById('hud-gameover-banner');
      if (goModal) {
        goModal.style.display = 'flex';
        const titleEl = goModal.querySelector('.tr-go-title');
        if (titleEl) titleEl.textContent = reason;

        const scoreEl = document.getElementById('go-final-score');
        const distEl = document.getElementById('go-final-dist');
        const overtakesEl = document.getElementById('go-final-overtakes');
        const cashEl = document.getElementById('go-final-cash');

        if (scoreEl) scoreEl.textContent = `${finalScore}`;
        if (distEl) distEl.textContent = `${finalDist} KM`;
        if (overtakesEl) overtakesEl.textContent = `${overtakes}`;
        if (cashEl) cashEl.textContent = `+$${cashEarned.toLocaleString()}`;
      }
    }, 1200);
  }

  activateNitro() {
    if (this.nitroCount <= 0 || this.nitroTimer > 0) return;
    this.nitroCount--;
    this.nitroTimer = 5.0;
    this.nitroUsedCount++;
    this.updateNitroHUD();
    audio.playNitroSound();
    this.physics.speed = Math.min(235, this.physics.speed + 48);
    this.showCallout('🔥 NITRO ENGAGED! 5S SPEED BOOST & SHIELD');
  }

  refuelVehicle() {
    if ((storage.stats.cash || 0) < 100) {
      this.showCallout('❌ NOT ENOUGH CASH ($100 REQUIRED)');
      return;
    }
    storage.stats.cash = (storage.stats.cash || 0) - 100;
    storage.save();
    this.fuel = 100.0;
    this.refuelCount++;
    this.fuelLimpWarningShown = false;
    if (this.physics) this.physics.maxSpeedCap = null;
    this.updateFuelHUD();
    audio.playNitroSound();
    this.showCallout('⛽ FULL TANK REFUELED! -$100 (100% FUEL)');
  }

  buyNitro() {
    if (this.nitroCount >= 2) {
      this.showCallout('⚠️ NITRO INVENTORY FULL (MAX 2 CANISTERS)');
      return;
    }
    if ((storage.stats.cash || 0) < 300) {
      this.showCallout('❌ NOT ENOUGH CASH ($300 REQUIRED)');
      return;
    }
    storage.stats.cash = (storage.stats.cash || 0) - 300;
    storage.save();
    this.nitroCount++;
    this.updateNitroHUD();
    audio.playNitroSound();
    this.showCallout(`🔥 NITRO CANISTER PURCHASED! -$300 [${this.nitroCount}/2]`);
  }

  pauseGame() {
    if (!this.isActive || this.gameOverTriggered || this.victoryTriggered) return;
    this.isPaused = true;
    audio.stopEngine();

    const pauseModal = document.getElementById('hud-pause-modal');
    if (pauseModal) {
      pauseModal.style.display = 'flex';
      const locEl = document.getElementById('pause-location');
      const distEl = document.getElementById('pause-dist');
      const scoreEl = document.getElementById('pause-score');
      const fuelEl = document.getElementById('pause-fuel');

      const st = INDIAN_STATES[this.currentBiomeStage || 1] || { name: 'PUNJAB' };
      if (locEl) locEl.textContent = `${st.name}`;
      if (distEl) distEl.textContent = `${(this.physics.distance / 1000).toFixed(2)} KM`;
      if (scoreEl) scoreEl.textContent = `${Math.floor(this.physics.score)}`;
      if (fuelEl) fuelEl.textContent = `${Math.round(this.fuel)}%`;
    }
  }

  resumeGame() {
    this.isPaused = false;
    const pauseModal = document.getElementById('hud-pause-modal');
    if (pauseModal) pauseModal.style.display = 'none';
    audio.startEngine();
  }

  restartGame() {
    const pauseModal = document.getElementById('hud-pause-modal');
    if (pauseModal) pauseModal.style.display = 'none';
    this.isPaused = false;
    this.startRace(this.currentStage || 1);
  }

  updateFuelHUD() {
    const fuelFill = document.getElementById('tr-hud-fuel-fill');
    const fuelPct = document.getElementById('tr-hud-fuel-pct');
    const roundedFuel = Math.round(this.fuel);
    if (fuelPct) {
      if (roundedFuel <= 0) {
        fuelPct.textContent = '0% (50 KM/H LIMP)';
      } else {
        fuelPct.textContent = `${roundedFuel}%`;
      }
    }
    if (fuelFill) {
      fuelFill.style.width = `${Math.max(4, roundedFuel)}%`;
      if (roundedFuel <= 0) {
        fuelFill.style.backgroundColor = '#ef4444';
      } else if (roundedFuel < 20) {
        fuelFill.style.backgroundColor = '#ef4444';
      } else if (roundedFuel < 45) {
        fuelFill.style.backgroundColor = '#f59e0b';
      } else {
        fuelFill.style.backgroundColor = '#10b981';
      }
    }
  }

  updateNitroHUD() {
    const nitroCountEl = document.getElementById('tr-hud-nitro-count');
    if (nitroCountEl) {
      if (this.nitroTimer > 0) {
        nitroCountEl.textContent = `BURNING (${this.nitroTimer.toFixed(1)}S)`;
      } else {
        nitroCountEl.textContent = `${this.nitroCount}/2`;
      }
    }
    const slot1 = document.getElementById('nitro-slot-1');
    const slot2 = document.getElementById('nitro-slot-2');
    if (slot1) {
      if (this.nitroCount >= 1 || this.nitroTimer > 0) {
        slot1.textContent = '🔥';
        slot1.className = 'nitro-can active';
      } else {
        slot1.textContent = '⭕';
        slot1.className = 'nitro-can empty';
      }
    }
    if (slot2) {
      if (this.nitroCount >= 2) {
        slot2.textContent = '🔥';
        slot2.className = 'nitro-can active';
      } else {
        slot2.textContent = '⭕';
        slot2.className = 'nitro-can empty';
      }
    }
  }

  updateHUD() {
    const scoreVal = document.getElementById('tr-hud-score');
    const speedVal = document.getElementById('tr-hud-speed');
    const distVal = document.getElementById('tr-hud-dist');

    if (scoreVal) scoreVal.textContent = Math.floor(this.physics.score);
    if (speedVal) speedVal.textContent = Math.round(this.physics.speed);
    if (distVal) distVal.textContent = (this.physics.distance / 1000).toFixed(2);

    const distKM = this.physics.distance / 1000;
    const activeStage = this.currentBiomeStage || 1;
    const biomePill = document.getElementById('tr-hud-biome-pill');
    if (biomePill) {
      const curState = INDIAN_STATES[activeStage] || { name: 'PUNJAB' };
      if (distKM >= 50.0) {
        biomePill.textContent = '🏁 GRAND FINISH GARAGE • 50.0 KM CONQUERED!';
      } else if (activeStage === 10) {
        const kmInStage = (distKM % 5.0).toFixed(1);
        biomePill.textContent = `MAP 10: ${curState.name} • [${kmInStage} / 5.0 KM ➔ FINISH GARAGE 🏁]`;
      } else {
        const kmInStage = (distKM % 5.0).toFixed(1);
        const nextState = INDIAN_STATES[activeStage + 1] || { name: 'NEXT' };
        biomePill.textContent = `MAP 0${activeStage}: ${curState.name} • [${kmInStage} / 5.0 KM ➔ ${nextState.name}]`;
      }
    }

    // Update real-time Top-Right Route Minimap
    this.updateMinimap();
  }

  updateMinimap() {
    const canvas = document.getElementById('tr-minimap-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const totalDistKM = 50.0;
    const distKM = Math.min(totalDistKM, Math.max(0, this.physics.distance / 1000));
    const remKM = Math.max(0, totalDistKM - distKM);

    const destLabel = document.getElementById('tr-minimap-dest-dist');
    if (destLabel) {
      destLabel.textContent = remKM <= 0 ? '🏁 FINISH GARAGE' : `${remKM.toFixed(1)} KM DEST`;
    }

    const padLeft = 14;
    const padRight = 16;
    const trackY = Math.round(h / 2);
    const trackWidth = w - padLeft - padRight;

    // 1. Route Path - Expressway Route Track
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(padLeft, trackY);
    ctx.lineTo(padLeft + trackWidth, trackY);
    ctx.stroke();

    // 2. Completed Route Line (Gold to Cyan Gradient)
    const progressRatio = Math.min(1.0, distKM / totalDistKM);
    const progressX = padLeft + progressRatio * trackWidth;

    const grad = ctx.createLinearGradient ? ctx.createLinearGradient(padLeft, trackY, progressX, trackY) : null;
    if (grad) {
      grad.addColorStop(0, '#ffd200');
      grad.addColorStop(1, '#00f0ff');
      ctx.strokeStyle = grad;
    } else {
      ctx.strokeStyle = '#ffd200';
    }
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(padLeft, trackY);
    ctx.lineTo(progressX, trackY);
    ctx.stroke();

    // 3. Remaining Route Line (Dashed)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 2;
    if (ctx.setLineDash) ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(progressX, trackY);
    ctx.lineTo(padLeft + trackWidth, trackY);
    ctx.stroke();
    if (ctx.setLineDash) ctx.setLineDash([]);

    // 4. Milestone Checkpoints Points (10 Indian States @ 5km intervals)
    for (let s = 1; s <= 9; s++) {
      const sx = padLeft + (s / 10) * trackWidth;
      ctx.fillStyle = distKM >= s * 5.0 ? '#38bdf8' : 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(sx, trackY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Start Point (0 KM)
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(padLeft, trackY, 3, 0, Math.PI * 2);
    ctx.fill();

    // 6. Destination Point (50 KM / Taj Mahal Finish Garage)
    const destX = padLeft + trackWidth;
    const pulse = (Math.sin(Date.now() / 250) + 1) * 1.5;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(destX, trackY, 4.5 + pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(destX, trackY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏁', destX, trackY - 6);

    // 7. Player Car Point (Moving Beacon with Heading Arrow)
    const pPulse = (Math.sin(Date.now() / 180) + 1) * 2;
    ctx.fillStyle = 'rgba(255, 210, 0, 0.35)';
    ctx.beginPath();
    ctx.arc(progressX, trackY, 6 + pPulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffd200';
    ctx.beginPath();
    ctx.arc(progressX, trackY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(progressX, trackY, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffd200';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('▲', progressX, trackY - 6);
  }

  onResize() {
    if (this.camera && typeof window !== 'undefined') {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }
  }

  render(renderer) {
    if (renderer && this.scene && this.camera) {
      renderer.render(this.scene, this.camera);
    }
  }
}
