import { useEffect, useState } from 'react';
import { fetchInbox, fetchInboxMessage, fetchSettings, saveSettings, sendAdminMail } from '../lib/supabase';

interface InboxItem { uid: number; subject: string; from: string; to: string; date: string | null; seen: boolean; messageId: string | null; }
interface FullMessage extends InboxItem { html: string | null; text: string; references: string[]; attachments: { filename: string; contentType: string; size: number }[]; }
interface Draft { to: string; subject: string; body: string; from: string; inReplyTo?: string; references?: string[]; }

const ALIASES = ['hello', 'sales', 'support', 'help', 'careers'];

function extractEmail(value: string) {
  return /<([^>]+)>/.exec(value)?.[1] || value;
}

export default function AdminMailPage() {
  const [messages, setMessages] = useState<InboxItem[]>([]);
  const [selected, setSelected] = useState<FullMessage | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [attachments, setAttachments] = useState<{ filename: string; contentType: string; contentBase64: string }[]>([]);
  const [sending, setSending] = useState(false);
  const [signature, setSignature] = useState('');
  const [showSignature, setShowSignature] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);

  async function loadInbox() {
    setLoadingList(true);
    setError('');
    try {
      const data = await fetchInbox();
      setMessages(data.messages || []);
    } catch (e) { setError(String(e)); } finally { setLoadingList(false); }
  }

  useEffect(() => {
    loadInbox();
    fetchSettings(['email_signature_html'])
      .then(data => setSignature(typeof data.settings?.email_signature_html === 'string' ? data.settings.email_signature_html as string : ''))
      .catch(() => undefined);
  }, []);

  async function open(uid: number) {
    setLoadingMessage(true);
    setError('');
    setDraft(null);
    try {
      const data = await fetchInboxMessage(uid);
      setSelected(data.message);
    } catch (e) { setError(String(e)); } finally { setLoadingMessage(false); }
  }

  function startReply() {
    if (!selected) return;
    setDraft({
      to: extractEmail(selected.from),
      subject: selected.subject.toLowerCase().startsWith('re:') ? selected.subject : `Re: ${selected.subject}`,
      body: '',
      from: 'support',
      inReplyTo: selected.messageId || undefined,
      references: [...(selected.references || []), ...(selected.messageId ? [selected.messageId] : [])],
    });
  }

  function startCompose() {
    setSelected(null);
    setDraft({ to: '', subject: '', body: '', from: 'hello' });
  }

  async function attach(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      const contentBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setAttachments(current => [...current, { filename: file.name, contentType: file.type || 'application/octet-stream', contentBase64 }]);
    }
  }

  async function send() {
    if (!draft || !draft.to || !draft.subject || !draft.body.trim()) { setError('Recipient, subject, and message are required.'); return; }
    setSending(true);
    setError('');
    try {
      await sendAdminMail({
        to: draft.to,
        subject: draft.subject,
        text: draft.body,
        from: draft.from,
        inReplyTo: draft.inReplyTo,
        references: draft.references,
        attachments,
        includeSignature: true,
      });
      setNotice(`Sent from ${draft.from}@pinkhalo.co to ${draft.to}.`);
      setDraft(null);
      setAttachments([]);
    } catch (e) { setError(String(e)); } finally { setSending(false); }
  }

  async function persistSignature() {
    setSavingSignature(true);
    setError('');
    try {
      await saveSettings({ email_signature_html: signature });
      setNotice('Signature saved. Leave empty to use the default branded signature.');
    } catch (e) { setError(String(e)); } finally { setSavingSignature(false); }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Mail</h1>
          <p className="text-sm text-gray-500 mt-1">The shared Pink Halo mailbox — read, reply as any address, attach images. Signature added automatically.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSignature(s => !s)} className="border px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Signature</button>
          <button onClick={loadInbox} className="border px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Refresh</button>
          <button onClick={startCompose} className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-lg text-sm">+ Compose</button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}
      {notice && <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-4 text-sm">{notice}</div>}

      {showSignature && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email signature (HTML)</p>
          <p className="text-xs text-gray-500">Appended to every message you send from here. Leave empty to use the default branded signature with the Pink Halo logo.</p>
          <textarea rows={5} className="w-full border rounded-lg px-3 py-2 text-xs font-mono" value={signature} onChange={e => setSignature(e.target.value)} placeholder="<p>Pink Halo Co. — Wear Your Halo.</p>" />
          <button onClick={persistSignature} disabled={savingSignature} className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
            {savingSignature ? 'Saving…' : 'Save signature'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Inbox list */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 border-b border-gray-100">Inbox</p>
          <div className="max-h-[560px] overflow-y-auto divide-y divide-gray-50">
            {loadingList ? (
              <p className="p-4 text-sm text-gray-500">Connecting to the mailbox…</p>
            ) : messages.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No messages.</p>
            ) : messages.map(message => (
              <button key={message.uid} onClick={() => open(message.uid)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${selected?.uid === message.uid ? 'bg-pink-50/60' : ''}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className={`text-sm truncate ${message.seen ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>{message.from}</p>
                  <p className="text-[11px] text-gray-400 whitespace-nowrap">{message.date ? new Date(message.date).toLocaleDateString() : ''}</p>
                </div>
                <p className={`text-xs truncate mt-0.5 ${message.seen ? 'text-gray-500' : 'text-gray-800'}`}>{message.subject}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Reader / composer */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl p-5 min-h-[400px]">
          {draft ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{draft.inReplyTo ? 'Reply' : 'New message'}</p>
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Send as</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALIASES.map(alias => (
                    <button key={alias} onClick={() => setDraft({ ...draft, from: alias })}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium ${draft.from === alias ? 'bg-pink-500 border-pink-500 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-pink-400'}`}>
                      {alias}@pinkhalo.co
                    </button>
                  ))}
                </div>
              </div>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="To" value={draft.to} onChange={e => setDraft({ ...draft, to: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Subject" value={draft.subject} onChange={e => setDraft({ ...draft, subject: e.target.value })} />
              <textarea rows={9} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Write your message… the signature is added automatically." value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} />
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs border border-pink-300 text-pink-700 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-pink-50">
                  <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={e => { attach(e.target.files); e.target.value = ''; }} />
                  📎 Attach files
                </label>
                {attachments.map((a, i) => (
                  <span key={i} className="text-xs bg-gray-100 rounded-full px-2.5 py-1 flex items-center gap-1">
                    {a.filename}
                    <button onClick={() => setAttachments(attachments.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={send} disabled={sending} className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {sending ? 'Sending…' : `Send as ${draft.from}@`}
                </button>
                <button onClick={() => { setDraft(null); setAttachments([]); }} className="border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Discard</button>
              </div>
            </div>
          ) : loadingMessage ? (
            <p className="text-sm text-gray-500">Opening message…</p>
          ) : selected ? (
            <div>
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3 mb-4">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900">{selected.subject}</h2>
                  <p className="text-xs text-gray-500 mt-1 truncate">From {selected.from} · {selected.date ? new Date(selected.date).toLocaleString() : ''}</p>
                  {selected.attachments.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">📎 {selected.attachments.map(a => a.filename).join(', ')}</p>
                  )}
                </div>
                <button onClick={startReply} className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap">Reply</button>
              </div>
              {selected.html
                ? <iframe title="message" sandbox="" srcDoc={selected.html} className="w-full min-h-[420px] border-0" />
                : <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">{selected.text}</pre>}
            </div>
          ) : (
            <p className="text-sm text-gray-400 grid place-items-center h-full py-20">Select a message, or compose a new one.</p>
          )}
        </div>
      </div>
    </div>
  );
}
