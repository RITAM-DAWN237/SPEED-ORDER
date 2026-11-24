/**
 * main.js - Application Entry Point for Need for Speed: Speed Order.
 * Initializes Three.js WebGL renderer, showroom, race engine, and UI lifecycle.
 */

import * as THREE from 'three';
import { storage } from './core/Storage.js';
import { audio } from './core/Audio.js';
import { input } from './core/Input.js';
import { UIManager } from './ui/UIManager.js';
import { TrackManager } from './tracks/TrackManager.js';
import { RaceEngine } from './game/RaceEngine.js';
import { Vehicle } from './game/Vehicle.js';
import { CARS, getCarById } from './game/CarCatalog.js';

class GameApp {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.container = document.getElementById('game-container');

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.trackManager = null;
    this.raceEngine = null;
    this.ui = null;

    // Showroom / Garage inspection
    this.garageVehicle = null;
    this.isDraggingGarage = false;
    this.garageDragStartX = 0;

    // Cinematic menu state
    this.menuAngle = 0;
    this.isPaused = false;

    // Performance & FPS tracking
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.lastFpsUpdate = 0;

    this.init();
  }

  init() {
    // 1. Setup Three.js WebGL Renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000);

    const quality = storage.settings.graphicsQuality || 'high';
    const antialias = quality !== 'low';

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias,
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'high' ? 2 : 1) * (storage.settings.resolutionScale || 1.0));
    this.renderer.shadowMap.enabled = quality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Setup Managers
    this.trackManager = new TrackManager(this.scene);
    this.ui = new UIManager(this);
    this.raceEngine = new RaceEngine(this.scene, this.camera, this.ui, this.trackManager);

    // 3. Bind Touch Controls
    input.bindTouchControls({
      btnLeft: document.getElementById('touch-left'),
      btnRight: document.getElementById('touch-right'),
      btnGas: document.getElementById('touch-gas'),
      btnBrake: document.getElementById('touch-brake'),
      btnNitro: document.getElementById('touch-nitro'),
      btnHandbrake: document.getElementById('touch-handbrake')
    });

    // Camera switch callback
    input.onCameraSwitch = () => {
      const newMode = this.raceEngine.cameraFollow.cycleMode();
      storage.saveSettings({ cameraDistance: newMode });
      this.ui.refreshSettingsUI();
    };

    // 4. Bind Events & Interactions
    this.bindWindowEvents();
    this.bindGarageInteractions();

    // 5. Initial State: Load track and showcase car
    const initialTrack = storage.progress.selectedTrack || 'goa_marine';
    const initialCar = storage.progress.selectedCar || 'nissan_skyline';

    // If previously saved car was not in new catalog, set to default
    if (!CARS.find(c => c.id === initialCar)) {
      storage.saveProgress({ selectedCar: 'nissan_skyline', unlockedCars: ['nissan_skyline', 'toyota_supra'] });
    }

    this.trackManager.loadTrack(initialTrack, quality);
    this.showcaseGarageCar(storage.progress.selectedCar || 'nissan_skyline');

    // Start background audio on first user gesture
    const startAudioOnGesture = () => {
      audio.init();
      audio.startBGM();
      window.removeEventListener('pointerdown', startAudioOnGesture);
      window.removeEventListener('keydown', startAudioOnGesture);
    };
    window.addEventListener('pointerdown', startAudioOnGesture);
    window.addEventListener('keydown', startAudioOnGesture);

    // 6. Begin Game Render Loop
    this.animate();
  }

  bindWindowEvents() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      const quality = storage.settings.graphicsQuality || 'high';
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'high' ? 2 : 1) * (storage.settings.resolutionScale || 1.0));
    });
  }

  onResolutionChange(scale) {
    const quality = storage.settings.graphicsQuality || 'high';
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'high' ? 2 : 1) * scale);
  }

  onQualityChange(q) {
    this.renderer.shadowMap.enabled = q !== 'low';
    this.trackManager.loadTrack(storage.progress.selectedTrack || 'goa_marine', q);
  }

  onCameraModeChange(camMode) {
    if (this.raceEngine) {
      this.raceEngine.cameraFollow.setMode(camMode);
    }
  }

  /* ---------------- GARAGE SHOWROOM ---------------- */
  showcaseGarageCar(carId) {
    if (this.garageVehicle) {
      this.garageVehicle.dispose();
      this.garageVehicle = null;
    }

    this.garageVehicle = new Vehicle(this.scene, carId, false);
    this.garageVehicle.respawn(new THREE.Vector3(0, 0, 0), 0);
  }

  onGarageCarChange(carId) {
    this.showcaseGarageCar(carId);
  }

  onEnterGarage(carId) {
    this.showcaseGarageCar(carId);
    this.camera.position.set(0, 2.2, 5.8);
    this.camera.lookAt(0, 0.8, 0);
  }

  onEnterMainMenu() {
    this.camera.position.set(0, 8, 25);
    this.camera.lookAt(0, 2, 0);
  }

  bindGarageInteractions() {
    this.container.addEventListener('pointerdown', (e) => {
      if (this.ui.currentScreenId === 'screen-garage') {
        this.isDraggingGarage = true;
        this.garageDragStartX = e.clientX;
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (this.isDraggingGarage && this.garageVehicle) {
        const deltaX = e.clientX - this.garageDragStartX;
        this.garageDragStartX = e.clientX;
        this.garageVehicle.heading += deltaX * 0.01;
        this.garageVehicle.group.rotation.y = this.garageVehicle.heading;
      }
    });

    window.addEventListener('pointerup', () => {
      this.isDraggingGarage = false;
    });
  }

  /* ---------------- SINGLE PLAYER RACE ---------------- */
  startSinglePlayerRace(config) {
    audio.stopBGM();
    if (this.garageVehicle) {
      this.garageVehicle.dispose();
      this.garageVehicle = null;
    }
    this.raceEngine.startRace(config);
  }

  restartRace() {
    if (this.raceEngine.raceConfig) {
      this.raceEngine.startRace(this.raceEngine.raceConfig);
    }
  }

  endRaceAndReturnToMenu() {
    this.raceEngine.cleanup();
    this.ui.showScreen('screen-main-menu');
    this.showcaseGarageCar(storage.progress.selectedCar);
    audio.startBGM();
  }

  /* ---------------- ANIMATION & RENDER LOOP ---------------- */
  animate() {
    requestAnimationFrame(() => this.animate());

    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    // FPS Counter
    this.frameCount++;
    if (now - this.lastFpsUpdate >= 500) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      if (this.ui.fpsCounter) this.ui.fpsCounter.textContent = `${fps} FPS`;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    if (this.isPaused) return;

    // 1. Race Active
    if (this.raceEngine.isActive) {
      this.raceEngine.update(dt);
    }
    // 2. Garage Showroom
    else if (this.ui.currentScreenId === 'screen-garage') {
      if (this.garageVehicle && !this.isDraggingGarage) {
        this.garageVehicle.heading += 0.4 * dt;
        this.garageVehicle.group.rotation.y = this.garageVehicle.heading;
      }
    }
    // 3. Main Menu Orbit
    else if (this.ui.currentScreenId === 'screen-main-menu') {
      this.menuAngle += 0.2 * dt;
      const camX = Math.sin(this.menuAngle) * 24;
      const camZ = Math.cos(this.menuAngle) * 24;
      this.camera.position.set(camX, 7 + Math.sin(this.menuAngle * 0.5) * 2, camZ);
      this.camera.lookAt(0, 1.5, 0);

      if (this.garageVehicle) {
        this.garageVehicle.heading += 0.3 * dt;
        this.garageVehicle.group.rotation.y = this.garageVehicle.heading;
      }
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Immediate execution resilient to document loading state
function bootApp() {
  new GameApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}
