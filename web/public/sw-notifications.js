// Service Worker for background notifications
const CACHE_NAME = 'grosonix-notifications-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Notification service worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Notification service worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  const url = data.url || '/dashboard/calendar';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window/tab is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification);
  
  // Track notification dismissal if needed
  const data = event.notification.data || {};
  if (data.trackDismissal) {
    // Send analytics or tracking data
    fetch('/api/notifications/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'dismissed',
        notificationId: data.notificationId,
        timestamp: new Date().toISOString(),
      }),
    }).catch(console.error);
  }
});

// Handle push events (for future server-sent notifications)
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (!event.data) {
    return;
  }
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icons/notification-icon.png',
      badge: '/icons/notification-badge.png',
      tag: data.tag,
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
      data: data.data || {},
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

// Background sync for offline notification scheduling
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Function to sync notifications when back online
async function syncNotifications() {
  try {
    // Check for any pending notifications that need to be sent
    const response = await fetch('/api/notifications/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const { notifications } = await response.json();
      
      // Show any notifications that were queued while offline
      for (const notification of notifications) {
        await self.registration.showNotification(notification.title, {
          body: notification.body,
          icon: notification.icon || '/icons/notification-icon.png',
          badge: '/icons/notification-badge.png',
          tag: notification.tag,
          data: notification.data,
        });
      }
    }
  } catch (error) {
    console.error('Error syncing notifications:', error);
  }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-reminders') {
    event.waitUntil(checkForReminders());
  }
});

// Function to check for pending reminders
async function checkForReminders() {
  try {
    const response = await fetch('/api/notifications/check-reminders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const { reminders } = await response.json();
      
      for (const reminder of reminders) {
        await self.registration.showNotification(reminder.title, {
          body: reminder.body,
          icon: '/icons/notification-icon.png',
          badge: '/icons/notification-badge.png',
          tag: `reminder-${reminder.id}`,
          requireInteraction: reminder.urgent,
          data: {
            url: '/dashboard/calendar',
            reminderId: reminder.id,
            postId: reminder.postId,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error checking for reminders:', error);
  }
}
