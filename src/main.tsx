import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
class ErrorBoundary extends React.Component<{
    children: React.ReactNode;
}, {
    error: Error | null;
}> {
    state: {
        error: Error | null;
    } = { error: null };
    static getDerivedStateFromError(error: Error) { return { error }; }
    render() { return this.state.error ? <div className="boot-screen"><h1>这页没有顺利打开</h1><p>已经保存的阅读记录不会受影响。</p><button className="ui-button ui-button--default" onClick={() => location.reload()}>重新打开</button><details className="source-note"><summary>错误信息</summary><pre>{this.state.error.message}</pre></details></div> : this.props.children; }
}
const root = document.getElementById('root');
if (!root)
    throw new Error('Missing root element');
createRoot(root).render(<React.StrictMode><ErrorBoundary><App /></ErrorBoundary></React.StrictMode>);
