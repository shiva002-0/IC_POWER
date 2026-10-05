import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createRockTexture,
  createMarbleTexture,
  createGoldLeafTexture,
  createWaterfallTexture
} from '../../utils/proceduralTextures';

/**
 * GREEK MYTHOLOGY FLOATING ISLANDS
 * Authentic celestial islands floating around Mount Olympus:
 * 1. Tholos Sanctuary of Zephyrus (Circular Monopteros Temple)
 * 2. Cascade of the Naiads (Cascading Waterfall falling into clouds)
 * 3. High Altar of Apollo (Colonnade & Eternal Brazier)
 * 4. Terrace of the Muses (Ruined Doric porticos & ancient olive grove)
 * 5. Outpost of Hermes (Guardian watchtower terrace overlooking the Aegean Gateway)
 */

// Procedural Cypress Tree for Greek islands
function GreekCypress({ position, scale = 1 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Dark trunk */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.22, 2.4, 6]} />
        <meshStandardMaterial color="#271F18" roughness={0.9} />
      </mesh>
      {/* Tiered conical dense foliage */}
      <mesh position={[0, 3.2, 0]} castShadow>
        <coneGeometry args={[0.9, 3.4, 8]} />
        <meshStandardMaterial color="#1B382B" roughness={0.75} />
      </mesh>
      <mesh position={[0, 5.0, 0]} castShadow>
        <coneGeometry args={[0.75, 3.0, 8]} />
        <meshStandardMaterial color="#234E3C" roughness={0.7} />
      </mesh>
      <mesh position={[0, 6.5, 0]} castShadow>
        <coneGeometry args={[0.5, 2.4, 7]} />
        <meshStandardMaterial color="#2D5A47" roughness={0.65} />
      </mesh>
    </group>
  );
}

// Procedural Ancient Olive Tree
function GreekOliveTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Gnarled twisting trunk */}
      <mesh position={[0, 1.4, 0]} rotation={[0.1, 0.3, -0.1]} castShadow>
        <cylinderGeometry args={[0.3, 0.5, 2.8, 6]} />
        <meshStandardMaterial color="#3E342B" roughness={0.95} />
      </mesh>
      {/* Branch clusters */}
      <mesh position={[-0.8, 3.0, 0.4]} scale={[1.4, 1.0, 1.3]} castShadow>
        <dodecahedronGeometry args={[1.3, 1]} />
        <meshStandardMaterial color="#4A6B53" roughness={0.8} />
      </mesh>
      <mesh position={[0.9, 3.3, -0.3]} scale={[1.5, 1.1, 1.4]} castShadow>
        <dodecahedronGeometry args={[1.4, 1]} />
        <meshStandardMaterial color="#55755E" roughness={0.8} />
      </mesh>
      <mesh position={[0, 4.2, 0.2]} scale={[1.3, 1.0, 1.3]} castShadow>
        <dodecahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial color="#60836A" roughness={0.75} />
      </mesh>
    </group>
  );
}

