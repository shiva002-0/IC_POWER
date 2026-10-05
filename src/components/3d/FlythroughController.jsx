import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { OLYMPUS_CONFIG, VIEWPOINTS } from '../../config/olympusConfig';

const VIEWPOINT_CONFIGS = {
  sanctuary: {
    pos: [0, 97.5, -45],
    target: [0, 95.0, -68],
    fov: 48
  },
  serpent: {
    pos: [-58, 106, -34],
    target: [-26, 104, -54],
    fov: 52
  },
  ocean: {
    pos: [0, 8, 135],
    target: [0, 52, -40],
    fov: 52
  },
  panorama: {
    pos: [78, 65, 85],
    target: [0, 48, -45],
    fov: 50
  }
};

export default function FlythroughController({
  onComplete,
  activeView = VIEWPOINTS.FLYTHROUGH,
  freeControlsEnabled = true,
  isReplaying = false
}) {
  const { camera } = useThree();
  const timelineRef = useRef(null);
  const controlsRef = useRef(null);

  const animProgress = useRef({ t: 0 });
  const [isDone, setIsDone] = useState(false);

  // 1. Build CatmullRomCurve3 for cinematic flythrough
  const { pathCurve, targetCurve } = useMemo(() => {
    const posVectors = OLYMPUS_CONFIG.flythrough.positionWaypoints.map(
      (p) => new THREE.Vector3(p[0], p[1], p[2])
    );
    const targetVectors = OLYMPUS_CONFIG.flythrough.targetWaypoints.map(
      (t) => new THREE.Vector3(t[0], t[1], t[2])
    );

    const path = new THREE.CatmullRomCurve3(posVectors, false, 'centripetal', 0.5);
    const target = new THREE.CatmullRomCurve3(targetVectors, false, 'centripetal', 0.5);

    return { pathCurve: path, targetCurve: target };
  }, []);

  // 2. Animate Viewpoints or Flythrough
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    if (activeView === VIEWPOINTS.FLYTHROUGH) {
      animProgress.current.t = 0;

      const initialPos = pathCurve.getPointAt(0);
      const initialTarget = targetCurve.getPointAt(0);
      camera.position.copy(initialPos);
      camera.lookAt(initialTarget);
      camera.fov = OLYMPUS_CONFIG.flythrough.baseFOV;
      camera.updateProjectionMatrix();

      const tl = gsap.timeline({
        delay: 0.1,
        onStart: () => {
          setIsDone(false);
        },
        onComplete: () => {
          setIsDone(true);
          if (controlsRef.current) {
            const [, py, pz] = OLYMPUS_CONFIG.world.sanctuaryPlatform;
            controlsRef.current.target.set(0, py + 1.5, pz);
            controlsRef.current.update();
          }
          if (onComplete) onComplete();
        }
      });

      tl.to(animProgress.current, {
        t: 1,
        duration: OLYMPUS_CONFIG.flythrough.duration,
        ease: OLYMPUS_CONFIG.flythrough.ease
      });

      timelineRef.current = tl;
    } else if (VIEWPOINT_CONFIGS[activeView]) {
      setIsDone(true);
      const vp = VIEWPOINT_CONFIGS[activeView];

      const tl = gsap.timeline();
      const currentTarget = controlsRef.current ? controlsRef.current.target : new THREE.Vector3(0, 95, -68);

      tl.to(camera.position, {
        x: vp.pos[0],
        y: vp.pos[1],
        z: vp.pos[2],
        duration: 1.8,
        ease: "power2.inOut"
      }, 0);

      tl.to(currentTarget, {
        x: vp.target[0],
        y: vp.target[1],
        z: vp.target[2],
        duration: 1.8,
        ease: "power2.inOut",
        onUpdate: () => {
          if (controlsRef.current) {
            controlsRef.current.update();
          }
        }
      }, 0);

      tl.to(camera, {
        fov: vp.fov,
        duration: 1.8,
        ease: "power2.inOut",
        onUpdate: () => camera.updateProjectionMatrix()
      }, 0);

      timelineRef.current = tl;
    }

    return () => {
      if (timelineRef.current) timelineRef.current.kill();
    };
  }, [activeView, isReplaying, camera, pathCurve, targetCurve, onComplete]);

  // Reusable vectors for zero per-frame allocation
  const tmpPoint = useMemo(() => new THREE.Vector3(), []);
  const tmpTarget = useMemo(() => new THREE.Vector3(), []);

  // Frame update for active flythrough path
  useFrame(() => {
    if (activeView === VIEWPOINTS.FLYTHROUGH && animProgress.current.t < 1) {
      const t = animProgress.current.t;
      pathCurve.getPointAt(t, tmpPoint);
      targetCurve.getPointAt(t, tmpTarget);

      const fovElevation = Math.sin(t * Math.PI) * (OLYMPUS_CONFIG.flythrough.maxFOV - OLYMPUS_CONFIG.flythrough.baseFOV);
      camera.fov = OLYMPUS_CONFIG.flythrough.baseFOV + fovElevation;
      camera.updateProjectionMatrix();

      camera.position.copy(tmpPoint);
      camera.lookAt(tmpTarget);
    }
  });

  const [, py, pz] = OLYMPUS_CONFIG.world.sanctuaryPlatform;

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={isDone && freeControlsEnabled}
      enableDamping={true}
      dampingFactor={0.06}
      rotateSpeed={0.7}
      zoomSpeed={0.85}
      panSpeed={0.6}
      minDistance={8}
      maxDistance={320}
      maxPolarAngle={Math.PI / 2 - 0.02}
      minPolarAngle={0.08}
      target={[0, py + 1.5, pz]}
    />
  );
}
