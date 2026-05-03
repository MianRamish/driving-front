<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import api from '../api.js';
import { Badge, Card, EmptyState, ErrorMessage, PageHeader } from '../components/UI.jsx';
import { useAuth } from '../context/AuthContext.jsx';
=======
import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Plus, Trash2, X } from 'lucide-react';
import api from '../api.js';
import { Badge, Card, EmptyState, ErrorMessage, PageHeader } from '../components/UI.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { scheduleLessonReminders } from '../utils/notifications.js';

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};
const toDateInput = (date) => date.toISOString().slice(0, 10);
const formatDay = (date) => date.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
const formatMonth = (date) => date.toLocaleDateString([], { month: 'long', year: 'numeric' });
const getWeekStart = (date = new Date()) => {
  const next = new Date(date);
  const day = next.getDay() || 7;
  next.setDate(next.getDate() - day + 1);
  next.setHours(0, 0, 0, 0);
  return next;
};
>>>>>>> ea38a54 (Full rebuild: mobile app UI, calendar, notifications, performance)

export default function Lessons() {
  const { isAdmin } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
<<<<<<< HEAD
  const [form, setForm] = useState({
    student: '',
    instructor: '',
    date: new Date().toISOString().slice(0, 10),
    startTime: '10:00',
    endTime: '11:00',
    pickupLocation: '',
    notes: ''
  });
  const [error, setError] = useState('');

  const load = async () => {
    const requests = [api.get('/lessons')];
    if (isAdmin) requests.push(api.get('/students'), api.get('/instructors'));
    const [lessonRes, studentRes, instructorRes] = await Promise.all(requests);
    setLessons(lessonRes.data);
=======
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [form, setForm] = useState({
    student: '', instructor: '', date: new Date().toISOString().slice(0, 10), startTime: '10:00', endTime: '11:00', pickupLocation: '', notes: ''
  });
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('week');

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const from = toDateInput(weekDays[0]);
  const to = toDateInput(weekDays[6]);

  const load = async () => {
    const requests = [api.get(`/lessons?from=${from}&to=${to}&limit=200`)];
    if (isAdmin) requests.push(api.get('/students'), api.get('/instructors'));
    const [lessonRes, studentRes, instructorRes] = await Promise.all(requests);
    const lessonItems = Array.isArray(lessonRes.data) ? lessonRes.data : lessonRes.data.items || [];
    setLessons(lessonItems);
    scheduleLessonReminders(lessonItems);
>>>>>>> ea38a54 (Full rebuild: mobile app UI, calendar, notifications, performance)
    if (studentRes) setStudents(studentRes.data);
    if (instructorRes) setInstructors(instructorRes.data);
  };

<<<<<<< HEAD
  useEffect(() => { load(); }, []);
=======
  useEffect(() => { load(); }, [from, to, isAdmin]);

  const lessonsByDate = useMemo(() => weekDays.reduce((acc, day) => {
    const key = toDateInput(day);
    acc[key] = lessons.filter((lesson) => lesson.date === key);
    return acc;
  }, {}), [lessons, weekDays]);
>>>>>>> ea38a54 (Full rebuild: mobile app UI, calendar, notifications, performance)

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/lessons', form);
      setForm({ ...form, student: '', pickupLocation: '', notes: '' });
<<<<<<< HEAD
=======
      setShowForm(false);
>>>>>>> ea38a54 (Full rebuild: mobile app UI, calendar, notifications, performance)
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not schedule lesson.');
    }
  };

  const updateStatus = async (lesson, status) => {
    await api.put(`/lessons/${lesson._id}`, { status });
    await load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this lesson?')) return;
    await api.delete(`/lessons/${id}`);
    await load();
  };

  return (
    <div className="page">
<<<<<<< HEAD
      <PageHeader title="Lessons" subtitle="Schedule lessons and update lesson status." />

      {isAdmin && (
        <Card>
          <div className="card-title"><h3>Schedule Lesson</h3></div>
          <form className="grid-form" onSubmit={submit}>
            <ErrorMessage message={error} />
            <label>
              Student
=======
      <PageHeader title="Lessons" subtitle="Weekly lesson calendar built for mobile use." />

      {isAdmin && (
        <button className="fab-btn" onClick={() => setShowForm(true)} aria-label="Schedule lesson"><Plus size={24} /></button>
      )}

      {isAdmin && showForm && (
        <div className="sheet-backdrop" onClick={() => setShowForm(false)}>
        <Card className="mobile-card compact-card bottom-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="card-title"><h3>Schedule lesson</h3><button className="icon-btn" onClick={() => setShowForm(false)} type="button"><X size={18} /></button></div>
          <form className="grid-form mobile-first-form" onSubmit={submit}>
            <ErrorMessage message={error} />
            <label>Student
>>>>>>> ea38a54 (Full rebuild: mobile app UI, calendar, notifications, performance)
              <select value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })} required>
                <option value="">Select student</option>
                {students.map((s) => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
              </select>
            </label>
<<<<<<< HEAD
            <label>
              Instructor
=======
            <label>Instructor
>>>>>>> ea38a54 (Full rebuild: mobile app UI, calendar, notifications, performance)
              <select value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} required>
                <option value="">Select instructor</option>
                {instructors.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
              </select>
            </label>
            <label>Date<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label>
            <label>Start<input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required /></label>
            <label>End<input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required /></label>
<<<<<<< HEAD
            <label>Pickup location<input value={form.pickupLocation} onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })} /></label>
            <label className="full">Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            <div className="form-actions full"><button className="primary-btn">Schedule Lesson</button></div>
          </form>
        </Card>
      )}

      <Card>
        <div className="card-title"><h3>Lesson List</h3></div>
        {!lessons.length ? (
          <EmptyState title="No lessons" text="Scheduled lessons will appear here." />
        ) : (
          <div className="mobile-list">
            {lessons.map((l) => (
              <div className="list-card lesson-card" key={l._id}>
                <div>
                  <strong>{l.student?.firstName} {l.student?.lastName}</strong>
                  <span>{l.date} · {l.startTime} - {l.endTime}</span>
                  <span>Instructor: {l.instructor?.name}</span>
                  {l.pickupLocation && <span>Pickup: {l.pickupLocation}</span>}
                </div>
                <div className="lesson-actions">
                  <Badge tone={l.status === 'completed' ? 'green' : l.status === 'cancelled' ? 'red' : 'blue'}>
                    {l.status}
                  </Badge>
                  <select value={l.status} onChange={(e) => updateStatus(l, e.target.value)}>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="missed">Missed</option>
                  </select>
                  {isAdmin && <button className="danger-btn" onClick={() => remove(l._id)}>Delete</button>}
                </div>
              </div>
            ))}
=======
            <label>Pickup<input value={form.pickupLocation} onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })} /></label>
            <label className="full">Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            <div className="form-actions full"><button className="primary-btn">Schedule lesson</button></div>
          </form>
        </Card>
        </div>
      )}

      <Card className="mobile-card lesson-calendar-card">
        <div className="calendar-toolbar sticky-toolbar">
          <button className="icon-btn" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft size={20} /></button>
          <div>
            <h3>{formatMonth(weekStart)}</h3>
            <p>{from} to {to}</p>
            <div className="segmented"><button className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>Week</button><button className={viewMode === 'day' ? 'active' : ''} onClick={() => setViewMode('day')}>Today</button></div>
          </div>
          <button className="icon-btn" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight size={20} /></button>
        </div>

        {!lessons.length ? (
          <EmptyState title="No lessons this week" text="Scheduled lessons will appear on the weekly calendar." />
        ) : (
          <div className="lesson-week">
            {(viewMode === 'day' ? weekDays.filter((day) => toDateInput(day) === new Date().toISOString().slice(0, 10)) : weekDays).map((day) => {
              const key = toDateInput(day);
              return (
                <section className="lesson-day" key={key}>
                  <div className="lesson-day-head"><strong>{formatDay(day)}</strong><span>{lessonsByDate[key]?.length || 0} lesson{lessonsByDate[key]?.length === 1 ? '' : 's'}</span></div>
                  {!lessonsByDate[key]?.length ? <p className="quiet-line">No lessons</p> : lessonsByDate[key].map((l) => (
                    <article className="lesson-event" key={l._id}>
                      <div className="lesson-event-time"><CalendarDays size={16} /><strong>{l.startTime}</strong><span>{l.endTime}</span></div>
                      <div className="lesson-event-body">
                        <strong>{l.student?.firstName} {l.student?.lastName}</strong>
                        <span>{isAdmin ? `Instructor: ${l.instructor?.name || 'Unassigned'}` : l.student?.phone}</span>
                        {l.pickupLocation && <small><MapPin size={13} /> {l.pickupLocation}</small>}
                      </div>
                      <div className="lesson-event-actions">
                        <Badge tone={l.status === 'completed' ? 'green' : l.status === 'cancelled' ? 'red' : 'blue'}>{l.status}</Badge>
                        <select value={l.status} onChange={(e) => updateStatus(l, e.target.value)}>
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="missed">Missed</option>
                        </select>
                        {isAdmin && <button className="danger-btn icon-danger" onClick={() => remove(l._id)}><Trash2 size={15} /></button>}
                      </div>
                    </article>
                  ))}
                </section>
              );
            })}
>>>>>>> ea38a54 (Full rebuild: mobile app UI, calendar, notifications, performance)
          </div>
        )}
      </Card>
    </div>
  );
}
