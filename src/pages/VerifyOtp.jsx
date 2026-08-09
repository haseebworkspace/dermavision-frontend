import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authAPI } from '../api/api';
import { Microscope, Loader2, MailCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { login } = useAuth();
  const email = state?.email || '';
  const [otp, setOtp] = useState(['','','','','','']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputs = useRef([]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[i] = val.slice(-1); setOtp(next);
    if (val && i < 5) inputs.current[i+1]?.focus();
  };
  const handleKeyDown = (i, e) => { if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i-1]?.focus(); };
  const handlePaste = e => {
    const text = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (text.length === 6) { setOtp(text.split('')); inputs.current[5]?.focus(); }
    e.preventDefault();
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Enter all 6 digits.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await authAPI.verifyOtp({ email, otp: code });
      // Backend returns { message, token, user } on successful verify
      if (data.token && data.user) {
        login(data.token, data.user);
        navigate('/dashboard');
      } else {
        navigate('/login', { state: { verified: true } });
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Invalid OTP.');
      setOtp(['','','','','','']); inputs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand"><Microscope size={28} strokeWidth={1.5} /><span>DermaVision</span></div>
      <div className="auth-card">
        <div className="otp-icon-wrap"><MailCheck size={32} strokeWidth={1.5} /></div>
        <div className="auth-header">
          <h1>Check your email</h1>
          <p>We sent a 6-digit code to <strong>{email || 'your email'}</strong></p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="otp-grid" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input key={i} ref={el => inputs.current[i] = el} className="otp-input"
                type="text" inputMode="numeric" maxLength={1} value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)} />
            ))}
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 size={18} className="spin" /> : 'Verify & activate account'}
          </button>
        </form>
        <p className="auth-footer">Wrong email? <Link to="/signup">Go back</Link></p>
      </div>
    </div>
  );
}
