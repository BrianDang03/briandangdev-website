import { Component } from 'react';
import "./ActionButton.css";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <section className="page-shell error-boundary">
                    <h1>Something went wrong</h1>
                    <p>We encountered an unexpected error. Please try refreshing the page.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="card-action-btn"
                        style={{ marginTop: '1rem' }}
                    >
                        Refresh Page
                    </button>
                </section>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
