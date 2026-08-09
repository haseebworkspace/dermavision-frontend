import { useState, useEffect } from 'react';
import { scanAPI } from '../api/api';
import { AppLayout } from '../components/Layout';
import { Trash2, Loader2, History as HistoryIcon, AlertCircle, Clock } from 'lucide-react';

const LESION_INFO = {
  mel:   { name: 'Melanoma',             color: '#ef4444' },
  nv:    { name: 'Benign Nevus',         color: '#22c55e' },
  bcc:   { name: 'Basal Cell Ca.',       color: '#f59e0b' },
  akiec: { name: 'Actinic Keratosis',    color: '#f59e0b' },
};

export default function History() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await scanAPI.history();
        // Backend may return array directly or { scans: [...] } or { items: [...] }
        const list = Array.isArray(data) ? data : (data.scans || data.items || []);
        setScans(list);
      } catch { setError('Could not load scan history.'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleDelete = async id => {
    setDeleting(id);
    try {
      await scanAPI.deleteScan(id);
      setScans(prev => prev.filter(s => s.id !== id));
    } catch { setError('Delete failed.'); }
    finally { setDeleting(null); }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Scan History</h1>
        <p className="page-sub">All your previous analyses</p>
      </div>
      {error && <div className="alert alert-error" style={{ marginBottom:16 }}><AlertCircle size={15} /> {error}</div>}
      {loading ? (
        <div className="center-state"><Loader2 size={36} className="spin" /><p>Loading…</p></div>
      ) : scans.length === 0 ? (
        <div className="center-state"><HistoryIcon size={48} strokeWidth={1} /><p>No scans yet. Analyze an image to get started.</p></div>
      ) : (
        <div className="history-grid">
          {scans.map(scan => {
            // Backend scans table: predicted_class (full name), confidence, timestamp, image_url
            const label = scan.predicted_class || '';
            // Match full class name to color info
            const lesionEntry = Object.entries(LESION_INFO).find(([, v]) => v.name.toLowerCase() === label.toLowerCase());
            const lesion = lesionEntry ? lesionEntry[1] : { name: label || 'Unknown', color: '#8a9bb5' };
            const conf = scan.confidence ?? 0;
            const pct = Math.round(conf * 100);
            // Backend uses 'timestamp' column not 'created_at'
            const dateStr = scan.timestamp || scan.created_at;
            // image_url is a relative path — prepend base URL
            const imgSrc = scan.image_url
              ? `https://talharehman125-derma-vision-backend.hf.space${scan.image_url}`
              : null;
            return (
              <div key={scan.id} className="history-card">
                {imgSrc && (
                  <div className="history-thumb"><img src={imgSrc} alt="Scan" /></div>
                )}
                <div className="history-body">
                  <div className="history-top">
                    <span className="lesion-tag" style={{ background:`color-mix(in srgb,${lesion.color} 12%,transparent)`, color:lesion.color }}>
                      {lesion.name}
                    </span>
                    <button className="delete-btn" onClick={() => handleDelete(scan.id)} disabled={deleting === scan.id}>
                      {deleting === scan.id ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                  <div className="history-confidence">
                    <div className="conf-bar">
                      <div className="conf-fill" style={{ width:`${pct}%`, background:lesion.color }} />
                    </div>
                    <span>{pct}% confidence</span>
                  </div>
                  <div className="history-meta">
                    <Clock size={12} />
                    {dateStr ? new Date(dateStr).toLocaleString() : 'Unknown date'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
