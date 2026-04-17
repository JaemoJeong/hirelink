import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createCommunityPost,
  listCommunityCategories,
  listCommunityPosts,
} from '../lib/platformApi.js'
import { useAuth } from '../providers/AuthProvider.jsx'

const emptyComposer = {
  categoryId: '',
  title: '',
  body: '',
  tags: '',
}

export function CommunityPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [categoryNames, setCategoryNames] = useState(['전체'])
  const [categoryRecords, setCategoryRecords] = useState([])
  const [search, setSearch] = useState('')
  const [activeTopic, setActiveTopic] = useState('전체')
  const [sortMode, setSortMode] = useState('인기순')
  const [composer, setComposer] = useState(emptyComposer)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState({ tone: 'neutral', message: '' })
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    let ignore = false

    async function loadCommunityData() {
      setLoading(true)

      const [{ data: nextPosts }, { data: nextCategoryNames, records: nextCategoryRecords }] =
        await Promise.all([listCommunityPosts(), listCommunityCategories()])

      if (ignore) {
        return
      }

      setPosts(nextPosts ?? [])
      setCategoryNames(nextCategoryNames ?? ['전체'])
      setCategoryRecords(nextCategoryRecords ?? [])
      setLoading(false)
    }

    loadCommunityData()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (!composer.categoryId && categoryRecords[0]?.id) {
      setComposer((currentComposer) => ({
        ...currentComposer,
        categoryId: categoryRecords[0].id,
      }))
    }
  }, [categoryRecords, composer.categoryId])

  const filteredPosts = posts
    .filter((post) => {
      const query = deferredSearch.trim().toLowerCase()
      const searchable = [post.title, post.excerpt, post.author, post.university, ...(post.tags ?? [])]

      const matchesQuery =
        query.length === 0 || searchable.filter(Boolean).some((field) => field.toLowerCase().includes(query))
      const matchesTopic = activeTopic === '전체' || post.category === activeTopic

      return matchesQuery && matchesTopic
    })
    .sort((left, right) => {
      if (sortMode === '최신순') {
        return (
          new Date(right.createdAtRaw ?? right.createdAt).getTime() -
          new Date(left.createdAtRaw ?? left.createdAt).getTime()
        )
      }

      return right.likes + right.comments - (left.likes + left.comments)
    })

  const featuredPost = filteredPosts[0] ?? posts[0] ?? null
  const hasMockPosts = posts.length > 0 && posts.every((post) => post.isMock)
  const highlightPosts = (filteredPosts.length > 0 ? filteredPosts : posts).slice(0, 3)

  function updateComposer(field, value) {
    setComposer((currentComposer) => ({
      ...currentComposer,
      [field]: value,
    }))
  }

  async function handleCreatePost(event) {
    event.preventDefault()

    if (!user?.id) {
      navigate('/auth', { state: { from: { pathname: '/community' } } })
      return
    }

    setSubmitting(true)
    setStatus({ tone: 'neutral', message: '' })

    const { data, error } = await createCommunityPost({
      authorId: user.id,
      categoryId: composer.categoryId,
      title: composer.title,
      body: composer.body,
      tags: composer.tags,
    })

    if (error || !data?.slug) {
      setStatus({ tone: 'error', message: error?.message ?? '게시글을 저장하지 못했습니다.' })
      setSubmitting(false)
      return
    }

    setComposer((currentComposer) => ({
      ...emptyComposer,
      categoryId: currentComposer.categoryId,
    }))
    setSubmitting(false)
    navigate(`/community/post/${data.slug}`)
  }

  return (
    <>
      <section className="page-hero section-card compact-hero">
        <div>
          <p className="eyebrow">Community</p>
          <h1>커피챗, 채용 후기, 인증 팁이 실제로 쌓이는 커뮤니티</h1>
          <p>
            이제는 정적인 데모 피드가 아니라, Supabase에 있는 글을 읽고 로그인한 사용자가
            새 글과 댓글, 좋아요를 남길 수 있는 실제 커뮤니티 흐름으로 바뀌었습니다.
          </p>
        </div>
        <div className="compact-hero-card community-hero-card">
          <span className="compact-kicker">Featured Thread</span>
          <strong>{featuredPost?.title ?? '아직 게시글이 없습니다'}</strong>
          <p>{featuredPost?.excerpt ?? '첫 게시글을 작성하면 여기에서 대표 스레드로 노출됩니다.'}</p>
          {featuredPost ? (
            <div className="job-detail-row">
              <span>{featuredPost.category}</span>
              <span>{featuredPost.readTime}</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section-card community-shell">
        {hasMockPosts ? (
          <div className="status-banner status-neutral">
            <strong>현재는 샘플 커뮤니티 글을 표시 중입니다</strong>
            <p>
              아직 Supabase에 실제 게시글이 없어서 공개 샘플을 보여주고 있습니다. 로그인 후
              오른쪽 작성 폼으로 첫 글을 올리면 바로 실데이터 커뮤니티로 전환됩니다.
            </p>
          </div>
        ) : null}

        {status.message ? (
          <div className={`status-banner status-${status.tone}`}>
            <strong>{status.tone === 'error' ? '오류' : status.tone === 'success' ? '완료' : '안내'}</strong>
            <p>{status.message}</p>
          </div>
        ) : null}

        <div className="section-heading">
          <div>
            <p className="eyebrow">Discussion Board</p>
            <h2>질문, 후기, 팁이 자연스럽게 섞이는 실제 피드</h2>
          </div>
          <p>검색, 토픽 필터, 정렬과 함께 실제 게시글 작성 흐름까지 붙여두었습니다.</p>
        </div>

        <div className="community-toolbar">
          <label className="search-box">
            <span>제목, 작성자, 태그 검색</span>
            <input
              type="search"
              placeholder="예: 커피챗, 학교 인증, 포트폴리오"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label className="field">
            <span>정렬 기준</span>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
              <option value="인기순">인기순</option>
              <option value="최신순">최신순</option>
            </select>
          </label>
        </div>

        <div className="filter-row" aria-label="커뮤니티 토픽 필터">
          {categoryNames.map((topic) => (
            <button
              className={`filter-pill ${activeTopic === topic ? 'active' : ''}`}
              key={topic}
              type="button"
              onClick={() =>
                startTransition(() => {
                  setActiveTopic(topic)
                })
              }
            >
              {topic}
            </button>
          ))}
        </div>

        <div className="community-layout">
          <div className="community-grid">
            {loading ? (
              <div className="empty-state">
                <strong>커뮤니티 글을 불러오는 중입니다.</strong>
                <p>잠시만 기다리면 최신 스레드가 표시됩니다.</p>
              </div>
            ) : filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <article className="section-card community-card" key={post.id}>
                  <div className="job-meta">
                    <span className="job-badge">{post.category}</span>
                    <span className="job-company">{post.university || '커뮤니티'}</span>
                  </div>
                  <h2>{post.title}</h2>
                  <p>{post.excerpt}</p>
                  <div className="community-tag-row">
                    {post.tags?.map((tag) => (
                      <span className="community-tag" key={tag}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="community-meta-row">
                    <span>{post.author}</span>
                    <span>{post.createdAt}</span>
                    <span>{post.readTime}</span>
                    <span>좋아요 {post.likes}</span>
                    <span>댓글 {post.comments}</span>
                  </div>
                  <Link className="secondary-button" to={`/community/post/${post.slug}`}>
                    글 읽기
                  </Link>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <strong>조건에 맞는 게시글이 없습니다.</strong>
                <p>검색어를 바꾸거나 첫 게시글을 직접 올려보세요.</p>
              </div>
            )}
          </div>

          <aside className="section-card jobs-sidebar-card community-sidebar">
            <p className="eyebrow">Write a Post</p>
            <h2>직접 글을 올려서 실제 커뮤니티를 시작할 수 있습니다</h2>

            {user ? (
              <form className="form-grid" onSubmit={handleCreatePost}>
                <label className="field">
                  <span>카테고리</span>
                  <select
                    value={composer.categoryId}
                    onChange={(event) => updateComposer('categoryId', event.target.value)}
                  >
                    <option value="">카테고리 선택</option>
                    {categoryRecords.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>제목</span>
                  <input
                    placeholder="예: 커피챗 전에 어떤 질문을 준비하면 좋을까요?"
                    value={composer.title}
                    onChange={(event) => updateComposer('title', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>태그</span>
                  <input
                    placeholder="커피챗, 면접, 학교인증"
                    value={composer.tags}
                    onChange={(event) => updateComposer('tags', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>본문</span>
                  <textarea
                    rows="6"
                    placeholder="질문, 후기, 팁을 자유롭게 적어보세요"
                    value={composer.body}
                    onChange={(event) => updateComposer('body', event.target.value)}
                  />
                </label>
                <div className="sidebar-actions stacked">
                  <button className="primary-button full-width" disabled={submitting} type="submit">
                    {submitting ? '저장 중...' : '게시글 올리기'}
                  </button>
                  <Link className="secondary-button full-width" to="/inbox">
                    인박스 보기
                  </Link>
                </div>
              </form>
            ) : (
              <div className="sidebar-actions stacked">
                <Link className="primary-button full-width" to="/auth">
                  로그인하고 글 쓰기
                </Link>
                <Link className="secondary-button full-width" to="/resume-maker">
                  이력서 도구 보기
                </Link>
              </div>
            )}

            <div className="community-highlight-stack">
              {highlightPosts.map((post) => (
                <article className="community-highlight-card" key={post.id}>
                  <strong>{post.title}</strong>
                  <p>
                    {post.author} · 좋아요 {post.likes} · 댓글 {post.comments}
                  </p>
                </article>
              ))}
            </div>

            {featuredPost ? (
              <div className="sidebar-actions stacked">
                <Link className="secondary-button full-width" to={`/community/post/${featuredPost.slug}`}>
                  대표 글 열기
                </Link>
              </div>
            ) : null}
          </aside>
        </div>
      </section>
    </>
  )
}
