const lessonKey = (lesson) => `kudos-reminder-${lesson._id}`;

export const canUseNotifications = () => 'Notification' in window && 'serviceWorker' in navigator;

export async function registerNotificationWorker() {
  if (!canUseNotifications()) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch (error) {
    console.warn('Service worker registration failed:', error);
    return null;
  }
}

export async function requestNotificationPermission() {
  if (!canUseNotifications()) return 'unsupported';
  if (Notification.permission === 'default') return Notification.requestPermission();
  return Notification.permission;
}

export async function showDeviceNotification(title, body, url = '/lessons') {
  if (!canUseNotifications() || Notification.permission !== 'granted') return false;
  const registration = await navigator.serviceWorker.ready;
  if (registration?.active) {
    registration.active.postMessage({ type: 'SHOW_NOTIFICATION', title, body, url });
    return true;
  }
  return false;
}

export function scheduleLessonReminders(lessons = []) {
  if (!Array.isArray(lessons)) return;
  lessons.filter((lesson) => lesson.status === 'scheduled' && lesson.date && lesson.startTime).forEach((lesson) => {
    const key = lessonKey(lesson);
    if (sessionStorage.getItem(key)) return;
    const lessonStart = new Date(`${lesson.date}T${lesson.startTime}`);
    const reminderAt = lessonStart.getTime() - 30 * 60 * 1000;
    const delay = reminderAt - Date.now();
    if (delay <= 0 || delay > 2147483647) return;
    sessionStorage.setItem(key, 'scheduled');
    window.setTimeout(() => {
      const student = `${lesson.student?.firstName || 'Student'} ${lesson.student?.lastName || ''}`.trim();
      showDeviceNotification('Lesson reminder', `${student} lesson starts at ${lesson.startTime}.`, '/lessons');
    }, delay);
  });
}
