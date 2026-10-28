import React, { useState } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import DashboardView from './components/views/DashboardView';
import PowerAnalysisView from './components/views/PowerAnalysisView';
import OptimizationLabView from './components/views/OptimizationLabView';
import ScenarioComparisonView from './components/views/ScenarioComparisonView';
import ExperimentHistoryView from './components/views/ExperimentHistoryView';
import ErrorBoundary from './components/common/ErrorBoundary';

/**
 * Main Application Component
 * Phase 1 Foundation: Navigation, Responsive Dashboard Shell, and View Routing.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loadedExperiment, setLoadedExperiment] = useState(null);

  const handleReopenExperiment = (experiment) => {
    setLoadedExperiment(experiment);
    setActiveTab('ai-optimization');
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveTab} />;
      case 'power-analysis':
        return <PowerAnalysisView onNavigate={setActiveTab} />;
      case 'ai-optimization':
        return (
          <OptimizationLabView
            onNavigate={setActiveTab}
            loadedExperiment={loadedExperiment}
            onClearLoadedExperiment={() => setLoadedExperiment(null)}
          />
        );
      case 'scenario-comparison':
        return <ScenarioComparisonView onNavigate={setActiveTab} />;
      case 'experiment-history':
        return (
          <ExperimentHistoryView
            onNavigate={setActiveTab}
            onReopenExperiment={handleReopenExperiment}
          />
        );
      default:
        return <DashboardView onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans eda-grid-bg selection:bg-cyan-500/20 selection:text-cyan-900">
      {/* 1. Engineering Header */}
      <Header />

      {/* 2. Workspace Body: Responsive Sidebar + View Area */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-h-[calc(100vh-65px)]">
          <ErrorBoundary key={activeTab} onReset={() => setActiveTab('dashboard')}>
            {renderActiveView()}
          </ErrorBoundary>
        </main>
      </div>

      {/* 3. Engineering Status Footer */}
      <Footer />
    </div>
  );
}
