'use client'

import { createContext, useContext, useSyncExternalStore } from 'react'

const AuthContext = createContext()
const subscribe = (notify) => {
  window.addEventListener('storage', notify)
  window.addEventListener('mindmate-auth', notify)
  return () => {
    window.removeEventListener('storage', notify)
    window.removeEventListener('mindmate-auth', notify)
  }
}
const snapshot = () => localStorage.getItem('token') ? localStorage.getItem('user') || '' : ''
const serverSnapshot = () => null

export function AuthProvider({ children }) {
  const stored = useSyncExternalStore(subscribe, snapshot, serverSnapshot)
  const loading = stored === null
  let user = null
  try { user = stored ? JSON.parse(stored) : null } catch { /* Invalid local state is signed out. */ }

  const login = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    window.dispatchEvent(new Event('mindmate-auth'))
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.dispatchEvent(new Event('mindmate-auth'))
  }

  const getToken = () => {
    return localStorage.getItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, getToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
