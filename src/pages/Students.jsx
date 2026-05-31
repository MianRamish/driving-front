import React, { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, Mail, MapPin, Phone, Search, UserRound, X } from 'lucide-react';
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
  status: 'new',
  notes: '',
  lostReason: ''
};

const today = () => new Date().toISOString().slice(0, 10);
const studentName = (student) => `${student?.firstName || ''} ${student?.lastName || ''}`.trim();

export default function Students() {
  const { isAdmin, isInstructor, user } = useAuth();
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [form, setForm] = useState(initial);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalTab, setModalTab] = useState('lesson');
  const [modalError, setModalError] = useState('');
  const [lessonForm, setLessonForm] = useState({ date: today(), startTime: '10:00', endTime: '11:00', pickupLocation: '', notes: '' });
  const [lostReason, setLostReason] = useState('');

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
      `${s.firstName} ${s.lastName} ${s.phone} ${s.postalCode} ${s.email} ${s.status}`.toLowerCase().includes(q)
    );
  }, [students, query]);

  const openStudent = (student, tab = 'lesson') => {
    setSelectedStudent(student);
    setModalTab(tab);
    setModalError('');
    setLostReason(student.lostReason || '');
    setLessonForm({ date: today(), startTime: '10:00', endTime: '11:00', pickupLocation: '', notes: '' });
    setForm({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      phone: student.phone || '',
      postalCode: student.postalCode || '',
      assignedInstructor: student.assignedInstructor?._id || '',
      status: student.status || 'new',
      notes: student.notes || '',
      lostReason: student.lostReason || ''
    });
  };

  const closeStudent = () => {
    setSelectedStudent(null);
    setModalError('');
    setForm(initial);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/students', form);
      setForm(initial);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save student.');
    }
  };

  const saveStudentDetails = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !isAdmin) return;
    setModalError('');
    try {
      const { data } = await api.put(`/students/${selectedStudent._id}`, form);
      setSelectedStudent(data);
      await load();
      setModalTab('lesson');
    } catch (err) {
      setModalError(err.response?.data?.message || 'Could not update student.');
    }
  };

  const createLesson = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setModalError('');

    const instructor = isAdmin ? (form.assignedInstructor || selectedStudent.assignedInstructor?._id) : user?._id;
    if (!instructor) {
      setModalError('Please assign an instructor before adding a lesson.');
      return;
    }

    try {
      await api.post('/lessons', {
        ...lessonForm,
        student: selectedStudent._id,
        instructor
      });
      setLessonForm({ date: lessonForm.date, startTime: '10:00', endTime: '11:00', pickupLocation: '', notes: '' });
      await load();
      setModalError('Lesson added successfully.');
    } catch (err) {
      setModalError(err.response?.data?.message || 'Could not add lesson.');
    }
  };

  const markLost = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setModalError('');
    try {
      const { data } = await api.put(`/students/${selectedStudent._id}`, { status: 'lost', lostReason, notes: form.notes });
      setSelectedStudent(data);
      await load();
      setModalError('Student marked as lost.');
    } catch (err) {
      setModalError(err.response?.data?.message || 'Could not mark student as lost.');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this student?')) return;
    await api.delete(`/students/${id}`);
    await load();
    closeStudent();
  };

  return (
    <div className="page">
      <PageHeader title="Students" subtitle="Click a student to assign, add lessons, or mark as lost." />

      {isAdmin && (
        <Card>
          <div className="card-title">
            <h3>Add Student</h3>
          </div>
          <form className="grid-form" onSubmit={submit}>
            <ErrorMessage message={error} />
            <label>First name<input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></label>
            <label>Last name<input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></label>
            <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></label>
            <p className="form-help full">Use international format for SMS notifications, for example +923039358816.</p>
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
              <button className="primary-btn">Create Student</button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="toolbar">
          <h3>{isInstructor ? 'My Students' : 'Student List'}</h3>
          <div className="search-wrap"><Search size={17} /><input className="search" placeholder="Search students..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        </div>

        {!filtered.length ? (
          <EmptyState title="No students found" text="Add a student or change your search." />
        ) : (
          <>
          <div className="student-card-grid always-cards">
            {filtered.map((s) => (
              <button className="student-app-card clickable-card" key={`card-${s._id}`} onClick={() => openStudent(s)}>
                <div className="student-avatar"><UserRound size={22} /></div>
                <div className="student-card-main">
                  <div className="student-card-head">
                    <div><strong>{studentName(s)}</strong><span>{s.assignedInstructor?.name || 'Unassigned'}</span></div>
                    <Badge tone={s.status === 'lost' ? 'red' : s.status === 'active' ? 'green' : 'blue'}>{s.status}</Badge>
                  </div>
                  <div className="student-meta-grid">
                    <span><Phone size={14} />{s.phone}</span>
                    <span><MapPin size={14} />{s.postalCode}</span>
                    {s.email && <span><Mail size={14} />{s.email}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="responsive-table desktop-table">
            <table>
              <thead><tr><th>Name</th><th>Phone</th><th>Postcode</th><th>Instructor</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s._id}>
                    <td data-label="Name"><button className="link-button" onClick={() => openStudent(s)}><strong>{studentName(s)}</strong><span>{s.email}</span></button></td>
                    <td data-label="Phone">{s.phone}</td>
                    <td data-label="Postcode">{s.postalCode}</td>
                    <td data-label="Instructor">{s.assignedInstructor?.name || 'Unassigned'}</td>
                    <td data-label="Status"><Badge tone={s.status === 'lost' ? 'red' : s.status === 'active' ? 'green' : 'blue'}>{s.status}</Badge></td>
                    <td className="actions"><button className="small-btn" onClick={() => openStudent(s)}><CalendarPlus size={14} /> Open</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </Card>

      {selectedStudent && (
        <div className="sheet-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeStudent(); }}>
          <Card className="mobile-card compact-card bottom-sheet student-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="card-title">
              <div>
                <h3>{studentName(selectedStudent)}</h3>
                <p className="muted-line">{selectedStudent.phone} · {selectedStudent.assignedInstructor?.name || 'Unassigned'}</p>
              </div>
              <button className="icon-btn" onClick={closeStudent} type="button"><X size={18} /></button>
            </div>

            <div className="segmented wide-segmented">
              <button className={modalTab === 'lesson' ? 'active' : ''} onClick={() => setModalTab('lesson')}>Add lesson</button>
              {isAdmin && <button className={modalTab === 'details' ? 'active' : ''} onClick={() => setModalTab('details')}>Assign / edit</button>}
              <button className={modalTab === 'lost' ? 'active' : ''} onClick={() => setModalTab('lost')}>Mark lost</button>
            </div>

            <ErrorMessage message={modalError && !modalError.toLowerCase().includes('successfully') && !modalError.toLowerCase().includes('marked') ? modalError : ''} />
            {modalError && (modalError.toLowerCase().includes('successfully') || modalError.toLowerCase().includes('marked')) && <div className="alert success">{modalError}</div>}

            {modalTab === 'lesson' && (
              <form className="grid-form mobile-first-form" onSubmit={createLesson}>
                {isAdmin && (
                  <label className="full">Instructor
                    <select value={form.assignedInstructor} onChange={(e) => setForm({ ...form, assignedInstructor: e.target.value })} required>
                      <option value="">Select instructor</option>
                      {instructors.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
                    </select>
                  </label>
                )}
                <label>Date<input type="date" value={lessonForm.date} onChange={(e) => setLessonForm({ ...lessonForm, date: e.target.value })} required /></label>
                <label>Start<input type="time" value={lessonForm.startTime} onChange={(e) => setLessonForm({ ...lessonForm, startTime: e.target.value })} required /></label>
                <label>End<input type="time" value={lessonForm.endTime} onChange={(e) => setLessonForm({ ...lessonForm, endTime: e.target.value })} required /></label>
                <label>Pickup<input value={lessonForm.pickupLocation} onChange={(e) => setLessonForm({ ...lessonForm, pickupLocation: e.target.value })} /></label>
                <label className="full">Lesson notes<textarea value={lessonForm.notes} onChange={(e) => setLessonForm({ ...lessonForm, notes: e.target.value })} /></label>
                <div className="form-actions full"><button className="primary-btn">Add lesson</button></div>
              </form>
            )}

            {modalTab === 'details' && isAdmin && (
              <form className="grid-form mobile-first-form" onSubmit={saveStudentDetails}>
                <label>First name<input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></label>
                <label>Last name<input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></label>
                <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
                <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></label>
                <p className="form-help full">Use international format for SMS notifications, for example +923039358816.</p>
                <label>Postal code<input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} required /></label>
                <label>Status
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="new">New</option><option value="assigned">Assigned</option><option value="active">Active</option><option value="completed">Completed</option><option value="on-hold">On-hold</option><option value="lost">Lost</option>
                  </select>
                </label>
                <label className="full">Instructor
                  <select value={form.assignedInstructor} onChange={(e) => setForm({ ...form, assignedInstructor: e.target.value })}>
                    <option value="">Unassigned</option>
                    {instructors.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
                  </select>
                </label>
                <label className="full">Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
                <div className="form-actions full"><button className="primary-btn">Save changes</button><button className="danger-btn" type="button" onClick={() => remove(selectedStudent._id)}>Delete</button></div>
              </form>
            )}

            {modalTab === 'lost' && (
              <form className="grid-form mobile-first-form" onSubmit={markLost}>
                <p className="full quiet-line">Use this when the instructor could not continue with the student. A reason is required so the office can review it later.</p>
                <label className="full">Reason / comment<textarea value={lostReason} onChange={(e) => setLostReason(e.target.value)} placeholder="Example: Student moved area, stopped responding, price issue..." required /></label>
                <label className="full">Internal notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
                <div className="form-actions full"><button className="danger-btn">Mark student lost</button></div>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
