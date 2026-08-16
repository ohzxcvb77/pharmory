import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Flashcard, LiteraturePaper, QuizLog, ReviewLog, ReviewState, TopicId, UserStudyData } from './types'

const storageKey = (profileId: string) => `pharmory-study-data-v2:${profileId}`
const topicIds = new Set<TopicId>(['pkpd', 'cardio', 'infectious', 'endocrine', 'cns', 'gi', 'oncology', 'safety'])

export const createEmptyStudyData = (): UserStudyData => ({
  reviewStates: {},
  reviewLogs: [],
  quizLogs: [],
  generatedCards: [],
  savedPapers: [],
})

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object'
const isTopicId = (value: unknown): value is TopicId => typeof value === 'string' && topicIds.has(value as TopicId)

const isReviewState = (value: unknown): value is ReviewState => {
  if (!isObject(value)) return false
  return (
    typeof value.dueAt === 'string' &&
    typeof value.intervalDays === 'number' &&
    typeof value.ease === 'number' &&
    typeof value.repetitions === 'number' &&
    [0, 1, 2, 3].includes(value.lastGrade as number)
  )
}

const isReviewLog = (value: unknown): value is ReviewLog => {
  if (!isObject(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.cardId === 'string' &&
    isTopicId(value.topicId) &&
    [0, 1, 2, 3].includes(value.grade as number) &&
    typeof value.reviewedAt === 'string'
  )
}

const isQuizLog = (value: unknown): value is QuizLog => {
  if (!isObject(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.questionId === 'string' &&
    isTopicId(value.topicId) &&
    typeof value.correct === 'boolean' &&
    typeof value.answeredAt === 'string'
  )
}

const isFlashcard = (value: unknown): value is Flashcard => {
  if (!isObject(value) || !isObject(value.source)) return false
  return (
    typeof value.id === 'string' &&
    isTopicId(value.topicId) &&
    typeof value.front === 'string' &&
    typeof value.back === 'string' &&
    typeof value.pearl === 'string' &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === 'string') &&
    [1, 2, 3].includes(value.difficulty as number) &&
    typeof value.source.title === 'string' &&
    typeof value.source.journal === 'string' &&
    typeof value.source.url === 'string'
  )
}

const isLiteraturePaper = (value: unknown): value is LiteraturePaper => {
  if (!isObject(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.source === 'string' &&
    typeof value.title === 'string' &&
    typeof value.authors === 'string' &&
    typeof value.journal === 'string' &&
    typeof value.year === 'string' &&
    typeof value.abstract === 'string'
  )
}

function sanitizeStudyData(value: unknown): UserStudyData {
  if (!isObject(value)) throw new Error('invalid study data')
  const reviewStates: Record<string, ReviewState> = {}
  if (isObject(value.reviewStates)) {
    Object.entries(value.reviewStates).forEach(([cardId, state]) => {
      if (isReviewState(state)) reviewStates[cardId] = state
    })
  }
  return {
    reviewStates,
    reviewLogs: Array.isArray(value.reviewLogs) ? value.reviewLogs.filter(isReviewLog) : [],
    quizLogs: Array.isArray(value.quizLogs) ? value.quizLogs.filter(isQuizLog) : [],
    generatedCards: Array.isArray(value.generatedCards) ? value.generatedCards.filter(isFlashcard) : [],
    savedPapers: Array.isArray(value.savedPapers) ? value.savedPapers.filter(isLiteraturePaper) : [],
  }
}

function readStudyData(profileId: string): { data: UserStudyData; error: string } {
  try {
    const saved = localStorage.getItem(storageKey(profileId))
    return { data: saved ? sanitizeStudyData(JSON.parse(saved)) : createEmptyStudyData(), error: '' }
  } catch {
    return {
      data: createEmptyStudyData(),
      error: '저장된 학습 기록을 읽지 못해 빈 상태로 열었어요. 기록을 덮어쓰기 전에 브라우저 저장 공간을 확인해 주세요.',
    }
  }
}

export function useLocalStudyData(profileId: string) {
  const initial = useMemo(() => readStudyData(profileId), [profileId])
  const [data, setData] = useState<UserStudyData>(initial.data)
  const [storageError, setStorageError] = useState(initial.error)

  useEffect(() => {
    if (storageError && data.reviewLogs.length + data.quizLogs.length === 0) return
    try {
      localStorage.setItem(storageKey(profileId), JSON.stringify(data))
      setStorageError('')
    } catch {
      setStorageError('학습 기록을 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.')
    }
  }, [data, profileId, storageError])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey(profileId) || !event.newValue) return
      try {
        setData(sanitizeStudyData(JSON.parse(event.newValue)))
        setStorageError('')
      } catch {
        setStorageError('다른 탭에서 변경된 학습 기록을 읽지 못했어요.')
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [profileId])

  const update = useCallback((updater: (current: UserStudyData) => UserStudyData) => {
    setData((current) => updater(current))
  }, [])

  const reset = useCallback(() => setData(createEmptyStudyData()), [])

  return { data, update, reset, storageError }
}
