import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { Brain, GraduationCap, ArrowRight, User, Lock, Mail, Hash, BookOpen, Calendar, Phone } from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-toastify'

let API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/';
if (!API_BASE.endsWith('/')) {
  API_BASE += '/';
}
if (!API_BASE.endsWith('/api/')) {
  API_BASE += 'api/';
}

function Login() {
  const navigate = useNavigate()

  const [isRegister, setIsRegister] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [role, setRole] = useState('student')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotUsername, setForgotUsername] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSubmitting, setForgotSubmitting] = useState(false)
  const [devResetLink, setDevResetLink] = useState('')
  const [devResetUsername, setDevResetUsername] = useState('')

  const emptyForm = {
    full_name: '',
    username: '',
    email: '',
    roll_number: '',
    department: '',
    year_of_study: '',
    section: '',
    mobile: '',
    password: '',
    notification_preference: 'Dashboard + Email'
  }

  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  })

  const [formData, setFormData] = useState(emptyForm)

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    })
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleRegister = async (e) => {
    e.preventDefault()

    try {
      await axios.post(
        `${API_BASE}users/register/`,
        {
          ...formData,
          role: 'student',
          contact_email: formData.email
        }
      )

      toast.success('Student Account Created Successfully')
      setIsRegister(false)
      setFormData(emptyForm)

    } catch (error) {
      console.log(error.response?.data || error)
      toast.error('Registration Failed')
    }
  }

  const roleDisplay = (r) => (r === 'teacher' ? 'Faculty' : 'Student')

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!forgotUsername.trim()) {
      toast.error('Please enter your username.')
      return
    }
    if (!forgotEmail.trim()) {
      toast.error('Please enter your registered email address.')
      return
    }
    setForgotSubmitting(true)
    setDevResetLink('')
    setDevResetUsername('')
    try {
      const response = await axios.post(`${API_BASE}users/forgot-password/`, {
        username: forgotUsername.trim(),
        email: forgotEmail.trim(),
      })
      if (response.data.reset_link) {
        setDevResetLink(response.data.reset_link)
        setDevResetUsername(response.data.username || forgotUsername.trim())
        toast.info(response.data.message || 'Use the reset link shown below.')
      } else if (response.data.email_sent) {
        toast.success(response.data.message)
        setShowForgotPassword(false)
        setForgotUsername('')
        setForgotEmail('')
      } else {
        toast.success(response.data.message)
      }
    } catch (error) {
      const msg = error.response?.data?.message
      if (error.response?.status === 503) {
        toast.error(msg || 'Email could not be sent. Check server email settings.')
      } else {
        toast.error(msg || 'Could not send reset email.')
      }
    } finally {
      setForgotSubmitting(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    try {
      const response = await axios.post(
        `${API_BASE}users/login/`,
        {
          username: loginData.username,
          password: loginData.password,
          role: role
        }
      )

      const tokenResponse = await axios.post(
        `${API_BASE}users/token/`,
        {
          username: loginData.username,
          password: loginData.password
        }
      )

      localStorage.setItem('access', tokenResponse.data.access)
      localStorage.setItem('refresh', tokenResponse.data.refresh)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      toast.success(response.data.message || 'Login Successful')

      if (response.data.role === 'student') {
        navigate('/student')
      } else if (response.data.role === 'teacher') {
        navigate('/teacher')
      }
    } catch (error) {
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
      localStorage.removeItem('user')

      const data = error.response?.data
      if (data?.message === 'Role Mismatch' && data?.account_role) {
        setRole(data.account_role)
        toast.error(
          `This account is registered as ${roleDisplay(data.account_role)}. Select "${roleDisplay(data.account_role)}" above and sign in again.`
        )
        return
      }

      toast.error(data?.message || 'Login failed. Check your username and password.')
    }
  }

  return (
    <div className="min-h-screen page-shell bg-slate-50 flex overflow-hidden">
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Left Section - Hero */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-16 xl:px-24 border-r border-slate-200 relative">
        <div className="animate-in space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-sm font-medium mb-4">
            <Brain size={16} />
            <span>AI-Powered Learning Support</span>
          </div>
          
          <div>
            <h1 className="text-5xl xl:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
              Student Doubt Clarification & <span className="text-gradient">Knowledge Management System</span>
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed max-w-lg">
              Get instant answers to your complex doubts and access a vast knowledge base managed by experts.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-12">
            {[
              { label: 'Smart Filtering', desc: 'AI-assisted doubt management' },
              { label: 'Expert Support', desc: 'Real-time teacher solutions' },
              { label: 'Knowledge Hub', desc: 'Centralized study resources' },
              { label: 'Instant Updates', desc: 'Real-time push notifications' },
            ].map((feature, i) => (
              <div key={i} className="glass-card-premium p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-1">{feature.label}</h3>
                <p className="text-sm text-slate-500">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-12">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold overflow-hidden">
                  <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-400">
              Joined by <span className="text-slate-900 font-bold">2k+ students</span> this semester
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="w-full lg:w-1/2 flex justify-center items-center p-6 relative overflow-y-auto">
        <div className={`w-full max-w-xl transition-all duration-500 ${isRegister ? 'py-12' : 'py-6'}`}>
          <div className="glass-panel p-8 lg:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            {/* Form Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 blur-[60px] rounded-full"></div>
            
            <div className="relative z-10">
              <div className="flex justify-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 animate-float">
                  <GraduationCap className="text-white" size={32} />
                </div>
              </div>

              {!isRegister ? (
                <div className="animate-in">
                  <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold text-slate-900 mb-3">
                      {showForgotPassword ? 'Forgot password' : 'Welcome Back'}
                    </h2>
                    <p className="text-slate-400">
                      {showForgotPassword
                        ? 'Enter your username and registered email. We will send a reset link.'
                        : 'Continue your learning journey today'}
                    </p>
                  </div>

                  {showForgotPassword ? (
                    <form onSubmit={handleForgotPassword} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 ml-1">Username</label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                          <input
                            type="text"
                            placeholder="Your login username"
                            value={forgotUsername}
                            onChange={(e) => setForgotUsername(e.target.value)}
                            className="input-premium w-full pl-12 pr-4 py-4 rounded-xl placeholder:text-slate-600"
                            required
                            autoComplete="username"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 ml-1">Registered email</label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                          <input
                            type="email"
                            placeholder="you@college.edu"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="input-premium w-full pl-12 pr-4 py-4 rounded-xl placeholder:text-slate-600"
                            required
                            autoComplete="email"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={forgotSubmitting}
                        className="btn-premium w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {forgotSubmitting ? 'Sending…' : 'Send reset link'}
                        <ArrowRight size={20} />
                      </button>
                      {devResetLink && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left space-y-3">
                          <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                            Development reset link (SMTP not set up)
                          </p>
                          {devResetUsername && (
                            <p className="text-sm text-slate-700">
                              Account: <span className="font-bold text-slate-900">@{devResetUsername}</span>
                            </p>
                          )}
                          <a
                            href={devResetLink}
                            className="text-sm text-blue-700 font-semibold break-all hover:underline"
                          >
                            {devResetLink}
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(devResetLink)
                              toast.success('Link copied to clipboard')
                            }}
                            className="text-xs font-bold text-blue-600 hover:underline"
                          >
                            Copy link
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false)
                          setForgotUsername('')
                          setForgotEmail('')
                          setDevResetLink('')
                          setDevResetUsername('')
                        }}
                        className="w-full text-sm text-slate-500 hover:text-blue-600 font-semibold"
                      >
                        Back to login
                      </button>
                    </form>
                  ) : (
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600 ml-1">Username</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                          type="text"
                          name="username"
                          placeholder="Enter username"
                          value={loginData.username}
                          onChange={handleLoginChange}
                          className="input-premium w-full pl-12 pr-4 py-4 rounded-xl placeholder:text-slate-600"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600 ml-1">Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          name="password"
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={handleLoginChange}
                          className="input-premium w-full pl-12 pr-12 py-4 rounded-xl placeholder:text-slate-600"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          {showLoginPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setForgotUsername(loginData.username || '')
                            setShowForgotPassword(true)
                          }}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600 ml-1">Login As</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['student', 'teacher'].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                              role === r 
                                ? 'bg-blue-600/20 border-blue-500 text-blue-600 shadow-lg shadow-blue-500/10' 
                                : 'bg-slate-100 border-slate-200 text-slate-600 hover:border-blue-300'
                            }`}
                          >
                            {roleDisplay(r)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-premium w-full py-4 rounded-xl text-white font-bold text-lg mt-4 flex items-center justify-center gap-2 group"
                    >
                      Login to Dashboard
                      <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                    </button>
                  </form>
                  )}

                  {!showForgotPassword && (
                  <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm">
                      New to the platform? 
                      <button
                        onClick={() => setIsRegister(true)}
                        className="text-blue-600 font-bold ml-2 hover:text-blue-300 transition-colors"
                      >
                        Create Account
                      </button>
                    </p>
                    <div className="flex items-center gap-4 mt-6">
                      <div className="h-px flex-1 bg-slate-200"></div>
                      <span className="text-xs text-slate-600 font-bold uppercase tracking-widest">or</span>
                      <div className="h-px flex-1 bg-slate-200"></div>
                    </div>
                    <button
                      onClick={() => navigate('/admin-login')}
                      className="mt-6 text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors"
                    >
                      Admin Access Point
                    </button>
                  </div>
                  )}
                </div>
              ) : (
                <div className="animate-in">
                  <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold text-slate-900 mb-3">Join Us</h2>
                    <p className="text-slate-400">Start your smart learning journey today</p>
                  </div>

                  <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                          type="text"
                          name="full_name"
                          placeholder="John Doe"
                          value={formData.full_name}
                          onChange={handleChange}
                          className="input-premium w-full pl-12 pr-4 py-3 rounded-xl text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Username</label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                          type="text"
                          name="username"
                          placeholder="johndoe"
                          value={formData.username}
                          onChange={handleChange}
                          className="input-premium w-full pl-12 pr-4 py-3 rounded-xl text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                          type="email"
                          name="email"
                          placeholder="john@edu.com"
                          value={formData.email}
                          onChange={handleChange}
                          className="input-premium w-full pl-12 pr-4 py-3 rounded-xl text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Roll Number</label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                          type="text"
                          name="roll_number"
                          placeholder="2024CS01"
                          value={formData.roll_number}
                          onChange={handleChange}
                          className="input-premium w-full pl-12 pr-4 py-3 rounded-xl text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Department</label>
                      <div className="relative">
                        <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                          type="text"
                          name="department"
                          placeholder="Computer Science"
                          value={formData.department}
                          onChange={handleChange}
                          className="input-premium w-full pl-12 pr-4 py-3 rounded-xl text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Year of Study</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                          type="text"
                          name="year_of_study"
                          placeholder="3rd Year"
                          value={formData.year_of_study}
                          onChange={handleChange}
                          className="input-premium w-full pl-12 pr-4 py-3 rounded-xl text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Section</label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                          type="text"
                          name="section"
                          placeholder="A"
                          value={formData.section}
                          onChange={handleChange}
                          className="input-premium w-full pl-12 pr-4 py-3 rounded-xl text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Mobile</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                          type="text"
                          name="mobile"
                          placeholder="+1 234 567 890"
                          value={formData.mobile}
                          onChange={handleChange}
                          className="input-premium w-full pl-12 pr-4 py-3 rounded-xl text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                          type={showRegisterPassword ? 'text' : 'password'}
                          name="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={handleChange}
                          className="input-premium w-full pl-12 pr-12 py-3 rounded-xl text-sm"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                        >
                          {showRegisterPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-2 pt-4">
                      <button
                        type="submit"
                        className="btn-premium w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 group"
                      >
                        Create My Account
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                      </button>
                    </div>
                  </form>

                  <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm">
                      Already registered? 
                      <button
                        onClick={() => setIsRegister(false)}
                        className="text-blue-600 font-bold ml-2 hover:text-blue-300 transition-colors"
                      >
                        Login here
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login