import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG, CELESTIAL_THEME } from '../../config/olympusConfig';

/**
 * JÖRMUNGANDR — THE ANCIENT WORLD SERPENT
 * 
 * Physically grounded biological reconstruction:
 * - Coils around Mount Olympus with true spatial separation and mountain occlusion.
 * - Non-uniform muscular cross-section (Bishop rotation-minimizing frame with keeled dorsal ridge and flat belly).
 * - Three scale hierarchy levels:
 *   1. MACRO: Large overlapping carinated scutes along dorsal spine and cranial crest.
 *   2. MESO: Physical diamond-tessellation displacement across lateral flanks.
 *   3. MICRO: High-frequency mineral bump and roughness variation.
 * - Organic prehistoric serpent head: broad flattened skull, heavy supraorbital brow overhang,
 *   deeply recessed eye sockets, elongated tapering snout, and inward-curved fangs.
 * - Restrained palette: dark slate / muted deep mineral green (NOT pure black).
 * - ZERO fantasy ears, ZERO helmet horns, ZERO cartoon fins, ZERO traffic-cone spikes.
 */

// Procedural multi-tier scale texture with keeled dorsal scales and segmented ventral scutes
function createSerpentSkinTexture(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base deep mineral slate-green tone
  ctx.fillStyle = '#162422';
  ctx.fillRect(0, 0, size, size);

  // 1. Dorsal Diamond Keeled Scales (u < 0.35 or u > 0.65)
  const rows = 48;
  const cols = 48;
  const cellW = size / cols;
  const cellH = size / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u = c / cols;
      const isBelly = u >= 0.33 && u <= 0.67;

      if (!isBelly) {
        const cx = (c + (r % 2) * 0.5) * cellW;
        const cy = r * cellH;

        // Mineral color variation: dark slate with subtle olivine and weathered slate flecks
        const noiseVal = Math.sin(r * 4.3 + c * 2.7);
        let baseR = 22 + Math.floor(Math.random() * 16);
        let baseG = 38 + Math.floor(Math.random() * 20);
        let baseB = 34 + Math.floor(Math.random() * 16);

        if (noiseVal > 0.55) {
          // Ancient mineral weathering / lichen tint
          baseR += 14;
          baseG += 18;
          baseB += 8;
        }

        ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
        ctx.beginPath();
        ctx.moveTo(cx, cy - cellH * 0.48);
        ctx.lineTo(cx + cellW * 0.48, cy);
        ctx.lineTo(cx, cy + cellH * 0.48);
        ctx.lineTo(cx - cellW * 0.48, cy);
        ctx.closePath();
        ctx.fill();

        // Keeled ridge down the center of each scale
        ctx.strokeStyle = `rgba(130, 165, 150, ${0.12 + Math.random() * 0.12})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cx, cy - cellH * 0.45);
        ctx.lineTo(cx, cy + cellH * 0.45);
        ctx.stroke();

        // Soft scale rim
        ctx.strokeStyle = `rgba(15, 24, 22, 0.7)`;
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }
    }
  }

  // 2. Ventral (Belly) Segmented Scutes (center strip: u = 0.33 to 0.67)
  const bellyStartX = size * 0.33;
  const bellyWidth = size * 0.34;
  const plateCount = 56;
  const plateH = size / plateCount;

  for (let p = 0; p < plateCount; p++) {
    const py = p * plateH;

    // Pale weathered bone / slate-lichen gradient
    const grad = ctx.createLinearGradient(bellyStartX, py, bellyStartX + bellyWidth, py + plateH);
    grad.addColorStop(0, '#3A4B45');
    grad.addColorStop(0.2, '#556A61');
    grad.addColorStop(0.5, '#687F75');
    grad.addColorStop(0.8, '#52675E');
    grad.addColorStop(1, '#364640');

    ctx.fillStyle = grad;
    ctx.fillRect(bellyStartX, py, bellyWidth, plateH - 1.8);

    // Dark transverse groove between scutes
    ctx.fillStyle = '#0D1715';
    ctx.fillRect(bellyStartX, py + plateH - 2.2, bellyWidth, 2.2);

    // Fine growth rings & horizontal wear lines
    ctx.strokeStyle = 'rgba(25, 38, 33, 0.4)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(bellyStartX + 8, py + plateH * 0.5);
    ctx.lineTo(bellyStartX + bellyWidth - 8, py + plateH * 0.5);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 16);
  texture.needsUpdate = true;
  return texture;
}

// Procedural micro-relief bump map
function createSerpentBumpTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Ventral scute grooves
  const bellyStartX = size * 0.33;
  const bellyWidth = size * 0.34;
  const plateCount = 56;
  const plateH = size / plateCount;

  for (let p = 0; p < plateCount; p++) {
    const py = p * plateH;
    ctx.fillStyle = '#A0A0A0';
    ctx.fillRect(bellyStartX, py + 1, bellyWidth, plateH - 3);

    ctx.fillStyle = '#202020';
    ctx.fillRect(bellyStartX, py + plateH - 2, bellyWidth, 2);
  }

  // Dorsal diamond scale relief
  const rows = 36;
  const cols = 36;
  const cellW = size / cols;
  const cellH = size / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u = c / cols;
      if (u < 0.33 || u > 0.67) {
        const cx = (c + (r % 2) * 0.5) * cellW;
        const cy = r * cellH;

        ctx.fillStyle = '#B0B0B0';
        ctx.beginPath();
        ctx.moveTo(cx, cy - cellH * 0.45);
        ctx.lineTo(cx + cellW * 0.45, cy);
        ctx.lineTo(cx, cy + cellH * 0.45);
        ctx.lineTo(cx - cellW * 0.45, cy);
        ctx.closePath();
        ctx.fill();

        // Dark groove border
        ctx.strokeStyle = '#303030';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 16);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates custom sculpted serpent head geometry (Cranium, Brow, Snout, and Nostrils)
 * without primitive boxes or spheres. Formed via an anatomical cross-sectional lathe grid.
 */
function createSerpentCraniumGeometry() {
  const lengthSteps = 26;
  const radialSteps = 24;

  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= lengthSteps; i++) {
    const t = i / lengthSteps; // 0.0 (occiput / neck joint) to 1.0 (snout tip)
    const z = t * 14.0 - 4.0; // skull length along local Z: -4.0 to +10.0

    // Anatomical profile widths and heights along the skull:
    // Behind eyes: broad cranium; Over eyes: heavy brow flare; Snout: tapered wedge
    let width = 0;
    let height = 0;
    let yOffset = 0;

    if (t < 0.3) {
      // Occipital crest to posterior skull
      const p = t / 0.3;
      width = 4.2 + p * 1.8;
      height = 3.2 + p * 0.6;
      yOffset = 0.2 * (1.0 - p);
    } else if (t < 0.55) {
      // Supraorbital brow region (widest and deepest cranium)
      const p = (t - 0.3) / 0.25;
      width = 6.0 - p * 0.8;
      height = 3.8 - p * 0.4;
      yOffset = Math.sin(p * Math.PI) * 0.3;
    } else if (t < 0.85) {
      // Elongated snout tapering forward
      const p = (t - 0.55) / 0.3;
      width = 5.2 - p * 2.0;
      height = 3.4 - p * 1.2;
      yOffset = -p * 0.5;
    } else {
      // Rostral tip (snout apex)
      const p = (t - 0.85) / 0.15;
      width = 3.2 * (1.0 - p * 0.85);
      height = 2.2 * (1.0 - p * 0.85);
      yOffset = -0.5 - p * 0.2;
    }

    for (let j = 0; j <= radialSteps; j++) {
      const phi = (j / radialSteps) * Math.PI * 2;
      // Elliptical cross section with flattened ventrum and supraorbital brow ridges
      let rx = Math.cos(phi) * width * 0.5;
      let ry = Math.sin(phi) * height * 0.5 + yOffset;

      // Heavy supraorbital brow overhang over eye sockets (at t ~ 0.45, phi ~ 0.8 and 2.3)
      if (t >= 0.35 && t <= 0.6) {
        const isUpperLateral = ry > 0 && Math.abs(rx) > width * 0.25;
        if (isUpperLateral) {
          // Flare the brow bone outward to cast deep natural orbital shadows
          rx *= 1.18;
          ry += 0.4;
        }
      }

      // Flat ventral jaw plane
      if (ry < -height * 0.35) {
        ry = -height * 0.35;
      }

      // Meso surface scale displacement on the skull
      const scaleDisplacement = Math.sin(t * 18.0) * Math.cos(phi * 8.0) * 0.08;
      rx += scaleDisplacement * Math.cos(phi);
      ry += scaleDisplacement * Math.sin(phi);

      positions.push(rx, ry, z);
      uvs.push(j / radialSteps, t);
    }
  }

  // Generate triangle strip indices
  for (let i = 0; i < lengthSteps; i++) {
    for (let j = 0; j < radialSteps; j++) {
      const a = i * (radialSteps + 1) + j;
      const b = a + radialSteps + 1;
      const c = a + 1;
      const d = b + 1;

      indices.push(a, b, c);
      indices.push(c, b, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates sculpted lower mandible with realistic gular throat expansion
 */
function createSerpentMandibleGeometry() {
  const lengthSteps = 18;
  const radialSteps = 16;

  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= lengthSteps; i++) {
    const t = i / lengthSteps;
    const z = t * 11.5 - 3.5;

    let width = 0;
    let depth = 0;

    if (t < 0.4) {
      const p = t / 0.4;
      width = 4.6 + p * 0.6;
      depth = 1.8 + p * 0.5; // gular throat pouch
    } else {
      const p = (t - 0.4) / 0.6;
      width = 5.2 * (1.0 - p * 0.65);
      depth = 2.3 * (1.0 - p * 0.7);
    }

    for (let j = 0; j <= radialSteps; j++) {
      const phi = (j / radialSteps) * Math.PI; // lower half ellipse
      const rx = Math.cos(phi) * width * 0.5;
      const ry = -Math.sin(phi) * depth - 0.4;

      positions.push(rx, ry, z);
      uvs.push(j / radialSteps, t);
    }
  }

  for (let i = 0; i < lengthSteps; i++) {
    for (let j = 0; j < radialSteps; j++) {
      const a = i * (radialSteps + 1) + j;
      const b = a + radialSteps + 1;
      const c = a + 1;
      const d = b + 1;

      indices.push(a, b, c);
      indices.push(c, b, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export default function Jormungandr() {
  const bodyGroupRef = useRef(null);
  const headGroupRef = useRef(null);
  const jawRef = useRef(null);

  // Generate procedural textures
  const skinTexture = useMemo(() => createSerpentSkinTexture(1024), []);
  const bumpTexture = useMemo(() => createSerpentBumpTexture(512), []);

  // Serpent material: restrained dark slate-mineral green with realistic specular response
  const bodyMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: skinTexture,
      bumpMap: bumpTexture,
      bumpScale: 1.6,
      color: '#1E2C2A',
      roughness: 0.65,
      metalness: 0.22,
      flatShading: false
    });
  }, [skinTexture, bumpTexture]);

  // Head geometries
  const craniumGeo = useMemo(() => createSerpentCraniumGeometry(), []);
  const mandibleGeo = useMemo(() => createSerpentMandibleGeometry(), []);

  // Prehistoric ivory fang geometry
  const fangGeo = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.24, 1.4, 8);
    // Curve fangs inward
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const curveFactor = Math.pow(Math.max(0, 0.7 - y) / 1.4, 2.0);
      pos.setZ(i, pos.getZ(i) - curveFactor * 0.45);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const fangMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#D4CBB8',
      roughness: 0.45,
      metalness: 0.1
    });
  }, []);

  // Build the colossal biological spline & variable cross-section geometry
  const { bodyGeo, macroPlates, headTransform } = useMemo(() => {
    // 16-waypoint biological spline wrapping around Mount Olympus
    // Clear clearance from mountain rock, natural occlusion behind north face, separate from summit sanctuary
    const waypoints = [
      new THREE.Vector3(-78, 2, -30),    // 0: Tail emerging from Aegean ocean southwest
      new THREE.Vector3(-74, 9, -58),    // 1: Sweeping up coastal spurs
      new THREE.Vector3(-60, 18, -94),   // 2: Diving behind west-north mountain wall (OCCLUDED)
      new THREE.Vector3(-18, 26, -114),  // 3: Passing behind northern massif cliffs (OCCLUDED)
      new THREE.Vector3(38, 34, -108),   // 4: Behind northeast couloir (OCCLUDED)
      new THREE.Vector3(64, 42, -78),    // 5: Emerging from east crags into view
      new THREE.Vector3(56, 50, -38),    // 6: Crossing front southeast face
      new THREE.Vector3(14, 58, -32),    // 7: Sweeping across central south face
      new THREE.Vector3(-34, 66, -42),   // 8: Crossing southwest face
      new THREE.Vector3(-48, 74, -72),   // 9: Passing behind west shoulder (OCCLUDED)
      new THREE.Vector3(-32, 82, -100),  // 10: Behind northwest crags (OCCLUDED)
      new THREE.Vector3(10, 89, -104),   // 11: Behind northern summit ridge (OCCLUDED)
      new THREE.Vector3(38, 95, -86),    // 12: Rising on northeast flank
      new THREE.Vector3(42, 101, -62),   // 13: Towering muscular neck arching above clouds
      new THREE.Vector3(32, 103, -48),   // 14: Neck curving gracefully inward
      new THREE.Vector3(22, 100, -56)    // 15: Skull overlooking summit sanctuary
    ];

    const curve = new THREE.CatmullRomCurve3(waypoints, false, 'centripetal', 0.5);

    // Build Bishop Rotation-Minimizing Frame along curve
    const tubularSegments = 260;
    const radialSegments = 24;

    const frames = curve.computeFrenetFrames(tubularSegments, false);

    const positions = [];
    const uvs = [];
    const indices = [];

    // Macro scale plates along dorsal ridge
    const dorsalScutes = [];

    for (let i = 0; i <= tubularSegments; i++) {
      const t = i / tubularSegments;
      const pt = curve.getPointAt(t);
      const N = frames.normals[i];
      const B = frames.binormals[i];
      const T = frames.tangents[i];

      // Biological variable radius & taper profile:
      // Tapered tail -> Colossal mid-body mass -> Powerful neck -> Skull transition
      let radius = 1.0;
      if (t < 0.15) {
        radius = 1.6 + (t / 0.15) * 4.2;
      } else if (t < 0.72) {
        radius = 5.8 + Math.sin((t - 0.15) / 0.57 * Math.PI) * 1.4;
      } else {
        radius = 7.0 - ((t - 0.72) / 0.28) * 3.4;
      }

      for (let j = 0; j <= radialSegments; j++) {
        const phi = (j / radialSegments) * Math.PI * 2;
        // Elliptical cross section: wider flanks, flattened ventral crawl belly, keeled dorsal crest
        const cosP = Math.cos(phi);
        const sinP = Math.sin(phi);

        let rx = cosP * (radius * 1.25); // muscular lateral breadth
        let ry = sinP * radius;

        // Flatten ventral belly (phi near -PI/2)
        if (sinP < -0.45) {
          ry = -radius * (0.45 + (sinP + 0.45) * 0.35);
        }

        // Keeled dorsal ridge (phi near +PI/2)
        if (sinP > 0.6) {
          const keel = Math.pow((sinP - 0.6) / 0.4, 2.0) * (radius * 0.32);
          ry += keel;
        }

        // Physical Meso-scale diamond displacement across flanks
        const mesoDisplacement = Math.sin(t * 120.0) * Math.sin(phi * 8.0) * 0.18;
        rx += mesoDisplacement * cosP;
        ry += mesoDisplacement * sinP;

        // Position in 3D world space
        const vx = pt.x + N.x * rx + B.x * ry;
        const vy = pt.y + N.y * rx + B.y * ry;
        const vz = pt.z + N.z * rx + B.z * ry;

        positions.push(vx, vy, vz);
        uvs.push(j / radialSegments, t * 16.0);
      }

      // Generate macro anatomical scale plates along upper neck & back (t: 0.55 to 0.94)
      if (i % 4 === 0 && t > 0.52 && t < 0.94) {
        const scutePos = pt.clone().add(B.clone().multiplyScalar(radius * 1.15));
        dorsalScutes.push({
          pos: [scutePos.x, scutePos.y, scutePos.z],
          tangent: [T.x, T.y, T.z],
          binormal: [B.x, B.y, B.z],
          scale: (0.8 + Math.sin(t * Math.PI) * 0.45) * (radius / 6.0)
        });
      }
    }

    for (let i = 0; i < tubularSegments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * (radialSegments + 1) + j;
        const b = a + radialSegments + 1;
        const c = a + 1;
        const d = b + 1;

        indices.push(a, b, c);
        indices.push(c, b, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    // Head orientation at terminus
    const lastPt = waypoints[waypoints.length - 1];

    // Look towards summit sanctuary platform [0, 94, -68]
    const lookTarget = new THREE.Vector3(0, 94, -68);
    const toSanctuary = new THREE.Vector3().subVectors(lookTarget, lastPt).normalize();

    return {
      bodyGeo: geo,
      macroPlates: dorsalScutes,
      headTransform: {
        pos: [lastPt.x, lastPt.y, lastPt.z],
        rotY: Math.atan2(toSanctuary.x, toSanctuary.z),
        rotX: -toSanctuary.y * 0.4
      }
    };
  }, []);

  // Macro scale plate geometry (Carinated, overlapping curved anatomical scute)
  const scuteGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 1.8);
    shape.lineTo(1.1, 0.4);
    shape.lineTo(0.9, -1.2);
    shape.lineTo(0, -1.8);
    shape.lineTo(-0.9, -1.2);
    shape.lineTo(-1.1, 0.4);
    shape.closePath();

    const extrudeSettings = {
      depth: 0.35,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.18,
      bevelThickness: 0.18
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.computeVertexNormals();
    return geo;
  }, []);

  const scuteMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#263834',
      roughness: 0.58,
      metalness: 0.25
    });
  }, []);

  // Massive slow biological respiration and living sway
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    // Colossal body breathing expansion
    if (bodyGroupRef.current) {
      bodyGroupRef.current.position.y = Math.sin(t * 0.35) * 0.35;
    }

    // Majestic living sway of the raised serpent head overlooking Olympus
    if (headGroupRef.current) {
      const basePos = headTransform.pos;
      headGroupRef.current.position.y = basePos[1] + Math.sin(t * 0.45) * 0.5;
      headGroupRef.current.rotation.y = headTransform.rotY + Math.sin(t * 0.28) * 0.05;
      headGroupRef.current.rotation.x = headTransform.rotX + Math.sin(t * 0.38) * 0.03;
    }

    // Slow gular respiration in lower jaw
    if (jawRef.current) {
      jawRef.current.rotation.x = 0.04 + Math.sin(t * 0.5) * 0.03;
    }
  });

  return (
    <group>
      {/* 1. Muscular Biological Serpent Body with 3-tier scales */}
      <group ref={bodyGroupRef}>
        <mesh
          geometry={bodyGeo}
          material={bodyMat}
          castShadow
          receiveShadow
        />

        {/* Macro Overlapping Anatomical Scale Plates along Dorsal Spine */}
        {macroPlates.map((s, idx) => (
          <group
            key={`macro-scute-${idx}`}
            position={s.pos}
            scale={[s.scale, s.scale, s.scale * 1.2]}
          >
            <mesh
              geometry={scuteGeo}
              material={scuteMat}
              rotation={[0.3, 0, 0]}
              castShadow
            />
          </group>
        ))}
      </group>

      {/* 2. Sculpted Prehistoric Serpent Skull (Towering in space clear of the sanctuary) */}
      <group
        ref={headGroupRef}
        position={headTransform.pos}
        rotation={[headTransform.rotX, headTransform.rotY, 0]}
        scale={[1.15, 1.15, 1.15]}
      >
        {/* Upper Cranium & Elongated Snout */}
        <mesh
          geometry={craniumGeo}
          material={bodyMat}
          castShadow
          receiveShadow
        />

        {/* Articulated Lower Mandible & Gular Throat Pouch */}
        <group ref={jawRef} position={[0, -0.6, -1.0]}>
          <mesh
            geometry={mandibleGeo}
            material={bodyMat}
            castShadow
            receiveShadow
          />
        </group>

        {/* Deeply Recessed Orbital Cavities & Dark Reptilian Eyes (Recessed under heavy brow) */}
        {/* Left Eye */}
        <group position={[-2.4, 0.4, 1.8]} rotation={[0.1, -0.3, 0]}>
          {/* Orbital Bone Cavity Shadow */}
          <mesh>
            <sphereGeometry args={[0.9, 12, 10]} />
            <meshStandardMaterial color="#0A1412" roughness={0.95} />
          </mesh>
          {/* Piercing Amber Eye with Reptilian Slit Pupil */}
          <mesh position={[0, 0, 0.45]}>
            <sphereGeometry args={[0.55, 16, 12]} />
            <meshStandardMaterial
              color="#D97706"
              roughness={0.25}
              metalness={0.3}
              emissive="#78350F"
              emissiveIntensity={0.6}
            />
          </mesh>
        </group>

        {/* Right Eye */}
        <group position={[2.4, 0.4, 1.8]} rotation={[0.1, 0.3, 0]}>
          <mesh>
            <sphereGeometry args={[0.9, 12, 10]} />
            <meshStandardMaterial color="#0A1412" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0, 0.45]}>
            <sphereGeometry args={[0.55, 16, 12]} />
            <meshStandardMaterial
              color="#D97706"
              roughness={0.25}
              metalness={0.3}
              emissive="#78350F"
              emissiveIntensity={0.6}
            />
          </mesh>
        </group>

        {/* Curved Prehistoric Ivory Fangs */}
        {/* Upper Left Maxillary Fang */}
        <mesh
          geometry={fangGeo}
          material={fangMat}
          position={[-1.6, -1.1, 5.2]}
          rotation={[Math.PI - 0.2, 0, -0.15]}
          castShadow
        />
        {/* Upper Right Maxillary Fang */}
        <mesh
          geometry={fangGeo}
          material={fangMat}
          position={[1.6, -1.1, 5.2]}
          rotation={[Math.PI - 0.2, 0, 0.15]}
          castShadow
        />
        {/* Secondary Upper Fangs */}
        <mesh
          geometry={fangGeo}
          material={fangMat}
          position={[-1.3, -1.0, 3.8]}
          rotation={[Math.PI - 0.15, 0, -0.1]}
          scale={[0.7, 0.7, 0.7]}
          castShadow
        />
        <mesh
          geometry={fangGeo}
          material={fangMat}
          position={[1.3, -1.0, 3.8]}
          rotation={[Math.PI - 0.15, 0, 0.1]}
          scale={[0.7, 0.7, 0.7]}
          castShadow
        />
      </group>
    </group>
  );
}
