/**
 * main.js - Application entry point.
 * Coordinates Three.js WebGL renderer, garage showroom,
 * race engine, multiplayer synchronization, and UI lifecycle.
 */

import * as THREE from 'three';
import { storage } from './core/Storage.js';
import { audio } from './core/Audio.js';
import { input } from './core/Input.js';
import { UIManager } from './ui/UIManager.js';
import { TrackManager } from './tracks/TrackManager.js';
import { RaceEngine } from './game/RaceEngine.js';
import { FirebaseManager } from './multiplayer/FirebaseManager.js';
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
    this.firebase = null;

    // Showroom / Garage inspection
    this.garageVehicle = null;
    this.garageRotationAngle = 0;
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
    this.firebase = new FirebaseManager(this);

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

    // 4. Bind Events & Callbacks
    this.bindWindowEvents();
    this.bindGarageInteractions();
    this.bindMultiplayerUI();

    // 5. Initial State: Load default track and showcase car
    this.trackManager.loadTrack(storage.progress.selectedTrack || 'goa_marine', quality);
    this.showcaseGarageCar(storage.progress.selectedCar || 'viper_gtr');

    // Start background synth audio on first user gesture
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
    // Reset camera position for cinematic sweep
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

  /* ---------------- MULTIPLAYER BINDINGS ---------------- */
  bindMultiplayerUI() {
    const mpEntry = document.getElementById('mp-entry-view');
    const mpLobby = document.getElementById('mp-lobby-view');
    const btnCreate = document.getElementById('btn-create-room');
    const btnJoin = document.getElementById('btn-join-room');
    const inputCode = document.getElementById('input-room-code');
    const btnCopy = document.getElementById('btn-copy-code');
    const btnReady = document.getElementById('btn-lobby-ready');
    const btnStart = document.getElementById('btn-lobby-start');
    const btnLeave = document.getElementById('btn-lobby-leave');

    const p1Name = document.getElementById('lobby-p1-name');
    const p1Car = document.getElementById('lobby-p1-car');
    const p1Ready = document.getElementById('lobby-p1-ready');

    const p2Name = document.getElementById('lobby-p2-name');
    const p2Car = document.getElementById('lobby-p2-car');
    const p2Ready = document.getElementById('lobby-p2-ready');

    const lobbyTrackSelect = document.getElementById('lobby-track-select');
    const lobbyStatusBadge = document.getElementById('lobby-status-badge');
    const lobbyRoomCode = document.getElementById('lobby-room-code');

    // Toggle Firebase Config Box
    const btnToggleFb = document.getElementById('btn-toggle-fb-config');
    const panelFb = document.getElementById('mp-fb-config-panel');
    const txtFbConfig = document.getElementById('fb-config-input');
    const btnSaveFb = document.getElementById('btn-save-fb-config');
    const btnDemoFb = document.getElementById('btn-demo-fb-mode');

    btnToggleFb.addEventListener('click', () => {
      panelFb.classList.toggle('hidden');
    });

    btnSaveFb.addEventListener('click', () => {
      try {
        const val = JSON.parse(txtFbConfig.value);
        this.firebase.saveCustomConfig(val);
        alert('Firebase configuration saved successfully!');
        panelFb.classList.add('hidden');
      } catch (e) {
        alert('Invalid JSON config format. Please check the object.');
      }
    });

    btnDemoFb.addEventListener('click', () => {
      this.firebase.enableSimulatedMode();
      alert('Simulated 1v1 mode activated! You can now create and test rooms without Firebase setup.');
      panelFb.classList.add('hidden');
    });

    // Create Room
    btnCreate.addEventListener('click', async () => {
      const name = document.getElementById('mp-player-name').value;
      const res = await this.firebase.createRoom(name, storage.progress.selectedCar, lobbyTrackSelect.value);
      if (res.success) {
        mpEntry.classList.add('hidden');
        mpLobby.classList.remove('hidden');
        lobbyRoomCode.textContent = res.roomCode;
        p1Name.textContent = name;
        const car = getCarById(storage.progress.selectedCar);
        p1Car.textContent = `Car: ${car.name}`;
        lobbyTrackSelect.disabled = false;
      } else {
        alert(`Failed to create room: ${res.error}`);
      }
    });

    // Join Room
    btnJoin.addEventListener('click', async () => {
      const code = inputCode.value;
      if (!code || code.length < 4) {
        alert('Please enter a valid 6-character room code.');
        return;
      }
      const name = document.getElementById('mp-player-name').value;
      const res = await this.firebase.joinRoom(code, name, storage.progress.selectedCar);
      if (res.success) {
        mpEntry.classList.add('hidden');
        mpLobby.classList.remove('hidden');
        lobbyRoomCode.textContent = code.toUpperCase();
        p2Name.textContent = name;
        const car = getCarById(storage.progress.selectedCar);
        p2Car.textContent = `Car: ${car.name}`;
        lobbyTrackSelect.disabled = true; // Guest cannot change track
      } else {
        alert(res.error);
      }
    });

    // Copy Code Button
    btnCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(lobbyRoomCode.textContent).then(() => {
        btnCopy.textContent = 'COPIED!';
        setTimeout(() => { btnCopy.textContent = 'COPY'; }, 1500);
      });
    });

    // Leave Room
    btnLeave.addEventListener('click', async () => {
      await this.firebase.leaveRoom();
      mpLobby.classList.add('hidden');
      mpEntry.classList.remove('hidden');
    });

    // Start Race
    btnStart.addEventListener('click', () => {
      this.firebase.startMatch();
    });

    // Firebase Room Updates listener
    this.firebase.onRoomUpdate = (data) => {
      const players = Object.values(data.players || {});
      const p1 = players.find(p => p.isHost) || players[0];
      const p2 = players.find(p => !p.isHost) || (players.length > 1 ? players[1] : null);

      if (p1) {
        p1Name.textContent = p1.name;
        const c1 = getCarById(p1.carId);
        p1Car.textContent = `Car: ${c1.name}`;
        p1Ready.textContent = p1.ready ? 'READY' : 'NOT READY';
        p1Ready.className = `slot-ready-status ${p1.ready ? 'ready' : ''}`;
      }

      if (p2) {
        p2Name.textContent = p2.name;
        const c2 = getCarById(p2.carId);
        p2Car.textContent = `Car: ${c2.name}`;
        p2Ready.textContent = p2.ready ? 'READY' : 'NOT READY';
        p2Ready.className = `slot-ready-status ${p2.ready ? 'ready' : ''}`;
        lobbyStatusBadge.textContent = 'BOTH RACERS CONNECTED';
        lobbyStatusBadge.className = 'badge-status unlocked';

        // Enable Start for Host if both ready
        if (this.firebase.isHost && p1.ready && p2.ready) {
          btnStart.disabled = false;
          btnStart.classList.remove('disabled');
        } else {
          btnStart.disabled = true;
          btnStart.classList.add('disabled');
        }
      } else {
        p2Name.textContent = 'Waiting for rival...';
        p2Car.textContent = 'Car: --';
        p2Ready.textContent = 'WAITING';
        p2Ready.className = 'slot-ready-status';
        lobbyStatusBadge.textContent = 'WAITING FOR RIVAL...';
        lobbyStatusBadge.className = 'badge-status waiting';
        btnStart.disabled = true;
        btnStart.classList.add('disabled');
      }

      if (data.trackId && !this.firebase.isHost) {
        lobbyTrackSelect.value = data.trackId;
      }
    };

    // Synchronized Countdown Trigger
    this.firebase.onCountdownStarted = () => {
      mpLobby.classList.add('hidden');
      audio.stopBGM();

      // Launch 1v1 Race with Remote Opponent
      const remoteVehicle = new Vehicle(this.scene, 'apex_turbo', false);
      this.raceEngine.startRace({
        trackId: lobbyTrackSelect.value,
        carId: storage.progress.selectedCar,
        difficulty: 'medium',
        laps: 3,
        opponents: 1,
        isMultiplayer: true,
        remotePlayer: remoteVehicle
      });

      // Periodic state sync to Firebase during race
      if (this.mpSyncTimer) clearInterval(this.mpSyncTimer);
      this.mpSyncTimer = setInterval(() => {
        if (this.raceEngine.isActive && this.raceEngine.playerVehicle) {
          this.firebase.sendVehicleState(this.raceEngine.playerVehicle);
        } else {
          clearInterval(this.mpSyncTimer);
        }
      }, 60); // 16.6 updates per second
    };
  }

  /* ---------------- ANIMATION & RENDER LOOP ---------------- */
  animate() {
    requestAnimationFrame(() => this.animate());

    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastTime) / 1000); // Clamped delta-time
    this.lastTime = now;

    // FPS Counter
    this.frameCount++;
    if (now - this.lastFpsUpdate >= 500) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.ui.fpsCounter.textContent = `${fps} FPS`;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    if (this.isPaused) return;

    // 1. In Race: Update Race Engine
    if (this.raceEngine.isActive) {
      this.raceEngine.update(dt);

      // Interpolate remote player if in multiplayer
      if (this.raceEngine.remoteOpponent) {
        this.firebase.interpolateRemoteVehicle(this.raceEngine.remoteOpponent, dt);
      }
    }
    // 2. In Garage: Gentle rotation if not dragging
    else if (this.ui.currentScreenId === 'screen-garage') {
      if (this.garageVehicle && !this.isDraggingGarage) {
        this.garageVehicle.heading += 0.4 * dt;
        this.garageVehicle.group.rotation.y = this.garageVehicle.heading;
      }
    }
    // 3. Main Menu: Cinematic camera orbit around track
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

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Instantiate on window load
window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});
