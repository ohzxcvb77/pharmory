import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Keyboard,
  Layers3,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import { topics } from '../data'
import { formatNextReview, scheduleReview } from '../srs'
import type { Flashcard, ReviewState, TopicId } from '../types'
import { SourceLink, TopicIcon } from '../ui'

type Grade = 0 | 1 | 2 | 3

const gradeMeta: { grade: Grade; label: string; hint: string; key: string; className: string }[] = [
  { grade: 0, label: '다시', hint: '기억 안 남', key: '1', className: 'again' },
  { grade: 1, label: '어려움', hint: '간신히 회상', key: '2', className: 'hard' },
  { grade: 2, label: '좋음', hint: '정확히 회상', key: '3', className: 'good' },
  { grade: 3, label: '쉬움', hint: '즉시 회상', key: '4', className: 'easy' },
]

const buildDueQueue = (
  cards: Flashcard[],
  topicId: TopicId | 'all',
  reviewStates: Record<string, ReviewState>,
) => cards.filter((card) => {
  if (topicId !== 'all' && card.topicId !== topicId) return false
  const dueAt = reviewStates[card.id]?.dueAt
  return !dueAt || new Date(dueAt).getTime() <= Date.now()
})

export function FlashcardStudy({
  cards,
  reviewStates,
  activeTopicId,
  onChangeTopic,
  onReview,
  onGoQuiz,
}: {
  cards: Flashcard[]
  reviewStates: Record<string, ReviewState>
  activeTopicId: TopicId | 'all'
  onChangeTopic: (topicId: TopicId | 'all') => void
  onReview: (card: Flashcard, grade: Grade) => void
  onGoQuiz: () => void
}) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium')
  const [grades, setGrades] = useState<Grade[]>([])
  const reviewStatesRef = useRef(reviewStates)
  reviewStatesRef.current = reviewStates
  const [sessionCards, setSessionCards] = useState(() => buildDueQueue(cards, activeTopicId, reviewStates))

  const current = sessionCards[index]
  const currentTopic = current ? topics.find((topic) => topic.id === current.topicId) : undefined
  const finished = sessionCards.length > 0 && index >= sessionCards.length
  const topicCardCount = activeTopicId === 'all' ? cards.length : cards.filter((card) => card.topicId === activeTopicId).length

  useEffect(() => {
    setSessionCards(buildDueQueue(cards, activeTopicId, reviewStatesRef.current))
    setIndex(0)
    setFlipped(false)
    setGrades([])
  }, [activeTopicId, cards])

  const handleGrade = (grade: Grade) => {
    if (!current || !flipped) return
    onReview(current, grade)
    if (grade === 0) {
      setSessionCards((queue) => {
        const nextQueue = [...queue]
        nextQueue.splice(Math.min(queue.length, index + 6), 0, current)
        return nextQueue
      })
    }
    setGrades((list) => [...list, grade])
    setFlipped(false)
    setConfidence('medium')
    window.setTimeout(() => setIndex((value) => value + 1), 120)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.tagName === 'INPUT') return
      if (event.code === 'Space' && current && !finished) {
        event.preventDefault()
        setFlipped((value) => !value)
      }
      if (flipped && ['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(event.code)) {
        handleGrade(Number(event.code.slice(-1)) - 1 as Grade)
      }
      if (event.code === 'ArrowLeft') setIndex((value) => Math.max(0, value - 1))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const restart = () => {
    setIndex(0)
    setGrades([])
    setFlipped(false)
  }

  return (
    <div className="page flashcards-page">
      <div className="page-heading-row compact-heading">
        <div>
          <span className="section-kicker">SPACED REPETITION</span>
          <h1>보고, 덮고, <span>꺼내세요.</span></h1>
          <p>답을 보기 전의 회상이 기억을 강화합니다. 평가는 다음 복습 간격에 반영됩니다.</p>
        </div>
        <div className="study-mode-tools">
          <button className="soft-button"><SlidersHorizontal size={16} /> 세션 설정</button>
          <span><Keyboard size={16} /> Space로 뒤집기 · 1–4로 평가</span>
        </div>
      </div>

      <div className="topic-chip-row scroll-row" aria-label="카드 주제 선택">
        <button className={activeTopicId === 'all' ? 'active' : ''} onClick={() => onChangeTopic('all')}><Layers3 size={15} /> 전체</button>
        {topics.map((topic) => (
          <button key={topic.id} className={activeTopicId === topic.id ? 'active' : ''} onClick={() => onChangeTopic(topic.id)}>
            <TopicIcon topic={topic} size={15} />{topic.name}
          </button>
        ))}
      </div>

      {sessionCards.length === 0 ? (
        <section className="empty-state panel"><Layers3 size={30} /><h2>{topicCardCount ? '오늘 예정된 복습을 모두 마쳤어요.' : '이 주제에는 아직 카드가 없습니다.'}</h2><p>{topicCardCount ? '다음 복습 시각까지 기억을 쉬게 해주세요.' : '논문 탐색에서 근거를 저장해 새 카드를 만들어 보세요.'}</p><button className="primary-button" onClick={() => onChangeTopic('all')}>전체 카드 보기</button></section>
      ) : finished ? (
        <section className="session-complete panel">
          <div className="completion-orbit"><CheckCircle2 size={42} /><span /><span /></div>
          <span className="section-kicker">SESSION COMPLETE</span>
          <h2>오늘의 회상 세션을 마쳤어요.</h2>
          <p>{sessionCards.length}장의 기억 경로를 다시 꺼냈습니다.</p>
          <div className="completion-stats">
            <div><strong>{grades.filter((grade) => grade >= 2).length}</strong><span>안정 회상</span></div>
            <div><strong>{grades.filter((grade) => grade < 2).length}</strong><span>다시 볼 카드</span></div>
            <div><strong>{Math.max(1, Math.round(sessionCards.length * 0.7))}m</strong><span>학습 시간</span></div>
          </div>
          <div className="completion-actions"><button className="soft-button" onClick={restart}><RotateCcw size={16} /> 한 번 더</button><button className="primary-button" onClick={onGoQuiz}>퀴즈로 적용하기 <ArrowRight size={16} /></button></div>
        </section>
      ) : current && currentTopic ? (
        <div className="study-stage">
          <main className="card-study-main">
            <div className="study-progress-row">
              <div><strong>{index + 1}</strong><span> / {sessionCards.length}</span></div>
              <div className="study-progress-track"><i style={{ width: `${((index + 1) / sessionCards.length) * 100}%` }} /></div>
              <span>{sessionCards.length - index - 1}장 남음</span>
            </div>

            <button
              className={`flashcard ${flipped ? 'flipped' : ''}`}
              onClick={() => setFlipped((value) => !value)}
              aria-label={flipped ? '카드 앞면 보기' : '정답 보기'}
            >
              <div className="flashcard-inner">
                <article className="flashcard-face flashcard-front">
                  <div className="card-meta">
                    <span className={`topic-mini-icon ${currentTopic.tone}`}><TopicIcon topic={currentTopic} size={16} /></span>
                    <span>{currentTopic.name}</span>
                    <em>{current.generated ? '논문에서 생성' : `난이도 ${'●'.repeat(current.difficulty)}${'○'.repeat(3 - current.difficulty)}`}</em>
                  </div>
                  <span className="prompt-label">QUESTION</span>
                  <h2>{current.front}</h2>
                  <div className="recall-rule" />
                  <p className="flip-hint"><RotateCcw size={16} /> 클릭하거나 Space를 눌러 정답 확인</p>
                </article>
                <article className="flashcard-face flashcard-back">
                  <div className="card-meta">
                    <span className={`topic-mini-icon ${currentTopic.tone}`}><TopicIcon topic={currentTopic} size={16} /></span>
                    <span>ANSWER</span>
                    <em>근거 연결됨</em>
                  </div>
                  <span className="answer-label">핵심 답</span>
                  <h2>{current.back}</h2>
                  <div className="clinical-pearl"><Sparkles size={17} /><div><strong>기억 연결</strong><p>{current.pearl}</p></div></div>
                  <SourceLink {...current.source} compact />
                </article>
              </div>
            </button>

            {!flipped ? (
              <div className="confidence-row">
                <span>지금 얼마나 확신하나요?</span>
                {(['low', 'medium', 'high'] as const).map((value) => (
                  <button key={value} className={confidence === value ? 'active' : ''} onClick={() => setConfidence(value)}>
                    {value === 'low' ? '낮음' : value === 'medium' ? '보통' : '높음'}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grade-grid">
                {gradeMeta.map((item) => {
                  const preview = scheduleReview(reviewStates[current.id], item.grade)
                  return (
                    <button key={item.grade} className={item.className} onClick={() => handleGrade(item.grade)}>
                      <kbd>{item.key}</kbd><span><strong>{item.label}</strong><small>{item.hint}</small></span><em>{formatNextReview(preview)}</em>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="card-nav-row">
              <button disabled={index === 0} onClick={() => { setIndex((value) => Math.max(0, value - 1)); setFlipped(false) }}><ArrowLeft size={16} /> 이전</button>
              <span>카드 평가는 이 기기에 자동 저장됩니다.</span>
              <button disabled={index === sessionCards.length - 1} onClick={() => { setIndex((value) => Math.min(sessionCards.length - 1, value + 1)); setFlipped(false) }}>건너뛰기 <ArrowRight size={16} /></button>
            </div>
          </main>

          <aside className="memory-sidebar">
            <section className="panel memory-model-card">
              <div className="memory-model-head"><span><Brain size={18} /></span><div><strong>기억 상태</strong><small>Memory model</small></div></div>
              <div className="memory-curve">
                <svg viewBox="0 0 240 88" role="img" aria-label="기억 유지 곡선">
                  <path d="M4 13 C 45 14, 52 57, 91 62 S 153 76, 236 78" fill="none" stroke="#d9ddd7" strokeWidth="2" strokeDasharray="4 5" />
                  <path d="M4 13 C 43 13, 61 39, 91 46 S 154 50, 236 58" fill="none" stroke="#39745f" strokeWidth="3" />
                  <circle cx="91" cy="46" r="5" fill="#dff36a" stroke="#244d3f" strokeWidth="2" />
                </svg>
                <div><span>지금</span><span>다음 복습</span></div>
              </div>
              <dl><div><dt>안정도</dt><dd>{reviewStates[current.id]?.repetitions ? '강화 중' : '새 기억'}</dd></div><div><dt>기존 간격</dt><dd>{reviewStates[current.id]?.intervalDays ?? 0}일</dd></div><div><dt>회상 목표</dt><dd>90%</dd></div></dl>
            </section>
            <section className="panel source-card-mini">
              <div><ExternalLink size={17} /><span><strong>이 카드의 근거</strong><small>Source-linked learning</small></span></div>
              <h4>{current.source.title}</h4>
              <p>{current.source.journal} · {current.source.year}</p>
              <a href={current.source.url} target="_blank" rel="noreferrer">PubMed에서 확인 <ArrowRight size={14} /></a>
            </section>
            <div className="micro-tip"><Clock3 size={16} /><p><strong>왜 10분 뒤인가요?</strong>놓친 카드는 같은 날 다시 꺼내 기억 흔적을 복구합니다.</p></div>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
