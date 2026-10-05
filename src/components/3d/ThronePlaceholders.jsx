import React, { useState, useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { OLYMPUS_CONFIG } from '../../config/olympusConfig';
import { soundFX } from '../../utils/audio';
import { createMarbleTexture } from '../../utils/proceduralTextures';

// Classical Antique Bronze / Marble Bas-Relief Medallion embedded in backrest
function DeityMedallion({ god, hovered }) {
  return (
    <group position={[0, 2.2, -0.6]}>
      {/* Recessed Circular Bronze Frame */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.58, 0.08, 24]} />
        <meshStandardMaterial
          color={hovered ? '#D97706' : '#785A32'}
          roughness={0.45}
          metalness={0.75}
        />
      </mesh>

      {/* Deity Emblem Attribute */}
      {god === 'Zeus' && (
        // Thunderbolt Relief
        <mesh position={[0, 0, 0.06]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[0.12, 0.75, 0.04]} />
          <meshStandardMaterial
            color={hovered ? '#FDE047' : '#B8821C'}
            roughness={0.35}
            metalness={0.8}
          />
        </mesh>
      )}

      {god === 'Apollo' && (
        // Solar Wreath Relief
        <mesh position={[0, 0, 0.06]}>
          <torusGeometry args={[0.3, 0.05, 8, 20]} />
          <meshStandardMaterial
            color={hovered ? '#FDE047' : '#B8821C'}
            roughness={0.35}
            metalness={0.8}
          />
        </mesh>
      )}

      {god === 'Athena' && (
        // Aegis Crest Relief
        <mesh position={[0, 0, 0.06]}>
          <cylinderGeometry args={[0.22, 0.32, 0.04, 16]} />
          <meshStandardMaterial
            color={hovered ? '#E2E8F0' : '#8A99A8'}
            roughness={0.35}
            metalness={0.8}
          />
        </mesh>
      )}

      {god === 'Hermes' && (
        // Caduceus Winged Relief
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[0.6, 0.12, 0.04]} />
          <meshStandardMaterial
            color={hovered ? '#A7F3D0' : '#4B7B68'}
            roughness={0.4}
            metalness={0.7}
          />
        </mesh>
      )}

      {god === 'Poseidon' && (
        // Trident Prong Relief
        <group position={[0, 0, 0.06]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.08, 0.65, 0.04]} />
            <meshStandardMaterial
              color={hovered ? '#93C5FD' : '#4B6B8A'}
              roughness={0.35}
              metalness={0.8}
            />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[0.42, 0.06, 0.04]} />
            <meshStandardMaterial
              color={hovered ? '#93C5FD' : '#4B6B8A'}
              roughness={0.35}
              metalness={0.8}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

// Classical Weathered Pentelic Marble Throne
function SculptedThroneItem({ throne, isFlythroughComplete }) {
  const [hovered, setHovered] = useState(false);
  const marbleTexture = useMemo(() => createMarbleTexture(256), []);

  return (
    <group position={throne.position} rotation={throne.rotation}>
      {/* 1. Marble Stepped Base Plinth */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.2, 2.5, 0.5, 24]} />
        <meshStandardMaterial
          map={marbleTexture}
          color="#D8DEE4"
          roughness={0.52}
          metalness={0.08}
        />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.8, 2.0, 0.25, 24]} />
        <meshStandardMaterial
          color="#6E5632"
          roughness={0.55}
          metalness={0.65}
        />
      </mesh>

      {/* 2. Classical Throne Seat & Scrolled Armrests */}
      <group
        position={[0, 0.7, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (isFlythroughComplete) {
            setHovered(true);
            soundFX.playChime(2, 0.12);
          }
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (isFlythroughComplete) {
            soundFX.playEnterChord();
            console.log(`Visited domain: ${throne.god}`);
          }
        }}
        className="cursor-pointer"
      >
        {/* Main Seat Box */}
        <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.45, 1.5]} />
          <meshStandardMaterial
            map={marbleTexture}
            color="#EAEFF4"
            roughness={0.42}
            metalness={0.08}
          />
        </mesh>

        {/* Regal Weathered Wool Cushion */}
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[1.6, 0.22, 1.3]} />
          <meshStandardMaterial
            color={hovered ? throne.color : '#5C2414'}
            roughness={0.78}
            metalness={0.05}
          />
        </mesh>

        {/* High Classical Curved Backrest */}
        <mesh position={[0, 2.0, -0.68]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 2.4, 0.35]} />
          <meshStandardMaterial
            map={marbleTexture}
            color="#EAEFF4"
            roughness={0.42}
            metalness={0.08}
          />
        </mesh>

        {/* Backrest Triangular Pediment Crest */}
        <mesh position={[0, 3.35, -0.68]} rotation={[0, 0, Math.PI / 4]} castShadow>
          <boxGeometry args={[1.3, 1.3, 0.32]} />
          <meshStandardMaterial
            map={marbleTexture}
            color="#D8DEE4"
            roughness={0.48}
            metalness={0.08}
          />
        </mesh>

        {/* Embedded Deity Attribute Medallion in Marble Backrest */}
        <DeityMedallion god={throne.god} hovered={hovered} />

        {/* Scrolled Left Armrest */}
        <group position={[-0.95, 1.1, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.28, 0.6, 1.5]} />
            <meshStandardMaterial map={marbleTexture} color="#EAEFF4" roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.35, 0.7]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.3, 16]} />
            <meshStandardMaterial color="#6E5632" roughness={0.5} metalness={0.65} />
          </mesh>
        </group>

        {/* Scrolled Right Armrest */}
        <group position={[0.95, 1.1, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.28, 0.6, 1.5]} />
            <meshStandardMaterial map={marbleTexture} color="#EAEFF4" roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.35, 0.7]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.3, 16]} />
            <meshStandardMaterial color="#6E5632" roughness={0.5} metalness={0.65} />
          </mesh>
        </group>
      </group>

      {/* Subtle Warm Highlight when Hovered */}
      {hovered && (
        <pointLight
          position={[0, 2.5, 0]}
          color="#FFE7BA"
          intensity={12}
          distance={8}
          decay={2}
        />
      )}

      {/* 3D HTML Tooltip on Hover */}
      {hovered && isFlythroughComplete && (
        <Html position={[0, 4.8, 0]} center distanceFactor={26} className="pointer-events-none select-none">
          <div className="flex flex-col items-center bg-[#070B16]/95 border border-amber-400/50 px-5 py-3 rounded-xl backdrop-blur-xl shadow-2xl whitespace-nowrap min-w-[210px]">
            <div className="flex items-center space-x-2 text-amber-200 font-cinzel text-xs font-bold tracking-widest uppercase mb-1">
              <span>{throne.god}</span>
              <span className="text-amber-400/80">✦</span>
              <span className="text-slate-300">{throne.title}</span>
            </div>
            <span className="font-outfit text-xs text-amber-100/90 font-medium tracking-wide">
              {throne.section}
            </span>
            <p className="font-outfit text-[11px] text-slate-400 mt-1 max-w-[190px] text-center whitespace-normal">
              {throne.description}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function ThronePlaceholders({ isFlythroughComplete }) {
  return (
    <group>
      {OLYMPUS_CONFIG.thrones.map((throne) => (
        <SculptedThroneItem
          key={throne.id}
          throne={throne}
          isFlythroughComplete={isFlythroughComplete}
        />
      ))}
    </group>
  );
}
