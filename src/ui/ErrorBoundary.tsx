import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render and lazy-chunk-load failures so a crash shows a recoverable
 * message instead of a blank screen. Progress is persisted separately, so a
 * reload is always a safe recovery path.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Intentionally no remote reporting: the app is local-only. The error is
    // kept on the rendered boundary for the user to act on, and logged to the
    // console for the person helping them.
    console.error('Unhandled render error', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="empty">
          <span className="empty-emoji" aria-hidden="true">
            😕
          </span>
          <h2>Something went wrong</h2>
          <p>This screen could not be displayed. Your study progress is safe on this device.</p>
          <button
            type="button"
            className="btn"
            onClick={() => window.location.reload()}
          >
            Reload the app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}