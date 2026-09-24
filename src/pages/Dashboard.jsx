import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { scanAPI } from '../api/api';
import { AppLayout } from '../components/Layout';
import { jsPDF } from 'jspdf';
import {
  Upload, ImagePlus, Loader2, AlertCircle, FileDown,
  RotateCcw, CheckCircle2, Info, ShieldAlert, AlertTriangle,
  Phone, MapPin, Clock, User
} from 'lucide-react';
import toast from 'react-hot-toast';

const LESION_MAP = [
  { names: ['melanocytic nevi','melanocytic nevus','benign nevus','nevus','nv'], color:'#22c55e', risk:'Low Risk',      label:'Melanocytic Nevus' },
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

function DoctorCard({ doctor }) {
  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border2)',
      borderRadius: 10,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      {/* Name + Specialty */}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <User size={14} style={{ color:'var(--accent2)', flexShrink:0 }} />
        <div>
          <p style={{ fontSize:13, fontWeight:600, color:'var(--text)', margin:0 }}>{doctor.name}</p>
          <p style={{ fontSize:11, color:'var(--text2)', margin:0 }}>{doctor.specialty}</p>
        </div>
      </div>

      {/* Hospital */}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <MapPin size={13} style={{ color:'var(--text3)', flexShrink:0 }} />
        <p style={{ fontSize:12, color:'var(--text2)', margin:0 }}>{doctor.hospital}</p>
      </div>

      {/* Availability */}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Clock size={13} style={{ color:'var(--text3)', flexShrink:0 }} />
        <p style={{ fontSize:12, color:'var(--text2)', margin:0 }}>{doctor.availability}</p>
      </div>

      {/* Phone — clickable */}
      <a
        href={`tel:${doctor.phone}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: '#22c55e',
          fontWeight: 500,
          marginTop: 2,
          textDecoration: 'none',
        }}
      >
        <Phone size={13} />
        {doctor.phone}
      </a>
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
      if (data.non_skin || data.predicted_class === "Invalid Input") {
        toast.error("Non-skin image detected!");
      } else {
        toast.success('Screening complete!');
      }
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
    const doctors = result.recommended_dermatologists || [];

    const doc = new jsPDF();

    // Dark background
    doc.setFillColor(10, 12, 15);
    doc.rect(0, 0, 210, 297, 'F');

    // Header
    doc.setFont('helvetica','bold'); doc.setFontSize(22); doc.setTextColor(232,237,245);
    doc.text('DermaVision', 20, 28);
    doc.setFontSize(11); doc.setFont('helvetica','normal'); doc.setTextColor(138,155,181);
    doc.text('AI Skin Lesion Screening Report', 20, 38);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 46);
    doc.setDrawColor(30,40,56); doc.line(20, 52, 190, 52);

    // Screening result
    doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.setTextColor(138,155,181);
    doc.text('SCREENING RESULT', 20, 66);
    doc.setFontSize(24); doc.setTextColor(232,237,245);
    doc.text(lesion.label, 20, 80);
    doc.setFontSize(12); doc.setFont('helvetica','normal'); doc.setTextColor(138,155,181);
    doc.text(`Risk Level: ${lesion.risk}`, 20, 92);
    doc.text(`Confidence Score: ${pct}%`, 20, 102);
    doc.text(`Inconclusive: ${result.inconclusive ? 'Yes — consult dermatologist' : 'No'}`, 20, 112);

    // Recommended Dermatologists section
    let yPos = 128;
    if (doctors.length > 0) {
      doc.setDrawColor(30,40,56); doc.line(20, 120, 190, 120);
      doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.setTextColor(138,155,181);
      doc.text('RECOMMENDED DERMATOLOGISTS', 20, yPos);
      yPos += 12;

      doctors.forEach((dr, i) => {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          doc.setFillColor(10, 12, 15);
          doc.rect(0, 0, 210, 297, 'F');
          yPos = 20;
        }

        doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(232,237,245);
        doc.text(`${i + 1}. ${dr.name}`, 20, yPos); yPos += 8;

        doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.setTextColor(138,155,181);
        doc.text(`   Specialty:     ${dr.specialty}`, 20, yPos); yPos += 7;
        doc.text(`   Hospital:      ${dr.hospital}`, 20, yPos); yPos += 7;
        doc.text(`   Availability:  ${dr.availability}`, 20, yPos); yPos += 7;
        doc.text(`   Phone:         ${dr.phone}`, 20, yPos); yPos += 12;
      });
    }

    // Disclaimer
    if (yPos > 240) {
      doc.addPage();
      doc.setFillColor(10, 12, 15);
      doc.rect(0, 0, 210, 297, 'F');
      yPos = 20;
    }
    doc.setDrawColor(30,40,56); doc.line(20, yPos, 190, yPos); yPos += 10;
    doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(138,155,181);
    doc.text('IMPORTANT DISCLAIMER', 20, yPos); yPos += 8;
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(138,155,181);
    const disc = 'This report is generated by an AI model for research and educational screening purposes only. It does NOT constitute a medical diagnosis. Always consult a qualified dermatologist for professional medical evaluation and advice.';
    doc.text(doc.splitTextToSize(disc, 170), 20, yPos);

    doc.save(`dermavision-screening-${Date.now()}.pdf`);
  };

  const isNonSkin = result?.non_skin || result?.predicted_class === 'Invalid Input';
  const predictedClass = result?.predicted_class || '';
  const lesion = getLesion(predictedClass);
  const conf = result ? (result.confidence ?? 0) : 0;
  const doctors = result?.recommended_dermatologists || [];

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Skin Lesion Screening</h1>
        <p className="page-sub">Upload a dermoscopic image for AI-powered classification</p>
      </div>

      <div className="dashboard-grid">

        {/* ── Upload panel ── */}
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
              <img src={preview} alt="Dermoscopic image" className="preview-img" />
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

          <p style={{ fontSize:11, color:'var(--text3)', textAlign:'center', marginTop:12, lineHeight:1.6 }}>
            🔒 Your images are handled securely and used only for screening analysis.
          </p>
        </div>

        {/* ── Result panel ── */}
        <div className="card result-card" style={{ height: 'auto', maxHeight: 640, overflowY: 'auto' }}>
          <div className="card-label">Screening Result</div>

          {!result && !loading && (
            <div className="empty-result">
              <Info size={32} strokeWidth={1} />
              <p>Upload an image and click Analyze to see the screening result</p>
            </div>
          )}

          {loading && (
            <div className="empty-result">
              <Loader2 size={36} strokeWidth={1} className="spin" />
              <p>Running classification…</p>
            </div>
          )}

          {result && (
            <div className="result-content">

              {/* NON-SKIN / INVALID IMAGE REJECTION CARD */}
              {isNonSkin ? (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontWeight: 600, fontSize: 16 }}>
                    <AlertTriangle size={20} />
                    Invalid / Non-Skin Image
                  </div>
                  <p style={{ fontSize: 13, color: '#f87171', marginTop: 8, lineHeight: 1.5 }}>
                    {result.message || "Non-skin image detected. Please upload a clear dermoscopic skin lesion image."}
                  </p>
                </div>
              ) : (
                /* NORMAL CANCER CLASSIFICATION OUTPUT */
                <>
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

                  {/* Predicted class */}
                  <div className="result-name">{lesion?.label || predictedClass || 'Unknown'}</div>
                  <div className="result-code" style={{ fontSize:11, color:'var(--text3)', marginTop:-8 }}>
                    AI Classification
                  </div>

                  {/* Confidence gauge */}
                  <ConfidenceGauge value={conf} />

                  {/* Confidence bar */}
                  <div className="confidence-bar-wrap">
                    <div className="confidence-bar">
                      <div className="confidence-fill"
                        style={{ width:`${Math.round(conf*100)}%`, background: lesion?.color || '#3b82f6' }} />
                    </div>
                    <span className="confidence-pct">{Math.round(conf*100)}%</span>
                  </div>

                  {/* ── Recommended Dermatologists ── */}
                  {doctors.length > 0 && (
                    <div style={{ marginTop:8 }}>
                      <div style={{
                        display:'flex', alignItems:'center', gap:6,
                        marginBottom:10,
                      }}>
                        <User size={14} style={{ color:'var(--accent2)' }} />
                        <span style={{ fontSize:12, fontWeight:600, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                          Recommended Dermatologists
                        </span>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {doctors.map(dr => (
                          <DoctorCard key={dr.id} doctor={dr} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div style={{
                    background:'rgba(251,191,36,0.08)',
                    border:'1px solid rgba(251,191,36,0.2)',
                    borderRadius:10,
                    padding:'10px 14px',
                    display:'flex',
                    gap:8,
                    alignItems:'flex-start',
                    marginTop:4,
                  }}>
                    <ShieldAlert size={15} style={{ color:'#f59e0b', flexShrink:0, marginTop:2 }} />
                    <p style={{ fontSize:12, color:'#d4a847', lineHeight:1.6, margin:0 }}>
                      This tool is for research and educational screening only. It is <strong>not a medical diagnosis</strong>. Consult a qualified dermatologist for medical advice.
                    </p>
                  </div>

                  <button className="btn-secondary" onClick={handleDownloadPDF}>
                    <FileDown size={16} /> Download Screening Report
                  </button>
                </>
              )}

            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
