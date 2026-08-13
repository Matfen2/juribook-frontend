import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getMyNotifications, getUnreadCount, markNotificationAsRead,
  type AppNotification, type NotificationType,
} from '../api/notificationApi'

const POLL_INTERVAL_MS = 20000

const TYPE_ICON: Record<NotificationType, string> = {
  BOOKING_CREATED: 'ti-inbox',
  BOOKING_CONFIRMED: 'ti-check',
  BOOKING_REMINDER: 'ti-clock',
  SLOT_RELEASED: 'ti-calendar-event',
}

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH}h`
  return `il y a ${Math.floor(diffH / 24)}j`
}

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Polling léger du compteur (badge), indépendant de l'ouverture ──
  const refreshUnreadCount = useCallback(() => {
    getUnreadCount()
      .then(({ data }) => setUnreadCount(data.count))
      .catch(() => { /* silencieux — un poll raté n'est pas grave, le suivant corrigera */ })
  }, [])

  useEffect(() => {
    refreshUnreadCount()
    const interval = setInterval(refreshUnreadCount, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [refreshUnreadCount])

  // ── Fermer au clic en dehors du dropdown ──
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    // La liste complète n'est chargée qu'à l'ouverture — pas à chaque
    // poll, seul le compteur est vérifié en continu.
    if (next) {
      setLoading(true)
      getMyNotifications()
        .then(({ data }) => setNotifications(data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }

  const handleNotificationClick = async (n: AppNotification) => {
    if (n.read) return
    try {
      await markNotificationAsRead(n.id)
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      // silencieux — l'utilisateur peut recliquer
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        data-cy="notification-bell-button"
        onClick={handleToggle}
        style={{
          position: 'relative', width: 36, height: 36, borderRadius: 10,
          border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <i className="ti ti-bell" style={{ fontSize: 18, color: '#475569' }} aria-hidden />
        {unreadCount > 0 && (
          <span
            data-cy="notification-unread-badge"
            style={{
              position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding: '0 3px',
              borderRadius: 8, background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          data-cy="notification-dropdown"
          style={{
            position: 'absolute', top: 44, right: 0, width: 340, maxHeight: 420, overflowY: 'auto',
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14,
            boxShadow: '0 12px 32px rgba(15,23,42,0.12)', zIndex: 50,
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', fontWeight: 700, fontSize: 13.5, color: '#1E293B' }}>
            Notifications
          </div>

          {loading && (
            <div style={{ padding: '2rem', textAlign: 'center', fontSize: 12.5, color: '#94A3B8' }}>
              Chargement...
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', fontSize: 12.5, color: '#94A3B8' }}>
              Aucune notification pour l'instant
            </div>
          )}

          {!loading && notifications.map(n => (
            <button
              key={n.id}
              data-cy="notification-item"
              onClick={() => handleNotificationClick(n)}
              style={{
                display: 'flex', gap: 10, alignItems: 'flex-start', width: '100%', textAlign: 'left',
                padding: '12px 16px', border: 'none', borderBottom: '1px solid #F8FAFC', cursor: 'pointer',
                background: n.read ? '#fff' : '#EEF2FF',
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0, marginTop: 2,
                background: n.read ? '#F1F5F9' : '#E0E7FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`ti ${TYPE_ICON[n.type] ?? 'ti-bell'}`}
                   style={{ fontSize: 14, color: n.read ? '#94A3B8' : '#4F46E5' }} aria-hidden />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12.5, color: '#1E293B', margin: 0, lineHeight: 1.5, fontWeight: n.read ? 400 : 600 }}>
                  {n.message}
                </p>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: '3px 0 0' }}>
                  {formatRelativeTime(n.createdAt)}
                </p>
              </div>
              {!n.read && (
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4F46E5', flexShrink: 0, marginTop: 6 }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}