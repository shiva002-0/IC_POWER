import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG } from '../../config/olympusConfig';
import { createRealisticCloudTexture } from '../../utils/proceduralTextures';

/**
 * Natural Linear Atmospheric Cloud Drift System
 * Consolidated into a small number of large, soft atmospheric cloud masses
 * moving across a shared linear wind field with altitude-dependent shear.
 * Avoids individual rotating sprites and repetitive looping.
 */
export default function CloudLayer() {
  const lowMistRef = useRef([]);
  const midCloudsRef = useRef([]);
  const highCloudsRef = useRef([]);

  const cloudTexture = useMemo(() => createRealisticCloudTexture(256), []);
  const [mx, , mz] = OLYMPUS_CONFIG.world.mountainPosition;

  // 1. Large Low Sea Mist Banks (Elevation 2 - 14m)
  const lowMist = useMemo(() => {
    const list = [];
    const count = 10;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.sin(i * 1.7) * 0.3;
      const radius = 70 + (i % 3) * 35;
      list.push({
        pos: [mx + Math.cos(angle) * radius, 3.5 + (i % 3) * 3.0, mz + Math.sin(angle) * radius],
        scale: [95 + (i % 4) * 25, 22 + (i % 3) * 8, 1],
        opacity: 0.16 + (i % 3) * 0.04,
        speed: 1.4 + (i % 2) * 0.4
      });
    }
    return list;
  }, [mx, mz]);

  // 2. Mid-Mountain Cloud Sea (Elevation 34 - 56m)
  const midClouds = useMemo(() => {
    const list = [];
    const count = 14;
    const baseAlt = OLYMPUS_CONFIG.world.cloudLayerAltitude;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.cos(i * 1.4) * 0.35;
      const radius = 45 + (i % 4) * 22;
      const altOffset = (i % 5 - 2) * 5;

      list.push({
        pos: [
          mx + Math.cos(angle) * radius,
          baseAlt + altOffset,
          mz + Math.sin(angle) * radius
        ],
        scale: [85 + (i % 3) * 30, 36 + (i % 3) * 12, 1],
        opacity: 0.22 + (i % 3) * 0.05,
        speed: 2.6 + (i % 3) * 0.6,
        color: '#E8EDF2'
      });
    }
    return list;
  }, [mx, mz]);

  // 3. High-Altitude Cirrus Masses (Elevation 115 - 140m)
  const highClouds = useMemo(() => {
    const list = [];
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 90 + (i % 3) * 45;
      list.push({
        pos: [mx + Math.cos(angle) * radius, 120 + (i % 3) * 10, mz + Math.sin(angle) * radius],
        scale: [140 + (i % 2) * 50, 42 + (i % 2) * 16, 1],
        opacity: 0.14 + (i % 2) * 0.04,
        speed: 4.2 + (i % 2) * 0.8,
        color: '#F0ECE4'
      });
    }
    return list;
  }, [mx, mz]);

  // Shared linear wind vector with altitude wind shear
  useFrame((_, delta) => {
    const windX = 0.72;
    const windZ = 0.69;
    const boundRadius = 220;

    // 1. Low Sea Mist
    lowMistRef.current.forEach((sprite, i) => {
      if (!sprite) return;
      const data = lowMist[i];
      sprite.position.x += windX * data.speed * delta;
      sprite.position.z += windZ * data.speed * delta;

      const dx = sprite.position.x - mx;
      const dz = sprite.position.z - mz;
      if (dx * dx + dz * dz > boundRadius * boundRadius) {
        sprite.position.x -= windX * boundRadius * 1.8;
        sprite.position.z -= windZ * boundRadius * 1.8;
      }
    });

    // 2. Mid Mountain Clouds
    midCloudsRef.current.forEach((sprite, i) => {
      if (!sprite) return;
      const data = midClouds[i];
      sprite.position.x += windX * data.speed * delta;
      sprite.position.z += windZ * data.speed * delta;

      const dx = sprite.position.x - mx;
      const dz = sprite.position.z - mz;
      if (dx * dx + dz * dz > boundRadius * boundRadius) {
        sprite.position.x -= windX * boundRadius * 1.8;
        sprite.position.z -= windZ * boundRadius * 1.8;
      }
    });

    // 3. High Cirrus Sweeps
    highCloudsRef.current.forEach((sprite, i) => {
      if (!sprite) return;
      const data = highClouds[i];
      sprite.position.x += windX * data.speed * delta;
      sprite.position.z += windZ * data.speed * delta;

      const dx = sprite.position.x - mx;
      const dz = sprite.position.z - mz;
      if (dx * dx + dz * dz > (boundRadius + 60) * (boundRadius + 60)) {
        sprite.position.x -= windX * (boundRadius + 60) * 1.8;
        sprite.position.z -= windZ * (boundRadius + 60) * 1.8;
      }
    });
  });

  return (
    <group>
      {/* 1. Low Sea Mist Banks */}
      <group>
        {lowMist.map((c, i) => (
          <sprite
            key={`low-${i}`}
            ref={(el) => (lowMistRef.current[i] = el)}
            position={c.pos}
            scale={c.scale}
          >
            <spriteMaterial
              map={cloudTexture}
              transparent
              opacity={c.opacity}
              depthWrite={false}
              blending={THREE.NormalBlending}
              color="#CBD5E1"
            />
          </sprite>
        ))}
      </group>

      {/* 2. Mid Mountain Cloud Sea */}
      <group>
        {midClouds.map((c, i) => (
          <sprite
            key={`mid-${i}`}
            ref={(el) => (midCloudsRef.current[i] = el)}
            position={c.pos}
            scale={c.scale}
          >
            <spriteMaterial
              map={cloudTexture}
              transparent
              opacity={c.opacity}
              depthWrite={false}
              blending={THREE.NormalBlending}
              color={c.color}
            />
          </sprite>
        ))}
      </group>

      {/* 3. High Cirrus Sweeps */}
      <group>
        {highClouds.map((c, i) => (
          <sprite
            key={`high-${i}`}
            ref={(el) => (highCloudsRef.current[i] = el)}
            position={c.pos}
            scale={c.scale}
          >
            <spriteMaterial
              map={cloudTexture}
              transparent
              opacity={c.opacity}
              depthWrite={false}
              blending={THREE.NormalBlending}
              color={c.color}
            />
          </sprite>
        ))}
      </group>
    </group>
  );
}
