import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Flame,
  Lightbulb,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { quizQuestions, topics } from '../data'
import type { PageId, UserStudyData } from '../types'
import { TopicIcon } from '../ui'

const makeWeek = (todayCount: number) => {
  const formatter = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' })
  const values = [18, 27, 0, 34, 21, 46, Math.max(todayCount, 8)]
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    return { label: formatter.format(date), value: values[index], isToday: index === 6 }
  })
}

export function ProgressReport({
  data,
  onNavigate,
}: {
  data: UserStudyData
  onNavigate: (page: PageId) => void
}) {
  const todayReviews = data.reviewLogs.filter((log) => new Date(log.reviewedAt).toDateString() === new Date().toDateString()).length
  const correct = data.quizLogs.filter((log) => log.correct).length
  const accuracy = data.quizLogs.length ? Math.round((correct / data.quizLogs.length) * 100) : 84
  const week = makeWeek(todayReviews)
  const totalCards = Object.keys(data.reviewStates).length
  const recentMistakes = data.quizLogs
    .filter((log) => !log.correct)
    .slice(-3)
    .reverse()
    .map((log) => quizQuestions.find((question) => question.id === log.questionId))
    .filter(Boolean)
  const fallbackMistakes = [quizQuestions[7], quizQuestions[4], quizQuestions[1]]
  const mistakes = recentMistakes.length ? recentMistakes : fallbackMistakes

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pharmory-study-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page progress-page">
      <div className="page-heading-row compact-heading">
        <div>
          <span className="section-kicker">MEMORY ANALYTICS</span>
          <h1>공부한 시간보다, <span>남은 기억</span>을 봅니다.</h1>
          <p>회상 기록과 오답 패턴을 바탕으로 다음 학습 우선순위를 정리합니다.</p>
        </div>
        <button className="soft-button" onClick={exportData}><Download size={16} /> 학습 기록 내보내기</button>
      </div>

      <section className="report-hero">
        <div className="retention-score">
          <div className="retention-ring"><span><strong>73</strong><small>%</small></span></div>
          <div><span className="section-kicker">ESTIMATED RETENTION</span><h2>기억 유지율이 안정 구간에 있어요.</h2><p>목표 90%까지 취약 카드 18장을 우선 복습하면 됩니다.</p></div>
        </div>
        <div className="report-hero-stats">
          <div><span><Flame size={17} /></span><strong>{data.streak}일</strong><small>연속 학습</small></div>
          <div><span><CheckCircle2 size={17} /></span><strong>{accuracy}%</strong><small>퀴즈 정답률</small></div>
          <div><span><Brain size={17} /></span><strong>{Math.max(totalCards, 38)}</strong><small>학습한 카드</small></div>
        </div>
      </section>

      <div className="report-grid">
        <section className="panel activity-panel">
          <div className="panel-heading"><div><span className="section-kicker">LAST 7 DAYS</span><h3>주간 회상 활동</h3></div><span className="positive-change"><TrendingUp size={14} /> 지난주보다 18%</span></div>
          <div className="activity-chart">
            {week.map((day) => <div key={day.label} className={day.isToday ? 'today' : ''}><span className="bar-value">{day.value}</span><div className="bar-track"><i style={{ height: `${Math.max(5, (day.value / 50) * 100)}%` }} /></div><strong>{day.label}</strong></div>)}
          </div>
          <div className="chart-summary"><div><strong>154</strong><span>총 회상</span></div><div><strong>22</strong><span>일평균</span></div><div><strong>74m</strong><span>학습 시간</span></div></div>
        </section>

        <section className="panel forecast-panel">
          <div className="panel-heading"><div><span className="section-kicker">REVIEW FORECAST</span><h3>다음 7일 복습량</h3></div><CalendarDays size={19} /></div>
          <div className="forecast-list">
            {[['오늘', 12, 78], ['내일', 8, 52], ['화', 15, 94], ['수', 6, 39], ['목', 10, 65], ['금', 4, 26], ['토', 9, 58]].map(([day, count, width]) => (
              <div key={day as string}><span>{day}</span><div><i style={{ width: `${width}%` }} /></div><strong>{count}</strong></div>
            ))}
          </div>
          <p className="forecast-note"><Clock3 size={15} /> 예상 복습 시간 <strong>주 42분</strong></p>
        </section>
      </div>

      <div className="report-grid lower-report-grid">
        <section className="panel topic-mastery-panel">
          <div className="panel-heading"><div><span className="section-kicker">TOPIC MASTERY</span><h3>과목별 기억 안정도</h3></div><button className="text-button" onClick={() => onNavigate('concepts')}>개념 보기 <ArrowRight size={14} /></button></div>
          <div className="topic-mastery-table">
            <div className="table-head"><span>과목</span><span>안정도</span><span>상태</span><span>다음 행동</span></div>
            {topics.slice(0, 6).map((topic) => (
              <div className="table-row" key={topic.id}>
                <span className="table-topic"><i className={`topic-mini-icon ${topic.tone}`}><TopicIcon topic={topic} size={16} /></i><strong>{topic.name}</strong></span>
                <span className="table-progress"><i><b style={{ width: `${topic.mastery}%` }} /></i><em>{topic.mastery}%</em></span>
                <span className={topic.mastery >= 70 ? 'status stable' : topic.mastery >= 50 ? 'status growing' : 'status weak'}>{topic.mastery >= 70 ? '안정' : topic.mastery >= 50 ? '강화 중' : '취약'}</span>
                <button onClick={() => onNavigate(topic.mastery < 60 ? 'flashcards' : 'concepts')}>{topic.mastery < 60 ? '복습' : '확인'} <ArrowRight size={13} /></button>
              </div>
            ))}
          </div>
        </section>

        <section className="panel misconception-panel">
          <div className="panel-heading"><div><span className="section-kicker">MISCONCEPTION RADAR</span><h3>최근 놓친 연결</h3></div><AlertTriangle size={19} /></div>
          <div className="mistake-list">
            {mistakes.map((question, index) => question && (
              <article key={question.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div><strong>{question.takeaway}</strong><p>{topics.find((topic) => topic.id === question.topicId)?.name} · {question.eyebrow}</p></div>
              </article>
            ))}
          </div>
          <button className="full-soft-button" onClick={() => onNavigate('quiz')}><RotateCcw size={16} /> 오답 맥락으로 다시 풀기 <ArrowRight size={15} /></button>
        </section>
      </div>

      <section className="learning-insight-strip">
        <span><Lightbulb size={20} /></span>
        <div><em>PHARMORY INSIGHT</em><strong>감염 약물치료는 회상 횟수보다 ‘스펙트럼 ↔ PK/PD 지표’ 연결에서 자주 끊깁니다.</strong><p>다음 세션에서 aminoglycoside와 vancomycin을 교차 출제합니다.</p></div>
        <button onClick={() => onNavigate('flashcards')}>추천 복습 시작 <ArrowRight size={15} /></button>
        <Sparkles className="insight-spark" size={34} />
      </section>
    </div>
  )
}
