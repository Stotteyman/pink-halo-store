import { useEffect, useState } from 'react';
import { deleteGalleryPhoto, fetchGallery, reviewGalleryPhoto } from '../lib/supabase';

interface GalleryPhoto {
  id: string;
  customer_name?: string | null;
  customer_email?: string | null;
  image_url: string;
  caption?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const TABS: { key: 'pending' | 'approved' | 'rejected'; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function AdminGalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchGallery({ all: '1' });
      setPhotos(data.photos || []);
    } catch (e) { setError(String(e)); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function review(id: string, status: 'approved' | 'rejected' | 'pending') {
    setError('');
    try { await reviewGalleryPhoto(id, status); await load(); } catch (e) { setError(String(e)); }
  }

  async function remove(id: string) {
    if (!window.confirm('Permanently delete this photo?')) return;
    setError('');
    try { await deleteGalleryPhoto(id); await load(); } catch (e) { setError(String(e)); }
  }

  const shown = photos.filter(p => p.status === tab);
  const counts = Object.fromEntries(TABS.map(t => [t.key, photos.filter(p => p.status === t.key).length]));

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Community Gallery</h1>
        <p className="text-sm text-gray-500 mt-1">Customer photo submissions. Approved photos appear on the public Gallery of Supporters.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}

      <div className="flex gap-2">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${tab === t.key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            {t.label} ({counts[t.key] ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : shown.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500 text-sm">
          Nothing {tab} right now.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {shown.map(photo => (
            <div key={photo.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <img src={photo.image_url} alt="" className="w-full aspect-[3/4] object-cover bg-gray-100" />
              <div className="p-3 space-y-1.5">
                {photo.caption && <p className="text-xs text-gray-700 line-clamp-2">{photo.caption}</p>}
                <p className="text-[11px] text-gray-400 truncate">
                  {photo.customer_name || 'Unnamed'}{photo.customer_email ? ` · ${photo.customer_email}` : ''}
                </p>
                <div className="flex gap-1.5 pt-1">
                  {photo.status !== 'approved' && (
                    <button onClick={() => review(photo.id, 'approved')} className="flex-1 text-xs border border-green-300 text-green-700 px-2 py-1.5 rounded-lg hover:bg-green-50">Approve</button>
                  )}
                  {photo.status !== 'rejected' && (
                    <button onClick={() => review(photo.id, 'rejected')} className="flex-1 text-xs border border-gray-300 text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-50">Reject</button>
                  )}
                  <button onClick={() => remove(photo.id)} className="text-xs border border-red-200 text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
