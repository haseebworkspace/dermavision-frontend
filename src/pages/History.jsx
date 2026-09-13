import { useState, useEffect } from 'react';
import { scanAPI } from '../api/api';
import { AppLayout } from '../components/Layout';
import { Trash2, Loader2, History as HistoryIcon, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const LESION_MAP = [
  { names: ['melanocytic nevi','melanocytic nevus','benign nevus','nevus','nv'], color:'#22c55e', risk:'Low Risk' },
  { names: ['basal cell carcinoma','basal cell ca','bcc'],                       color:'#f59e0b', risk:'Moderate Risk' },
  { names: ['actinic keratosis','actinic keratoses','akiec'],                    color:'#f59e0b', risk:'Moderate Risk' },
  { names: ['melanoma','mel'],                                                   color:'#ef4444', risk:'High Risk' },
];

function getLesion(predictedClass) {
  if (!predictedClass) return { name: 'Unknown', color: '#8a9bb5' };
  const lower = predictedClass.toLowerCase().trim();
  const exact = LESION_MAP.find(l => l.names.some(n => lower === n));
  if (exact) return { name: predictedClass, color: exact.color };
  const partial = LESION_MAP.find(l => l.names.some(n => lower.includes(n)));
  return partial ? { name: predictedClass, color: partial.color } : { name: predictedClass, color: '#8a9bb5' };
}

export default function History() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await scanAPI.history();
        const list = Array.isArray(data) ? data : (data.scans || data.items || []);
        setScans(list);
      } catch {
        toast.error('Could not load scan history. Please try again.');
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleDelete = async id => {
    setDeleting(id);
    try {
      await scanAPI.deleteScan(id);
      setScans(prev => prev.filter(s => s.id !== id));
      toast.success('Scan deleted successfully.');
    } catch {
      toast.error('Failed to delete scan. Please try again.');
    } finally { setDeleting(null); }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Scan History</h1>
        <p className="page-sub">All your previous analyses</p>
      </div>

      {loading ? (
        <div className="center-state">
          <Loader2 size={36} className="spin" />
          <p>Loading history…</p>
        </div>
      ) : scans.length === 0 ? (
        <div className="center-state">
          <HistoryIcon size={48} strokeWidth={1} />
          <p>No scans yet. Analyze an image to get started.</p>
        </div>
      ) : (
        <div className="history-grid">
          {scans.map(scan => {
            const label = scan.predicted_class || scan.label || scan.class || '';
            const lesion = getLesion(label);
            const conf = scan.confidence ?? 0;
            const pct = Math.round(conf * 100);
            const dateStr = scan.timestamp || scan.created_at;
            const imgSrc = scan.image_url
              ? `https://talharehman125-derma-vision-backend.hf.space${scan.image_url}`
              : null;

            return (
              <div key={scan.id} className="history-card">
                {imgSrc && (
                  <div className="history-thumb">
                    <img src={imgSrc} alt="Scan" />
                  </div>
                )}
                <div className="history-body">
                  <div className="history-top">
                    <span className="lesion-tag" style={{
                      background: `color-mix(in srgb,${lesion.color} 12%,transparent)`,
                      color: lesion.color
                    }}>
                      {lesion.name || 'Unknown'}
                    </span>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(scan.id)}
                      disabled={deleting === scan.id}
                      aria-label="Delete scan"
                    >
                      {deleting === scan.id
                        ? <Loader2 size={14} className="spin" />
                        : <Trash2 size={14} />}
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