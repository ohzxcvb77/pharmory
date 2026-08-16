import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  Calculator,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  FileQuestion,
  RotateCcw,
  Sparkles,
  Stethoscope,
  X,
  Zap,
} from 'lucide-react'
import { quizQuestions, topics } from '../data'
import type { QuizQuestion } from '../types'
import { SourceLink, TopicIcon } from '../ui'

type QuizMode = 'mixed' | QuizQuestion['mode']
type Confidence = 'low' | 'medium' | 'high'

const modeMeta = [
  { id: 'mixed' as const, label: '혼합 퀴즈', description: '기전 + 사례 + 계산', icon: Sparkles },
  { id: 'clinical' as const, label: '임상 사례', description: '환자 상황에 적용', icon: Stethoscope },
  { id: 'core' as const, label: '핵심 개념', description: '작용기전 빠른 회상', icon: BrainCircuit },
  { id: 'calculation' as const, label: '계산 문제', description: 'PK · TDM 수치 적용', icon: Calculator },
]

export function QuizLab({
  onAnswer,
  onGoFlashcards,
}: {
  onAnswer: (question: QuizQuestion, correct: boolean, confidence: Confidence) => void
  onGoFlashcards: () => void
}) {
  const [mode, setMode] = useState<QuizMode>('mixed')
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [confidence, setConfidence] = useState<Confidence>('medium')
  const [results, setResults] = useState<{ id: string; correct: boolean; confidence: Confidence }[]>([])

  const questions = useMemo(
    () => mode === 'mixed' ? quizQuestions : quizQuestions.filter((question) => question.mode === mode),
    [mode],
  )
  const current = questions[index]
  const topic = current ? topics.find((item) => item.id === current.topicId) : undefined
  const answered = selected !== null
  const finished = questions.length > 0 && index >= questions.length
  const score = results.filter((result) => result.correct).length
  const overconfidentErrors = results.filter((result) => !result.correct && result.confidence === 'high').length

  useEffect(() => {
    setIndex(0)
    setSelected(null)
    setResults([])
  }, [mode])

  const chooseAnswer = (answerIndex: number) => {
    if (!current || answered) return
    const correct = answerIndex === current.correctIndex
    setSelected(answerIndex)
    setResults((list) => [...list, { id: current.id, correct, confidence }])
    onAnswer(current, correct, confidence)
  }

  const next = () => {
    setIndex((value) => value + 1)
    setSelected(null)
    setConfidence('medium')
  }

  const restart = () => {
    setIndex(0)
    setSelected(null)
    setConfidence('medium')
    setResults([])
  }

  return (
    <div className="page quiz-page">
      <div className="page-heading-row compact-heading">
        <div>
          <span className="section-kicker">RETRIEVAL PRACTICE</span>
          <h1>아는 것과 <span>떠올리는 것</span>의 차이.</h1>
          <p>정답뿐 아니라 확신도를 함께 기록해 위험한 오개념을 찾아냅니다.</p>
        </div>
        <div className="quiz-summary-pill"><Zap size={17} /><span><strong>현재 세션</strong><small>{questions.length}문항 · 약 {questions.length}분</small></span></div>
      </div>

      <div className="quiz-mode-grid">
        {modeMeta.map((item) => {
          const Icon = item.icon
          return (
            <button key={item.id} className={mode === item.id ? 'active' : ''} onClick={() => setMode(item.id)}>
              <span><Icon size={18} /></span><div><strong>{item.label}</strong><small>{item.description}</small></div>{mode === item.id && <CheckCircle2 size={17} />}
            </button>
          )
        })}
      </div>

      {finished ? (
        <section className="quiz-complete panel">
          <div className="quiz-score-ring" style={{ '--score': `${Math.round((score / questions.length) * 100)}%` } as React.CSSProperties}><span><strong>{score}</strong><small>/ {questions.length}</small></span></div>
          <span className="section-kicker">QUIZ COMPLETE</span>
          <h2>{score >= questions.length * 0.8 ? '탄탄하게 기억하고 있어요.' : '좋은 오답이 쌓였어요.'}</h2>
          <p>정답률 {Math.round((score / questions.length) * 100)}% · 고확신 오답 {overconfidentErrors}개</p>
          <div className="result-insight"><AlertCircle size={18} /><span><strong>다음 학습 제안</strong>{overconfidentErrors ? '확신하고 틀린 개념을 플래시카드로 먼저 복구하세요.' : '틀린 개념을 짧게 복습한 뒤 다른 맥락에서 다시 풀어보세요.'}</span></div>
          <div className="completion-actions"><button className="soft-button" onClick={restart}><RotateCcw size={16} /> 다시 풀기</button><button className="primary-button" onClick={onGoFlashcards}>취약 카드 복습 <ArrowRight size={16} /></button></div>
        </section>
      ) : current && topic ? (
        <div className="quiz-stage">
          <main className="quiz-main panel">
            <div className="quiz-progress-head">
              <div><span>QUESTION</span><strong>{String(index + 1).padStart(2, '0')}</strong><em>/ {String(questions.length).padStart(2, '0')}</em></div>
              <div className="quiz-progress-line"><i style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }} /></div>
              <span><Clock3 size={14} /> 약 {Math.max(1, questions.length - index)}분</span>
            </div>

            <div className="question-meta"><span className={`topic-mini-icon ${topic.tone}`}><TopicIcon topic={topic} size={16} /></span><span>{topic.name}</span><em>{current.eyebrow}</em></div>
            <h2>{current.question}</h2>

            <div className="confidence-selector">
              <span>답하기 전 확신도</span>
              {(['low', 'medium', 'high'] as const).map((value) => (
                <button key={value} disabled={answered} className={confidence === value ? 'active' : ''} onClick={() => setConfidence(value)}>
                  {value === 'low' ? '낮음' : value === 'medium' ? '보통' : '높음'}
                </button>
              ))}
            </div>

            <div className="answer-list">
              {current.options.map((option, optionIndex) => {
                const isCorrect = optionIndex === current.correctIndex
                const isSelected = selected === optionIndex
                const stateClass = !answered ? '' : isCorrect ? 'correct' : isSelected ? 'wrong' : 'muted'
                return (
                  <button key={option} className={stateClass} disabled={answered} onClick={() => chooseAnswer(optionIndex)}>
                    <span className="answer-letter">{String.fromCharCode(65 + optionIndex)}</span>
                    <span>{option}</span>
                    {answered && isCorrect && <Check size={18} />}
                    {answered && isSelected && !isCorrect && <X size={18} />}
                  </button>
                )
              })}
            </div>

            {answered && (
              <div className={selected === current.correctIndex ? 'answer-feedback correct' : 'answer-feedback wrong'}>
                <div className="feedback-title">{selected === current.correctIndex ? <CheckCircle2 size={19} /> : <AlertCircle size={19} />}<strong>{selected === current.correctIndex ? '정확해요' : '여기서 연결이 끊겼어요'}</strong></div>
                <p>{current.explanation}</p>
                <div><Sparkles size={15} /><span><strong>한 줄 고정</strong>{current.takeaway}</span></div>
                <SourceLink {...current.source} compact />
              </div>
            )}

            <div className="quiz-actions">
              <button disabled={index === 0 || answered} onClick={() => setIndex((value) => Math.max(0, value - 1))}><ChevronLeft size={16} /> 이전</button>
              {answered ? <button className="primary-button" onClick={next}>{index === questions.length - 1 ? '결과 보기' : '다음 문제'} <ArrowRight size={16} /></button> : <span>답을 선택하면 해설이 열립니다.</span>}
            </div>
          </main>

          <aside className="quiz-sidebar">
            <section className="panel question-map">
              <div><FileQuestion size={18} /><span><strong>문항 지도</strong><small>{modeMeta.find((item) => item.id === mode)?.label}</small></span></div>
              <div className="question-dots">
                {questions.map((question, questionIndex) => {
                  const result = results.find((item) => item.id === question.id)
                  return <button key={question.id} disabled={questionIndex > index} className={questionIndex === index ? 'current' : result?.correct ? 'correct' : result ? 'wrong' : ''}>{questionIndex + 1}</button>
                })}
              </div>
              <dl><div><dt><span className="legend-dot correct" /> 정답</dt><dd>{score}</dd></div><div><dt><span className="legend-dot wrong" /> 오답</dt><dd>{results.length - score}</dd></div><div><dt><span className="legend-dot pending" /> 남음</dt><dd>{questions.length - results.length}</dd></div></dl>
            </section>
            <section className="quiz-tip">
              <span><BrainCircuit size={18} /></span>
              <div><strong>확신도까지 왜 기록하나요?</strong><p>높은 확신의 오답은 단순 망각보다 강한 오개념 신호입니다.</p></div>
            </section>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
