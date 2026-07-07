import { FormEvent, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { signInWithEmail, signInWithGoogle, signOutSupabase, signUpWithEmail } from '../lib/supabase';

type Mode = 'signin' | 'signup';

interface AccountPanelProps {
  session: Session | null;
  configured: boolean;
  onClose: () => void;
}

export default function AccountPanel({ session, configured, onClose }: AccountPanelProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [working, setWorking] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setWorking(true);
    setError('');
    setNotice('');
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password);
        setNotice('Account created. Check your inbox to confirm your email if required.');
      } else {
        await signInWithEmail(email, password);
      }
      setPassword('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to complete that request.');
    } finally {
      setWorking(false);
    }
  }

  async function google() {
    setError('');
    try {
      await signInWithGoogle();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to continue with Google.');
    }
  }

  async function logout() {
    setWorking(true);
    try {
      await signOutSupabase();
    } finally {
      setWorking(false);
    }
  }

  if (!configured) {
    return (
      <div className="auth-card">
        <span className="auth-eyebrow">Accounts</span>
        <h1>Coming soon</h1>
        <p>Customer accounts need a connected Supabase project. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable sign in.</p>
        <button type="button" onClick={onClose}>Back to store</button>
      </div>
    );
  }

  if (session) {
    return (
      <div className="auth-card">
        <span className="auth-eyebrow">Your account</span>
        <h1>Signed in</h1>
        <p>{session.user.email}</p>
        <button type="button" onClick={logout} disabled={working}>{working ? 'Signing out...' : 'Log out'}</button>
        <button type="button" className="auth-secondary" onClick={onClose}>Back to store</button>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <span className="auth-eyebrow">{mode === 'signin' ? 'Welcome back' : 'Join Pink Halo'}</span>
      <h1>{mode === 'signin' ? 'Log in' : 'Create account'}</h1>
      <p>{mode === 'signin' ? 'Sign in to see your bag, rewards, and orders.' : 'Save your details for faster checkout and rewards.'}</p>
      <form onSubmit={submit}>
        <label htmlFor="account-email">Email</label>
        <input id="account-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required autoFocus />
        <label htmlFor="account-password">Password</label>
        <input id="account-password" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={event => setPassword(event.target.value)} minLength={6} required />
        {error && <p className="auth-error" role="alert">{error}</p>}
        {notice && <p className="auth-error" style={{ color: '#c7f0c0', borderColor: 'rgba(140,220,120,.3)', background: 'rgba(60,120,40,.16)' }}>{notice}</p>}
        <button type="submit" disabled={working}>{working ? 'Please wait...' : mode === 'signin' ? 'Log in' : 'Create account'}</button>
        <div className="auth-divider"><span>or</span></div>
        <button type="button" className="auth-google" onClick={google}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.42l-3.24-2.52c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.06v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.9a6.02 6.02 0 0 1 0-3.8V7.5H3.06a10 10 0 0 0 0 9l3.34-2.6Z"/><path fill="#EA4335" d="M12 5.98c1.47 0 2.8.51 3.84 1.5l2.88-2.89A9.67 9.67 0 0 0 12 2a10 10 0 0 0-8.94 5.5l3.34 2.6c.79-2.36 3-4.12 5.6-4.12Z"/></svg>
          Continue with Google
        </button>
        <button type="button" className="auth-secondary" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setNotice(''); }}>
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </form>
    </div>
  );
}
