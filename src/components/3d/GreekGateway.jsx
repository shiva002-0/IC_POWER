import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CELESTIAL_THEME } from '../../config/olympusConfig';
import {
  createMarbleTexture,
  createGoldLeafTexture,
  createGreekMeanderTexture
} from '../../utils/proceduralTextures';

/**
 * GREEK GATEWAY - THE PROPYLAEA OF OLYMPUS
 * A monumental classical Greek gateway standing at the entrance to Mount Olympus.
 * Located on the ocean approach at Z = 75, directly framing the camera's ascent path.
 * 
 * Authentic Architectural Features:
 * - Pentelic white marble stepped stylobate (quay) rising from the Aegean Sea
 * - Twin monumental flanking pylons with fluted Corinthian/Doric columns
 * - Massive classical entablature with gilded Greek Key (meander) frieze
 * - Triangular pediment (tympanum) with golden Apollo Sun relief and acroteria
 * - Monumental gilded Olympian gates swung open in welcome
 * - Twin eternal sacred flame braziers casting flickering golden light
 * - Luminous celestial gateway threshold beacon
 */

function FlutedColumn({ position, height = 22, radius = 0.85, marbleMat, goldMat }) {
  const shaftGeo = useMemo(() => {
    return new THREE.CylinderGeometry(radius * 0.9, radius, height, 20);
  }, [radius, height]);

  return (
    <group position={position}>
      {/* Plinth Base */}
      <mesh position={[0, 0.75, 0]} material={marbleMat} castShadow receiveShadow>
        <boxGeometry args={[radius * 2.8, 1.5, radius * 2.8]} />
      </mesh>
      {/* Torus Base Molding */}
      <mesh position={[0, 1.7, 0]} material={goldMat} castShadow>
        <cylinderGeometry args={[radius * 1.25, radius * 1.35, 0.5, 20]} />
      </mesh>
      {/* Fluted Shaft */}
      <mesh
        geometry={shaftGeo}
        position={[0, height / 2 + 1.8, 0]}
        material={marbleMat}
        castShadow
        receiveShadow
      />
      {/* Capital Architrave Block */}
      <mesh position={[0, height + 2.2, 0]} material={goldMat} castShadow>
        <cylinderGeometry args={[radius * 1.35, radius * 1.1, 0.6, 20]} />
      </mesh>
      <mesh position={[0, height + 2.7, 0]} material={marbleMat} castShadow receiveShadow>
        <boxGeometry args={[radius * 3.0, 0.7, radius * 3.0]} />
      </mesh>
    </group>
  );
}

