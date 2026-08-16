import { useCallback, useEffect, useState } from 'react'
import type { UserStudyData } from './types'

const STORAGE_KEY = 'pharmory-study-data-v1'

const initialData: UserStudyData = {
  reviewStates: {},
  reviewLogs: [],
  quizLogs: [],
  generatedCards: [],
  savedPapers: [],
  streak: 6,
  totalMinutes: 184,
}

export function useLocalStudyData() {
  const [data, setData] = useState<UserStudyData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? { ...initialData, ...JSON.parse(saved) } : initialData
    } catch {
      return initialData
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const update = useCallback((updater: (current: UserStudyData) => UserStudyData) => {
    setData((current) => updater(current))
  }, [])

  const reset = useCallback(() => setData(initialData), [])

  return { data, update, reset }
}
