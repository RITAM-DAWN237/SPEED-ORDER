import * as THREE from 'three';
import { MenuScene } from './scenes/MenuScene.js';
import { RaceScene } from './racing/RaceScene.js';
import { UIManager } from './ui/UIManager.js';
import { audio } from './core/Audio.js';

/**
 * Main Application Orchestrator for SPEED ORDER
 */
function boot() {
  const canvas = document.getElementById('webgl-canvas');
  if (!canvas) {
    console.error('Fatal: #webgl-canvas element not found');
    return;
  }

  // 1. High-Performance Three.js Renderer — Crisp Semi-3D Retro Arcade Engine
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true,
  });

  const resizeRenderer = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
  };

  resizeRenderer();
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // 2. Initialize Scenes
  const menuScene = new MenuScene(canvas);
  const raceScene = new RaceScene(canvas);

  let currentActiveScene = 'menu';

  // 3. Initialize UI & Event Manager
  const uiManager = new UIManager(menuScene, renderer);

  // Auto-unlock Web Audio on first user interaction anywhere on page
  const unlockAudioGesture = () => {
    audio.unlockAudio();
    window.removeEventListener('click', unlockAudioGesture);
    window.removeEventListener('keydown', unlockAudioGesture);
    window.removeEventListener('touchstart', unlockAudioGesture);
  };
  window.addEventListener('click', unlockAudioGesture);
  window.addEventListener('keydown', unlockAudioGesture);
  window.addEventListener('touchstart', unlockAudioGesture);

  // Hook Start Race Button & Unified Journey Launcher
  const racingHud = document.getElementById('racing-hud');
  const uiContainer = document.getElementById('ui-container');

  const launchJourney = (stage = 1) => {
    console.log(`⚡ Launching SPEED ORDER Highway Journey (Map ${stage})...`);
    currentActiveScene = 'race';
    uiContainer.style.display = 'none';
    if (racingHud) racingHud.style.display = 'flex';
    raceScene.startRace(stage);
  };

  uiManager.onLaunchJourney = launchJourney;

  // Pause / Resume / Exit Race
  const btnPause = document.getElementById('btn-hud-pause');
  const returnToMenu = () => {
    console.log('⚡ Returning to Menu...');
    currentActiveScene = 'menu';
    raceScene.stopRace();
    if (racingHud) racingHud.style.display = 'none';
    uiContainer.style.display = 'flex';
    uiManager.showScreen('screen-main-menu');
  };

  if (btnPause) {
    btnPause.addEventListener('click', () => {
      if (currentActiveScene === 'race') {
        if (raceScene.isPaused) {
          raceScene.resumeGame();
        } else {
          raceScene.pauseGame();
        }
      }
    });
  }

  // Proper Pause Menu Modal Buttons (Resume, Restart, Back to Menu)
  const btnPauseResume = document.getElementById('btn-pause-resume');
  if (btnPauseResume) {
    btnPauseResume.addEventListener('click', () => {
      raceScene.resumeGame();
    });
  }

  const btnPauseRestart = document.getElementById('btn-pause-restart');
  if (btnPauseRestart) {
    btnPauseRestart.addEventListener('click', () => {
      raceScene.restartGame();
    });
  }

  const btnPauseMenu = document.getElementById('btn-pause-menu');
  if (btnPauseMenu) {
    btnPauseMenu.addEventListener('click', returnToMenu);
  }

  // 1 KM Pitstop Service Buttons (Refuel $100 & Buy Nitro $300)
  const btnServiceRefuel = document.getElementById('btn-service-refuel');
  if (btnServiceRefuel) {
    btnServiceRefuel.addEventListener('click', () => {
      raceScene.refuelVehicle();
    });
  }

  const btnServiceNitro = document.getElementById('btn-service-nitro');
  if (btnServiceNitro) {
    btnServiceNitro.addEventListener('click', () => {
      raceScene.buyNitro();
    });
  }

  // Retry / Play Again Button (Traffic Racer Game Over)
  const btnRetry = document.getElementById('btn-tr-retry');
  if (btnRetry) {
    btnRetry.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('⚡ Retrying Traffic Racer Highway Journey...');
      const goModal = document.getElementById('hud-gameover-banner');
      if (goModal) goModal.style.display = 'none';
      currentActiveScene = 'race';
      uiContainer.style.display = 'none';
      if (racingHud) racingHud.style.display = 'flex';
      const stage = uiManager.storage.career.selectedStage || 1;
      raceScene.startRace(stage);
    });
  }

  // Garage Continue Button
  const btnVictory = document.getElementById('btn-victory-continue');
  if (btnVictory) {
    btnVictory.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('⚡ Returning to Garage...');
      currentActiveScene = 'menu';
      raceScene.stopRace();
      const goModal = document.getElementById('hud-gameover-banner');
      if (goModal) goModal.style.display = 'none';
      if (racingHud) racingHud.style.display = 'none';
      uiContainer.style.display = 'flex';
      uiManager.showScreen('screen-garage');
    });
  }

  // Grand Victory Modal Buttons (50 KM Finish Garage)
  const btnVicExit = document.getElementById('btn-vic-exit');
  if (btnVicExit) {
    btnVicExit.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('⚡ Returning to Menu from 50 KM Victory...');
      const vicModal = document.getElementById('hud-victory-banner');
      if (vicModal) vicModal.style.display = 'none';
      returnToMenu();
    });
  }

  const btnVicPlayAgain = document.getElementById('btn-vic-play-again');
  if (btnVicPlayAgain) {
    btnVicPlayAgain.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('⚡ Launching Journey Again from 0 KM...');
      const vicModal = document.getElementById('hud-victory-banner');
      if (vicModal) vicModal.style.display = 'none';
      currentActiveScene = 'race';
      uiContainer.style.display = 'none';
      if (racingHud) racingHud.style.display = 'flex';
      raceScene.startRace(1);
    });
  }

  window.addEventListener('keydown', (e) => {
    if (currentActiveScene === 'race') {
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (raceScene.isPaused) {
          raceScene.resumeGame();
        } else {
          raceScene.pauseGame();
        }
      } else if (e.code === 'KeyE') {
        raceScene.refuelVehicle();
      } else if (e.code === 'KeyB') {
        raceScene.buyNitro();
      }
    }
  });

  // Handle window resizing
  window.addEventListener('resize', () => {
    resizeRenderer();
  });

  // 4. Unified Animation Loop
  let lastTime = performance.now();

  function animate(currentTime) {
    requestAnimationFrame(animate);

    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    if (currentActiveScene === 'race') {
      raceScene.update(deltaTime);
      raceScene.render(renderer);
    } else {
      menuScene.update(deltaTime);
      menuScene.render(renderer);
    }
  }

  requestAnimationFrame(animate);
  console.log('⚡ SPEED ORDER — Ready & Armed!');

  // Developer / Automation URL Parameter Hook (for taking rich marketing screenshots)
  try {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const stage = params.get('stage');
    const dist = params.get('dist');
    const car = params.get('car');

    if (car && typeof uiManager.storage.equipCar === 'function') {
      uiManager.storage.equipCar(car);
    }

    if (view === 'garage') {
      uiManager.showScreen('screen-garage');
    } else if (view === 'play' || view === 'roadmap') {
      uiManager.showScreen('screen-play');
    } else if (view === 'race') {
      const startStage = stage ? parseInt(stage, 10) : 1;
      launchJourney(startStage);
      if (dist) {
        const distM = parseFloat(dist) * 1000;
        raceScene.physics.z = distM;
        raceScene.physics.distance = distM;
        raceScene.physics.speed = 185;
      }
    } else if (view === 'victory') {
      launchJourney(10);
      raceScene.physics.z = 50005;
      raceScene.physics.distance = 50005;
      raceScene.refuelCount = 4;
      raceScene.nitroUsedCount = 5;
      raceScene.physics.closeOvertakes = 28;
      raceScene.raceElapsedTime = 724;
      raceScene.runCashEarned = 1860;
      setTimeout(() => {
        raceScene.onVictoryFinish();
      }, 300);
    }

    // Auto-capture screenshot to screenshots folder via /api/save-screenshot
    window.captureScreenshotToFile = async (filename) => {
      try {
        const imageBase64 = canvas.toDataURL('image/png');
        const res = await fetch('/api/save-screenshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename, imageBase64 })
        });
        const result = await res.json();
        console.log('Capture result:', result);
        return result;
      } catch (err) {
        console.warn('Screenshot upload failed:', err);
      }
    };

    // Floating Quick Screenshot Button & F9 key for Advertisement Content Creators
    const btnQuickShot = document.getElementById('btn-quick-screenshot');
    const doQuickScreenshot = async () => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `ad_screenshot_${timestamp}.png`;
      console.log(`📸 Taking screenshot: ${filename}`);

      // 1. Post to Vite server /api/save-screenshot to save in screenshots/ folder
      if (typeof window.captureScreenshotToFile === 'function') {
        await window.captureScreenshotToFile(filename);
      }

      // 2. Also trigger direct browser download so user immediately gets the file
      try {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.warn('Browser direct download fallback:', err);
      }

      if (raceScene && typeof raceScene.showCallout === 'function') {
        raceScene.showCallout(`📸 AD SCREENSHOT SAVED TO /screenshots/${filename}`);
      }
    };

    if (btnQuickShot) {
      btnQuickShot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        doQuickScreenshot();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'F9' || e.code === 'F9') {
        e.preventDefault();
        doQuickScreenshot();
      }
    });

    const autoShot = params.get('autoshot');
    if (autoShot) {
      setTimeout(async () => {
        await window.captureScreenshotToFile(autoShot);
      }, 1800);
    }
  } catch (e) {
    console.warn('URL param hook notice:', e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
