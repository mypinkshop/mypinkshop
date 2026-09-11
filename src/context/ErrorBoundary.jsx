import { Component } from 'react';

// Global safety net: React error boundaries can only be class components.
// This wraps the entire app (see App.jsx) so that ANY uncaught render error,
// anywhere on any page, shows a friendly recovery screen instead of a blank
// white page. This is the same pattern Amazon/Flipkart/every major
// e-commerce site uses — a crash on one page should never leave the user
// stuck looking at nothing with no way forward.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log for debugging. If you add an error-tracking service (Sentry,
    // LogRocket, etc.) later, report it here too.
    console.error('🔴 App crashed:', error, errorInfo);
  }

  handleReload = () => {
    // Full navigation (not client-side routing) — guarantees a fresh
    // index.html + correct current JS bundle, clearing whatever state
    // caused the crash.
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to bottom right, #fdf2f8, #ffffff, #fff1f2)',
            padding: '24px',
            textAlign: 'center',
            fontFamily: 'inherit',
          }}
        >
          <div>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>😔</div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
              Oops! Something went wrong.
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              We're sorry for the trouble. Please try refreshing the page.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                background: 'linear-gradient(to right, #ec4899, #f43f5e)',
                color: 'white',
                padding: '12px 32px',
                borderRadius: '9999px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                fontSize: '15px',
              }}
            >
              Go to Homepage
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
