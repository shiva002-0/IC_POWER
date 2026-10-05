import React, { useState, useEffect, useRef } from 'react';
import { Star, Compass, Sparkles } from 'lucide-react';
import { soundFX } from '../utils/audio';

// 6 Ancient Greek Mythological Constellations with accurate stellar details & spectral physics
const CONSTELLATIONS_DATA = [
  {
    id: 'orion',
    name: 'ORION',
    greekName: 'ΩΡΙΩΝ',
    title: 'The Giant Celestial Hunter',
    myth: 'Beloved huntsman of Artemis, placed among the stars bearing his golden belt, shield, and indestructible club.',
    alphaStar: 'Betelgeuse & Rigel',
    classification: 'Hunter / Winter Hexagon',
    starsCount: 8,
    stars: [
      { id: 'betelgeuse', rx: 0.12, ry: 0.16, size: 5.4, name: 'Betelgeuse', bayer: 'α Ori', color: '#FF7A50', glow: '#FF3D00' },
      { id: 'bellatrix', rx: 0.20, ry: 0.15, size: 4.0, name: 'Bellatrix', bayer: 'γ Ori', color: '#E0F7FA', glow: '#00E5FF' },
      { id: 'alnitak', rx: 0.15, ry: 0.24, size: 3.5, name: 'Alnitak', bayer: 'ζ Ori', color: '#B3E5FC', glow: '#03A9F4' },
      { id: 'alnilam', rx: 0.165, ry: 0.235, size: 3.8, name: 'Alnilam', bayer: 'ε Ori', color: '#E1F5FE', glow: '#40C4FF' },
      { id: 'mintaka', rx: 0.18, ry: 0.23, size: 3.5, name: 'Mintaka', bayer: 'δ Ori', color: '#B3E5FC', glow: '#03A9F4' },
      { id: 'saiph', rx: 0.13, ry: 0.33, size: 3.8, name: 'Saiph', bayer: 'κ Ori', color: '#B2EBF2', glow: '#00BCD4' },
      { id: 'rigel', rx: 0.21, ry: 0.32, size: 5.6, name: 'Rigel', bayer: 'β Ori', color: '#E0F2FE', glow: '#38BDF8' },
      { id: 'meissa', rx: 0.16, ry: 0.11, size: 3.2, name: 'Meissa', bayer: 'λ Ori', color: '#FFF8E1', glow: '#FFD54F' }
    ],
    lines: [
      [7, 0], [7, 1],
      [0, 2], [1, 4],
      [2, 3], [3, 4],
      [2, 5], [4, 6],
      [0, 1]
    ]
  },
  {
    id: 'cassiopeia',
    name: 'CASSIOPEIA',
    greekName: 'ΚΑΣΣΙΟΠΕΙΑ',
    title: 'The Queen of the Celestial Throne',
    myth: 'Queen of Aethiopia, immortalized on her golden throne circling the north celestial pole for all eternity.',
    alphaStar: 'Schedar (α Cas)',
    classification: 'Circumpolar / Royal Court',
    starsCount: 5,
    stars: [
      { id: 'caph', rx: 0.77, ry: 0.11, size: 4.0, name: 'Caph', bayer: 'β Cas', color: '#FFF9C4', glow: '#FBC02D' },
      { id: 'schedar', rx: 0.82, ry: 0.14, size: 4.8, name: 'Schedar', bayer: 'α Cas', color: '#FFE082', glow: '#FFA000' },
      { id: 'gamma', rx: 0.85, ry: 0.09, size: 4.2, name: 'Navi', bayer: 'γ Cas', color: '#E0F7FA', glow: '#00E5FF' },
      { id: 'ruchbah', rx: 0.89, ry: 0.13, size: 3.8, name: 'Ruchbah', bayer: 'δ Cas', color: '#E8EAF6', glow: '#5C6BC0' },
      { id: 'segin', rx: 0.93, ry: 0.10, size: 3.5, name: 'Segin', bayer: 'ε Cas', color: '#E1F5FE', glow: '#29B6F6' }
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4]
    ]
  },
  {
    id: 'aquila',
    name: 'AQUILA',
    greekName: 'ΑΕΤΟΣ',
    title: 'The Sacred Eagle of Zeus',
    myth: 'The divine golden eagle (Aetos Dios) that carries the thunderbolts of Zeus and carried Ganymede to Mount Olympus.',
    alphaStar: 'Altair (α Aql)',
    classification: 'Summer Triangle / Divine Messenger',
    starsCount: 6,
    stars: [
      { id: 'tarazed', rx: 0.86, ry: 0.44, size: 3.8, name: 'Tarazed', bayer: 'γ Aql', color: '#FFE082', glow: '#FFA000' },
      { id: 'altair', rx: 0.89, ry: 0.47, size: 5.5, name: 'Altair', bayer: 'α Aql', color: '#FFFFFF', glow: '#FDE047' },
      { id: 'alshain', rx: 0.92, ry: 0.50, size: 3.6, name: 'Alshain', bayer: 'β Aql', color: '#FFF9C4', glow: '#FBC02D' },
      { id: 'deneb_okab', rx: 0.84, ry: 0.53, size: 3.2, name: 'Deneb Okab', bayer: 'ζ Aql', color: '#E0F7FA', glow: '#00E5FF' },
      { id: 'bezek', rx: 0.93, ry: 0.42, size: 3.4, name: 'Bezek', bayer: 'η Aql', color: '#E1F5FE', glow: '#40C4FF' },
      { id: 'tail', rx: 0.81, ry: 0.48, size: 3.0, name: 'Tseen Foo', bayer: 'θ Aql', color: '#E8EAF6', glow: '#3F51B5' }
    ],
    lines: [
      [0, 1], [1, 2],
      [0, 4], [1, 3], [3, 5], [1, 5]
    ]
  },
  {
    id: 'pegasus',
    name: 'PEGASUS',
    greekName: 'ΠΗΓΑΣΟΣ',
    title: 'The Divine Winged Steed',
    myth: 'Born of sea foam and Medusa, the winged stallion that mounted Olympus to carry lightning for the King of Gods.',
    alphaStar: 'Markab (α Peg)',
    classification: 'Northern Sky / Mythic Steed',
    starsCount: 6,
    stars: [
      { id: 'scheat', rx: 0.08, ry: 0.52, size: 4.4, name: 'Scheat', bayer: 'β Peg', color: '#FFCC80', glow: '#FF9800' },
      { id: 'alpheratz', rx: 0.16, ry: 0.50, size: 4.6, name: 'Alpheratz', bayer: 'α And', color: '#E0F7FA', glow: '#00E5FF' },
      { id: 'algenib', rx: 0.17, ry: 0.62, size: 4.0, name: 'Algenib', bayer: 'γ Peg', color: '#B3E5FC', glow: '#03A9F4' },
      { id: 'markab', rx: 0.07, ry: 0.63, size: 4.8, name: 'Markab', bayer: 'α Peg', color: '#FFFFFF', glow: '#FDE047' },
      { id: 'enif', rx: 0.02, ry: 0.45, size: 4.2, name: 'Enif', bayer: 'ε Peg', color: '#FFE082', glow: '#FFA000' },
      { id: 'matar', rx: 0.04, ry: 0.49, size: 3.2, name: 'Matar', bayer: 'η Peg', color: '#FFF9C4', glow: '#FBC02D' }
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [0, 5], [5, 4]
    ]
  },
  {
    id: 'cygnus',
    name: 'CYGNUS',
    greekName: 'ΚΥΚΝΟΣ',
    title: 'The Swan of the Milky Way',
    myth: 'The celestial swan disguise of Zeus soaring through the river of starlight (the Northern Cross) towards the heavens.',
    alphaStar: 'Deneb (α Cyg)',
    classification: 'Summer Triangle / Northern Cross',
    starsCount: 5,
    stars: [
      { id: 'deneb', rx: 0.44, ry: 0.08, size: 5.6, name: 'Deneb', bayer: 'α Cyg', color: '#E0F7FA', glow: '#00E5FF' },
      { id: 'sadr', rx: 0.48, ry: 0.13, size: 4.4, name: 'Sadr', bayer: 'γ Cyg', color: '#FFF9C4', glow: '#FBC02D' },
      { id: 'albireo', rx: 0.52, ry: 0.18, size: 4.2, name: 'Albireo', bayer: 'β Cyg', color: '#FFE082', glow: '#FFA000' },
      { id: 'gienah', rx: 0.42, ry: 0.16, size: 3.8, name: 'Gienah', bayer: 'ε Cyg', color: '#E0F2FE', glow: '#38BDF8' },
      { id: 'fawaris', rx: 0.54, ry: 0.11, size: 3.6, name: 'Fawaris', bayer: 'δ Cyg', color: '#E1F5FE', glow: '#40C4FF' }
    ],
    lines: [
      [0, 1], [1, 2],
      [3, 1], [1, 4]
    ]
  },
  {
    id: 'leo',
    name: 'LEO',
    greekName: 'ΛΕΩΝ',
    title: 'The Nemean Lion',
    myth: 'The fierce, golden-pelted beast whose invulnerable hide was won by Heracles in his very first heroic labor.',
    alphaStar: 'Regulus (Heart of the Lion)',
    classification: 'Zodiac / Royal Star',
    starsCount: 6,
    stars: [
      { id: 'regulus', rx: 0.81, ry: 0.72, size: 5.6, name: 'Regulus', bayer: 'α Leo', color: '#E0F7FA', glow: '#00E5FF' },
      { id: 'algieba', rx: 0.84, ry: 0.65, size: 4.2, name: 'Algieba', bayer: 'γ Leo', color: '#FFE082', glow: '#FFA000' },
      { id: 'rasalas', rx: 0.82, ry: 0.60, size: 3.4, name: 'Rasalas', bayer: 'μ Leo', color: '#FFF9C4', glow: '#FBC02D' },
      { id: 'adhalf', rx: 0.86, ry: 0.61, size: 3.2, name: 'Adhafera', bayer: 'ζ Leo', color: '#E8EAF6', glow: '#5C6BC0' },
      { id: 'zosma', rx: 0.91, ry: 0.66, size: 4.0, name: 'Zosma', bayer: 'δ Leo', color: '#E1F5FE', glow: '#29B6F6' },
      { id: 'denebola', rx: 0.95, ry: 0.70, size: 4.4, name: 'Denebola', bayer: 'β Leo', color: '#E0F2FE', glow: '#38BDF8' }
    ],
    lines: [
      [0, 1], [1, 3], [3, 2],
      [1, 4], [4, 5], [5, 0]
    ]
  }
];

