import * as THREE from 'three';
import { CarModel } from '../racing/CarModel.js';

/**
 * MenuScene: 360° Showroom Garage for SPEED ORDER
 */
export class MenuScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.orbitAngles = { theta: 0.8, phi: 0.35 };
    this.targetDistance = 7.0;
    this.currentDistance = 7.0;
    this.autoRotate = true;

    this.init();
    this.setupEvents();
  }

  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e1422);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 200);
    this.updateCameraPosition();

    this.setupLighting();
    this.createEnvironment();

    // 3D Sports Car Showcase
    this.currentCarType = 'car_01';
    this.currentColor = 0x3b82f6;
    this.currentWheelType = 'sport_5spoke';
    this.loadCarModel(this.currentCarType, this.currentColor, this.currentWheelType);
  }

  loadCarModel(type, color, wheelType) {
    if (this.car) {
      this.scene.remove(this.car.mesh);
    }
    this.currentCarType = type;
    this.currentColor = color || this.currentColor;
    this.currentWheelType = wheelType || this.currentWheelType || 'sport_5spoke';
    this.car = new CarModel({ type, color: this.currentColor, wheelType: this.currentWheelType, isPlayer: false });
    this.car.mesh.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    this.scene.add(this.car.mesh);
  }

  setCarPaintColor(hexColor) {
    this.currentColor = hexColor;
    if (this.car) {
      this.car.setColor(hexColor);
    }
  }

  setCarWheelType(wheelType) {
    this.currentWheelType = wheelType;
    if (this.car) {
      this.car.setWheelType(wheelType);
    }
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xddeeff, 2.5);
    dirLight.position.set(10, 25, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 1.0;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -6;
    dirLight.shadow.camera.right = 6;
    dirLight.shadow.camera.top = 6;
    dirLight.shadow.camera.bottom = -6;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.02;
    this.scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0x8899bb, 0x223344, 1.5);
    this.scene.add(hemiLight);

    const cyanRim = new THREE.PointLight(0x00f0ff, 3.5, 20);
    cyanRim.position.set(-6, 2.5, 3);
    this.scene.add(cyanRim);

    const magentaRim = new THREE.PointLight(0xff0055, 3.5, 20);
    magentaRim.position.set(6, 2.5, -3);
    this.scene.add(magentaRim);
  }

  createEnvironment() {
    // Polished asphalt showroom floor with soft specular response
    const roadGeo = new THREE.PlaneGeometry(60, 60);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x121722,
      roughness: 0.32,
      metalness: 0.52
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    this.scene.add(road);

    // Glowing stage circle under car
    const stageRingGeo = new THREE.RingGeometry(3.5, 3.7, 32);
    stageRingGeo.rotateX(-Math.PI / 2);
    const stageRingMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
    const stageRing = new THREE.Mesh(stageRingGeo, stageRingMat);
    stageRing.position.y = 0.02;
    this.scene.add(stageRing);
  }

  setCarPaintColor(hexColor) {
    if (this.car) {
      this.car.setColor(hexColor);
    }
  }

  setupEvents() {
    const onMouseDown = (e) => {
      if (e.target && (e.target.closest('button') || e.target.closest('input') || e.target.closest('.screen-view'))) {
        return;
      }
      this.isDragging = true;
      this.autoRotate = false;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.orbitAngles.theta -= deltaX * 0.007;
      this.orbitAngles.phi = Math.max(0.15, Math.min(Math.PI / 2.2, this.orbitAngles.phi + deltaY * 0.005));

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
      this.updateCameraPosition();
    };

    const onMouseUp = () => { this.isDragging = false; };
    const onWheel = (e) => {
      this.targetDistance = Math.max(4.0, Math.min(12.0, this.targetDistance + e.deltaY * 0.005));
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('resize', () => this.onResize());
  }

  updateCameraPosition() {
    const x = this.currentDistance * Math.sin(this.orbitAngles.phi) * Math.sin(this.orbitAngles.theta);
    const y = this.currentDistance * Math.cos(this.orbitAngles.phi) + 0.6;
    const z = this.currentDistance * Math.sin(this.orbitAngles.phi) * Math.cos(this.orbitAngles.theta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0.6, 0);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  update(deltaTime) {
    if (this.autoRotate) {
      this.orbitAngles.theta += deltaTime * 0.2;
    }
    this.currentDistance += (this.targetDistance - this.currentDistance) * 0.1;
    this.updateCameraPosition();

    if (this.car) {
      this.car.updateVisuals(15, 0, false, false);
    }
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }
}
