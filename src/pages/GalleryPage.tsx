import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteGalleryPhoto, fetchGallery, submitGalleryPhoto, uploadProductImage } from '../lib/supabase';

interface GalleryPhoto {
  id: string;
  customer_name?: string | null;
  image_url: string;
  caption?: string | null;
  status: string;
  created_at: string;
  user_id?: string;
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [mine, setMine] = useState<GalleryPhoto[]>([]);
  const [canSubmit, setCanSubmit] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchGallery({ me: '1' });
      setPhotos(data.photos || []);
      setMine(data.mine || []);
      setCanSubmit(Boolean(data.can_submit));
      setSignedIn(Boolean(data.signed_in));
    } catch {
      /* gallery stays empty */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setStatus({ ok: false, text: 'Choose a photo first.' }); return; }
    setSubmitting(true);
    setStatus(null);
    try {
      const url = await uploadProductImage(file);
      const result = await submitGalleryPhoto(url, caption);
      setStatus({ ok: true, text: result.message || 'Thank you! Your photo is awaiting approval.' });
      setFile(null);
      setCaption('');
      await load();
    } catch (err: any) {
      setStatus({ ok: false, text: err?.message || 'Could not submit your photo.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function withdraw(id: string) {
    try { await deleteGalleryPhoto(id); await load(); } catch { /* ignore */ }
  }

  return (
    <section className="bg-cream pb-16">
      <div className="bg-blush border-b border-hairline py-10 lg:py-14 px-4 sm:px-6 text-center">
        <p className="overline text-gold mb-3">Pink Halo Co.</p>
        <h1 className="font-serif font-medium text-ink text-4xl md:text-5xl leading-none">Gallery of <em className="italic text-rose">Supporters</em></h1>
        <p className="text-[15px] text-ink-soft mt-4 max-w-xl mx-auto">Real customers wearing their Pink Halo. Ordered something? Share a photo and join the wall.</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
        {/* Submission */}
        <div className="border border-hairline bg-white p-6 mb-10 max-w-xl mx-auto">
          {!signedIn ? (
            <p className="text-sm text-ink-soft text-center">
              <Link to="/account" className="text-rose font-semibold hover:underline underline-offset-4">Sign in</Link> with the account you ordered with to share your photo.
            </p>
          ) : !canSubmit ? (
            <p className="text-sm text-ink-soft text-center">
              The gallery is for confirmed customers — once an order is placed with this account's email, you can share your photo here. ✦
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <p className="font-serif text-xl text-ink">Share your look</p>
              <label className="block border border-dashed border-rose/50 bg-blush/40 px-4 py-6 text-center text-sm text-ink-soft cursor-pointer hover:bg-blush/70 transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                {file ? `Selected: ${file.name}` : 'Tap to choose a photo of you in your Pink Halo'}
              </label>
              <input
                value={caption}
                onChange={e => setCaption(e.target.value)}
                maxLength={300}
                placeholder="Caption (optional) — what are you wearing?"
                className="w-full px-4 py-3 border border-hairline bg-white text-ink text-sm outline-none focus:border-rose"
              />
              {status && <p className={`text-sm ${status.ok ? 'text-green-700' : 'text-rose'}`}>{status.text}</p>}
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? 'Uploading…' : 'Submit for approval'}
              </button>
              <p className="text-xs text-ink-soft text-center">Photos appear after a quick review by our team.</p>
            </form>
          )}

          {mine.length > 0 && (
            <div className="mt-5 border-t border-hairline pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink mb-2">Your submissions</p>
              <div className="flex flex-wrap gap-2">
                {mine.map(photo => (
                  <div key={photo.id} className="relative">
                    <img src={photo.image_url} alt="" className="w-16 h-20 object-cover bg-shell" />
                    <span className={`absolute bottom-0 inset-x-0 text-[9px] text-center text-white py-0.5 capitalize ${photo.status === 'approved' ? 'bg-green-600/90' : photo.status === 'rejected' ? 'bg-ink/70' : 'bg-gold/90'}`}>
                      {photo.status}
                    </span>
                    {photo.status === 'pending' && (
                      <button onClick={() => withdraw(photo.id)} aria-label="Withdraw" className="absolute -top-1.5 -right-1.5 bg-white border border-hairline rounded-full w-5 h-5 text-[10px] text-ink-soft hover:text-rose">×</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Wall */}
        {loading ? (
          <p className="text-center text-ink-soft py-16">Loading the wall…</p>
        ) : photos.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-gold text-2xl block mb-4" aria-hidden="true">✦</span>
            <p className="font-serif text-2xl text-ink mb-2">Be the first on the wall</p>
            <p className="text-[15px] text-ink-soft">Approved customer photos will appear here.</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3.5 [&>*]:mb-3.5">
            {photos.map(photo => (
              <figure key={photo.id} className="break-inside-avoid bg-white border border-hairline">
                <img src={photo.image_url} alt={photo.caption || 'Pink Halo supporter'} loading="lazy" className="w-full" />
                {(photo.caption || photo.customer_name) && (
                  <figcaption className="px-3.5 py-2.5">
                    {photo.caption && <p className="text-[13px] text-ink leading-snug">{photo.caption}</p>}
                    {photo.customer_name && <p className="text-[11px] text-gold mt-1 uppercase tracking-[0.18em]">— {photo.customer_name}</p>}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
