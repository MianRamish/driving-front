import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { CalendarDays, GraduationCap, LayoutDashboard, LogOut, Menu, Users, X, Clock3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationBell from './NotificationBell.jsx';
import BottomNav from './BottomNav.jsx';

const linkClass = ({ isActive }) => `nav-link ${isActive ? 'active' : ''}`;

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'show' : ''}`}>
        <div className="brand">
          <img className="brand-logo" src="https://kudosdrivingschool.co.uk/wp-content/uploads/2025/05/rsz_kudos_new_logo_final_1-01.png" alt="Kudos Driving School" />
          <div>
            <strong>Kudos Driving School</strong>
            <span>Instructor App</span>
          </div>
          <button className="icon-btn mobile-only" onClick={close} aria-label="Close menu"><X size={20} /></button>
        </div>

        <nav className="nav">
          <NavLink onClick={close} className={linkClass} to="/" end><LayoutDashboard size={18} /> Dashboard</NavLink>
          <NavLink onClick={close} className={linkClass} to="/students"><GraduationCap size={18} /> Students</NavLink>
          {isAdmin && <NavLink onClick={close} className={linkClass} to="/instructors"><Users size={18} /> Instructors</NavLink>}
          <NavLink onClick={close} className={linkClass} to="/availability"><Clock3 size={18} /> Calender</NavLink>
          <NavLink onClick={close} className={linkClass} to="/lessons"><CalendarDays size={18} /> Lessons</NavLink>
        </nav>

        <div className="sidebar-user">
          <div>
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
          <button className="logout-btn" onClick={logout}><LogOut size={17} /> Logout</button>
        </div>
      </aside>

      {open && <button className="backdrop" onClick={close} aria-label="Close menu" />}

      <main className="main">
        <header className="topbar">
          <button className="icon-btn mobile-only" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <div className="topbar-title">
            <span>Welcome back</span>
            <h1>{user?.name || 'Kudos'}</h1>
          </div>
          <NotificationBell />
        </header>

        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
