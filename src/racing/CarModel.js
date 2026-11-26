import * as THREE from 'three';

/**
 * 40+ Vehicles Catalog inspired by Kenney Car Kit, Quaternius Ultimate Vehicles, and KayKit Vehicle Bits.
 * Crisp, stylized low-poly arcade geometry with instant load times and high performance.
 */
export const VEHICLES_CATALOG = [
  { id: 'car_01', name: 'BREEZE HATCH', class: 'COMPACT COMMUTER', price: 0, speed: 165, accel: '5.2s', handling: '82%', armor: '60%', defaultColor: 0x3b82f6, bodyType: 'hatchback' },
  { id: 'car_02', name: 'URBAN SEDAN', class: 'STANDARD SEDAN', price: 5000, speed: 180, accel: '4.8s', handling: '78%', armor: '65%', defaultColor: 0x64748b, bodyType: 'sedan' },
  { id: 'car_03', name: 'TITAN 4X4', class: 'HEAVY SUV', price: 10000, speed: 195, accel: '4.5s', handling: '75%', armor: '90%', defaultColor: 0xeeeeee, bodyType: 'suv' },
  { id: 'car_04', name: 'APEX TRUCK', class: 'UTILITY PICKUP', price: 15000, speed: 185, accel: '4.9s', handling: '72%', armor: '95%', defaultColor: 0xd90429, bodyType: 'pickup' },
  { id: 'car_05', name: 'METRO TAXI', class: 'CITY CAB', price: 20000, speed: 190, accel: '4.6s', handling: '80%', armor: '70%', defaultColor: 0xf59e0b, bodyType: 'taxi' },
  { id: 'car_06', name: 'STREET RACER', class: 'SPORT COUPE', price: 25000, speed: 210, accel: '4.1s', handling: '86%', armor: '65%', defaultColor: 0x10b981, bodyType: 'coupe' },
  { id: 'car_07', name: 'RETRO MUSCLE', class: 'CLASSIC V8', price: 32000, speed: 220, accel: '3.9s', handling: '70%', armor: '80%', defaultColor: 0xef4444, bodyType: 'muscle' },
  { id: 'car_08', name: 'DRIFT SILVIA', class: 'JDM TUNER', price: 40000, speed: 225, accel: '3.8s', handling: '92%', armor: '60%', defaultColor: 0x8b5cf6, bodyType: 'tuner' },
  { id: 'car_09', name: 'PHANTOM GT', class: 'EXOTIC GT', price: 50000, speed: 245, accel: '3.5s', handling: '88%', armor: '68%', defaultColor: 0x00f0ff, bodyType: 'sports_gt' },
  { id: 'car_10', name: 'TROPICAL CABRIO', class: 'OPEN CONVERTIBLE', price: 60000, speed: 230, accel: '3.7s', handling: '85%', armor: '55%', defaultColor: 0xec4899, bodyType: 'cabrio' },
  { id: 'car_11', name: 'DESERT RUNNER', class: 'OFFROAD 4WD', price: 72000, speed: 215, accel: '4.0s', handling: '79%', armor: '88%', defaultColor: 0xd97706, bodyType: 'offroad' },
  { id: 'car_12', name: 'DELIVERY EXPRESS', class: 'CARGO VAN', price: 85000, speed: 172, accel: '5.5s', handling: '68%', armor: '92%', defaultColor: 0x0284c7, bodyType: 'van' },
  { id: 'car_13', name: 'VIP LUXURY', class: 'EXECUTIVE LIMOUSINE', price: 100000, speed: 235, accel: '3.6s', handling: '76%', armor: '85%', defaultColor: 0x0f172a, bodyType: 'luxury' },
  { id: 'car_14', name: 'TURBO COMPACT', class: 'POCKET ROCKET', price: 115000, speed: 238, accel: '3.5s', handling: '94%', armor: '58%', defaultColor: 0x14b8a6, bodyType: 'hot_hatch' },
  { id: 'car_15', name: 'CYBER 4WD', class: 'ARMORED WEDGE', price: 130000, speed: 252, accel: '3.2s', handling: '82%', armor: '98%', defaultColor: 0x94a3b8, bodyType: 'cyber_wedge' },
  { id: 'car_16', name: 'POLICE INTERCEPTOR', class: 'PURSUIT CRUISER', price: 150000, speed: 260, accel: '3.1s', handling: '89%', armor: '88%', defaultColor: 0x1e293b, bodyType: 'police' },
  { id: 'car_17', name: 'CLASSIC HOTROD', class: 'VINTAGE CHOPPED', price: 170000, speed: 242, accel: '3.3s', handling: '72%', armor: '70%', defaultColor: 0xb91c1c, bodyType: 'hotrod' },
  { id: 'car_18', name: 'GT WIDEBODY', class: 'SUPER TUNER', price: 195000, speed: 270, accel: '2.9s', handling: '93%', armor: '72%', defaultColor: 0xf43f5e, bodyType: 'widebody' },
  { id: 'car_19', name: 'HYPER SPECTRE', class: 'LE-MANS PROTOTYPE', price: 220000, speed: 290, accel: '2.7s', handling: '96%', armor: '65%', defaultColor: 0x06b6d4, bodyType: 'hyper_spectre' },
  { id: 'car_20', name: 'DUNE BUGGY', class: 'LIGHTWEIGHT SAND', price: 245000, speed: 228, accel: '3.2s', handling: '90%', armor: '50%', defaultColor: 0x84cc16, bodyType: 'buggy' },
  { id: 'car_21', name: 'SPEED DEMON', class: 'DRAG COUPE', price: 270000, speed: 300, accel: '2.5s', handling: '74%', armor: '75%', defaultColor: 0x7c3aed, bodyType: 'dragster' },
  { id: 'car_22', name: 'MIDNIGHT PROTO', class: 'STEALTH HYPERCAR', price: 300000, speed: 310, accel: '2.4s', handling: '97%', armor: '70%', defaultColor: 0x18181b, bodyType: 'prototype' },
  { id: 'car_23', name: 'MONSTER RIG', class: 'HEAVY DIESEL', price: 330000, speed: 176, accel: '4.8s', handling: '65%', armor: '100%', defaultColor: 0xc2410c, bodyType: 'heavy_rig' },
  { id: 'car_24', name: 'RALLY MONSTER', class: 'GROUP-B TURBO', price: 360000, speed: 265, accel: '2.8s', handling: '95%', armor: '78%', defaultColor: 0xfacc15, bodyType: 'rally' },
  { id: 'car_25', name: 'SUPERLEGGERA', class: 'CARBON EXOTIC', price: 400000, speed: 320, accel: '2.3s', handling: '98%', armor: '62%', defaultColor: 0xff0055, bodyType: 'superleggera' },
  { id: 'car_26', name: 'VOLT RACER', class: 'ELECTRIC HYPERCAR', price: 440000, speed: 332, accel: '2.1s', handling: '95%', armor: '76%', defaultColor: 0x38bdf8, bodyType: 'electric' },
  { id: 'car_27', name: 'RETRO BUS', class: 'CLASSIC CAMPER', price: 480000, speed: 168, accel: '5.8s', handling: '64%', armor: '88%', defaultColor: 0x059669, bodyType: 'bus' },
  { id: 'car_28', name: 'GHOST SPIDER', class: 'OPEN COCKPIT', price: 520000, speed: 315, accel: '2.4s', handling: '97%', armor: '56%', defaultColor: 0xf97316, bodyType: 'spider' },
  { id: 'car_29', name: 'SHADOW VIPER', class: 'AMERICAN V10', price: 560000, speed: 305, accel: '2.6s', handling: '87%', armor: '78%', defaultColor: 0x4f46e5, bodyType: 'muscle' },
  { id: 'car_30', name: 'HORIZON T-TOP', class: '80S SYNTHWAVE', price: 600000, speed: 278, accel: '3.0s', handling: '86%', armor: '70%', defaultColor: 0xdb2777, bodyType: 't_top' },
  { id: 'car_31', name: 'INTERCEPTOR HIGHWAY', class: 'ENFORCER SPEC', price: 650000, speed: 312, accel: '2.5s', handling: '91%', armor: '92%', defaultColor: 0x111827, bodyType: 'police' },
  { id: 'car_32', name: 'SOLAR GT', class: 'AERO COUPE', price: 700000, speed: 325, accel: '2.3s', handling: '95%', armor: '68%', defaultColor: 0xeab308, bodyType: 'sports_gt' },
  { id: 'car_33', name: 'STEALTH WEDGE', class: 'FUTURISTIC CONCEPT', price: 750000, speed: 335, accel: '2.2s', handling: '96%', armor: '74%', defaultColor: 0x334155, bodyType: 'cyber_wedge' },
  { id: 'car_34', name: 'TITAN DIESEL', class: 'ARMORED 6X6', price: 800000, speed: 198, accel: '4.2s', handling: '70%', armor: '100%', defaultColor: 0x475569, bodyType: 'heavy_rig' },
  { id: 'car_35', name: 'TRACK DAY GT', class: 'HOMOLOGATION SPEC', price: 860000, speed: 342, accel: '2.2s', handling: '98%', armor: '68%', defaultColor: 0xef4444, bodyType: 'widebody' },
  { id: 'car_36', name: 'THUNDER V8', class: 'PRO-STOCK DRAGSTER', price: 920000, speed: 338, accel: '2.1s', handling: '77%', armor: '76%', defaultColor: 0x10b981, bodyType: 'dragster' },
  { id: 'car_37', name: 'CIRCUIT HERO', class: 'TOURING CAR', price: 980000, speed: 328, accel: '2.4s', handling: '97%', armor: '75%', defaultColor: 0x2563eb, bodyType: 'widebody' },
  { id: 'car_38', name: 'NEON ROADSTER', class: 'CYBER CONVERTIBLE', price: 1050000, speed: 346, accel: '2.2s', handling: '96%', armor: '62%', defaultColor: 0x06b6d4, bodyType: 'cabrio' },
  { id: 'car_39', name: 'BLACK VIPER', class: 'SPECIAL OPS SUPERCAR', price: 1150000, speed: 355, accel: '2.0s', handling: '98%', armor: '82%', defaultColor: 0x09090b, bodyType: 'superleggera' },
  { id: 'car_40', name: 'VOLT FORMULA', class: 'OPEN WHEEL RACER', price: 1250000, speed: 368, accel: '1.9s', handling: '100%', armor: '52%', defaultColor: 0x00f0ff, bodyType: 'formula' },
  { id: 'car_41', name: 'APEX FORMULA', class: 'GRAND PRIX MONSTER', price: 1350000, speed: 382, accel: '1.8s', handling: '100%', armor: '54%', defaultColor: 0xd90429, bodyType: 'formula' },
  { id: 'car_42', name: 'GALAXY HYPERDRIVE', class: 'ULTIMATE HYPERCAR', price: 1500000, speed: 400, accel: '1.7s', handling: '100%', armor: '90%', defaultColor: 0x8b5cf6, bodyType: 'hyper_spectre' },
];

