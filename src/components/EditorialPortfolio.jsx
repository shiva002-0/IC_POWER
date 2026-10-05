import React, { useState } from 'react';
import {
  Mail,
  Layers,
  Cpu,
  Eye,
  Sparkles,
  CheckCircle2,
  Compass,
  ArrowUp
} from 'lucide-react';
import { GreekCorner } from './GreekDecorations';

function GithubIcon({ size = 14, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon({ size = 14, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export default function EditorialPortfolio({ activeSection = 'projects', onReturnTo3D }) {
  const [activeTab, setActiveTab] = useState(activeSection);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.email) {
      setFormSubmitted(true);
    }
  };

  const scrollToTop = () => {
    if (onReturnTo3D) {
      onReturnTo3D();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section id="portfolio-content" className="w-full min-h-screen bg-[#03060E] text-slate-100 font-outfit select-text relative border-t border-amber-500/20">
      {/* Background Subtle Gradient Wash */}
      <div className="absolute inset-0 bg-radial from-amber-500/[0.02] via-transparent to-transparent pointer-events-none" />

      {/* Screen Frame Corners */}
      <GreekCorner position="top-left" className="top-4 left-4 absolute pointer-events-none opacity-30" />
      <GreekCorner position="top-right" className="top-4 right-4 absolute pointer-events-none opacity-30" />

      {/* Sticky Sub-Header Navigation */}
      <nav className="sticky top-0 z-30 border-b border-amber-500/20 bg-[#03060E]/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={scrollToTop}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-all text-xs font-cinzel tracking-wider cursor-pointer"
            title="Return to 3D Scene"
          >
            <Compass size={13} className="text-amber-400" />
            <span>3D SCENE</span>
          </button>
          <span className="hidden sm:inline text-xs font-cinzel text-slate-400 tracking-widest uppercase">
            PAVAN // EDITORIAL PORTFOLIO
          </span>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center space-x-1 sm:space-x-2 text-xs font-cinzel tracking-wider">
          {[
            { id: 'projects', label: '01 WORK' },
            { id: 'about', label: '02 ABOUT' },
            { id: 'skills', label: '03 EXPERTISE' },
            { id: 'contact', label: '04 CONTACT' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'text-amber-300 bg-amber-500/15 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick Back to Top */}
        <button
          onClick={scrollToTop}
          className="p-2 rounded-lg border border-slate-800 bg-[#070D1A] text-slate-400 hover:text-amber-300 hover:border-amber-500/30 transition-all cursor-pointer"
          title="Scroll to top 3D world"
        >
          <ArrowUp size={14} />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-6 py-16 space-y-16">
        {/* Editorial Masthead */}
        <header className="space-y-4 border-b border-slate-800 pb-10">
          <div className="inline-flex items-center space-x-2 text-xs font-cinzel text-amber-400/90 tracking-[0.25em] uppercase">
            <Sparkles size={12} />
            <span>SELECTED ARCHITECTURE &amp; CREATIVE SYSTEMS</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-5xl font-black tracking-wide text-slate-100 uppercase">
            A Study in Scale, Myth, and Machine.
          </h2>
          <p className="font-outfit text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Constructing digital environments at the intersection of monumental scale, real-time computer graphics, and editorial elegance. Building for perception rather than polygon count.
          </p>
        </header>

        {/* SECTION 01: SELECTED WORK */}
        {activeTab === 'projects' && (
          <section id="projects" className="space-y-12 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <span className="font-cinzel text-xs text-amber-400 tracking-[0.25em] uppercase">
                01 // FEATURED CASE STUDIES
              </span>
              <span className="text-xs text-slate-500 font-mono">4 ACTIVE PROJECTS</span>
            </div>

            <div className="space-y-12">
              {/* Project 01: OLYMPUS */}
              <article className="p-8 rounded-2xl border border-amber-500/30 bg-[#070D1C]/90 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/50 transition-all shadow-[0_0_35px_rgba(245,158,11,0.08)]">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-4 max-w-2xl">
                    <div className="flex items-center space-x-3 text-xs font-mono text-amber-400">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 font-bold">
                        01
                      </span>
                      <span>INTERACTIVE 3D ENVIRONMENT // CASE STUDY</span>
                    </div>

                    <h3 className="font-cinzel text-2xl sm:text-3xl font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                      OLYMPUS — The World Serpent &amp; The Sacred Peak
                    </h3>

                    <p className="text-slate-300 text-sm leading-relaxed">
                      A real-time WebGL cinematic landscape capturing the ancient Greek sanctuary of Mount Olympus enveloped by the colossal biological serpent Jörmungandr. Built with an analytical Bishop rotation-minimizing frame spine, custom multi-tier procedural scale displacement, and a 4-train Gerstner ocean shader with analytical wave pinch.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 rounded-lg border border-slate-800 bg-[#040814]/80">
                        <div className="text-[11px] text-slate-500 font-mono uppercase">Render Target</div>
                        <div className="text-xs text-amber-300 font-bold font-cinzel mt-0.5">60 FPS Locked</div>
                      </div>
                      <div className="p-3 rounded-lg border border-slate-800 bg-[#040814]/80">
                        <div className="text-[11px] text-slate-500 font-mono uppercase">Wave Spectrum</div>
                        <div className="text-xs text-amber-300 font-bold font-cinzel mt-0.5">4-Train Gerstner</div>
                      </div>
                      <div className="p-3 rounded-lg border border-slate-800 bg-[#040814]/80">
                        <div className="text-[11px] text-slate-500 font-mono uppercase">Spine Algorithm</div>
                        <div className="text-xs text-amber-300 font-bold font-cinzel mt-0.5">Bishop RMF Frame</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {['Three.js', 'React Three Fiber', 'GLSL Shaders', 'Gerstner Waves', 'GSAP', 'Vite'].map((tech) => (
                        <span
                          key={tech}
                          className="px-2.5 py-1 rounded text-[11px] font-mono border border-slate-700/60 bg-slate-800/40 text-slate-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="shrink-0 flex md:flex-col gap-3">
                    <button
                      onClick={scrollToTop}
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-amber-500/50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-all text-xs font-cinzel font-bold cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>VIEW 3D SCENE</span>
                    </button>
                  </div>
                </div>
              </article>

              {/* Project 02: CHRONOS */}
              <article className="p-8 rounded-2xl border border-slate-800 bg-[#070D1C]/60 backdrop-blur-xl relative overflow-hidden group hover:border-slate-700 transition-all">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-4 max-w-2xl">
                    <div className="flex items-center space-x-3 text-xs font-mono text-cyan-400">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 font-bold">
                        02
                      </span>
                      <span>HIGH-FREQUENCY VISUALIZATION // COMPUTE ENGINE</span>
                    </div>

                    <h3 className="font-cinzel text-2xl sm:text-3xl font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      CHRONOS — Zero-Copy Financial &amp; Geospatial Engine
                    </h3>

                    <p className="text-slate-300 text-sm leading-relaxed">
                      A WebGPU compute pipeline engineered for rendering multi-million point topologies and streaming order-book depth fields with sub-8ms latency. Custom compute shaders aggregate continuous tick streams into screen-space tile-sorted render passes directly in the browser.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 rounded-lg border border-slate-800 bg-[#040814]/80">
                        <div className="text-[11px] text-slate-500 font-mono uppercase">Point Capacity</div>
                        <div className="text-xs text-cyan-300 font-bold font-cinzel mt-0.5">2.4M Entities</div>
                      </div>
                      <div className="p-3 rounded-lg border border-slate-800 bg-[#040814]/80">
                        <div className="text-[11px] text-slate-500 font-mono uppercase">Frametime</div>
                        <div className="text-xs text-cyan-300 font-bold font-cinzel mt-0.5">&lt; 7.8ms (120 FPS)</div>
                      </div>
                      <div className="p-3 rounded-lg border border-slate-800 bg-[#040814]/80">
                        <div className="text-[11px] text-slate-500 font-mono uppercase">API Pipeline</div>
                        <div className="text-xs text-cyan-300 font-bold font-cinzel mt-0.5">WebGPU + WGSL</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {['WebGPU', 'WGSL Compute', 'TypeScript', 'WebAssembly', 'Zero-Copy Buffers'].map((tech) => (
                        <span
                          key={tech}
                          className="px-2.5 py-1 rounded text-[11px] font-mono border border-slate-700/60 bg-slate-800/40 text-slate-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>

              {/* Project 03: AETHER */}
              <article className="p-8 rounded-2xl border border-slate-800 bg-[#070D1C]/60 backdrop-blur-xl relative overflow-hidden group hover:border-slate-700 transition-all">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-4 max-w-2xl">
                    <div className="flex items-center space-x-3 text-xs font-mono text-emerald-400">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 font-bold">
                        03
                      </span>
                      <span>PROCEDURAL SIMULATION // GEOLOGICAL MAPPING</span>
                    </div>

                    <h3 className="font-cinzel text-2xl sm:text-3xl font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                      AETHER — Procedural Planetary Surface Simulation
                    </h3>

                    <p className="text-slate-300 text-sm leading-relaxed">
                      GPU-driven hydraulic erosion simulator implementing multi-octave water flow, sediment transport, and slope-dependent talus accumulation. Utilizes continuous quadtree clipmaps to stream infinite terrains with zero geometry pop and triplanar texture blending.
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {['WebGL 2.0', 'GLSL Shaders', 'Hydraulic Erosion', 'Clipmaps', 'Triplanar Shading'].map((tech) => (
                        <span
                          key={tech}
                          className="px-2.5 py-1 rounded text-[11px] font-mono border border-slate-700/60 bg-slate-800/40 text-slate-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>

              {/* Project 04: KAIROS */}
              <article className="p-8 rounded-2xl border border-slate-800 bg-[#070D1C]/60 backdrop-blur-xl relative overflow-hidden group hover:border-slate-700 transition-all">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-4 max-w-2xl">
                    <div className="flex items-center space-x-3 text-xs font-mono text-amber-300">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 font-bold">
                        04
                      </span>
                      <span>EDITORIAL DESIGN SYSTEM // DIGITAL IDENTITY</span>
                    </div>

                    <h3 className="font-cinzel text-2xl sm:text-3xl font-bold text-slate-100 group-hover:text-amber-200 transition-colors">
                      KAIROS — Editorial Design Architecture &amp; Studio System
                    </h3>

                    <p className="text-slate-300 text-sm leading-relaxed">
                      An editorial design system constructed for modern digital architecture and luxury publications. Features fluid typography math, micro-interaction state machines, WCAG AAA accessibility, and a sub-50KB zero-dependency runtime footprint.
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {['React', 'Tailwind CSS', 'Framer Motion', 'Radix UI', 'Sub-50KB Bundle'].map((tech) => (
                        <span
                          key={tech}
                          className="px-2.5 py-1 rounded text-[11px] font-mono border border-slate-700/60 bg-slate-800/40 text-slate-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </section>
        )}

        {/* SECTION 02: ABOUT & PHILOSOPHY */}
        {activeTab === 'about' && (
          <section id="about" className="space-y-10 animate-fadeIn max-w-3xl">
            <div className="border-b border-slate-800 pb-4">
              <span className="font-cinzel text-xs text-amber-400 tracking-[0.25em] uppercase">
                02 // PHILOSOPHY &amp; ARCHITECTURAL APPROACH
              </span>
            </div>

            <div className="space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed">
              <h3 className="font-cinzel text-2xl sm:text-3xl font-bold text-slate-100">
                Perception Over Polygon Count.
              </h3>
              <p>
                In real-time computer graphics, monumental scale is rarely created by adding more triangles. It is created by contrast: the interplay of razor-sharp geological ridges against soft atmospheric haze, low-angle solar rim light raking across keeled scales, and the deep, mathematically disciplined rhythm of Gerstner ocean swells.
              </p>
              <p>
                When building Olympus, the objective was not to construct a video game level or a boss arena, but a living, biologically plausible landscape that serves as the cinematic entrance to serious engineering work.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="p-5 rounded-xl border border-slate-800 bg-[#070D1C]/80 space-y-2">
                  <div className="text-amber-400 font-cinzel text-xs font-bold tracking-wider uppercase">
                    Nature First, Technology Last
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Procedural effects that lack a physical or biological justification are discarded. Visual noise is eliminated to let composition and atmosphere dominate.
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-slate-800 bg-[#070D1C]/80 space-y-2">
                  <div className="text-amber-400 font-cinzel text-xs font-bold tracking-wider uppercase">
                    Runtime Budget as Discipline
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Zero allocations in hot render loops, adaptive device pixel ratio capping, and distance-based LOD ensure seamless 60 FPS delivery on standard laptops.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 03: TECHNICAL EXPERTISE */}
        {activeTab === 'skills' && (
          <section id="skills" className="space-y-10 animate-fadeIn">
            <div className="border-b border-slate-800 pb-4">
              <span className="font-cinzel text-xs text-amber-400 tracking-[0.25em] uppercase">
                03 // TECHNICAL EXPERTISE &amp; STACK
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pillar 1 */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#070D1C]/80 space-y-4">
                <div className="flex items-center space-x-3 text-amber-400 font-cinzel text-sm font-bold tracking-wider">
                  <Layers size={18} />
                  <span>REAL-TIME GRAPHICS &amp; SHADERS</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Three.js &amp; React Three Fiber (R3F) Core Architectures</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Custom GLSL Fragment &amp; Vertex Shaders (Rayleigh, Gerstner, FBM)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>WebGPU &amp; WGSL Compute Pipelines</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Analytical Bishop RMF Splines &amp; Curvature Mapping</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Post-Processing &amp; ACES Filmic Tone Mapping</span>
                  </li>
                </ul>
              </div>

              {/* Pillar 2 */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#070D1C]/80 space-y-4">
                <div className="flex items-center space-x-3 text-amber-400 font-cinzel text-sm font-bold tracking-wider">
                  <Cpu size={18} />
                  <span>RUNTIME PERFORMANCE &amp; PROFILING</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Zero Garbage Collection in Frame Loops (Vector recycling)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Adaptive DPR capping (1.0 - 1.6x) for 4K / Retina longevity</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Draw Call Batching &amp; Instanced Mesh hierarchies</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Distance-based LOD with hysteresis culling</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Asset Compression (Draco, Meshopt, KTX2, WebP)</span>
                  </li>
                </ul>
              </div>

              {/* Pillar 3 */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#070D1C]/80 space-y-4">
                <div className="flex items-center space-x-3 text-amber-400 font-cinzel text-sm font-bold tracking-wider">
                  <Sparkles size={18} />
                  <span>FRONTEND SYSTEMS ARCHITECTURE</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>React 18 / 19 &amp; Next.js Full-Stack Application Design</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>TypeScript Strict Mode &amp; Custom Hook Abstractions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Tailwind CSS &amp; Editorial Vanilla CSS Micro-Layouts</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>GSAP &amp; Physics Animation Timelines</span>
                  </li>
                </ul>
              </div>

              {/* Pillar 4 */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#070D1C]/80 space-y-4">
                <div className="flex items-center space-x-3 text-amber-400 font-cinzel text-sm font-bold tracking-wider">
                  <Compass size={18} />
                  <span>PRODUCTION &amp; NETWORK RESILIENCE</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Progressive 5-Stage Asset Hydration</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Graceful Offline / Low-Bandwidth Degradation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Clean Vercel &amp; Edge CDN Continuous Deployment</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>User-Gesture Bound AudioContext (Zero Autoplay Warnings)</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 04: CONTACT & DISPATCH */}
        {activeTab === 'contact' && (
          <section id="contact" className="space-y-8 animate-fadeIn max-w-2xl">
            <div className="border-b border-slate-800 pb-4">
              <span className="font-cinzel text-xs text-amber-400 tracking-[0.25em] uppercase">
                04 // DIRECT INQUIRIES &amp; ENGAGEMENT
              </span>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed">
              Available for select creative technologist roles, WebGL consulting, and custom 3D system architecture engagements.
            </p>

            {formSubmitted ? (
              <div className="p-8 rounded-2xl border border-emerald-500/40 bg-[#061410]/80 backdrop-blur-xl text-center space-y-3">
                <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
                <h3 className="font-cinzel text-lg font-bold text-amber-300">
                  Dispatch Transmitted
                </h3>
                <p className="text-xs text-slate-300 font-outfit max-w-md mx-auto">
                  Thank you for reaching out. Your inquiry has been transmitted successfully. You will receive a direct response within 24 hours.
                </p>
                <button
                  onClick={() => setFormSubmitted(false)}
                  className="mt-4 px-4 py-2 rounded-lg border border-amber-500/40 text-amber-300 text-xs font-cinzel cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-cinzel text-slate-400 tracking-wider uppercase">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Elena Rostova"
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-[#060B18] text-slate-100 text-sm focus:border-amber-400 focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-cinzel text-slate-400 tracking-wider uppercase">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="elena@studio.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-[#060B18] text-slate-100 text-sm focus:border-amber-400 focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-cinzel text-slate-400 tracking-wider uppercase">
                    Project Details / Inquiry
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your technical vision, timeline, and goals..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-[#060B18] text-slate-100 text-sm focus:border-amber-400 focus:outline-none transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-cinzel text-xs font-bold tracking-[0.2em] uppercase bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-900 hover:from-yellow-300 hover:to-amber-400 transition-all shadow-[0_0_25px_rgba(245,158,11,0.4)] cursor-pointer"
                >
                  TRANSMIT INQUIRY
                </button>
              </form>
            )}

            {/* Direct Connect Grid */}
            <div className="pt-8 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2 p-3 rounded-xl border border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-300 transition-all"
              >
                <GithubIcon size={14} />
                <span>GITHUB // REPOSITORIES</span>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2 p-3 rounded-xl border border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-300 transition-all"
              >
                <LinkedinIcon size={14} />
                <span>LINKEDIN // PROFILE</span>
              </a>
              <a
                href="mailto:contact@olympus-portfolio.dev"
                className="flex items-center space-x-2 p-3 rounded-xl border border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-300 transition-all"
              >
                <Mail size={14} />
                <span>EMAIL // DIRECT</span>
              </a>
            </div>
          </section>
        )}

        {/* Editorial Footer */}
        <footer className="pt-12 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono gap-4">
          <div>OLYMPUS PORTFOLIO // VOL. 01</div>
          <div className="flex items-center space-x-4">
            <button
              onClick={scrollToTop}
              className="text-amber-400 hover:underline cursor-pointer font-cinzel text-[11px] tracking-wider uppercase"
            >
              Return to 3D Scene ➔
            </button>
          </div>
        </footer>
      </main>
    </section>
  );
}
