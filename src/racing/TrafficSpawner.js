import * as THREE from 'three';

/**
 * TrafficSpawner: Spawns and manages civilian traffic cars on the 4-lane highway:
 * - Pickups, Sedans, Cargo Trucks, SUVs
 * - Supports Endless, Two-Way (oncoming traffic on left lanes), Time Trial, Police Chase, and Free Ride
 * - Close-overtake bonus detection at speed > 100 km/h
 */
export class TrafficSpawner {
  constructor(scene) {
    this.scene = scene;
    this.laneCenters = [-6.0, -2.0, 2.0, 6.0];
    this.vehicles = [];
    this.trafficDensity = 0.93; // Reduced traffic density by 7% (1.0 -> 0.93)
    this.maxVehicles = Math.round(12 * this.trafficDensity); // 11 concurrent vehicles
    this.laneChangeProbability = 0.25; // 25% probability only: not every car changes lane
    this.spawnDistanceAhead = 170;
    this.gameMode = 'endless';
    this.playerLastX = 0;

    this.onCloseOvertake = null; // Callback for close overtake bonus
    this.initVehicleGeometries();
  }

  setGameMode(mode) {
    this.gameMode = mode || 'endless';
  }

  initVehicleGeometries() {
    this.glassMat = new THREE.MeshStandardMaterial({ color: 0x112233, roughness: 0.1, metalness: 0.9 });
    this.wheelMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.8, metalness: 0.1 });
    this.chromeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.25, metalness: 0.85 });

    this.redMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.32, metalness: 0.45, flatShading: true });
    this.whiteMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.32, metalness: 0.45, flatShading: true });
    this.blueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.32, metalness: 0.45, flatShading: true });
    this.yellowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.32, metalness: 0.45, flatShading: true });
    this.truckMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.32, metalness: 0.45, flatShading: true });
    this.truckCargoMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.45, metalness: 0.25, flatShading: true });
    this.policeBlackMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.5, flatShading: true });
    this.indicatorMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

    // Procedural underbody contact shadow texture
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext ? canvas.getContext('2d') : null;
      if (ctx) {
        const grad = ctx.createRadialGradient(64, 64, 15, 64, 64, 60);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.82)');
        grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
      }
      this.shadowTex = new THREE.CanvasTexture(canvas);
      this.shadowMat = new THREE.MeshBasicMaterial({ map: this.shadowTex, transparent: true, opacity: 0.62, depthWrite: false });
    }
  }

  addContactShadow(group, width = 2.0, length = 4.4) {
    if (!this.shadowMat) return;
    const shadowGeo = new THREE.PlaneGeometry(width, length);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMesh = new THREE.Mesh(shadowGeo, this.shadowMat);
    shadowMesh.position.set(0, 0.02, 0);
    group.add(shadowMesh);
  }

  applyShadows(group) {
    group.traverse(obj => {
      if (obj.isMesh && obj.material !== this.shadowMat) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }

  addTurnIndicators(group, width, frontZ, rearZ, yHeight) {
    const indGeo = new THREE.BoxGeometry(0.24, 0.16, 0.18);
    const left = [];
    const right = [];
    const xHalf = width / 2;

    // Left Front
    const indFL = new THREE.Mesh(indGeo, this.indicatorMat);
    indFL.position.set(-xHalf + 0.04, yHeight, frontZ);
    indFL.visible = false;
    group.add(indFL);
    left.push(indFL);

    // Left Rear
    const indRL = new THREE.Mesh(indGeo, this.indicatorMat);
    indRL.position.set(-xHalf + 0.04, yHeight, rearZ);
    indRL.visible = false;
    group.add(indRL);
    left.push(indRL);

    // Right Front
    const indFR = new THREE.Mesh(indGeo, this.indicatorMat);
    indFR.position.set(xHalf - 0.04, yHeight, frontZ);
    indFR.visible = false;
    group.add(indFR);
    right.push(indFR);

    // Right Rear
    const indRR = new THREE.Mesh(indGeo, this.indicatorMat);
    indRR.position.set(xHalf - 0.04, yHeight, rearZ);
    indRR.visible = false;
    group.add(indRR);
    right.push(indRR);

    return { left, right };
  }

  createPickupTruck() {
    const group = new THREE.Group();
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.9, 2.2), this.redMat);
    cab.position.set(0, 0.75, 0.6);
    group.add(cab);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.55, 1.2), this.glassMat);
    windshield.position.set(0, 0.98, 0.5);
    group.add(windshield);

    const bedBase = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.35, 2.2), this.redMat);
    bedBase.position.set(0, 0.5, -1.4);
    group.add(bedBase);

    const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 2.2), this.redMat);
    wallL.position.set(-0.9, 0.8, -1.4);
    group.add(wallL);

    const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 2.2), this.redMat);
    wallR.position.set(0.9, 0.8, -1.4);
    group.add(wallR);

    const tailgate = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 0.12), this.redMat);
    tailgate.position.set(0, 0.8, -2.5);
    group.add(tailgate);

    const redLight = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.1), redLight);
    tailL.position.set(-0.75, 0.75, -2.52);
    group.add(tailL);
    const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.1), redLight);
    tailR.position.set(0.75, 0.75, -2.52);
    group.add(tailR);

    // Headlights
    const whiteLight = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.1), whiteLight);
    headL.position.set(-0.75, 0.75, 1.72);
    group.add(headL);
    const headR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.1), whiteLight);
    headR.position.set(0.75, 0.75, 1.72);
    group.add(headR);

    const indicators = this.addTurnIndicators(group, 1.95, 1.74, -2.54, 0.75);

    this.addWheels(group, 1.9, 4.4);
    this.addContactShadow(group, 2.1, 4.6);
    this.applyShadows(group);
    return { mesh: group, length: 4.6, width: 2.0, type: 'PICKUP', indicators };
  }

  createSedan(colorMat = null) {
    const group = new THREE.Group();
    const mat = colorMat || (Math.random() > 0.5 ? this.whiteMat : this.blueMat);

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.55, 4.2), mat);
    body.position.set(0, 0.55, 0);
    group.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.5, 2.2), this.glassMat);
    cabin.position.set(0, 0.95, -0.2);
    group.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 1.6), mat);
    roof.position.set(0, 1.22, -0.2);
    group.add(roof);

    const redLight = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.1), redLight);
    tailL.position.set(-0.7, 0.55, -2.12);
    group.add(tailL);
    const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.1), redLight);
    tailR.position.set(0.7, 0.55, -2.12);
    group.add(tailR);

    const whiteLight = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.1), whiteLight);
    headL.position.set(-0.7, 0.55, 2.12);
    group.add(headL);
    const headR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.1), whiteLight);
    headR.position.set(0.7, 0.55, 2.12);
    group.add(headR);

    const indicators = this.addTurnIndicators(group, 1.9, 2.14, -2.14, 0.55);

    this.addWheels(group, 1.85, 4.0);
    this.addContactShadow(group, 2.0, 4.4);
    this.applyShadows(group);
    return { mesh: group, length: 4.4, width: 1.9, type: 'SEDAN', indicators };
  }

  createCargoTruck() {
    const group = new THREE.Group();
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.8, 2.0), this.truckMat);
    cab.position.set(0, 1.2, 2.4);
    group.add(cab);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.8, 0.1), this.glassMat);
    windshield.position.set(0, 1.5, 3.42);
    group.add(windshield);

    const cargo = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 5.8), this.truckCargoMat);
    cargo.position.set(0, 1.6, -1.5);
    group.add(cargo);

    const redLight = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.1), redLight);
    tailL.position.set(-0.9, 0.6, -4.42);
    group.add(tailL);
    const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.1), redLight);
    tailR.position.set(0.9, 0.6, -4.42);
    group.add(tailR);

    const indicators = this.addTurnIndicators(group, 2.45, 3.44, -4.44, 0.7);

    this.addWheels(group, 2.2, 6.2);
    this.addContactShadow(group, 2.5, 7.2);
    this.applyShadows(group);
    return { mesh: group, length: 7.0, width: 2.4, type: 'CARGO_TRUCK', indicators };
  }

  createAmbulance() {
    const group = new THREE.Group();
    // High-roof Emergency Ambulance Van Body (Crisp Hospital White)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.32, metalness: 0.25, flatShading: true });
    const redStripeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const blueBeaconMat = new THREE.MeshBasicMaterial({ color: 0x0066ff });
    const redBeaconMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });

    // Main Cab & Medical Patient Compartment
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.55, 4.8), bodyMat);
    cabin.position.set(0, 1.15, 0);
    group.add(cabin);

    // Aerodynamic High Roof Cap
    const highRoof = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.45, 4.4), bodyMat);
    highRoof.position.set(0, 2.1, -0.1);
    group.add(highRoof);

    // Front Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.68, 0.1), this.glassMat);
    windshield.position.set(0, 1.45, 2.42);
    group.add(windshield);

    // Side Patient Privacy Windows
    const winL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 2.2), this.glassMat);
    winL.position.set(-1.06, 1.4, -0.6);
    group.add(winL);
    const winR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 2.2), this.glassMat);
    winR.position.set(1.06, 1.4, -0.6);
    group.add(winR);

    // Bold Emergency Red Stripes along sides
    const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 4.6), redStripeMat);
    stripeL.position.set(-1.06, 0.95, 0);
    group.add(stripeL);
    const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 4.6), redStripeMat);
    stripeR.position.set(1.06, 0.95, 0);
    group.add(stripeR);

    // Red Cross ✚ on left and right sides
    [-1.07, 1.07].forEach(x => {
      const vCross = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.18), redStripeMat);
      vCross.position.set(x, 1.4, -0.6);
      group.add(vCross);
      const hCross = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.55), redStripeMat);
      hCross.position.set(x, 1.4, -0.6);
      group.add(hCross);
    });

    // Emergency Roof Light Bar (Flashing Red & Blue)
    const barBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.35), this.policeBlackMat);
    barBase.position.set(0, 2.38, 0.8);
    group.add(barBase);

    const redSiren = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.28), redBeaconMat);
    redSiren.position.set(-0.4, 2.46, 0.8);
    group.add(redSiren);

    const blueSiren = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.28), blueBeaconMat);
    blueSiren.position.set(0.4, 2.46, 0.8);
    group.add(blueSiren);

    // Headlights and Taillights
    const whiteLight = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const redLight = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.1), whiteLight);
    headL.position.set(-0.75, 0.65, 2.42);
    group.add(headL);
    const headR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.1), whiteLight);
    headR.position.set(0.75, 0.65, 2.42);
    group.add(headR);

    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.1), redLight);
    tailL.position.set(-0.75, 0.85, -2.42);
    group.add(tailL);
    const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.1), redLight);
    tailR.position.set(0.75, 0.85, -2.42);
    group.add(tailR);

    const indicators = this.addTurnIndicators(group, 2.15, 2.44, -2.44, 0.65);

    this.addWheels(group, 2.05, 4.6);
    this.addContactShadow(group, 2.3, 5.0);
    this.applyShadows(group);

    return {
      mesh: group,
      length: 5.0,
      width: 2.1,
      type: 'AMBULANCE',
      indicators,
      sirens: [redSiren, blueSiren]
    };
  }

  createPolicePursuit() {
    const sedan = this.createSedan(this.policeBlackMat);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.2), this.policeBlackMat);
    bar.position.set(0, 1.35, -0.2);
    sedan.mesh.add(bar);

    const redSiren = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.16), new THREE.MeshBasicMaterial({ color: 0xff0033 }));
    redSiren.position.set(-0.35, 1.42, -0.2);
    sedan.mesh.add(redSiren);

    const blueSiren = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.16), new THREE.MeshBasicMaterial({ color: 0x0066ff }));
    blueSiren.position.set(0.35, 1.42, -0.2);
    sedan.mesh.add(blueSiren);

    sedan.sirens = [redSiren, blueSiren];
    sedan.type = 'POLICE';
    return sedan;
  }

  addWheels(group, width, length) {
    const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 10);
    wheelGeo.rotateZ(Math.PI / 2);

    const xOff = width / 2;
    const zOff = length * 0.32;
    const positions = [
      [-xOff, 0.36, zOff],
      [xOff, 0.36, zOff],
      [-xOff, 0.36, -zOff],
      [xOff, 0.36, -zOff]
    ];

    positions.forEach(p => {
      const w = new THREE.Mesh(wheelGeo, this.wheelMat);
      w.position.set(...p);
      group.add(w);
    });
  }

  spawnInitialTraffic(playerZ) {
    this.clear();
    const spacing = 24 / this.trafficDensity; // Spacing adjusted for 7% reduced density
    for (let i = 0; i < this.maxVehicles; i++) {
      const z = playerZ + 40 + i * spacing + Math.random() * 10;
      let laneIdx = Math.floor(Math.random() * 4);
      if (this.gameMode === 'two_way') {
        // Distribute evenly between oncoming (0, 1) and forward (2, 3)
        laneIdx = i % 4;
      }
      this.spawnVehicle(z, laneIdx);
    }
  }

  spawnVehicle(z, laneIdx, canChangeLane = null) {
    // Keep approach to 50 KM finish garage clear
    if (z >= 49500) return;

    const isTwoWay = (this.gameMode === 'two_way');
    const isOncoming = isTwoWay && (laneIdx === 2 || laneIdx === 3);

    const rand = Math.random();
    let vehData;
    let speed = 72 + Math.random() * 26;

    if (rand < 0.35) {
      vehData = this.createPickupTruck();
      speed = 78 + Math.random() * 16;
    } else if (rand < 0.65) {
      vehData = this.createSedan();
      speed = 85 + Math.random() * 18;
    } else if (rand < 0.82) {
      vehData = this.createCargoTruck();
      speed = 65 + Math.random() * 12;
    } else {
      // Ambulances on road with active emergency sirens!
      vehData = this.createAmbulance();
      speed = 96 + Math.random() * 20;
    }

    // Orient oncoming vehicles towards player
    if (isOncoming) {
      vehData.mesh.rotation.y = Math.PI;
    }

    const laneX = this.laneCenters[laneIdx];
    vehData.mesh.position.set(laneX, 0, z);
    this.scene.add(vehData.mesh);

    // Only 25% of vehicles can change lanes; 75% stay strictly in their lane
    const willChangeLane = (canChangeLane !== null && canChangeLane !== undefined)
      ? canChangeLane
      : (Math.random() < this.laneChangeProbability);

    this.vehicles.push({
      mesh: vehData.mesh,
      sirens: vehData.sirens || null,
      indicators: vehData.indicators || null,
      x: laneX,
      targetX: laneX,
      z,
      speed,
      baseSpeed: speed,
      targetSpeed: speed,
      length: vehData.length,
      width: vehData.width,
      laneIdx,
      isOncoming,
      overtaken: false,
      canChangeLane: willChangeLane,
      laneChangeState: 'idle', // 'idle' | 'signaling' | 'slowing' | 'shifting'
      laneChangeTimer: 3 + Math.random() * 6,
      signalTimer: 0,
      slowdownTimer: 0,
      targetLaneIdx: laneIdx
    });
  }

  update(deltaTime, playerZ, playerSpeed) {
    // 1. Update vehicle positions and lane changes
    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];
      const speedMS = (v.speed * 1000) / 3600;

      if (v.isOncoming) {
        // Moves in negative Z towards player
        v.z -= speedMS * deltaTime;
      } else {
        // Moves in positive Z with player
        v.z += speedMS * deltaTime;
      }

      // Flash sirens if police
      if (v.sirens) {
        const flash = Math.floor(Date.now() / 150) % 2 === 0;
        v.sirens[0].visible = flash;
        v.sirens[1].visible = !flash;
      }

      // Turn indicators & safe lane changes:
      // Only 25% of cars are lane changers; 75% stay strictly in their lane
      // 1. Give indicator first for 5 sec
      // 2. Then slowdown a bit
      // 3. Then change the lane
      if (v.canChangeLane && v.laneChangeState === 'idle') {
        v.laneChangeTimer -= deltaTime;
        if (v.laneChangeTimer <= 0) {
          const dir = Math.random() > 0.5 ? 1 : -1;
          let newLane = v.laneIdx + dir;
          if (this.gameMode === 'two_way') {
            // Keep oncoming in lanes 2,3 (screen-left) and forward in lanes 0,1 (screen-right)
            if (v.isOncoming) {
              newLane = Math.max(2, Math.min(3, newLane));
            } else {
              newLane = Math.max(0, Math.min(1, newLane));
            }
          } else {
            newLane = Math.max(0, Math.min(3, newLane));
          }

          if (newLane !== v.laneIdx) {
            // Phase 1: Give indicator first for 5 seconds before changing lanes!
            v.laneChangeState = 'signaling';
            v.targetLaneIdx = newLane;
            v.signalTimer = 5.0; // 5 seconds indicator
            v.baseSpeed = v.speed;
          } else {
            v.laneChangeTimer = 4 + Math.random() * 6;
          }
        }
      } else if (v.laneChangeState === 'signaling') {
        // Flash turn indicators while staying in current lane for 5 seconds
        v.signalTimer -= deltaTime;
        const flash = Math.floor(Date.now() / 150) % 2 === 0;
        const movingRight = (v.targetLaneIdx > v.laneIdx);
        const useRightInd = v.isOncoming ? !movingRight : movingRight;

        if (v.indicators) {
          v.indicators.right.forEach(m => m.visible = useRightInd ? flash : false);
          v.indicators.left.forEach(m => m.visible = (!useRightInd) ? flash : false);
        }

        if (v.signalTimer <= 0) {
          // Phase 2: Then slowdown a bit before entering the lane
          v.laneChangeState = 'slowing';
          v.slowdownTimer = 1.0;
          v.targetSpeed = Math.max(48, v.baseSpeed - 18); // Slowdown by ~18 km/h
        }
      } else if (v.laneChangeState === 'slowing') {
        // Slowing down a bit with indicator still flashing
        v.slowdownTimer -= deltaTime;
        v.speed = Math.max(v.targetSpeed, v.speed - 28 * deltaTime);

        const flash = Math.floor(Date.now() / 150) % 2 === 0;
        const movingRight = (v.targetLaneIdx > v.laneIdx);
        const useRightInd = v.isOncoming ? !movingRight : movingRight;

        if (v.indicators) {
          v.indicators.right.forEach(m => m.visible = useRightInd ? flash : false);
          v.indicators.left.forEach(m => m.visible = (!useRightInd) ? flash : false);
        }

        if (v.slowdownTimer <= 0) {
          // Phase 3: Then change the lane
          v.laneChangeState = 'shifting';
          v.laneIdx = v.targetLaneIdx;
          v.targetX = this.laneCenters[v.targetLaneIdx];
        }
      } else if (v.laneChangeState === 'shifting') {
        // Shifting into new lane with indicators blinking and recovering speed
        const flash = Math.floor(Date.now() / 150) % 2 === 0;
        const movingRight = (v.targetX > v.x);
        const useRightInd = v.isOncoming ? !movingRight : movingRight;

        if (v.indicators) {
          v.indicators.right.forEach(m => m.visible = useRightInd ? flash : false);
          v.indicators.left.forEach(m => m.visible = (!useRightInd) ? flash : false);
        }

        v.speed = Math.min(v.baseSpeed, v.speed + 16 * deltaTime);
        v.x += (v.targetX - v.x) * Math.min(1.0, 2.8 * deltaTime);

        if (Math.abs(v.x - v.targetX) < 0.05) {
          v.x = v.targetX;
          v.speed = v.baseSpeed;
          v.laneChangeState = 'idle';
          v.canChangeLane = Math.random() < this.laneChangeProbability; // 25% chance to ever change lane again
          v.laneChangeTimer = 8 + Math.random() * 12;
          if (v.indicators) {
            v.indicators.left.forEach(m => m.visible = false);
            v.indicators.right.forEach(m => m.visible = false);
          }
        }
      }

      v.mesh.position.x = v.x;
      v.mesh.position.z = v.z;

      // 2. Check Close Overtake
      // Drive above 100 km/h for close-overtake bonuses!
      if (!v.overtaken && playerZ > v.z + v.length / 2) {
        v.overtaken = true;
        const dx = Math.abs(v.x - this.playerLastX);
        const dz = playerZ - v.z;
        if (playerSpeed > 100 && dx < 3.2 && dz < 18) {
          if (this.onCloseOvertake) {
            this.onCloseOvertake(playerSpeed, dx, v.isOncoming);
          }
        }
      }
    }

    // 3. Recycle vehicles that are passed or behind player
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];
      const isBehind = (playerZ - v.z > 35);
      const isFarAhead = (v.isOncoming && v.z < playerZ - 20);

      if (isBehind || isFarAhead) {
        this.scene.remove(v.mesh);
        this.vehicles.splice(i, 1);
      }
    }

    // 4. Spawn new vehicles ahead of player (spaced according to 7% reduced density)
    while (this.vehicles.length < this.maxVehicles) {
      let maxZ = playerZ + 60;
      this.vehicles.forEach(v => {
        if (v.z > maxZ) maxZ = v.z;
      });

      const spacing = (22 + Math.random() * 20) / this.trafficDensity;
      const newZ = maxZ + spacing;
      let laneIdx = Math.floor(Math.random() * 4);
      if (this.gameMode === 'two_way') {
        laneIdx = Math.random() > 0.5 ? Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 2);
      }
      this.spawnVehicle(newZ, laneIdx);
    }
  }

  setPlayerPosition(playerX) {
    this.playerLastX = playerX;
  }

  checkCollision(playerBox) {
    for (let v of this.vehicles) {
      const vHalfW = v.width * 0.45;
      const vHalfL = v.length * 0.45;

      const vMinX = v.x - vHalfW;
      const vMaxX = v.x + vHalfW;
      const vMinZ = v.z - vHalfL;
      const vMaxZ = v.z + vHalfL;

      const pMinX = playerBox.x - playerBox.halfW;
      const pMaxX = playerBox.x + playerBox.halfW;
      const pMinZ = playerBox.z - playerBox.halfL;
      const pMaxZ = playerBox.z + playerBox.halfL;

      if (pMinX <= vMaxX && pMaxX >= vMinX && pMinZ <= vMaxZ && pMaxZ >= vMinZ) {
        return {
          hit: true,
          hitVehicle: v
        };
      }
    }
    return { hit: false };
  }

  clear() {
    this.vehicles.forEach(v => this.scene.remove(v.mesh));
    this.vehicles = [];
  }

  clearNearbyVehicles(centerZ, radius = 25) {
    this.vehicles.forEach(v => {
      if (Math.abs(v.z - centerZ) < radius) {
        v.z = centerZ + radius + 25 + Math.random() * 20;
        v.mesh.position.z = v.z;
      }
    });
  }
}
