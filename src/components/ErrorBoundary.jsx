import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Terjadi kesalahan.</h2>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Muat Ulang Aplikasi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
