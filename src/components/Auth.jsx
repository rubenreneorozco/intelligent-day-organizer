import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for the login link! Or if email confirmation is disabled in Supabase, you can just log in now.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, textAlign: 'center', marginBottom: '2rem' }}>
          Token<span style={{ color: 'var(--color-accent)' }}>.</span>
        </h1>
        
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          {isSignUp ? 'Create an Account' : 'Welcome Back'}
        </h2>

        {error && (
          <div style={errorStyle}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={inputWrapperStyle}>
            <Mail size={18} style={iconStyle} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div style={inputWrapperStyle}>
            <Lock size={18} style={iconStyle} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem' }}>
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 600 }}
          >
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: 'var(--color-bg-main)',
  padding: '2rem'
};

const cardStyle = {
  backgroundColor: 'var(--color-bg-card)',
  padding: '3rem',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-lg)',
  width: '100%',
  maxWidth: '400px',
  border: '1px solid var(--color-border)'
};

const inputWrapperStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center'
};

const iconStyle = {
  position: 'absolute',
  left: '1rem',
  color: 'var(--color-text-muted)'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem 0.75rem 3rem',
  backgroundColor: 'var(--color-bg-secondary)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text-primary)',
  outline: 'none',
  fontSize: '1rem'
};

const errorStyle = {
  backgroundColor: 'rgba(230, 57, 70, 0.1)',
  color: 'var(--color-accent)',
  padding: '0.75rem',
  borderRadius: 'var(--radius-sm)',
  marginBottom: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.875rem'
};
