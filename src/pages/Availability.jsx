<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
=======
import React, { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
>>>>>>> ea38a54 (Full rebuild: mobile app UI, calendar, notifications, performance)
import api from '../api.js';
import { Card, EmptyState, ErrorMessage, PageHeader } from '../components/UI.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
<<<<<<< HEAD
=======
const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = Array.from({ length: 13 }, (_, index) => 7 + index);
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
>>>>>>> ea38a54 (Full rebuild: mobile app UI, calendar, notifications, performance)

export default function Availability() {
  const { isAdmin, user } = useAuth();
  const [items, setItems] = useState([]);
  const [instructors, setInstructors] = useState([]);
<<<<<<< HEAD
=======
  const [selectedInstructor, setSelectedInstructor] = useState('all');
>>>>>>> ea38a54 (Full rebuild: mobile app UI, calendar, notifications, performance)
  const [form, setForm] = useState({ instructor: user?._id || '', dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' });
  const [error, setError] = useState('');

  const load = async () => {
    const [{ data: availability }, instructorRes] = await Promise.all([
      api.get('/availability'),
      isAdmin ? api.get('/instructors') : Promise.resolve({ data: [] })
    ]);
    setItems(availability);
    setInstructors(instructorRes.data);
  };

  useEffect(() => { load(); }, []);

<<<<<<< HEAD
=======
  const filteredItems = useMemo(() => {
    if (!isAdmin || selectedInstructor === 'all') return items;
    return items.filter((item) => item.instructor?._id === selectedInstructor);
  }, [items, selectedInstructor, isAdmin]);

  const grouped = useMemo(() => days.reduce((acc, day) => {
    acc[day] = filteredItems.filter((item) => item.dayOfWeek === day);
    return acc;
  }, {}), [filteredItems]);

>>>>>>> ea38a54 (Full rebuild: mobile app UI, calendar, notifications, performance)
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
<<<<<<< HEAD
      await api.post('/availability', {
        ...form,
        instructor: isAdmin ? form.instructor : user._id
      });
=======
      await api.post('/availability', { ...form, instructor: isAdmin ? form.instructor : user._id });
>>>>>>> ea38a54 (Full rebuild: mobile app UI, calendar, notifications, performance)
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save availability.');
    }
  };

  const remove = async (id) => {
    await api.delete(`/availability/${id}`);
    await load();
  };

  return (
    <div className="page">
<<<<<<< HEAD
      <PageHeader title="Availability" subtitle="Set available working hours for instructors." />

      <Card>
        <div className="card-title"><h3>Add Availability</h3></div>
        <form className="grid-form" onSubmit={submit}>
          <ErrorMessage message={error} />
          {isAdmin && (
            <label>
              Instructor
=======
      <PageHeader title="Availability" subtitle="Set weekly working hours in a mobile calendar view." />

      <Card className="mobile-card compact-card">
        <div className="card-title"><h3>Add availability</h3></div>
        <form className="grid-form mobile-first-form" onSubmit={submit}>
          <ErrorMessage message={error} />
          {isAdmin && (
            <label className="full">Instructor
>>>>>>> ea38a54 (Full rebuild: mobile app UI, calendar, notifications, performance)
              <select value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} required>
                <option value="">Select instructor</option>
                {instructors.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
              </select>
            </label>
          )}
<<<<<<< HEAD
          <label>
            Day
            <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>
              {days.map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label>Start<input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required /></label>
          <label>End<input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required /></label>
          <div className="form-actions full"><button className="primary-btn">Add Availability</button></div>
        </form>
      </Card>

      <Card>
        <div className="card-title"><h3>Availability List</h3></div>
        {!items.length ? (
          <EmptyState title="No availability added" text="Create availability from the form above." />
        ) : (
          <div className="mobile-list compact">
            {items.map((a) => (
              <div className="list-card" key={a._id}>
                <div>
                  <strong>{a.dayOfWeek}</strong>
                  <span>{a.startTime} - {a.endTime}</span>
                  <span>{a.instructor?.name}</span>
                </div>
                <button className="danger-btn" onClick={() => remove(a._id)}>Delete</button>
              </div>
            ))}
=======
          <label>Day
            <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>{days.map((d) => <option key={d}>{d}</option>)}</select>
          </label>
          <label>Start<input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required /></label>
          <label>End<input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required /></label>
          <div className="form-actions full"><button className="primary-btn">Add slot</button></div>
        </form>
      </Card>

      <Card className="mobile-card">
        <div className="calendar-toolbar">
          <div>
            <h3>Weekly calendar</h3>
            <p>Swipe to review every day.</p>
          </div>
          {isAdmin && (
            <select value={selectedInstructor} onChange={(e) => setSelectedInstructor(e.target.value)}>
              <option value="all">All instructors</option>
              {instructors.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
            </select>
          )}
        </div>

        {!items.length ? (
          <EmptyState title="No availability added" text="Create availability from the form above." />
        ) : (
          <div className="week-calendar-scroll">
            <div className="week-calendar">
              <div className="time-rail">
                {hours.map((hour) => <span key={hour}>{`${String(hour).padStart(2, '0')}:00`}</span>)}
              </div>
              {days.map((day, index) => (
                <section className="week-day" key={day}>
                  <div className="week-day-head"><strong>{shortDays[index]}</strong><span>{grouped[day]?.length || 0}</span></div>
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
>>>>>>> ea38a54 (Full rebuild: mobile app UI, calendar, notifications, performance)
          </div>
        )}
      </Card>
    </div>
  );
}
