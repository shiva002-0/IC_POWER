import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Performance Monitor
 * Continuously measures real-time FPS, draw calls, triangles, and memory
 * from WebGLRenderer.info without allocating per-frame objects.
 */
export default function PerformanceMonitor({ onStatsUpdate }) {
  const frameCount = useRef(0);
  const lastTime = useRef(0);
  const fpsRef = useRef(60);

  useFrame(({ gl }) => {
    frameCount.current += 1;
    const now = performance.now();
    const elapsed = now - lastTime.current;

    // Sample every 500ms for stable readings
    if (elapsed >= 500) {
      fpsRef.current = Math.round((frameCount.current * 1000) / elapsed);
      frameCount.current = 0;
      lastTime.current = now;

      if (onStatsUpdate) {
        onStatsUpdate({
          fps: fpsRef.current,
          drawCalls: gl.info.render.calls,
          triangles: gl.info.render.triangles,
          geometries: gl.info.memory.geometries,
          textures: gl.info.memory.textures
        });
      }
    }
  });

  return null;
}
