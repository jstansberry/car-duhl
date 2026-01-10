import React, { useState } from 'react';
import Login from './Login';
import HelpModal from './HelpModal';

const Header = () => {
    const [showHelp, setShowHelp] = useState(false);

    return (
        <header className="app-header">
            <div className="header-container">
                {/* Left: Logo/Title */}
                <a href="/" className="header-left-link">
                    <div className="header-left">
                        <h1 className="header-title">MY DAILY GARAGE</h1>
                        <span className="header-subtitle">A new car in your garage every day!</span>
                    </div>
                </a>

                {/* Right: Help & User Menu */}
                <div className="header-right">
                    <button
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#333',
                            color: '#fff',
                            border: 'none',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s, transform 0.1s'
                        }}
                        onClick={() => setShowHelp(true)}
                        title="How to Play"
                    >
                        ?
                    </button>
                    <Login />
                </div>
            </div>

            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        </header>
    );
};

export default Header;
