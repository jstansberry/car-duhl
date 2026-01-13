import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginModal = ({ onClose }) => {
    const { loginWithGoogle } = useAuth();

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <button style={styles.closeButton} onClick={onClose}>&times;</button>

                <h2 style={styles.header}>Sign In</h2>

                <div style={styles.buttonContainer}>
                    <button
                        onClick={() => { loginWithGoogle(); onClose(); }}
                        style={{ ...styles.loginButton, backgroundColor: '#4285F4' }}
                    >
                        Sign in with Google
                    </button>

                    <button
                        style={{ ...styles.loginButton, backgroundColor: '#1877F2' }}
                        disabled
                        title="Coming Soon"
                    >
                        Login with Facebook
                    </button>

                    <button
                        style={{ ...styles.loginButton, backgroundColor: '#E1306C' }}
                        disabled
                        title="Coming Soon"
                    >
                        Login with Instagram
                    </button>

                    <button
                        style={{ ...styles.loginButton, backgroundColor: '#000000' }}
                        disabled
                        title="Coming Soon"
                    >
                        Login with Apple
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(5px)'
    },
    modal: {
        backgroundColor: '#1a1a1a',
        padding: '40px 30px',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '400px', // Detailed narrower width for login
        position: 'relative',
        color: '#fff',
        border: '1px solid #333',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    closeButton: {
        position: 'absolute',
        top: '10px',
        right: '15px',
        background: 'none',
        border: 'none',
        color: '#888',
        fontSize: '24px',
        cursor: 'pointer',
        padding: '5px',
        lineHeight: 1
    },
    header: {
        marginTop: 0,
        marginBottom: '30px',
        color: '#fff',
        fontSize: '1.8rem'
    },
    buttonContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100%'
    },
    loginButton: {
        width: '100%',
        padding: '12px',
        border: 'none',
        borderRadius: '6px',
        color: 'white',
        fontSize: '1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'transform 0.1s, opacity 0.2s',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    }
};

export default LoginModal;
