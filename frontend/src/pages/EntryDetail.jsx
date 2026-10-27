import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { entriesAPI } from '../api/api';
import ConfirmModal from '../components/ConfirmModal';
import { decryptContent } from '../lib/crypto';
import { themeLabel } from '../lib/themes';
import useCryptoStore from '../store/cryptoStore';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function EntryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const passphrase = useCryptoStore((s) => s.passphrase);
  const unlocked = useCryptoStore((s) => s.unlocked);

  const [entry, setEntry] = useState(null);
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [decryptError, setDecryptError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    entriesAPI
      .get(id)
      .then((data) => {
        setEntry(data.entry);
        if (!data.entry.encrypted) {
          setHtml(data.entry.content);
        } else {
          setHtml('');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!entry?.encrypted || !passphrase) return;
    let cancelled = false;
    decryptContent(entry, passphrase)
      .then((plain) => {
        if (!cancelled) {
          setHtml(plain);
          setDecryptError('');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHtml('');
          setDecryptError('That key doesn’t unlock this entry.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [entry, passphrase]);

  const remove = async () => {
    setDeleting(true);
    setError('');
    try {
      await entriesAPI.remove(id);
      navigate('/app/entries');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) return <p className="text-muted">Loading…</p>;
  if (error && !entry) return <p className="text-red-800">{error}</p>;
  if (!entry) return null;

  const locked = entry.encrypted && !html;

  return (
    <article className="space-y-5">
      <div>
        <Link to="/app/entries" className="text-sm text-muted hover:text-ink hover:underline">
          ← All entries
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {formatDate(entry.createdAt)}
          </h1>
          {entry.encrypted && (
            <span className="rounded-full bg-stone-800 px-2.5 py-0.5 text-[11px] font-semibold text-white">
              Private
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-muted">{themeLabel(entry.theme)}</p>
      </div>

      <p className="border-l-2 border-leaf/40 pl-4 text-[1.05rem] leading-relaxed text-ink/90">
        {entry.prompt}
      </p>

      {entry.encrypted && !unlocked && (
        <p className="text-sm text-muted">Locked — enter your key in the top bar to read it.</p>
      )}

      {decryptError && <p className="text-sm text-red-800">{decryptError}</p>}
      {error && <p className="text-sm text-red-800">{error}</p>}

      {locked ? (
        <div className="rounded-lg border border-dashed border-stone-300 px-4 py-10 text-center text-sm text-muted">
          Private writing is hidden until you unlock.
        </div>
      ) : (
        <div
          className="prose-journal text-[1.05rem] leading-relaxed text-ink"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}

      <button
        type="button"
        onClick={() => setConfirmDelete(true)}
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100"
      >
        Delete entry
      </button>

      {confirmDelete && (
        <ConfirmModal
          title="Delete this entry?"
          confirmLabel="Delete"
          cancelLabel="Keep it"
          danger
          busy={deleting}
          onCancel={() => !deleting && setConfirmDelete(false)}
          onConfirm={remove}
        >
          <p>This can’t be undone. The entry will be removed permanently.</p>
        </ConfirmModal>
      )}
    </article>
  );
}
