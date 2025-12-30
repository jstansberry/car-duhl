import React from 'react';
import './index.css';
import GameContainer from './components/GameContainer';
import ProofSheet from './components/ProofSheet';

function App() {
    const path = window.location.pathname;

    if (path === '/proof-sheet') {
        return <ProofSheet />;
    }

    return (
        <div className="App">
            <GameContainer />
        </div>
    );
}

export default App;
