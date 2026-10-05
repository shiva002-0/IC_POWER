import React, { useState, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import {
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
  Compass,
  ArrowDown,
  Activity,
  ChevronDown
} from 'lucide-react';
import Atmosphere from './Atmosphere';
import Ocean from './Ocean';
import MountOlympus from './MountOlympus';
import CloudLayer from './CloudLayer';
import BackgroundMountains from './BackgroundMountains';
import Vegetation from './Vegetation';
import Jormungandr from './Jormungandr';
import GreekGateway from './GreekGateway';
import GreekFloatingIslands from './GreekFloatingIslands';
import DivineSanctuaryLife from './DivineSanctuaryLife';
import ThronePlaceholders from './ThronePlaceholders';
import FlythroughController from './FlythroughController';
import { VIEWPOINTS } from '../../config/olympusConfig';
import PerformanceMonitor from './PerformanceMonitor';
import { GreekCorner } from '../GreekDecorations';
import { soundFX } from '../../utils/audio';
import { detectDeviceTier, getTierConfig, QUALITY_TIERS } from '../../utils/performance';

export default function FlythroughScene({ onSelectSection, onExploreWork }) {
  const [tier, setTier] = useState(() => detectDeviceTier());
  const tierConfig = useMemo(() => getTierConfig(tier), [tier]);

  const [activeView, setActiveView] = useState(VIEWPOINTS.FLYTHROUGH);
  const [replayKey, setReplayKey] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showHUD, setShowHUD] = useState(false);
  const [stats, setStats] = useState({ fps: 60, drawCalls: 20, triangles: 85000 });
  const [isFlythroughComplete, setIsFlythroughComplete] = useState(false);

  const handleFlythroughComplete = useCallback(() => {
    setIsFlythroughComplete(true);
  }, []);

  const handleReplayFlythrough = () => {
    setActiveView(VIEWPOINTS.FLYTHROUGH);
    setIsFlythroughComplete(false);
    setReplayKey((k) => k + 1);
    soundFX.playTransitionChord();
  };

  const handleSelectViewpoint = (vp) => {
    setActiveView(vp);
    soundFX.playChime(1, 0.12);
  };

  const toggleSound = () => {
    const muted = soundFX.toggleMute();
    setIsMuted(muted);
  };

  const cycleTier = () => {
    if (tier === QUALITY_TIERS.HIGH) setTier(QUALITY_TIERS.MEDIUM);
    else if (tier === QUALITY_TIERS.MEDIUM) setTier(QUALITY_TIERS.LOW);
    else setTier(QUALITY_TIERS.HIGH);
  };

  return (
    <section id="scene-entrance" className="relative w-full h-screen bg-[#04060E] overflow-hidden select-none">
      {/* 1. Full Screen Three.js Canvas with Capped DPR and Adaptive Geometry */}
      <Canvas
        shadows={tierConfig.shadowsEnabled}
        dpr={tierConfig.dpr}
        gl={{
          antialias: tier !== QUALITY_TIERS.LOW,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          powerPreference: 'high-performance'
        }}
        camera={{ position: [0, 3.0, 140], fov: 50, near: 0.5, far: 1800 }}
        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing"
      >
        {/* Performance Statistics Monitor */}
        <PerformanceMonitor onStatsUpdate={setStats} />

        {/* Celestial Environment & Lighting */}
        <Atmosphere
          shadowMapSize={tierConfig.shadowMapSize}
          castShadow={tierConfig.shadowsEnabled}
        />
        <Ocean segments={tierConfig.oceanSegments} />
        <BackgroundMountains />
        <GreekGateway />
        <MountOlympus />
        <GreekFloatingIslands />
        <Jormungandr
          tubularSegments={tierConfig.serpentTubularSegments}
          radialSegments={tierConfig.serpentRadialSegments}
        />
        <Vegetation />
        <CloudLayer />
        <DivineSanctuaryLife />
        <ThronePlaceholders
          isFlythroughComplete={isFlythroughComplete}
          onSelectThrone={(throne) => {
            if (onSelectSection) onSelectSection(throne.category);
          }}
        />

        {/* Cinematic Path & Viewpoint Controller */}
        <FlythroughController
          key={replayKey}
          activeView={activeView}
          onComplete={handleFlythroughComplete}
          freeControlsEnabled={true}
        />
      </Canvas>

      {/* 2. Top Header Navigation Bar */}
      <header className="absolute top-5 left-6 right-6 flex items-center justify-between z-20 pointer-events-auto">
        <div className="flex items-center space-x-3 text-amber-300 font-cinzel text-xs tracking-[0.25em] uppercase px-4 py-2 rounded-full border border-amber-500/30 bg-[#080E21]/80 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>MOUNT OLYMPUS // REAL-TIME 3D SCENE</span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Performance Tier Selector */}
          <button
            onClick={cycleTier}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-slate-700/80 bg-[#080E21]/80 text-[11px] font-mono text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-all backdrop-blur-md cursor-pointer"
            title="Cycle Performance Tier"
          >
            <Activity size={12} className="text-amber-400" />
            <span>TIER: {tier.toUpperCase()}</span>
          </button>

          {/* Performance HUD Toggle */}
          <button
            onClick={() => setShowHUD((h) => !h)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-slate-700/80 bg-[#080E21]/80 text-[11px] font-mono text-slate-300 hover:text-white transition-all backdrop-blur-md cursor-pointer"
            title="Toggle Performance Diagnostics"
          >
            <span className="text-emerald-400 font-bold">{stats.fps} FPS</span>
          </button>

          {/* Audio Toggle (Unlocked only on user gesture) */}
          <button
            onClick={toggleSound}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-[#080E21]/80 text-amber-300 hover:text-amber-100 hover:border-amber-400 transition-all backdrop-blur-md text-xs tracking-wider cursor-pointer"
            title={isMuted ? "Unmute Harmonic Audio" : "Mute Audio"}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} className="text-amber-400" />}
            <span className="hidden sm:inline">{isMuted ? "AUDIO OFF" : "AUDIO ON"}</span>
          </button>
        </div>
      </header>

      {/* 3. Screen Edge Greek Corners */}
      <GreekCorner position="top-left" className="top-3 left-3 opacity-40" />
      <GreekCorner position="top-right" className="top-3 right-3 opacity-40" />
      <GreekCorner position="bottom-left" className="bottom-3 left-3 opacity-40" />
      <GreekCorner position="bottom-right" className="bottom-3 right-3 opacity-40" />

      {/* 4. Real-time Diagnostics Floating HUD (Optional) */}
      {showHUD && (
        <div className="absolute top-18 right-6 z-30 p-3.5 rounded-xl border border-slate-700/80 bg-[#040814]/90 backdrop-blur-xl text-[11px] font-mono space-y-1.5 min-w-[200px] shadow-2xl pointer-events-auto animate-fadeIn">
          <div className="flex items-center justify-between text-amber-400 font-bold border-b border-slate-800 pb-1">
            <span>RENDERER METRICS</span>
            <span>{stats.fps} FPS</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Draw Calls:</span>
            <span className="text-amber-300 font-bold">{stats.drawCalls}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Triangles:</span>
            <span className="text-amber-300 font-bold">{(stats.triangles / 1000).toFixed(1)}k</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Max DPR:</span>
            <span className="text-slate-400">{tierConfig.dpr[1]}x</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Shadows:</span>
            <span className="text-slate-400">{tierConfig.shadowsEnabled ? `${tierConfig.shadowMapSize}px` : 'Off'}</span>
          </div>
        </div>
      )}

      {/* 5. Editorial Cinematic Masthead Overlay (The 3D Entrance) */}
      <div className="absolute top-1/2 left-6 sm:left-12 -translate-y-1/2 z-20 max-w-xl space-y-5 pointer-events-none">
        <div className="space-y-2 pointer-events-auto">
          <div className="inline-flex items-center space-x-2 text-xs font-cinzel text-amber-400 tracking-[0.3em] uppercase bg-[#080E21]/60 px-3 py-1 rounded-full border border-amber-500/20 backdrop-blur-sm">
            <Sparkles size={11} className="text-amber-300" />
            <span>CREATIVE ENGINEERING // WEBGL</span>
          </div>

          <h1 className="font-cinzel text-4xl sm:text-6xl font-black tracking-tight text-slate-100 uppercase leading-[1.05] drop-shadow-lg">
            OLYMPUS
          </h1>

          <p className="font-cinzel text-base sm:text-lg text-amber-200/90 tracking-[0.2em] font-medium uppercase">
            A Study in Scale, Myth, and Machine.
          </p>

          <p className="font-outfit text-xs sm:text-sm text-slate-300/90 leading-relaxed max-w-md pt-1">
            A real-time WebGL landscape capturing the ancient Greek sanctuary enveloped by the biological world serpent Jörmungandr.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2 pointer-events-auto">
          <button
            onClick={onExploreWork}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:brightness-110 text-slate-950 font-cinzel text-xs font-bold tracking-[0.2em] uppercase transition-all shadow-[0_0_25px_rgba(245,158,11,0.25)] flex items-center space-x-2 cursor-pointer"
          >
            <span>EXPLORE WORK</span>
            <ArrowDown size={14} />
          </button>

          <button
            onClick={handleReplayFlythrough}
            className="px-5 py-3 rounded-xl border border-amber-500/40 bg-[#080E21]/80 hover:bg-[#080E21] text-amber-300 font-cinzel text-xs font-bold tracking-wider transition-all backdrop-blur-md flex items-center space-x-2 cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>CINEMATIC ASCENT</span>
          </button>
        </div>
      </div>

      {/* 6. Cinematic Viewpoint Selector & Navigation Controls (Bottom Bar) */}
      <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-center justify-between gap-4 z-20 pointer-events-auto">
        {/* Interaction Hint */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full border border-slate-800 bg-[#080E21]/80 text-slate-400 text-xs backdrop-blur-md">
          <Compass size={13} className="text-amber-400 animate-spin-very-slow" />
          <span className="text-[11px] font-outfit text-slate-300">
            Drag to orbit 360° • Scroll to zoom • Click sanctuary thrones to explore
          </span>
        </div>

        {/* Viewpoint Pills */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 bg-[#080E21]/85 border border-amber-500/30 p-1 rounded-full backdrop-blur-xl text-xs font-cinzel shadow-[0_0_25px_rgba(245,158,11,0.12)]">
          {[
            { id: VIEWPOINTS.FLYTHROUGH, label: 'ASCENT' },
            { id: VIEWPOINTS.SANCTUARY, label: 'SANCTUARY' },
            { id: VIEWPOINTS.SERPENT, label: 'JÖRMUNGANDR' },
            { id: VIEWPOINTS.OCEAN, label: 'AEGEAN' },
            { id: VIEWPOINTS.PANORAMA, label: 'PANORAMA' }
          ].map((vp) => (
            <button
              key={vp.id}
              onClick={() => handleSelectViewpoint(vp.id)}
              className={`px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                activeView === vp.id
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {vp.label}
            </button>
          ))}
        </div>

        {/* Scroll Indicator */}
        <button
          onClick={onExploreWork}
          className="flex items-center space-x-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-[#080E21]/80 text-amber-300/80 hover:text-amber-200 hover:border-amber-400/50 transition-all text-xs font-cinzel tracking-wider backdrop-blur-md cursor-pointer"
        >
          <span>VIEW PORTFOLIO</span>
          <ChevronDown size={13} className="animate-bounce" />
        </button>
      </div>
    </section>
  );
}
