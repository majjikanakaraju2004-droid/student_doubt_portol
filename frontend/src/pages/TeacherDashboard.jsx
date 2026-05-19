import React, { useEffect, useState } from 'react'
import api, { unwrapList } from '../api'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquare,
  Send,
  BarChart3,
  UserCircle,
  LogOut,
  Bell,
  Search,
  CheckCircle2,
  Clock,
  Filter,
  Paperclip,
  TrendingUp,
  Award,
  BookOpen,
  User,
  ChevronRight,
  ExternalLink,
  ArrowRight,
  Hash,
  Mail,
  Phone
} from 'lucide-react'
import { toast } from 'react-toastify'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts'

function TeacherDashboard() {
  const navigate = useNavigate()

  const [filter, setFilter] = useState('all')
  const [doubts, setDoubts] = useState([])
  const [activePage, setActivePage] = useState('dashboard')
  const [answerFiles, setAnswerFiles] = useState({})
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [analytics, setAnalytics] = useState(null)

  const buildProfileForm = (u) => ({
    full_name: u?.full_name || '',
    email: u?.email || '',
    contact_email: u?.contact_email || u?.email || '',
    mobile: u?.mobile || '',
    department: u?.department || '',
    designation: u?.designation || '',
    employee_id: u?.employee_id || '',
    subject_expertise: u?.subject_expertise || '',
    notification_preference: u?.notification_preference || 'Dashboard + Email',
  })

  const [profileUser, setProfileUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {}
    } catch {
      return {}
    }
  })
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState(() => buildProfileForm(JSON.parse(localStorage.getItem('user') || '{}')))
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (!token) {
      navigate('/')
      return
    }

    fetchDoubts()
    fetchNotifications()
    fetchAnalytics()

    const interval = setInterval(() => {
      fetchDoubts()
      fetchNotifications()
      fetchAnalytics()
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (activePage === 'profile') {
      fetchProfile()
    }
  }, [activePage])

  const fetchProfile = async () => {
    try {
      const response = await api.get('users/me/')
      setProfileUser(response.data.user)
      setProfileForm(buildProfileForm(response.data.user))
      localStorage.setItem('user', JSON.stringify(response.data.user))
    } catch (error) {
      console.log('Error loading profile:', error)
    }
  }

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value })
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      const response = await api.patch('users/me/', profileForm)
      setProfileUser(response.data.user)
      setProfileForm(buildProfileForm(response.data.user))
      localStorage.setItem('user', JSON.stringify(response.data.user))
      setEditingProfile(false)
      toast.success('Profile updated successfully')
    } catch (error) {
      const data = error.response?.data
      let message = 'Failed to update profile'
      if (data && typeof data === 'object') {
        message = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' ')
      }
      toast.error(message)
    } finally {
      setSavingProfile(false)
    }
  }

  const fetchDoubts = async () => {
    try {
      const response = await api.get('doubts/')
      setDoubts(unwrapList(response.data))
    } catch (error) {
      console.log('Error fetching doubts:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('doubts/analytics/')
      setAnalytics(response.data)
    } catch (error) {
      console.log('Error fetching analytics:', error)
    }
  }

  const fetchNotifications = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      if (!user) return
      const response = await api.get(`notifications/${user.id}/`)
      setNotifications(unwrapList(response.data))
    } catch (error) {
      console.log('Error fetching notifications:', error)
    }
  }

  const markNotificationRead = async (notificationId) => {
    try {
      await api.post(`notifications/read/${notificationId}/`, {})
      fetchNotifications()
    } catch (error) {
      console.log('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      if (!user) return
      await api.post(`notifications/read-all/${user.id}/`, {})
      fetchNotifications()
    } catch (error) {
      console.log('Error marking all notifications as read:', error)
    }
  }

  const handleAnswerChange = (id, value) => {
    setDoubts((prev) => prev.map((d) => d.id === id ? { ...d, answer: value } : d))
  }

  const submitAnswer = async (doubt) => {
    if (!doubt.answer || doubt.answer.trim() === '') {
      toast.warning('Please write an answer first')
      return
    }

    try {
      const form = new FormData()
      form.append('answer', doubt.answer)
      if (answerFiles[doubt.id]) {
        form.append('answer_attachment', answerFiles[doubt.id])
      }

      await api.post(`doubts/${doubt.id}/answer/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success('Answer Submitted Successfully')
      setAnswerFiles({})
      fetchDoubts()
    } catch (error) {
      console.log('Error submitting answer:', error)
      toast.error('Failed To Submit Answer')
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  const user = profileUser
  const pendingCount = analytics?.pending_count ?? doubts.filter(d => d.status === 'pending').length
  const answeredCount = analytics?.resolved_count ?? doubts.filter(d => d.status === 'answered' || d.status === 'solved').length
  const overdueCount = analytics?.overdue_count ?? doubts.filter(d => d.is_overdue).length
  const performance = analytics?.resolution_rate_percent ?? (doubts.length > 0 ? Math.round((answeredCount / doubts.length) * 100) : 0)
  const avgResolutionMins = analytics?.average_resolution_minutes ?? 0

  const subjectStats = (analytics?.common_subjects?.length
    ? analytics.common_subjects.map(s => ({ subject: s.subject, doubts: s.count }))
    : [...new Set(doubts.map(d => d.subject))].map(subject => ({
        subject,
        doubts: doubts.filter(d => d.subject === subject).length
      }))
  ).slice(0, 8)

  const resolutionTrend = analytics?.resolution_by_day ?? []

  const chartData = [
    { name: 'Pending', value: pendingCount, color: '#f59e0b' },
    { name: 'Resolved', value: answeredCount, color: '#10b981' },
    ...(overdueCount > 0 ? [{ name: 'SLA Overdue', value: overdueCount, color: '#ef4444' }] : []),
  ]

  const COLORS = ['#f59e0b', '#10b981']

  const renderTags = (tags) => {
    const tagList = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',') : [])
    return tagList.map((tag, i) => (
      <span key={i} className="bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold border border-blue-500/10">
        #{tag.trim()}
      </span>
    ))
  }

  const pageTitles = {
    dashboard: 'Faculty Overview',
    doubts: 'Doubt Feed',
    responses: 'My Responses',
    analytics: 'Performance',
    profile: 'Faculty Profile',
  }

  const isResolved = (doubt) => doubt.status === 'answered' || doubt.status === 'solved'

  const visibleDoubts = (activePage === 'responses'
    ? doubts.filter(isResolved)
    : doubts.filter((d) =>
        filter === 'all' ||
        (filter === 'pending' && d.status === 'pending') ||
        (filter === 'answered' && isResolved(d))
      )
  )

  return (
    <div className="min-h-screen page-shell text-slate-800 flex">
      {/* SIDEBAR */}
      <aside className="w-72 glass-panel border-r border-slate-200 flex flex-col sticky top-0 h-screen z-40">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Award size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Syn<span className="text-blue-500">ycs</span> <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-400 font-normal">FACULTY</span></h1>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
              { id: 'doubts', label: 'Doubt Feed', icon: MessageSquare, badge: pendingCount },
              { id: 'responses', label: 'My Responses', icon: Send },
              { id: 'analytics', label: 'Performance', icon: BarChart3 },
              { id: 'profile', label: 'Faculty Profile', icon: UserCircle },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  activePage === item.id 
                    ? 'bg-blue-600/10 text-blue-600 border border-blue-500/20 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                <item.icon size={20} className={activePage === item.id ? 'text-blue-600' : 'group-hover:text-slate-600'} />
                <span className="font-medium">{item.label}</span>
                {item.badge > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">{item.badge}</span>}
                {activePage === item.id && !item.badge && <ChevronRight size={14} className="ml-auto" />}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all duration-300"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative overflow-y-auto">
        {/* NAVBAR */}
        <header className="h-20 glass-panel border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-30">
          <h2 className="text-lg font-semibold text-slate-600">
            {pageTitles[activePage] || 'Faculty'}
          </h2>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors relative"
              >
                <Bell size={20} className="text-slate-400" />
                {notifications.some(n => !n.is_read) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-4 w-96 glass-panel rounded-2xl shadow-2xl overflow-hidden animate-in">
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div className="flex flex-col">
                      <h3 className="font-bold">Notifications</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                        {notifications.filter(n => !n.is_read).length} Unread
                      </p>
                    </div>
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-[10px] bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map(item => (
                      <div 
                        key={item.id}
                        onClick={() => markNotificationRead(item.id)}
                        className={`p-4 border-b border-slate-200 cursor-pointer transition-all duration-300 ${
                          item.is_read 
                            ? 'opacity-40 opacity-60 hover:opacity-60' 
                            : 'bg-blue-500/5 hover:bg-blue-500/10 border-l-2 border-l-blue-500'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className={`font-bold text-sm ${item.is_read ? 'text-slate-400' : 'text-blue-600'}`}>
                            {item.title}
                          </p>
                          {!item.is_read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className={`text-xs mt-1 ${item.is_read ? 'text-slate-600' : 'text-slate-400'}`}>{item.message}</p>
                        <p className="text-[10px] text-slate-600 mt-2 flex items-center gap-1">
                          <Clock size={10} /> {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-slate-100"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">{user.full_name || user.username || 'Faculty'}</p>
                <p className="text-xs text-slate-500">Instructor Account</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600/20 to-blue-600/20 border border-blue-500/20 flex items-center justify-center">
                <User size={20} className="text-blue-600" />
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="p-10">
          {activePage === 'dashboard' && (
            <div className="animate-in space-y-10">
              <div>
                <h1 className="text-3xl font-bold">Welcome back, {user.full_name || user.username || 'Faculty'}</h1>
                <p className="text-slate-500 mt-2">Your teaching metrics at a glance</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  {[
                    { label: 'Pending Doubts', value: pendingCount, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                    { label: 'Total Resolved', value: answeredCount, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
                    { label: 'Resolution Rate', value: `${performance}%`, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Avg Resolution', value: avgResolutionMins ? `${avgResolutionMins}m` : '—', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'SLA Overdue', value: overdueCount, icon: Clock, color: 'text-red-500', bg: 'bg-red-500/10' },
                  ].map((stat, i) => (
                    <div key={i} className="glass-card-premium p-6 rounded-3xl border border-slate-200">
                      <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center ${stat.color} mb-4`}>
                        <stat.icon size={24} />
                      </div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                      <h3 className="text-3xl font-black mt-1">{stat.value}</h3>
                    </div>
                  ))}
                </div>
              {pendingCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActivePage('doubts')}
                  className="glass-card-premium w-full p-6 rounded-3xl border border-blue-200 flex items-center justify-between gap-4 text-left hover:border-blue-400 transition-colors"
                >
                  <div>
                    <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">Action needed</p>
                    <p className="text-lg font-bold mt-1">{pendingCount} pending doubt{pendingCount === 1 ? '' : 's'} awaiting your response</p>
                  </div>
                  <ArrowRight className="text-blue-600 shrink-0" size={22} />
                </button>
              )}
            </div>
          )}

          {(activePage === 'doubts' || activePage === 'responses') && (
            <div className="animate-in space-y-10">
              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h1 className="text-3xl font-bold">{activePage === 'responses' ? 'My Responses' : 'Doubt Feed'}</h1>
                    <p className="text-slate-500">
                      {activePage === 'responses'
                        ? 'Doubts you have resolved for students'
                        : 'Provide solutions to student queries in real-time'}
                    </p>
                  </div>
                  {activePage === 'doubts' && (
                  <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-200">
                    {['all', 'pending', 'answered'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm capitalize transition-all ${
                          filter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-600'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  )}
                </div>

                <div className="space-y-6">
                  {visibleDoubts.length === 0 ? (
                    <div className="glass-card-premium rounded-3xl border border-slate-200 p-12 text-center">
                      <p className="text-slate-500 font-medium">
                        {activePage === 'responses' ? 'No resolved responses yet.' : 'No doubts match this filter.'}
                      </p>
                    </div>
                  ) : (
                  visibleDoubts.map((doubt) => {
                      const isSolved = isResolved(doubt)
                      const readOnly = activePage === 'responses' || isSolved
                      return (
                        <div key={doubt.id} className="glass-card-premium rounded-[2.5rem] overflow-hidden border border-slate-200">
                          <div className="p-8 lg:p-10">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                              <div className="flex items-center gap-3">
                                <span className="bg-blue-500/10 text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase border border-blue-500/10">{doubt.subject}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-400 font-medium text-sm">{doubt.topic}</span>
                              </div>
                              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border ${
                                isSolved ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                              }`}>
                                {isSolved ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                {isSolved ? 'RESOLVED' : 'AWAITING RESPONSE'}
                              </div>
                            </div>

                            <div className="mb-8">
                              <h3 className="text-2xl font-bold text-slate-900 mb-4 leading-snug">{doubt.question}</h3>
                              <div className="flex flex-wrap gap-2">
                                {renderTags(doubt.tags)}
                              </div>
                            </div>

                            {doubt.attachment && (
                              <div className="mb-8">
                                <a href={doubt.attachment_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition-all">
                                  <Paperclip size={14} /> View Student Attachment
                                </a>
                              </div>
                            )}

                            <div className="space-y-4">
                              <label className="text-xs font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Your Solution</label>
                              {readOnly ? (
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                  <p className="text-slate-600 leading-relaxed">{doubt.answer || 'Answer provided'}</p>
                                  {doubt.answer_attachment && (
                                    <a href={doubt.answer_attachment_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-4 text-xs font-bold text-blue-600 hover:underline">
                                      <Paperclip size={14} /> View Your Attachment
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <textarea
                                    placeholder="Type your comprehensive explanation here..."
                                    value={doubt.answer || ''}
                                    onChange={(e) => handleAnswerChange(doubt.id, e.target.value)}
                                    className="input-premium w-full p-6 rounded-2xl min-h-[140px] resize-none"
                                  />
                                  <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1 relative">
                                      <input type="file" id={`file-${doubt.id}`} className="hidden" onChange={(e) => setAnswerFiles({ ...answerFiles, [doubt.id]: e.target.files[0] })} />
                                      <label htmlFor={`file-${doubt.id}`} className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-dashed border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-600 cursor-pointer transition-all">
                                        <Paperclip size={18} />
                                        <span className="text-sm">{answerFiles[doubt.id] ? answerFiles[doubt.id].name : 'Attach explanatory resource'}</span>
                                      </label>
                                    </div>
                                    <button onClick={() => submitAnswer(doubt)} className="btn-premium px-10 py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 group">
                                      Submit Solution <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {activePage === 'analytics' && (
            <div className="animate-in space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card-premium p-8 rounded-[2.5rem] border border-slate-200 min-w-0">
                  <h3 className="text-xl font-bold mb-8">Resolution Overview</h3>
                  <div className="h-[320px] min-w-0">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={10} dataKey="value">
                          {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-8 mt-4">
                    {chartData.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                        <span className="text-xs font-bold text-slate-500">{d.name} ({d.value})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card-premium p-8 rounded-[2.5rem] border border-slate-200 min-w-0">
                  <h3 className="text-xl font-bold mb-8">Top Subjects Managed</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={subjectStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="subject" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                        <Bar dataKey="doubts" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="glass-card-premium p-8 rounded-[2.5rem] border border-slate-200 min-w-0">
                <h3 className="text-xl font-bold mb-4">Response Efficiency</h3>
                <p className="text-slate-500 text-sm mb-8">Track your daily resolution activity across different topics.</p>
                <div className="h-80">
                   <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={resolutionTrend.length ? resolutionTrend : [{ day: '—', resolved: 0 }]}>
                      <defs>
                        <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="resolved" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorResolved)" />
                    </AreaChart>
                   </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activePage === 'profile' && (
            <div className="animate-in max-w-4xl mx-auto">
              <div className="glass-panel p-12 rounded-[3rem] text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full -z-10"></div>
                <div className="relative mb-8 inline-block">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-blue-600 p-1">
                    <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                      <User size={64} className="text-slate-400" />
                    </div>
                  </div>
                  <div className="absolute bottom-1 right-1 w-8 h-8 bg-green-500 border-4 border-white rounded-full"></div>
                </div>

                <h1 className="text-4xl font-black mb-2">{user.full_name || user.username || 'Faculty Name'}</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-10">Senior Instructor / Faculty</p>

                {!editingProfile && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                  {[
                    { label: 'Official Username', value: user.username, icon: User },
                    { label: 'Academic Email', value: user.email, icon: Mail },
                    { label: 'Mobile', value: user.mobile, icon: Phone },
                    { label: 'Department', value: user.department, icon: BookOpen },
                    { label: 'Designation', value: user.designation, icon: Award },
                    { label: 'Subject expertise', value: user.subject_expertise, icon: BookOpen },
                    { label: 'Resolved Doubts', value: answeredCount, icon: CheckCircle2 },
                  ].map((field, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <field.icon size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{field.label}</p>
                        <p className="font-bold text-slate-800">{field.value || 'Not available'}</p>
                      </div>
                    </div>
                  ))}
                </div>
                )}

                {editingProfile ? (
                  <form onSubmit={(e) => { e.preventDefault(); saveProfile() }} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto mt-8">
                    {[
                      { name: 'full_name', label: 'Full name', type: 'text' },
                      { name: 'email', label: 'Academic email', type: 'email' },
                      { name: 'contact_email', label: 'Contact email', type: 'email' },
                      { name: 'mobile', label: 'Mobile', type: 'text' },
                      { name: 'employee_id', label: 'Employee ID', type: 'text' },
                      { name: 'department', label: 'Department', type: 'text' },
                      { name: 'designation', label: 'Designation', type: 'text' },
                      { name: 'subject_expertise', label: 'Subject expertise', type: 'text', wide: true },
                    ].map((field) => (
                      <div key={field.name} className={field.wide ? 'md:col-span-2' : ''}>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{field.label}</label>
                        <input
                          type={field.type}
                          name={field.name}
                          value={profileForm[field.name] || ''}
                          onChange={handleProfileChange}
                          className="input-premium w-full px-4 py-3 rounded-xl mt-1"
                        />
                      </div>
                    ))}
                    <div className="md:col-span-2 flex gap-3 pt-2">
                      <button type="submit" disabled={savingProfile} className="btn-premium px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-60">
                        {savingProfile ? 'Saving…' : 'Save changes'}
                      </button>
                      <button type="button" onClick={() => { setEditingProfile(false); setProfileForm(buildProfileForm(profileUser)) }} className="px-6 py-3 rounded-xl font-bold text-sm border border-slate-200">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                <button
                  type="button"
                  onClick={() => { setProfileForm(buildProfileForm(profileUser)); setEditingProfile(true) }}
                  className="mt-12 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 mx-auto"
                >
                  Edit profile details
                </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default TeacherDashboard