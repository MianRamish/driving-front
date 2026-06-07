import React from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarDays, Clock3, GraduationCap, LayoutDashboard, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const itemClass = ({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`;

export default function BottomNav() {
  const { isAdmin } = useAuth();

  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      <NavLink className={itemClass} to="/" end><LayoutDashboard size={19} /><span>Home</span></NavLink>
      <NavLink className={itemClass} to="/students"><GraduationCap size={19} /><span>Students</span></NavLink>
      {isAdmin && <NavLink className={itemClass} to="/instructors"><Users size={19} /><span>Team</span></NavLink>}
      <NavLink className={itemClass} to="/availability"><Clock3 size={19} /><span>Calender</span></NavLink>
      <NavLink className={itemClass} to="/lessons"><CalendarDays size={19} /><span>Lessons</span></NavLink>
    </nav>
  );
}
