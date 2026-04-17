import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { inboxQuickActions } from '../data/mockData.js'
import {
  createInboxThread,
  listInboxThreads,
  listJobs,
  markInboxThreadRead,
  sendInboxMessage,
} from '../lib/platformApi.js'
import { useAuth } from '../providers/AuthProvider.jsx'

export function InboxPage() {
  const { user } = useAuth()
  const [threads, setThreads] = useState([])
  const [jobs, setJobs] = useState([])
  const [selectedThreadId, setSelectedThreadId] = useState('')
  const [search, setSearch] = useState('')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [draft, setDraft] = useState('')
  const [newThreadSubject, setNewThreadSubject] = useState('')
  const [newThreadJobSlug, setNewThreadJobSlug] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState({ tone: 'neutral', message: '' })

  useEffect(() => {
    let ignore = false

    async function loadInbox() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      setLoading(true)

      const [{ data: nextThreads, error: threadError }, { data: nextJobs }] = await Promise.all([
        listInboxThreads(user.id),
        listJobs(),
      ])

      if (ignore) {
        return
      }

      setThreads(nextThreads ?? [])
      setJobs(nextJobs ?? [])
      setSelectedThreadId((currentThreadId) => currentThreadId || nextThreads?.[0]?.id || '')
      setNewThreadJobSlug(nextJobs?.[0]?.slug ?? '')
      setStatus(
        threadError
          ? {
              tone: 'neutral',
              message: '실데이터 인박스를 우선 조회했고, 없을 때만 샘플 스레드를 표시합니다.',
            }
          : { tone: 'neutral', message: '' },
      )
      setLoading(false)
    }

    loadInbox()

    return () => {
      ignore = true
    }
  }, [user?.id])

  const visibleThreads = threads.filter((thread) => {
    const query = search.trim().toLowerCase()
    const matchesQuery =
      query.length === 0 ||
      [thread.name, thread.company, thread.role, thread.stage, thread.lastMessage]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query))

    const matchesUnread = !showUnreadOnly || thread.unread > 0

    return matchesQuery && matchesUnread
  })

  const activeThreadId =
    visibleThreads.some((thread) => thread.id === selectedThreadId)
      ? selectedThreadId
      : (visibleThreads[0]?.id ?? threads[0]?.id ?? '')

  const selectedThread = threads.find((thread) => thread.id === activeThreadId) ?? null
  const unreadCount = threads.reduce((sum, thread) => sum + thread.unread, 0)
  const hasMockThreads = threads.length > 0 && threads.every((thread) => thread.isMock)
  const selectedJob = jobs.find((job) => job.slug === newThreadJobSlug) ?? jobs[0] ?? null

  async function handleSelectThread(threadId) {
    setSelectedThreadId(threadId)
    setThreads((currentThreads) =>
      currentThreads.map((thread) =>
        thread.id === threadId ? { ...thread, unread: 0 } : thread,
      ),
    )

    const thread = threads.find((candidate) => candidate.id === threadId)

    if (!thread?.isMock && user?.id) {
      await markInboxThreadRead({ threadId, userId: user.id })
    }
  }

  function handleQuickAction(text) {
    setDraft((currentDraft) => {
      if (!currentDraft.trim()) {
        return text
      }

      return `${currentDraft.trim()} ${text}`
    })
  }

  async function handleCreateThread() {
    if (!user?.id) {
      return
    }

    setSubmitting(true)
    setStatus({ tone: 'neutral', message: '' })

    const { data, error } = await createInboxThread({
      userId: user.id,
      subject: newThreadSubject,
      companyId: selectedJob?.isMock ? null : selectedJob?.companyId ?? null,
      jobId: selectedJob?.isMock ? null : selectedJob?.id ?? null,
    })

    if (error || !data?.threadId) {
      setStatus({ tone: 'error', message: error?.message ?? '새 스레드를 만들지 못했습니다.' })
      setSubmitting(false)
      return
    }

    const { data: refreshedThreads } = await listInboxThreads(user.id)

    setThreads(refreshedThreads ?? [])
    setSelectedThreadId(data.threadId)
    setNewThreadSubject('')
    setStatus({
      tone: 'success',
      message: '새 인박스 스레드를 만들었습니다. 첫 메시지를 보내서 실제 대화를 시작할 수 있습니다.',
    })
    setSubmitting(false)
  }

  async function handleSendMessage() {
    const nextMessage = draft.trim()

    if (!nextMessage || !selectedThread) {
      return
    }

    if (selectedThread.isMock) {
      setThreads((currentThreads) => {
        const nextThreads = currentThreads.map((thread) => {
          if (thread.id !== selectedThread.id) {
            return thread
          }

          return {
            ...thread,
            lastMessage: nextMessage,
            lastActive: '방금 전',
            unread: 0,
            messages: [
              ...thread.messages,
              {
                id: `local-${Date.now().toString(36)}`,
                from: 'me',
                body: nextMessage,
                time: '방금 전',
              },
            ],
          }
        })

        const selectedIndex = nextThreads.findIndex((thread) => thread.id === selectedThread.id)

        if (selectedIndex <= 0) {
          return nextThreads
        }

        const reorderedThreads = [...nextThreads]
        const [activeThread] = reorderedThreads.splice(selectedIndex, 1)
        return [activeThread, ...reorderedThreads]
      })

      setDraft('')
      setStatus({
        tone: 'neutral',
        message: '현재 스레드는 샘플이라서 메시지가 화면에서만 미리보기로 추가됩니다.',
      })
      return
    }

    if (!user?.id) {
      return
    }

    setSubmitting(true)
    setStatus({ tone: 'neutral', message: '' })

    const { data, error } = await sendInboxMessage({
      threadId: selectedThread.id,
      userId: user.id,
      body: nextMessage,
    })

    if (error || !data) {
      setStatus({ tone: 'error', message: error?.message ?? '메시지를 보내지 못했습니다.' })
      setSubmitting(false)
      return
    }

    setThreads((currentThreads) => {
      const nextThreads = currentThreads.map((thread) => {
        if (thread.id !== selectedThread.id) {
          return thread
        }

        return {
          ...thread,
          lastMessage: data.body,
          lastActive: data.time,
          unread: 0,
          messages: [...thread.messages, data],
        }
      })

      const selectedIndex = nextThreads.findIndex((thread) => thread.id === selectedThread.id)

      if (selectedIndex <= 0) {
        return nextThreads
      }

      const reorderedThreads = [...nextThreads]
      const [activeThread] = reorderedThreads.splice(selectedIndex, 1)
      return [activeThread, ...reorderedThreads]
    })

    setDraft('')
    setStatus({
      tone: 'success',
      message: '메시지가 저장되었습니다. thread_messages 테이블에 실제 레코드가 생성되었습니다.',
    })
    setSubmitting(false)
  }

  return (
    <>
      <section className="page-hero section-card compact-hero">
        <div>
          <p className="eyebrow">Inbox</p>
          <h1>실제 스레드와 메시지를 관리하는 인박스</h1>
          <p>
            이제는 정적인 데모 대화창이 아니라, 로그인한 사용자 기준으로 스레드를 만들고
            메시지를 저장하며 다시 불러오는 실제 인박스 흐름으로 바뀌었습니다.
          </p>
        </div>
        <div className="compact-hero-card">
          <span className="compact-kicker">Unread</span>
          <strong>{loading ? '불러오는 중...' : `${unreadCount}개 읽지 않음`}</strong>
          <p>지원 흐름과 커피챗 대화, 개인 메모를 한 화면에서 연결할 수 있습니다.</p>
        </div>
      </section>

      <section className="inbox-layout section-card">
        <aside className="thread-list">
          {hasMockThreads ? (
            <div className="status-banner status-neutral">
              <strong>현재는 샘플 스레드를 표시 중입니다</strong>
              <p>
                아직 내 계정에 실제 인박스 스레드가 없어서 공개 샘플을 보여주고 있습니다.
                아래에서 새 스레드를 만들면 바로 실데이터 인박스로 전환됩니다.
              </p>
            </div>
          ) : null}

          {status.message ? (
            <div className={`status-banner status-${status.tone}`}>
              <strong>{status.tone === 'error' ? '오류' : status.tone === 'success' ? '완료' : '안내'}</strong>
              <p>{status.message}</p>
            </div>
          ) : null}

          <div className="thread-toolbar">
            <label className="search-box thread-search">
              <span>대화 검색</span>
              <input
                type="search"
                placeholder="회사명, 포지션, 메시지"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <button
              className={`filter-pill ${showUnreadOnly ? 'active' : ''}`}
              type="button"
              onClick={() => setShowUnreadOnly((currentValue) => !currentValue)}
            >
              읽지 않음만 보기
            </button>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>새 스레드 제목</span>
              <input
                placeholder="예: Tensor Labs 지원 관련 메모"
                value={newThreadSubject}
                onChange={(event) => setNewThreadSubject(event.target.value)}
              />
            </label>

            <label className="field">
              <span>관련 공고 선택</span>
              <select value={newThreadJobSlug} onChange={(event) => setNewThreadJobSlug(event.target.value)}>
                {jobs.length > 0 ? (
                  jobs.map((job) => (
                    <option key={job.slug} value={job.slug}>
                      {job.company} · {job.title}
                    </option>
                  ))
                ) : (
                  <option value="">공고 없음</option>
                )}
              </select>
            </label>

            <button className="primary-button full-width" disabled={submitting} type="button" onClick={handleCreateThread}>
              {submitting ? '생성 중...' : '새 스레드 만들기'}
            </button>
          </div>

          {visibleThreads.length > 0 ? (
            visibleThreads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={`thread-item ${thread.id === activeThreadId ? 'active' : ''}`}
                onClick={() => handleSelectThread(thread.id)}
              >
                <div className="thread-meta">
                  <strong>{thread.name}</strong>
                  <span>{thread.lastActive}</span>
                </div>
                <span>{thread.role}</span>
                <div className="thread-status-row">
                  <span>{thread.stage}</span>
                  <span>{thread.company}</span>
                </div>
                <p>{thread.lastMessage}</p>
                {thread.unread ? <em>{thread.unread}</em> : null}
              </button>
            ))
          ) : (
            <div className="empty-state thread-empty">
              <strong>조건에 맞는 대화가 없습니다.</strong>
              <p>검색어를 바꾸거나 읽지 않음 필터를 해제해보세요.</p>
            </div>
          )}
        </aside>

        <div className="message-panel">
          {selectedThread ? (
            <>
              <div className="message-panel-head">
                <strong>{selectedThread.name}</strong>
                <span>{selectedThread.role}</span>
                <div className="thread-status-row">
                  <span>{selectedThread.stage}</span>
                  <span>{selectedThread.lastActive}</span>
                </div>
              </div>

              <div className="quick-action-row">
                {inboxQuickActions.map((action) => (
                  <button
                    className="quick-action-chip"
                    key={action}
                    type="button"
                    onClick={() => handleQuickAction(action)}
                  >
                    {action}
                  </button>
                ))}
              </div>

              <div className="message-list">
                {selectedThread.messages.length > 0 ? (
                  selectedThread.messages.map((message) => (
                    <div
                      className={`message-bubble ${message.from === 'me' ? 'mine' : ''}`}
                      key={message.id}
                    >
                      <p className="message-bubble-body">{message.body}</p>
                      <span className="message-bubble-time">{message.time}</span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state message-empty">
                    <strong>아직 메시지가 없습니다.</strong>
                    <p>첫 메시지를 보내서 이 스레드를 실제 대화로 시작해보세요.</p>
                  </div>
                )}
              </div>

              <div className="message-compose">
                <input
                  placeholder="메시지를 입력해보세요"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <button className="primary-button" disabled={submitting} type="button" onClick={handleSendMessage}>
                  {submitting ? '보내는 중...' : '보내기'}
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state message-empty">
              <strong>열 수 있는 대화가 없습니다.</strong>
              <p>왼쪽에서 새 스레드를 만들거나 다른 조건을 확인해보세요.</p>
              <div className="sidebar-actions">
                <Link className="secondary-button" to="/jobs">
                  공고 보러 가기
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
