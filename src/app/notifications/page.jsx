'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, read

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('filter', filter)
      
      const response = await fetch(`/api/notifications?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      })

      const data = await response.json()
      
      if (data.success) {
        setNotifications(prev => prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        ))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      })

      const data = await response.json()
      
      if (data.success) {
        setNotifications(prev => prev.map(notification => ({ 
          ...notification, 
          isRead: true 
        })))
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'answer':
        return (
          <div className="p-2 bg-green-100 rounded-full">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        )
      case 'comment':
        return (
          <div className="p-2 bg-blue-100 rounded-full">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
        )
      case 'mention':
        return (
          <div className="p-2 bg-purple-100 rounded-full">
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
          </div>
        )
      case 'vote':
        return (
          <div className="p-2 bg-yellow-100 rounded-full">
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="p-2 bg-gray-100 rounded-full">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2L3 7v11c0 1.1.9 2 2 2h4v-6h2v6h4c1.1 0 2-.9 2-2V7l-7-5z" />
            </svg>
          </div>
        )
    }
  }

  const getNotificationMessage = (notification) => {
    switch (notification.type) {
      case 'answer':
        return `${notification.sender.username} answered your question "${notification.questionTitle}"`
      case 'comment':
        return `${notification.sender.username} commented on your answer`
      case 'mention':
        return `${notification.sender.username} mentioned you in a comment`
      case 'vote':
        return `Someone voted on your ${notification.targetType}`
      default:
        return notification.message || 'New notification'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">
            Stay updated with your questions and answers
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setFilter('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'unread'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'read'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </nav>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔔</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
          </h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? "You'll see notifications here when others interact with your content"
              : `You don't have any ${filter} notifications at the moment`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow ${
                !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Icon */}
                {getNotificationIcon(notification.type)}
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm ${!notification.isRead ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                        {getNotificationMessage(notification)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification._id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {/* Link to related content */}
                  {notification.questionId && (
                    <Link
                      href={`/questions/${notification.questionId}`}
                      className="inline-block mt-2 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => markAsRead(notification._id)}
                    >
                      View question →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}