import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

/**
 * Robust React Error Boundary
 * Prevents blank white screen crashes by catching render errors in any module,
 * logging diagnostic details, and displaying an engineering-grade recovery UI.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log diagnostics for engineering inspection
    console.error('[OLYMPUS Error Boundary] Caught unhandled view exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-3xl mx-auto my-8 p-6 bg-white border border-rose-200 rounded-xl shadow-sm space-y-4 font-sans">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-slate-900">
                Module Encountered an Unexpected Runtime Error
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                The application prevented a full dashboard crash. The error details below have been captured for diagnosis.
              </p>
            </div>
          </div>

          {this.state.error && (
            <div className="p-3 rounded-lg bg-slate-900 text-rose-300 font-mono text-xs overflow-x-auto">
              <p className="font-semibold text-rose-400 mb-1">
                {this.state.error.name}: {this.state.error.message}
              </p>
              {this.state.error.stack && (
                <pre className="text-[11px] text-slate-400 whitespace-pre-wrap leading-tight">
                  {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                </pre>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-mono text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Component</span>
            </button>
            <button
              onClick={() => {
                this.handleReset();
                if (typeof window !== 'undefined') {
                  window.location.hash = '';
                  window.location.reload();
                }
              }}
              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-slate-500" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
