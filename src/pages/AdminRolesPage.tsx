import { useEffect, useState } from 'react';
import { fetchUserRoles, updateUserRole } from '../lib/supabase';
import type { PHUserRole } from '../lib/types';

const ROLE_LABELS: Record<string, string> = {
  customer: 'Customer',
  staff: 'Staff',
  manager: 'Manager',
  admin: 'Admin',
  superadmin: 'CEO / Superadmin',
};

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<PHUserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState('guest');

  const loadRoles = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchUserRoles();
      setRoles(Array.isArray(data.roles) ? data.roles : []);
      if (data.current_role) setCurrentRole(String(data.current_role));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const canUpdate = ['manager', 'admin', 'superadmin'].includes(currentRole.toLowerCase());

  async function handleRoleChange(userId: string, nextRole: string) {
    setSaving(userId);
    setError('');
    try {
      await updateUserRole(userId, nextRole);
      await loadRoles();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">User roles</h1>
            <p className="text-sm text-gray-500 mt-1">
              View and manage Pink Halo role assignments. CEO email users are automatically treated as <strong>superadmin</strong>.
            </p>
          </div>
          <div className="text-sm text-gray-600">
            Current role: <strong className="capitalize">{currentRole}</strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-5 gap-4 px-6 py-4 text-xs uppercase tracking-[0.18em] text-gray-500 bg-gray-50">
          <span className="col-span-2">User</span>
          <span>Role</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading roles…</div>
        ) : roles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No role assignments found.</div>
        ) : (
          roles.map((role) => (
            <div key={role.id} className="grid grid-cols-5 gap-4 px-6 py-4 border-t border-gray-100 items-center">
              <div className="col-span-2 text-sm text-gray-900 break-words">{role.user_id}</div>
              <div className="text-sm text-gray-700 capitalize">{ROLE_LABELS[role.role] ?? role.role}</div>
              <div className="text-sm text-gray-500">Assigned</div>
              <div className="flex justify-end gap-2">
                {canUpdate ? (
                  <select
                    value={role.role}
                    onChange={(e) => handleRoleChange(role.user_id, e.target.value)}
                    disabled={saving === role.user_id}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm text-gray-500">Manager+ required to edit</span>
                )}
                {saving === role.user_id && <span className="text-sm text-gray-500">Saving…</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {canUpdate && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 text-sm text-gray-600">
          <p className="font-semibold text-gray-900 mb-2">CEO role note</p>
          <p>
            Users signed in with the CEO emails <span className="font-medium">gggiddings@yahoo.com</span> and <span className="font-medium">stotteyman@gmail.com</span> are always elevated to <strong>superadmin</strong> on the server.
          </p>
        </div>
      )}
    </div>
  );
}
