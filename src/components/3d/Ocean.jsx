import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG, CELESTIAL_THEME } from '../../config/olympusConfig';
import { createWaterNormalTexture } from '../../utils/proceduralTextures';

// High-Energy Aegean Open-Sea Shader with Multi-Wave Gerstner Spectrum & Waterfall Interaction
const oceanVertexShader = `
  uniform float uTime;
  uniform float uWaveSpeed;
  uniform float uWaveHeight;
  uniform vec2 uWaterfallPos;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vElevation;
  varying float vSteepness;
  varying float vWaterfallDist;

  // Gerstner Wave Component calculation
  // Displaces horizontally along wave direction and vertically to form sharp crests
  vec3 gerstnerWave(vec2 p, vec2 dir, float steepness, float wavelength, float speed, float time, inout vec3 tangent, inout vec3 binormal) {
    float k = 6.28318 / wavelength;
    float c = sqrt(9.8 / k);
    vec2 d = normalize(dir);
    float f = k * (dot(d, p) - speed * c * time);
    float a = steepness / k;

    // Horizontal and vertical offsets
    float cosF = cos(f);
    float sinF = sin(f);

    tangent += vec3(
      -d.x * d.x * steepness * sinF,
      d.x * steepness * cosF,
      -d.x * d.y * steepness * sinF
    );

    binormal += vec3(
      -d.x * d.y * steepness * sinF,
      d.y * steepness * cosF,
      -d.y * d.y * steepness * sinF
    );

    return vec3(d.x * (a * cosF), a * sinF, d.y * (a * cosF));
  }

  void main() {
    vUv = uv * 32.0;
    vec3 pos = position; // Local plane coordinates (X, Y in plane; Y is normal before rotation)

    // Global XZ coordinate from local plane (before -PI/2 X rotation: local X -> world X, local Y -> -world Z)
    vec2 xz = vec2(pos.x, -pos.y);
    float time = uTime * uWaveSpeed;

    vec3 tangent = vec3(1.0, 0.0, 0.0);
    vec3 binormal = vec3(0.0, 1.0, 0.0);
    vec3 displacement = vec3(0.0);

    // 1. Primary Aegean Colossal Swell (Direction: South-South-East)
    displacement += gerstnerWave(xz, vec2(0.85, 0.52), 0.28 * uWaveHeight, 82.0, 0.85, time, tangent, binormal);

    // 2. Secondary Cross Swell (Interference pattern)
    displacement += gerstnerWave(xz, vec2(-0.55, 0.82), 0.22 * uWaveHeight, 44.0, 1.05, time, tangent, binormal);

    // 3. Wind Chop (Short wind-driven chop)
    displacement += gerstnerWave(xz, vec2(0.92, -0.38), 0.16 * uWaveHeight, 19.0, 1.4, time, tangent, binormal);

    // 4. Micro Surface Wave
    displacement += gerstnerWave(xz, vec2(-0.35, -0.93), 0.10 * uWaveHeight, 8.5, 1.8, time, tangent, binormal);

    // 5. Local Waterfall Impact Disturbance (Radial ripples expanding from impact zone)
    float wfDist = length(xz - uWaterfallPos);
    vWaterfallDist = wfDist;
    if (wfDist < 36.0) {
      float ripplePhase = wfDist * 1.6 - time * 6.5;
      float rippleAmp = exp(-wfDist * 0.12) * 1.6;
      displacement.y += sin(ripplePhase) * rippleAmp;
    }

    // Apply displacement to local vertex (displacement.y is vertical wave height, displacement.xz is horizontal pinch)
    pos.z += displacement.y; // In Three plane, local Z is the face normal
    pos.x += displacement.x;
    pos.y -= displacement.z;

    vElevation = displacement.y;

    // Normal calculation from Gerstner tangent and binormal
    vec3 computedNormal = normalize(cross(tangent, binormal));
    vNormal = vec3(computedNormal.x, computedNormal.z, -computedNormal.y);

    // Estimate wave crest steepness for whitecap foam
    vSteepness = clamp((displacement.y + 0.6) * 0.7 + (computedNormal.z < 0.85 ? 0.45 : 0.0), 0.0, 1.5);

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const oceanFragmentShader = `
  uniform vec3 uDeepColor;
  uniform vec3 uShallowColor;
  uniform vec3 uSunColor;
  uniform vec3 uSunPosition;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform float uTime;
  uniform vec2 uWaterfallPos;
  uniform sampler2D uNormalMap;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vElevation;
  varying float vSteepness;
  varying float vWaterfallDist;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

    // Micro-surface ripple normal sampling (dual scrolling vectors)
    vec2 uv1 = vUv + vec2(uTime * 0.015, uTime * 0.009);
    vec2 uv2 = vUv * 1.8 - vec2(uTime * 0.02, -uTime * 0.012);

    vec3 n1 = texture2D(uNormalMap, uv1).rgb * 2.0 - 1.0;
    vec3 n2 = texture2D(uNormalMap, uv2).rgb * 2.0 - 1.0;
    vec3 microNormal = normalize(n1 + n2);

    // Combined normal with macro wave crests
    vec3 normal = normalize(vNormal + microNormal * 0.22);

    // Fresnel reflectance (glancing angle reflection)
    float NdotV = max(0.0, dot(normal, viewDir));
    float fresnel = pow(1.0 - NdotV, 3.8);

    // Deep water color modulation based on wave depth & trough shadowing
    float depthFactor = smoothstep(-1.8, 2.2, vElevation);
    vec3 waterColor = mix(uDeepColor, uShallowColor, depthFactor);

    // Sunlight specular glint & directional path
    vec3 lightDir = normalize(uSunPosition - vWorldPosition);
    vec3 halfVector = normalize(lightDir + viewDir);
    float NdotH = max(0.0, dot(normal, halfVector));

    float sunSpecular = pow(NdotH, 180.0) * 3.8;
    float sunCorona = pow(NdotH, 32.0) * 0.45;
    vec3 sunGlint = uSunColor * (sunSpecular + sunCorona);

    // Dynamic wave crest whitecaps (selective based on steepness and elevation)
    float whitecapMask = smoothstep(0.95, 1.45, vElevation + vSteepness * 0.45);
    vec3 foamColor = vec3(0.92, 0.96, 0.98);

    // Localized Waterfall Impact Froth & Churn
    float wfChurn = 0.0;
    if (vWaterfallDist < 24.0) {
      float churnNoise = texture2D(uNormalMap, vUv * 4.0 + vec2(uTime * 0.15, uTime * 0.15)).r;
      float falloff = smoothstep(24.0, 2.0, vWaterfallDist);
      wfChurn = falloff * (0.65 + churnNoise * 0.35);
    }

    // Sky reflection color
    vec3 skyReflect = mix(vec3(0.08, 0.14, 0.22), uSunColor, fresnel * 0.55);

    // Composite final color
    vec3 color = mix(waterColor, skyReflect, fresnel * 0.6);
    color += sunGlint;

    // Apply selective whitecap foam & waterfall churn froth
    float totalFoam = clamp(whitecapMask * 0.65 + wfChurn * 0.85, 0.0, 0.95);
    color = mix(color, foamColor, totalFoam);

    // Atmospheric distance fog
    float dist = length(vWorldPosition - cameraPosition);
    float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
    fogFactor = clamp(fogFactor, 0.0, 1.0);
    color = mix(color, uFogColor, fogFactor);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function Ocean({ segments = 160 }) {
  const meshRef = useRef(null);
  const normalMap = useMemo(() => createWaterNormalTexture(512), []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWaveSpeed: { value: 0.9 },
    uWaveHeight: { value: 1.3 },
    uWaterfallPos: { value: new THREE.Vector2(-24.0, -42.0) },
    uDeepColor: { value: new THREE.Color(CELESTIAL_THEME.ocean.deepColor) },
    uShallowColor: { value: new THREE.Color(CELESTIAL_THEME.ocean.shallowColor) },
    uSunColor: { value: new THREE.Color(CELESTIAL_THEME.sun.color) },
    uSunPosition: { value: new THREE.Vector3(...CELESTIAL_THEME.sun.position) },
    uFogColor: { value: new THREE.Color(CELESTIAL_THEME.sky.fogColor) },
    uFogDensity: { value: CELESTIAL_THEME.sky.fogDensity * 0.75 },
    uNormalMap: { value: normalMap }
  }), [normalMap]);

  useFrame((_, delta) => {
    if (meshRef.current && meshRef.current.material) {
      meshRef.current.material.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, OLYMPUS_CONFIG.world.waterLevel, 0]}
    >
      <planeGeometry args={[1400, 1400, segments, segments]} />
      <shaderMaterial
        vertexShader={oceanVertexShader}
        fragmentShader={oceanFragmentShader}
        uniforms={uniforms}
        wireframe={false}
      />
    </mesh>
  );
}
