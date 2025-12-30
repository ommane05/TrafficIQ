import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import "./index.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          fontFamily: 'system-ui, sans-serif',
          background: '#1a1a2e',
          color: '#fff',
          minHeight: '100vh'
        }}>
          <h1 style={{ color: '#ff6b6b' }}>Something went wrong</h1>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px' }}>
            <summary style={{ cursor: 'pointer', color: '#4ecdc4' }}>Click to see error details</summary>
            <pre style={{
              background: '#16213e',
              padding: '20px',
              borderRadius: '8px',
              marginTop: '10px',
              overflow: 'auto',
              fontSize: '14px'
            }}>
              {this.state.error && this.state.error.toString()}
              {'\n\n'}
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: '#4ecdc4',
              border: 'none',
              borderRadius: '8px',
              color: '#1a1a2e',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Enhanced React rendering with StrictMode and ErrorBoundary
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Router>
        <App />
      </Router>
    </ErrorBoundary>
  </React.StrictMode>
);
