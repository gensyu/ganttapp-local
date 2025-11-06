import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          fontFamily: 'sans-serif',
          color: '#d32f2f',
          backgroundColor: '#fff',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <h1 style={{ marginBottom: '20px', fontSize: '24px' }}>アプリケーションエラー</h1>
          <div style={{
            backgroundColor: '#ffebee',
            border: '1px solid #d32f2f',
            borderRadius: '4px',
            padding: '20px',
            maxWidth: '800px',
            width: '100%',
          }}>
            <h2 style={{ marginTop: 0, fontSize: '18px' }}>エラーメッセージ:</h2>
            <p style={{ 
              backgroundColor: '#fff',
              padding: '10px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              wordBreak: 'break-word',
            }}>
              {this.state.error?.message || 'Unknown error'}
            </p>
            {this.state.errorInfo && (
              <>
                <h3 style={{ marginTop: '20px', fontSize: '16px' }}>スタックトレース:</h3>
                <pre style={{
                  backgroundColor: '#fff',
                  padding: '10px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '400px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {this.state.error?.stack}
                </pre>
                <h3 style={{ marginTop: '20px', fontSize: '16px' }}>コンポーネントスタック:</h3>
                <pre style={{
                  backgroundColor: '#fff',
                  padding: '10px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ページを再読み込み
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

