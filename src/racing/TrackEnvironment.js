import * as THREE from 'three';
import { circuitSpline } from './TrackSpline.js';

/**
 * TrackEnvironment: Generates 3D Circuit geometry in a vibrant retro pixelated arcade art style:
 * - Wider 20m asphalt road with 3D overpass bridge and underpass
 * - Downtown Metropolis Skyline: 30+ pixelated skyscrapers with lighted windows
 * - 2-tier spectator grandstands with animated crowd colors and flags
 * - Neon sponsor billboards (SPEED ORDER, NITRO, DRIFT SYNDICATE)
 * - 60+ dense stylized pixel-art trees and infield flower groves
 * - Stadium floodlight towers and trackside streetlamps
 * - Border stunt ramps with hazard chevrons
 */
export class TrackEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.spline = circuitSpline;
    this.trackLength = this.spline.totalLength;
    this.roadWidth = 20;

    this.ramps = [];

    this.buildTerrain();
    this.buildCircuitRoadAndBridge();
    this.buildBorderRamps();
    this.buildCitySkyscrapers();
    this.buildGrandstandsAndPaddock();
    this.buildNeonBillboards();
    this.buildStadiumLights();
    this.buildDenseTreeGroves();
    this.buildFinishLine();
  }

  buildTerrain() {
    const terrainGeo = new THREE.PlaneGeometry(800, 800);
    terrainGeo.rotateX(-Math.PI / 2);
    // Vibrant racetrack infield grass with flat shading
    const terrainMat = new THREE.MeshLambertMaterial({
      color: 0x589432,
      flatShading: true
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.position.set(0, -0.05, 0);
    this.scene.add(terrain);
  }

  buildCircuitRoadAndBridge() {
    const numSteps = 600;
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x2e333d, flatShading: true });
    const bridgeConcreteMat = new THREE.MeshLambertMaterial({ color: 0x525a66, flatShading: true });
    const guardrailMat = new THREE.MeshLambertMaterial({ color: 0x8fa2b2, flatShading: true });
    const redKerbMat = new THREE.MeshBasicMaterial({ color: 0xee2222 });
    const whiteKerbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const roadGeo = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= numSteps; i++) {
      const t = i / numSteps;
      const pt = this.spline.getPointAt(t);
      const tangent = this.spline.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const leftPt = pt.clone().addScaledVector(normal, -this.roadWidth / 2);
      const rightPt = pt.clone().addScaledVector(normal, this.roadWidth / 2);

      positions.push(leftPt.x, leftPt.y + 0.04, leftPt.z);
      positions.push(rightPt.x, rightPt.y + 0.04, rightPt.z);

      uvs.push(0, t * 100);
      uvs.push(1, t * 100);

      if (i < numSteps) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }

      // 1. Red & White Rumble Kerbs
      if (i % 2 === 0) {
        const isRed = Math.floor(i / 2) % 2 === 0;
        const curMat = isRed ? redKerbMat : whiteKerbMat;

        const curbL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.22, 1.4), curMat);
        curbL.position.copy(leftPt);
        curbL.position.y += 0.1;
        curbL.lookAt(leftPt.clone().add(tangent));
        this.scene.add(curbL);

        const curbR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.22, 1.4), curMat);
        curbR.position.copy(rightPt);
        curbR.position.y += 0.1;
        curbR.lookAt(rightPt.clone().add(tangent));
        this.scene.add(curbR);
      }

      // 2. OVERPASS BRIDGE STRUCTURE (when track rises above Y = 1.5m)
      if (pt.y > 1.5) {
        const railL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.3, 1.8), guardrailMat);
        railL.position.copy(leftPt).addScaledVector(normal, -0.2);
        railL.position.y += 0.65;
        railL.lookAt(leftPt.clone().add(tangent));
        this.scene.add(railL);

        const railR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.3, 1.8), guardrailMat);
        railR.position.copy(rightPt).addScaledVector(normal, 0.2);
        railR.position.y += 0.65;
        railR.lookAt(rightPt.clone().add(tangent));
        this.scene.add(railR);

        // Support Pillars
        if (i % 8 === 0 && pt.y > 3.0) {
          const colGeo = new THREE.CylinderGeometry(1.2, 1.4, pt.y, 8);
          const colL = new THREE.Mesh(colGeo, bridgeConcreteMat);
          colL.position.copy(leftPt);
          colL.position.y = pt.y / 2;
          this.scene.add(colL);

          const colR = new THREE.Mesh(colGeo, bridgeConcreteMat);
          colR.position.copy(rightPt);
          colR.position.y = pt.y / 2;
          this.scene.add(colR);

          const beam = new THREE.Mesh(new THREE.BoxGeometry(this.roadWidth + 2.5, 1.1, 2.2), bridgeConcreteMat);
          beam.position.copy(pt);
          beam.position.y -= 0.65;
          beam.lookAt(pt.clone().add(normal));
          this.scene.add(beam);
        }
      }

      // 3. UNDERPASS PORTAL PILLARS
      const distToOverpassApex = Math.hypot(pt.x - (-15), pt.z - 45);
      if (distToOverpassApex < 24 && pt.y < 1.0) {
        if (i % 6 === 0) {
          const tunnelPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 8.5, 8), bridgeConcreteMat);
          tunnelPillar.position.copy(leftPt).addScaledVector(normal, -1.6);
          tunnelPillar.position.y = 4.25;
          this.scene.add(tunnelPillar);

          const tunnelPillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 8.5, 8), bridgeConcreteMat);
          tunnelPillarR.position.copy(rightPt).addScaledVector(normal, 1.6);
          tunnelPillarR.position.y = 4.25;
          this.scene.add(tunnelPillarR);
        }
      }
    }

    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    this.scene.add(roadMesh);
  }

  buildBorderRamps() {
    const rampSpans = [160, 360, 600, 880, 1140, 1380];
    const rampMat = new THREE.MeshLambertMaterial({ color: 0xffaa00, flatShading: true });
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    rampSpans.forEach((dist, idx) => {
      const t = this.spline.distToT(dist);
      const pt = this.spline.getPointAt(t);
      const tangent = this.spline.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const side = idx % 2 === 0 ? -1 : 1;
      const d = side * (this.roadWidth / 2 - 2.2);

      const rampPos = pt.clone().addScaledVector(normal, d);
      rampPos.y = pt.y + 0.1;

      const rampGroup = new THREE.Group();
      rampGroup.position.copy(rampPos);

      const trackAngle = Math.atan2(tangent.x, tangent.z);
      rampGroup.rotation.y = trackAngle;

      const wedge = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.45, 5.0), rampMat);
      wedge.position.set(0, 0.75, 0);
      wedge.rotation.x = -0.22;
      rampGroup.add(wedge);

      for (let a = -1; a <= 1; a++) {
        const arrow = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.45), arrowMat);
        arrow.rotation.x = -Math.PI / 2 - 0.22;
        arrow.position.set(0, 1.0 + a * 0.35, a * 1.3);
        rampGroup.add(arrow);
      }

      this.scene.add(rampGroup);

      this.ramps.push({
        s: dist,
        d,
        pos: rampPos,
        width: 3.8,
        length: 5.5,
        height: 1.8
      });
    });
  }

  buildCitySkyscrapers() {
    const bldgGroup = new THREE.Group();
    const colors = [0x1d293d, 0x22354d, 0x182436, 0x2a3e5c, 0x334466];
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xffec99 });
    const roofNeonMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    // Grid of perimeter skyscrapers creating a bustling cityscape backdrop
    const bldgSpawns = [
      // North skyline
      [-160, 160], [-110, 175], [-60, 165], [-10, 180], [40, 170], [90, 185], [140, 160], [180, 150],
      // East skyline
      [190, 90], [195, 40], [190, -20], [185, -70], [180, -120], [160, -160],
      // South skyline
      [110, -190], [60, -195], [10, -200], [-50, -190], [-110, -195], [-160, -180],
      // West skyline
      [-190, -120], [-195, -60], [-190, 0], [-195, 60], [-180, 110]
    ];

    bldgSpawns.forEach((spawn, idx) => {
      const h = 32 + (idx % 7) * 8 + Math.random() * 10;
      const w = 18 + Math.random() * 8;
      const d = 18 + Math.random() * 8;

      const mat = new THREE.MeshLambertMaterial({
        color: colors[idx % colors.length],
        flatShading: true
      });

      const bldg = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      bldg.position.set(spawn[0], h / 2, spawn[1]);
      bldgGroup.add(bldg);

      // Lighted Windows strips
      const winCount = 4;
      for (let y = 6; y < h - 4; y += 6) {
        const winStrip = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.8, 1.6), windowMat);
        winStrip.position.set(spawn[0], y, spawn[1] + d / 2 + 0.1);
        bldgGroup.add(winStrip);
      }

      // Rooftop Neon spire / antenna
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 7, 4), roofNeonMat);
      spire.position.set(spawn[0], h + 3.5, spawn[1]);
      bldgGroup.add(spire);
    });

    this.scene.add(bldgGroup);
  }

  buildGrandstandsAndPaddock() {
    const paddockGroup = new THREE.Group();
    const concreteMat = new THREE.MeshLambertMaterial({ color: 0xccd4dd, flatShading: true });
    const canopyMat = new THREE.MeshLambertMaterial({ color: 0xd9381e, flatShading: true }); // Racing red
    const crowdColors = [0xff3366, 0x33ccff, 0xffcc00, 0x33ff66, 0xffffff];

    // 1. Two-Tier Main Grandstand along bottom straight
    const standW = 110;
    const stand = new THREE.Mesh(new THREE.BoxGeometry(standW, 6.0, 16), concreteMat);
    stand.position.set(10, 3.0, -172);
    paddockGroup.add(stand);

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(standW + 4, 1.2, 18), canopyMat);
    canopy.position.set(10, 8.5, -170);
    paddockGroup.add(canopy);

    // Pixelated Spectator Crowd Blocks
    for (let c = -standW / 2 + 5; c < standW / 2 - 5; c += 3.5) {
      for (let row = 0; row < 2; row++) {
        const col = crowdColors[Math.floor(Math.random() * crowdColors.length)];
        const crowdMesh = new THREE.Mesh(
          new THREE.BoxGeometry(2.4, 1.2, 2.0),
          new THREE.MeshLambertMaterial({ color: col, flatShading: true })
        );
        crowdMesh.position.set(10 + c, 6.2 + row * 1.0, -174 + row * 3.5);
        paddockGroup.add(crowdMesh);
      }
    }

    // 2. Pit Lane Garage Bays (Left of main straight)
    for (let g = 0; g < 4; g++) {
      const garage = new THREE.Mesh(new THREE.BoxGeometry(16, 5.0, 12), concreteMat);
      garage.position.set(-80 + g * 18, 2.5, -170);
      paddockGroup.add(garage);

      // Rollup shutter door
      const door = new THREE.Mesh(
        new THREE.PlaneGeometry(12, 4.0),
        new THREE.MeshLambertMaterial({ color: 0x3d434c, flatShading: true })
      );
      door.position.set(-80 + g * 18, 2.0, -163.9);
      paddockGroup.add(door);
    }

    this.scene.add(paddockGroup);
  }

  buildNeonBillboards() {
    const boardGroup = new THREE.Group();
    const frameMat = new THREE.MeshLambertMaterial({ color: 0x222222, flatShading: true });
    const postMat = new THREE.MeshLambertMaterial({ color: 0x666666, flatShading: true });

    const billboards = [
      { text: 'SPEED ORDER', sub: 'RULE THE STREETS', s: 80, d: -16 },
      { text: 'NITRO BURNOUT', sub: 'MAXIMUM ADRENALINE', s: 300, d: 16 },
      { text: 'DRIFT SYNDICATE', sub: 'CLUTCH & SLIDE', s: 640, d: -16 },
      { text: 'UNDERGROUND 500', sub: 'OUTRUN THE COPS', s: 920, d: 16 },
      { text: 'TURBO HIGHWAY', sub: 'FULL THROTTLE', s: 1200, d: -16 }
    ];

    billboards.forEach(b => {
      const t = this.spline.distToT(b.s);
      const pt = this.spline.getPointAt(t);
      const tangent = this.spline.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const pos = pt.clone().addScaledVector(normal, b.d);
      pos.y = pt.y + 0.1;

      // Canvas Texture
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(0, 0, 512, 128);
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#00f0ff';
      ctx.strokeRect(4, 4, 504, 120);

      ctx.fillStyle = '#ffb703';
      ctx.font = '900 48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(b.text, 256, 58);

      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(b.sub, 256, 100);

      const tex = new THREE.CanvasTexture(canvas);
      const signMat = new THREE.MeshBasicMaterial({ map: tex });

      const sign = new THREE.Mesh(new THREE.PlaneGeometry(16, 4.2), signMat);
      sign.position.copy(pos);
      sign.position.y += 6.5;
      sign.lookAt(sign.position.clone().add(normal.clone().multiplyScalar(b.d > 0 ? -1 : 1)));
      boardGroup.add(sign);

      // Frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(16.5, 4.6, 0.6), frameMat);
      frame.position.copy(sign.position);
      frame.rotation.copy(sign.rotation);
      boardGroup.add(frame);

      // Support Posts
      const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 8.5, 6), postMat);
      postL.position.copy(pos).addScaledVector(tangent, -6);
      postL.position.y = pos.y + 4.25;
      boardGroup.add(postL);

      const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 8.5, 6), postMat);
      postR.position.copy(pos).addScaledVector(tangent, 6);
      postR.position.y = pos.y + 4.25;
      boardGroup.add(postR);
    });

    this.scene.add(boardGroup);
  }

  buildStadiumLights() {
    const lightGroup = new THREE.Group();
    const towerMat = new THREE.MeshLambertMaterial({ color: 0x8899aa, flatShading: true });
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const lightPositions = [
      [80, -110], [140, 0], [90, 80], [-10, 30], [-100, 100], [-120, -50]
    ];

    lightPositions.forEach(p => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 22, 6), towerMat);
      pole.position.set(p[0], 11, p[1]);
      lightGroup.add(pole);

      const head = new THREE.Mesh(new THREE.BoxGeometry(6.5, 2.5, 1.2), towerMat);
      head.position.set(p[0], 22, p[1]);
      lightGroup.add(head);

      for (let bx = -2; bx <= 2; bx += 2) {
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 6), bulbMat);
        bulb.position.set(p[0] + bx, 22, p[1] + 0.6);
        lightGroup.add(bulb);
      }
    });

    this.scene.add(lightGroup);
  }

  buildDenseTreeGroves() {
    const treeGroup = new THREE.Group();
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a3222, flatShading: true });
    const foliageColors = [0x2e6b22, 0x3d822d, 0x4d9e38, 0x1d5218, 0x5ab840];

    // Tree Grooves scattered across infield islands & outer curves
    const groveCenters = [
      [-95, 35], [-75, 75], [-45, 15], [15, 5], [45, 65],
      [-55, -60], [15, -85], [115, -55], [105, 65], [-125, -95],
      [-25, -30], [65, -15], [-85, -20], [-10, 85], [30, 120]
    ];

    groveCenters.forEach((center, gIdx) => {
      const count = 4 + (gIdx % 3);
      for (let i = 0; i < count; i++) {
        const tx = center[0] + (Math.random() - 0.5) * 18;
        const tz = center[1] + (Math.random() - 0.5) * 18;
        const scale = 0.85 + Math.random() * 0.45;

        const tree = new THREE.Group();
        tree.position.set(tx, 0, tz);

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * scale, 0.5 * scale, 4.0 * scale, 6), trunkMat);
        trunk.position.y = 2.0 * scale;
        tree.add(trunk);

        // Pixel-art layered foliage crowns
        const fMat = new THREE.MeshLambertMaterial({
          color: foliageColors[(gIdx + i) % foliageColors.length],
          flatShading: true
        });

        if (i % 2 === 0) {
          // Conifer / Pine Tree (stacked cones)
          for (let layer = 0; layer < 3; layer++) {
            const cone = new THREE.Mesh(
              new THREE.ConeGeometry((2.6 - layer * 0.6) * scale, 2.4 * scale, 7),
              fMat
            );
            cone.position.y = (3.5 + layer * 1.5) * scale;
            tree.add(cone);
          }
        } else {
          // Broadleaf Tree (faceted dodecahedron)
          const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(2.5 * scale), fMat);
          crown.position.y = 4.8 * scale;
          tree.add(crown);
        }

        treeGroup.add(tree);
      }
    });

    this.scene.add(treeGroup);
  }

  buildFinishLine() {
    const finishPt = this.spline.getPointAt(0.04);
    const tangent = this.spline.getTangentAt(0.04);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const cols = 16;
    const rows = 2;
    const tileW = this.roadWidth / cols;
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const blackMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const tileGeo = new THREE.PlaneGeometry(tileW, 1.2);
    tileGeo.rotateX(-Math.PI / 2);

    const finishGroup = new THREE.Group();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isWhite = (r + c) % 2 === 0;
        const tile = new THREE.Mesh(tileGeo, isWhite ? whiteMat : blackMat);
        const offset = -this.roadWidth / 2 + tileW / 2 + c * tileW;
        tile.position.copy(finishPt)
          .addScaledVector(normal, offset)
          .addScaledVector(tangent, r * 1.2);
        tile.position.y = 0.05;
        tile.lookAt(tile.position.clone().add(tangent));
        finishGroup.add(tile);
      }
    }

    // Overhead Gantry Banner with Finish Banner
    const trussMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
    const span = this.roadWidth + 4;
    const gantry = new THREE.Mesh(new THREE.BoxGeometry(span, 1.2, 1.2), trussMat);
    gantry.position.copy(finishPt);
    gantry.position.y = 9.0;
    gantry.lookAt(finishPt.clone().add(normal));
    finishGroup.add(gantry);

    // Gantry Checkered Signboard
    const signBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(span - 2, 2.2),
      new THREE.MeshBasicMaterial({ color: 0xffd60a })
    );
    signBoard.position.copy(finishPt);
    signBoard.position.y = 9.0;
    signBoard.lookAt(finishPt.clone().add(tangent));
    finishGroup.add(signBoard);

    this.scene.add(finishGroup);
  }
}
