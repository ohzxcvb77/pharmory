import {
  BarChart3,
  BookOpenText,
  BrainCircuit,
  FileSearch,
  Home,
  Layers3,
  LogOut,
  Sparkles,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AuthProfile } from '../auth'
import type { PageId } from '../types'
import { BrandMark } from '../ui'

const navItems: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: '오늘의 학습', icon: Home },
  { id: 'concepts', label: '개념 라이브러리', icon: BookOpenText },
  { id: 'flashcards', label: '플래시카드', icon: Layers3 },
  { id: 'quiz', label: '퀴즈 랩', icon: BrainCircuit },
  { id: 'evidence', label: '논문 탐색', icon: FileSearch },
  { id: 'progress', label: '학습 리포트', icon: BarChart3 },
]

interface SidebarProps {
  page: PageId
  mobileOpen: boolean
  profile: AuthProfile
  streak: number
  dueCount: number
  onNavigate: (page: PageId) => void
  onClose: () => void
  onLogout: () => void
}

export function Sidebar({ page, mobileOpen, profile, streak, dueCount, onNavigate, onClose, onLogout }: SidebarProps) {
  return (
    <>
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-head">
          <BrandMark />
          <button className="icon-button sidebar-close" onClick={onClose} aria-label="메뉴 닫기">
            <X size={19} />
          </button>
        </div>

        <nav className="main-nav" aria-label="주 메뉴">
          <p className="nav-label">STUDY SPACE</p>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={page === item.id ? 'nav-item active' : 'nav-item'}
                onClick={() => {
                  onNavigate(item.id)
                  onClose()
                }}
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.label}</span>
                {item.id === 'flashcards' && dueCount > 0 && <em>{dueCount}</em>}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-insight">
          <span className="insight-icon"><Sparkles size={16} /></span>
          <p>오늘의 기억 팁</p>
          <strong>답을 보기 전, 5초만 더 회상해 보세요.</strong>
        </div>

        <div className="sidebar-footer">
          <div className="avatar">{profile.displayName.slice(0, 1)}</div>
          <div>
            <strong>{profile.displayName}</strong>
            <span>{streak ? `${streak}일 연속 학습 중` : '첫 학습을 시작해 보세요'}</span>
          </div>
          <button className="icon-button sidebar-logout" aria-label="로그아웃" title="로그아웃" onClick={onLogout}><LogOut size={17} /></button>
        </div>
      </aside>
      {mobileOpen && <button className="sidebar-backdrop" aria-label="메뉴 닫기" onClick={onClose} />}
    </>
  )
}
