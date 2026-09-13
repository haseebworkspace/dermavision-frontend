import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { scanAPI } from '../api/api';
import { AppLayout } from '../components/Layout';
import { jsPDF } from 'jspdf';
import { Upload, ImagePlus, Loader2, AlertCircle, FileDown, RotateCcw, CheckCircle2, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const LESION_MAP = [
  { names: ['melanocytic nevi','melanocytic nevus','benign nevus','nevus','nv'], color:'#22c55e', risk:'Low Risk',      label:'Melanocytic Nevi' },
  { names: ['basal cell carcinoma','basal cell ca','bcc'],                       color:'#f59e0b', risk:'Moderate Risk', label:'Basal Cell Carcinoma' },
  { names: ['actinic keratosis','actinic keratoses','akiec'],                    color:'#f59e0b', risk:'Moderate Risk', label:'Actinic Keratosis' },
  { names: ['melanoma','mel'],                                                   color:'#ef4444', risk:'High Risk',     label:'Melanoma' },
];

function getLesion(predictedClass) {
  if (!predictedClass) return null;
  const lower = predictedClass.toLowerCase().trim();
  const exact = LESION_MAP.find(l => l.names.some(n => lower === n));
  if (exact) return exact;
  return LESION_MAP.find(l => l.names.some(n => lower.includes(n))) || null;
}

function ConfidenceGauge({ value }) {
  const pct = Math.round(value * 100);
  const color = pct > 80 ? '#22c55e' : pct > 50 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 36;
  const dash = (pct / 100) * circumference;
  return (
    <div className="gauge-wrap">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="50" cy="50" r="36" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
          transform="rotate(-90 50 50)" style={{ transition:'stroke-dasharray 1s ease' }} />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
          fill="#e8edf5" fontSize="16" fontWeight="600" fontFamily="DM Mono, monospace">{pct}%</text>
      </svg>
      <span className="gauge-label">Confidence</span>
    </div>
  );
}

export default function Dashboard() {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const onDrop = useCallback(accepted => {
    const f = accepted[0]; if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['png','jpg','jpeg'].includes(ext)) {
      setError('Only .png and .jpg files are accepted.');
      return;
    }
    setError(''); setResult(null); setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept:{ 'image/png':['.png'], 'image/jpeg':['.jpg','.jpeg'] }, maxFiles:1,
  });

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await scanAPI.predict(fd);
      setResult(data);
      toast.success('Analysis complete!');
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Analysis failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const handleReset = () => {
    setPreview(null); setFile(null); setResult(null); setError('');
  };

  const handleDownloadPDF = () => {
    if (!result) return;
    const predictedClass = result.predicted_class || 'Unknown';
    const lesion = getLesion(predictedClass) || { label: predictedClass, risk: 'Consult a dermatologist', color: '#8a9bb5' };
    const conf = result.confidence ?? 0;
    const pct = Math.round(conf * 100);

    const doc = new jsPDF();
    doc.setFillColor(10, 12, 15); doc.rect(0, 0, 210, 297, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(22); doc.setTextColor(232,237,245);
    doc.text('DermaVision', 20, 28);
    doc.setFontSize(11); doc.setFont('helvetica','normal'); doc.setTextColor(138,155,181);
    doc.text('AI Skin Lesion Analysis Report', 20, 38);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 46);
    doc.setDrawColor(30,40,56); doc.line(20, 52, 190, 52);
    doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.setTextColor(138,155,181);
    doc.text('DIAGNOSIS', 20, 66);
    doc.setFontSize(26); doc.setTextColor(232,237,245);
    doc.text(lesion.label, 20, 82);
    doc.setFontSize(12); doc.setFont('helvetica','normal'); doc.setTextColor(138,155,181);
    doc.text(`Risk Level: ${lesion.risk}`, 20, 96);
    doc.text(`Confidence Score: ${pct}%`, 20, 108);
    doc.text(`Inconclusive: ${result.inconclusive ? 'Yes — consult dermatologist' : 'No'}`, 20, 120);
    doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(138,155,181);
    doc.text('DISCLAIMER', 20, 140);
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(138,155,181);
    const disc = 'This report is generated by an AI model for research and educational purposes only. It does not constitute a medical diagnosis. Always consult a certified dermatologist for professional evaluation.';
    doc.text(doc.splitTextToSize(disc, 170), 20, 152);
    doc.save(`dermavision-report-${Date.now()}.pdf`);
  };

  const predictedClass = result?.predicted_class || '';
  const lesion = getLesion(predictedClass);
  const conf = result ? (result.confidence ?? 0) : 0;

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Skin Lesion Analysis</h1>
        <p className="page-sub">Upload a dermoscopic image for AI-powered classification</p>
      </div>
      <div className="dashboard-grid">

        {/* Upload panel */}
        <div className="card">
          <div className="card-label">Image Input</div>
          {!preview ? (
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'drag-active' : ''}`}>
              <input {...getInputProps()} />
              <div className="dropzone-inner">
                <div className="drop-icon"><ImagePlus size={32} strokeWidth={1} /></div>
                <p className="drop-title">Drop image here</p>
                <p className="drop-sub">or click to browse — PNG, JPG only</p>
              </div>
            </div>
          ) : (
            <div className="preview-wrap">
              <img src={preview} alt="Selected dermoscopic" className="preview-img" />
              <button className="reset-btn" onClick={handleReset}>
                <RotateCcw size={14} /> Reset
              </button>
            </div>
          )}
          {error && (
            <div className="alert alert-error" style={{ marginTop:12 }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}
          <button
            className="btn-primary"
            style={{ width:'100%', marginTop:16 }}
            onClick={handleAnalyze}
            disabled={!file || loading}
          >
            {loading
              ? <><Loader2 size={18} className="spin" /> Analyzing…</>
              : <><Upload size={16} /> Analyze image</>}
          </button>
          {loading && <div className="pulse-bar"><div className="pulse-fill" /></div>}
        </div>

        {/* Result panel */}
        <div className="card result-card">
          <div className="card-label">Diagnosis Result</div>

          {!result && !loading && (
            <div className="empty-result">
              <Info size={32} strokeWidth={1} />
              <p>Upload an image and click Analyze</p>
            </div>
          )}

          {loading && (
            <div className="empty-result">
              <Loader2 size={36} strokeWidth={1} className="spin" />
              <p>Running inference…</p>
            </div>
          )}

          {result && (
            <div className="result-content">

              {/* Inconclusive warning */}
              {result.inconclusive && (
                <div className="alert alert-error">
                  <AlertCircle size={15} />
                  Result inconclusive — confidence below threshold. Please consult a dermatologist.
                </div>
              )}

              {/* Risk badge */}
              {!result.inconclusive && lesion && (
                <div className="result-badge" style={{
                  background: `color-mix(in srgb,${lesion.color} 15%,transparent)`,
                  color: lesion.color,
                  border: `1px solid color-mix(in srgb,${lesion.color} 25%,transparent)`
                }}>
                  <CheckCircle2 size={16} /> {lesion.risk}
                </div>
              )}

              {/* Class name */}
              <div className="result-name">{predictedClass || 'Unknown'}</div>

              {/* Confidence gauge */}
              <ConfidenceGauge value={conf} />

              {/* Confidence bar — highest class only */}
              <div className="confidence-bar-wrap">
                <div className="confidence-bar">
                  <div className="confidence-fill"
                    style={{ width:`${Math.round(conf*100)}%`, background: lesion?.color || '#3b82f6' }} />
                </div>
                <span className="confidence-pct">{Math.round(conf*100)}%</span>
              </div>

              {/* Backend disclaimer */}
              {result.disclaimer && (
                <p style={{ fontSize:12, color:'var(--text3)', lineHeight:1.5 }}>
                  {result.disclaimer}
                </p>
              )}

              <button className="btn-secondary" onClick={handleDownloadPDF}>
                <FileDown size={16} /> Download PDF Report
              </button>

            </div>
          )}
        </div>
      </div>

      <div className="disclaimer">
        <AlertCircle size={14} /> For research purposes only — not a substitute for professional medical diagnosis.
      </div>
    </AppLayout>
  );
}