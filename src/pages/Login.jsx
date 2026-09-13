import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Microscope, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      const token = data.token || data.access_token;
      const user = data.user || { email: form.email };
      login(token, user);
      toast.success('Welcome back! Logged in successfully.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'Invalid credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand"><Microscope size={28} strokeWidth={1.5} /><span>DermaVision</span></div>
      <div className="auth-card">
        <div className="auth-header"><h1>Welcome back</h1><p>Sign in to your DermaVision account</p></div>
        {state?.verified && (
          <div className="alert alert-success">Account verified! You can now sign in.</div>
        )}
        <form onSubmit={handleSubmit} className="auth-form">
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
            <label>
              Password
              <Link to="/forgot-password" className="label-link">Forgot?</Link>
            </label>
            <div className="input-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Enter your password"
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
            {loading ? <Loader2 size={18} className="spin" /> : <>Sign in <ArrowRight size={16} /></>}
          </button>
        </form>
        <p className="auth-footer">No account? <Link to="/signup">Create one</Link></p>
      </div>
    </div>
  );
}