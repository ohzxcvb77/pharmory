import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, BookOpenText, Check, FileSearch, Layers3, Search, X } from 'lucide-react'
import './App.css'
import { ConceptLibrary } from './components/ConceptLibrary'
import { Dashboard } from './components/Dashboard'
import { EvidenceLibrary } from './components/EvidenceLibrary'
import { FlashcardStudy } from './components/FlashcardStudy'
import { ProgressReport } from './components/ProgressReport'
import { QuizLab } from './components/QuizLab'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { flashcards, topics } from './data'
import { paperUrl } from './literature'
import { scheduleReview } from './srs'
import type { Flashcard, LiteraturePaper, PageId, QuizQuestion, TopicId } from './types'
import { useLocalStudyData } from './useLocalStudyData'
import { TopicIcon } from './ui'

function inferTopic(text: string): TopicId {
  const value = text.toLowerCase()
  if (/sglt|glp-1|insulin|diabet|metformin|thyroid/.test(value)) return 'endocrine'
  if (/antibiotic|vancomycin|microbial|infection|bacter|aminoglycoside/.test(value)) return 'infectious'
  if (/heart|cardio|hypertension|warfarin|anticoag|ace inhibitor/.test(value)) return 'cardio'
  if (/brain|neuro|depress|seizure|dopamine|serotonin/.test(value)) return 'cns'
  if (/cancer|tumou?r|oncology|chemotherapy/.test(value)) return 'oncology'
  if (/gastric|proton pump|gastro|intestinal/.test(value)) return 'gi'
  if (/interaction|cyp|safety|adverse|toxicity/.test(value)) return 'safety'
  return 'pkpd'
}

function makePaperCard(paper: LiteraturePaper): Flashcard {
  const cleanAbstract = paper.abstract.replace(/^(BACKGROUND|OBJECTIVE|METHODS?|RESULTS?|CONCLUSIONS?):?\s*/i, '')
  const sentences = cleanAbstract.match(/[^.!?]+[.!?]+/g) ?? [cleanAbstract]
  const answer = sentences.slice(-2).join(' ').trim().slice(0, 520)
  return {
    id: `paper-${paper.source}-${paper.id}`,
    topicId: inferTopic(`${paper.title} ${paper.abstract}`),
    front: `이 논문의 초록이 제시하는 핵심 결론은 무엇인가요?\n\n“${paper.title}”`,
    back: answer || paper.title,
    pearl: '초록에서 생성된 초안 카드입니다. 연구 설계·대상·효과크기를 원문과 함께 확인하세요.',
    tags: ['paper-generated', paper.id, paper.pmid ?? ''],
    difficulty: 3,
    generated: true,
    source: {
      title: paper.title,
      journal: paper.journal,
      year: Number(paper.year) || new Date().getFullYear(),
      url: paperUrl(paper),
      pmid: paper.pmid,
      doi: paper.doi,
    },
  }
}

function SearchPalette({
  open,
  onClose,
  cards,
  onSelectTopic,
  onSelectCard,
  onEvidence,
}: {
  open: boolean
  onClose: () => void
  cards: Flashcard[]
  onSelectTopic: (topic: TopicId) => void
  onSelectCard: (topic: TopicId) => void
  onEvidence: () => void
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      window.setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [open])

  if (!open) return null
  const normalized = query.trim().toLowerCase()
  const topicResults = topics.filter((topic) => [topic.name, topic.englishName, ...topic.concepts].join(' ').toLowerCase().includes(normalized)).slice(0, 4)
  const cardResults = normalized ? cards.filter((card) => `${card.front} ${card.back} ${card.tags.join(' ')}`.toLowerCase().includes(normalized)).slice(0, 4) : []

  return (
    <div className="command-overlay" role="presentation" onMouseDown={onClose}>
      <section className="command-palette" role="dialog" aria-modal="true" aria-label="전체 검색" onMouseDown={(event) => event.stopPropagation()}>
        <div className="command-search"><Search size={20} /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="예: warfarin, 반감기, SGLT2" /><button onClick={onClose}><X size={18} /></button></div>
        <div className="command-results">
          <span className="command-label">{normalized ? '검색 결과' : '빠른 이동'}</span>
          {!normalized && (
            <>
              <button onClick={() => onSelectTopic('pkpd')}><span className="command-icon"><BookOpenText size={18} /></span><div><strong>약동학 · 약력학</strong><small>개념 라이브러리에서 시작</small></div><ArrowRight size={15} /></button>
              <button onClick={() => onSelectCard('infectious')}><span className="command-icon"><Layers3 size={18} /></span><div><strong>감염 약물치료 복습</strong><small>만기 플래시카드 열기</small></div><ArrowRight size={15} /></button>
              <button onClick={onEvidence}><span className="command-icon"><FileSearch size={18} /></span><div><strong>영문 논문 탐색</strong><small>Europe PMC 실시간 검색</small></div><ArrowRight size={15} /></button>
            </>
          )}
          {normalized && topicResults.map((topic) => <button key={topic.id} onClick={() => onSelectTopic(topic.id)}><span className={`topic-mini-icon ${topic.tone}`}><TopicIcon topic={topic} size={17} /></span><div><strong>{topic.name}</strong><small>{topic.englishName}</small></div><ArrowRight size={15} /></button>)}
          {normalized && cardResults.map((card) => <button key={card.id} onClick={() => onSelectCard(card.topicId)}><span className="command-icon"><Layers3 size={17} /></span><div><strong>{card.front}</strong><small>{card.tags.filter(Boolean).join(' · ')}</small></div><ArrowRight size={15} /></button>)}
          {normalized && topicResults.length === 0 && cardResults.length === 0 && <div className="command-empty"><Search size={21} /><p>일치하는 학습 항목이 없습니다.</p><button onClick={onEvidence}>논문 탐색에서 검색하기</button></div>}
        </div>
        <footer><span>↑↓ 이동</span><span>Enter 선택</span><span>Esc 닫기</span></footer>
      </section>
    </div>
  )
}

