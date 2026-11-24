/**
 * TrackManager.js - Coordinates track switching, environment lighting,
 * track progression locking/unlocking, and populating track selection cards in the UI
 */

import * as THREE from 'three';
import { TRACK_LOCATIONS, getTrackById } from './TrackData.js';
import { TrackGenerator } from './TrackGenerator.js';
import { storage } from '../core/Storage.js';
import { audio } from '../core/Audio.js';

export class TrackManager {
  constructor(scene) {
    this.scene = scene;
    this.currentTrackData = null;
    this.currentTrackMesh = null;
    this.sunLight = null;
    this.ambientLight = null;

    this.initLighting();
    this.renderTrackSelectionCards();
  }

  initLighting() {
    this.ambientLight = new THREE.AmbientLight(0x444444, 1.2);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 1000;
    const d = 180;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);
  }

  loadTrack(trackId, quality = 'high') {
    // If track is locked, fallback to first unlocked track (or goa_marine)
    if (!storage.isTrackUnlocked(trackId)) {
      trackId = storage.progress.unlockedTracks[0] || 'goa_marine';
      storage.saveProgress({ selectedTrack: trackId });
    }

    if (this.currentTrackMesh) {
      this.scene.remove(this.currentTrackMesh.group);
      this.currentTrackMesh.group.traverse(child => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
            else child.material.dispose();
          }
        }
      });
      this.currentTrackMesh = null;
    }

    const trackDef = getTrackById(trackId);
    this.currentTrackData = trackDef;

    // Apply lighting & fog
    this.scene.background = new THREE.Color(trackDef.skyColor);
    this.scene.fog = new THREE.FogExp2(trackDef.fogColor, trackDef.fogDensity);

    this.ambientLight.color.setHex(trackDef.ambientColor);
    this.sunLight.color.setHex(trackDef.sunColor);
    this.sunLight.position.set(trackDef.sunPos[0], trackDef.sunPos[1], trackDef.sunPos[2]);

    // Build 3D track & scenery
    this.currentTrackMesh = TrackGenerator.buildTrack(this.scene, trackDef, quality);
    return this.currentTrackMesh;
  }

  renderTrackSelectionCards() {
    const container = document.getElementById('track-carousel');
    if (!container) return;

    container.innerHTML = '';
    const selectedId = storage.progress.selectedTrack || 'goa_marine';

    TRACK_LOCATIONS.forEach((track, idx) => {
      const isUnlocked = storage.isTrackUnlocked(track.id);
      const isSelected = track.id === selectedId && isUnlocked;

      const card = document.createElement('div');
      card.className = `track-card ${isSelected ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`;
      card.setAttribute('data-track-id', track.id);

      card.innerHTML = `
        <div class="track-preview-box" style="background: ${track.previewGradient}">
          <span class="track-number-badge">TRACK 0${idx + 1}</span>
          <span class="track-preview-icon">${isUnlocked ? '🏁' : '🔒'}</span>
          ${!isUnlocked ? '<div class="track-lock-overlay"><span>LOCKED</span></div>' : ''}
        </div>
        <h3 class="track-title">${track.name}</h3>
        <p class="track-desc">${track.description}</p>
        <div class="track-meta-row">
          <span class="meta-length">📏 ${track.lengthKm}</span>
          <span class="meta-diff">⚡ ${track.difficulty}</span>
        </div>
        ${!isUnlocked ? '<div class="track-unlock-hint">Win previous track to unlock</div>' : ''}
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          audio.playClick();
          document.querySelectorAll('.track-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          storage.saveProgress({ selectedTrack: track.id });
        });
      }

      container.appendChild(card);
    });
  }
}
