import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/api';
import { Microscope, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.register(form);
      toast.success('Account created! Please check your email for OTP.');
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'Signup failed. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand"><Microscope size={28} strokeWidth={1.5} /><span>DermaVision</span></div>
      <div className="auth-card">
        <div className="auth-header"><h1>Create account</h1><p>AI-powered skin lesion detection</p></div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Email address</label>
            <input
              type="email"
              placeholder="Enter your email address"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <div className="input-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
              <button type="button" className="eye-btn" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 size={18} className="spin" /> : <>Create account <ArrowRight size={16} /></>}
          </button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}