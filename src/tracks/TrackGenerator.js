/**
 * TrackGenerator.js - Generates 3D smooth procedural spline tracks,
 * road surfaces, road markings, curbs, barriers, checkpoints, and instanced scenery
 */

import * as THREE from 'three';

export class TrackGenerator {
  /**
   * Builds the complete 3D track mesh and environmental meshes
   * @param {THREE.Scene} scene
   * @param {Object} trackDef Track definition object
   * @param {string} quality 'low', 'medium', 'high'
   */
  static buildTrack(scene, trackDef, quality = 'high') {
    const trackGroup = new THREE.Group();
    trackGroup.name = 'CurrentTrackGroup';

    // 1. Create CatmullRomCurve3 from waypoints
    const points = trackDef.waypoints.map(p => new THREE.Vector3(p.x, p.y || 0, p.z));
    const curve = new THREE.CatmullRomCurve3(points, true); // Closed circuit
    curve.curveType = 'catmullrom';
    curve.tension = 0.5;

    // Road parameters
    const roadWidth = trackDef.roadWidth || 16;
    const roadSegments = quality === 'low' ? 300 : (quality === 'medium' ? 500 : 750);
    const curbWidth = 1.4;

    // Generate road geometry
    const roadGeo = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const normals = [];

    // Curbs & barrier geometries
    const leftCurbPositions = [];
    const rightCurbPositions = [];
    const curbUvs = [];

    const curvePoints = curve.getSpacedPoints(roadSegments);
    const tangents = [];

    for (let i = 0; i < curvePoints.length; i++) {
      const u = i / curvePoints.length;
      const tangent = curve.getTangentAt(u).normalize();
      tangents.push(tangent);
    }

    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i <= roadSegments; i++) {
      const idx = i % curvePoints.length;
      const center = curvePoints[idx];
      const tangent = tangents[idx];
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      // Road left and right edge
      const halfWidth = roadWidth * 0.5;
      const leftPt = center.clone().addScaledVector(normal, -halfWidth);
      const rightPt = center.clone().addScaledVector(normal, halfWidth);

      // Elevated slightly above terrain to prevent z-fighting
      leftPt.y += 0.05;
      rightPt.y += 0.05;

      const v = (i / roadSegments) * (curve.getLength() / 15); // UV tiling along length

      positions.push(leftPt.x, leftPt.y, leftPt.z);
      positions.push(rightPt.x, rightPt.y, rightPt.z);

      normals.push(0, 1, 0);
      normals.push(0, 1, 0);

      uvs.push(0, v);
      uvs.push(1, v);

      // Rumble strips / curbs
      const leftOuter = center.clone().addScaledVector(normal, -(halfWidth + curbWidth));
      leftOuter.y += 0.12;
      leftCurbPositions.push(leftOuter.x, leftOuter.y, leftOuter.z);
      leftCurbPositions.push(leftPt.x, leftPt.y + 0.08, leftPt.z);

      const rightOuter = center.clone().addScaledVector(normal, halfWidth + curbWidth);
      rightOuter.y += 0.12;
      rightCurbPositions.push(rightPt.x, rightPt.y + 0.08, rightPt.z);
      rightCurbPositions.push(rightOuter.x, rightOuter.y, rightOuter.z);

      curbUvs.push(0, v * 2);
      curbUvs.push(1, v * 2);
    }

