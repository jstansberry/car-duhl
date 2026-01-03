import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const { user, loginWithGoogle, logout, isAdmin, profile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getInitials = (name) => {
        if (!name) return user?.email?.charAt(0).toUpperCase() || '?';
        return name.charAt(0).toUpperCase();
    };

    if (!user) {
        return (
            <button onClick={loginWithGoogle} style={styles.googleButton}>
                Sign in with Google
            </button>
        );
    }

    // Use profile name if available, fallback to email
    const displayName = profile?.full_name || user.email;
    const initial = getInitials(profile?.full_name);
    const avatarUrl = profile?.avatar_url;

    return (
        <div style={styles.container} ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={styles.avatarButton}
                title={displayName}
            >
                {avatarUrl ? (
                    <img src={avatarUrl} alt="User" style={styles.avatarImage} />
                ) : (
                    <div style={styles.avatarPlaceholder}>{initial}</div>
                )}
            </div>

            {isOpen && (
                <div style={styles.dropdown}>
                    <div style={styles.userInfo}>
                        <div style={styles.userName}>{displayName}</div>
                        <div style={styles.userEmail}>{user.email}</div>
                    </div>

                    <div style={styles.divider} />

                    {isAdmin && (
                        <a href="/proof-sheet" style={styles.menuItem}>
                            Admin Dashboard
                        </a>
                    )}

                    <button onClick={logout} style={styles.menuItemButton}>
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        position: 'relative',
        display: 'inline-block',
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
    },
    avatarButton: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        cursor: 'pointer',
        overflow: 'hidden',
        border: '2px solid #555',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e94560', // Site theme color
        transition: 'border-color 0.2s'
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    avatarPlaceholder: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '1rem'
    },
    dropdown: {
        position: 'absolute',
        top: '40px',
        right: '0',
        backgroundColor: '#222',
        border: '1px solid #444',
        borderRadius: '8px',
        width: '200px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        zIndex: 1000,
        overflow: 'hidden',
        padding: '5px 0'
    },
    userInfo: {
        padding: '10px 15px',
        textAlign: 'center'
    },
    userName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        marginBottom: '2px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    userEmail: {
        color: '#aaa',
        fontSize: '0.75rem',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    divider: {
        height: '1px',
        backgroundColor: '#444',
        margin: '5px 0'
    },
    menuItem: {
        display: 'block',
        padding: '10px 15px',
        color: '#ccc',
        textDecoration: 'none',
        fontSize: '0.9rem',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    },
    menuItemButton: {
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '10px 15px',
        backgroundColor: 'transparent',
        border: 'none',
        color: '#ccc', // Match other menu items
        fontSize: '0.9rem',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    }
};

export default Login;
