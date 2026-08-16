import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Flame,
  Lightbulb,
  MoveRight,
  RotateCcw,
  Sparkles,
  Target,
} from 'lucide-react'
import { sources, topics } from '../data'
import type { StudyMetrics } from '../studyMetrics'
import type { PageId, UserStudyData } from '../types'
import { SourceLink, TopicIcon } from '../ui'

const dayFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
})

export function Dashboard({
  data,
  metrics,
  displayName,
  onNavigate,
}: {
  data: UserStudyData
  metrics: StudyMetrics
  displayName: string
  onNavigate: (page: PageId) => void
}) {
  const queueCount = metrics.dueReviewCount + metrics.todayNewCardCount
  const dailyTarget = metrics.reviewedUniqueToday + queueCount
  const estimatedMinutes = queueCount
  const sessionProgress = dailyTarget
    ? Math.min(100, (metrics.reviewedUniqueToday / dailyTarget) * 100)
    : 0
  const recentTopic = topics.find((topic) => topic.id === metrics.lastTopicId) ?? topics[0]
  const recentMastery = metrics.topicMastery[recentTopic.id]

  return (
    <div className="page dashboard-page">
      <div className="welcome-row">
        <div>
          <p className="date-line">{dayFormatter.format(new Date())}</p>
          {metrics.hasStarted ? (
            <h1>{displayName}님, 오늘도 <span>근거 있게</span> 기억해요.</h1>
          ) : (
            <h1>반가워요, {displayName}님. <span>첫 기억</span>을 만들어 볼까요?</h1>
          )}
          <p>짧게 회상하고 자주 연결하면 복잡한 약리도 오래 남습니다.</p>
        </div>
        <div className={`streak-pill ${metrics.streak === 0 ? 'empty' : ''}`}>
          <span><Flame size={18} fill={metrics.streak ? 'currentColor' : 'none'} /></span>
          <div>
            <strong>{metrics.streak ? `${metrics.streak}일` : '첫 학습 전'}</strong>
            <small>{metrics.streak ? '연속 학습' : '오늘부터 기록해요'}</small>
          </div>
        </div>
      </div>

      <section className="study-hero">
        <div className="molecule molecule-one" />
        <div className="molecule molecule-two" />
        <div className="hero-copy">
          <span className="eyebrow-chip"><Sparkles size={14} /> TODAY'S SESSION</span>
          <h2>{metrics.hasStarted ? <>오늘의 기억을<br />단단하게 만들 시간</> : <>첫 학습을<br />가볍게 시작해요</>}</h2>
          <p>{queueCount ? `복습 ${metrics.dueReviewCount}장 · 새 카드 ${metrics.todayNewCardCount}장 · 약 ${estimatedMinutes}분` : '오늘 예정된 카드 학습을 마쳤어요.'}</p>
          <button className="primary-lime-button" onClick={() => onNavigate(queueCount ? 'flashcards' : 'concepts')}>
            {metrics.hasStarted ? (queueCount ? '오늘 학습 시작' : '개념 둘러보기') : `플래시카드 ${metrics.todayNewCardCount}장 시작`} <ArrowRight size={17} />
          </button>
        </div>
        <div className="session-ring-wrap">
          <div className="session-ring" style={{ '--progress': `${sessionProgress}%` } as React.CSSProperties}>
            <div>
              <strong>{metrics.reviewedUniqueToday}</strong>
              <span>/ {dailyTarget} cards</span>
            </div>
          </div>
          <p><span />오늘 회상 진행률</p>
        </div>
      </section>

      <section className="metric-grid" aria-label="학습 요약">
        <article className="metric-card">
          <span className="metric-icon coral"><RotateCcw size={19} /></span>
          <div><p>오늘 회상</p><strong>{metrics.reviewedToday}<small> 장</small></strong></div>
          <em>{metrics.dueReviewCount ? `남은 복습 ${metrics.dueReviewCount}장` : '만기 복습 없음'}</em>
        </article>
        <article className="metric-card">
          <span className="metric-icon green"><Target size={19} /></span>
          <div><p>퀴즈 정답률</p><strong>{metrics.accuracy ?? '—'}{metrics.accuracy !== null && <small>%</small>}</strong></div>
          <em>{metrics.accuracy === null ? '퀴즈를 풀면 표시' : `${data.quizLogs.length}문항 기준`}</em>
        </article>
        <article className="metric-card">
          <span className="metric-icon blue"><Clock3 size={19} /></span>
          <div><p>학습 활동</p><strong>{data.reviewLogs.length + data.quizLogs.length}<small> 회</small></strong></div>
          <em>최근 7일 {metrics.weeklyActivityCount}회</em>
        </article>
        <article className="metric-card">
          <span className="metric-icon amber"><CheckCircle2 size={19} /></span>
          <div><p>안정 카드 비율</p><strong>{metrics.stableCardRate ?? '—'}{metrics.stableCardRate !== null && <small>%</small>}</strong></div>
          <em>{metrics.stableCardRate === null ? '카드를 복습하면 표시' : `${metrics.learnedCardCount}장 중 계산`}</em>
        </article>
      </section>

      <div className="dashboard-columns">
        <section className="panel continue-panel">
          <div className="panel-heading">
            <div><span className="section-kicker">{metrics.hasStarted ? 'CONTINUE LEARNING' : 'START LEARNING'}</span><h3>{metrics.hasStarted ? '이어서 학습하기' : '첫 학습 시작하기'}</h3></div>
            <button className="text-button" onClick={() => onNavigate('concepts')}>전체 보기 <ArrowRight size={15} /></button>
          </div>
          <article className="continue-card">
            <div className={`topic-art tone-${recentTopic.id}`}>
              <span className="pulse-line" />
              <div className="topic-art-icon"><TopicIcon topic={recentTopic} size={28} /></div>
              <p>{recentTopic.englishName.toUpperCase()}</p>
            </div>
            <div className="continue-content">
              <span className="module-label">{metrics.hasStarted ? '최근 학습 주제' : '추천 시작 주제'}</span>
              <h4>{recentTopic.name}</h4>
              <p>{recentTopic.description}. 핵심 개념을 먼저 훑고 카드로 회상합니다.</p>
              <div className="inline-progress"><span><i style={{ width: `${recentMastery ?? 0}%` }} /></span><strong>{recentMastery === null ? '시작 전' : `${recentMastery}%`}</strong></div>
              <button className="soft-button" onClick={() => onNavigate(metrics.hasStarted ? 'flashcards' : 'concepts')}>
                {metrics.hasStarted ? '이어서 학습' : '개념 둘러보기'} <MoveRight size={16} />
              </button>
            </div>
          </article>
        </section>

        <section className="panel queue-panel">
          <div className="panel-heading">
            <div><span className="section-kicker">SMART QUEUE</span><h3>오늘의 학습 큐</h3></div>
            <span className="time-estimate"><Clock3 size={14} /> 약 {estimatedMinutes + 5}분</span>
          </div>
          <div className="queue-list">
            <button onClick={() => onNavigate(queueCount ? 'flashcards' : 'concepts')}>
              <span className={`queue-order ${metrics.dueReviewCount ? 'urgent' : ''}`}>01</span>
              <span><strong>{metrics.dueReviewCount ? '만기 카드 복습' : metrics.todayNewCardCount ? '새 카드로 시작' : '오늘 카드 학습 완료'}</strong><small>{metrics.dueReviewCount ? `복습 시각이 된 ${metrics.dueReviewCount}장` : metrics.todayNewCardCount ? `오늘 처음 만날 ${metrics.todayNewCardCount}장` : '현재 대기 중인 카드가 없어요'}</small></span>
              <em>{estimatedMinutes ? `${estimatedMinutes}분` : '완료'}</em><ArrowRight size={16} />
            </button>
            <button onClick={() => onNavigate('quiz')}>
              <span className="queue-order">02</span>
              <span><strong>{metrics.accuracy === null ? '첫 임상 사례 퀴즈' : '임상 사례 퀴즈'}</strong><small>{metrics.accuracy === null ? '개념을 환자 상황에 적용' : `누적 정답률 ${metrics.accuracy}%`}</small></span>
              <em>5분</em><ArrowRight size={16} />
            </button>
            <button onClick={() => onNavigate('evidence')}>
              <span className="queue-order">03</span>
              <span><strong>영문 논문 찾아보기</strong><small>Europe PMC 실시간 검색</small></span>
              <em>자유</em><ArrowRight size={16} />
            </button>
          </div>
        </section>
      </div>

      <div className="dashboard-columns bottom-columns">
        <section className="panel mastery-panel">
          <div className="panel-heading">
            <div><span className="section-kicker">MEMORY MAP</span><h3>과목별 기억 상태</h3></div>
            <button className="text-button" onClick={() => onNavigate('progress')}>리포트 <ArrowRight size={15} /></button>
          </div>
          <div className="mastery-list">
            {topics.slice(0, 4).map((topic) => {
              const mastery = metrics.topicMastery[topic.id]
              return (
                <button key={topic.id} onClick={() => onNavigate('concepts')}>
                  <span className={`topic-mini-icon ${topic.tone}`}><TopicIcon topic={topic} size={17} /></span>
                  <span className="mastery-copy"><strong>{topic.name}</strong><small>{topic.englishName}</small></span>
                  <span className="mastery-bar"><i style={{ width: `${mastery ?? 0}%` }} /></span>
                  <em>{mastery === null ? '시작 전' : `${mastery}%`}</em>
                </button>
              )
            })}
          </div>
        </section>

        <section className="evidence-pearl">
          <div className="pearl-top"><span><Lightbulb size={18} /></span><em>오늘의 한 줄</em></div>
          <blockquote>“정상상태 도달 시간은 용량이 아니라 <mark>반감기</mark>가 결정한다.”</blockquote>
          <p>선형 약동학에서는 약 4–5 반감기 후 정상상태 농도의 94–97%에 도달합니다.</p>
          <SourceLink {...sources.pkpd} compact />
          <button onClick={() => onNavigate('flashcards')}><BookOpen size={15} /> 카드로 확인하기</button>
        </section>
      </div>
    </div>
  )
}
