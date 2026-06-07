import React, { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react';
import api from '../api.js';
import { Card, EmptyState, ErrorMessage, PageHeader } from '../components/UI.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = Array.from({ length: 13 }, (_, index) => 7 + index);
const todayInput = () => new Date().toISOString().slice(0, 10);
const toDateInput = (date) => date.toISOString().slice(0, 10);
const monthTitle = (date) => date.toLocaleDateString([], { month: 'long', year: 'numeric' });
const dayNameFromDate = (value) => new Date(`${value}T12:00:00`).toLocaleDateString([], { weekday: 'long' });
const startOfMonthGrid = (date) => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const day = first.getDay() || 7;
  first.setDate(first.getDate() - day + 1);
  first.setHours(0, 0, 0, 0);
  return first;
};
const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};
const addMonths = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1);
const toMinutes = (time) => {
  const [h, m] = String(time).split(':').map(Number);
  return h * 60 + m;
};
const slotStyle = (slot) => {
  const start = toMinutes(slot.startTime);
  const end = toMinutes(slot.endTime);
  const top = ((start - 7 * 60) / (12 * 60)) * 100;
  const height = ((end - start) / (12 * 60)) * 100;
  return { top: `${Math.max(top, 0)}%`, height: `${Math.max(height, 7)}%` };
};

