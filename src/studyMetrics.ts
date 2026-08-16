import { topics } from './data'
import type { Flashcard, TopicId, UserStudyData } from './types'

export interface ActivityDay {
  dateKey: string
  label: string
  value: number
  isToday: boolean
}

export interface ForecastDay {
  dateKey: string
  label: string
  count: number
}

export interface StudyMetrics {
  hasStarted: boolean
  reviewedToday: number
  reviewedUniqueToday: number
  answeredToday: number
  dueReviewCount: number
  newCardCount: number
  todayNewCardCount: number
  accuracy: number | null
  stableCardRate: number | null
  learnedCardCount: number
  streak: number
  weeklyActivityCount: number
  weeklyActivity: ActivityDay[]
  forecast: ForecastDay[]
  topicMastery: Record<TopicId, number | null>
  lastTopicId: TopicId | null
}

const pad = (value: number) => String(value).padStart(2, '0')

export const localDateKey = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const startOfDay = (date: Date) => {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

const addDays = (date: Date, amount: number) => {
  const value = new Date(date)
  value.setDate(value.getDate() + amount)
  return value
}

const calculateStreak = (data: UserStudyData) => {
  const activityKeys = new Set([
    ...data.reviewLogs.map((log) => localDateKey(log.reviewedAt)),
    ...data.quizLogs.map((log) => localDateKey(log.answeredAt)),
  ])
  if (activityKeys.size === 0) return 0

  const today = startOfDay(new Date())
  let cursor = activityKeys.has(localDateKey(today)) ? today : addDays(today, -1)
  if (!activityKeys.has(localDateKey(cursor))) return 0

  let streak = 0
  while (activityKeys.has(localDateKey(cursor))) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

const scoreReviewState = (state: UserStudyData['reviewStates'][string]) => {
  if (state.lastGrade === 0) return 20
  if (state.lastGrade === 1) return 40
  if (state.repetitions >= 2 && state.lastGrade >= 2) return 100
  return state.lastGrade === 3 ? 80 : 65
}

export function getStudyMetrics(data: UserStudyData, cards: Flashcard[]): StudyMetrics {
  const now = new Date()
  const todayKey = localDateKey(now)
  const reviewsToday = data.reviewLogs.filter((log) => localDateKey(log.reviewedAt) === todayKey)
  const reviewedUniqueToday = new Set(reviewsToday.map((log) => log.cardId)).size
  const dueReviewCount = cards.filter((card) => {
    const state = data.reviewStates[card.id]
    return state && new Date(state.dueAt).getTime() <= now.getTime()
  }).length
  const newCardCount = cards.filter((card) => !data.reviewStates[card.id]).length
  const learnedCards = cards.filter((card) => Boolean(data.reviewStates[card.id]))
  const stableCards = learnedCards.filter((card) => {
    const state = data.reviewStates[card.id]
    return state.repetitions >= 2 && state.lastGrade >= 2 && new Date(state.dueAt).getTime() > now.getTime()
  })

  const correctAnswers = data.quizLogs.filter((log) => log.correct).length
  const accuracy = data.quizLogs.length
    ? Math.round((correctAnswers / data.quizLogs.length) * 100)
    : null

  const topicMastery = Object.fromEntries(
    topics.map(({ id: topicId }) => {
        const topicCards = cards.filter((card) => card.topicId === topicId)
        const studied = topicCards.filter((card) => data.reviewStates[card.id])
        if (studied.length === 0) return [topicId, null]
        const totalScore = studied.reduce((sum, card) => sum + scoreReviewState(data.reviewStates[card.id]), 0)
        const scoreWithCoverage = totalScore / Math.max(1, topicCards.length)
        return [topicId, Math.round(scoreWithCoverage)]
      }),
  ) as Record<TopicId, number | null>

  const firstReviewByCard = new Map<string, string>()
  data.reviewLogs.forEach((log) => {
    const dateKey = localDateKey(log.reviewedAt)
    const current = firstReviewByCard.get(log.cardId)
    if (!current || dateKey < current) firstReviewByCard.set(log.cardId, dateKey)
  })
  const newlyLearnedToday = Array.from(firstReviewByCard.values()).filter((dateKey) => dateKey === todayKey).length

  const weekdayFormatter = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' })
  const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(startOfDay(now), index - 6)
    const dateKey = localDateKey(date)
    const reviewCount = data.reviewLogs.filter((log) => localDateKey(log.reviewedAt) === dateKey).length
    const quizCount = data.quizLogs.filter((log) => localDateKey(log.answeredAt) === dateKey).length
    return { dateKey, label: weekdayFormatter.format(date), value: reviewCount + quizCount, isToday: dateKey === todayKey }
  })

  const forecast = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(startOfDay(now), index)
    const nextDate = addDays(date, 1)
    const count = learnedCards.filter((card) => {
      const dueTime = new Date(data.reviewStates[card.id].dueAt).getTime()
      if (index === 0 && dueTime < date.getTime()) return true
      return dueTime >= date.getTime() && dueTime < nextDate.getTime()
    }).length
    return {
      dateKey: localDateKey(date),
      label: index === 0 ? '오늘' : index === 1 ? '내일' : weekdayFormatter.format(date),
      count,
    }
  })

  const latestActivity = [
    ...data.reviewLogs.map((log) => ({ topicId: log.topicId, at: log.reviewedAt })),
    ...data.quizLogs.map((log) => ({ topicId: log.topicId, at: log.answeredAt })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())[0]

  return {
    hasStarted: learnedCards.length > 0 || data.quizLogs.length > 0,
    reviewedToday: reviewsToday.length,
    reviewedUniqueToday,
    answeredToday: data.quizLogs.filter((log) => localDateKey(log.answeredAt) === todayKey).length,
    dueReviewCount,
    newCardCount,
    todayNewCardCount: Math.min(Math.max(0, 5 - newlyLearnedToday), newCardCount),
    accuracy,
    stableCardRate: learnedCards.length ? Math.round((stableCards.length / learnedCards.length) * 100) : null,
    learnedCardCount: learnedCards.length,
    streak: calculateStreak(data),
    weeklyActivityCount: weeklyActivity.reduce((sum, day) => sum + day.value, 0),
    weeklyActivity,
    forecast,
    topicMastery,
    lastTopicId: latestActivity?.topicId ?? null,
  }
}
