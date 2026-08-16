export type PageId =
  | 'dashboard'
  | 'concepts'
  | 'flashcards'
  | 'quiz'
  | 'evidence'
  | 'progress'

export type TopicId =
  | 'pkpd'
  | 'cardio'
  | 'infectious'
  | 'endocrine'
  | 'cns'
  | 'gi'
  | 'oncology'
  | 'safety'

export interface EvidenceSource {
  title: string
  journal: string
  year: number
  url: string
  pmid?: string
  doi?: string
}

export interface Topic {
  id: TopicId
  name: string
  englishName: string
  description: string
  icon: string
  tone: 'sage' | 'blue' | 'amber' | 'plum' | 'coral' | 'teal'
  concepts: string[]
  highYield: string
}

export interface Flashcard {
  id: string
  topicId: TopicId
  front: string
  back: string
  pearl: string
  tags: string[]
  difficulty: 1 | 2 | 3
  source: EvidenceSource
  generated?: boolean
}

export interface QuizQuestion {
  id: string
  topicId: TopicId
  mode: 'core' | 'clinical' | 'calculation'
  eyebrow: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  takeaway: string
  source: EvidenceSource
}

export interface ReviewState {
  dueAt: string
  intervalDays: number
  ease: number
  repetitions: number
  lastGrade: 0 | 1 | 2 | 3
}

export interface ReviewLog {
  id: string
  cardId: string
  topicId: TopicId
  grade: 0 | 1 | 2 | 3
  reviewedAt: string
}

export interface QuizLog {
  id: string
  questionId: string
  topicId: TopicId
  correct: boolean
  confidence?: 'low' | 'medium' | 'high'
  answeredAt: string
}

export interface LiteraturePaper {
  id: string
  source: string
  pmid?: string
  pmcid?: string
  doi?: string
  title: string
  authors: string
  journal: string
  year: string
  citedByCount: number
  isOpenAccess: boolean
  abstract: string
}

export interface UserStudyData {
  reviewStates: Record<string, ReviewState>
  reviewLogs: ReviewLog[]
  quizLogs: QuizLog[]
  generatedCards: Flashcard[]
  savedPapers: LiteraturePaper[]
}
