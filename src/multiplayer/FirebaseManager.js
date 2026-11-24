/**
 * FirebaseManager.js - Authentication, Firestore Cloud Save,
 * and Realtime Database 1v1 Room-Code Multiplayer
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp as firestoreTimestamp
} from 'firebase/firestore';
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  update,
  remove,
  onDisconnect,
  serverTimestamp as rtdbTimestamp
} from 'firebase/database';
import { storage } from '../core/Storage.js';

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAGuFpc8SpUXvhWFl4hjmval-K7xNuYIXE",
  authDomain: "car-racer-65441.firebaseapp.com",
  projectId: "car-racer-65441",
  storageBucket: "car-racer-65441.firebasestorage.app",
  messagingSenderId: "225747804383",
  appId: "1:225747804383:web:fcfe0789b7a334ba66496a",
  measurementId: "G-BL8K4PNRPB",
  databaseURL: "https://car-racer-65441-default-rtdb.firebaseio.com"
};

export class FirebaseManager {
  constructor(app) {
    this.app = app;
    this.firebaseApp = null;
    this.auth = null;
    this.firestore = null;
    this.db = null;

    // User authentication state
    this.currentUser = null; // null = guest / not logged in
    this.isAnonymous = false;
    this.userId = null;
    this.userName = 'Guest Racer';
    this.isCloudSyncActive = false;

    // Multiplayer room state
    this.roomCode = null;
    this.isHost = false;
    this.roomRef = null;
    this.isConfigured = false;
    this.isSimulated = false;

    // Remote multiplayer interpolation state
    this.remoteState = {
      x: 0,
      z: 0,
      heading: 0,
      speed: 0,
      lap: 1,
      cp: 0,
      isFinished: false,
      isNitro: false,
      isBraking: false,
      lastUpdate: 0
    };

    this.initFirebase();
  }

  async initFirebase() {
    try {
      const apps = getApps();
      this.firebaseApp = apps.length === 0 ? initializeApp(DEFAULT_FIREBASE_CONFIG) : apps[0];
      this.auth = getAuth(this.firebaseApp);
      this.firestore = getFirestore(this.firebaseApp);
      this.db = getDatabase(this.firebaseApp);
      this.isConfigured = true;

      // Listen to Auth State
      onAuthStateChanged(this.auth, async (user) => {
        if (user && !user.isAnonymous) {
          this.currentUser = user;
          this.isAnonymous = false;
          this.userId = user.uid;
          this.userName = user.displayName || user.email?.split('@')[0] || 'Racer';
          this.isCloudSyncActive = true;
          console.log('[Firebase] User logged in:', this.userName, `(${user.uid})`);

          // Sync progress with Firestore on login
          await this.loadAndMergeFirestoreProgress(user.uid);
          await this.saveProgressToFirestore();

          if (this.onAuthChanged) this.onAuthChanged({ loggedIn: true, user: this.currentUser, name: this.userName });
        } else if (user && user.isAnonymous) {
          this.userId = user.uid;
          this.isAnonymous = true;
          this.currentUser = null;
          this.isCloudSyncActive = false;
          if (this.onAuthChanged) this.onAuthChanged({ loggedIn: false, user: null, name: 'Guest Racer' });
        } else {
          this.currentUser = null;
          this.userId = null;
          this.isAnonymous = false;
          this.isCloudSyncActive = false;
          if (this.onAuthChanged) this.onAuthChanged({ loggedIn: false, user: null, name: 'Guest Racer' });
        }
      });

      // Hook into StorageManager to auto-save to cloud whenever progress changes
      storage.onCloudSyncNeeded = () => {
        if (this.isCloudSyncActive && this.currentUser) {
          this.saveProgressToFirestore();
        }
      };

    } catch (err) {
      console.warn('[Firebase] Init failed or blocked by network, fallback mode active:', err);
      this.isConfigured = false;
    }
  }

  /* ---------------- AUTHENTICATION METHODS ---------------- */

  async loginWithEmail(email, password) {
    if (!this.auth) return { success: false, error: 'Firebase Auth not initialized' };
    try {
      const userCred = await signInWithEmailAndPassword(this.auth, email, password);
      return { success: true, user: userCred.user };
    } catch (err) {
      return { success: false, error: this.formatAuthError(err) };
    }
  }

  async registerWithEmail(email, password, displayName = '') {
    if (!this.auth) return { success: false, error: 'Firebase Auth not initialized' };
    try {
      const userCred = await createUserWithEmailAndPassword(this.auth, email, password);
      return { success: true, user: userCred.user };
    } catch (err) {
      return { success: false, error: this.formatAuthError(err) };
    }
  }

  async loginWithGoogle() {
    if (!this.auth) return { success: false, error: 'Firebase Auth not initialized' };
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(this.auth, provider);
      return { success: true, user: userCred.user };
    } catch (err) {
      return { success: false, error: this.formatAuthError(err) };
    }
  }

  async logout() {
    if (!this.auth) return;
    try {
      await signOut(this.auth);
      this.currentUser = null;
      this.isCloudSyncActive = false;
      console.log('[Firebase] User logged out.');
    } catch (e) {
      console.error('[Firebase] Sign out error:', e);
    }
  }

  formatAuthError(err) {
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
      return 'Invalid email or password.';
    } else if (err.code === 'auth/email-already-in-use') {
      return 'An account with this email already exists.';
    } else if (err.code === 'auth/weak-password') {
      return 'Password should be at least 6 characters.';
    } else if (err.code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    }
    return err.message || 'Authentication error occurred.';
  }

  /* ---------------- FIRESTORE CLOUD PROGRESS SAVING ---------------- */

  async loadAndMergeFirestoreProgress(userId) {
    if (!this.firestore || !userId) return;
    try {
      const userDocRef = doc(this.firestore, 'users', userId);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const cloudData = snap.data();
        console.log('[Firestore] Loaded existing cloud progress:', cloudData);
        storage.mergeCloudData(cloudData);
      } else {
        console.log('[Firestore] First time login, creating initial cloud document');
        await this.saveProgressToFirestore();
      }
    } catch (err) {
      console.warn('[Firestore] Error loading cloud progress:', err);
    }
  }

  async saveProgressToFirestore() {
    if (!this.firestore || !this.currentUser) return;
    try {
      const userDocRef = doc(this.firestore, 'users', this.currentUser.uid);
      const payload = {
        userId: this.currentUser.uid,
        userName: this.userName,
        email: this.currentUser.email || null,
        progress: storage.progress,
        stats: storage.stats,
        settings: storage.settings,
        lastCloudSave: firestoreTimestamp()
      };
      await setDoc(userDocRef, payload, { merge: true });
      console.log('[Firestore] Successfully synced progress to cloud.');
      if (this.onCloudSyncCompleted) this.onCloudSyncCompleted();
    } catch (err) {
      console.warn('[Firestore] Failed to save progress to cloud:', err);
    }
  }

  /* ---------------- 1V1 REALTIME DATABASE MULTIPLAYER ---------------- */

  async ensureAuthenticatedForRoom() {
    if (this.auth && !this.auth.currentUser) {
      try {
        const cred = await signInAnonymously(this.auth);
        this.userId = cred.user.uid;
      } catch (e) {
        this.userId = 'guest_' + Math.floor(Math.random() * 100000);
      }
    } else if (this.auth && this.auth.currentUser) {
      this.userId = this.auth.currentUser.uid;
    } else {
      this.userId = 'guest_' + Math.floor(Math.random() * 100000);
    }
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  enableSimulatedMode() {
    this.isSimulated = true;
    this.userId = 'sim_user_' + Math.floor(Math.random() * 10000);
  }

  async createRoom(playerName, selectedCar, trackId) {
    this.userName = playerName || (this.currentUser ? this.userName : 'Host Racer');
    this.isHost = true;
    this.roomCode = this.generateRoomCode();

    if (this.isSimulated) {
      return { success: true, roomCode: this.roomCode, isHost: true };
    }

    try {
      await this.ensureAuthenticatedForRoom();
      this.roomRef = ref(this.db, `rooms/${this.roomCode}`);

      const roomData = {
        code: this.roomCode,
        hostId: this.userId,
        trackId: trackId || 'goa_marine',
        status: 'waiting',
        createdAt: rtdbTimestamp(),
        countdownStart: null,
        players: {
          [this.userId]: {
            id: this.userId,
            name: this.userName,
            carId: selectedCar,
            ready: true,
            isHost: true,
            state: { x: 0, z: 0, heading: 0, speed: 0, lap: 1, cp: 0, isFinished: false }
          }
        }
      };

      await set(this.roomRef, roomData);
      onDisconnect(this.roomRef).remove();
      this.listenToRoom();

      return { success: true, roomCode: this.roomCode, isHost: true };
    } catch (err) {
      console.warn('[Multiplayer] Fallback to simulated room due to network:', err);
      this.enableSimulatedMode();
      return { success: true, roomCode: this.roomCode, isHost: true };
    }
  }

  async joinRoom(code, playerName, selectedCar) {
    this.userName = playerName || (this.currentUser ? this.userName : 'Guest Racer');
    this.isHost = false;
    this.roomCode = code.toUpperCase().trim();

    if (this.isSimulated) {
      return { success: true, roomCode: this.roomCode, isHost: false };
    }

    try {
      await this.ensureAuthenticatedForRoom();
      this.roomRef = ref(this.db, `rooms/${this.roomCode}`);
      const snapshot = await get(this.roomRef);

      if (!snapshot.exists()) {
        return { success: false, error: 'Room does not exist. Check code.' };
      }

      const roomData = snapshot.val();
      if (roomData.status !== 'waiting') {
        return { success: false, error: 'Race is already in progress or completed.' };
      }

      const players = roomData.players || {};
      const playerKeys = Object.keys(players);
      if (playerKeys.length >= 2 && !players[this.userId]) {
        return { success: false, error: 'Room is already full (maximum 2 racers).' };
      }

      const guestRef = ref(this.db, `rooms/${this.roomCode}/players/${this.userId}`);
      await set(guestRef, {
        id: this.userId,
        name: this.userName,
        carId: selectedCar,
        ready: true,
        isHost: false,
        state: { x: 0, z: 0, heading: 0, speed: 0, lap: 1, cp: 0, isFinished: false }
      });

      onDisconnect(guestRef).remove();
      this.listenToRoom();

      return { success: true, roomCode: this.roomCode, isHost: false };
    } catch (err) {
      console.warn('[Multiplayer] Join failed:', err);
      return { success: false, error: err.message };
    }
  }

  listenToRoom() {
    if (!this.roomRef) return;

    onValue(this.roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        if (this.onRoomClosed) this.onRoomClosed('Room was closed by the host.');
        this.leaveRoom();
        return;
      }

      const data = snapshot.val();
      if (this.onRoomUpdate) this.onRoomUpdate(data);

      const players = data.players || {};
      for (const pid in players) {
        if (pid !== this.userId && players[pid].state) {
          this.remoteState = { ...players[pid].state, lastUpdate: Date.now() };
        }
      }

      if (data.status === 'countdown' && data.countdownStart) {
        if (this.onCountdownStarted) {
          this.onCountdownStarted(data.countdownStart);
        }
      }
    });
  }

  async startMatch() {
    if (this.isSimulated || !this.isConfigured) {
      if (this.onCountdownStarted) this.onCountdownStarted(Date.now() + 500);
      return;
    }

    if (!this.isHost || !this.roomRef) return;
    const startTime = Date.now() + 3500;
    await update(this.roomRef, {
      status: 'countdown',
      countdownStart: startTime
    });
  }

  sendVehicleState(vehicle) {
    if (!this.roomRef || !this.userId || !vehicle) return;

    const compactState = {
      x: Math.round(vehicle.position.x * 10) / 10,
      z: Math.round(vehicle.position.z * 10) / 10,
      heading: Math.round(vehicle.heading * 100) / 100,
      speed: Math.round(vehicle.speed),
      lap: vehicle.currentLap,
      cp: vehicle.currentCheckpoint,
      isFinished: vehicle.isFinished,
      isNitro: vehicle.isNitroActive,
      isBraking: vehicle.isBraking
    };

    const playerStateRef = ref(this.db, `rooms/${this.roomCode}/players/${this.userId}/state`);
    set(playerStateRef, compactState).catch(() => {});
  }

  interpolateRemoteVehicle(remoteVehicle, dt) {
    if (!remoteVehicle || !this.remoteState) return;

    const targetX = this.remoteState.x;
    const targetZ = this.remoteState.z;
    const targetHeading = this.remoteState.heading;

    const lerpSpeed = Math.min(1, 12 * dt);
    remoteVehicle.position.x += (targetX - remoteVehicle.position.x) * lerpSpeed;
    remoteVehicle.position.z += (targetZ - remoteVehicle.position.z) * lerpSpeed;

    let diff = targetHeading - remoteVehicle.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    remoteVehicle.heading += diff * lerpSpeed;

    remoteVehicle.speed = this.remoteState.speed;
    remoteVehicle.currentLap = this.remoteState.lap;
    remoteVehicle.currentCheckpoint = this.remoteState.cp;
    remoteVehicle.isFinished = this.remoteState.isFinished;

    remoteVehicle.group.position.copy(remoteVehicle.position);
    remoteVehicle.group.rotation.y = remoteVehicle.heading;
  }

  async leaveRoom() {
    if (this.roomRef && this.userId) {
      try {
        if (this.isHost) {
          await remove(this.roomRef);
        } else {
          const guestRef = ref(this.db, `rooms/${this.roomCode}/players/${this.userId}`);
          await remove(guestRef);
        }
      } catch (e) {}
    }

    this.roomCode = null;
    this.isHost = false;
    this.roomRef = null;
    this.isSimulated = false;
  }
}