export default function Availability() {
  const { isAdmin, user } = useAuth();
  const [items, setItems] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [selectedInstructor, setSelectedInstructor] = useState(isAdmin ? 'all' : user?._id || '');
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayInput());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState('availability');
  const [form, setForm] = useState({ instructor: user?._id || '', dayOfWeek: dayNameFromDate(todayInput()), startTime: '09:00', endTime: '17:00' });
  const [lessonForm, setLessonForm] = useState({ student: '', instructor: user?._id || '', date: todayInput(), startTime: '10:00', endTime: '11:00', pickupLocation: '', notes: '' });
  const [error, setError] = useState('');

  const gridDays = useMemo(() => Array.from({ length: 42 }, (_, index) => addDays(startOfMonthGrid(month), index)), [month]);
  const monthFrom = toDateInput(gridDays[0]);
  const monthTo = toDateInput(gridDays[41]);

  const load = async () => {
    const requests = [api.get('/availability'), api.get(`/lessons?from=${monthFrom}&to=${monthTo}&limit=200`), api.get('/students')];
    if (isAdmin) requests.push(api.get('/instructors'));
    const [availabilityRes, lessonsRes, studentsRes, instructorRes] = await Promise.all(requests);
    setItems(availabilityRes.data);
    const lessonItems = Array.isArray(lessonsRes.data) ? lessonsRes.data : lessonsRes.data.items || [];
    setLessons(lessonItems);
    setStudents(studentsRes.data);
    if (instructorRes) setInstructors(instructorRes.data);
  };

  useEffect(() => { load(); }, [monthFrom, monthTo, isAdmin]);

  const filteredItems = useMemo(() => {
    if (!isAdmin || selectedInstructor === 'all') return items;
    return items.filter((item) => item.instructor?._id === selectedInstructor);
  }, [items, selectedInstructor, isAdmin]);

  const filteredLessons = useMemo(() => {
    if (!isAdmin || selectedInstructor === 'all') return lessons;
    return lessons.filter((lesson) => lesson.instructor?._id === selectedInstructor);
  }, [lessons, selectedInstructor, isAdmin]);

  const grouped = useMemo(() => days.reduce((acc, day) => {
    acc[day] = filteredItems.filter((item) => item.dayOfWeek === day);
    return acc;
  }, {}), [filteredItems]);

  const lessonsByDate = useMemo(() => filteredLessons.reduce((acc, lesson) => {
    acc[lesson.date] = acc[lesson.date] || [];
    acc[lesson.date].push(lesson);
    return acc;
  }, {}), [filteredLessons]);

  const availabilityCountForDate = (dateValue) => grouped[dayNameFromDate(dateValue)]?.length || 0;

  const openDate = (dateValue, tab = 'availability') => {
    const dayOfWeek = dayNameFromDate(dateValue);
    const instructor = isAdmin ? (selectedInstructor !== 'all' ? selectedInstructor : '') : user?._id || '';
    setSelectedDate(dateValue);
    setSheetTab(tab);
    setError('');
    setForm({ instructor, dayOfWeek, startTime: '09:00', endTime: '17:00' });
    setLessonForm({ student: '', instructor, date: dateValue, startTime: '10:00', endTime: '11:00', pickupLocation: '', notes: '' });
    setSheetOpen(true);
  };

  const submitAvailability = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/availability', { ...form, instructor: isAdmin ? form.instructor : user._id, dayOfWeek: dayNameFromDate(selectedDate) });
      await load();
      setError('Availability added successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save availability.');
    }
  };

  const submitLesson = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/lessons', { ...lessonForm, instructor: isAdmin ? lessonForm.instructor : user._id, date: selectedDate });
      await load();
      setLessonForm({ ...lessonForm, student: '', pickupLocation: '', notes: '' });
      setError('Lesson added successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add lesson.');
    }
  };

  const remove = async (id) => {
    await api.delete(`/availability/${id}`);
    await load();
  };

  return (
    <div className="page">
      <PageHeader title="Calender" subtitle="Click any calendar date to add availability or schedule a lesson." />

      <Card className="mobile-card calendar-card">
        <div className="calendar-toolbar sticky-toolbar">
          <button className="icon-btn" onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft size={20} /></button>
          <div>
            <h3>{monthTitle(month)}</h3>
            <p>Tap a date to add availability or a lesson.</p>
          </div>
          <button className="icon-btn" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight size={20} /></button>
        </div>

        {isAdmin && (
          <div className="calendar-filter-row">
            <select value={selectedInstructor} onChange={(e) => setSelectedInstructor(e.target.value)}>
              <option value="all">All instructors</option>
              {instructors.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
            </select>
          </div>
        )}

        <div className="month-calendar">
          {shortDays.map((day) => <strong className="month-weekday" key={day}>{day}</strong>)}
          {gridDays.map((day) => {
            const key = toDateInput(day);
            const inMonth = day.getMonth() === month.getMonth();
            const lessonCount = lessonsByDate[key]?.length || 0;
            const availabilityCount = availabilityCountForDate(key);
            return (
              <button className={`month-day ${!inMonth ? 'muted-day' : ''} ${key === todayInput() ? 'today-day' : ''}`} key={key} onClick={() => openDate(key)}>
                <span>{day.getDate()}</span>
                <small>{availabilityCount ? `${availabilityCount} available` : 'Add'}</small>
                {lessonCount > 0 && <em>{lessonCount} lesson{lessonCount === 1 ? '' : 's'}</em>}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="mobile-card">
        <div className="calendar-toolbar">
          <div>
            <h3>Weekly availability</h3>
            <p>Recurring availability shown by weekday.</p>
          </div>
        </div>

        {!items.length ? (
          <EmptyState title="No availability added" text="Click a date above and add availability." />
        ) : (
          <div className="week-calendar-scroll">
            <div className="week-calendar">
              <div className="time-rail">
                {hours.map((hour) => <span key={hour}>{`${String(hour).padStart(2, '0')}:00`}</span>)}
              </div>
              {days.map((day, index) => (
                <section className="week-day" key={day}>
                  <button className="week-day-head clickable-week-head" onClick={() => openDate(toDateInput(addDays(new Date(), index)), 'availability')}><strong>{shortDays[index]}</strong><span>{grouped[day]?.length || 0}</span></button>
                  <div className="day-track">
                    {hours.slice(0, -1).map((hour) => <i key={hour} />)}
                    {grouped[day]?.map((slot) => (
                      <article className="availability-block" style={slotStyle(slot)} key={slot._id}>
                        <strong>{slot.startTime} - {slot.endTime}</strong>
                        {isAdmin && <span>{slot.instructor?.name}</span>}
                        <button onClick={() => remove(slot._id)} aria-label="Delete availability"><Trash2 size={14} /></button>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </Card>

      {sheetOpen && (
        <div className="sheet-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setSheetOpen(false); }}>
          <Card className="mobile-card compact-card bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="card-title">
              <div>
                <h3>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
                <p className="muted-line">Choose what you want to add for this date.</p>
              </div>
              <button className="icon-btn" onClick={() => setSheetOpen(false)} type="button"><X size={18} /></button>
            </div>

            <div className="segmented wide-segmented">
              <button className={sheetTab === 'availability' ? 'active' : ''} onClick={() => setSheetTab('availability')}>Availability</button>
              <button className={sheetTab === 'lesson' ? 'active' : ''} onClick={() => setSheetTab('lesson')}>Lesson</button>
            </div>

            <ErrorMessage message={error && !error.toLowerCase().includes('successfully') ? error : ''} />
            {error && error.toLowerCase().includes('successfully') && <div className="alert success">{error}</div>}

            {sheetTab === 'availability' && (
              <form className="grid-form mobile-first-form" onSubmit={submitAvailability}>
                {isAdmin && (
                  <label className="full">Instructor
                    <select value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} required>
                      <option value="">Select instructor</option>
                      {instructors.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
                    </select>
                  </label>
                )}
                <label>Start<input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required /></label>
                <label>End<input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required /></label>
                <div className="form-actions full"><button className="primary-btn">Add availability</button></div>
              </form>
            )}

            {sheetTab === 'lesson' && (
              <form className="grid-form mobile-first-form" onSubmit={submitLesson}>
                <label className="full">Student
                  <select value={lessonForm.student} onChange={(e) => setLessonForm({ ...lessonForm, student: e.target.value })} required>
                    <option value="">Select student</option>
                    {students.map((s) => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
                  </select>
                </label>
                {isAdmin && (
                  <label className="full">Instructor
                    <select value={lessonForm.instructor} onChange={(e) => setLessonForm({ ...lessonForm, instructor: e.target.value })} required>
                      <option value="">Select instructor</option>
                      {instructors.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
                    </select>
                  </label>
                )}
                <label>Start<input type="time" value={lessonForm.startTime} onChange={(e) => setLessonForm({ ...lessonForm, startTime: e.target.value })} required /></label>
                <label>End<input type="time" value={lessonForm.endTime} onChange={(e) => setLessonForm({ ...lessonForm, endTime: e.target.value })} required /></label>
                <label>Pickup<input value={lessonForm.pickupLocation} onChange={(e) => setLessonForm({ ...lessonForm, pickupLocation: e.target.value })} /></label>
                <label className="full">Notes<textarea value={lessonForm.notes} onChange={(e) => setLessonForm({ ...lessonForm, notes: e.target.value })} /></label>
                <div className="form-actions full"><button className="primary-btn"><CalendarPlus size={16} /> Add lesson</button></div>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
