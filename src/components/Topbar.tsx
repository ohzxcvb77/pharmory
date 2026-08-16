import { Bell, Command, Menu, Search } from 'lucide-react'
import type { PageId } from '../types'

const pageTitles: Record<PageId, { eyebrow: string; title: string }> = {
  dashboard: { eyebrow: 'LEARNING DASHBOARD', title: '오늘의 학습' },
  concepts: { eyebrow: 'KNOWLEDGE MAP', title: '개념 라이브러리' },
  flashcards: { eyebrow: 'ACTIVE RECALL', title: '플래시카드' },
  quiz: { eyebrow: 'RETRIEVAL PRACTICE', title: '퀴즈 랩' },
  evidence: { eyebrow: 'LIVE EVIDENCE', title: '논문 탐색' },
  progress: { eyebrow: 'MEMORY ANALYTICS', title: '학습 리포트' },
}

export function Topbar({
  page,
  onMenu,
  onSearch,
  onNotify,
}: {
  page: PageId
  onMenu: () => void
  onSearch: () => void
  onNotify: () => void
}) {
  const meta = pageTitles[page]
  return (
    <header className="topbar">
      <button className="icon-button mobile-menu" onClick={onMenu} aria-label="메뉴 열기">
        <Menu size={21} />
      </button>
      <div className="page-identity">
        <span>{meta.eyebrow}</span>
        <strong>{meta.title}</strong>
      </div>
      <div className="topbar-actions">
        <button className="global-search" onClick={onSearch}>
          <Search size={18} />
          <span>개념, 약물, 논문 검색</span>
          <kbd><Command size={12} /> K</kbd>
        </button>
        <button className="icon-button notification-button" onClick={onNotify} aria-label="알림">
          <Bell size={19} />
          <span />
        </button>
      </div>
    </header>
  )
}
