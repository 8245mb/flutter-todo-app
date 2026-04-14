import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Configure notification handler
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Schedule a notification for a task due date
 */
export async function scheduleTaskNotification(
  taskId: string,
  taskTitle: string,
  dueDate: number
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('[Notifications] Permission not granted');
      return null;
    }

    // Calculate notification time (1 hour before due date)
    const notificationTime = new Date(dueDate - 60 * 60 * 1000);
    const now = new Date();

    // Don't schedule if notification time is in the past
    if (notificationTime <= now) {
      console.log('[Notifications] Notification time is in the past, skipping');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Lembrete de Tarefa',
        body: `"${taskTitle}" vence em 1 hora!`,
        data: { taskId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notificationTime,
      } as Notifications.DateTriggerInput,
    });

    console.log('[Notifications] Scheduled notification:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('[Notifications] Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelTaskNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('[Notifications] Cancelled notification:', notificationId);
  } catch (error) {
    console.error('[Notifications] Error cancelling notification:', error);
  }
}

/**
 * Cancel all notifications for a task
 */
export async function cancelAllTaskNotifications(taskId: string): Promise<void> {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const taskNotifications = scheduledNotifications.filter(
      (notification) => notification.content.data?.taskId === taskId
    );

    for (const notification of taskNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }

    console.log('[Notifications] Cancelled all notifications for task:', taskId);
  } catch (error) {
    console.error('[Notifications] Error cancelling task notifications:', error);
  }
}
