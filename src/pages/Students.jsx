import React, { useEffect, useMemo, useState } from 'react';
import { Mail, MapPin, Phone, Search, UserRound } from 'lucide-react';
import api from '../api.js';
import { Badge, Card, EmptyState, ErrorMessage, PageHeader } from '../components/UI.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const initial = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  postalCode: '',
  assignedInstructor: '',
  notes: ''
};

export default function Students() {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const [{ data: studentData }, instructorRes] = await Promise.all([
      api.get('/students'),
      isAdmin ? api.get('/instructors') : Promise.resolve({ data: [] })
    ]);
    setStudents(studentData);
    setInstructors(instructorRes.data);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return students.filter((s) =>
      `${s.firstName} ${s.lastName} ${s.phone} ${s.postalCode} ${s.email}`.toLowerCase().includes(q)
    );
  }, [students, query]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editing) {
        await api.put(`/students/${editing}`, form);
      } else {
        await api.post('/students', form);
      }
      setForm(initial);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save student.');
    }
  };

  const startEdit = (student) => {
    setEditing(student._id);
    setForm({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      phone: student.phone || '',
      postalCode: student.postalCode || '',
      assignedInstructor: student.assignedInstructor?._id || '',
      notes: student.notes || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!confirm('Delete this student?')) return;
    await api.delete(`/students/${id}`);
    await load();
  };

  return (
    <div className="page">
      <PageHeader title="Students" subtitle="Create, assign and manage student records." />

      {isAdmin && (
        <Card className="mobile-form-card student-form-card">
          <div className="card-title">
            <h3>{editing ? 'Edit Student' : 'Add Student'}</h3>
          </div>
          <form className="grid-form mobile-first-form" onSubmit={submit}>
            <ErrorMessage message={error} />
            <label>First name<input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></label>
            <label>Last name<input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></label>
            <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></label>
            <label>Postal code<input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} required /></label>
            <label>
              Instructor
              <select value={form.assignedInstructor} onChange={(e) => setForm({ ...form, assignedInstructor: e.target.value })}>
                <option value="">Auto assign / Unassigned</option>
                {instructors.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
              </select>
            </label>
            <label className="full">Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            <div className="form-actions full">
              <button className="primary-btn">{editing ? 'Update Student' : 'Create Student'}</button>
              {editing && <button type="button" className="ghost-btn" onClick={() => { setEditing(null); setForm(initial); }}>Cancel</button>}
            </div>
          </form>
        </Card>
      )}

      <Card className="student-list-card">
        <div className="toolbar">
          <h3>Student List</h3>
          <div className="search-wrap"><Search size={17} /><input className="search" placeholder="Search students..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        </div>

        {!filtered.length ? (
          <EmptyState title="No students found" text="Add a student or change your search." />
        ) : (
          <>
          <div className="student-card-grid">
            {filtered.map((s) => (
              <article className="student-app-card" key={`card-${s._id}`}>
                <div className="student-avatar"><UserRound size={22} /></div>
                <div className="student-card-main">
                  <div className="student-card-head">
                    <div><strong>{s.firstName} {s.lastName}</strong><span>{s.assignedInstructor?.name || 'Unassigned'}</span></div>
                    <Badge>{s.status}</Badge>
                  </div>
                  <div className="student-meta-grid">
                    <span><Phone size={14} />{s.phone}</span>
                    <span><MapPin size={14} />{s.postalCode}</span>
                    {s.email && <span><Mail size={14} />{s.email}</span>}
                  </div>
                  {isAdmin && <div className="form-actions"><button className="small-btn" onClick={() => startEdit(s)}>Edit</button><button className="danger-btn" onClick={() => remove(s._id)}>Delete</button></div>}
                </div>
              </article>
            ))}
          </div>
          <div className="responsive-table desktop-table">
            <table>
              <thead><tr><th>Name</th><th>Phone</th><th>Postcode</th><th>Instructor</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s._id}>
                    <td data-label="Name"><strong>{s.firstName} {s.lastName}</strong><span>{s.email}</span></td>
                    <td data-label="Phone">{s.phone}</td>
                    <td data-label="Postcode">{s.postalCode}</td>
                    <td data-label="Instructor">{s.assignedInstructor?.name || 'Unassigned'}</td>
                    <td data-label="Status"><Badge>{s.status}</Badge></td>
                    <td className="actions">
                      {isAdmin && <button className="small-btn" onClick={() => startEdit(s)}>Edit</button>}
                      {isAdmin && <button className="danger-btn" onClick={() => remove(s._id)}>Delete</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </Card>
    </div>
  );
}
