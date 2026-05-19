import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { Shield, Lock, User, ArrowLeft, ArrowRight } from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-toastify'

function AdminLogin() {
  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  const [adminData, setAdminData] = useState({
    username: '',
    password: ''
  })

  const handleChange = (e) => {
    setAdminData({
      ...adminData,
      [e.target.name]: e.target.value
    })
  }

  const handleAdminLogin = async (e) => {
    e.preventDefault()

    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/api/users/admin-login/',
        {
          username: adminData.username,
          password: adminData.password
        }
      )

      toast.success(response.data.message)

      localStorage.setItem('access', response.data.access);
      localStorage.setItem('refresh', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('admin', JSON.stringify(response.data.user));

      navigate('/admin-dashboard');

    } catch (error) {
      console.log(error)
      toast.error('Invalid Admin Credentials')
    }
  }

  return (
    <div className="min-h-screen page-shell flex items-center justify-center p-6 overflow-hidden relative">
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-blue-600/5 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-xl animate-in">
        <div className="glass-panel p-10 lg:p-14 rounded-[3rem] shadow-2xl relative border border-slate-200 overflow-hidden">
          {/* Top Border Glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
          
          <div className="flex flex-col items-center mb-12">
            <div className="w-20 h-20 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 shadow-[0_0_20px_rgba(168,85,247,0.1)] animate-float">
              <Shield size={40} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Admin <span className="text-blue-500">Access</span></h1>
            <p className="text-slate-500 font-medium">Authorized Personnel Only</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Administrator Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  type="text"
                  name="username"
                  placeholder="Enter admin ID"
                  value={adminData.username}
                  onChange={handleChange}
                  className="input-premium w-full pl-12 pr-4 py-4 rounded-2xl placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Secure Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={adminData.password}
                  onChange={handleChange}
                  className="input-premium w-full pl-12 pr-12 py-4 rounded-2xl placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-premium w-full py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 group mt-4"
            >
              Initiate Secure Login
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </button>
          </form>

          <div className="mt-12 text-center">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-all"
            >
              <ArrowLeft size={14} />
              Return to Public Portal
            </button>
          </div>
        </div>
        
        <p className="mt-8 text-center text-slate-700 text-[10px] font-bold uppercase tracking-[0.3em]">
          End-to-End Encrypted Session
        </p>
      </div>
    </div>
  )
}

export default AdminLogin