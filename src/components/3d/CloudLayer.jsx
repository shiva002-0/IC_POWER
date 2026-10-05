import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG } from '../../config/olympusConfig';
import { createRealisticCloudTexture } from '../../utils/proceduralTextures';

/**
 * Natural Linear Atmospheric Cloud Drift System
 * Replaces the rotating group carousel with linear 3D wind drift
 * along a shared wind vector with altitude wind shear and bounding wrapping.
 */
export default function CloudLayer() {
  const lowMistRef = useRef([]);
  const midCloudsRef = useRef([]);
  const highCloudsRef = useRef([]);

  const cloudTexture = useMemo(() => createRealisticCloudTexture(256), []);
  const [mx, , mz] = OLYMPUS_CONFIG.world.mountainPosition;

  // 1. Low Sea Mist Masses (Elevation 2 - 12m)
  const lowMist = useMemo(() => {
    const list = [];
    const count = 30;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const radius = 60 + Math.random() * 85;
      list.push({
        pos: [mx + Math.cos(angle) * radius, 2.5 + Math.random() * 8.0, mz + Math.sin(angle) * radius],
        scale: [48 + Math.random() * 35, 12 + Math.random() * 10, 1],
        opacity: 0.15 + Math.random() * 0.12,
        speed: 1.8 + Math.random() * 1.2
      });
    }
    return list;
  }, [mx, mz]);

  // 2. Mid-Mountain Atmospheric Cloud Masses (Elevation 32 - 58m)
  const midClouds = useMemo(() => {
    const list = [];
    const count = 48;
    const baseAlt = OLYMPUS_CONFIG.world.cloudLayerAltitude;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const radius = 38 + Math.random() * 56;
      const altOffset = (Math.random() - 0.5) * 22;

      list.push({
        pos: [
          mx + Math.cos(angle) * radius,
          baseAlt + altOffset,
          mz + Math.sin(angle) * radius
        ],
        scale: [42 + Math.random() * 36, 22 + Math.random() * 18, 1],
        opacity: 0.22 + Math.random() * 0.18,
        speed: 3.2 + Math.random() * 1.6,
        color: '#E8EDF2'
      });
    }
    return list;
  }, [mx, mz]);

  // 3. High-Altitude Cirrus Masses (Elevation 110 - 135m)
  const highClouds = useMemo(() => {
    const list = [];
    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 85 + Math.random() * 95;
      list.push({
        pos: [mx + Math.cos(angle) * radius, 115 + Math.random() * 20, mz + Math.sin(angle) * radius],
        scale: [75 + Math.random() * 55, 24 + Math.random() * 16, 1],
        opacity: 0.14 + Math.random() * 0.10,
        speed: 4.8 + Math.random() * 2.0,
        color: '#F0ECE4'
      });
    }
    return list;
  }, [mx, mz]);

  // Linear wind vector drift with position bounds wrapping
  useFrame((_, delta) => {
    const windDir = new THREE.Vector2(0.72, 0.69).normalize();
    const boundRadius = 175;

    // 1. Drift Low Mist
    lowMistRef.current.forEach((sprite, i) => {
      if (!sprite) return;
      const data = lowMist[i];
      sprite.position.x += windDir.x * data.speed * delta;
      sprite.position.z += windDir.y * data.speed * delta;

      const dx = sprite.position.x - mx;
      const dz = sprite.position.z - mz;
      if (dx * dx + dz * dz > boundRadius * boundRadius) {
        sprite.position.x -= windDir.x * boundRadius * 1.8;
        sprite.position.z -= windDir.y * boundRadius * 1.8;
      }
    });

    // 2. Drift Mid Mountain Clouds
    midCloudsRef.current.forEach((sprite, i) => {
      if (!sprite) return;
      const data = midClouds[i];
      sprite.position.x += windDir.x * data.speed * delta;
      sprite.position.z += windDir.y * data.speed * delta;

      const dx = sprite.position.x - mx;
      const dz = sprite.position.z - mz;
      if (dx * dx + dz * dz > boundRadius * boundRadius) {
        sprite.position.x -= windDir.x * boundRadius * 1.8;
        sprite.position.z -= windDir.y * boundRadius * 1.8;
      }
    });

    // 3. Drift High Cirrus
    highCloudsRef.current.forEach((sprite, i) => {
      if (!sprite) return;
      const data = highClouds[i];
      sprite.position.x += windDir.x * data.speed * delta;
      sprite.position.z += windDir.y * data.speed * delta;

      const dx = sprite.position.x - mx;
      const dz = sprite.position.z - mz;
      if (dx * dx + dz * dz > (boundRadius + 50) * (boundRadius + 50)) {
        sprite.position.x -= windDir.x * (boundRadius + 50) * 1.8;
        sprite.position.z -= windDir.y * (boundRadius + 50) * 1.8;
      }
    });
  });

  return (
    <group>
      {/* 1. Low Sea Mist */}
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

      {/* 3. High Cirrus Clouds */}
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
