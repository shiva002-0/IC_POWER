import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CELESTIAL_THEME } from '../../config/olympusConfig';
import { createSunFlareTexture } from '../../utils/proceduralTextures';

// Hyper-Realistic Sky Dome Shader with Rayleigh/Mie Scattering & Twinkling Celestial Stars
const skyVertexShader = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragmentShader = `
  uniform vec3 uTopColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uDawnAmber;
  uniform vec3 uSunColor;
  uniform vec3 uSunHaloColor;
  uniform vec3 uSunPosition;
  uniform float uTime;
  varying vec3 vWorldPosition;

  // Pseudo-random starfield generator
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec3 point = normalize(vWorldPosition);
    float h = max(0.0, point.y);

    // Multi-stop atmospheric sky gradient
    // Horizon: Radiant dawn gold -> Mid-sky: mythological violet-rose -> Zenith: deep celestial midnight
    vec3 lowerAtmosphere = mix(uDawnAmber, uHorizonColor, smoothstep(0.0, 0.22, h));
    vec3 sky = mix(lowerAtmosphere, uTopColor, smoothstep(0.18, 0.85, h));

    // Twinkling celestial stars in the upper zenith
    if (h > 0.35) {
      vec2 starCoord = point.xz * 180.0 / (h + 0.1);
      float star = hash(floor(starCoord));
      if (star > 0.985) {
        float twinkle = sin(uTime * 3.0 + star * 30.0) * 0.5 + 0.5;
        float starIntensity = smoothstep(0.985, 1.0, star) * (h - 0.35) * 1.5 * twinkle;
        sky += vec3(0.9, 0.95, 1.0) * starIntensity;
      }
    }

    // Solar Disc, Corona & God-Ray Atmospheric Scattering
    vec3 sunDir = normalize(uSunPosition);
    float sunDot = max(0.0, dot(point, sunDir));

    // Wide atmospheric golden wash
    float sunWash = pow(sunDot, 4.0) * 0.45;
    // Radiant amber corona
    float sunCorona = pow(sunDot, 28.0) * 0.95;
    // Brilliant solar core
    float sunCore = pow(sunDot, 320.0) * 4.5;
    // Solar rays (subtle angular modulation)
    float angle = atan(point.y - sunDir.y, point.x - sunDir.x);
    float rayRings = sin(angle * 14.0 + uTime * 0.2) * 0.5 + 0.5;
    float godRays = pow(sunDot, 12.0) * rayRings * 0.22;

    sky += uSunHaloColor * (sunWash + sunCorona + godRays);
    sky += vec3(1.0, 0.98, 0.92) * sunCore;

    gl_FragColor = vec4(sky, 1.0);
  }
`;

export default function Atmosphere({ shadowMapSize = 2048, castShadow = true }) {
  const skyMeshRef = useRef(null);
  const sunMeshRef = useRef(null);
  const sunFlareTex = useMemo(() => createSunFlareTexture(256), []);

  const skyUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uTopColor: { value: new THREE.Color('#020716') },
    uHorizonColor: { value: new THREE.Color('#241530') },
    uDawnAmber: { value: new THREE.Color('#C87B28') },
    uSunColor: { value: new THREE.Color('#FDE047') },
    uSunHaloColor: { value: new THREE.Color('#D97706') },
    uSunPosition: { value: new THREE.Vector3(...CELESTIAL_THEME.sun.position) }
  }), []);

  useFrame((_, delta) => {
    if (skyMeshRef.current && skyMeshRef.current.material) {
      skyMeshRef.current.material.uniforms.uTime.value += delta;
    }
    if (sunMeshRef.current) {
      sunMeshRef.current.rotation.z += delta * 0.05;
    }
  });

  return (
    <>
      {/* 1. Atmospheric Distance Fog */}
      <fogExp2
        attach="fog"
        args={[CELESTIAL_THEME.sky.fogColor, CELESTIAL_THEME.sky.fogDensity * 0.65]}
      />

      {/* 2. Panoramic Sky Dome Sphere with Rayleigh/Mie & Starfield */}
      <mesh ref={skyMeshRef} scale={[-1, 1, 1]}>
        <sphereGeometry args={[1400, 48, 36]} />
        <shaderMaterial
          vertexShader={skyVertexShader}
          fragmentShader={skyFragmentShader}
          uniforms={skyUniforms}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Physical Solar Body with Soft Natural Corona */}
      <group position={CELESTIAL_THEME.sun.position}>
        {/* Solar Core */}
        <mesh>
          <sphereGeometry args={[10, 32, 32]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>

        {/* Inner Golden Chromosphere */}
        <mesh>
          <sphereGeometry args={[16, 32, 32]} />
          <meshBasicMaterial
            color="#FDE047"
            transparent
            opacity={0.6}
          />
        </mesh>

        {/* Outer Solar Flare Corona Billboard */}
        <sprite ref={sunMeshRef} scale={[110, 110, 1]}>
          <spriteMaterial
            map={sunFlareTex}
            transparent
            opacity={0.75}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      </group>

      {/* 4. Unified Celestial Lighting Rig */}
      <ambientLight color="#121D2C" intensity={0.55} />

      {/* Sky & Aegean Ground Bounce (Restrained natural palette, zero electric cyan) */}
      <hemisphereLight
        color="#94A3B8"
        groundColor="#0A1422"
        intensity={0.65}
      />

      {/* Primary Directional Golden Sunlight */}
      <directionalLight
        position={CELESTIAL_THEME.sun.position}
        color="#FFF1D6"
        intensity={2.4}
        castShadow={castShadow}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={15}
        shadow-camera-far={600}
        shadow-camera-left={-160}
        shadow-camera-right={160}
        shadow-camera-top={160}
        shadow-camera-bottom={-160}
        shadow-bias={-0.0005}
      />

      {/* Fill Light for Cliffs and Mountain Shadow Sides */}
      <directionalLight
        position={[-CELESTIAL_THEME.sun.position[0], 60, -CELESTIAL_THEME.sun.position[2]]}
        color="#708DA8"
        intensity={0.35}
      />
    </>
  );
}
