"use client"

import { useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useUserStore } from "@/stores"
import { toast } from "sonner"

export function useAuth() {
  const router = useRouter()
  const { user, isLoading, setUser, setLoading, clearUser } = useUserStore()

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: { user: { id: string; email: string } } | null } }) => {
      if (session?.user) {
        // Get profile data
        supabase
          .from("profiles")
          .select("*, companies(name)")
          .eq("id", session.user.id)
          .single()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .then(({ data: profile }: { data: any }) => {
            if (profile) {
              setUser({
                id: session.user.id,
                email: session.user.email!,
                name: profile.name,
                avatarUrl: profile.avatar_url,
                role: profile.role,
                companyId: profile.company_id,
                companyName: profile.companies?.name || "",
              })
            } else {
              setLoading(false)
            }
          })
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*, companies(name)")
          .eq("id", session.user.id)
          .single()

        if (profile) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: profile.name,
            avatarUrl: profile.avatar_url,
            role: profile.role,
            companyId: profile.company_id,
            companyName: profile.companies?.name || "",
          })
        }
      } else if (event === "SIGNED_OUT") {
        clearUser()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setLoading, clearUser])

  const signIn = useCallback(
    async (email: string, password: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any
      setLoading(true)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setLoading(false)
        toast.error(error.message)
        return { error }
      }

      router.push("/dashboard")
      return { error: null }
    },
    [router, setLoading]
  )

  const signUp = useCallback(
    async (email: string, password: string, name: string, companyName: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any
      setLoading(true)

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (authError) {
        setLoading(false)
        toast.error(authError.message)
        return { error: authError }
      }

      if (!authData.user) {
        setLoading(false)
        toast.error("Erro ao criar usuário")
        return { error: new Error("Erro ao criar usuário") }
      }

      // 2. Create company
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: companyName,
          plan: "free",
        })
        .select()
        .single()

      if (companyError) {
        setLoading(false)
        toast.error("Erro ao criar empresa")
        return { error: companyError }
      }

      // 3. Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        company_id: company.id,
        name,
        email,
        role: "admin",
      })

      if (profileError) {
        setLoading(false)
        toast.error("Erro ao criar perfil")
        return { error: profileError }
      }

      toast.success("Conta criada! Verifique seu email para confirmar.")
      router.push("/login")
      return { error: null }
    },
    [router, setLoading]
  )

  const signOut = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any
    await supabase.auth.signOut()
    clearUser()
    router.push("/login")
  }, [router, clearUser])

  const resetPassword = useCallback(async (email: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
      toast.error(error.message)
      return { error }
    }

    toast.success("Email de recuperação enviado!")
    return { error: null }
  }, [])

  return {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }
}
