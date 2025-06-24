import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'achievement';
  title: string;
  message: string;
  duration?: number; // milliseconds, default 4000
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface NotificationSystemProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export function NotificationSystem({ notifications, onDismiss }: NotificationSystemProps) {
  const [animatedValues] = useState(() => 
    new Map<string, Animated.Value>()
  );

  useEffect(() => {
    notifications.forEach((notification) => {
      if (!animatedValues.has(notification.id)) {
        const animatedValue = new Animated.Value(0);
        animatedValues.set(notification.id, animatedValue);
        
        // Animate in
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();

        // Auto dismiss
        const duration = notification.duration || 4000;
        setTimeout(() => {
          handleDismiss(notification.id);
        }, duration);
      }
    });
  }, [notifications]);

  const handleDismiss = (id: string) => {
    const animatedValue = animatedValues.get(id);
    if (animatedValue) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        animatedValues.delete(id);
        onDismiss(id);
      });
    } else {
      onDismiss(id);
    }
  };

  const getNotificationStyle = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#4CAF50',
          iconName: 'checkmark-circle' as const,
          iconColor: '#fff',
        };
      case 'error':
        return {
          backgroundColor: '#F44336',
          iconName: 'close-circle' as const,
          iconColor: '#fff',
        };
      case 'warning':
        return {
          backgroundColor: '#FF9800',
          iconName: 'warning' as const,
          iconColor: '#fff',
        };
      case 'info':
        return {
          backgroundColor: '#2196F3',
          iconName: 'information-circle' as const,
          iconColor: '#fff',
        };
      case 'achievement':
        return {
          backgroundColor: '#8B4513',
          iconName: 'trophy' as const,
          iconColor: '#FFD700',
        };
      default:
        return {
          backgroundColor: '#757575',
          iconName: 'notifications' as const,
          iconColor: '#fff',
        };
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      {notifications.map((notification, index) => {
        const animatedValue = animatedValues.get(notification.id);
        const notificationStyle = getNotificationStyle(notification.type);
        
        if (!animatedValue) return null;

        return (
          <Animated.View
            key={notification.id}
            style={[
              styles.notification,
              {
                backgroundColor: notificationStyle.backgroundColor,
                transform: [
                  {
                    translateY: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-100, 0],
                    }),
                  },
                  {
                    scale: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
                opacity: animatedValue,
                top: 60 + (index * 80), // Stack notifications
              },
            ]}
          >
            <View style={styles.notificationContent}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={notificationStyle.iconName}
                  size={24}
                  color={notificationStyle.iconColor}
                />
              </View>
              
              <View style={styles.textContainer}>
                <Text style={styles.title}>{notification.title}</Text>
                <Text style={styles.message}>{notification.message}</Text>
              </View>

              {notification.action && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    notification.action!.onPress();
                    handleDismiss(notification.id);
                  }}
                >
                  <Text style={styles.actionText}>{notification.action.label}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => handleDismiss(notification.id)}
              >
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        );
      })}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  notification: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  actionButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  dismissButton: {
    marginLeft: 8,
    padding: 4,
  },
});

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `notification_${Date.now()}_${Math.random()}`;
    const newNotification: Notification = {
      ...notification,
      id,
    };
    
    setNotifications(prev => [...prev, newNotification]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Convenience methods
  const showSuccess = (title: string, message: string, action?: Notification['action']) => {
    showNotification({ type: 'success', title, message, action });
  };

  const showError = (title: string, message: string, action?: Notification['action']) => {
    showNotification({ type: 'error', title, message, action });
  };

  const showWarning = (title: string, message: string, action?: Notification['action']) => {
    showNotification({ type: 'warning', title, message, action });
  };

  const showInfo = (title: string, message: string, action?: Notification['action']) => {
    showNotification({ type: 'info', title, message, action });
  };

  const showAchievement = (title: string, message: string, action?: Notification['action']) => {
    showNotification({ type: 'achievement', title, message, duration: 6000, action });
  };

  return {
    notifications,
    showNotification,
    dismissNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showAchievement,
  };
} 