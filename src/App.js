import React from 'react';
import './index.css';
import GameContainer from './components/GameContainer';
import ProofSheet from './components/ProofSheet';

function App() {
    const [path, setPath] = React.useState(window.location.pathname);

    React.useEffect(() => {
        const handlePopState = () => {
            setPath(window.location.pathname);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Also listen for a custom pushState event if we want to change routes programmatically
    // or just check path.

    // Simple Router
    let component;
    if (path === '/proof-sheet') {
        component = <ProofSheet />;
    } else {
        component = <GameContainer />;
    }

    return (
        <div className="App">
            {component}
        </div>
    );
}

export default App;
