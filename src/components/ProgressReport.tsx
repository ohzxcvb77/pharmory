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
} from 'lucide-react'
import { quizQuestions, topics } from '../data'
import type { StudyMetrics } from '../studyMetrics'
import type { PageId, UserStudyData } from '../types'
import { TopicIcon } from '../ui'

export function ProgressReport({
  data,
  metrics,
  onNavigate,
}: {
  data: UserStudyData
  metrics: StudyMetrics
  onNavigate: (page: PageId) => void
}) {
  const recentMistakes = data.quizLogs
    .filter((log) => !log.correct)
    .slice(-3)
    .reverse()
    .map((log) => quizQuestions.find((question) => question.id === log.questionId))
    .filter((question): question is NonNullable<typeof question> => Boolean(question))
  const totalWeeklyActivity = metrics.weeklyActivity.reduce((sum, day) => sum + day.value, 0)
  const maxActivity = Math.max(1, ...metrics.weeklyActivity.map((day) => day.value))
  const totalForecast = metrics.forecast.reduce((sum, day) => sum + day.count, 0)
  const maxForecast = Math.max(1, ...metrics.forecast.map((day) => day.count))

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
        <button className="soft-button" onClick={exportData} disabled={!metrics.hasStarted} title={metrics.hasStarted ? '현재 프로필의 학습 기록 내보내기' : '내보낼 학습 기록이 아직 없어요'}><Download size={16} /> {metrics.hasStarted ? '학습 기록 내보내기' : '내보낼 기록 없음'}</button>
      </div>

      {!metrics.hasStarted ? (
        <section className="report-empty-state panel">
          <div className="report-empty-orbit"><Brain size={34} /><span /><span /></div>
          <span className="section-kicker">YOUR REPORT STARTS HERE</span>
          <h2>아직 리포트가 비어 있어요.</h2>
          <p>카드를 복습하면 기억 안정도가, 퀴즈를 풀면 취약 개념이 실제 기록으로 채워집니다.</p>
          <div className="report-empty-metrics">
            <div><strong>0</strong><span>회상 기록</span></div>
            <div><strong>—</strong><span>퀴즈 정답률</span></div>
            <div><strong>0일</strong><span>연속 학습</span></div>
          </div>
          <button className="primary-button" onClick={() => onNavigate('flashcards')}>첫 학습 시작 <ArrowRight size={16} /></button>
        </section>
      ) : (
        <>
          <section className="report-hero">
            <div className="retention-score">
              <div className="retention-ring" style={{ '--retention': `${metrics.stableCardRate ?? 0}%` } as React.CSSProperties}><span><strong>{metrics.stableCardRate ?? '—'}</strong>{metrics.stableCardRate !== null && <small>%</small>}</span></div>
              <div>
                <span className="section-kicker">STABLE CARD RATE</span>
                <h2>{metrics.stableCardRate === null ? '복습 기록을 더 쌓아 보세요.' : '실제 회상 기록으로 계산한 안정 카드 비율이에요.'}</h2>
                <p>2회 이상 안정적으로 회상한 카드를 학습한 카드 수와 비교합니다.</p>
              </div>
            </div>
            <div className="report-hero-stats">
              <div><span><Flame size={17} /></span><strong>{metrics.streak}일</strong><small>연속 학습</small></div>
              <div><span><CheckCircle2 size={17} /></span><strong>{metrics.accuracy === null ? '—' : `${metrics.accuracy}%`}</strong><small>퀴즈 정답률</small></div>
              <div><span><Brain size={17} /></span><strong>{metrics.learnedCardCount}</strong><small>학습한 카드</small></div>
            </div>
          </section>

          <div className="report-grid">
            <section className="panel activity-panel">
              <div className="panel-heading"><div><span className="section-kicker">LAST 7 DAYS</span><h3>주간 학습 활동</h3></div><span className="time-estimate">실제 기록</span></div>
              <div className="activity-chart">
                {metrics.weeklyActivity.map((day) => (
                  <div key={day.dateKey} className={day.isToday ? 'today' : ''}>
                    <span className="bar-value">{day.value}</span>
                    <div className="bar-track"><i style={{ height: `${(day.value / maxActivity) * 100}%` }} /></div>
                    <strong>{day.label}</strong>
                  </div>
                ))}
              </div>
              <div className="chart-summary">
                <div><strong>{totalWeeklyActivity}</strong><span>총 활동</span></div>
                <div><strong>{Math.round(totalWeeklyActivity / 7)}</strong><span>일평균</span></div>
                <div><strong>{data.reviewLogs.length + data.quizLogs.length}</strong><span>누적 활동</span></div>
              </div>
            </section>

            <section className="panel forecast-panel">
              <div className="panel-heading"><div><span className="section-kicker">REVIEW FORECAST</span><h3>다음 7일 복습량</h3></div><CalendarDays size={19} /></div>
              <div className="forecast-list">
                {metrics.forecast.map((day) => (
                  <div key={day.dateKey}><span>{day.label}</span><div><i style={{ width: `${(day.count / maxForecast) * 100}%` }} /></div><strong>{day.count}</strong></div>
                ))}
              </div>
              <p className="forecast-note"><Clock3 size={15} /> 예정된 복습 <strong>{totalForecast}장 · 약 {totalForecast}분</strong></p>
            </section>
          </div>

          <div className="report-grid lower-report-grid">
            <section className="panel topic-mastery-panel">
              <div className="panel-heading"><div><span className="section-kicker">TOPIC MEMORY</span><h3>과목별 기억 상태</h3></div><button className="text-button" onClick={() => onNavigate('concepts')}>개념 보기 <ArrowRight size={14} /></button></div>
              <div className="topic-mastery-table">
                <div className="table-head"><span>과목</span><span>안정도</span><span>상태</span><span>다음 행동</span></div>
                {topics.slice(0, 6).map((topic) => {
                  const mastery = metrics.topicMastery[topic.id]
                  const status = mastery === null ? '미시작' : mastery >= 70 ? '안정' : mastery >= 50 ? '강화 중' : '복습 필요'
                  const statusClass = mastery === null ? 'unstarted' : mastery >= 70 ? 'stable' : mastery >= 50 ? 'growing' : 'weak'
                  return (
                    <div className="table-row" key={topic.id}>
                      <span className="table-topic"><i className={`topic-mini-icon ${topic.tone}`}><TopicIcon topic={topic} size={16} /></i><strong>{topic.name}</strong></span>
                      <span className="table-progress"><i><b style={{ width: `${mastery ?? 0}%` }} /></i><em>{mastery === null ? '—' : `${mastery}%`}</em></span>
                      <span className={`status ${statusClass}`}>{status}</span>
                      <button onClick={() => onNavigate(mastery === null || mastery < 60 ? 'flashcards' : 'concepts')}>{mastery === null ? '시작' : mastery < 60 ? '복습' : '확인'} <ArrowRight size={13} /></button>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="panel misconception-panel">
              <div className="panel-heading"><div><span className="section-kicker">MISCONCEPTION RADAR</span><h3>최근 놓친 연결</h3></div><AlertTriangle size={19} /></div>
              {recentMistakes.length ? (
                <>
                  <div className="mistake-list">
                    {recentMistakes.map((question, index) => (
                      <article key={question.id}>
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <div><strong>{question.takeaway}</strong><p>{topics.find((topic) => topic.id === question.topicId)?.name} · {question.eyebrow}</p></div>
                      </article>
                    ))}
                  </div>
                  <button className="full-soft-button" onClick={() => onNavigate('quiz')}><RotateCcw size={16} /> 오답 맥락으로 다시 풀기 <ArrowRight size={15} /></button>
                </>
              ) : (
                <div className="report-inline-empty"><CheckCircle2 size={24} /><strong>아직 오답 기록이 없어요.</strong><p>퀴즈에서 놓친 연결이 생기면 여기에 정확히 표시됩니다.</p><button onClick={() => onNavigate('quiz')}>퀴즈 풀기 <ArrowRight size={14} /></button></div>
              )}
            </section>
          </div>

          <section className="learning-insight-strip">
            <span><Lightbulb size={20} /></span>
            <div><em>PHARMORY INSIGHT</em><strong>{metrics.dueReviewCount ? `지금 복습 시각이 된 카드가 ${metrics.dueReviewCount}장 있어요.` : '현재 만기된 복습 카드가 없어요.'}</strong><p>{metrics.newCardCount ? `새 카드 ${metrics.newCardCount}장 중 오늘은 최대 5장을 가볍게 시작할 수 있습니다.` : '새 카드 학습을 모두 시작했습니다.'}</p></div>
            <button onClick={() => onNavigate(metrics.dueReviewCount || metrics.newCardCount ? 'flashcards' : 'concepts')}>{metrics.dueReviewCount || metrics.newCardCount ? '추천 학습 시작' : '개념 둘러보기'} <ArrowRight size={15} /></button>
            <Sparkles className="insight-spark" size={34} />
          </section>
        </>
      )}
    </div>
  )
}
