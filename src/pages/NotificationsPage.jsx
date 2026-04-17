import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../lib/platformApi.js'
import { useAuth } from '../providers/AuthProvider.jsx'

const notificationUpdateEventName = 'elite-notifications-updated'

function broadcastNotificationUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(notificationUpdateEventName))
  }
}

export function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [filterMode, setFilterMode] = useState('전체')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState({ tone: 'neutral', message: '' })

  useEffect(() => {
    let ignore = false

    async function loadNotifications() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      setLoading(true)

      const { data, error } = await listNotifications(user.id)

      if (ignore) {
        return
      }

      setNotifications(data ?? [])
      setStatus(error ? { tone: 'error', message: error.message } : { tone: 'neutral', message: '' })
      setLoading(false)
    }

    loadNotifications()

    return () => {
      ignore = true
    }
  }, [user?.id])

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) =>
      filterMode === '읽지 않음' ? !notification.is_read : true,
    )
  }, [filterMode, notifications])

  const unreadCount = notifications.filter((notification) => !notification.is_read).length

  async function handleMarkRead(notificationId) {
    if (!user?.id) {
      return
    }

    setSubmitting(true)
    setStatus({ tone: 'neutral', message: '' })

    const { error } = await markNotificationRead({
      notificationId,
      userId: user.id,
    })

    if (error) {
      setStatus({ tone: 'error', message: error.message })
      setSubmitting(false)
      return
    }

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification,
      ),
    )
    broadcastNotificationUpdate()
    setSubmitting(false)
  }

  async function handleMarkAllRead() {
    if (!user?.id || unreadCount === 0) {
      return
    }

    setSubmitting(true)
    setStatus({ tone: 'neutral', message: '' })

    const { error } = await markAllNotificationsRead(user.id)

    if (error) {
      setStatus({ tone: 'error', message: error.message })
      setSubmitting(false)
      return
    }

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        is_read: true,
      })),
    )
    broadcastNotificationUpdate()
    setStatus({ tone: 'success', message: '모든 알림을 읽음 처리했습니다.' })
    setSubmitting(false)
  }

  return (
    <>
      <section className="page-hero section-card compact-hero">
        <div>
          <p className="eyebrow">Notifications</p>
          <h1>지원 상태와 커피챗 흐름을 모아보는 알림함</h1>
          <p>
            파트너가 변경한 지원 상태나 이후 추가될 주요 이벤트를 한 화면에서 확인하고,
            읽음 처리까지 할 수 있는 실제 알림함입니다.
          </p>
        </div>
        <div className="compact-hero-card">
          <span className="compact-kicker">Unread</span>
          <strong>{loading ? '불러오는 중...' : `${unreadCount}개 읽지 않음`}</strong>
          <p>지원 상태 변경 알림은 파트너 대시보드 액션과 바로 연결됩니다.</p>
        </div>
      </section>

      <section className="section-card business-shell">
        {status.message ? (
          <div className={`status-banner status-${status.tone}`}>
            <strong>{status.tone === 'error' ? '오류' : status.tone === 'success' ? '완료' : '안내'}</strong>
            <p>{status.message}</p>
          </div>
        ) : null}

        <div className="section-heading">
          <div>
            <p className="eyebrow">Inbox Feed</p>
            <h2>중요한 상태 변경을 놓치지 않는 알림 타임라인</h2>
          </div>
          <p>읽지 않음 필터와 전체 읽음 처리를 지원합니다.</p>
        </div>

        <div className="community-toolbar">
          <div className="filter-row" aria-label="알림 필터">
            {['전체', '읽지 않음'].map((filter) => (
              <button
                key={filter}
                className={`filter-pill ${filterMode === filter ? 'active' : ''}`}
                type="button"
                onClick={() => setFilterMode(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="sidebar-actions">
            <button className="secondary-button" disabled={submitting || unreadCount === 0} type="button" onClick={handleMarkAllRead}>
              전체 읽음 처리
            </button>
          </div>
        </div>

        <div className="notification-list">
          {loading ? (
            <div className="empty-state">
              <strong>알림을 불러오는 중입니다.</strong>
              <p>잠시만 기다리면 최신 알림이 표시됩니다.</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <article
                key={notification.id}
                className={`notification-card ${notification.is_read ? '' : 'unread'}`}
              >
                <div className="notification-meta">
                  <span className={`check-pill ${notification.is_read ? 'complete' : ''}`}>
                    {notification.is_read ? '읽음' : '새 알림'}
                  </span>
                  <span>{notification.created_at?.slice(0, 16).replace('T', ' ')}</span>
                </div>
                <strong>{notification.title}</strong>
                <p>{notification.body || '추가 설명이 없는 알림입니다.'}</p>
                <div className="notification-actions">
                  {notification.link_path ? (
                    <Link className="secondary-button" to={notification.link_path}>
                      관련 화면 보기
                    </Link>
                  ) : null}
                  {!notification.is_read ? (
                    <button
                      className="secondary-button"
                      disabled={submitting}
                      type="button"
                      onClick={() => handleMarkRead(notification.id)}
                    >
                      읽음 처리
                    </button>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <strong>표시할 알림이 없습니다.</strong>
              <p>파트너가 지원 상태를 변경하면 여기에 새 알림이 쌓입니다.</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