    // Build indices for road triangles
    const indices = [];
    for (let i = 0; i < roadSegments; i++) {
      const row1 = i * 2;
      const row2 = (i + 1) * 2;
      indices.push(row1, row1 + 1, row2);
      indices.push(row1 + 1, row2 + 1, row2);
    }

    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);

    // Procedural Road Texture (Dark Asphalt with White Dashed Center Line and Edge Lines)
    const roadTexture = this.createRoadTexture();
    const roadMat = new THREE.MeshStandardMaterial({
      map: roadTexture,
      roughness: 0.85,
      metalness: 0.1
    });

    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Curbs / Rumble Strips Geometry
    const curbGeo = new THREE.BufferGeometry();
    const curbAllPositions = [...leftCurbPositions, ...rightCurbPositions];
    const curbAllUvs = [...curbUvs, ...curbUvs];
    const curbIndices = [];

    const numRows = leftCurbPositions.length / 6; // each row has 2 points * 3 coords = 6
    for (let i = 0; i < numRows - 1; i++) {
      const r1 = i * 2;
      const r2 = (i + 1) * 2;
      curbIndices.push(r1, r1 + 1, r2);
      curbIndices.push(r1 + 1, r2 + 1, r2);
    }
    const offset = numRows * 2;
    for (let i = 0; i < numRows - 1; i++) {
      const r1 = offset + i * 2;
      const r2 = offset + (i + 1) * 2;
      curbIndices.push(r1, r1 + 1, r2);
      curbIndices.push(r1 + 1, r2 + 1, r2);
    }

    curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbAllPositions, 3));
    curbGeo.setAttribute('uv', new THREE.Float32BufferAttribute(curbAllUvs, 2));
    curbGeo.computeVertexNormals();
    curbGeo.setIndex(curbIndices);

    const curbTexture = this.createCurbTexture(trackDef.curbColor1, trackDef.curbColor2);
    const curbMat = new THREE.MeshStandardMaterial({
      map: curbTexture,
      roughness: 0.7
    });
    const curbMesh = new THREE.Mesh(curbGeo, curbMat);
    curbMesh.receiveShadow = true;
    trackGroup.add(curbMesh);

    // 2. Terrain Ground Plane
    const groundSize = 1400;
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, 24, 24);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: trackDef.groundColor || 0x224422,
      roughness: 0.95,
      metalness: 0.05
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = -0.05;
    groundMesh.receiveShadow = true;
    trackGroup.add(groundMesh);

    // 3. Start / Finish Line Banner & Arch
    const startPoint = curvePoints[0];
    const startTangent = tangents[0];
    const startNormal = new THREE.Vector3().crossVectors(startTangent, up).normalize();

    const startArch = this.createStartArch(roadWidth, trackDef.name);
    startArch.position.copy(startPoint);
    startArch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), startTangent);
    trackGroup.add(startArch);

    // 4. Checkpoints along curve (typically 12-20 checkpoints)
    const checkpoints = [];
    const checkpointCount = trackDef.checkpointCount || 16;
    for (let i = 0; i < checkpointCount; i++) {
      const u = i / checkpointCount;
      const pt = curve.getPointAt(u);
      const tan = curve.getTangentAt(u).normalize();
      const norm = new THREE.Vector3().crossVectors(tan, up).normalize();

      checkpoints.push({
        index: i,
        u,
        position: pt,
        tangent: tan,
        normal: norm,
        width: roadWidth + 4,
        isFinishLine: i === 0
      });
    }

    // 5. Build Environment Props (Trees, Buildings, Mountains, Lights)
    if (trackDef.buildEnvironment) {
      const envGroup = trackDef.buildEnvironment(curve, curvePoints, tangents, quality);
      trackGroup.add(envGroup);
    }

    scene.add(trackGroup);

    return {
      group: trackGroup,
      curve,
      curvePoints,
      tangents,
      checkpoints,
      roadWidth,
      totalLength: curve.getLength()
    };
  }

  /**
   * Procedural road texture generator
   */
  static createRoadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark asphalt base
    ctx.fillStyle = '#1c1f26';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle noise grain
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const gray = Math.floor(25 + Math.random() * 25);
      ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Outer solid white road edge lines
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(16, 0, 10, 512);
    ctx.fillRect(512 - 26, 0, 10, 512);

    // Center dashed white line
    ctx.fillStyle = '#ffffff';
    const dashLength = 36;
    const gapLength = 28;
    let y = 0;
    while (y < 512) {
      ctx.fillRect(252, y, 8, dashLength);
      y += dashLength + gapLength;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
  }

  /**
   * Procedural alternating red/white curb texture
   */
  static createCurbTexture(color1 = '#ff2244', color2 = '#ffffff') {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, 64, 64);

    ctx.fillStyle = color2;
    ctx.fillRect(0, 64, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
  }

  /**
   * Start / Finish Line Arch Gantry
   */
  static createStartArch(roadWidth, trackName) {
    const archGroup = new THREE.Group();
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 });
    const signMat = new THREE.MeshStandardMaterial({
      color: 0x05070e,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.4
    });

    // Vertical pillars
    const pillarGeo = new THREE.BoxGeometry(0.8, 6.5, 0.8);
    const leftPillar = new THREE.Mesh(pillarGeo, trussMat);
    leftPillar.position.set(-roadWidth * 0.5 - 1.2, 3.25, 0);
    const rightPillar = leftPillar.clone();
    rightPillar.position.x = roadWidth * 0.5 + 1.2;
    archGroup.add(leftPillar);
    archGroup.add(rightPillar);

    // Overhead crossbar
    const crossGeo = new THREE.BoxGeometry(roadWidth + 3.2, 1.4, 1.0);
    const crossbar = new THREE.Mesh(crossGeo, signMat);
    crossbar.position.set(0, 6.0, 0);
    archGroup.add(crossbar);

    // Finish line checker pattern on the ground
    const checkerCanvas = document.createElement('canvas');
    checkerCanvas.width = 256;
    checkerCanvas.height = 64;
    const cctx = checkerCanvas.getContext('2d');
    const cols = 16;
    const rows = 4;
    const w = 256 / cols;
    const h = 64 / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#111111';
        cctx.fillRect(c * w, r * h, w, h);
      }
    }
    const checkerTex = new THREE.CanvasTexture(checkerCanvas);
    const lineGeo = new THREE.PlaneGeometry(roadWidth, 4.0);
    lineGeo.rotateX(-Math.PI / 2);
    const lineMat = new THREE.MeshBasicMaterial({ map: checkerTex, transparent: true, opacity: 0.95 });
    const lineMesh = new THREE.Mesh(lineGeo, lineMat);
    lineMesh.position.y = 0.08;
    archGroup.add(lineMesh);

    return archGroup;
  }
}
