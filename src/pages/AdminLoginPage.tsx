import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface AdminLoginPageProps {
  onLogin: () => void;
  adminPassword: string;
}

export default function AdminLoginPage({ onLogin, adminPassword }: AdminLoginPageProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === adminPassword) {
      onLogin();
      navigate('/admin');
    } else {
      setError('Invalid password');
      setPassword('');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 bg-[radial-gradient(circle_at_top_left,rgba(255,95,162,0.12),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(248,200,220,0.14),transparent_18%),linear-gradient(180deg,#fff3ee_0%,#ffe7f0_50%,#fff9fb_100%)]">
      <div className="max-w-md w-full border border-pink-200 rounded-2xl bg-white/90 p-8">
        <h1 className="text-3xl font-serif font-bold text-pink-900 mb-2">Admin Login</h1>
        <p className="text-pink-700 mb-8">Manage your store</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-pink-900 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition font-semibold"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
