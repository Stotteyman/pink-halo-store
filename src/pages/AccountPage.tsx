import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCurrentUserRole, supabaseClient, signInWithEmail, signUpWithEmail, signInWithGoogle, signOutSupabase, updateProfile } from '../lib/supabase';

const STAFF_ROLES = ['staff', 'manager', 'admin', 'superadmin'];

export default function AccountPage() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string>('guest');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabaseClient) return;
    supabaseClient.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabaseClient.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) { setRole('guest'); return; }
    fetchCurrentUserRole()
      .then((data) => setRole(String(data?.current_role || session.user?.app_metadata?.role || 'customer')))
      .catch(() => setRole(String(session.user?.app_metadata?.role || 'customer')));
  }, [session]);

  const isStaff = STAFF_ROLES.includes(role.toLowerCase());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMessage(null);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password);
        setMessage('Account created. Check your email to confirm, then sign in.');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setMessage(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!supabaseClient) {
    return (
      <section className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="overline text-gold mb-3">Pink Halo Co.</p>
        <h1 className="font-serif font-medium text-ink text-3xl mb-3">Accounts coming soon</h1>
        <p className="text-[15px] text-ink-soft">You can shop as a guest — no account needed. Just add to bag and check out.</p>
      </section>
    );
  }

  if (session?.user) {
    return <SignedInAccount session={session} role={role} isStaff={isStaff} />;
  }

  return (
    <section className="max-w-md mx-auto px-4 py-14 lg:py-20">
      <p className="overline text-gold text-center mb-3">Pink Halo Co.</p>
      <h1 className="font-serif font-medium text-ink text-4xl text-center mb-2">{mode === 'signin' ? 'Sign In' : 'Create Account'}</h1>
      <p className="text-center text-ink-soft text-sm mb-9">{mode === 'signin' ? 'Welcome back to Pink Halo' : 'Join Pink Halo & start earning rewards'}</p>

      <button onClick={() => signInWithGoogle().catch((e) => setMessage(e?.message || 'Google sign-in failed'))}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 border border-hairline bg-white text-ink text-[12px] font-semibold uppercase tracking-[0.14em] hover:border-ink transition-colors mb-4">
        <span className="font-bold text-[#4285F4]">G</span> Continue with Google
      </button>

      <div className="flex items-center gap-3 my-5 text-[10px] uppercase tracking-[0.2em] text-ink-soft"><span className="flex-1 h-px bg-hairline" />or<span className="flex-1 h-px bg-hairline" /></div>

      <form onSubmit={submit} className="space-y-3">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
          className="w-full px-4 py-3.5 border border-hairline bg-white text-ink text-sm outline-none focus:border-rose" />
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
          className="w-full px-4 py-3.5 border border-hairline bg-white text-ink text-sm outline-none focus:border-rose" />
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      {message && <p className="text-sm text-center text-rose mt-4">{message}</p>}

      <p className="text-center text-sm text-ink-soft mt-7">
        {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
        <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(null); }} className="font-semibold text-rose hover:underline underline-offset-4">
          {mode === 'signin' ? 'Create one' : 'Sign in'}
        </button>
      </p>
    </section>
  );
}

function SignedInAccount({ session, role, isStaff }: { session: any; role: string; isStaff: boolean }) {
  const user = session.user;
  const displayName = user.user_metadata?.full_name || user.email;
  const [showSettings, setShowSettings] = useState(false);
  const [fullName, setFullName] = useState(String(user.user_metadata?.full_name || ''));
  const [phone, setPhone] = useState(String(user.user_metadata?.phone || ''));
  const [newPassword, setNewPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        ...(newPassword ? { password: newPassword } : {}),
      });
      setNewPassword('');
      setProfileMessage({ kind: 'ok', text: 'Profile saved.' });
    } catch (err: any) {
      setProfileMessage({ kind: 'err', text: err?.message || 'Could not save your profile.' });
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <section className="max-w-lg mx-auto px-4 py-14 lg:py-20">
      <p className="overline text-gold mb-3">Pink Halo Co.</p>
      <h1 className="font-serif font-medium text-ink text-4xl mb-2">My Account</h1>
      <div className="flex items-center justify-between gap-4 mb-8">
        <p className="text-[15px] text-ink-soft">Signed in as <span className="font-semibold text-ink">{displayName}</span></p>
        <button onClick={() => { setShowSettings(!showSettings); setProfileMessage(null); }} className="btn-ghost whitespace-nowrap">
          {showSettings ? 'Close settings' : 'Settings'}
        </button>
      </div>

      {showSettings && (
        <form onSubmit={saveProfile} className="border border-hairline bg-white p-6 mb-6 space-y-4">
          <p className="font-serif text-lg text-ink">Profile settings</p>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft mb-1.5">Display name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name"
              className="w-full px-4 py-3 border border-hairline bg-white text-ink text-sm outline-none focus:border-rose" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft mb-1.5">Phone number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555"
              className="w-full px-4 py-3 border border-hairline bg-white text-ink text-sm outline-none focus:border-rose" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft mb-1.5">Email</label>
            <input value={user.email || ''} disabled className="w-full px-4 py-3 border border-hairline bg-shell/50 text-ink-soft text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft mb-1.5">New password <span className="normal-case font-normal">(leave blank to keep current)</span></label>
            <input type="password" minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••"
              className="w-full px-4 py-3 border border-hairline bg-white text-ink text-sm outline-none focus:border-rose" />
          </div>
          {profileMessage && (
            <p className={`text-sm ${profileMessage.kind === 'ok' ? 'text-green-700' : 'text-rose'}`}>{profileMessage.text}</p>
          )}
          <button type="submit" disabled={savingProfile} className="btn-primary">
            {savingProfile ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      )}

      {isStaff && (
        <div className="border border-rose/40 bg-white p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="overline text-gold mb-1">{role === 'superadmin' ? 'CEO / Owner' : 'Staff'}</p>
              <p className="font-serif text-lg text-ink">Store Administration</p>
              <p className="text-sm text-ink-soft">Dashboard, orders &amp; revenue, products, discounts, and team roles.</p>
            </div>
            <Link to="/admin" className="btn-primary text-center whitespace-nowrap">Open Admin Dashboard</Link>
          </div>
        </div>
      )}

      <div className="border border-hairline bg-white p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-serif text-lg text-ink">Rewards balance</p>
            <p className="text-sm text-ink-soft">Earn 1 point per $1 spent</p>
          </div>
          <span className="font-serif font-medium text-3xl text-rose">0 pts</span>
        </div>
        <div className="border-t border-hairline pt-5">
          <p className="font-serif text-lg text-ink mb-1">Track an order</p>
          <p className="text-sm text-ink-soft">Order confirmations are emailed with a tracking link once your order ships. Contact us any time for help.</p>
        </div>
      </div>
      <button onClick={() => signOutSupabase()} className="btn-ghost mt-6">Sign out</button>
    </section>
  );
}
