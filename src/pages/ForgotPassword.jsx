import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/api';
import { Microscope, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'reset'
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ otp: '', new_password: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const sendEmail = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setStep('reset');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not send reset email.');
    } finally { setLoading(false); }
  };

  const resetPassword = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await authAPI.resetPassword({ email, otp: form.otp, new_password: form.new_password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed. Check your OTP.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand"><Microscope size={28} strokeWidth={1.5} /><span>DermaVision</span></div>
      <div className="auth-card">
        {done ? (
          <div className="sent-state">
            <CheckCircle2 size={48} strokeWidth={1} className="sent-icon" />
            <h2>Password reset!</h2>
            <p>Your password has been changed successfully.</p>
            <Link to="/login" className="btn-primary" style={{ display: 'inline-flex', justifyContent: 'center', marginTop: 16 }}>
              Sign in
            </Link>
          </div>
        ) : step === 'email' ? (
          <>
            <div className="auth-header"><h1>Reset password</h1><p>Enter your email to receive an OTP</p></div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={sendEmail} className="auth-form">
              <div className="field">
                <label>Email address</label>
                <input type="email" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <Loader2 size={18} className="spin" /> : 'Send OTP'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="auth-header"><h1>Enter OTP</h1><p>Check <strong>{email}</strong> for your reset code</p></div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={resetPassword} className="auth-form">
              <div className="field">
                <label>OTP Code</label>
                <input type="text" placeholder="6-digit code" value={form.otp}
                  onChange={e => setForm({ ...form, otp: e.target.value })} required />
              </div>
              <div className="field">
                <label>New Password</label>
                <input type="password" placeholder="Min. 8 characters" value={form.new_password}
                  onChange={e => setForm({ ...form, new_password: e.target.value })} required />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <Loader2 size={18} className="spin" /> : 'Reset password'}
              </button>
            </form>
          </>
        )}
        {!done && (
          <p className="auth-footer">
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
