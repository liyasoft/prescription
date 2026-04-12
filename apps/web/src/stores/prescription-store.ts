import { create } from 'zustand'
import type { PrescriptionWithItems } from '@repo/shared'

interface PrescriptionStore {
  prescriptions: PrescriptionWithItems[]
  departments: string[]
  filterStartDate: string
  filterEndDate: string
  filterDepartment: string
  isLoading: boolean
  isQueried: boolean
  setPrescriptions: (data: PrescriptionWithItems[]) => void
  setDepartments: (departments: string[]) => void
  setFilter: (filter: Partial<Pick<PrescriptionStore, 'filterStartDate' | 'filterEndDate' | 'filterDepartment'>>) => void
  setLoading: (loading: boolean) => void
  setQueried: (queried: boolean) => void
  reset: () => void
  getDepartmentStats: () => { department: string; count: number }[]
}

function getDefaultDates() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    filterStartDate: start.toISOString().split('T')[0],
    filterEndDate: end.toISOString().split('T')[0],
  }
}

export const usePrescriptionStore = create<PrescriptionStore>((set, get) => ({
  prescriptions: [],
  departments: [],
  ...getDefaultDates(),
  filterDepartment: 'all',
  isLoading: false,
  isQueried: false,
  setPrescriptions: (data) => set({ prescriptions: data }),
  setDepartments: (departments) => set({ departments }),
  setFilter: (filter) => set(filter),
  setLoading: (loading) => set({ isLoading: loading }),
  setQueried: (queried) => set({ isQueried: queried }),
  reset: () => set({ prescriptions: [], isQueried: false, ...getDefaultDates(), filterDepartment: 'all' }),
  getDepartmentStats: () => {
    const { prescriptions } = get()
    const map = new Map<string, number>()
    prescriptions.forEach((p) => {
      map.set(p.department, (map.get(p.department) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count)
  },
}))
