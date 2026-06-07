import React, { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, CalendarDays, Clock3, GraduationCap, Plus, Route, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import { Badge, Card, EmptyState, PageHeader } from '../components/UI.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const todayKey = new Date().toISOString().slice(0, 10);

export default function Dashboard() {
  const { isAdmin, user } = useAuth();
  const [stats, setStats] = useState({ students: 0, instructors: 0, lessons: 0, upcoming: [] });

  const load = async () => {
    const { data } = await api.get('/dashboard/stats');
    setStats(data);
  };

  useEffect(() => { load(); }, []);

  const todayLessons = useMemo(() => (stats.upcoming || []).filter((lesson) => lesson.date === todayKey), [stats.upcoming]);
  const nextLesson = stats.upcoming?.[0];

  return (
    <div className="page dashboard-page">
      <img src="https://kudosdrivingschool.co.uk/wp-content/uploads/2025/05/rsz_kudos_new_logo_final_1-01.png" width:"150px" height="50px"/>
      <PageHeader
        title="Home"
        subtitle={isAdmin ? 'Live mobile command center for your school.' : 'Your students, schedule and reminders in one place.'}
      />

      <section className="hero-card app-card">
        <div className="hero-copy">
          <span className="eyebrow">Kudos Driving School</span>
          
          <h3>{isAdmin ? 'School operations' : `Ready for today, ${user?.name?.split(' ')[0] || 'Instructor'}?`}</h3>
          <p>{nextLesson ? `Next lesson: ${nextLesson.startTime} with ${nextLesson.student?.firstName || 'student'}.` : 'No upcoming lesson found. Keep your availability updated.'}</p>
        </div>
        <div className="hero-orb"><Route size={42} /></div>
      </section>

      <div className="quick-actions">
        <Link to="/lessons" className="quick-action"><CalendarDays size={18} /><span>Lessons</span></Link>
        <Link to="/availability" className="quick-action"><Clock3 size={18} /><span>Calender</span></Link>
        <Link to="/students" className="quick-action"><GraduationCap size={18} /><span>Students</span></Link>
        {isAdmin && <Link to="/instructors" className="quick-action"><Plus size={18} /><span>Team</span></Link>}
      </div>

      <div className="stats-grid app-stats">
        <Card className="stat-card glow-card"><GraduationCap /><div><span>Students</span><strong>{stats.students}</strong></div></Card>
        {isAdmin && <Card className="stat-card glow-card"><Users /><div><span>Instructors</span><strong>{stats.instructors}</strong></div></Card>}
        <Card className="stat-card glow-card"><CalendarCheck /><div><span>Lessons</span><strong>{stats.lessons}</strong></div></Card>
        <Card className="stat-card glow-card"><ShieldCheck /><div><span>Today</span><strong>{todayLessons.length}</strong></div></Card>
      </div>

      <Card className="mobile-card timeline-card">
        <div className="card-title">
          <div>
            <h3>Upcoming Lessons</h3>
            <p className="quiet-line">Optimized as a phone timeline.</p>
          </div>
          <Link className="small-btn" to="/lessons">View all</Link>
        </div>
        {!stats.upcoming?.length ? (
          <EmptyState title="No upcoming lessons" text="Scheduled lessons will show here." />
        ) : (
          <div className="lesson-timeline">
            {stats.upcoming.map((lesson) => (
              <article className="timeline-item" key={lesson._id}>
                <div className="timeline-time"><strong>{lesson.startTime}</strong><span>{lesson.date}</span></div>
                <div className="timeline-dot" />
                <div className="timeline-body">
                  <strong>{lesson.student?.firstName} {lesson.student?.lastName}</strong>
                  <span>{isAdmin ? `Instructor: ${lesson.instructor?.name || 'Unassigned'}` : lesson.student?.phone}</span>
                  <Badge tone="blue">{lesson.status}</Badge>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
