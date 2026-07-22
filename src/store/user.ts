import { create } from 'zustand'

interface User {
  id: number
  openid: string
  nickName?: string
  avatarUrl?: string
  createdAt?: string
}

interface UserStats {
  todayCount: number
  totalQuestions: number
  totalCorrect: number
  streak: number
  totalDays: number
  lastStudyDate: string | null
}

interface UserStore {
  user: User | null
  isLoggedIn: boolean
  stats: UserStats
  login: (user: User) => void
  logout: () => void
  setStats: (stats: UserStats) => void
  updateUserInfo: (info: Partial<User>) => void
}

const defaultStats: UserStats = {
  todayCount: 0,
  totalQuestions: 0,
  totalCorrect: 0,
  streak: 0,
  totalDays: 0,
  lastStudyDate: null,
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoggedIn: false,
  stats: defaultStats,
  login: (user) => set({ user, isLoggedIn: true }),
  logout: () => set({ user: null, isLoggedIn: false, stats: defaultStats }),
  setStats: (stats) => set({ stats }),
  updateUserInfo: (info) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...info } : null,
    })),
}))