export const WHEEL_TYPES = [
  { id: 'classic_steelie', name: 'CLASSIC STEELIE', rimColor: 0xd1d5db },
  { id: 'sport_5spoke', name: 'SPORT 5-SPOKE', rimColor: 0xe2e8f0 },
  { id: 'chrome_deepdish', name: 'CHROME DEEP DISH', rimColor: 0xffffff, metalness: 0.9 },
  { id: 'gold_tuner', name: 'GOLD JDM MESH', rimColor: 0xf59e0b },
  { id: 'white_rally', name: 'WHITE RALLY DISC', rimColor: 0xf8fafc },
  { id: 'cyber_disc', name: 'CYBER AERO DISC', rimColor: 0x00f0ff, emissive: 0x00f0ff }
];

export class CarModel {
  constructor(options = {}) {
    this.type = options.type || 'car_01';
    // Backwards compatibility for old names
    this.remapLegacyType();

    this.carData = VEHICLES_CATALOG.find(c => c.id === this.type) || VEHICLES_CATALOG[0];
    let col = options.color !== undefined ? options.color : this.carData.defaultColor;
    if (typeof col === 'string' && col.startsWith('0x')) {
      col = parseInt(col, 16);
    }
    this.color = col;
    this.wheelType = options.wheelType || 'sport_5spoke';
    this.isPlayer = options.isPlayer ?? true;
    this.mesh = new THREE.Group();

    this.wheelMeshes = [];
    this.steerWheels = [];
    this.bodyMaterials = [];
    this.rimMaterials = [];
    this.brakeLightMat = null;
    this.headlightMat = null;
    this.sirenLights = [];

    this.buildCar();
    this.setWheelType(this.wheelType);
  }

