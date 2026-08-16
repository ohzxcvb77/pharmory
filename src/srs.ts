import type { ReviewState } from './types'

export const DEFAULT_REVIEW_STATE: ReviewState = {
  dueAt: new Date(0).toISOString(),
  intervalDays: 0,
  ease: 2.5,
  repetitions: 0,
  lastGrade: 0,
}

const addTime = (amount: number, unit: 'minutes' | 'days') => {
  const date = new Date()
  const multiplier = unit === 'minutes' ? 60_000 : 86_400_000
  date.setTime(date.getTime() + amount * multiplier)
  return date.toISOString()
}

export function scheduleReview(
  current: ReviewState | undefined,
  grade: 0 | 1 | 2 | 3,
): ReviewState {
  const state = current ?? DEFAULT_REVIEW_STATE
  const easeDelta = [-0.2, -0.05, 0, 0.1][grade]
  const ease = Math.min(3.2, Math.max(1.3, state.ease + easeDelta))

  if (grade === 0) {
    return {
      dueAt: addTime(10, 'minutes'),
      intervalDays: 0,
      ease,
      repetitions: 0,
      lastGrade: grade,
    }
  }

  let intervalDays: number
  if (grade === 1) {
    intervalDays = Math.max(1, Math.round((state.intervalDays || 1) * 1.2))
  } else if (state.repetitions === 0) {
    intervalDays = grade === 3 ? 7 : 3
  } else if (state.repetitions === 1) {
    intervalDays = grade === 3 ? 14 : 6
  } else {
    intervalDays = Math.max(
      state.intervalDays + 1,
      Math.round(state.intervalDays * ease * (grade === 3 ? 1.3 : 1)),
    )
  }

  return {
    dueAt: addTime(intervalDays, 'days'),
    intervalDays,
    ease,
    repetitions: state.repetitions + 1,
    lastGrade: grade,
  }
}

export const formatNextReview = (state: ReviewState | undefined) => {
  if (!state || state.intervalDays === 0) return '10분 뒤'
  if (state.intervalDays === 1) return '내일'
  return `${state.intervalDays}일 뒤`
}
