import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Lock, ArrowRight, GraduationCap, User } from 'lucide-react'
import { toast } from 'react-toastify'

let API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/';
if (!API_BASE.endsWith('/')) {
  API_BASE += '/';
}
if (!API_BASE.endsWith('/api/')) {
  API_BASE += 'api/';
}

function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') || ''
  const token = searchParams.get('token') || ''
  const username = searchParams.get('username') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!uid || !token) {
      toast.error('Invalid reset link. Request a new one from the login page.')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const response = await axios.post(`${API_BASE}users/reset-password/`, {
        uid,
        token,
        username,
        password,
        confirm_password: confirmPassword,
      })
      toast.success(response.data.message || 'Password updated')
      navigate('/')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not reset password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen page-shell bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md glass-panel p-10 rounded-[2rem] shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-600 flex items-center justify-center">
            <GraduationCap className="text-white" size={28} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">Set new password</h1>
        {username ? (
          <div className="flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-xl bg-blue-50 border border-blue-100">
            <User size={18} className="text-blue-600 shrink-0" />
            <p className="text-sm text-slate-700">
              Resetting password for <span className="font-bold text-blue-700">@{username}</span>
            </p>
          </div>
        ) : null}
        <p className="text-slate-500 text-center text-sm mb-8">
          Choose a strong password for your Synycs account.
        </p>

        {!uid || !token ? (
          <div className="text-center space-y-4">
            <p className="text-red-600 text-sm">This reset link is invalid or incomplete.</p>
            <Link to="/" className="text-blue-600 font-bold hover:underline">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">New password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-premium w-full pl-11 pr-4 py-3 rounded-xl"
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-premium w-full pl-11 pr-4 py-3 rounded-xl"
                  placeholder="Repeat password"
                  required
                  minLength={8}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-premium w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Update password'}
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        <p className="text-center mt-6 text-sm text-slate-500">
          <Link to="/" className="text-blue-600 font-bold hover:underline">
            Return to login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ResetPassword