export default function ConstellationCanvas({ hudRef }) {
  const canvasRef = useRef(null);
  const [activeConstellation, setActiveConstellation] = useState(null);
  const [discovered, setDiscovered] = useState(new Set());
  const hoveredIdRef = useRef(null);
  const lastChimedRef = useRef(null);

  const spotlightConstellation = (c) => {
    hoveredIdRef.current = c.id;
    setActiveConstellation(c);
    setDiscovered((prev) => new Set(prev).add(c.id));
    soundFX.playChime(c.stars.length % 5, 0.16);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mousePos = { x: -1000, y: -1000 };

    // Interactive mouse golden spark trail
    const sparkTrail = [];
    const maxSparks = 25;

    const handleMouseMove = (e) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;

      // Add gentle golden sparks on mouse movement
      if (Math.random() > 0.4) {
        sparkTrail.push({
          x: mousePos.x + (Math.random() - 0.5) * 16,
          y: mousePos.y + (Math.random() - 0.5) * 16,
          radius: 0.8 + Math.random() * 1.8,
          alpha: 0.85,
          decay: 0.03 + Math.random() * 0.03,
          color: Math.random() > 0.4 ? '#FDE047' : '#FFFFFF'
        });
        if (sparkTrail.length > maxSparks) sparkTrail.shift();
      }

      // Ignore hover if mouse is inside center HUD card
      if (hudRef?.current) {
        const rect = hudRef.current.getBoundingClientRect();
        if (
          mousePos.x >= rect.left - 20 &&
          mousePos.x <= rect.right + 20 &&
          mousePos.y >= rect.top - 20 &&
          mousePos.y <= rect.bottom + 20
        ) {
          if (hoveredIdRef.current !== null) {
            hoveredIdRef.current = null;
            setActiveConstellation(null);
          }
          return;
        }
      }

      // Proximity detection for stars and connector lines
      let found = null;
      let minDistance = 60; // Proximity threshold in pixels

      CONSTELLATIONS_DATA.forEach((c) => {
        // Distance to stars
        c.stars.forEach((s) => {
          const sx = s.rx * width;
          const sy = s.ry * height;
          const dist = Math.hypot(mousePos.x - sx, mousePos.y - sy);
          if (dist < minDistance) {
            found = c;
            minDistance = dist;
          }
        });

        // Distance to lines
        if (!found) {
          c.lines.forEach(([i1, i2]) => {
            const s1 = c.stars[i1];
            const s2 = c.stars[i2];
            const x1 = s1.rx * width;
            const y1 = s1.ry * height;
            const x2 = s2.rx * width;
            const y2 = s2.ry * height;

            const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
            if (l2 > 0) {
              let t = ((mousePos.x - x1) * (x2 - x1) + (mousePos.y - y1) * (y2 - y1)) / l2;
              t = Math.max(0, Math.min(1, t));
              const projX = x1 + t * (x2 - x1);
              const projY = y1 + t * (y2 - y1);
              const dist = Math.hypot(mousePos.x - projX, mousePos.y - projY);
              if (dist < 42) {
                found = c;
              }
            }
          });
        }
      });

      if (found) {
        if (hoveredIdRef.current !== found.id) {
          hoveredIdRef.current = found.id;
          setActiveConstellation(found);
          setDiscovered((prev) => new Set(prev).add(found.id));
          if (lastChimedRef.current !== found.id) {
            soundFX.playChime(found.stars.length % 5, 0.15);
            lastChimedRef.current = found.id;
          }
        }
      } else {
        if (hoveredIdRef.current !== null) {
          hoveredIdRef.current = null;
          setActiveConstellation(null);
        }
      }
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    let time = 0;

    const render = () => {
      time += 0.022;
      ctx.clearRect(0, 0, width, height);

      // 1. Render Sparkle Trail
      for (let i = sparkTrail.length - 1; i >= 0; i--) {
        const sp = sparkTrail[i];
        sp.alpha -= sp.decay;
        if (sp.alpha <= 0) {
          sparkTrail.splice(i, 1);
          continue;
        }
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = sp.alpha;
        ctx.shadowColor = '#FDE047';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;

      // 2. Render Constellations
      CONSTELLATIONS_DATA.forEach((c) => {
        const isHovered = hoveredIdRef.current === c.id;

        // A. Subtle Golden Polygon Fill on Hover
        if (isHovered) {
          ctx.beginPath();
          c.stars.forEach((s, idx) => {
            const sx = s.rx * width;
            const sy = s.ry * height;
            if (idx === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          });
          ctx.closePath();
          ctx.fillStyle = 'rgba(245, 158, 11, 0.04)';
          ctx.fill();
        }

        // B. Golden Energy Connector Lines
        c.lines.forEach(([i1, i2], lineIdx) => {
          const s1 = c.stars[i1];
          const s2 = c.stars[i2];
          const x1 = s1.rx * width;
          const y1 = s1.ry * height;
          const x2 = s2.rx * width;
          const y2 = s2.ry * height;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);

          if (isHovered) {
            // Radiant golden thread with intense celestial bloom
            ctx.strokeStyle = 'rgba(253, 224, 71, 0.95)';
            ctx.shadowColor = 'rgba(245, 158, 11, 0.9)';
            ctx.shadowBlur = 16;
            ctx.lineWidth = 2.4;
          } else {
            // Ethereal golden starlight line with gentle wave shimmer
            const linePulse = Math.sin(time * 1.5 + lineIdx * 0.8) * 0.08 + 0.22;
            ctx.strokeStyle = `rgba(254, 240, 138, ${linePulse})`;
            ctx.shadowColor = 'rgba(245, 158, 11, 0.3)';
            ctx.shadowBlur = 4;
            ctx.lineWidth = 1.1;
          }
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Flowing golden energy pulses running along the lines
          const pulsesPerLine = isHovered ? 2 : 1;
          for (let p = 0; p < pulsesPerLine; p++) {
            const pulseSpeed = isHovered ? 0.45 : 0.22;
            const progress = (time * pulseSpeed + lineIdx * 0.35 + p * 0.5) % 1.0;
            const px = x1 + (x2 - x1) * progress;
            const py = y1 + (y2 - y1) * progress;

            ctx.fillStyle = isHovered ? '#FFFFFF' : '#FEF08A';
            ctx.shadowColor = '#FDE047';
            ctx.shadowBlur = isHovered ? 12 : 6;
            ctx.beginPath();
            ctx.arc(px, py, isHovered ? 2.5 : 1.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });

        // C. Realistic Stars with Atmospheric Scintillation & Fraunhofer Diffraction Spikes
        c.stars.forEach((s, idx) => {
          const sx = s.rx * width;
          const sy = s.ry * height;

          // Multi-frequency scintillation (slow thermal wave + high-frequency shimmer)
          const slowPulse = Math.sin(time * 2.0 + idx * 1.6) * 0.22;
          const fastShimmer = Math.sin(time * 8.5 + idx * 4.3) * 0.12;
          const twinkle = 0.85 + slowPulse + fastShimmer;

          const baseRadius = s.size + (isHovered ? 3.0 : 0);
          const radius = baseRadius * twinkle;

          // 1. Broad Outer Golden Corona Halo
          const outerRadius = radius * (isHovered ? 4.8 : 3.6);
          const coronaGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, outerRadius);
          if (isHovered) {
            coronaGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
            coronaGrad.addColorStop(0.25, s.glow);
            coronaGrad.addColorStop(0.65, 'rgba(245, 158, 11, 0.45)');
            coronaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          } else {
            coronaGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            coronaGrad.addColorStop(0.35, s.glow);
            coronaGrad.addColorStop(0.75, 'rgba(245, 158, 11, 0.2)');
            coronaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          }

          ctx.fillStyle = coronaGrad;
          ctx.beginPath();
          ctx.arc(sx, sy, outerRadius, 0, Math.PI * 2);
          ctx.fill();

          // 2. Intense White Stellar Core
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(1.5, radius * 0.62), 0, Math.PI * 2);
          ctx.fill();

          // 3. Diffraction Spikes (Realistic 4-point cardinal & 4-point diagonal spikes)
          if (isHovered || s.size > 4.2) {
            const spikeLen = radius * (isHovered ? 5.5 : 3.2);
            ctx.save();
            ctx.translate(sx, sy);
            // Slowly rotate with celestial vault
            ctx.rotate(time * 0.05 + idx * 0.3);

            // Primary Cardinal Spikes
            ctx.strokeStyle = isHovered ? 'rgba(255, 255, 255, 0.95)' : 'rgba(254, 240, 138, 0.55)';
            ctx.lineWidth = isHovered ? 1.4 : 1.0;
            ctx.beginPath();
            ctx.moveTo(-spikeLen, 0);
            ctx.lineTo(spikeLen, 0);
            ctx.moveTo(0, -spikeLen);
            ctx.lineTo(0, spikeLen);
            ctx.stroke();

            // Secondary Diagonal Spikes for brighter stars
            if (isHovered || s.size > 4.8) {
              const diagLen = spikeLen * 0.58;
              ctx.rotate(Math.PI / 4);
              ctx.strokeStyle = isHovered ? 'rgba(253, 224, 71, 0.8)' : 'rgba(254, 240, 138, 0.3)';
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(-diagLen, 0);
              ctx.lineTo(diagLen, 0);
              ctx.moveTo(0, -diagLen);
              ctx.lineTo(0, diagLen);
              ctx.stroke();
            }

            ctx.restore();
          }

          // 4. Sacred Celestial Ring around Alpha/Key Stars
          if (isHovered && s.size > 4.8) {
            const ringRadius = radius * 2.8 + Math.sin(time * 3.0 + idx) * 1.5;
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
            ctx.lineWidth = 0.8;
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.arc(sx, sy, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // 5. Star Names and Bayer Designations on Hover
          if (isHovered) {
            ctx.fillStyle = '#FEF08A';
            ctx.font = 'bold 11px Outfit, sans-serif';
            ctx.fillText(s.name, sx + radius + 7, sy - 4);

            if (s.bayer) {
              ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
              ctx.font = '10px Cinzel, serif';
              ctx.fillText(s.bayer, sx + radius + 7, sy + 9);
            }
          }
        });

        // D. Subtle Greek Constellation Watermark Title
        if (!isHovered) {
          const firstStar = c.stars[0];
          const fx = firstStar.rx * width;
          const fy = firstStar.ry * height;
          ctx.fillStyle = 'rgba(245, 158, 11, 0.55)';
          ctx.font = '11px Cinzel, serif';
          ctx.fillText(`✦ ${c.name}`, fx - 8, fy - 16);
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [hudRef]);

  return (
    <>
      {/* 1. Full-Screen Interactive Canvas with pointer-events-none so it NEVER blocks buttons */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* 2. Top-Right Pantheon Constellation Quick Selector & Discovery Tracker */}
      <div className="absolute top-18 right-6 z-20 hidden lg:flex flex-col items-end space-y-2 pointer-events-auto">
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full border border-amber-500/40 bg-[#080d1d]/85 backdrop-blur-md text-[10px] text-amber-300 font-cinzel tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          <Compass size={11} className="text-amber-400 animate-spin-very-slow" />
          <span>PANTHEON CONSTELLATIONS ({discovered.size}/6)</span>
        </div>

        {/* Quick Spotlight Chips */}
        <div className="flex flex-wrap gap-1.5 max-w-[240px] justify-end">
          {CONSTELLATIONS_DATA.map((c) => {
            const isSelected = activeConstellation?.id === c.id;
            const isFound = discovered.has(c.id);

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => spotlightConstellation(c)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-cinzel tracking-wider transition-all duration-200 border cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-slate-900 border-amber-300 font-bold shadow-[0_0_18px_rgba(245,158,11,0.7)]'
                    : isFound
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                    : 'bg-slate-900/60 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-amber-500/40'
                }`}
                title={`Spotlight ${c.name} (${c.title})`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Floating Mythological Constellation Codex Card */}
      {activeConstellation && (
        <div className="fixed top-20 left-6 z-30 pointer-events-auto animate-fadeIn max-w-[320px] w-[90%] sm:w-auto">
          <div className="flex flex-col bg-[#070c1e]/95 border border-amber-400/80 px-5 py-4 rounded-2xl backdrop-blur-xl shadow-[0_0_45px_rgba(245,158,11,0.5)] text-left gold-box-glow">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-2 mb-2">
              <div className="flex items-center space-x-2">
                <Star size={13} className="text-amber-400 fill-amber-400 animate-spin-very-slow" />
                <span className="font-cinzel text-sm text-amber-300 font-bold tracking-widest uppercase">
                  {activeConstellation.name}
                </span>
                <span className="font-cinzel text-xs text-amber-400/80">
                  ({activeConstellation.greekName})
                </span>
              </div>
              <span className="text-[10px] font-mono text-amber-300/90 border border-amber-500/40 px-1.5 py-0.5 rounded bg-amber-500/10">
                {activeConstellation.starsCount} STARS
              </span>
            </div>

            {/* Title & Classification */}
            <div className="text-xs font-outfit text-amber-200 font-semibold mb-1">
              {activeConstellation.title}
            </div>
            <div className="text-[10px] font-outfit text-amber-400/80 uppercase tracking-wider mb-2">
              ◈ {activeConstellation.classification}
            </div>

            {/* Mythological Lore */}
            <p className="text-xs font-outfit text-slate-200 leading-relaxed mb-3 italic bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
              "{activeConstellation.myth}"
            </p>

            {/* Key Stars List */}
            <div className="border-t border-amber-500/25 pt-2 text-[11px] font-outfit text-slate-300 space-y-1">
              <div className="flex items-center space-x-1.5 text-amber-300 font-medium">
                <Sparkles size={11} className="text-amber-400" />
                <span>Alpha Star: <strong className="text-white">{activeConstellation.alphaStar}</strong></span>
              </div>
              <div className="text-[10px] text-slate-400">
                Stars: {activeConstellation.stars.map((s) => `${s.name} (${s.bayer || ''})`).join(' • ')}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
