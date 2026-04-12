import { create } from 'zustand'
import type { PrescriptionWithItems } from '@repo/shared'

interface ReviewStore {
  currentIndex: number
  currentPrescription: PrescriptionWithItems | null
  reviewedIds: string[]
  passCount: number
  failCount: number
  targetCount: number
  sessionId: string | null
  reviewerName: string
  candidateIds: string[]
  setCurrentPrescription: (p: PrescriptionWithItems | null) => void
  addReviewedId: (id: string) => void
  incrementPass: () => void
  incrementFail: () => void
  setTargetCount: (count: number) => void
  setSessionId: (id: string | null) => void
  setReviewerName: (name: string) => void
  setCandidateIds: (ids: string[]) => void
  setReviewedIds: (ids: string[]) => void
  setPassCount: (count: number) => void
  setFailCount: (count: number) => void
  setCurrentIndex: (index: number) => void
  getNextRandomId: () => string | null
  reset: () => void
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  currentIndex: 0,
  currentPrescription: null,
  reviewedIds: [],
  passCount: 0,
  failCount: 0,
  targetCount: 0,
  sessionId: null,
  reviewerName: '',
  candidateIds: [],
  setCurrentPrescription: (p) => set({ currentPrescription: p }),
  addReviewedId: (id) => set((s) => ({ reviewedIds: [...s.reviewedIds, id] })),
  incrementPass: () => set((s) => ({ passCount: s.passCount + 1, currentIndex: s.currentIndex + 1 })),
  incrementFail: () => set((s) => ({ failCount: s.failCount + 1, currentIndex: s.currentIndex + 1 })),
  setTargetCount: (count) => set({ targetCount: count }),
  setSessionId: (id) => set({ sessionId: id }),
  setReviewerName: (name) => set({ reviewerName: name }),
  setCandidateIds: (ids) => set({ candidateIds: ids }),
  setReviewedIds: (ids) => set({ reviewedIds: ids }),
  setPassCount: (count) => set({ passCount: count }),
  setFailCount: (count) => set({ failCount: count }),
  setCurrentIndex: (index) => set({ currentIndex: index }),
  getNextRandomId: () => {
    const { candidateIds, reviewedIds } = get()
    const remaining = candidateIds.filter((id) => !reviewedIds.includes(id))
    if (remaining.length === 0) return null
    const randomIndex = Math.floor(Math.random() * remaining.length)
    return remaining[randomIndex]
  },
  reset: () =>
    set({
      currentIndex: 0,
      currentPrescription: null,
      reviewedIds: [],
      passCount: 0,
      failCount: 0,
      targetCount: 0,
      sessionId: null,
      reviewerName: '',
      candidateIds: [],
    }),
}))
