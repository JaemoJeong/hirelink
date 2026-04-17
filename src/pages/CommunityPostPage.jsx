import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createCommunityComment,
  createCommunityReport,
  fetchCommunityPostBySlug,
  toggleCommunityReaction,
  updateCommunityComment,
  updateCommunityPost,
} from '../lib/platformApi.js'
import { useAuth } from '../providers/AuthProvider.jsx'

const emptyEditDraft = {
  title: '',
  body: '',
  tags: '',
}

export function CommunityPostPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [replyDraft, setReplyDraft] = useState('')
  const [replyEditDraft, setReplyEditDraft] = useState('')
  const [editingReplyId, setEditingReplyId] = useState('')
  const [editDraft, setEditDraft] = useState(emptyEditDraft)
  const [editingPost, setEditingPost] = useState(false)
  const [replies, setReplies] = useState([])
  const [commentCount, setCommentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState({ tone: 'neutral', message: '' })

  useEffect(() => {
    let ignore = false

    async function loadPost() {
      setLoading(true)

      const { data, error } = await fetchCommunityPostBySlug(slug, user?.id)

      if (ignore) {
        return
      }

      setPost(data ?? null)
      setLiked(Boolean(data?.likedByViewer))
      setLikeCount(data?.likes ?? 0)
      setReplies(data?.replies ?? [])
      setCommentCount(data?.comments ?? data?.replies?.length ?? 0)
      setEditDraft({
        title: data?.title ?? '',
        body: data?.body ?? '',
        tags: (data?.tags ?? []).join(', '),
      })
      setEditingPost(false)
      setStatus(
        error && data
          ? {
              tone: 'neutral',
              message: '실데이터를 우선 조회했고, 일치하는 글이 없을 때만 샘플 스레드로 대체했습니다.',
            }
          : { tone: 'neutral', message: '' },
      )
      setLoading(false)
    }

    loadPost()

    return () => {
      ignore = true
    }
  }, [slug, user?.id])

  async function handleToggleLike() {
    if (!post) {
      return
    }

    if (!user?.id) {
      navigate('/auth', { state: { from: { pathname: `/community/post/${slug}` } } })
      return
    }

    if (post.isMock) {
      setLiked((currentValue) => !currentValue)
      setLikeCount((currentValue) => currentValue + (liked ? -1 : 1))
      setStatus({
        tone: 'neutral',
        message: '현재 글은 샘플 스레드라서 좋아요 상태만 화면에서 미리보기로 바뀝니다.',
      })
      return
    }

    setSubmitting(true)
    setStatus({ tone: 'neutral', message: '' })

    const { data, error } = await toggleCommunityReaction({
      postId: post.id,
      userId: user.id,
      liked,
    })

    if (error || !data) {
      setStatus({ tone: 'error', message: error?.message ?? '좋아요 상태를 업데이트하지 못했습니다.' })
      setSubmitting(false)
      return
    }

    setLiked(data.liked)
    setLikeCount(data.likeCount)
    setStatus({
      tone: 'success',
      message: data.liked ? '좋아요를 남겼습니다.' : '좋아요를 취소했습니다.',
    })
    setSubmitting(false)
  }

  function handleStartEdit() {
    if (!post) {
      return
    }

    setEditDraft({
      title: post.title ?? '',
      body: post.body ?? (post.content ?? []).join('\n\n'),
      tags: (post.tags ?? []).join(', '),
    })
    setEditingPost(true)
    setStatus({ tone: 'neutral', message: '' })
  }

  function handleCancelEdit() {
    setEditingPost(false)
    setEditDraft({
      title: post?.title ?? '',
      body: post?.body ?? (post?.content ?? []).join('\n\n'),
      tags: (post?.tags ?? []).join(', '),
    })
  }

  async function handleUpdatePost(event) {
    event.preventDefault()

    if (!post || post.isMock || !user?.id || post.authorId !== user.id) {
      setStatus({ tone: 'error', message: '작성자 본인만 글을 수정할 수 있습니다.' })
      return
    }

    setSubmitting(true)
    setStatus({ tone: 'neutral', message: '' })

    const { data, error } = await updateCommunityPost({
      postId: post.id,
      authorId: user.id,
      title: editDraft.title,
      body: editDraft.body,
      tags: editDraft.tags,
    })

    if (error || !data) {
      setStatus({ tone: 'error', message: error?.message ?? '게시글을 수정하지 못했습니다.' })
      setSubmitting(false)
      return
    }

    setPost((currentPost) => ({
      ...currentPost,
      title: data.title,
      excerpt: data.excerpt,
      body: data.body,
      content: data.content,
      tags: data.tags,
      readTime: data.readTime,
    }))
    setEditDraft({
      title: data.title,
      body: data.body,
      tags: (data.tags ?? []).join(', '),
    })
    setEditingPost(false)
    setStatus({ tone: 'success', message: '게시글을 수정했습니다.' })
    setSubmitting(false)
  }

  function handleStartReplyEdit(reply) {
    setEditingReplyId(reply.id)
    setReplyEditDraft(reply.body ?? '')
    setStatus({ tone: 'neutral', message: '' })
  }

  function handleCancelReplyEdit() {
    setEditingReplyId('')
    setReplyEditDraft('')
  }

  async function handleUpdateReply(reply) {
    if (!reply?.id || !user?.id || reply.authorId !== user.id) {
      setStatus({ tone: 'error', message: '작성자 본인만 댓글을 수정할 수 있습니다.' })
      return
    }

    setSubmitting(true)
    setStatus({ tone: 'neutral', message: '' })

    const { data, error } = await updateCommunityComment({
      commentId: reply.id,
      authorId: user.id,
      body: replyEditDraft,
    })

    if (error || !data) {
      setStatus({ tone: 'error', message: error?.message ?? '댓글을 수정하지 못했습니다.' })
      setSubmitting(false)
      return
    }

    setReplies((currentReplies) =>
      currentReplies.map((currentReply) =>
        currentReply.id === reply.id
          ? {
              ...currentReply,
              body: data.body,
              authorId: data.authorId,
              createdAt: data.updatedAt || currentReply.createdAt,
            }
          : currentReply,
      ),
    )
    setEditingReplyId('')
    setReplyEditDraft('')
    setStatus({ tone: 'success', message: '댓글을 수정했습니다.' })
    setSubmitting(false)
  }

  async function handleReplySubmit() {
    const nextReply = replyDraft.trim()

    if (!nextReply || !post) {
      return
    }

    if (!user?.id) {
      navigate('/auth', { state: { from: { pathname: `/community/post/${slug}` } } })
      return
    }

    if (post.isMock) {
      setReplies((currentReplies) => [
        ...currentReplies,
        {
          id: `local-${Date.now().toString(36)}`,
          authorId: user?.id ?? null,
          author: '나',
          body: nextReply,
          createdAt: new Date().toISOString().slice(0, 10),
        },
      ])
      setCommentCount((currentValue) => currentValue + 1)
      setReplyDraft('')
      setStatus({
        tone: 'neutral',
        message: '현재 글은 샘플 스레드라서 댓글도 화면에서만 미리보기로 추가됩니다.',
      })
      return
    }

    setSubmitting(true)
    setStatus({ tone: 'neutral', message: '' })

    const { data, error } = await createCommunityComment({
      postId: post.id,
      authorId: user.id,
      body: nextReply,
    })

    if (error || !data?.comment) {
      setStatus({ tone: 'error', message: error?.message ?? '댓글을 저장하지 못했습니다.' })
      setSubmitting(false)
      return
    }

    setReplies((currentReplies) => [...currentReplies, data.comment])
    setCommentCount(data.commentCount ?? replies.length + 1)
    setReplyDraft('')
    setStatus({
      tone: 'success',
      message: '댓글이 저장되었습니다. community_comments 테이블에 실제 레코드가 생성되었습니다.',
    })
    setSubmitting(false)
  }

  async function handleReportCommunityTarget({ reply = null } = {}) {
    if (!post) {
      return
    }

    if (!user?.id) {
      navigate('/auth', { state: { from: { pathname: `/community/post/${slug}` } } })
      return
    }

    if (post.isMock) {
      setStatus({
        tone: 'neutral',
        message: '샘플 게시글은 실제 신고를 저장하지 않고, 실데이터 게시글에서만 신고가 생성됩니다.',
      })
      return
    }

    setSubmitting(true)
    setStatus({ tone: 'neutral', message: '' })

    const { error } = await createCommunityReport({
      reporterId: user.id,
      postId: post.id,
      commentId: reply?.id ?? null,
      reason: reply ? 'comment_report' : 'post_report',
    })

    if (error) {
      setStatus({ tone: 'error', message: error.message })
      setSubmitting(false)
      return
    }

    setStatus({
      tone: 'success',
      message: reply ? '댓글 신고가 운영 큐에 접수되었습니다.' : '게시글 신고가 운영 큐에 접수되었습니다.',
    })
    setSubmitting(false)
  }

  if (loading) {
    return (
      <section className="section-card not-found-panel">
        <p className="eyebrow">Loading</p>
        <h1>게시글을 불러오는 중입니다</h1>
        <p>잠시만 기다리면 최신 스레드가 표시됩니다.</p>
      </section>
    )
  }

  if (!post) {
    return (
      <section className="section-card not-found-panel">
        <p className="eyebrow">Not Found</p>
        <h1>게시글을 찾을 수 없습니다</h1>
        <p>삭제되었거나 잘못된 주소입니다.</p>
        <Link className="primary-button" to="/community">
          커뮤니티로 돌아가기
        </Link>
      </section>
    )
  }

  const relatedPosts = post.relatedPosts ?? []
  const canEditPost = Boolean(user?.id && !post.isMock && post.authorId === user.id)

  return (
    <section className="section-card post-shell">
      {post.isMock ? (
        <div className="status-banner status-neutral">
          <strong>현재는 샘플 게시글입니다</strong>
          <p>
            아직 Supabase에 같은 slug의 실제 게시글이 없어서 공개 샘플 스레드를 보여주고 있습니다.
            로그인 후 커뮤니티 목록에서 새 글을 올리면 실데이터 흐름을 바로 확인할 수 있습니다.
          </p>
        </div>
      ) : null}

      {status.message ? (
        <div className={`status-banner status-${status.tone}`}>
          <strong>{status.tone === 'error' ? '오류' : status.tone === 'success' ? '완료' : '안내'}</strong>
          <p>{status.message}</p>
        </div>
      ) : null}

      <div className="post-header">
        <div className="job-meta">
          <span className="job-badge">{post.category}</span>
          <span className="job-company">{post.university || '커뮤니티'}</span>
        </div>
        <h1>{post.title}</h1>
        <div className="community-meta-row">
          <span>{post.author}</span>
          <span>{post.createdAt}</span>
          <span>{post.readTime}</span>
          <span>좋아요 {likeCount}</span>
          <span>댓글 {commentCount}</span>
        </div>
        <div className="community-tag-row">
          {(post.tags ?? []).map((tag) => (
            <span className="community-tag" key={tag}>
              #{tag}
            </span>
          ))}
        </div>
        <div className="post-action-row">
          <button
            className={`secondary-button ${liked ? 'active-soft' : ''}`}
            disabled={submitting}
            type="button"
            onClick={handleToggleLike}
          >
            {liked ? '좋아요 취소' : '좋아요'}
          </button>
          <Link className="secondary-button" to="/inbox">
            인박스로 이어보기
          </Link>
          <button
            className="secondary-button"
            disabled={submitting}
            type="button"
            onClick={() => handleReportCommunityTarget()}
          >
            게시글 신고
          </button>
          {canEditPost && !editingPost ? (
            <button className="secondary-button" disabled={submitting} type="button" onClick={handleStartEdit}>
              글 수정
            </button>
          ) : null}
        </div>
      </div>

      {editingPost ? (
        <form className="section-card post-edit-form" onSubmit={handleUpdatePost}>
          <p className="eyebrow">Edit Thread</p>
          <label className="field">
            <span>제목</span>
            <input
              value={editDraft.title}
              onChange={(event) =>
                setEditDraft((currentDraft) => ({ ...currentDraft, title: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>태그</span>
            <input
              value={editDraft.tags}
              onChange={(event) =>
                setEditDraft((currentDraft) => ({ ...currentDraft, tags: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>본문</span>
            <textarea
              rows="8"
              value={editDraft.body}
              onChange={(event) =>
                setEditDraft((currentDraft) => ({ ...currentDraft, body: event.target.value }))
              }
            />
          </label>
          <div className="sidebar-actions">
            <button className="primary-button" disabled={submitting} type="submit">
              {submitting ? '저장 중...' : '수정 저장'}
            </button>
            <button className="secondary-button" disabled={submitting} type="button" onClick={handleCancelEdit}>
              취소
            </button>
          </div>
        </form>
      ) : (
        <div className="post-content">
          {(post.content ?? []).map((paragraph, index) => (
            <p key={`${post.id}-${index}`}>{paragraph}</p>
          ))}
        </div>
      )}

      <div className="post-replies">
        <p className="eyebrow">Replies</p>
        {replies.length > 0 ? (
          replies.map((reply) => (
            <article className="reply-card" key={reply.id ?? `${reply.author}-${reply.body}`}>
              <strong>{reply.author}</strong>
              {editingReplyId === reply.id ? (
                <label className="field">
                  <span>댓글 수정</span>
                  <textarea
                    rows="3"
                    value={replyEditDraft}
                    onChange={(event) => setReplyEditDraft(event.target.value)}
                  />
                </label>
              ) : (
                <p>{reply.body}</p>
              )}
              {reply.createdAt ? <span className="job-footnote">{reply.createdAt}</span> : null}
              {user?.id && reply.authorId === user.id && !post.isMock ? (
                <div className="notification-action-group">
                  {editingReplyId === reply.id ? (
                    <>
                      <button
                        className="text-link button-reset"
                        disabled={submitting}
                        type="button"
                        onClick={() => handleUpdateReply(reply)}
                      >
                        댓글 저장
                      </button>
                      <button
                        className="text-link button-reset"
                        disabled={submitting}
                        type="button"
                        onClick={handleCancelReplyEdit}
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <button
                      className="text-link button-reset"
                      disabled={submitting}
                      type="button"
                      onClick={() => handleStartReplyEdit(reply)}
                    >
                      댓글 수정
                    </button>
                  )}
                </div>
              ) : null}
              {user?.id && reply.authorId !== user.id && !post.isMock ? (
                <div className="notification-action-group">
                  <button
                    className="text-link button-reset"
                    disabled={submitting}
                    type="button"
                    onClick={() => handleReportCommunityTarget({ reply })}
                  >
                    댓글 신고
                  </button>
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <div className="empty-state">
            <strong>아직 댓글이 없습니다.</strong>
            <p>첫 댓글을 남겨서 이 스레드를 실제 대화 흐름으로 바꿔보세요.</p>
          </div>
        )}
      </div>

      <div className="reply-composer">
        <label className="field reply-field">
          <span>댓글 남기기</span>
          <textarea
            rows="3"
            placeholder="커피챗에서 유용했던 질문이나 팁을 남겨보세요"
            value={replyDraft}
            onChange={(event) => setReplyDraft(event.target.value)}
          />
        </label>
        <button className="primary-button" disabled={submitting} type="button" onClick={handleReplySubmit}>
          {submitting ? '저장 중...' : '댓글 등록'}
        </button>
      </div>

      {relatedPosts.length > 0 ? (
        <div className="related-posts">
          <p className="eyebrow">Related Threads</p>
          <div className="community-grid related-grid">
            {relatedPosts.map((relatedPost) => (
              <article className="community-card" key={relatedPost.slug}>
                <div className="job-meta">
                  <span className="job-badge">{relatedPost.category}</span>
                  <span className="job-company">{relatedPost.university || '커뮤니티'}</span>
                </div>
                <h2>{relatedPost.title}</h2>
                <p>{relatedPost.excerpt}</p>
                <Link className="secondary-button" to={`/community/post/${relatedPost.slug}`}>
                  관련 글 읽기
                </Link>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div className="sidebar-actions">
        <Link className="primary-button" to="/community">
          목록으로 돌아가기
        </Link>
        <Link className="secondary-button" to="/resume-maker">
          이력서 도구 보기
        </Link>
      </div>
    </section>
  )
}
