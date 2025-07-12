'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const NotificationBell = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      // Set up polling for new notifications
      const interval = setInterval(fetchNotifications, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/notifications?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId,
          action: 'markRead'
        }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'markAllRead'
        }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        const deletedNotif = notifications.find(n => n._id === notificationId);
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        if (deletedNotif && !deletedNotif.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'answer':
        return '💬';
      case 'comment':
        return '💭';
      case 'mention':
        return '👤';
      case 'accept':
        return '✅';
      case 'vote':
        return '👍';
      default:
        return '📢';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInSeconds = Math.floor((now - notifDate) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return notifDate.toLocaleDateString();
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  if (!userId) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  <Check size={16} className="inline mr-1" />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <span className="font-medium text-gray-900 text-sm">
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        <div className="flex items-center gap-2">
                          <Link
                            href={notification.link}
                            onClick={() => {
                              if (!notification.isRead) {
                                markAsRead(notification._id);
                              }
                              setIsOpen(false);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <ExternalLink size={12} />
                            View
                          </Link>
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-sm text-blue-600 hover:text-blue-800 block text-center"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;