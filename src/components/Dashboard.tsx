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
  TrendingUp,
} from 'lucide-react'
import { sources, topics } from '../data'
import type { PageId, UserStudyData } from '../types'
import { SourceLink, TopicIcon } from '../ui'

const dayFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
})

export function Dashboard({
  data,
  onNavigate,
}: {
  data: UserStudyData
  onNavigate: (page: PageId) => void
}) {
  const reviewedToday = data.reviewLogs.filter(
    (log) => new Date(log.reviewedAt).toDateString() === new Date().toDateString(),
  ).length
  const correctAnswers = data.quizLogs.filter((log) => log.correct).length
  const accuracy = data.quizLogs.length
    ? Math.round((correctAnswers / data.quizLogs.length) * 100)
    : 84

  return (
    <div className="page dashboard-page">
      <div className="welcome-row">
        <div>
          <p className="date-line">{dayFormatter.format(new Date())}</p>
          <h1>오늘도, <span>근거 있게</span> 기억해요.</h1>
          <p>짧게 회상하고 자주 연결하면 복잡한 약리도 오래 남습니다.</p>
        </div>
        <div className="streak-pill">
          <span><Flame size={18} fill="currentColor" /></span>
          <div><strong>{data.streak}일</strong><small>연속 학습</small></div>
        </div>
      </div>

      <section className="study-hero">
        <div className="molecule molecule-one" />
        <div className="molecule molecule-two" />
        <div className="hero-copy">
          <span className="eyebrow-chip"><Sparkles size={14} /> TODAY'S SESSION</span>
          <h2>오늘의 기억을<br />단단하게 만들 시간</h2>
          <p>복습 12장 · 새 카드 5장 · 예상 18분</p>
          <button className="primary-lime-button" onClick={() => onNavigate('flashcards')}>
            오늘 복습 시작 <ArrowRight size={17} />
          </button>
        </div>
        <div className="session-ring-wrap">
          <div className="session-ring" style={{ '--progress': `${Math.min(100, reviewedToday * 8)}%` } as React.CSSProperties}>
            <div>
              <strong>{reviewedToday}</strong>
              <span>/ 12 cards</span>
            </div>
          </div>
          <p><span />오늘 복습 진행률</p>
        </div>
      </section>

      <section className="metric-grid" aria-label="학습 요약">
        <article className="metric-card">
          <span className="metric-icon coral"><RotateCcw size={19} /></span>
          <div><p>오늘 복습</p><strong>12<small> 장</small></strong></div>
          <em>우선순위 4장</em>
        </article>
        <article className="metric-card">
          <span className="metric-icon green"><Target size={19} /></span>
          <div><p>최근 정답률</p><strong>{accuracy}<small>%</small></strong></div>
          <em className="positive"><TrendingUp size={13} /> 6%</em>
        </article>
        <article className="metric-card">
          <span className="metric-icon blue"><Clock3 size={19} /></span>
          <div><p>누적 학습</p><strong>{Math.floor(data.totalMinutes / 60)}<small>h {data.totalMinutes % 60}m</small></strong></div>
          <em>이번 주 74분</em>
        </article>
        <article className="metric-card">
          <span className="metric-icon amber"><CheckCircle2 size={19} /></span>
          <div><p>안정 기억</p><strong>73<small>%</small></strong></div>
          <em>목표 90%</em>
        </article>
      </section>

      <div className="dashboard-columns">
        <section className="panel continue-panel">
          <div className="panel-heading">
            <div><span className="section-kicker">CONTINUE LEARNING</span><h3>이어서 학습하기</h3></div>
            <button className="text-button" onClick={() => onNavigate('concepts')}>전체 보기 <ArrowRight size={15} /></button>
          </div>
          <article className="continue-card">
            <div className="topic-art tone-cardio">
              <span className="pulse-line" />
              <div className="topic-art-icon"><TopicIcon topic={topics[1]} size={28} /></div>
              <p>CARDIOVASCULAR</p>
            </div>
            <div className="continue-content">
              <span className="module-label">CHAPTER 04 · 심혈관계</span>
              <h4>RAAS를 조절하는 약물</h4>
              <p>ACE inhibitors · ARBs · MRAs의 작용점과 임상적 차이를 연결합니다.</p>
              <div className="inline-progress"><span><i style={{ width: '68%' }} /></span><strong>68%</strong></div>
              <button className="soft-button" onClick={() => onNavigate('concepts')}>6분 이어서 학습 <MoveRight size={16} /></button>
            </div>
          </article>
        </section>

        <section className="panel queue-panel">
          <div className="panel-heading">
            <div><span className="section-kicker">SMART QUEUE</span><h3>오늘의 학습 큐</h3></div>
            <span className="time-estimate"><Clock3 size={14} /> 18분</span>
          </div>
          <div className="queue-list">
            <button onClick={() => onNavigate('flashcards')}>
              <span className="queue-order urgent">01</span>
              <span><strong>만기 카드 복습</strong><small>기억 위험이 높은 12장</small></span>
              <em>8분</em><ArrowRight size={16} />
            </button>
            <button onClick={() => onNavigate('quiz')}>
              <span className="queue-order">02</span>
              <span><strong>임상 사례 퀴즈</strong><small>최근 취약 개념 5문항</small></span>
              <em>6분</em><ArrowRight size={16} />
            </button>
            <button onClick={() => onNavigate('evidence')}>
              <span className="queue-order">03</span>
              <span><strong>새 근거 훑어보기</strong><small>SGLT2 outcome research</small></span>
              <em>4분</em><ArrowRight size={16} />
            </button>
          </div>
        </section>
      </div>

      <div className="dashboard-columns bottom-columns">
        <section className="panel mastery-panel">
          <div className="panel-heading">
            <div><span className="section-kicker">MASTERY MAP</span><h3>과목별 기억 상태</h3></div>
            <button className="text-button" onClick={() => onNavigate('progress')}>리포트 <ArrowRight size={15} /></button>
          </div>
          <div className="mastery-list">
            {topics.slice(0, 4).map((topic) => (
              <button key={topic.id} onClick={() => onNavigate('concepts')}>
                <span className={`topic-mini-icon ${topic.tone}`}><TopicIcon topic={topic} size={17} /></span>
                <span className="mastery-copy"><strong>{topic.name}</strong><small>{topic.englishName}</small></span>
                <span className="mastery-bar"><i style={{ width: `${topic.mastery}%` }} /></span>
                <em>{topic.mastery}%</em>
              </button>
            ))}
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
