/**
 * TrackData.js - Contains definitions and procedural 3D scenery builders
 * for all 7 racing locations across the world.
 */

import * as THREE from 'three';

export const TRACK_LOCATIONS = [
  // 1. GOA MARINE DRIVE
  {
    id: 'goa_marine',
    name: 'Goa Marine Drive',
    country: 'India',
    description: 'Breathtaking coastal highway flanked by the Arabian sea, swaying palm trees and radiant sunset skies.',
    difficulty: 'Beginner',
    lengthKm: '3.8 km',
    roadWidth: 16,
    checkpointCount: 16,
    skyColor: 0xff7e47, // Sunset Orange
    fogColor: 0xe06644,
    fogDensity: 0.0012,
    sunColor: 0xffaa55,
    sunPos: [300, 80, -200],
    ambientColor: 0x553322,
    groundColor: 0xd4a373, // Beach sand
    curbColor1: '#ff2a2a',
    curbColor2: '#ffffff',
    previewGradient: 'linear-gradient(135deg, #ff7e47 0%, #d4a373 100%)',
    waypoints: [
      { x: 0, z: 0 },
      { x: 20, z: 120 },
      { x: 60, z: 240 },
      { x: 140, z: 320 },
      { x: 260, z: 340 },
      { x: 380, z: 280 },
      { x: 420, z: 180 },
      { x: 380, z: 40 },
      { x: 320, z: -80 },
      { x: 240, z: -180 },
      { x: 120, z: -260 },
      { x: -20, z: -280 },
      { x: -160, z: -220 },
      { x: -220, z: -100 },
      { x: -180, z: 20 },
      { x: -80, z: 60 }
    ],
    buildEnvironment: (curve, curvePoints, tangents, quality) => {
      const group = new THREE.Group();

      // Arabian Sea Water Plane (Left side)
      const waterGeo = new THREE.PlaneGeometry(800, 1000);
      waterGeo.rotateX(-Math.PI / 2);
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x0077b6,
        roughness: 0.15,
        metalness: 0.8
      });
      const waterMesh = new THREE.Mesh(waterGeo, waterMat);
      waterMesh.position.set(-350, -0.2, 0);
      group.add(waterMesh);

      // Palm Trees Instanced along track
      const trunkGeo = new THREE.CylinderGeometry(0.25, 0.4, 6, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.9 });
      const leavesGeo = new THREE.ConeGeometry(2.8, 2.2, 7);
      const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 });

      const count = quality === 'low' ? 60 : 140;
      for (let i = 0; i < count; i++) {
        const u = i / count;
        const pt = curve.getPointAt(u);
        const tangent = curve.getTangentAt(u).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);

        const side = (i % 2 === 0) ? 1 : -1;
        const dist = 12 + Math.random() * 25;
        const treePos = pt.clone().addScaledVector(normal, side * dist);

        // Don't place trees in deep water
        if (treePos.x < -200) continue;

        const treeGroup = new THREE.Group();
        treeGroup.position.set(treePos.x, 0, treePos.z);

        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 3;
        trunk.rotation.z = (Math.random() - 0.5) * 0.15;
        treeGroup.add(trunk);

        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.y = 5.8;
        treeGroup.add(leaves);

        group.add(treeGroup);
      }

      // Coastal Beach Houses
      const houseGeo = new THREE.BoxGeometry(10, 6, 12);
      const houseMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
      const roofGeo = new THREE.ConeGeometry(8, 3, 4);
      roofGeo.rotateY(Math.PI / 4);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xbc4749 });

      for (let i = 0; i < 18; i++) {
        const u = (i * 0.055 + 0.1) % 1;
        const pt = curve.getPointAt(u);
        const tan = curve.getTangentAt(u);
        const norm = new THREE.Vector3(-tan.z, 0, tan.x);
        const housePos = pt.clone().addScaledVector(norm, 24 + Math.random() * 10);

        const house = new THREE.Group();
        house.position.set(housePos.x, 3, housePos.z);

        const body = new THREE.Mesh(houseGeo, houseMat);
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 4.5;
        house.add(body);
        house.add(roof);

        group.add(house);
      }

      return group;
    }
  },

  // 2. SWITZERLAND MEADOWS
  {
    id: 'switzerland',
    name: 'Switzerland Meadows',
    country: 'Switzerland',
    description: 'Alpine majesty through lush green valleys, snow-capped peaks, wooden chalets, and crisp mountain curves.',
    difficulty: 'Intermediate',
    lengthKm: '4.2 km',
    roadWidth: 15,
    checkpointCount: 18,
    skyColor: 0x8ecae6, // Mountain Sky Blue
    fogColor: 0xcbe3fb,
    fogDensity: 0.0009,
    sunColor: 0xffffff,
    sunPos: [250, 300, 200],
    ambientColor: 0x445544,
    groundColor: 0x40916c, // Alpine green
    curbColor1: '#d90429',
    curbColor2: '#ffffff',
    previewGradient: 'linear-gradient(135deg, #40916c 0%, #8ecae6 100%)',
    waypoints: [
      { x: 0, z: 0 },
      { x: 60, z: 100 },
      { x: 180, z: 160 },
      { x: 300, z: 120 },
      { x: 360, z: 220 },
      { x: 280, z: 320 },
      { x: 150, z: 360 },
      { x: 40, z: 420 },
      { x: -100, z: 380 },
      { x: -220, z: 300 },
      { x: -280, z: 160 },
      { x: -200, z: 60 },
      { x: -120, z: -80 },
      { x: -180, z: -180 },
      { x: -100, z: -260 },
      { x: 20, z: -220 },
      { x: 80, z: -120 }
    ],
    buildEnvironment: (curve, curvePoints, tangents, quality) => {
      const group = new THREE.Group();

      // Alpine Mountains Backdrop
      const mtnGeo = new THREE.ConeGeometry(90, 160, 5);
      const mtnMat = new THREE.MeshStandardMaterial({ color: 0x5c677d, roughness: 0.9 });
      const snowCapGeo = new THREE.ConeGeometry(40, 50, 5);
      const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });

      const mountainPositions = [
        [-450, 80, -300], [-300, 80, 450], [450, 80, -350], [500, 80, 200], [0, 80, 600]
      ];

      mountainPositions.forEach(pos => {
        const mtn = new THREE.Mesh(mtnGeo, mtnMat);
        mtn.position.set(pos[0], pos[1], pos[2]);
        const cap = new THREE.Mesh(snowCapGeo, snowMat);
        cap.position.set(pos[0], pos[1] + 55, pos[2]);
        group.add(mtn);
        group.add(cap);
      });

      // Pine Trees
      const pineTrunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 4, 6);
      const pineTrunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
      const pineFoliageGeo = new THREE.ConeGeometry(2.5, 7, 7);
      const pineFoliageMat = new THREE.MeshStandardMaterial({ color: 0x1b4332 });

      const treeCount = quality === 'low' ? 70 : 160;
      for (let i = 0; i < treeCount; i++) {
        const u = i / treeCount;
        const pt = curve.getPointAt(u);
        const tan = curve.getTangentAt(u);
        const norm = new THREE.Vector3(-tan.z, 0, tan.x);

        const side = (i % 2 === 0) ? 1 : -1;
        const treePos = pt.clone().addScaledVector(norm, side * (14 + Math.random() * 35));

        const tree = new THREE.Group();
        tree.position.set(treePos.x, 0, treePos.z);
        const trunk = new THREE.Mesh(pineTrunkGeo, pineTrunkMat);
        trunk.position.y = 2;
        const foliage = new THREE.Mesh(pineFoliageGeo, pineFoliageMat);
        foliage.position.y = 5.5;
        tree.add(trunk);
        tree.add(foliage);
        group.add(tree);
      }

      // Wooden Chalets
      const chaletGeo = new THREE.BoxGeometry(10, 5, 8);
      const chaletMat = new THREE.MeshStandardMaterial({ color: 0x7f4f24 });
      const roofGeo = new THREE.ConeGeometry(8, 3.5, 4);
      roofGeo.rotateY(Math.PI / 4);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x43281c });

      for (let i = 0; i < 12; i++) {
        const u = (i * 0.08 + 0.05) % 1;
        const pt = curve.getPointAt(u);
        const tan = curve.getTangentAt(u);
        const norm = new THREE.Vector3(-tan.z, 0, tan.x);
        const chaletPos = pt.clone().addScaledVector(norm, 25 + Math.random() * 15);

        const chalet = new THREE.Group();
        chalet.position.set(chaletPos.x, 2.5, chaletPos.z);
        const body = new THREE.Mesh(chaletGeo, chaletMat);
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 4.2;
        chalet.add(body);
        chalet.add(roof);
        group.add(chalet);
      }

      return group;
    }
  },

  // 3. RUSSIA SNOW FIELDS
  {
    id: 'russia_snow',
    name: 'Russia Snow Fields',
    country: 'Russia',
    description: 'Sub-zero tundra endurance race with frozen lakes, snow-covered pine forests and slippery icy hairpins.',
    difficulty: 'Advanced',
    lengthKm: '4.5 km',
    roadWidth: 15,
    checkpointCount: 18,
    skyColor: 0xb0c4de, // Overcast winter
    fogColor: 0xd8e2dc,
    fogDensity: 0.0018,
    sunColor: 0xeeeeee,
    sunPos: [100, 150, -100],
    ambientColor: 0x667788,
    groundColor: 0xedf2f4, // Pure snow
    curbColor1: '#0077b6', // Ice blue
    curbColor2: '#ffffff',
    previewGradient: 'linear-gradient(135deg, #edf2f4 0%, #0077b6 100%)',
    waypoints: [
      { x: 0, z: 0 },
      { x: -50, z: 120 },
      { x: -160, z: 200 },
      { x: -280, z: 220 },
      { x: -360, z: 140 },
      { x: -340, z: -20 },
      { x: -260, z: -140 },
      { x: -140, z: -180 },
      { x: -40, z: -280 },
      { x: 80, z: -340 },
      { x: 220, z: -300 },
      { x: 320, z: -180 },
      { x: 300, z: 20 },
      { x: 220, z: 160 },
      { x: 120, z: 180 },
      { x: 40, z: 80 }
    ],
    buildEnvironment: (curve, curvePoints, tangents, quality) => {
      const group = new THREE.Group();

      // Frozen Ice Lake
      const iceGeo = new THREE.PlaneGeometry(350, 400);
      iceGeo.rotateX(-Math.PI / 2);
      const iceMat = new THREE.MeshStandardMaterial({
        color: 0x90e0ef,
        roughness: 0.1,
        metalness: 0.7
      });
      const iceMesh = new THREE.Mesh(iceGeo, iceMat);
      iceMesh.position.set(0, -0.1, -60);
      group.add(iceMesh);

      // Snow-covered frosted pines
      const pineGeo = new THREE.ConeGeometry(2.4, 8, 6);
      const pineMat = new THREE.MeshStandardMaterial({ color: 0x8da9c4 });
      const snowCap = new THREE.ConeGeometry(1.8, 3, 6);
      const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

      const count = quality === 'low' ? 70 : 150;
      for (let i = 0; i < count; i++) {
        const u = i / count;
        const pt = curve.getPointAt(u);
        const tan = curve.getTangentAt(u);
        const norm = new THREE.Vector3(-tan.z, 0, tan.x);

        const side = (i % 2 === 0) ? 1 : -1;
        const pos = pt.clone().addScaledVector(norm, side * (13 + Math.random() * 30));

        const tree = new THREE.Group();
        tree.position.set(pos.x, 0, pos.z);
        const body = new THREE.Mesh(pineGeo, pineMat);
        body.position.y = 4;
        const cap = new THREE.Mesh(snowCap, snowMat);
        cap.position.y = 7;
        tree.add(body);
        tree.add(cap);
        group.add(tree);
      }

      return group;
    }
  },

  // 4. MIAMI NIGHTS
  {
    id: 'miami',
    name: 'Miami Nights',
    country: 'USA',
    description: 'Vibrant neon city street circuit with glowing skyscrapers, ocean drive palm trees and neon night sky.',
    difficulty: 'Intermediate',
    lengthKm: '4.0 km',
    roadWidth: 17,
    checkpointCount: 16,
    skyColor: 0x080a14, // Dark Night
    fogColor: 0x120826,
    fogDensity: 0.0014,
    sunColor: 0xff007f, // Neon Pink
    sunPos: [0, 40, -300],
    ambientColor: 0x221133,
    groundColor: 0x0b0e14, // Dark pavement
    curbColor1: '#00f0ff', // Neon Cyan
    curbColor2: '#ff007f', // Neon Magenta
    previewGradient: 'linear-gradient(135deg, #080a14 0%, #ff007f 100%)',
    waypoints: [
      { x: 0, z: 0 },
      { x: 0, z: 200 },
      { x: 100, z: 280 },
      { x: 260, z: 280 },
      { x: 360, z: 180 },
      { x: 360, z: -40 },
      { x: 260, z: -140 },
      { x: 120, z: -140 },
      { x: 40, z: -240 },
      { x: -100, z: -300 },
      { x: -240, z: -260 },
      { x: -300, z: -120 },
      { x: -260, z: 40 },
      { x: -160, z: 120 },
      { x: -60, z: 40 }
    ],
    buildEnvironment: (curve, curvePoints, tangents, quality) => {
      const group = new THREE.Group();

      // Neon Skyscrapers
      const buildingColors = [0x00f0ff, 0xff007f, 0x7209b7, 0x4cc9f0];
      const count = quality === 'low' ? 30 : 65;

      for (let i = 0; i < count; i++) {
        const u = i / count;
        const pt = curve.getPointAt(u);
        const tan = curve.getTangentAt(u);
        const norm = new THREE.Vector3(-tan.z, 0, tan.x);

        const side = (i % 2 === 0) ? 1 : -1;
        const pos = pt.clone().addScaledVector(norm, side * (24 + Math.random() * 40));

        const height = 40 + Math.random() * 80;
        const width = 18 + Math.random() * 15;
        const depth = 18 + Math.random() * 15;

        const bGeo = new THREE.BoxGeometry(width, height, depth);
        const bMat = new THREE.MeshStandardMaterial({
          color: 0x0d131f,
          roughness: 0.4,
          metalness: 0.8
        });
        const building = new THREE.Mesh(bGeo, bMat);
        building.position.set(pos.x, height * 0.5, pos.z);

        // Neon edge accents
        const neonColor = buildingColors[i % buildingColors.length];
        const neonMat = new THREE.MeshBasicMaterial({ color: neonColor });
        const stripGeo = new THREE.BoxGeometry(width + 0.4, 1.2, depth + 0.4);
        const strip = new THREE.Mesh(stripGeo, neonMat);
        strip.position.y = height * 0.45;
        building.add(strip);

        group.add(building);
      }

      // Streetlights along road
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7, 6);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
      const lampGeo = new THREE.SphereGeometry(0.4, 8, 8);
      const lampMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

      for (let i = 0; i < curvePoints.length; i += 2) {
        const pt = curvePoints[i];
        const tan = tangents[i];
        const norm = new THREE.Vector3(-tan.z, 0, tan.x);

        [-1, 1].forEach(side => {
          const lPos = pt.clone().addScaledVector(norm, side * 10);
          const lamp = new THREE.Group();
          lamp.position.set(lPos.x, 0, lPos.z);
          const pole = new THREE.Mesh(poleGeo, poleMat);
          pole.position.y = 3.5;
          const bulb = new THREE.Mesh(lampGeo, lampMat);
          bulb.position.y = 7;
          lamp.add(pole);
          lamp.add(bulb);
          group.add(lamp);
        });
      }

      return group;
    }
  },

  // 5. SCOTLAND HIGHLANDS
  {
    id: 'scotland',
    name: 'Scotland Highlands',
    country: 'Scotland',
    description: 'Narrow winding roads, ancient stone castles, deep lochs, dramatic hills and dense highland mist.',
    difficulty: 'Expert',
    lengthKm: '4.8 km',
    roadWidth: 14,
    checkpointCount: 20,
    skyColor: 0x778da9, // Misty Highland
    fogColor: 0x899bb0,
    fogDensity: 0.0022,
    sunColor: 0xdddddd,
    sunPos: [-200, 100, 100],
    ambientColor: 0x415a77,
    groundColor: 0x386641, // Scottish moss
    curbColor1: '#ffb703',
    curbColor2: '#1b4332',
    previewGradient: 'linear-gradient(135deg, #386641 0%, #778da9 100%)',
    waypoints: [
      { x: 0, z: 0 },
      { x: 80, z: 80 },
      { x: 120, z: 200 },
      { x: 40, z: 300 },
      { x: -60, z: 340 },
      { x: -180, z: 280 },
      { x: -240, z: 180 },
      { x: -200, z: 40 },
      { x: -100, z: -60 },
      { x: -80, z: -180 },
      { x: -160, z: -260 },
      { x: -260, z: -300 },
      { x: -320, z: -200 },
      { x: -300, z: -60 },
      { x: -220, z: 60 },
      { x: -80, z: 120 }
    ],
    buildEnvironment: (curve, curvePoints, tangents, quality) => {
      const group = new THREE.Group();

      // Ancient Stone Castle Tower
      const towerGeo = new THREE.CylinderGeometry(12, 14, 35, 12);
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x4a4e69, roughness: 0.95 });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(-80, 17.5, 140);
      group.add(tower);

      // Loch Water Surface
      const lochGeo = new THREE.PlaneGeometry(350, 450);
      lochGeo.rotateX(-Math.PI / 2);
      const lochMat = new THREE.MeshStandardMaterial({ color: 0x1d2d44, roughness: 0.3 });
      const loch = new THREE.Mesh(lochGeo, lochMat);
      loch.position.set(120, -0.1, -100);
      group.add(loch);

      // Stone Wall Ruins
      const wallGeo = new THREE.BoxGeometry(1.2, 1.6, 6);
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x555b6e, roughness: 0.9 });
      for (let i = 0; i < 40; i++) {
        const u = (i / 40);
        const pt = curve.getPointAt(u);
        const tan = curve.getTangentAt(u);
        const norm = new THREE.Vector3(-tan.z, 0, tan.x);
        const wallPos = pt.clone().addScaledVector(norm, 10);
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(wallPos.x, 0.8, wallPos.z);
        wall.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
        group.add(wall);
      }

      return group;
    }
  },

  // 6. TOKYO DRIFT
  {
    id: 'tokyo',
    name: 'Tokyo Drift',
    country: 'Japan',
    description: 'Tight urban canyon circuit with glowing kanji billboards, elevated highways and demanding hairpins.',
    difficulty: 'Expert',
    lengthKm: '3.6 km',
    roadWidth: 15,
    checkpointCount: 16,
    skyColor: 0x050510,
    fogColor: 0x1a0a2a,
    fogDensity: 0.0016,
    sunColor: 0x00f0ff,
    sunPos: [100, 80, -200],
    ambientColor: 0x221144,
    groundColor: 0x11131a,
    curbColor1: '#ff0055',
    curbColor2: '#00f0ff',
    previewGradient: 'linear-gradient(135deg, #050510 0%, #ff0055 100%)',
    waypoints: [
      { x: 0, z: 0 },
      { x: 30, z: 100 },
      { x: 120, z: 120 },
      { x: 140, z: 220 },
      { x: 60, z: 280 },
      { x: -60, z: 260 },
      { x: -140, z: 180 },
      { x: -100, z: 80 },
      { x: -160, z: -40 },
      { x: -240, z: -100 },
      { x: -200, z: -220 },
      { x: -80, z: -260 },
      { x: 40, z: -220 },
      { x: 60, z: -120 }
    ],
    buildEnvironment: (curve, curvePoints, tangents, quality) => {
      const group = new THREE.Group();

      // Tokyo High-Rises with Neon signs
      const bldgCount = quality === 'low' ? 35 : 75;
      for (let i = 0; i < bldgCount; i++) {
        const u = i / bldgCount;
        const pt = curve.getPointAt(u);
        const tan = curve.getTangentAt(u);
        const norm = new THREE.Vector3(-tan.z, 0, tan.x);

        const side = (i % 2 === 0) ? 1 : -1;
        const pos = pt.clone().addScaledVector(norm, side * (20 + Math.random() * 30));

        const h = 35 + Math.random() * 60;
        const w = 16 + Math.random() * 12;
        const d = 16 + Math.random() * 12;

        const bGeo = new THREE.BoxGeometry(w, h, d);
        const bMat = new THREE.MeshStandardMaterial({ color: 0x0c0f18, metalness: 0.8, roughness: 0.3 });
        const building = new THREE.Mesh(bGeo, bMat);
        building.position.set(pos.x, h * 0.5, pos.z);

        // Glowing billboard
        const boardGeo = new THREE.PlaneGeometry(8, 5);
        const boardMat = new THREE.MeshBasicMaterial({
          color: (i % 2 === 0) ? 0xff0055 : 0x00f0ff,
          side: THREE.DoubleSide
        });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.set(0, (Math.random() - 0.2) * (h * 0.4), d * 0.52);
        building.add(board);

        group.add(building);
      }

      return group;
    }
  },

  // 7. EGYPT DUNES
  {
    id: 'egypt',
    name: 'Egypt Dunes',
    country: 'Egypt',
    description: 'Blistering desert circuit passing colossal pyramids, towering obelisks and undulating golden sand dunes.',
    difficulty: 'Intermediate',
    lengthKm: '4.4 km',
    roadWidth: 16,
    checkpointCount: 18,
    skyColor: 0xfdb813, // Desert Sun
    fogColor: 0xe9c46a,
    fogDensity: 0.0011,
    sunColor: 0xfff3b0,
    sunPos: [200, 250, 100],
    ambientColor: 0x7d4f10,
    groundColor: 0xe9c46a, // Golden sand
    curbColor1: '#9b2226',
    curbColor2: '#ee9b00',
    previewGradient: 'linear-gradient(135deg, #e9c46a 0%, #9b2226 100%)',
    waypoints: [
      { x: 0, z: 0 },
      { x: 100, z: 80 },
      { x: 220, z: 100 },
      { x: 320, z: 20 },
      { x: 340, z: -100 },
      { x: 260, z: -220 },
      { x: 140, z: -300 },
      { x: 0, z: -320 },
      { x: -140, z: -280 },
      { x: -240, z: -180 },
      { x: -300, z: -40 },
      { x: -260, z: 100 },
      { x: -160, z: 220 },
      { x: -40, z: 260 },
      { x: 20, z: 140 }
    ],
    buildEnvironment: (curve, curvePoints, tangents, quality) => {
      const group = new THREE.Group();

      // Great Pyramids
      const pyrMat = new THREE.MeshStandardMaterial({ color: 0xca6702, roughness: 0.95 });
      const pyramids = [
        { x: -380, z: -120, size: 140, height: 110 },
        { x: -480, z: 80, size: 100, height: 80 },
        { x: 420, z: 220, size: 90, height: 75 }
      ];

      pyramids.forEach(p => {
        const pGeo = new THREE.ConeGeometry(p.size, p.height, 4);
        pGeo.rotateY(Math.PI / 4);
        const pyr = new THREE.Mesh(pGeo, pyrMat);
        pyr.position.set(p.x, p.height * 0.5, p.z);
        pyr.castShadow = true;
        group.add(pyr);
      });

      // Ancient Sandstone Obelisks along straights
      const obeliskGeo = new THREE.CylinderGeometry(1.0, 1.8, 18, 4);
      const obeliskMat = new THREE.MeshStandardMaterial({ color: 0xbb3e03, roughness: 0.9 });
      for (let i = 0; i < 20; i++) {
        const u = i / 20;
        const pt = curve.getPointAt(u);
        const tan = curve.getTangentAt(u);
        const norm = new THREE.Vector3(-tan.z, 0, tan.x);

        const pos = pt.clone().addScaledVector(norm, 16);
        const obelisk = new THREE.Mesh(obeliskGeo, obeliskMat);
        obelisk.position.set(pos.x, 9, pos.z);
        group.add(obelisk);
      }

      return group;
    }
  }
];

export function getTrackById(id) {
  return TRACK_LOCATIONS.find(t => t.id === id) || TRACK_LOCATIONS[0];
}