  remapLegacyType() {
    const legacyMap = {
      'suv_cruiser': 'car_03',
      'red_truck': 'car_04',
      'phantom_gt': 'car_09',
      'muscle_v8': 'car_07',
      'cyber_pickup': 'car_15',
      'hyper_spectre': 'car_19'
    };
    if (legacyMap[this.type]) {
      this.type = legacyMap[this.type];
    }
  }

  buildCar() {
    const bType = this.carData.bodyType;
    if (bType === 'suv') this.buildSUV();
    else if (bType === 'pickup') this.buildPickupTruck();
    else if (bType === 'muscle' || bType === 'dragster') this.buildMuscleCar();
    else if (bType === 'cyber_wedge') this.buildCyberWedge();
    else if (bType === 'hyper_spectre' || bType === 'prototype') this.buildHyperSpectre();
    else if (bType === 'hatchback' || bType === 'hot_hatch') this.buildHatchback();
    else if (bType === 'sedan' || bType === 'luxury') this.buildSedan();
    else if (bType === 'coupe' || bType === 'tuner' || bType === 'widebody') this.buildTunerCoupe();
    else if (bType === 'cabrio' || bType === 'spider') this.buildConvertible();
    else if (bType === 'van' || bType === 'bus') this.buildVan();
    else if (bType === 'police') this.buildPoliceCruiser();
    else if (bType === 'taxi') this.buildTaxi();
    else if (bType === 'formula') this.buildFormulaCar();
    else if (bType === 'superleggera' || bType === 'electric') this.buildSuperleggera();
    else if (bType === 'offroad' || bType === 'buggy') this.buildOffroad();
    else if (bType === 'heavy_rig') this.buildHeavyRig();
    else this.buildSportsGT();

    // Subtle contact ambient-occlusion shadow beneath chassis
    this.addContactShadow();

    // Enable soft real-time shadows
    this.mesh.traverse(obj => {
      if (obj.isMesh && obj !== this.contactShadowMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }

  static getContactShadowTexture() {
    if (CarModel._shadowTex) return CarModel._shadowTex;
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext ? canvas.getContext('2d') : null;
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 15, 64, 64, 60);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.38)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    CarModel._shadowTex = new THREE.CanvasTexture(canvas);
    return CarModel._shadowTex;
  }

  addContactShadow(width = 2.1, length = 4.4) {
    const tex = CarModel.getContactShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    const shadowGeo = new THREE.PlaneGeometry(width, length);
    shadowGeo.rotateX(-Math.PI / 2);
    this.contactShadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadowMesh.position.set(0, 0.02, 0);
    this.mesh.add(this.contactShadowMesh);
  }

  createBodyMat() {
    const mat = new THREE.MeshStandardMaterial({
      color: this.color,
      roughness: 0.28,
      metalness: 0.48,
      flatShading: true
    });
    this.bodyMaterials.push(mat);
    return mat;
  }

  buildHatchback() {
    const bodyMat = this.createBodyMat();
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x111827 });
    const trimMat = new THREE.MeshLambertMaterial({ color: 0x1e293b, flatShading: true });

    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.55, 3.8), bodyMat);
    hull.position.y = 0.52;
    this.mesh.add(hull);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.58, 2.4), glassMat);
    cabin.position.set(0, 0.98, -0.3);
    this.mesh.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 2.3), bodyMat);
    roof.position.set(0, 1.28, -0.3);
    this.mesh.add(roof);

    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.3), trimMat);
    spoiler.position.set(0, 1.3, -1.48);
    this.mesh.add(spoiler);

    this.addHeadlights(0.68, 0.54, 1.88);
    this.addTaillights(0.68, 0.65, -1.88);
    this.createWheels(0.34, 0.28, 1.7, 3.6);
  }

  buildSedan() {
    const bodyMat = this.createBodyMat();
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.52, 4.4), bodyMat);
    chassis.position.y = 0.52;
    this.mesh.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.55, 2.3), glassMat);
    cabin.position.set(0, 0.96, -0.2);
    this.mesh.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.06, 2.0), bodyMat);
    roof.position.set(0, 1.25, -0.2);
    this.mesh.add(roof);

    this.addHeadlights(0.72, 0.54, 2.18);
    this.addTaillights(0.72, 0.62, -2.18);
    this.createWheels(0.36, 0.3, 1.78, 4.2);
  }

  buildTunerCoupe() {
    const bodyMat = this.createBodyMat();
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x0a0f1d });
    const carbonMat = new THREE.MeshLambertMaterial({ color: 0x111827, flatShading: true });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.48, 4.5), bodyMat);
    body.position.y = 0.48;
    this.mesh.add(body);

    const skirts = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.12, 4.4), carbonMat);
    skirts.position.y = 0.26;
    this.mesh.add(skirts);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.52, 2.1), glassMat);
    cabin.position.set(0, 0.88, -0.25);
    this.mesh.add(cabin);

    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.06, 0.35), carbonMat);
    wing.position.set(0, 1.05, -2.15);
    this.mesh.add(wing);

    this.addHeadlights(0.75, 0.48, 2.22);
    this.addTaillights(0.75, 0.58, -2.22);
    this.createWheels(0.36, 0.32, 1.88, 4.3);
  }

  buildConvertible() {
    const bodyMat = this.createBodyMat();
    const interiorMat = new THREE.MeshLambertMaterial({ color: 0x1e1e1e });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x0f172a, transparent: true, opacity: 0.7 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.5, 4.3), bodyMat);
    body.position.y = 0.5;
    this.mesh.add(body);

    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 1.8), interiorMat);
    cockpit.position.set(0, 0.65, -0.1);
    this.mesh.add(cockpit);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.1), glassMat);
    windshield.position.set(0, 0.95, 0.8);
    windshield.rotation.x = -0.35;
    this.mesh.add(windshield);

    this.addHeadlights(0.72, 0.52, 2.12);
    this.addTaillights(0.72, 0.6, -2.12);
    this.createWheels(0.36, 0.3, 1.82, 4.1);
  }

  buildVan() {
    const bodyMat = this.createBodyMat();
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.4, 4.8), bodyMat);
    body.position.y = 1.0;
    this.mesh.add(body);

    const frontWindshield = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.6, 0.1), glassMat);
    frontWindshield.position.set(0, 1.25, 2.38);
    frontWindshield.rotation.x = -0.15;
    this.mesh.add(frontWindshield);

    this.addHeadlights(0.8, 0.7, 2.38);
    this.addTaillights(0.8, 0.8, -2.38);
    this.createWheels(0.4, 0.32, 1.95, 4.6);
  }

  buildPoliceCruiser() {
    this.buildSedan();
    const barMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
    const redSiren = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const blueSiren = new THREE.MeshBasicMaterial({ color: 0x0066ff });

    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.2), barMat);
    bar.position.set(0, 1.35, -0.2);
    this.mesh.add(bar);

    const redLight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.18), redSiren);
    redLight.position.set(-0.35, 1.42, -0.2);
    this.mesh.add(redLight);

    const blueLight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.18), blueSiren);
    blueLight.position.set(0.35, 1.42, -0.2);
    this.mesh.add(blueLight);

    this.sirenLights = [redLight, blueLight];
  }

  buildTaxi() {
    this.buildSedan();
    const signMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    const taxiSign = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.16, 0.25), signMat);
    taxiSign.position.set(0, 1.38, -0.2);
    this.mesh.add(taxiSign);
  }

  buildFormulaCar() {
    const bodyMat = this.createBodyMat();
    const carbonMat = new THREE.MeshLambertMaterial({ color: 0x111827, flatShading: true });
    const helmetMat = new THREE.MeshLambertMaterial({ color: 0xffea00 });

    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.32, 3.2), bodyMat);
    nose.position.set(0, 0.35, 0.8);
    this.mesh.add(nose);

    const frontWing = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.06, 0.45), carbonMat);
    frontWing.position.set(0, 0.22, 2.3);
    this.mesh.add(frontWing);

    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.42, 1.8), carbonMat);
    cockpit.position.set(0, 0.45, -0.8);
    this.mesh.add(cockpit);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), helmetMat);
    helmet.position.set(0, 0.72, -0.6);
    this.mesh.add(helmet);

    const rearWing = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.5), carbonMat);
    rearWing.position.set(0, 0.95, -2.1);
    this.mesh.add(rearWing);

    this.addTaillights(0.3, 0.45, -2.0);
    this.createWheels(0.38, 0.42, 2.1, 4.4);
  }

  buildSuperleggera() {
    const bodyMat = this.createBodyMat();
    const carbonMat = new THREE.MeshLambertMaterial({ color: 0x111827 });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x0f172a, transparent: true, opacity: 0.85 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.4, 4.6), bodyMat);
    body.position.y = 0.42;
    this.mesh.add(body);

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 2.2), glassMat);
    canopy.position.set(0, 0.8, -0.2);
    this.mesh.add(canopy);

    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.15, 0.8), carbonMat);
    diffuser.position.set(0, 0.3, -2.2);
    this.mesh.add(diffuser);

    this.addHeadlights(0.8, 0.45, 2.25);
    this.addTaillights(0.8, 0.55, -2.25);
    this.createWheels(0.36, 0.35, 1.95, 4.4);
  }

  buildOffroad() {
    const bodyMat = this.createBodyMat();
    const rollMat = new THREE.MeshLambertMaterial({ color: 0x1f2937, flatShading: true });

    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.6, 3.8), bodyMat);
    hull.position.y = 0.7;
    this.mesh.add(hull);

    const cage = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.75, 2.2), rollMat);
    cage.position.set(0, 1.35, -0.2);
    this.mesh.add(cage);

    this.addHeadlights(0.7, 0.8, 1.88);
    this.addTaillights(0.7, 0.8, -1.88);
    this.createWheels(0.48, 0.42, 1.95, 3.8);
  }

  buildHeavyRig() {
    const bodyMat = this.createBodyMat();
    const chromeMat = new THREE.MeshLambertMaterial({ color: 0xd1d5db });

    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.9, 4.6), bodyMat);
    cab.position.y = 1.3;
    this.mesh.add(cab);

    const pipes = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6), chromeMat);
    pipes.position.set(-1.1, 2.1, -1.2);
    this.mesh.add(pipes);

    this.addHeadlights(0.9, 0.8, 2.28);
    this.addTaillights(0.9, 0.8, -2.28);
    this.createWheels(0.5, 0.45, 2.1, 4.4);
  }

  buildSUV() {
    const bodyMat = this.createBodyMat();
    const trimMat = new THREE.MeshLambertMaterial({ color: 0x222222, flatShading: true });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x1a2332 });

    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.68, 4.4), bodyMat);
    lowerBody.position.y = 0.65;
    this.mesh.add(lowerBody);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.65, 2.7), glassMat);
    cabin.position.set(0, 1.25, -0.2);
    this.mesh.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 2.6), bodyMat);
    roof.position.set(0, 1.6, -0.2);
    this.mesh.add(roof);

    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 1.9), trimMat);
    rack.position.set(0, 1.7, -0.2);
    this.mesh.add(rack);

    this.addHeadlights(0.78, 0.72, 2.18);
    this.addTaillights(0.78, 0.78, -2.18);
    this.createWheels(0.42, 0.35, 1.92, 4.2);
  }

  buildPickupTruck() {
    const bodyMat = this.createBodyMat();
    const trimMat = new THREE.MeshLambertMaterial({ color: 0x222222, flatShading: true });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x112233 });

    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 2.2), bodyMat);
    cab.position.set(0, 0.75, 0.6);
    this.mesh.add(cab);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.52, 1.1), glassMat);
    windshield.position.set(0, 1.0, 0.5);
    this.mesh.add(windshield);

    const bedBase = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.35, 2.2), bodyMat);
    bedBase.position.set(0, 0.52, -1.4);
    this.mesh.add(bedBase);

    const bedWallL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.52, 2.2), bodyMat);
    bedWallL.position.set(-0.94, 0.8, -1.4);
    this.mesh.add(bedWallL);

    const bedWallR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.52, 2.2), bodyMat);
    bedWallR.position.set(0.94, 0.8, -1.4);
    this.mesh.add(bedWallR);

    const tailgate = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.52, 0.12), trimMat);
    tailgate.position.set(0, 0.8, -2.48);
    this.mesh.add(tailgate);

    this.addHeadlights(0.78, 0.72, 1.68);
    this.addTaillights(0.78, 0.75, -2.5);
    this.createWheels(0.42, 0.35, 1.9, 4.2);
  }

  buildMuscleCar() {
    const bodyMat = this.createBodyMat();
    const trimMat = new THREE.MeshLambertMaterial({ color: 0x111111, flatShading: true });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });

    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.52, 4.6), bodyMat);
    lowerBody.position.y = 0.52;
    this.mesh.add(lowerBody);

    const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.12, 0.9), trimMat);
    scoop.position.set(0, 0.82, 1.1);
    this.mesh.add(scoop);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.5, 2.2), glassMat);
    cabin.position.set(0, 0.95, -0.3);
    this.mesh.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.06, 1.7), bodyMat);
    roof.position.set(0, 1.22, -0.3);
    this.mesh.add(roof);

    this.addHeadlights(0.78, 0.54, 2.28);
    this.addTaillights(0.78, 0.62, -2.28);
    this.createWheels(0.38, 0.36, 1.9, 4.3);
  }

  buildCyberWedge() {
    const bodyMat = this.createBodyMat();
    const darkSteelMat = new THREE.MeshLambertMaterial({ color: 0x1e242d, flatShading: true });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x0a101d });

    const hull = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.7, 4.8), bodyMat);
    hull.position.y = 0.65;
    this.mesh.add(hull);

    const roofApex = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.75, 2.6), bodyMat);
    roofApex.position.set(0, 1.3, -0.2);
    roofApex.rotation.x = -0.05;
    this.mesh.add(roofApex);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.65, 1.8), glassMat);
    windshield.position.set(0, 1.25, 0.95);
    windshield.rotation.x = -0.42;
    this.mesh.add(windshield);

    const vault = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.45, 1.9), darkSteelMat);
    vault.position.set(0, 1.05, -1.45);
    vault.rotation.x = 0.15;
    this.mesh.add(vault);

    this.headlightMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const frontLed = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 0.1), this.headlightMat);
    frontLed.position.set(0, 0.85, 2.42);
    this.mesh.add(frontLed);

    this.brakeLightMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const rearLed = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 0.1), this.brakeLightMat);
    rearLed.position.set(0, 0.9, -2.42);
    this.mesh.add(rearLed);

    this.createWheels(0.44, 0.38, 2.15, 4.5);
  }

  buildHyperSpectre() {
    const bodyMat = this.createBodyMat();
    const carbonMat = new THREE.MeshLambertMaterial({ color: 0x141820, flatShading: true });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.38, 4.7), bodyMat);
    chassis.position.y = 0.38;
    this.mesh.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.42, 2.1), glassMat);
    cabin.position.set(0, 0.75, -0.2);
    this.mesh.add(cabin);

    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.06, 0.45), carbonMat);
    wing.position.set(0, 1.08, -2.1);
    this.mesh.add(wing);

    this.addHeadlights(0.8, 0.46, 2.32);
    this.addTaillights(0.8, 0.54, -2.32);
    this.createWheels(0.36, 0.34, 2.05, 4.4);
  }

  buildSportsGT() {
    const bodyMat = this.createBodyMat();
    const carbonMat = new THREE.MeshLambertMaterial({ color: 0x18181b, flatShading: true });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x0a101d });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.46, 4.4), bodyMat);
    body.position.y = 0.46;
    this.mesh.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.48, 2.0), glassMat);
    cabin.position.set(0, 0.88, -0.2);
    this.mesh.add(cabin);

    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.06, 0.32), carbonMat);
    spoiler.position.set(0, 0.98, -2.1);
    this.mesh.add(spoiler);

    this.addHeadlights(0.74, 0.48, 2.18);
    this.addTaillights(0.74, 0.58, -2.18);
    this.createWheels(0.36, 0.32, 1.86, 4.2);
  }

  addHeadlights(xOffset, yOffset, zOffset) {
    this.headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hlGeo = new THREE.BoxGeometry(0.32, 0.12, 0.08);

    const hlL = new THREE.Mesh(hlGeo, this.headlightMat);
    hlL.position.set(-xOffset, yOffset, zOffset);
    this.mesh.add(hlL);

    const hlR = new THREE.Mesh(hlGeo, this.headlightMat);
    hlR.position.set(xOffset, yOffset, zOffset);
    this.mesh.add(hlR);
  }

  addTaillights(xOffset, yOffset, zOffset) {
    this.brakeLightMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    const tlGeo = new THREE.BoxGeometry(0.32, 0.12, 0.08);

    const tlL = new THREE.Mesh(tlGeo, this.brakeLightMat);
    tlL.position.set(-xOffset, yOffset, zOffset);
    this.mesh.add(tlL);

    const tlR = new THREE.Mesh(tlGeo, this.brakeLightMat);
    tlR.position.set(xOffset, yOffset, zOffset);
    this.mesh.add(tlR);
  }

  createWheels(radius = 0.38, width = 0.32, trackWidth = 1.9, wheelbase = 4.2) {
    const tireMat = new THREE.MeshLambertMaterial({ color: 0x141414 });
    const rimMat = new THREE.MeshLambertMaterial({ color: 0xd1d5db });
    this.rimMaterials.push(rimMat);

    const halfW = trackWidth / 2;
    const halfL = wheelbase / 3.1;

    const wheelConfig = [
      { x: -halfW, y: radius, z: halfL, isFront: true },
      { x: halfW, y: radius, z: halfL, isFront: true },
      { x: -halfW, y: radius, z: -halfL, isFront: false },
      { x: halfW, y: radius, z: -halfL, isFront: false },
    ];

    wheelConfig.forEach((cfg) => {
      const steerPivot = new THREE.Group();
      steerPivot.position.set(cfg.x, cfg.y, cfg.z);

      const spinHub = new THREE.Group();
      const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 16);
      tireGeo.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, tireMat);
      spinHub.add(tire);

      const rimGeo = new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, width + 0.02, 12);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      spinHub.add(rim);

      steerPivot.add(spinHub);
      this.mesh.add(steerPivot);

      this.wheelMeshes.push(spinHub);
      if (cfg.isFront) {
        this.steerWheels.push(steerPivot);
      }
    });
  }

  setColor(hexColor) {
    let col = hexColor;
    if (typeof col === 'string' && col.startsWith('0x')) {
      col = parseInt(col, 16);
    }
    this.color = Number(col);
    this.bodyMaterials.forEach(mat => {
      mat.color.setHex(this.color);
    });
  }

  setWheelType(typeKey) {
    this.wheelType = typeKey;
    const rimCfg = WHEEL_TYPES.find(w => w.id === typeKey) || WHEEL_TYPES[1];
    this.rimMaterials.forEach(mat => {
      mat.color.setHex(rimCfg.rimColor);
      if (rimCfg.emissive) {
        mat.emissive = new THREE.Color(rimCfg.emissive);
      } else if (mat.emissive) {
        mat.emissive = new THREE.Color(0x000000);
      }
    });
  }

  updateVisuals(speed, steerAngle, isBraking, isReversing) {
    const spinSpeed = (speed / 3.6) * 0.12;
    this.wheelMeshes.forEach(w => { w.rotation.x += spinSpeed; });
    this.steerWheels.forEach(sw => { sw.rotation.y = steerAngle; });

    // Siren flashing if police
    if (this.sirenLights.length >= 2) {
      const flash = Math.floor(Date.now() / 150) % 2 === 0;
      this.sirenLights[0].visible = flash;
      this.sirenLights[1].visible = !flash;
    }
  }
}
