import React, { useEffect, useState } from 'react';
import api from '../api.js';
import { Badge, Card, EmptyState, ErrorMessage, PageHeader } from '../components/UI.jsx';

const initial = { name: '', email: '', password: 'Instructor123', phone: '', postalCodes: '' };

export default function Instructors() {
  const [instructors, setInstructors] = useState([]);
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await api.get('/instructors');
    setInstructors(data);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) await api.put(`/instructors/${editing}`, form);
      else await api.post('/instructors', form);
      setForm(initial);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save instructor.');
    }
  };

  const startEdit = (i) => {
    setEditing(i._id);
    setForm({
      name: i.name || '',
      email: i.email || '',
      password: '',
      phone: i.phone || '',
      postalCodes: (i.postalCodes || []).join(', ')
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page">
      <PageHeader title="Instructors" subtitle="Manage instructors and their coverage areas." />

      <Card>
        <div className="card-title"><h3>{editing ? 'Edit Instructor' : 'Add Instructor'}</h3></div>
        <form className="grid-form" onSubmit={submit}>
          <ErrorMessage message={error} />
          <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
          <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={Boolean(editing)} /></label>
          {!editing && <label>Password<input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>}
          <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <p className="form-help full">Use international format for SMS notifications, for example +923039358816.</p>
          <label className="full">Postal codes <input placeholder="E1, E2, SW1" value={form.postalCodes} onChange={(e) => setForm({ ...form, postalCodes: e.target.value })} /></label>
          <div className="form-actions full">
            <button className="primary-btn">{editing ? 'Update Instructor' : 'Create Instructor'}</button>
            {editing && <button type="button" className="ghost-btn" onClick={() => { setEditing(null); setForm(initial); }}>Cancel</button>}
          </div>
        </form>
      </Card>

      <Card>
        <div className="card-title"><h3>Instructor List</h3></div>
        {!instructors.length ? (
          <EmptyState title="No instructors" text="Add your first instructor above." />
        ) : (
          <div className="mobile-list">
            {instructors.map((i) => (
              <div className="list-card" key={i._id}>
                <div>
                  <strong>{i.name}</strong>
                  <span>{i.email}</span>
                  <span>{i.phone || 'No phone'}</span>
                  <div className="chips">{(i.postalCodes || []).map((p) => <Badge key={p} tone="blue">{p}</Badge>)}</div>
                </div>
                <button className="small-btn" onClick={() => startEdit(i)}>Edit</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
