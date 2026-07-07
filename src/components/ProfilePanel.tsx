import { FormEvent, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { updateProfile } from '../lib/supabase';

interface ProfilePanelProps {
  session: Session;
  onClose: () => void;
}

export default function ProfilePanel({ session, onClose }: ProfilePanelProps) {
  const [fullName, setFullName] = useState(
    String(session.user.user_metadata?.full_name || session.user.user_metadata?.name || '')
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [working, setWorking] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password && password !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setWorking(true);
    setError('');
    setNotice('');
    try {
      await updateProfile({ fullName, password: password || undefined });
      setNotice('Profile updated.');
      setPassword('');
      setConfirmPassword('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update profile.');
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="auth-card">
      <span className="auth-eyebrow">Your profile</span>
      <h1>Edit profile</h1>
      <p>{session.user.email}</p>
      <form onSubmit={submit}>
        <label htmlFor="profile-name">Display name</label>
        <input id="profile-name" type="text" autoComplete="name" value={fullName} onChange={event => setFullName(event.target.value)} />
        <label htmlFor="profile-password">New password</label>
        <input id="profile-password" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} minLength={6} placeholder="Leave blank to keep current password" />
        <label htmlFor="profile-confirm-password">Confirm new password</label>
        <input id="profile-confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} minLength={6} />
        {error && <p className="auth-error" role="alert">{error}</p>}
        {notice && <p className="auth-error" style={{ color: '#c7f0c0', borderColor: 'rgba(140,220,120,.3)', background: 'rgba(60,120,40,.16)' }}>{notice}</p>}
        <button type="submit" disabled={working}>{working ? 'Saving...' : 'Save changes'}</button>
        <button type="button" className="auth-secondary" onClick={onClose}>Back to store</button>
      </form>
    </div>
  );
}
