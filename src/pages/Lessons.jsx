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
const addMonths = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1);
const addYears = (date, amount) => new Date(date.getFullYear() + amount, 0, 1);
const toDateInput = (date) => {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() - next.getTimezoneOffset());
  return next.toISOString().slice(0, 10);
};
const formatDay = (date) => date.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
const formatMonth = (date) => date.toLocaleDateString([], { month: 'long', year: 'numeric' });
const formatYear = (date) => date.toLocaleDateString([], { year: 'numeric' });
const getWeekStart = (date = new Date()) => {
  const next = new Date(date);
  const day = next.getDay() || 7;
  next.setDate(next.getDate() - day + 1);
  next.setHours(0, 0, 0, 0);
  return next;
};
const getMonthDays = (date) => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return Array.from({ length: last.getDate() }, (_, index) => new Date(first.getFullYear(), first.getMonth(), index + 1));
};
const getYearMonths = (date) => Array.from({ length: 12 }, (_, index) => new Date(date.getFullYear(), index, 1));

export default function Lessons() {
  const { isAdmin } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [currentDate, setCurrentDate] = useState(getWeekStart());
  const [form, setForm] = useState({
    student: '', instructor: '', date: new Date().toISOString().slice(0, 10), startTime: '10:00', endTime: '11:00', pickupLocation: '', notes: ''
  });
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('week');

  const visibleDays = useMemo(() => {
    if (viewMode === 'day') return [new Date()];
    if (viewMode === 'month') return getMonthDays(currentDate);
    if (viewMode === 'year') {
      const first = new Date(currentDate.getFullYear(), 0, 1);
      const last = new Date(currentDate.getFullYear(), 11, 31);
      const totalDays = Math.round((last - first) / 86400000) + 1;
      return Array.from({ length: totalDays }, (_, index) => addDays(first, index));
    }
    const weekStart = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  }, [currentDate, viewMode]);

  const from = toDateInput(visibleDays[0]);
  const to = toDateInput(visibleDays[visibleDays.length - 1]);

  const title = useMemo(() => {
    if (viewMode === 'day') return 'Today';
    if (viewMode === 'month') return formatMonth(currentDate);
    if (viewMode === 'year') return formatYear(currentDate);
    return formatMonth(currentDate);
  }, [currentDate, viewMode]);

  const load = async () => {
    const requests = [api.get(`/lessons?from=${from}&to=${to}&limit=200`), api.get('/students')];
    if (isAdmin) requests.push(api.get('/instructors'));
    const [lessonRes, studentRes, instructorRes] = await Promise.all(requests);
    const lessonItems = Array.isArray(lessonRes.data) ? lessonRes.data : lessonRes.data.items || [];
    setLessons(lessonItems);
    scheduleLessonReminders(lessonItems);
    setStudents(studentRes.data);
    if (instructorRes) setInstructors(instructorRes.data);
  };

  useEffect(() => { load(); }, [from, to, isAdmin]);

  const lessonsByDate = useMemo(() => visibleDays.reduce((acc, day) => {
    const key = toDateInput(day);
    acc[key] = lessons.filter((lesson) => lesson.date === key);
    return acc;
  }, {}), [lessons, visibleDays]);

  const lessonsByMonth = useMemo(() => getYearMonths(currentDate).reduce((acc, month) => {
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    acc[key] = lessons.filter((lesson) => lesson.date?.startsWith(key));
    return acc;
  }, {}), [lessons, currentDate]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/lessons', form);
      setForm({ ...form, student: '', pickupLocation: '', notes: '' });
      setShowForm(false);
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

  const moveCalendar = (direction) => {
    if (viewMode === 'month') setCurrentDate((date) => addMonths(date, direction));
    else if (viewMode === 'year') setCurrentDate((date) => addYears(date, direction));
    else setCurrentDate((date) => addDays(date, direction * 7));
  };

  const switchView = (mode) => {
    setViewMode(mode);
    if (mode === 'day') setCurrentDate(new Date());
    if (mode === 'week') setCurrentDate(getWeekStart(currentDate));
    if (mode === 'month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    if (mode === 'year') setCurrentDate(new Date(currentDate.getFullYear(), 0, 1));
  };

  const renderLesson = (l) => (
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
  );

  return (
    <div className="page">
      <PageHeader title="Lessons" subtitle="Review lessons by day, week, month or year." />

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
              <select value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })} required>
                <option value="">Select student</option>
                {students.map((s) => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
              </select>
            </label>
            <label>Instructor
              <select value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} required>
                <option value="">Select instructor</option>
                {instructors.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
              </select>
            </label>
            <label>Date<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label>
            <label>Start<input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required /></label>
            <label>End<input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required /></label>
            <label>Pickup<input value={form.pickupLocation} onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })} /></label>
            <label className="full">Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            <div className="form-actions full"><button className="primary-btn">Schedule lesson</button></div>
          </form>
        </Card>
        </div>
      )}

      <Card className="mobile-card lesson-calendar-card">
        <div className="calendar-toolbar sticky-toolbar">
          <button className="icon-btn" onClick={() => moveCalendar(-1)} disabled={viewMode === 'day'}><ChevronLeft size={20} /></button>
          <div>
            <h3>{title}</h3>
            <p>{from} to {to}</p>
            <div className="segmented">
              <button className={viewMode === 'day' ? 'active' : ''} onClick={() => switchView('day')}>Day</button>
              <button className={viewMode === 'week' ? 'active' : ''} onClick={() => switchView('week')}>Week</button>
              <button className={viewMode === 'month' ? 'active' : ''} onClick={() => switchView('month')}>Month</button>
              <button className={viewMode === 'year' ? 'active' : ''} onClick={() => switchView('year')}>Year</button>
            </div>
          </div>
          <button className="icon-btn" onClick={() => moveCalendar(1)} disabled={viewMode === 'day'}><ChevronRight size={20} /></button>
        </div>

        {!lessons.length ? (
          <EmptyState title="No lessons found" text="Scheduled lessons will appear on the selected calendar view." />
        ) : viewMode === 'year' ? (
          <div className="year-calendar-grid">
            {getYearMonths(currentDate).map((month) => {
              const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
              const monthLessons = lessonsByMonth[key] || [];
              return (
                <section className="year-calendar-card" key={key}>
                  <h4>{month.toLocaleDateString([], { month: 'short' })}</h4>
                  <p className="year-card-count">{monthLessons.length} lesson{monthLessons.length === 1 ? '' : 's'}</p>
                  <div className="mini-event-stack">
                    {monthLessons.slice(0, 4).map((lesson) => <span className="mini-pill" key={lesson._id}>{lesson.date.slice(5)} · {lesson.startTime}</span>)}
                    {monthLessons.length > 4 && <span className="mini-pill muted-pill">+{monthLessons.length - 4} more</span>}
                  </div>
                </section>
              );
            })}
          </div>
        ) : viewMode === 'month' ? (
          <div className="month-calendar-grid">
            {visibleDays.map((day) => {
              const key = toDateInput(day);
              return (
                <section className="month-calendar-cell" key={key}>
                  <div className="month-cell-head"><strong>{day.getDate()}</strong><span>{day.toLocaleDateString([], { weekday: 'short' })}</span></div>
                  <div className="mini-event-stack">
                    {lessonsByDate[key]?.slice(0, 3).map((lesson) => <span className="mini-pill" key={lesson._id}>{lesson.startTime} · {lesson.student?.firstName}</span>)}
                    {(lessonsByDate[key]?.length || 0) > 3 && <span className="mini-pill muted-pill">+{lessonsByDate[key].length - 3} more</span>}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="lesson-week">
            {visibleDays.map((day) => {
              const key = toDateInput(day);
              return (
                <section className="lesson-day" key={key}>
                  <div className="lesson-day-head"><strong>{formatDay(day)}</strong><span>{lessonsByDate[key]?.length || 0} lesson{lessonsByDate[key]?.length === 1 ? '' : 's'}</span></div>
                  {!lessonsByDate[key]?.length ? <p className="quiet-line">No lessons</p> : lessonsByDate[key].map(renderLesson)}
                </section>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
