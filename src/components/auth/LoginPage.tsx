import { useState } from 'react'
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '@/lib/supabase'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (mode === 'login') {
      const { error: err } = await signInWithEmail(email, password)
      if (err) setError(err.message)
    } else {
      if (!displayName.trim()) {
        setError('이름을 입력해주세요')
        setLoading(false)
        return
      }
      const { error: err } = await signUpWithEmail(email, password, displayName)
      if (err) setError(err.message)
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setError(null)
    const { error: err } = await signInWithGoogle()
    if (err) setError(err.message)
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-surface">
      <div className="w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20 mb-4">
            <span className="text-white font-bold text-xl">FG</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Family Graph</h1>
          <p className="text-sm text-gray-400 mt-1">가족 성장 지식그래프</p>
        </div>

        {/* Form */}
        <div className="bg-surface-light border border-surface-border rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">이름</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface border border-surface-border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="홍길동"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface border border-surface-border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                placeholder="email@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface border border-surface-border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? '처리 중...' : mode === 'login' ? '로그인' : '가입하기'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-xs text-gray-500">또는</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          <button
            onClick={handleGoogle}
            className="w-full py-2.5 bg-surface hover:bg-surface-hover border border-surface-border text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google로 로그인
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            {mode === 'login' ? (
              <>
                계정이 없으신가요?{' '}
                <button onClick={() => { setMode('signup'); setError(null) }} className="text-primary-400 hover:underline cursor-pointer">
                  가입하기
                </button>
              </>
            ) : (
              <>
                이미 계정이 있으신가요?{' '}
                <button onClick={() => { setMode('login'); setError(null) }} className="text-primary-400 hover:underline cursor-pointer">
                  로그인
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
