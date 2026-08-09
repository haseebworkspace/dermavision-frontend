import { useState, useEffect } from 'react';
import { adminAPI } from '../api/api';
import { AppLayout } from '../components/Layout';
import { Loader2, Users, ScanLine, Activity } from 'lucide-react';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const COLORS = ['#ef4444', '#22c55e', '#f59e0b', '#3b82f6'];

// All 4 classes always shown — fill missing ones with 0
const ALL_CLASSES = ['Melanoma', 'Melanocytic Nevi', 'Basal Cell Carcinoma', 'Actinic Keratosis'];

// Map any key format backend might use → standard display name
function normalizeDistribution(dist) {
  if (!dist || typeof dist !== 'object') return {};
  const result = {};
  Object.entries(dist).forEach(([k, v]) => {
    const key = k.toLowerCase().trim();
    if (key.includes('melanocytic') || key === 'nv' || key.includes('nevus')) {
      result['Melanocytic Nevi'] = (result['Melanocytic Nevi'] || 0) + Number(v);
    } else if (key.includes('melanoma') || key === 'mel') {
      result['Melanoma'] = (result['Melanoma'] || 0) + Number(v);
    } else if (key.includes('basal') || key === 'bcc') {
      result['Basal Cell Carcinoma'] = (result['Basal Cell Carcinoma'] || 0) + Number(v);
    } else if (key.includes('actinic') || key === 'akiec') {
      result['Actinic Keratosis'] = (result['Actinic Keratosis'] || 0) + Number(v);
    } else {
      result[k] = Number(v); // unknown class — show as-is
    }
  });
  // Fill missing classes with 0 so all 4 always appear
  ALL_CLASSES.forEach(cls => { if (!(cls in result)) result[cls] = 0; });
  return result;
}

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ color }}>
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    adminAPI.stats()
      .then(({ data }) => {
        console.log('Admin stats:', data);
        setStats(data);
      })
      .catch(err => {
        console.error('Admin stats error:', err.response?.status, err.response?.data);
        if (err.response?.status === 403) {
          setNotice('Your account does not have admin privileges. Ask Talha to run: UPDATE users SET is_admin=1 WHERE email=\'your_email\';');
        } else {
          setNotice('Could not load admin stats.');
        }
        setStats({});
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AppLayout>
      <div className="center-state"><Loader2 size={36} className="spin" /><p>Loading…</p></div>
    </AppLayout>
  );

  // Get distribution — try all possible field names
  const rawDist =
    stats.lesion_distribution ||
    stats.class_distribution ||
    stats.scan_distribution ||
    stats.predictions_by_class ||
    stats.class_counts ||
    stats.distribution ||
    null;

  const dist = normalizeDistribution(rawDist);
  const labels = Object.keys(dist);
  const values = Object.values(dist);

  // Total scans — try all field names
  const totalScans =
    (stats.total_scans || stats.scan_count || stats.scans || values.reduce((a, b) => a + b, 0) || 0);

  // Total users
  const totalUsers = (stats.total_users || stats.user_count || stats.users || 0);

  // avg_confidence from backend is an object {"Melanocytic Nevi": 0.9962}
  // Calculate mean across classes, fall back to known model accuracy from ML docs
  let accuracyDisplay = '79.6%';
  const avgConf = stats.avg_confidence || stats.accuracy_rate || stats.model_accuracy || null;
  if (avgConf && typeof avgConf === 'object') {
    const vals = Object.values(avgConf).map(Number).filter(v => !isNaN(v));
    if (vals.length > 0) {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      accuracyDisplay = `${Math.round(avg * 100)}%`;
    }
  } else if (typeof avgConf === 'number') {
    accuracyDisplay = `${Math.round(avgConf <= 1 ? avgConf * 100 : avgConf)}%`;
  }

  const chartOpts = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#8a9bb5', font: { family: 'DM Sans' } } },
      tooltip: { backgroundColor: '#1a2130', titleColor: '#e8edf5', bodyColor: '#8a9bb5' }
    }
  };

  const barOpts = {
    ...chartOpts,
    scales: {
      x: { ticks: { color: '#8a9bb5' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: {
        ticks: { color: '#8a9bb5', stepSize: 1 },
        grid: { color: 'rgba(255,255,255,0.04)' },
        beginAtZero: true,
      }
    }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-sub">Platform-wide analytics</p>
      </div>

      {notice && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          {notice}
        </div>
      )}

      <div className="stats-row">
        <StatCard
          icon={Users} label="Registered Users"
          value={totalUsers} color="#3b82f6"
        />
        <StatCard
          icon={ScanLine} label="Total Scans"
          value={totalScans} color="#14b8a6"
        />
        <StatCard
          icon={Activity} label="Model Accuracy"
          value={accuracyDisplay} color="#22c55e"
          sub="Test set AUC: 0.9556"
        />
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-label">Detection Distribution</div>
          {values.some(v => v > 0) ? (
            <div className="chart-wrap" style={{ maxWidth: 280, margin: '0 auto' }}>
              <Doughnut
                data={{
                  labels,
                  datasets: [{
                    data: values,
                    backgroundColor: COLORS,
                    borderColor: '#10141a',
                    borderWidth: 3
                  }]
                }}
                options={chartOpts}
              />
            </div>
          ) : (
            <div className="center-state" style={{ padding: '40px 0' }}>
              <p>No scan data yet</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-label">Cases by Lesion Type</div>
          <div className="chart-wrap">
            <Bar
              data={{
                labels,
                datasets: [{
                  label: 'Cases detected',
                  data: values,
                  backgroundColor: COLORS,
                  borderRadius: 6,
                  borderSkipped: false,
                }]
              }}
              options={barOpts}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