function App() {
  const [page, setPage] = useState<PageId>('dashboard')
  const [mobileNav, setMobileNav] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeTopic, setActiveTopic] = useState<TopicId>('pkpd')
  const [flashTopic, setFlashTopic] = useState<TopicId | 'all'>('all')
  const [toast, setToast] = useState('')
  const { data, update } = useLocalStudyData()

  const allCards = useMemo(() => [...flashcards, ...data.generatedCards], [data.generatedCards])
  const generatedPaperIds = useMemo(() => data.generatedCards.flatMap((card) => card.tags), [data.generatedCards])

  const navigate = (nextPage: PageId) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const studyTopic = (topicId: TopicId) => {
    setFlashTopic(topicId)
    navigate('flashcards')
  }

  const handleReview = (card: Flashcard, grade: 0 | 1 | 2 | 3) => {
    update((current) => ({
      ...current,
      reviewStates: { ...current.reviewStates, [card.id]: scheduleReview(current.reviewStates[card.id], grade) },
      reviewLogs: [...current.reviewLogs.slice(-499), { id: crypto.randomUUID(), cardId: card.id, topicId: card.topicId, grade, reviewedAt: new Date().toISOString() }],
      totalMinutes: current.totalMinutes + 1,
    }))
    setToast(grade >= 2 ? '기억 간격을 늘렸어요.' : '이 카드를 오늘 다시 보여드릴게요.')
  }

  const handleQuizAnswer = (question: QuizQuestion, correct: boolean, confidence: 'low' | 'medium' | 'high') => {
    update((current) => ({
      ...current,
      quizLogs: [...current.quizLogs.slice(-499), { id: crypto.randomUUID(), questionId: question.id, topicId: question.topicId, correct, confidence, answeredAt: new Date().toISOString() }],
      totalMinutes: current.totalMinutes + 1,
    }))
  }

  const toggleSavePaper = (paper: LiteraturePaper) => {
    const isSaved = data.savedPapers.some((item) => item.id === paper.id)
    update((current) => ({ ...current, savedPapers: isSaved ? current.savedPapers.filter((item) => item.id !== paper.id) : [paper, ...current.savedPapers] }))
    setToast(isSaved ? '저장 목록에서 제거했어요.' : '근거 라이브러리에 저장했어요.')
  }

  const generatePaperCard = (paper: LiteraturePaper) => {
    const card = makePaperCard(paper)
    if (data.generatedCards.some((item) => item.id === card.id)) return
    update((current) => ({
      ...current,
      generatedCards: [card, ...current.generatedCards],
      savedPapers: current.savedPapers.some((item) => item.id === paper.id) ? current.savedPapers : [paper, ...current.savedPapers],
    }))
    setFlashTopic(card.topicId)
    setToast('초록에서 플래시카드 초안을 만들었어요.')
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard data={data} onNavigate={navigate} />
      case 'concepts': return <ConceptLibrary activeTopicId={activeTopic} onSelectTopic={setActiveTopic} onStudy={studyTopic} />
      case 'flashcards': return <FlashcardStudy cards={allCards} reviewStates={data.reviewStates} activeTopicId={flashTopic} onChangeTopic={setFlashTopic} onReview={handleReview} onGoQuiz={() => navigate('quiz')} />
      case 'quiz': return <QuizLab onAnswer={handleQuizAnswer} onGoFlashcards={() => navigate('flashcards')} />
      case 'evidence': return <EvidenceLibrary savedPapers={data.savedPapers} generatedPaperIds={generatedPaperIds} onToggleSave={toggleSavePaper} onGenerateCard={generatePaperCard} />
      case 'progress': return <ProgressReport data={data} onNavigate={navigate} />
    }
  }

  return (
    <div className="app-shell">
      <Sidebar page={page} mobileOpen={mobileNav} onNavigate={navigate} onClose={() => setMobileNav(false)} />
      <div className="app-main">
        <Topbar page={page} onMenu={() => setMobileNav(true)} onSearch={() => setSearchOpen(true)} onNotify={() => setToast('오늘 복습 카드 12장이 준비되어 있어요.')} />
        {renderPage()}
      </div>
      <SearchPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        cards={allCards}
        onSelectTopic={(topicId) => { setActiveTopic(topicId); setSearchOpen(false); navigate('concepts') }}
        onSelectCard={(topicId) => { setFlashTopic(topicId); setSearchOpen(false); navigate('flashcards') }}
        onEvidence={() => { setSearchOpen(false); navigate('evidence') }}
      />
      {toast && <div className="toast"><span className="toast-check"><Check size={14} /></span><span>{toast}</span></div>}
    </div>
  )
}

export default App
