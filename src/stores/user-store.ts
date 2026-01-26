import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Role } from "@/lib/constants"

interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  role: Role
  companyId: string
  companyName: string
}

interface UserState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      clearUser: () => set({ user: null, isLoading: false }),
    }),
    {
      name: "user-storage",
      partialize: (state) => ({ user: state.user }),
    }
  )
)
