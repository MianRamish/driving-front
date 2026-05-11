import React, { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import api from '../api.js';
import { Card, EmptyState, ErrorMessage, PageHeader } from '../components/UI.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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

export default function Availability() {
  const { isAdmin, user } = useAuth();
  const [items, setItems] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [selectedInstructor, setSelectedInstructor] = useState('all');
  const [viewMode, setViewMode] = useState('week');
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

  useEffect(() => { load(); }, [isAdmin]);

  const filteredItems = useMemo(() => {
    if (!isAdmin || selectedInstructor === 'all') return items;
    return items.filter((item) => item.instructor?._id === selectedInstructor);
  }, [items, selectedInstructor, isAdmin]);

  const grouped = useMemo(() => days.reduce((acc, day) => {
    acc[day] = filteredItems.filter((item) => item.dayOfWeek === day);
    return acc;
  }, {}), [filteredItems]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/availability', { ...form, instructor: isAdmin ? form.instructor : user._id });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save availability.');
    }
  };

  const remove = async (id) => {
    await api.delete(`/availability/${id}`);
    await load();
  };

  const renderSlotSummary = (slot) => (
    <article className="mini-calendar-event" key={slot._id}>
      <strong>{slot.startTime} - {slot.endTime}</strong>
      {isAdmin && <span>{slot.instructor?.name}</span>}
      <button onClick={() => remove(slot._id)} aria-label="Delete availability"><Trash2 size={14} /></button>
    </article>
  );

  return (
    <div className="page">
      <PageHeader title="Availability" subtitle="Set weekly working hours and review them by week, month or year." />

      <Card className="mobile-card compact-card">
        <div className="card-title"><h3>Add availability</h3></div>
        <form className="grid-form mobile-first-form" onSubmit={submit}>
          <ErrorMessage message={error} />
          {isAdmin && (
            <label className="full">Instructor
              <select value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} required>
                <option value="">Select instructor</option>
                {instructors.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
              </select>
            </label>
          )}
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
            <h3>{viewMode === 'week' ? 'Weekly calendar' : viewMode === 'month' ? 'Monthly calendar' : 'Yearly calendar'}</h3>
            <p>Availability is recurring weekly, so month and year show repeated weekly coverage.</p>
            <div className="segmented">
              <button className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>Week</button>
              <button className={viewMode === 'month' ? 'active' : ''} onClick={() => setViewMode('month')}>Month</button>
              <button className={viewMode === 'year' ? 'active' : ''} onClick={() => setViewMode('year')}>Year</button>
            </div>
          </div>
          {isAdmin && (
            <select value={selectedInstructor} onChange={(e) => setSelectedInstructor(e.target.value)}>
              <option value="all">All instructors</option>
              {instructors.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
            </select>
          )}
        </div>

        {!filteredItems.length ? (
          <EmptyState title="No availability added" text="Create availability from the form above." />
        ) : viewMode === 'week' ? (
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
          </div>
        ) : viewMode === 'month' ? (
          <div className="month-calendar-grid availability-month-grid">
            {days.map((day, index) => (
              <section className="month-calendar-cell" key={day}>
                <div className="month-cell-head"><strong>{shortDays[index]}</strong><span>{grouped[day]?.length || 0} slots / week</span></div>
                <div className="mini-event-stack">
                  {grouped[day]?.length ? grouped[day].map(renderSlotSummary) : <p className="quiet-line">No availability</p>}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="year-calendar-grid">
            {months.map((month) => (
              <section className="year-calendar-card" key={month}>
                <h4>{month}</h4>
                <div className="year-day-list">
                  {days.map((day, index) => (
                    <div className="year-day-row" key={`${month}-${day}`}>
                      <strong>{shortDays[index]}</strong>
                      <span>{grouped[day]?.length || 0} slot{grouped[day]?.length === 1 ? '' : 's'}</span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