// Hanging ivy/vines dangling over the cliff edge
function HangingVines({ position, length = 6, count = 5 }) {
  const vineLines = useMemo(() => {
    const list = [];
    for (let i = 0; i < count; i++) {
      const ox = (i - (count - 1) / 2) * 0.8;
      const oz = Math.sin(i * 2.7) * 0.25;
      const h = length * (0.65 + (Math.sin(i * 4.3) * 0.5 + 0.5) * 0.35);
      list.push({ ox, oz, h });
    }
    return list;
  }, [count, length]);

  return (
    <group position={position}>
      {vineLines.map((v, i) => (
        <mesh key={i} position={[v.ox, -v.h / 2, v.oz]}>
          <cylinderGeometry args={[0.04, 0.08, v.h, 4]} />
          <meshStandardMaterial color="#1E382B" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// Reusable Inverted Mountain Crag Base Geometry for a floating island
function IslandCragMesh({ radius = 12, depth = 16, rockTexture, marbleTexture }) {
  const cragGeo = useMemo(() => {
    const geo = new THREE.ConeGeometry(radius, depth, 24, 16);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Invert so the point is at the bottom (-Y) and flat plateau is on top (+Y)
      // Cone default is peak at +Y/2, base at -Y/2
      // We flip Y:
      const invY = -y;
      pos.setY(i, invY);

      // Add jagged rock crag displacement
      const angle = Math.atan2(z, x);
      const r = Math.sqrt(x * x + z * z);
      const cragFactor = (invY + depth / 2) / depth; // 0 at bottom tip, 1 at top rim
      const disp = Math.sin(angle * 5.0 + y * 0.8) * 1.6 + Math.cos(angle * 3.0) * 1.2;
      const newR = Math.max(0.2, r + disp * (0.2 + cragFactor * 0.8));
      pos.setX(i, Math.cos(angle) * newR);
      pos.setZ(i, Math.sin(angle) * newR);
    }
    geo.computeVertexNormals();
    return geo;
  }, [radius, depth]);

  return (
    <group>
      {/* Inverted Rock Crag Core */}
      <mesh geometry={cragGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={rockTexture}
          color="#223040"
          roughness={0.9}
          metalness={0.12}
          flatShading
        />
      </mesh>

      {/* Lush Green/Moss Plateau Cap */}
      <mesh position={[0, depth / 2 + 0.15, 0]} receiveShadow>
        <cylinderGeometry args={[radius * 0.98, radius * 1.02, 0.7, 32]} />
        <meshStandardMaterial
          color="#264A38"
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>

      {/* Pentelic White Marble Balustrade Rim */}
      <mesh position={[0, depth / 2 + 0.6, 0]} receiveShadow>
        <torusGeometry args={[radius * 0.96, 0.28, 12, 48]} />
        <meshStandardMaterial
          map={marbleTexture}
          color="#F8FAFC"
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

export default function GreekFloatingIslands() {
  const island1Ref = useRef(null);
  const island2Ref = useRef(null);
  const island3Ref = useRef(null);
  const island4Ref = useRef(null);
  const island5Ref = useRef(null);
  const waterfallMeshRef = useRef(null);
  const brazierFlameRef = useRef(null);

  const rockTex = useMemo(() => createRockTexture(512), []);
  const marbleTex = useMemo(() => createMarbleTexture(512), []);
  const goldTex = useMemo(() => createGoldLeafTexture(256), []);
  const waterfallTex = useMemo(() => createWaterfallTexture(256, 512), []);

  const marbleMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: marbleTex,
      color: '#FFFFFF',
      roughness: 0.28,
      metalness: 0.15
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

  // Frame animation: harmonic gentle levitation and active flowing waterfall UV scroll
  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;

    // Slow tectonic levitation drift communicating colossal geological mass
    if (island1Ref.current) {
      island1Ref.current.position.y = 54 + Math.sin(t * 0.08) * 0.28;
      island1Ref.current.rotation.z = Math.sin(t * 0.05) * 0.008;
    }

    if (island2Ref.current) {
      island2Ref.current.position.y = 62 + Math.sin(t * 0.07 + 1.2) * 0.32;
      island2Ref.current.rotation.x = Math.cos(t * 0.06 + 0.5) * 0.008;
    }

    if (island3Ref.current) {
      island3Ref.current.position.y = 78 + Math.sin(t * 0.06 + 2.4) * 0.35;
      island3Ref.current.rotation.z = Math.cos(t * 0.05) * 0.008;
    }

    if (island4Ref.current) {
      island4Ref.current.position.y = 73 + Math.sin(t * 0.07 + 3.8) * 0.26;
      island4Ref.current.rotation.y = Math.sin(t * 0.04) * 0.008;
    }

    if (island5Ref.current) {
      island5Ref.current.position.y = 42 + Math.sin(t * 0.09 + 4.5) * 0.24;
      island5Ref.current.rotation.x = Math.sin(t * 0.05) * 0.006;
    }

    // Scroll waterfall texture downwards via mesh material reference
    if (waterfallMeshRef.current?.material?.map) {
      waterfallMeshRef.current.material.map.offset.y -= delta * 0.9;
    }

    // Flickering eternal flame on Island 3 brazier
    if (brazierFlameRef.current) {
      const f = 1.0 + Math.sin(t * 10) * 0.15;
      brazierFlameRef.current.scale.set(f, f * 1.3, f);
    }
  });

  return (
    <group>
      {/* ============================================================== */}
      {/* ISLAND 1: THE SANCTUARY OF ZEPHYRUS (West - [ -62, 54, -28 ]) */}
      {/* Features: Circular Tholos Temple with 6 fluted columns & gold dome */}
      {/* ============================================================== */}
      <group ref={island1Ref} position={[-62, 54, -28]}>
        <IslandCragMesh radius={14} depth={18} rockTexture={rockTex} marbleTexture={marbleTex} />
        <HangingVines position={[-8, 9, 6]} length={9} count={6} />
        <HangingVines position={[7, 9, -7]} length={8} count={5} />

        {/* Circular Tholos (Monopteros) Temple */}
        <group position={[0, 9.5, 0]}>
          {/* Stepped Circular Marble Plinth */}
          <mesh position={[0, 0.4, 0]} material={marbleMat} receiveShadow>
            <cylinderGeometry args={[6.8, 7.5, 0.8, 32]} />
          </mesh>
          <mesh position={[0, 1.0, 0]} material={marbleMat} receiveShadow>
            <cylinderGeometry args={[5.8, 6.5, 0.6, 32]} />
          </mesh>

          {/* 6 Circular Fluted Marble Columns */}
          {[...Array(6)].map((_, i) => {
            const angle = (i * 60 * Math.PI) / 180;
            const cx = Math.cos(angle) * 4.6;
            const cz = Math.sin(angle) * 4.6;
            return (
              <group key={i} position={[cx, 1.3, cz]}>
                <mesh position={[0, 3.2, 0]} material={marbleMat} castShadow>
                  <cylinderGeometry args={[0.34, 0.38, 6.4, 16]} />
                </mesh>
                <mesh position={[0, 6.6, 0]} material={goldMat}>
                  <cylinderGeometry args={[0.55, 0.42, 0.45, 16]} />
                </mesh>
              </group>
            );
          })}

          {/* Circular Marble Architrave Ring */}
          <mesh position={[0, 8.2, 0]} material={marbleMat} castShadow>
            <cylinderGeometry args={[5.2, 5.0, 0.8, 32]} />
          </mesh>

          {/* Golden Hemispherical Dome Cupola */}
          <mesh position={[0, 10.2, 0]} material={goldMat} castShadow>
            <sphereGeometry args={[4.8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          {/* Golden Finial on Dome Peak */}
          <mesh position={[0, 15.2, 0]} material={goldMat}>
            <sphereGeometry args={[0.65, 16, 12]} />
          </mesh>

          {/* Golden Central Altar / Tripod */}
          <mesh position={[0, 2.2, 0]} material={goldMat}>
            <cylinderGeometry args={[0.9, 0.6, 1.8, 16]} />
          </mesh>
        </group>

        {/* Flanking Olympian Cypress trees */}
        <GreekCypress position={[-8.5, 9.5, -4]} scale={1.2} />
        <GreekCypress position={[-9.8, 9.5, 1.5]} scale={0.9} />
        <GreekCypress position={[8.5, 9.5, 5]} scale={1.1} />
      </group>

      {/* ============================================================== */}
      {/* ISLAND 2: THE CASCADE OF THE NAIADS (East - [ 68, 62, -40 ]) */}
      {/* Features: Majestic Cascading Waterfall pouring into the clouds */}
      {/* ============================================================== */}
      <group ref={island2Ref} position={[68, 62, -40]}>
        <IslandCragMesh radius={15} depth={20} rockTexture={rockTex} marbleTexture={marbleTex} />
        <HangingVines position={[9, 10, 3]} length={10} count={7} />

        {/* Sacred Spring Water Pool on the Island Plateau */}
        <mesh position={[-2, 10.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[5.5, 24]} />
          <meshStandardMaterial
            color="#22D3EE"
            roughness={0.1}
            metalness={0.8}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* CASCADING WATERFALL pouring off the Western edge towards Olympus */}
        <group position={[-14.2, 6.0, 0]} rotation={[0, 0, -0.15]}>
          {/* Vertical flowing water curtain */}
          <mesh ref={waterfallMeshRef}>
            <planeGeometry args={[7.5, 24, 1, 1]} />
            <meshStandardMaterial
              map={waterfallTex}
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
              roughness={0.15}
            />
          </mesh>
          {/* Foaming Water Spray Mesh at Waterfall Base */}
          <mesh position={[0, -12, 0]}>
            <planeGeometry args={[11, 4]} />
            <meshBasicMaterial
              color="#FFFFFF"
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* Marble Gateway Ruin overlooking the Spring */}
        <group position={[3.5, 10.3, 0]}>
          <mesh position={[-2.5, 3.2, 0]} material={marbleMat} castShadow>
            <cylinderGeometry args={[0.42, 0.48, 6.4, 16]} />
          </mesh>
          <mesh position={[2.5, 3.2, 0]} material={marbleMat} castShadow>
            <cylinderGeometry args={[0.42, 0.48, 6.4, 16]} />
          </mesh>
          {/* Architrave Ruin Beam */}
          <mesh position={[0, 6.8, 0]} material={marbleMat} castShadow>
            <boxGeometry args={[7.2, 0.9, 1.4]} />
          </mesh>
        </group>

        {/* Ancient Greek Olive Tree by the pool */}
        <GreekOliveTree position={[6.5, 10.4, -4]} scale={1.3} />
        <GreekCypress position={[7.8, 10.4, 5.5]} scale={1.2} />
      </group>

      {/* ============================================================== */}
      {/* ISLAND 3: HIGH ALTAR OF APOLLO (Northwest - [ -52, 78, -88 ]) */}
      {/* Features: Classical Marble Colonnade, Golden Meander & Eternal Brazier */}
      {/* ============================================================== */}
      <group ref={island3Ref} position={[-52, 78, -88]}>
        <IslandCragMesh radius={13} depth={17} rockTexture={rockTex} marbleTexture={marbleTex} />
        <HangingVines position={[0, 8.5, 9]} length={8} count={5} />

        {/* Monumental Rectangular Colonnade */}
        <group position={[0, 8.8, 0]}>
          {/* Stepped Pentelic Marble Stylobate */}
          <mesh position={[0, 0.5, 0]} material={marbleMat} receiveShadow>
            <boxGeometry args={[16, 0.8, 11]} />
          </mesh>
          {/* Golden Meander Tile Inlay */}
          <mesh position={[0, 0.92, 0]} material={goldMat} receiveShadow>
            <boxGeometry args={[14, 0.05, 9]} />
          </mesh>

          {/* 6 Front & Rear Fluted Columns */}
          {[-5.5, 0, 5.5].map((x, i) => (
            <group key={`front-col-${i}`}>
              <mesh position={[x, 4.0, 3.6]} material={marbleMat} castShadow>
                <cylinderGeometry args={[0.38, 0.42, 6.8, 16]} />
              </mesh>
              <mesh position={[x, 4.0, -3.6]} material={marbleMat} castShadow>
                <cylinderGeometry args={[0.38, 0.42, 6.8, 16]} />
              </mesh>
            </group>
          ))}

          {/* Entablature Roof Beam */}
          <mesh position={[0, 7.8, 0]} material={marbleMat} castShadow>
            <boxGeometry args={[16.5, 0.9, 11.5]} />
          </mesh>
          {/* Triangular Pediment atop Front */}
          <mesh position={[0, 9.2, 4.8]} rotation={[0, 0, 0]} material={marbleMat} castShadow>
            <coneGeometry args={[4.2, 1.8, 3]} />
          </mesh>

          {/* Central Bronze Tripod Brazier with Eternal Flame */}
          <group position={[0, 1.0, 0]}>
            <mesh position={[0, 1.2, 0]} material={goldMat} castShadow>
              <cylinderGeometry args={[1.4, 0.8, 1.6, 16]} />
            </mesh>
            <mesh ref={brazierFlameRef} position={[0, 2.4, 0]}>
              <coneGeometry args={[0.7, 1.8, 8]} />
              <meshBasicMaterial color="#FDE047" transparent opacity={0.9} />
            </mesh>
            <pointLight position={[0, 2.5, 0]} color="#F59E0B" intensity={28} distance={22} />
          </group>
        </group>

        {/* Cypress Trees */}
        <GreekCypress position={[-7.5, 8.8, -3.5]} scale={1.1} />
        <GreekCypress position={[7.5, 8.8, -3.5]} scale={1.1} />
      </group>

      {/* ============================================================== */}
      {/* ISLAND 4: TERRACE OF THE MUSES (Northeast - [ 56, 73, -82 ]) */}
      {/* Features: Ruined Doric Porticos & Ancient Olive Trees */}
      {/* ============================================================== */}
      <group ref={island4Ref} position={[56, 73, -82]}>
        <IslandCragMesh radius={14} depth={18} rockTexture={rockTex} marbleTexture={marbleTex} />
        <HangingVines position={[-6, 9, 8]} length={9} count={6} />

        {/* Ruined Classical Doric Portico */}
        <group position={[-2, 9.2, -1]}>
          <mesh position={[-3.5, 3.4, 0]} material={marbleMat} castShadow>
            <cylinderGeometry args={[0.42, 0.46, 6.8, 16]} />
          </mesh>
          <mesh position={[0, 3.4, 0]} material={marbleMat} castShadow>
            <cylinderGeometry args={[0.42, 0.46, 6.8, 16]} />
          </mesh>
          <mesh position={[3.5, 3.4, 0]} material={marbleMat} castShadow>
            <cylinderGeometry args={[0.42, 0.46, 6.8, 16]} />
          </mesh>
          {/* Tilting Broken Entablature Block */}
          <mesh position={[0, 7.2, 0]} rotation={[0.05, 0, -0.08]} material={marbleMat} castShadow>
            <boxGeometry args={[9.5, 0.9, 1.6]} />
          </mesh>
        </group>

        {/* Ancient Olive Trees and Cypress */}
        <GreekOliveTree position={[5.5, 9.2, 2.5]} scale={1.4} />
        <GreekCypress position={[-7.5, 9.2, -4.5]} scale={1.3} />
        <GreekCypress position={[-8.8, 9.2, 2]} scale={1.0} />

        {/* Classical Marble Offering Urns */}
        <mesh position={[2, 9.8, 4.5]} material={marbleMat} castShadow>
          <cylinderGeometry args={[0.6, 0.35, 1.4, 12]} />
        </mesh>
        <mesh position={[-4, 9.8, 4.5]} material={marbleMat} castShadow>
          <cylinderGeometry args={[0.6, 0.35, 1.4, 12]} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* ISLAND 5: OUTPOST OF HERMES (South - [ -40, 42, 25 ]) */}
      {/* Features: Overlooking the Greek Gateway and ocean ascent path */}
      {/* ============================================================== */}
      <group ref={island5Ref} position={[-40, 42, 25]}>
        <IslandCragMesh radius={12} depth={15} rockTexture={rockTex} marbleTexture={marbleTex} />
        <HangingVines position={[5, 7.5, 5]} length={8} count={5} />

        {/* Lookout Platform with Fluted Columns and Golden Beacon */}
        <group position={[0, 7.8, 0]}>
          <mesh position={[0, 0.4, 0]} material={marbleMat} receiveShadow>
            <cylinderGeometry args={[6.5, 7.2, 0.7, 24]} />
          </mesh>

          {/* 4 Corner Watch Columns */}
          {[
            [-3.5, -3.5],
            [-3.5, 3.5],
            [3.5, -3.5],
            [3.5, 3.5]
          ].map(([x, z], i) => (
            <mesh key={i} position={[x, 3.0, z]} material={marbleMat} castShadow>
              <cylinderGeometry args={[0.32, 0.38, 5.2, 16]} />
            </mesh>
          ))}

          {/* Central Hermes Golden Beacon Orb */}
          <group position={[0, 1.2, 0]}>
            <mesh position={[0, 1.2, 0]} material={marbleMat}>
              <cylinderGeometry args={[1.0, 1.2, 2.0, 16]} />
            </mesh>
            <mesh position={[0, 2.8, 0]} material={goldMat}>
              <sphereGeometry args={[0.9, 20, 16]} />
            </mesh>
            <pointLight position={[0, 3.2, 0]} color="#FDE047" intensity={18} distance={16} />
          </group>
        </group>

        {/* Cypress Tree Pair */}
        <GreekCypress position={[-5.5, 7.8, -2.5]} scale={1.1} />
        <GreekCypress position={[-6.8, 7.8, 1.5]} scale={0.85} />
      </group>
    </group>
  );
}
