import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG, CELESTIAL_THEME } from '../../config/olympusConfig';

// 1. Soaring Olympian Eagle (Zeus's Sacred Bird - Aetos Dios)
function Eagle({ radius, speed, altitude, initialAngle, flapSpeed }) {
  const groupRef = useRef(null);
  const leftWingRef = useRef(null);
  const rightWingRef = useRef(null);

  const [mx, , mz] = OLYMPUS_CONFIG.world.mountainPosition;

  useFrame(({ clock }) => {
    const time = clock.elapsedTime * speed + initialAngle;
    const x = mx + Math.cos(time) * radius;
    const z = mz + Math.sin(time) * radius;
    // Slight vertical thermal updraft drift
    const y = altitude + Math.sin(time * 2.0) * 3.5;

    if (groupRef.current) {
      groupRef.current.position.set(x, y, z);
      // Tangent heading angle
      const heading = time + Math.PI / 2;
      groupRef.current.rotation.y = -heading;
      // Banking into the turn
      groupRef.current.rotation.z = 0.28;
      groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 1.5) * 0.05;
    }

    // Wing flapping
    const flap = Math.sin(clock.elapsedTime * flapSpeed) * 0.35;
    if (leftWingRef.current) leftWingRef.current.rotation.z = flap;
    if (rightWingRef.current) rightWingRef.current.rotation.z = -flap;
  });

  return (
    <group ref={groupRef} scale={[0.85, 0.85, 0.85]}>
      {/* Eagle Body (Natural dark brown/umber raptor plumage) */}
      <mesh castShadow>
        <coneGeometry args={[0.35, 2.2, 6]} />
        <meshStandardMaterial
          color="#261A12"
          roughness={0.85}
          metalness={0.08}
        />
      </mesh>

      {/* Golden Mantle & Head */}
      <mesh position={[0, 1.1, 0.2]}>
        <sphereGeometry args={[0.26, 8, 8]} />
        <meshStandardMaterial
          color="#785018"
          roughness={0.7}
          metalness={0.15}
        />
      </mesh>

      {/* Left Wing */}
      <group ref={leftWingRef} position={[-0.2, 0.3, 0]}>
        <mesh position={[-1.6, 0, 0]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[3.2, 0.08, 0.9]} />
          <meshStandardMaterial
            color="#221710"
            roughness={0.88}
            metalness={0.05}
          />
        </mesh>
      </group>

      {/* Right Wing */}
      <group ref={rightWingRef} position={[0.2, 0.3, 0]}>
        <mesh position={[1.6, 0, 0]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[3.2, 0.08, 0.9]} />
          <meshStandardMaterial
            color="#221710"
            roughness={0.88}
            metalness={0.05}
          />
        </mesh>
      </group>

      {/* Golden Tail Feathers */}
      <mesh position={[0, -1.2, 0]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[0.9, 0.06, 0.7]} />
        <meshStandardMaterial color="#6B4614" roughness={0.75} />
      </mesh>
    </group>
  );
}

// 2. Physical Mountain Waterfall plunging sheer from Mount Olympus into the Aegean Sea
function MountainWaterfall() {
  const waterFlowRef = useRef(null);
  const seaSplashRef = useRef(null);
  const seaMistRef = useRef(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (seaSplashRef.current) {
      const s = 1.0 + Math.sin(t * 3.5) * 0.12;
      seaSplashRef.current.scale.set(s, s, 1);
      seaSplashRef.current.rotation.z -= 0.005;
    }
    if (seaMistRef.current) {
      seaMistRef.current.rotation.y += 0.003;
      seaMistRef.current.material.opacity = 0.24 + Math.sin(t * 1.8) * 0.06;
    }
  });

  return (
    <group position={[-24, 78, -48]}>
      {/* Upper Source Spring Basin carved into Olympus cliff */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.5, 2.4, 5.0]} />
        <meshStandardMaterial color="#222C32" roughness={0.92} />
      </mesh>

      {/* Sheer Plunge Column (Drops 78m down to sea surface Y=0) */}
      <mesh
        ref={waterFlowRef}
        position={[0, -39, 3.0]}
        rotation={[0.04, 0, 0.02]}
        castShadow
      >
        <cylinderGeometry args={[1.6, 4.2, 78, 16, 4, true]} />
        <meshStandardMaterial
          color="#EAF2F6"
          roughness={0.18}
          metalness={0.2}
          transparent
          opacity={0.82}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ocean Impact Zone at Sea Level (World Y=0, X=-24, Z=-42) */}
      <group position={[0, -78, 6.0]}>
        {/* Radial Impact Froth Ring */}
        <mesh ref={seaSplashRef} position={[0, 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.5, 16.0, 32]} />
          <meshBasicMaterial
            color="#F0F8FF"
            transparent
            opacity={0.42}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Billowing Ocean Mist Spray Bank */}
        <mesh ref={seaMistRef} position={[0, 4.5, 0]}>
          <sphereGeometry args={[14.0, 16, 12]} />
          <meshBasicMaterial
            color="#D8E8F2"
            transparent
            opacity={0.25}
            depthWrite={false}
            blending={THREE.NormalBlending}
          />
        </mesh>
      </group>
    </group>
  );
}

// 3. Localized Sacred Altar Embers at the summit brazier
function LocalizedAltarEmbers({ count = 35 }) {
  const pointsRef = useRef(null);

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const [px, py, pz] = OLYMPUS_CONFIG.world.sanctuaryPlatform;

    for (let i = 0; i < count; i++) {
      const r = 0.2 + Math.random() * 2.2;
      const angle = Math.random() * Math.PI * 2;
      pos[i * 3] = px + Math.cos(angle) * r;
      pos[i * 3 + 1] = py + 2.0 + Math.random() * 8.0;
      pos[i * 3 + 2] = pz + Math.sin(angle) * r;

      vel[i * 3] = (Math.random() - 0.5) * 0.2;
      vel[i * 3 + 1] = 0.6 + Math.random() * 1.0;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    return [pos, vel];
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const arr = posAttr.array;
    const [, py] = OLYMPUS_CONFIG.world.sanctuaryPlatform;

    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 3] * delta;
      arr[i * 3 + 1] += velocities[i * 3 + 1] * delta;
      arr[i * 3 + 2] += velocities[i * 3 + 2] * delta;

      if (arr[i * 3 + 1] > py + 12) {
        arr[i * 3 + 1] = py + 2.0;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.45}
        color={CELESTIAL_THEME.sun.color}
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export default function DivineSanctuaryLife() {
  return (
    <group>
      {/* 1. Soaring Golden Eagles (Aetos Dios) in wide mountain thermals */}
      <Eagle
        radius={48}
        speed={0.28}
        altitude={98}
        initialAngle={0}
        flapSpeed={2.4}
      />
      <Eagle
        radius={75}
        speed={0.18}
        altitude={116}
        initialAngle={Math.PI * 0.8}
        flapSpeed={1.9}
      />
      <Eagle
        radius={38}
        speed={0.32}
        altitude={88}
        initialAngle={Math.PI * 1.5}
        flapSpeed={2.6}
      />

      {/* 2. Physical Mountain Waterfall plunging from Olympus into the Aegean Sea */}
      <MountainWaterfall />

      {/* 3. Subtle Sacred Altar Embers at the summit brazier */}
      <LocalizedAltarEmbers count={35} />
    </group>
  );
}
