import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const { user, loginWithGoogle, logout, isAdmin } = useAuth();

    return (
        <div style={styles.container}>
            {user ? (
                <div style={styles.userInfo}>
                    <span style={styles.welcome}>Welcome, {user.email}</span>
                    {isAdmin && (
                        <a href="/proof-sheet" style={{ textDecoration: 'none' }}>
                            <span style={styles.badge}>ADMIN</span>
                        </a>
                    )}
                    <button onClick={logout} style={styles.button}>Sign Out</button>
                </div>
            ) : (
                <button onClick={loginWithGoogle} style={styles.googleButton}>
                    Sign in with Google
                </button>
            )}
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        alignItems: 'center',
        padding: '10px'
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: '#fff',
        fontSize: '0.9rem'
    },
    welcome: {
        color: '#ccc'
    },
    badge: {
        backgroundColor: '#e94560',
        color: 'white',
        fontSize: '0.7rem',
        padding: '2px 6px',
        borderRadius: '4px',
        fontWeight: 'bold'
    },
    button: {
        background: 'transparent',
        border: '1px solid #666',
        color: '#fff',
        padding: '5px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.8rem'
    },
    googleButton: {
        backgroundColor: '#4285F4',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.9rem'
    }
};

export default Login;
