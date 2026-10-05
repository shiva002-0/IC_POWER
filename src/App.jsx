import React, { useState, Component } from 'react';
import ProgressiveLoader from './components/ProgressiveLoader';
import FlythroughScene from './components/3d/FlythroughScene';
import EditorialPortfolio from './components/EditorialPortfolio';
import { detectDeviceTier } from './utils/performance';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Olympus ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen bg-[#04060E] flex flex-col items-center justify-center p-6 text-center z-50">
          <div className="max-w-md p-8 rounded-2xl border border-amber-500/40 bg-[#080E21]/90 backdrop-blur-xl shadow-[0_0_40px_rgba(245,158,11,0.3)]">
            <h2 className="font-cinzel text-xl text-amber-400 font-bold mb-3 tracking-wider">
              Rendering Sphere Interruption
            </h2>
            <p className="text-slate-300 text-xs mb-4 font-outfit">
              {this.state.error?.message || "An unexpected error occurred while rendering the 3D environment."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-6 py-2.5 rounded-xl font-cinzel text-xs font-bold tracking-widest text-slate-900 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-yellow-300 hover:to-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.5)] cursor-pointer"
            >
              Reload Olympus
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [selectedSection, setSelectedSection] = useState('projects');
  const [deviceTier] = useState(() => detectDeviceTier());

  const handleEnter = () => {
    setHasEntered(true);
  };

  const handleExploreWork = () => {
    setSelectedSection('projects');
    const el = document.getElementById('portfolio-content');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectSection = (section) => {
    setSelectedSection(section);
    const el = document.getElementById('portfolio-content');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleReturnTo3D = () => {
    const el = document.getElementById('scene-entrance');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <main className="w-full min-h-screen bg-[#04060E] text-slate-100 relative font-outfit">
      <ErrorBoundary>
        {!hasEntered ? (
          <ProgressiveLoader onReady={handleEnter} tier={deviceTier} />
        ) : (
          <div className="w-full flex flex-col">
            {/* 1. Cinematic 3D Scene Entrance */}
            <FlythroughScene
              onSelectSection={handleSelectSection}
              onExploreWork={handleExploreWork}
            />

            {/* 2. Seamless Editorial Portfolio Experience */}
            <EditorialPortfolio
              activeSection={selectedSection}
              onReturnTo3D={handleReturnTo3D}
            />
          </div>
        )}
      </ErrorBoundary>
    </main>
  );
}
