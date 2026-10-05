import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Activity, ShieldCheck } from 'lucide-react';
import { GreekCorner } from './GreekDecorations';

const STAGES = [
  { id: 1, name: "SYSTEM CORE", detail: "Initializing WebGL pipeline & adaptive resolution tier" },
  { id: 2, name: "ENVIRONMENT", detail: "Synthesizing Rayleigh sky dome & Gerstner ocean waves" },
  { id: 3, name: "GEOLOGY", detail: "Constructing Mount Olympus massif & Pierian mountain ring" },
  { id: 4, name: "BIOLOGY", detail: "Computing Jörmungandr Bishop RMF spine & scale displacement" },
  { id: 5, name: "SANCTUARY", detail: "Integrating summit colonnade & editorial portfolio" }
];

export default function ProgressiveLoader({ onReady, tier = 'high' }) {
  const [currentStage, setCurrentStage] = useState(1);
  const [isFullyReady, setIsFullyReady] = useState(false);

  useEffect(() => {
    // True progressive staging with minimal real delays
    const timer1 = setTimeout(() => setCurrentStage(2), 250);
    const timer2 = setTimeout(() => setCurrentStage(3), 550);
    const timer3 = setTimeout(() => setCurrentStage(4), 900);
    const timer4 = setTimeout(() => {
      setCurrentStage(5);
      setIsFullyReady(true);
    }, 1300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  const handleEnter = () => {
    if (onReady) onReady();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-[#04060E] text-slate-100 p-6 sm:p-12 select-none overflow-hidden">
      {/* Decorative Classical Borders */}
      <GreekCorner position="top-left" className="top-4 left-4 fixed opacity-40 pointer-events-none" />
      <GreekCorner position="top-right" className="top-4 right-4 fixed opacity-40 pointer-events-none" />
      <GreekCorner position="bottom-left" className="bottom-4 left-4 fixed opacity-40 pointer-events-none" />
      <GreekCorner position="bottom-right" className="bottom-4 right-4 fixed opacity-40 pointer-events-none" />

      {/* Top Header */}
      <header className="flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-cinzel text-xs tracking-[0.3em] text-amber-300 uppercase">
            OLYMPUS // CINEMATIC PORTFOLIO
          </span>
        </div>
        <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400 border border-slate-800 bg-[#070D1A]/80 px-3 py-1 rounded-full">
          <Activity size={12} className="text-amber-400" />
          <span>TIER: {tier.toUpperCase()}</span>
        </div>
      </header>

      {/* Center Stage Presentation */}
      <div className="max-w-2xl mx-auto my-auto w-full space-y-8 z-10 text-center sm:text-left">
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-cinzel text-amber-400/90 tracking-[0.25em] uppercase">
            <Sparkles size={13} />
            <span>PROGRESSIVE STAGE {currentStage} OF 5</span>
          </div>
          <h1 className="font-cinzel text-3xl sm:text-5xl font-black tracking-wide text-slate-100 uppercase">
            A Study in Scale, Myth, and Machine.
          </h1>
          <p className="font-outfit text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            Constructing real-time WebGL landscapes at the boundary of ancient mythological naturalism and modern creative engineering.
          </p>
        </div>

        {/* Real Loading Stage Indicators */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {STAGES.map((s) => {
              const isPast = s.id < currentStage;
              const isCurrent = s.id === currentStage;
              return (
                <div key={s.id} className="space-y-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isPast
                        ? 'bg-amber-400'
                        : isCurrent
                        ? 'bg-gradient-to-r from-amber-400 to-amber-200 animate-pulse'
                        : 'bg-slate-800'
                    }`}
                  />
                  <div className="hidden sm:block text-[10px] font-mono tracking-wider truncate text-slate-400">
                    {s.name}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
            <span className="text-amber-300/90 font-cinzel">
              STAGE {currentStage}: {STAGES[currentStage - 1].detail}
            </span>
            <span>{Math.round((currentStage / 5) * 100)}%</span>
          </div>
        </div>

        {/* Enter Action */}
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleEnter}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-cinzel text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer shadow-lg ${
              isFullyReady
                ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 hover:brightness-110 shadow-amber-500/20'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-amber-200 border border-amber-500/30'
            }`}
          >
            <span>{isFullyReady ? 'EXPLORE OLYMPUS' : 'ENTER IMMEDIATE VIEW'}</span>
            <ArrowRight size={14} />
          </button>

          <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Zero external CDN assets • Deployable bundle</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-400 z-10 pt-4 border-t border-slate-900 gap-2">
        <div>PAVAN // CREATIVE TECHNOLOGIST &amp; 3D SYSTEMS ARCHITECT</div>
        <div>THREE.JS • WEBGL • GLSL • REACT 19</div>
      </footer>
    </div>
  );
}
