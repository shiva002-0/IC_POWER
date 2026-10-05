import React, { useEffect, useRef } from 'react';

/**
 * CloudCanvas Component - "Golden Night Themed Celestial Sky"
 * Renders a breathtaking mythological night sky featuring:
 * - Deep obsidian/midnight-blue gradient with warm golden celestial dawn glow
 * - Radiant Golden Nebula / Milky Way star dust lane crossing the celestial vault
 * - 160+ procedurally twinkling background micro-stars with realistic spectral physics
 * - Multi-layered volumetric night clouds with golden rims and moonlight diffusion
 * - Upward-floating golden stardust embers and cosmic particles with mouse parallax
 */
export default function CloudCanvas({ _containerRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (e) => {
      mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 1. Background Micro-Stars (180 stars across the deep sky)
    const bgStars = [];
    const bgStarCount = 180;
    for (let i = 0; i < bgStarCount; i++) {
      const isGolden = Math.random() > 0.45;
      bgStars.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.95,
        radius: 0.6 + Math.random() * 1.6,
        alphaBase: 0.25 + Math.random() * 0.65,
        twinkleSpeed: 1.5 + Math.random() * 3.5,
        phase: Math.random() * Math.PI * 2,
        color: isGolden ? '#FDE047' : Math.random() > 0.5 ? '#E0F2FE' : '#FFFBEB'
      });
    }

    // 2. Layered Volumetric Night Clouds with Golden Rims
    const layers = [
      { speed: 0.08, opacity: 0.22, blur: 55, count: 6, scale: 1.5, color: [8, 14, 28] },     // Deep midnight shadow
      { speed: 0.18, opacity: 0.38, blur: 40, count: 8, scale: 1.2, color: [16, 26, 48] },    // Slate night mist
      { speed: 0.38, opacity: 0.55, blur: 28, count: 11, scale: 0.95, color: [217, 140, 35] }, // Golden rimmed Olympian cloud
      { speed: 0.60, opacity: 0.28, blur: 22, count: 7, scale: 0.75, color: [253, 230, 138] } // Ethereal golden stardust veil
    ];

    const clouds = [];
    layers.forEach((layer, layerIdx) => {
      for (let i = 0; i < layer.count; i++) {
        clouds.push({
          x: Math.random() * (width + 600) - 300,
          y: Math.random() * (height + 200) - 100,
          radius: (150 + Math.random() * 240) * layer.scale,
          speed: layer.speed * (0.8 + Math.random() * 0.4),
          opacity: layer.opacity * (0.8 + Math.random() * 0.4),
          layerIdx,
          color: layer.color,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.006 + Math.random() * 0.01
        });
      }
    });

    // 3. Golden Stardust / Celestial Embers floating upwards
    const particles = [];
    const particleCount = 55;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 0.8 + Math.random() * 2.4,
        speedY: 0.25 + Math.random() * 0.55,
        speedX: (Math.random() - 0.5) * 0.35,
        alpha: 0.2 + Math.random() * 0.8,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.04
      });
    }

    let time = 0;

    const render = () => {
      time += 0.012;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse parallax
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      // 1. "Golden Night" Sky Gradient (Deep Indigo & Obsidian with Golden Twilight Horizon)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#02050D');     // Deepest space obsidian
      skyGrad.addColorStop(0.35, '#070D1E');  // Midnight sapphire
      skyGrad.addColorStop(0.65, '#12142E');  // Mythological Aegean twilight indigo
      skyGrad.addColorStop(0.85, '#241B38');  // Celestial amethyst
      skyGrad.addColorStop(1.0, '#36231C');   // Warm golden horizon base
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Radiant Golden Celestial Core / Ambient Nebula
      const goldCoreX = width * 0.5 + mouse.x * 20;
      const goldCoreY = height * 0.35 + mouse.y * 15;
      const goldRadius = Math.max(width, height) * 0.72;

      const goldGlow = ctx.createRadialGradient(goldCoreX, goldCoreY, 15, goldCoreX, goldCoreY, goldRadius);
      goldGlow.addColorStop(0, 'rgba(251, 191, 36, 0.26)');   // Glowing amber gold
      goldGlow.addColorStop(0.25, 'rgba(245, 158, 11, 0.16)');
      goldGlow.addColorStop(0.55, 'rgba(180, 83, 9, 0.07)');
      goldGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = goldGlow;
      ctx.fillRect(0, 0, width, height);

      // 3. Golden Milky Way Cosmic Dust Ribbon (Diagonal celestial wash across the sky)
      ctx.save();
      ctx.translate(width * 0.5, height * 0.5);
      ctx.rotate(-Math.PI * 0.18);
      const mwGrad = ctx.createLinearGradient(0, -height * 0.5, 0, height * 0.5);
      mwGrad.addColorStop(0, 'rgba(0,0,0,0)');
      mwGrad.addColorStop(0.35, 'rgba(245, 158, 11, 0.05)');
      mwGrad.addColorStop(0.5, 'rgba(253, 224, 71, 0.11)');  // Brightest golden spine
      mwGrad.addColorStop(0.65, 'rgba(217, 119, 6, 0.05)');
      mwGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = mwGrad;
      ctx.fillRect(-width, -height, width * 2, height * 2);
      ctx.restore();

      // 4. Background Micro-Stars (Realistic Scintillation)
      bgStars.forEach((star) => {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.phase) * 0.4 + 0.6;
        const currentAlpha = Math.max(0.1, Math.min(1.0, star.alphaBase * twinkle));

        ctx.fillStyle = star.color;
        ctx.globalAlpha = currentAlpha;
        ctx.beginPath();
        ctx.arc(
          star.x + mouse.x * 6,
          star.y + mouse.y * 4,
          star.radius,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // 5. Render Clouds with Layered Depth & Golden Rims
      clouds.forEach((cloud) => {
        cloud.x += cloud.speed;
        if (cloud.x - cloud.radius > width + 250) {
          cloud.x = -cloud.radius - 180;
          cloud.y = Math.random() * (height + 200) - 100;
        }

        cloud.pulse += cloud.pulseSpeed;
        const currentRadius = cloud.radius + Math.sin(cloud.pulse) * 14;

        // Apply mouse parallax based on layer depth
        const parallaxFactor = (cloud.layerIdx + 1) * 10;
        const drawX = cloud.x + mouse.x * parallaxFactor;
        const drawY = cloud.y + mouse.y * parallaxFactor * 0.5;

        const [r, g, b] = cloud.color;
        const cloudGrad = ctx.createRadialGradient(
          drawX, drawY, currentRadius * 0.08,
          drawX, drawY, currentRadius
        );

        if (cloud.layerIdx === 2) {
          // Golden rimmed Olympian cloud
          cloudGrad.addColorStop(0, `rgba(254, 240, 138, ${cloud.opacity * 0.65})`);
          cloudGrad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${cloud.opacity * 0.45})`);
          cloudGrad.addColorStop(0.8, `rgba(180, 83, 9, ${cloud.opacity * 0.12})`);
          cloudGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else if (cloud.layerIdx === 3) {
          // Top golden stardust veil
          cloudGrad.addColorStop(0, `rgba(255, 250, 200, ${cloud.opacity * 0.55})`);
          cloudGrad.addColorStop(0.5, `rgba(245, 158, 11, ${cloud.opacity * 0.22})`);
          cloudGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          // Deep atmospheric indigo shadow clouds
          cloudGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${cloud.opacity})`);
          cloudGrad.addColorStop(0.6, `rgba(${r * 0.7}, ${g * 0.7}, ${b * 0.7}, ${cloud.opacity * 0.35})`);
          cloudGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }

        ctx.fillStyle = cloudGrad;
        ctx.beginPath();
        ctx.arc(drawX, drawY, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 6. Upward-Floating Golden Celestial Stardust Embers
      particles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.speedX;
        p.pulse += p.pulseSpeed;

        if (p.y < -15) {
          p.y = height + 15;
          p.x = Math.random() * width;
        }

        const alpha = Math.max(0.12, p.alpha * (0.6 + 0.4 * Math.sin(p.pulse)));

        ctx.fillStyle = `rgba(253, 224, 71, ${alpha})`;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.9)';
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
