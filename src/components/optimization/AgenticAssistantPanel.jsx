import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Play,
  Loader2,
} from 'lucide-react';
import AgentActivityTimeline from './AgentActivityTimeline.jsx';
import { runDeterministicAgentWorkflow } from '../../utils/agentTools.js';

/**
 * AgenticAssistantPanel Component
 * Interactive natural-language AI agent panel with:
 * - Natural language goal parsing
 * - Server-side LLM tool calling (Gemini / OpenAI)
 * - Deterministic fallback workflow execution
 * - Live step-by-step activity timeline
 * - Independent verification gating
 */
export default function AgenticAssistantPanel({ baseline, constraints, onApplyCandidate }) {
  const [goalInput, setGoalInput] = useState(
    'Reduce dynamic power below 0.35 mW for a 20 pF block while keeping clock frequency at least 80 MHz.'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [activeStepText, setActiveStepText] = useState('');
  const [runResult, setRunResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [serverStatus, setServerStatus] = useState({
    isConfigured: false,
    provider: 'checking',
    model: '',
  });

  const [setupNotice, setSetupNotice] = useState(null);

  // Check server LLM credential status on mount
  useEffect(() => {
    fetch('/api/agent/status')
      .then((res) => (res.ok ? res.json() : { isConfigured: false, provider: 'none' }))
      .then((data) => setServerStatus(data))
      .catch(() => setServerStatus({ isConfigured: false, provider: 'offline' }));
  }, []);

  const sampleGoals = [
    {
      label: 'Balanced DVFS (0.35 mW)',
      text: 'Reduce dynamic power below 0.35 mW for a 20 pF block while keeping clock frequency at least 80 MHz.',
    },
    {
      label: 'Maximize Clock Speed under 0.40 mW',
      text: 'Meet power budget of 0.400 mW while keeping clock frequency as high as possible.',
    },
    {
      label: 'Voltage Scaling Only (0.50 mW)',
      text: 'Optimize supply voltage down to 0.8 V under 0.50 mW without frequency tuning.',
    },
    {
      label: 'Stress Test Unfeasible Budget (0.10 mW)',
      text: 'Achieve power budget of 0.100 mW with minimum clock frequency of 90 MHz.',
    },
  ];

  const handleRunAgent = async (mode = 'deterministic') => {
    if (!goalInput.trim()) return;

    if (mode === 'llm' && !serverStatus.isConfigured) {
      setSetupNotice(true);
      setErrorMessage(null);
      return;
    }

    setIsRunning(true);
    setErrorMessage(null);
    setSetupNotice(false);
    setRunResult(null);
    setActiveStepText(
      mode === 'llm'
        ? 'Connecting to server LLM orchestrator & formulating plan...'
        : 'Formulating agent task plan & preparing verified tools...'
    );

    try {
      let data;
      try {
        const response = await fetch('/api/agent/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goal: goalInput,
            baseline,
            constraints,
            mode,
          }),
        });

        if (response.ok) {
          data = await response.json();
        } else if (response.status === 404 && mode === 'deterministic') {
          // Static hosting fallback (e.g. GitHub Pages): run local deterministic workflow
          data = await runDeterministicAgentWorkflow({ goal: goalInput, baseline, constraints });
        } else {
          try {
            data = await response.json();
          } catch {
            data = { success: false, error: `HTTP ${response.status} response from agent server.` };
          }
        }
      } catch (fetchErr) {
        if (mode === 'deterministic') {
          // Network offline fallback
          data = await runDeterministicAgentWorkflow({ goal: goalInput, baseline, constraints });
        } else {
          throw fetchErr;
        }
      }

      if (data && data.success === false) {
        if (data.code === 'MISSING_CREDENTIALS') {
          setSetupNotice(true);
        } else {
          setErrorMessage(data.error || data.message || 'Agent execution encountered an error.');
        }
        if (data.timeline) {
          setRunResult(data);
        }
      } else if (data) {
        setRunResult(data);
      }
    } catch (err) {
      setErrorMessage(`Network or server error: ${err.message}`);
    } finally {
      setIsRunning(false);
      setActiveStepText('');
    }
  };

  const handleReset = () => {
    setRunResult(null);
    setErrorMessage(null);
    setSetupNotice(false);
  };

  return (
    <div className="ic-card p-5 bg-white border border-slate-200 shadow-sm space-y-5">
      {/* 1. Header with Server Credentials Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-600 shadow-2xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              Autonomous Agentic AI Optimization Assistant
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Natural Language Goal Extraction &bull; Multi-Turn Tool Calling &bull; Independent Verification
            </p>
          </div>
        </div>

        {/* Server AI Status Badge */}
        <div className="flex items-center gap-2">
          {serverStatus.isConfigured ? (
            <span className="text-[11px] font-mono font-semibold px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Server AI: Active ({serverStatus.provider.toUpperCase()} &bull; {serverStatus.model})</span>
            </span>
          ) : (
            <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5 shadow-2xs">
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>Server AI Key: Unset (Deterministic Mode Ready)</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Beginner-Friendly Info Banner if Key is Unset */}
      {!serverStatus.isConfigured && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0" />
            <span>Deterministic Agent Workflow Is Fully Operational (Zero API Key Required)</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            You can immediately run the <strong>Deterministic Agent Workflow</strong> below. The agent will formulate a plan, execute all 5 verified mathematical tools, independently verify constraints, and record the run.
          </p>
          <p className="text-slate-500 text-[10px] font-mono pt-1 border-t border-slate-200/80">
            To enable live autonomous LLM calling: copy <code>.env.example</code> to <code>.env</code> in the project root and add <code>GEMINI_API_KEY=your_key</code>. Credentials remain on the server and are never sent to the browser.
          </p>
        </div>
      )}

      {/* 3. Goal Input Field & Sample Prompt Chips */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-800 block">
          Describe Optimization Objective in Plain Engineering Language:
        </label>
        <div className="relative">
          <textarea
            rows="2"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            placeholder="e.g. Reduce dynamic power below 0.35 mW for a 20 pF block while keeping clock frequency at least 80 MHz."
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-mono text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 resize-none"
          />
        </div>

        {/* Quick Sample Goal Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1">
            Presets:
          </span>
          {sampleGoals.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => setGoalInput(sample.text)}
              className="px-2 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-mono transition-colors cursor-pointer"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Action Buttons */}
      <div className="flex items-center gap-3 flex-wrap pt-1">
        {/* Run Deterministic Workflow Button (Always available) */}
        <button
          onClick={() => handleRunAgent('deterministic')}
          disabled={isRunning}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-300 text-white font-mono font-semibold text-xs transition-colors cursor-pointer shadow-2xs flex items-center gap-2"
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          <span>Run Deterministic Agent Workflow</span>
        </button>

        {/* Run Live LLM Agent Button */}
        <button
          onClick={() => handleRunAgent('llm')}
          disabled={isRunning}
          title={serverStatus.isConfigured ? 'Invoke server LLM agent' : 'Requires API key in .env'}
          className={`px-4 py-2 rounded-xl font-mono font-semibold text-xs transition-colors cursor-pointer shadow-2xs flex items-center gap-2 ${
            serverStatus.isConfigured
              ? 'bg-slate-900 hover:bg-slate-800 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Run Autonomous AI Agent (LLM)</span>
        </button>

        {runResult && (
          <button
            onClick={handleReset}
            disabled={isRunning}
            className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 font-mono text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}

        {isRunning && (
          <span className="text-xs font-mono text-cyan-700 animate-pulse flex items-center gap-1.5 ml-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <span>{activeStepText}</span>
          </span>
        )}
      </div>

      {/* 5. Missing Credentials Setup Notice */}
      {setupNotice && (
        <div className="p-4 rounded-xl bg-cyan-50/80 border border-cyan-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-900 font-semibold text-xs">
              <KeyRound className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>Autonomous LLM Mode: API Key Configuration</span>
            </div>
            <button
              onClick={() => setSetupNotice(false)}
              className="text-[11px] font-mono text-cyan-700 hover:text-cyan-900 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            No AI API key was found in your server's <code className="font-mono bg-white px-1 py-0.5 rounded border border-cyan-200">.env</code> file. To connect live autonomous LLM reasoning, add:
          </p>
          <div className="p-2.5 rounded-lg bg-white border border-cyan-200 font-mono text-xs text-slate-900 select-all shadow-2xs">
            GEMINI_API_KEY=your_gemini_api_key_here
          </div>
          <p className="text-[11px] text-slate-600">
            You do <strong>not</strong> need an API key to run this lab. Click below to run the verified <strong>Deterministic Agent Workflow</strong>, which executes all 5 engineering tools and independent verification.
          </p>
          <div className="pt-1">
            <button
              onClick={() => {
                setSetupNotice(false);
                handleRunAgent('deterministic');
              }}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-mono text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Run Deterministic Agent Workflow Instead &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. Error Alert Box */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
          <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Agent Notice</span>
          </div>
          <p className="text-xs text-amber-800 font-mono leading-relaxed pl-6">
            {errorMessage}
          </p>
        </div>
      )}

      {/* 6. Active Execution Activity Timeline */}
      {runResult && (
        <AgentActivityTimeline
          runResult={runResult}
          onApplyCandidate={onApplyCandidate}
        />
      )}
    </div>
  );
}
