import { Component } from 'react';
import styles from './errorBoundary.module.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Surfaced in the console for debugging; swap for a logging service later.
    console.error('Unhandled UI error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.replace('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.fallback}>
          <div className={styles.card}>
            <span className={styles.emoji}>🍕</span>
            <h1>Something slipped off the pizza.</h1>
            <p>An unexpected error broke this view. Reloading usually sorts it out.</p>
            <button className={styles.button} onClick={this.handleReload}>
              Back to the kitchen
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
