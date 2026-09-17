import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api/api';
import { Microscope, ArrowLeft, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ otp: '', new_password: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const sendEmail = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      toast.success('OTP sent! Please check your email.');
      setStep('reset');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not send reset email. Try again.');
    } finally { setLoading(false); }
  };

  const resetPassword = async e => {
    e.preventDefault();
    if (form.new_password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({ email, otp: form.otp, new_password: form.new_password });
      toast.success('Password reset successfully! You can now sign in.');
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Reset failed. Please check your OTP.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <Microscope size={28} strokeWidth={1.5} />
        <span>DermaVision</span>
      </div>

      <div className="auth-card">
        {done ? (
          <div className="sent-state">
            <CheckCircle2 size={48} strokeWidth={1} className="sent-icon" />
            <h2>Password reset!</h2>
            <p>Your password has been changed successfully.</p>
            <Link
              to="/login"
              className="btn-primary"
              style={{ display:'inline-flex', justifyContent:'center', marginTop:16 }}
            >
              Sign in
            </Link>
          </div>

        ) : step === 'email' ? (
          <>
            <div className="auth-header">
              <h1>Reset password</h1>
              <p>Enter your registered email to receive a reset code</p>
            </div>

            <form onSubmit={sendEmail} className="auth-form">
              <div className="field">
                <label>Email address</label>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <Loader2 size={18} className="spin" /> : 'Send reset code'}
              </button>
            </form>

            <div className="auth-microcopy">
              <ShieldCheck size={13} />
              A secure reset code will be sent to your registered email address.
            </div>
          </>

        ) : (
          <>
            <div className="auth-header">
              <h1>Enter reset code</h1>
              <p>Check <strong style={{ color:'var(--accent2)' }}>
                {email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}
              </strong> for your reset code</p>
            </div>

            <form onSubmit={resetPassword} className="auth-form">
              <div className="field">
                <label>Reset code (OTP)</label>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={form.otp}
                  onChange={e => setForm({ ...form, otp: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>New password</label>
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={form.new_password}
                  onChange={e => setForm({ ...form, new_password: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <Loader2 size={18} className="spin" /> : 'Reset password'}
              </button>
            </form>

            <div className="auth-microcopy">
              <ShieldCheck size={13} />
              This code expires in 10 minutes. Do not share it with anyone.
            </div>
          </>
        )}

        {!done && (
          <p className="auth-footer">
            <Link to="/login" style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}