import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Continuous 360-degree geological horizon landscape
 * Replaces rectangular terrain cards with a seamless continuous mountain ring
 * providing true geological depth, arêtes, saddles, and atmospheric perspective.
 */
function createMountainRingGeometry(radius = 750, height = 145, radialSegments = 180, heightSegments = 24, seed = 1.0) {
  const geo = new THREE.CylinderGeometry(radius * 0.96, radius * 1.04, height, radialSegments, heightSegments, true);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const angle = Math.atan2(z, x);
    // Vertical factor from 0.0 (base at sea level) to 1.0 (ridge peak)
    const hNorm = (y + height * 0.5) / height;

    if (hNorm > 0.05) {
      // Multi-octave continuous circular fractal profile (seamless 2PI periodic harmonics)
      const oct1 = Math.sin(angle * 3.0 + seed) * 36.0;
      const oct2 = Math.cos(angle * 7.0 - seed * 1.5) * 18.0;
      const oct3 = Math.sin(angle * 14.0 + seed * 2.3) * 9.0;
      const oct4 = Math.cos(angle * 28.0) * 4.5;
      const oct5 = (Math.sin(angle * 56.0) + Math.cos(angle * 42.0)) * 2.0;

      // Geological arête ridges (knife-edge peaks)
      const arete1 = Math.pow(Math.abs(Math.sin(angle * 5.0 + seed * 0.7)), 2.8) * 42.0;
      const arete2 = Math.pow(Math.abs(Math.cos(angle * 9.0 - seed * 1.1)), 3.2) * 26.0;

      const totalDisplacement = (oct1 + oct2 + oct3 + oct4 + oct5 + arete1 + arete2) * Math.pow(hNorm, 1.4);

      // Displace height and radius
      pos.setY(i, y + totalDisplacement * 0.85);

      const rad = Math.sqrt(x * x + z * z) + totalDisplacement * 0.45;
      pos.setX(i, Math.cos(angle) * rad);
      pos.setZ(i, Math.sin(angle) * rad);
    } else {
      // Anchored into the sea at Y = 0
      pos.setY(i, -2.0);
    }
  }

  geo.computeVertexNormals();
  return geo;
}

export default function BackgroundMountains() {
  // Dual-layer parallax mountain ranges:
  // 1. Mid-distant Pierian Range (R=680)
  // 2. Far-horizon Macedonian Spine (R=1150)
  const { midRangeGeo, farRangeGeo } = useMemo(() => {
    return {
      midRangeGeo: createMountainRingGeometry(680, 135, 160, 20, 2.71),
      farRangeGeo: createMountainRingGeometry(1150, 210, 180, 24, 5.18)
    };
  }, []);

  return (
    <group position={[0, 0, -40]}>
      {/* 1. Mid-Distant Pierian Range */}
      <mesh geometry={midRangeGeo} receiveShadow>
        <meshStandardMaterial
          color="#1C2836"
          roughness={0.92}
          metalness={0.06}
          flatShading={true}
        />
      </mesh>

      {/* 2. Far-Horizon Macedonian Spine (Atmospheric Rayleigh Haze) */}
      <mesh geometry={farRangeGeo} receiveShadow>
        <meshStandardMaterial
          color="#141E2B"
          roughness={0.96}
          metalness={0.04}
          flatShading={true}
        />
      </mesh>
    </group>
  );
}
