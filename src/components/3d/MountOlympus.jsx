import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG, CELESTIAL_THEME } from '../../config/olympusConfig';
import { createRockTexture, createMarbleTexture } from '../../utils/proceduralTextures';

// Fluted Classical Greek Column
function GreekColumn({ position, height = 7.5, radius = 0.45 }) {
  const columnGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(radius * 0.9, radius, height, 16);
    return geo;
  }, [height, radius]);

  return (
    <group position={position}>
      {/* Base Plinth */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[radius * 2.8, 0.5, radius * 2.8]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.35} metalness={0.15} />
      </mesh>
      {/* Fluted Column Shaft */}
      <mesh geometry={columnGeo} position={[0, height / 2 + 0.5, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#F1F5F9" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Doric/Ionic Capital */}
      <mesh position={[0, height + 0.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[radius * 2.9, 0.35, radius * 2.9]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.35} metalness={0.15} />
      </mesh>
    </group>
  );
}

export default function MountOlympus() {
  const flameRef = useRef(null);

  const rockTexture = useMemo(() => createRockTexture(512), []);
  const marbleTexture = useMemo(() => createMarbleTexture(512), []);

  // Sculpted High-Detail Mount Olympus Massif Geometry with multiple peaks and ridges
  const mountainGeo = useMemo(() => {
    // High-resolution cone base geometry for organic mountain sculpting
    const geo = new THREE.ConeGeometry(68, OLYMPUS_CONFIG.world.mountainHeight, 64, 48);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      // Height ratio: 0.0 at base, 1.0 at peak
      const hRatio = (y + OLYMPUS_CONFIG.world.mountainHeight / 2) / OLYMPUS_CONFIG.world.mountainHeight;

      if (hRatio < 0.96) {
        const angle = Math.atan2(z, x);
        const radius = Math.sqrt(x * x + z * z);

        // 1. Primary geological knife-edge ridges (Aretes of Olympus)
        const ridgeMytikas = Math.cos(angle * 3.0 + y * 0.06) * 6.5;
        const ridgeStefani = Math.sin(angle * 5.0 - y * 0.08) * 3.8;
        const subCrags = Math.cos(angle * 11.0 + y * 0.15) * 1.8;

        // 2. Vertical rock face sheer cliffs & couloirs (gorges)
        const cliffCouloir = (Math.sin(x * 0.3) * Math.cos(z * 0.3)) * 3.2;
        const microCrags = (Math.sin(x * 0.8) + Math.cos(z * 0.8)) * 1.2;

        // 3. Multi-peak displacement near summit (creates Mytikas + Stefani Throne of Zeus)
        let peakMorph = 0;
        if (hRatio > 0.65) {
          const peakFactor = (hRatio - 0.65) / 0.35;
          peakMorph = Math.sin(angle * 2.0) * 4.5 * peakFactor;
        }

        const totalDisplacement = (ridgeMytikas + ridgeStefani + subCrags + cliffCouloir + microCrags + peakMorph) * (1.0 - hRatio * 0.45);
        const newRadius = Math.max(1.2, radius + totalDisplacement);

        pos.setX(i, Math.cos(angle) * newRadius);
        pos.setZ(i, Math.sin(angle) * newRadius);

        // Slightly terrace the slopes
        if (hRatio < 0.85) {
          const terrace = Math.sin(y * 0.35) * 0.8;
          pos.setY(i, y + terrace);
        }
      }
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  // Vertex-color / slope-aware snow & rock material
  const mountainMaterial = useMemo(() => {
    // Custom shader material for natural rock + altitude/slope-dependent snow cover
    const rockMat = new THREE.MeshStandardMaterial({
      map: rockTexture,
      roughness: 0.88,
      metalness: 0.15,
      bumpMap: rockTexture,
      bumpScale: 1.2,
      flatShading: false
    });

    // Custom onBeforeCompile to inject procedural snow cover on upward-facing high-altitude vertices
    rockMat.onBeforeCompile = (shader) => {
      shader.uniforms.uSnowColor = { value: new THREE.Color('#F8FAFC') };
      shader.uniforms.uSunWarmth = { value: new THREE.Color(CELESTIAL_THEME.sun.color) };

      shader.vertexShader = `
        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;
        ${shader.vertexShader}
      `;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `
        #include <worldpos_vertex>
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        `
      );

      shader.fragmentShader = `
        uniform vec3 uSnowColor;
        uniform vec3 uSunWarmth;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;
        ${shader.fragmentShader}
      `;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        #include <dithering_fragment>
        
        // Snow appears on high altitudes (> 52 units) and upward-facing normals
        float upNormal = max(0.0, vWorldNormal.y);
        float altitudeFactor = smoothstep(48.0, 82.0, vWorldPos.y);
        float snowMask = smoothstep(0.45, 0.75, upNormal * altitudeFactor);
        
        vec3 finalSnow = mix(uSnowColor, uSunWarmth, 0.18);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, finalSnow, snowMask * 0.92);
        `
      );
    };

    return rockMat;
  }, [rockTexture]);

  // Classical Summit Colonnade (12 Columns in circular perimeter)
  const columns = useMemo(() => {
    const list = [];
    const count = 10;
    const radius = 17.5;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      // Leave front open for viewer/camera approach
      if (Math.sin(angle) > 0.6) continue;
      list.push({
        id: i,
        pos: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius]
      });
    }
    return list;
  }, []);


  useFrame((state) => {
    if (flameRef.current) {
      const scale = 1.0 + Math.sin(state.clock.elapsedTime * 6.0) * 0.08;
      flameRef.current.scale.set(scale, scale * 1.15, scale);
    }
  });

  const [mx, my, mz] = OLYMPUS_CONFIG.world.mountainPosition;
  const [px, py, pz] = OLYMPUS_CONFIG.world.sanctuaryPlatform;

  return (
    <group>
      {/* 1. Main Sculpted Rocky Mountain Body */}
      <group position={[mx, my + OLYMPUS_CONFIG.world.mountainHeight / 2 - 4, mz]}>
        <mesh geometry={mountainGeo} material={mountainMaterial} receiveShadow castShadow />
      </group>

      {/* 2. Classical Greek Pantheon Summit Sanctuary (Physically anchored to mountain peak) */}
      <group position={[px, py, pz]}>
        {/* Sub-Stylobate: Chiseled Ashlar Limestone Bedrock Anchor */}
        <mesh position={[0, -4.2, 0]} receiveShadow>
          <cylinderGeometry args={[22.5, 26.5, 4.0, 36]} />
          <meshStandardMaterial
            map={rockTexture}
            color="#222B32"
            roughness={0.94}
            metalness={0.05}
          />
        </mesh>

        {/* Tier 1: Lower Stepped Weathered Marble Foundation */}
        <mesh position={[0, -1.8, 0]} receiveShadow>
          <cylinderGeometry args={[20.5, 22.5, 1.8, 48]} />
          <meshStandardMaterial
            map={marbleTexture}
            color="#D8DEE4"
            roughness={0.55}
            metalness={0.08}
          />
        </mesh>

        {/* Tier 2: Upper Pentelic Weathered Marble Stylobate */}
        <mesh position={[0, -0.6, 0]} receiveShadow>
          <cylinderGeometry args={[18.5, 19.5, 1.2, 48]} />
          <meshStandardMaterial
            map={marbleTexture}
            color="#EAEFF4"
            roughness={0.45}
            metalness={0.08}
          />
        </mesh>

        {/* Weathered Bronze Inlay Ring (Restrained ancient patina, zero arcade emissive glow) */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[11.5, 12.0, 48]} />
          <meshStandardMaterial
            color="#785B38"
            roughness={0.65}
            metalness={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Classical Fluted Greek Marble Columns */}
        {columns.map((col) => (
          <GreekColumn key={col.id} position={col.pos} height={8.2} radius={0.52} />
        ))}

        {/* Central Altar with Sacred Olympian Hearth Fire */}
        <group position={[0, 0.1, 0]}>
          {/* Weathered Stone Altar Pedestal */}
          <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.8, 2.4, 1.6, 24]} />
            <meshStandardMaterial
              map={marbleTexture}
              color="#CBD5E1"
              roughness={0.55}
              metalness={0.1}
            />
          </mesh>

          {/* Antique Bronze Brazier Basin */}
          <mesh position={[0, 1.8, 0]} castShadow>
            <cylinderGeometry args={[2.2, 1.2, 0.8, 24]} />
            <meshStandardMaterial
              color="#5C4524"
              roughness={0.58}
              metalness={0.7}
            />
          </mesh>

          {/* Living Warm Amber Sacred Flame */}
          <mesh ref={flameRef} position={[0, 2.4, 0]}>
            <octahedronGeometry args={[0.75, 2]} />
            <meshBasicMaterial
              color="#E59E26"
              transparent
              opacity={0.88}
            />
          </mesh>

          {/* Subtle Local Altar Warmth */}
          <pointLight
            position={[0, 2.6, 0]}
            color="#E59E26"
            intensity={12}
            distance={14}
            decay={2}
          />
        </group>
      </group>
    </group>
  );
}