export default function GreekGateway() {
  const leftFlameRef = useRef(null);
  const rightFlameRef = useRef(null);
  const leftLightRef = useRef(null);
  const rightLightRef = useRef(null);

  const marbleTex = useMemo(() => createMarbleTexture(512), []);
  const goldTex = useMemo(() => createGoldLeafTexture(256), []);
  const meanderTex = useMemo(() => createGreekMeanderTexture(512, 128), []);

  const marbleMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: marbleTex,
      color: '#FFFFFF',
      roughness: 0.28,
      metalness: 0.12
    });
  }, [marbleTex]);

  const goldMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: goldTex,
      color: '#FDE047',
      emissive: '#B45309',
      emissiveIntensity: 0.25,
      roughness: 0.2,
      metalness: 0.92
    });
  }, [goldTex]);

  const darkBronzeMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#261F17',
      roughness: 0.45,
      metalness: 0.75
    });
  }, []);

  const meanderMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: meanderTex,
      roughness: 0.35,
      metalness: 0.4
    });
  }, [meanderTex]);

  // Triangular Pediment Tympanum geometry
  const pedimentGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const halfW = 27;
    const h = 7.5;
    shape.moveTo(-halfW, 0);
    shape.lineTo(halfW, 0);
    shape.lineTo(0, h);
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: 3.5,
      bevelEnabled: true,
      bevelThickness: 0.6,
      bevelSize: 0.6,
      bevelSegments: 3
    };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    return geo;
  }, []);

  // Animate the eternal sacred flames
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const leftFlicker = 1.0 + Math.sin(t * 11.0) * 0.12 + Math.cos(t * 7.5) * 0.08;
    const rightFlicker = 1.0 + Math.cos(t * 9.5) * 0.12 + Math.sin(t * 8.2) * 0.08;

    if (leftFlameRef.current) {
      leftFlameRef.current.scale.set(leftFlicker, leftFlicker * 1.2, leftFlicker);
      leftFlameRef.current.rotation.y = t * 1.2;
    }
    if (rightFlameRef.current) {
      rightFlameRef.current.scale.set(rightFlicker, rightFlicker * 1.2, rightFlicker);
      rightFlameRef.current.rotation.y = -t * 1.2;
    }
    if (leftLightRef.current) {
      leftLightRef.current.intensity = 15 * leftFlicker;
    }
    if (rightLightRef.current) {
      rightLightRef.current.intensity = 15 * rightFlicker;
    }
  });

  // Gateway sits at the sea approach [0, 0, 75]
  return (
    <group position={[0, 0, 75]}>
      {/* 1. Grand Sea Stylobate (Stepped Marble Terrace) */}
      <group position={[0, 0.8, 0]}>
        {/* Tier 1 - Submerged Base in Aegean Waters */}
        <mesh position={[0, -0.6, 0]} material={marbleMat} receiveShadow>
          <boxGeometry args={[62, 1.8, 24]} />
        </mesh>
        {/* Tier 2 - Middle Step */}
        <mesh position={[0, 0.4, 0]} material={marbleMat} receiveShadow>
          <boxGeometry args={[58, 0.8, 21]} />
        </mesh>
        {/* Tier 3 - Upper Polished Marble Causeway */}
        <mesh position={[0, 1.1, 0]} material={marbleMat} receiveShadow>
          <boxGeometry args={[54, 0.7, 18]} />
        </mesh>
        {/* Golden Inlay Road Border */}
        <mesh position={[-12, 1.48, 0]} material={goldMat}>
          <boxGeometry args={[0.5, 0.08, 18]} />
        </mesh>
        <mesh position={[12, 1.48, 0]} material={goldMat}>
          <boxGeometry args={[0.5, 0.08, 18]} />
        </mesh>
      </group>

      {/* 2. Left Pylon Colonnade (4 Monumental Fluted Columns) */}
      <group position={[-17, 1.5, 0]}>
        <FlutedColumn position={[-5.5, 0, -4.5]} height={23} radius={0.88} marbleMat={marbleMat} goldMat={goldMat} />
        <FlutedColumn position={[-5.5, 0, 4.5]} height={23} radius={0.88} marbleMat={marbleMat} goldMat={goldMat} />
        <FlutedColumn position={[4.5, 0, -4.5]} height={23} radius={0.95} marbleMat={marbleMat} goldMat={goldMat} />
        <FlutedColumn position={[4.5, 0, 4.5]} height={23} radius={0.95} marbleMat={marbleMat} goldMat={goldMat} />

        {/* Pylon Solid Core Wall */}
        <mesh position={[-0.5, 12, 0]} material={marbleMat} castShadow receiveShadow>
          <boxGeometry args={[7.5, 21, 6.5]} />
        </mesh>
        {/* Golden Greek Medallion on Left Pylon */}
        <mesh position={[3.3, 15, 0]} rotation={[0, Math.PI / 2, 0]} material={goldMat}>
          <cylinderGeometry args={[1.8, 1.8, 0.3, 24]} />
        </mesh>
      </group>

      {/* 3. Right Pylon Colonnade (4 Monumental Fluted Columns) */}
      <group position={[17, 1.5, 0]}>
        <FlutedColumn position={[-4.5, 0, -4.5]} height={23} radius={0.95} marbleMat={marbleMat} goldMat={goldMat} />
        <FlutedColumn position={[-4.5, 0, 4.5]} height={23} radius={0.95} marbleMat={marbleMat} goldMat={goldMat} />
        <FlutedColumn position={[5.5, 0, -4.5]} height={23} radius={0.88} marbleMat={marbleMat} goldMat={goldMat} />
        <FlutedColumn position={[5.5, 0, 4.5]} height={23} radius={0.88} marbleMat={marbleMat} goldMat={goldMat} />

        {/* Pylon Solid Core Wall */}
        <mesh position={[0.5, 12, 0]} material={marbleMat} castShadow receiveShadow>
          <boxGeometry args={[7.5, 21, 6.5]} />
        </mesh>
        {/* Golden Greek Medallion on Right Pylon */}
        <mesh position={[-3.3, 15, 0]} rotation={[0, -Math.PI / 2, 0]} material={goldMat}>
          <cylinderGeometry args={[1.8, 1.8, 0.3, 24]} />
        </mesh>
      </group>

      {/* 4. Grand Entablature & Gilded Meander Frieze */}
      <group position={[0, 26.5, 0]}>
        {/* Architrave Beam */}
        <mesh position={[0, 0, 0]} material={marbleMat} castShadow receiveShadow>
          <boxGeometry args={[56, 1.8, 11]} />
        </mesh>
        {/* Gilded Greek Key Meander Frieze Band */}
        <mesh position={[0, 1.4, 0]} material={meanderMat} castShadow>
          <boxGeometry args={[55, 1.4, 10.6]} />
        </mesh>
        {/* Dentil & Cornice Overhang */}
        <mesh position={[0, 2.5, 0]} material={goldMat} castShadow>
          <boxGeometry args={[57, 0.8, 11.8]} />
        </mesh>
      </group>

      {/* 5. Classical Triangular Pediment (Tympanum) */}
      <group position={[0, 32.5, 0]}>
        <mesh geometry={pedimentGeo} material={marbleMat} castShadow receiveShadow />

        {/* Golden Apollo Sunburst Sigil inside the Tympanum */}
        <group position={[0, -0.6, 2.2]}>
          <mesh material={goldMat}>
            <circleGeometry args={[2.5, 32]} />
          </mesh>
          {/* Radiating Sun Rays */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            return (
              <mesh
                key={i}
                position={[Math.cos(angle) * 3.4, Math.sin(angle) * 3.4, 0]}
                rotation={[0, 0, angle + Math.PI / 2]}
                material={goldMat}
              >
                <coneGeometry args={[0.3, 1.6, 4]} />
              </mesh>
            );
          })}
        </group>

        {/* Central Acroterion Ornament at the Pediment Apex */}
        <mesh position={[0, 4.4, 0]} material={goldMat} castShadow>
          <coneGeometry args={[1.2, 2.6, 6]} />
        </mesh>
        {/* Left and Right Corner Acroteria */}
        <mesh position={[-26.5, -3.2, 0]} material={goldMat} castShadow>
          <coneGeometry args={[0.9, 2.0, 5]} />
        </mesh>
        <mesh position={[26.5, -3.2, 0]} material={goldMat} castShadow>
          <coneGeometry args={[0.9, 2.0, 5]} />
        </mesh>
      </group>

      {/* 6. Monumental Golden Gates of Olympus (Swung Wide Open to Welcome the Hero) */}
      <group position={[0, 1.5, 0]}>
        {/* Left Golden Gate Leaf (Swung inward open at 65 degrees) */}
        <group position={[-11.5, 0, 0]} rotation={[0, -1.15, 0]}>
          {/* Main Bronze Gate Frame */}
          <mesh position={[5.0, 11, 0]} material={goldMat} castShadow>
            <boxGeometry args={[10, 22, 0.6]} />
          </mesh>
          {/* Classical Open Filigree Bars */}
          {[...Array(8)].map((_, i) => (
            <mesh key={`l-bar-${i}`} position={[1.5 + i * 1.1, 11, 0]} material={goldMat}>
              <cylinderGeometry args={[0.08, 0.08, 21.5, 8]} />
            </mesh>
          ))}
          {/* Golden Greek Lion / Rosette Medallion */}
          <mesh position={[5.0, 11, 0.4]} material={goldMat}>
            <cylinderGeometry args={[1.6, 1.6, 0.4, 20]} />
          </mesh>
          {/* Golden Spearhead Finials atop Gate */}
          {[...Array(7)].map((_, i) => (
            <mesh key={`l-spear-${i}`} position={[1.5 + i * 1.3, 22.4, 0]} material={goldMat}>
              <coneGeometry args={[0.25, 1.2, 4]} />
            </mesh>
          ))}
        </group>

        {/* Right Golden Gate Leaf (Swung inward open at -65 degrees) */}
        <group position={[11.5, 0, 0]} rotation={[0, 1.15, 0]}>
          {/* Main Bronze Gate Frame */}
          <mesh position={[-5.0, 11, 0]} material={goldMat} castShadow>
            <boxGeometry args={[10, 22, 0.6]} />
          </mesh>
          {/* Classical Open Filigree Bars */}
          {[...Array(8)].map((_, i) => (
            <mesh key={`r-bar-${i}`} position={[-1.5 - i * 1.1, 11, 0]} material={goldMat}>
              <cylinderGeometry args={[0.08, 0.08, 21.5, 8]} />
            </mesh>
          ))}
          {/* Golden Greek Lion / Rosette Medallion */}
          <mesh position={[-5.0, 11, 0.4]} material={goldMat}>
            <cylinderGeometry args={[1.6, 1.6, 0.4, 20]} />
          </mesh>
          {/* Golden Spearhead Finials atop Gate */}
          {[...Array(7)].map((_, i) => (
            <mesh key={`r-spear-${i}`} position={[-1.5 - i * 1.3, 22.4, 0]} material={goldMat}>
              <coneGeometry args={[0.25, 1.2, 4]} />
            </mesh>
          ))}
        </group>
      </group>

      {/* 7. Twin Eternal Sacred Flame Braziers */}
      {/* Left Brazier */}
      <group position={[-13.5, 1.5, 8]}>
        {/* Marble Pedestal */}
        <mesh position={[0, 3.2, 0]} material={marbleMat} castShadow receiveShadow>
          <cylinderGeometry args={[1.5, 1.8, 6.4, 16]} />
        </mesh>
        {/* Bronze Tripod Bowl */}
        <mesh position={[0, 7.0, 0]} material={darkBronzeMat} castShadow>
          <cylinderGeometry args={[2.0, 0.9, 1.2, 16]} />
        </mesh>
        {/* Glowing Sacred Flame */}
        <mesh ref={leftFlameRef} position={[0, 8.2, 0]}>
          <coneGeometry args={[0.9, 2.4, 8]} />
          <meshBasicMaterial color="#FDE047" transparent opacity={0.92} />
        </mesh>
        {/* Dynamic Warm Flame Light */}
        <pointLight
          ref={leftLightRef}
          position={[0, 8.5, 0]}
          color="#E59E26"
          intensity={15}
          distance={20}
          decay={2}
        />
      </group>

      {/* Right Brazier */}
      <group position={[13.5, 1.5, 8]}>
        {/* Marble Pedestal */}
        <mesh position={[0, 3.2, 0]} material={marbleMat} castShadow receiveShadow>
          <cylinderGeometry args={[1.5, 1.8, 6.4, 16]} />
        </mesh>
        {/* Bronze Tripod Bowl */}
        <mesh position={[0, 7.0, 0]} material={darkBronzeMat} castShadow>
          <cylinderGeometry args={[2.0, 0.9, 1.2, 16]} />
        </mesh>
        {/* Glowing Sacred Flame */}
        <mesh ref={rightFlameRef} position={[0, 8.2, 0]}>
          <coneGeometry args={[0.9, 2.4, 8]} />
          <meshBasicMaterial color="#FDE047" transparent opacity={0.92} />
        </mesh>
        {/* Dynamic Warm Flame Light */}
        <pointLight
          ref={rightLightRef}
          position={[0, 8.5, 0]}
          color="#E59E26"
          intensity={15}
          distance={20}
          decay={2}
        />
      </group>
    </group>
  );
}
