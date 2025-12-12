import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.state.errorInfo = errorInfo;
    }

    handleReset = () => {
        localStorage.clear();
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', fontFamily: 'sans-serif', color: '#333' }}>
                    <h1 style={{ color: '#dc2626' }}>Something went wrong.</h1>
                    <p>The application crashed. Here is the error:</p>
                    <pre style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                    <div style={{ marginTop: '2rem' }}>
                        <p>If this persists, try clearing the local data:</p>
                        <button
                            onClick={this.handleReset}
                            style={{
                                background: '#4f46e5', color: 'white', border: 'none',
                                padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            Reset App Data
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
