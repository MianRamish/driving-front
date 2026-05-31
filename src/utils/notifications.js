const lessonKey = (lesson) => `kudos-reminder-${lesson._id}`;

export const canUseNotifications = () => (
  typeof window !== 'undefined'
  && 'Notification' in window
  && 'serviceWorker' in navigator
  && window.isSecureContext
);

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

  try {
    const registration = await registerNotificationWorker();
    if (registration?.showNotification) {
      await registration.showNotification(title || 'Kudos Driving School', {
        body: body || '',
        icon: '/kudos-icon.svg',
        badge: '/kudos-icon.svg',
        data: { url }
      });
      return true;
    }
  } catch (error) {
    console.warn('Push alert failed:', error);
  }

  try {
    const notification = new Notification(title || 'Kudos Driving School', {
      body: body || '',
      icon: '/kudos-icon.svg',
      data: { url }
    });
    notification.onclick = () => {
      window.focus();
      window.location.assign(url || '/');
      notification.close();
    };
    return true;
  } catch (error) {
    console.warn('Browser notification failed:', error);
    return false;
  }
}

export function scheduleLessonReminders(lessons = []) {
  if (!Array.isArray(lessons) || typeof window === 'undefined') return;

  lessons
    .filter((lesson) => lesson.status === 'scheduled' && lesson.date && lesson.startTime)
    .forEach((lesson) => {
      const key = lessonKey(lesson);
      if (sessionStorage.getItem(key)) return;

      const lessonStart = new Date(`${lesson.date}T${lesson.startTime}`);
      const reminderAt = lessonStart.getTime() - 30 * 60 * 1000;
      const delay = reminderAt - Date.now();
      if (Number.isNaN(delay) || delay <= 0 || delay > 2147483647) return;

      sessionStorage.setItem(key, 'scheduled');
      window.setTimeout(() => {
        const student = `${lesson.student?.firstName || 'Student'} ${lesson.student?.lastName || ''}`.trim();
        showDeviceNotification('Lesson reminder', `${student} lesson starts at ${lesson.startTime}.`, '/lessons');
      }, delay);
    });
}
