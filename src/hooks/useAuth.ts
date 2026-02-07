import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useFamilyStore } from '@/stores/familyStore'

/**
 * Initialize auth on app mount.
 * After auth is ready, load the family data.
 */
export function useAuth() {
  const initialize = useAuthStore((s) => s.initialize)
  const initialized = useAuthStore((s) => s.initialized)
  const user = useAuthStore((s) => s.user)
  const loadFamily = useFamilyStore((s) => s.loadFamily)

  useEffect(() => {
    initialize()
  }, [initialize])

  // Once auth is initialized and user is present, load family
  useEffect(() => {
    if (initialized && user) {
      loadFamily()
    }
  }, [initialized, user, loadFamily])
}
