import { useState } from 'react'
import { Store, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login, loading, error, resetPassword } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
    } catch {
      // error shown via store
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await resetPassword(email)
      toast.success('Password reset email sent! Check your inbox.')
      setForgotMode(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset email')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-brand-900/50">
            <Store size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Advanced Invento</h1>
          <p className="text-gray-400 text-sm mt-1">
            {forgotMode ? 'Reset your password' : 'Complete Shop Management'}
          </p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <form onSubmit={forgotMode ? handleForgot : handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-9"
                  placeholder="owner@myshop.com"
                  required
                />
              </div>
            </div>

            {!forgotMode && (
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-9 pr-9"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full btn-lg"
            >
              {loading
                ? 'Please wait...'
                : forgotMode ? 'Send Reset Email' : 'Login to Dashboard'
              }
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setForgotMode(!forgotMode)}
              className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
            >
              {forgotMode ? '← Back to Login' : 'Forgot Password?'}
            </button>
          </div>
        </div>

        {/* Info */}
        <p className="text-center text-xs text-gray-600 mt-6">
          🔒 Secured by Supabase • Advanced Invento v1.0
        </p>
      </div>
    </div>
  )
}
