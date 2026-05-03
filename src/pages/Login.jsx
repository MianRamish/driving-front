import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { ErrorMessage } from '../components/UI.jsx';

export default function Login() {
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ email: 'admin@drivingschool.com', password: 'Admin123' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your email and password.');
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <img className="login-logo" src="https://kudosdrivingschool.co.uk/wp-content/uploads/2025/05/rsz_kudos_new_logo_final_1-01.png" alt="Kudos Driving School" />
          <div>
            <h1>Kudos Driving School</h1>
            <p>Driving school management app</p>
          </div>
        </div>

        <form onSubmit={submit} className="form-stack">
          <ErrorMessage message={error} />
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
          <button className="primary-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="demo-box">
          <strong>Demo accounts</strong>
          <span>Admin: admin@drivingschool.com / Admin123</span>
          <span>Instructor: john@drivingschool.com / Instructor123</span>
        </div>
      </section>
    </main>
  );
}
