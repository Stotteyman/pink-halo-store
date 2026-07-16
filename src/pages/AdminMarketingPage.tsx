import { useEffect, useState } from 'react';
import { deleteCampaign, fetchCampaigns, saveCampaign, sendCampaign, uploadProductImage } from '../lib/supabase';

interface Campaign {
  id: string;
  subject: string;
  from_alias: string;
  hero_image_url?: string | null;
  body_text?: string | null;
  body_html?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  status: 'draft' | 'sending' | 'sent';
  sent_at?: string | null;
  sent_count: number;
  created_at: string;
}

interface Audience { customers: number; subscribers: number; unsubscribed: number; total: number; }

const emptyDraft = { id: '', subject: '', from_alias: 'sales', hero_image_url: '', body_text: '', cta_label: '', cta_url: '' };

export default function AdminMarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [audience, setAudience] = useState<Audience | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState<typeof emptyDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCampaigns();
      setCampaigns(data.campaigns || []);
      setAudience(data.audience || null);
    } catch (e) { setError(String(e)); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function persistDraft(): Promise<string | null> {
    if (!draft) return null;
    if (!draft.subject.trim() || !draft.body_text.trim()) { setError('Subject and body are required.'); return null; }
    setSaving(true);
    setError('');
    try {
      const saved = await saveCampaign({
        ...(draft.id ? { id: draft.id } : {}),
        subject: draft.subject.trim(),
        from_alias: draft.from_alias,
        hero_image_url: draft.hero_image_url || null,
        body_text: draft.body_text,
        cta_label: draft.cta_label.trim() || null,
        cta_url: draft.cta_url.trim() || null,
      });
      setDraft({ ...draft, id: saved.id });
      await load();
      return saved.id as string;
    } catch (e) { setError(String(e)); return null; } finally { setSaving(false); }
  }

  async function testSend() {
    const id = await persistDraft();
    if (!id) return;
    try {
      const result = await sendCampaign(id, true);
      setNotice(`Test sent to ${result.test_sent_to}. Check your inbox before the real send.`);
    } catch (e) { setError(String(e)); }
  }

  async function realSend(id: string) {
    if (!audience?.total) { setError('No audience to send to yet.'); return; }
    if (!window.confirm(`Send this campaign to ${audience.total} people? This cannot be undone.`)) return;
    setSendingId(id);
    setError('');
    try {
      // The server processes 25 recipients per call; loop until finished
      let done = false;
      let totalSent = 0;
      while (!done) {
        const result = await sendCampaign(id, false);
        totalSent = result.total_sent;
        done = Boolean(result.done);
        setProgress(`Sending… ${result.total_sent} delivered${result.remaining ? `, ${result.remaining} to go` : ''}`);
      }
      setNotice(`Campaign sent to ${totalSent} people.`);
      setDraft(null);
      await load();
    } catch (e) { setError(String(e)); } finally { setSendingId(null); setProgress(''); }
  }

  async function heroUpload(file: File) {
    if (!draft) return;
    try { setDraft({ ...draft, hero_image_url: await uploadProductImage(file) }); } catch (e) { setError(String(e)); }
  }

  const input = 'w-full border rounded-lg px-3 py-2 text-sm';

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Marketing</h1>
          <p className="text-sm text-gray-500 mt-1">Create advertisements and send them to your customer email list. Unsubscribe links are added automatically.</p>
        </div>
        <button onClick={() => { setDraft({ ...emptyDraft }); setNotice(''); }} className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap">+ New campaign</button>
      </div>

      {audience && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Reachable audience', value: audience.total },
            { label: 'Past customers', value: audience.customers },
            { label: 'Newsletter signups', value: audience.subscribers },
            { label: 'Unsubscribed', value: audience.unsubscribed },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}
      {notice && <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-4 text-sm">{notice}</div>}
      {progress && <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl p-4 text-sm">{progress}</div>}

      {draft && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{draft.id ? 'Edit campaign' : 'New campaign'}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className={input} placeholder="Subject line" value={draft.subject} onChange={e => setDraft({ ...draft, subject: e.target.value })} />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 whitespace-nowrap">Send as</span>
              {['sales', 'hello', 'support'].map(alias => (
                <button key={alias} onClick={() => setDraft({ ...draft, from_alias: alias })}
                  className={`px-2.5 py-1.5 rounded-full border text-xs ${draft.from_alias === alias ? 'bg-pink-500 border-pink-500 text-white' : 'bg-white border-gray-300 text-gray-700'}`}>
                  {alias}@
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {draft.hero_image_url
              ? <img src={draft.hero_image_url} alt="" className="w-24 h-16 object-cover rounded-lg border" />
              : <div className="w-24 h-16 rounded-lg border border-dashed border-gray-300 grid place-items-center text-[10px] text-gray-400">hero image</div>}
            <label className="text-xs border border-pink-300 text-pink-700 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-pink-50">
              <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) heroUpload(f); e.target.value = ''; }} />
              {draft.hero_image_url ? 'Change hero image' : 'Add hero image'}
            </label>
            {draft.hero_image_url && <button onClick={() => setDraft({ ...draft, hero_image_url: '' })} className="text-xs text-gray-500 underline">Remove</button>}
          </div>

          <textarea rows={7} className={input} placeholder={'Write the advertisement…\n\nBlank lines become paragraphs.'} value={draft.body_text} onChange={e => setDraft({ ...draft, body_text: e.target.value })} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className={input} placeholder="Button label (e.g. Shop the drop)" value={draft.cta_label} onChange={e => setDraft({ ...draft, cta_label: e.target.value })} />
            <input className={input} placeholder="Button link (e.g. https://pinkhalo.co/category/sets)" value={draft.cta_url} onChange={e => setDraft({ ...draft, cta_url: e.target.value })} />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={persistDraft} disabled={saving} className="border px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save draft'}
            </button>
            <button onClick={testSend} disabled={saving} className="border border-pink-300 text-pink-700 px-4 py-2 rounded-lg text-sm hover:bg-pink-50 disabled:opacity-50">
              Send me a test
            </button>
            {draft.id && (
              <button onClick={() => realSend(draft.id)} disabled={sendingId === draft.id} className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                {sendingId === draft.id ? 'Sending…' : `Send to ${audience?.total ?? 0} people`}
              </button>
            )}
            <button onClick={() => setDraft(null)} className="text-sm text-gray-500 px-3 py-2 hover:text-gray-700">Close</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Campaigns</p>
        {loading ? <p className="text-sm text-gray-500">Loading…</p> : campaigns.length === 0 ? (
          <p className="text-sm text-gray-500">No campaigns yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{campaign.subject}</p>
                  <p className="text-xs text-gray-500">
                    from {campaign.from_alias}@pinkhalo.co ·{' '}
                    {campaign.status === 'sent'
                      ? `sent to ${campaign.sent_count} on ${campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString() : ''}`
                      : campaign.status === 'sending' ? `sending — ${campaign.sent_count} so far` : 'draft'}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {campaign.status !== 'sent' && (
                    <>
                      <button onClick={() => setDraft({
                        id: campaign.id,
                        subject: campaign.subject,
                        from_alias: campaign.from_alias,
                        hero_image_url: campaign.hero_image_url || '',
                        body_text: campaign.body_text || '',
                        cta_label: campaign.cta_label || '',
                        cta_url: campaign.cta_url || '',
                      })} className="text-xs border border-gray-300 text-gray-600 px-2.5 py-1.5 rounded-lg hover:bg-gray-50">
                        {campaign.status === 'sending' ? 'Resume' : 'Edit'}
                      </button>
                      {campaign.status === 'sending' && (
                        <button onClick={() => realSend(campaign.id)} disabled={sendingId === campaign.id} className="text-xs border border-pink-300 text-pink-700 px-2.5 py-1.5 rounded-lg hover:bg-pink-50">
                          Continue send
                        </button>
                      )}
                    </>
                  )}
                  <button onClick={async () => { if (window.confirm('Delete this campaign?')) { await deleteCampaign(campaign.id); await load(); } }}
                    className="text-xs border border-red-200 text-red-500 px-2.5 py-1.5 rounded-lg hover:bg-red-50">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
