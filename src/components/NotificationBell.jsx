import React, { useEffect, useRef, useState } from 'react';
import { Bell, BellRing, CheckCheck, ExternalLink } from 'lucide-react';
import api from '../api.js';
import { registerNotificationWorker, requestNotificationPermission, showDeviceNotification } from '../utils/notifications.js';

const formatTime = (date) => new Date(date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [permission, setPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
  const seenIds = useRef(new Set());

  const load = async () => {
    const { data } = await api.get('/notifications?limit=20');
    const nextItems = Array.isArray(data) ? data : data.items || [];
    const fresh = nextItems.filter((item) => !seenIds.current.has(item._id) && !item.read);
    nextItems.forEach((item) => seenIds.current.add(item._id));
    setItems(nextItems);
    setUnread(typeof data.unread === 'number' ? data.unread : nextItems.filter((item) => !item.read).length);
    fresh.forEach((item) => showDeviceNotification(item.title, item.message, '/lessons'));
  };

  useEffect(() => {
    registerNotificationWorker();
    load();
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const close = (event) => {
      if (!event.target.closest?.('.notification-wrap')) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const enableNotifications = async () => {
    await registerNotificationWorker();
    const result = await requestNotificationPermission();
    setPermission(result);
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    await load();
  };

  const openNotification = async (item) => {
    if (!item.read) await api.put(`/notifications/${item._id}/read`);
    setOpen(false);
    window.location.href = '/lessons';
  };

  return (
    <div className="notification-wrap">
      <button className="icon-btn notification-btn" onClick={(e) => { e.stopPropagation(); setOpen(!open); }} aria-label="Notifications">
        {unread ? <BellRing size={20} /> : <Bell size={20} />}
        {unread > 0 && <span className="notification-dot">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notification-panel" onClick={(e) => e.stopPropagation()}>
          <div className="notification-head">
            <div>
              <strong>Notifications</strong>
              <span>{unread ? `${unread} unread` : 'All caught up'}</span>
            </div>
            {unread > 0 && <button className="text-btn" onClick={markAllRead}><CheckCheck size={15} /> Mark read</button>}
          </div>

          {permission !== 'granted' && permission !== 'unsupported' && (
            <button className="primary-btn full-width" onClick={enableNotifications}>Enable push alerts</button>
          )}

          {!items.length ? (
            <p className="muted-text">No notifications yet.</p>
          ) : (
            <div className="notification-list">
              {items.map((item) => (
                <button key={item._id} className={`notification-item ${item.read ? '' : 'unread'}`} onClick={() => openNotification(item)}>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{formatTime(item.createdAt)}</small>
                  </div>
                  <span>{item.message}</span>
                  {item.lesson && <em><ExternalLink size={13} /> Open lesson calendar</em>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
