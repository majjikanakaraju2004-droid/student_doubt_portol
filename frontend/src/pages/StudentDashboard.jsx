import React, { useEffect, useState } from 'react'
import api, { unwrapList } from '../api'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  HelpCircle,
  Brain,
  UserCircle,
  LogOut,
  Bell,
  Search,
  PlusCircle,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  ExternalLink,
  User,
  ArrowRight,
  Hash,
  Mail,
  BookOpen,
  Calendar,
  Phone
} from 'lucide-react'
import { toast } from 'react-toastify'

function StudentDashboard() {
  const navigate = useNavigate()

  const [doubts, setDoubts] = useState([])
  const [responses, setResponses] = useState([])
  const [activePage, setActivePage] = useState('dashboard')

  // AI STATES
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [knowledgeResults, setKnowledgeResults] = useState([])
  const [kbBrowse, setKbBrowse] = useState({ subjects: [] })
  const [kbSubject, setKbSubject] = useState('')
  const [kbTopic, setKbTopic] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)

  const [formData, setFormData] = useState({
    student: JSON.parse(localStorage.getItem('user'))?.id || 1,
    subject: '',
    topic: '',
    question: '',
    status: 'pending'
  })

  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)

  const [profileUser, setProfileUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {}
    } catch {
      return {}
    }
  })

  const fetchProfile = async () => {
    try {
      const response = await api.get('users/me/')
      setProfileUser(response.data.user)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    } catch (error) {
      console.log('Error loading profile:', error)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (!token) {
      navigate('/')
      return
    }
    fetchDoubts()
    fetchResponses()
    fetchNotifications()
    fetchProfile()
  }, [])

  const fetchDoubts = async () => {
    try {
      const response = await api.get('doubts/')
      setDoubts(unwrapList(response.data))
    } catch (error) {
      console.log('Error fetching doubts:', error)
    }
  }

  const fetchResponses = async () => {
    try {
      const response = await api.get('responses/')
      setResponses(unwrapList(response.data))
    } catch (error) {
      console.log('Error fetching responses:', error)
      setResponses([])
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

  const [checkTimeout, setCheckTimeout] = useState(null)

  const checkSimilarity = (questionText) => {
    if (questionText.length < 10) {
      setAiSuggestion(null)
      return
    }

    if (checkTimeout) clearTimeout(checkTimeout)

    const timeout = setTimeout(async () => {
      try {
        const response = await api.post('doubts/check-similarity/', {
          question: questionText
        })
        if (response.data.similar_found) {
          setAiSuggestion(response.data)
        } else {
          setAiSuggestion(null)
        }
      } catch (error) {
        console.log('Error checking similarity:', error)
      }
    }, 1000) // 1 second debounce

    setCheckTimeout(timeout)
  }

  const fetchKbBrowse = async () => {
    if (!localStorage.getItem('access')) return
    try {
      const response = await api.get('doubts/knowledge-base/browse/')
      setKbBrowse(response.data)
    } catch (error) {
      if (error.response?.status === 401) return
      console.log('Error loading knowledge browse:', error)
    }
  }

  const searchKnowledgeBase = async () => {
    if (!localStorage.getItem('access')) return
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('query', searchQuery)
      if (kbSubject) params.set('subject', kbSubject)
      if (kbTopic) params.set('topic', kbTopic)
      const qs = params.toString()
      const response = await api.get(`doubts/knowledge-base/${qs ? `?${qs}` : ''}`)
      setKnowledgeResults(response.data)
    } catch (error) {
      if (error.response?.status === 401) return
      console.log('Error searching knowledge base:', error)
    }
  }

  const showAllKnowledgeBase = async () => {
    if (!localStorage.getItem('access')) {
      navigate('/')
      return
    }
    setKbSubject('')
    setKbTopic('')
    setSearchQuery('')
    await fetchKbBrowse()
    await searchKnowledgeBase()
  }

  const getAnswerForDoubt = (doubt) => {
    if (doubt?.answer) return doubt.answer
    if (!Array.isArray(responses)) return null
    const match = responses.find((res) => {
      const responseDoubtId = typeof res.doubt === 'object' ? res.doubt.id : res.doubt
      return Number(responseDoubtId) === Number(doubt.id)
    })
    return match?.answer || null
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (aiSuggestion && aiSuggestion.similarity_score > 0.85) {
      const proceed = window.confirm('Very similar doubt already exists. Do you still want to submit?')
      if (!proceed) return
    }
    try {
      const form = new FormData()
      Object.keys(formData).forEach(key => form.append(key, formData[key]))
      if (selectedFile) form.append('attachment', selectedFile)
      
      await api.post('doubts/', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success("Doubt Submitted Successfully")
      setFormData({
        student: JSON.parse(localStorage.getItem('user'))?.id || 1,
        subject: '',
        topic: '',
        question: '',
        status: 'pending'
      })
      setAiSuggestion(null)
      setSelectedFile(null)
      fetchDoubts()
      fetchResponses()
    } catch (error) {
      console.log('Error submitting doubt:', error)
      toast.error("An error occurred while submitting your doubt")
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  const user = profileUser
  const isPendingDoubt = (doubt) => {
    if (doubt?.status === 'pending') return true
    if (doubt?.status === 'solved' || doubt?.status === 'answered') return false
    return !getAnswerForDoubt(doubt)
  }

  const pendingDoubts = doubts.filter(isPendingDoubt)
  const answeredCount = doubts.length - pendingDoubts.length
  const pendingCount = pendingDoubts.length

  return (
    <div className="min-h-screen page-shell text-slate-800 flex">
      {/* SIDEBAR */}
      <aside className="w-72 glass-panel border-r border-slate-200 flex flex-col sticky top-0 h-screen z-40">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Brain size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Syn<span className="text-blue-500">ycs</span></h1>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'mydoubts', label: 'My Doubts', icon: HelpCircle },
              { id: 'ai', label: 'Knowledge Base', icon: Brain },
              { id: 'profile', label: 'My Profile', icon: UserCircle },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id)
                  if (item.id === 'mydoubts') { fetchDoubts(); fetchResponses(); }
                  if (item.id === 'ai') showAllKnowledgeBase();
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  activePage === item.id 
                    ? 'bg-blue-600/10 text-blue-600 border border-blue-500/20 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                <item.icon size={20} className={activePage === item.id ? 'text-blue-600' : 'group-hover:text-slate-600'} />
                <span className="font-medium">{item.label}</span>
                {activePage === item.id && <ChevronRight size={14} className="ml-auto" />}
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
            {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
          </h2>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors relative"
              >
                <Bell size={20} className="text-slate-400" />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></span>
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
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">No new alerts</div>
                    ) : (
                      notifications.map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => markNotificationRead(item.id)}
                          className={`p-4 border-b border-slate-200 cursor-pointer transition-all duration-300 ${
                            item.is_read 
                              ? 'opacity-50 hover:opacity-70' 
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
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-slate-100"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">{user.full_name || user.username || 'Student'}</p>
                <p className="text-xs text-slate-500">{user.roll_number || 'ST-2024'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-200 flex items-center justify-center">
                <User size={20} className="text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="p-10">
          {activePage === 'dashboard' && (
            <div className="animate-in space-y-10">
              {/* WELCOME SECTION */}
              <div className="relative overflow-hidden glass-card-premium rounded-3xl p-10 border border-blue-500/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div>
                    <h1 className="text-4xl font-extrabold mb-3">Hello, <span className="text-gradient">{(user.full_name || user.username || 'Student').split(' ')[0]}</span>!</h1>
                    <p className="text-slate-400 text-lg max-w-xl">Ready to clear your doubts today? Submit a question and our expert faculty or smart AI will assist you immediately.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-white backdrop-blur-md border border-slate-200 p-6 rounded-2xl text-center min-w-[120px]">
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Pending</p>
                      <p className="text-3xl font-black text-yellow-500">{pendingCount}</p>
                    </div>
                    <div className="bg-white backdrop-blur-md border border-slate-200 p-6 rounded-2xl text-center min-w-[120px]">
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Resolved</p>
                      <p className="text-3xl font-black text-green-500">{answeredCount}</p>
                    </div>
                  </div>
                </div>
              </div>

              {pendingDoubts.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-bold">Your pending doubts</h3>
                    <button
                      type="button"
                      onClick={() => setActivePage('mydoubts')}
                      className="text-sm font-bold text-blue-600 hover:underline"
                    >
                      View all in My Doubts
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {pendingDoubts.slice(0, 5).map((doubt) => (
                      <div key={doubt.id} className="glass-card-premium rounded-2xl border border-yellow-200/80 p-6">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="bg-yellow-500/10 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase">Pending</span>
                          <span className="text-xs font-bold text-blue-600">{doubt.subject}</span>
                          <span className="text-slate-400 text-xs">• {doubt.topic}</span>
                        </div>
                        <p className="text-slate-800 font-medium line-clamp-2">{doubt.question}</p>
                        <p className="text-slate-500 text-sm mt-3 flex items-center gap-2">
                          <Clock size={14} /> Waiting for faculty response
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RAISE DOUBT FORM */}
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <PlusCircle className="text-blue-500" size={24} />
                  <h3 className="text-2xl font-bold">Raise a New Doubt</h3>
                </div>
                
                <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-[2rem] space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400 ml-1">Subject</label>
                      <input
                        type="text"
                        name="subject"
                        placeholder="e.g. Physics"
                        value={formData.subject}
                        onChange={handleChange}
                        className="input-premium w-full px-5 py-4 rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400 ml-1">Topic</label>
                      <input
                        type="text"
                        name="topic"
                        placeholder="e.g. Quantum Mechanics"
                        value={formData.topic}
                        onChange={handleChange}
                        className="input-premium w-full px-5 py-4 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 ml-1">Your Question</label>
                    <textarea
                      name="question"
                      placeholder="Describe your doubt in detail..."
                      value={formData.question}
                      onChange={(e) => { handleChange(e); checkSimilarity(e.target.value); }}
                      className="input-premium w-full px-5 py-4 rounded-xl min-h-[160px] resize-none"
                      required
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-full sm:flex-1 relative group">
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                      />
                      <label 
                        htmlFor="file-upload"
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-dashed border-slate-200 text-slate-400 hover:border-blue-500 hover:text-blue-600 cursor-pointer transition-all"
                      >
                        <Paperclip size={18} />
                        <span>{selectedFile ? selectedFile.name : 'Attach supporting file (Image/PDF)'}</span>
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="btn-premium w-full sm:w-auto px-10 py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                    >
                      Submit Question
                    </button>
                  </div>

                  {aiSuggestion && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 animate-in">
                      <div className="flex items-center gap-2 mb-4">
                        <Brain size={20} className="text-blue-600" />
                        <h4 className="font-bold text-blue-800 uppercase tracking-widest text-xs">AI Smart Suggestion</h4>
                        <span className="ml-auto text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded">
                          {(aiSuggestion.similarity_score * 100).toFixed(1)}% Match Found
                        </span>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-white rounded-xl border border-slate-200">
                          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Found Similar Query</p>
                          <p className="text-sm text-slate-800 italic">"{aiSuggestion.matched_question}"</p>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-blue-200 shadow-sm">
                          <p className="text-xs text-blue-700 uppercase font-bold mb-1">Suggested Answer</p>
                          <p className="text-sm text-slate-800 leading-relaxed">{aiSuggestion.matched_answer}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {activePage === 'mydoubts' && (
            <div className="animate-in space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                  <h1 className="text-3xl font-bold">My Questions</h1>
                  <p className="text-slate-500">Track and manage your submitted doubts</p>
                </div>
                <div className="relative w-full md:w-80 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Search by topic..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-premium w-full pl-12 pr-4 py-3 rounded-xl text-sm"
                  />
                </div>
              </div>

              {doubts.length === 0 ? (
                <div className="glass-panel rounded-3xl p-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <HelpCircle size={40} className="text-slate-600" />
                  </div>
                  <h2 className="text-xl font-bold">No Doubts Yet</h2>
                  <p className="text-slate-500 max-w-md mx-auto">Your list of questions will appear here once you submit them from the dashboard.</p>
                  <button onClick={() => setActivePage('dashboard')} className="text-blue-600 font-bold hover:underline">Raise your first doubt</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {doubts
                    .filter(d => d.subject.toLowerCase().includes(searchTerm.toLowerCase()) || d.topic.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((doubt) => {
                      const answer = getAnswerForDoubt(doubt)
                      const pending = isPendingDoubt(doubt)
                      return (
                        <div key={doubt.id} className="glass-card-premium rounded-[2rem] overflow-hidden border border-slate-200">
                          <div className="p-8">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                              <div className="flex items-center gap-3">
                                <span className="bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border border-blue-500/10">{doubt.subject}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-400 font-medium text-sm">{doubt.topic}</span>
                              </div>
                              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border ${
                                pending
                                  ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                                  : 'bg-green-500/10 border-green-500/20 text-green-500'
                              }`}>
                                {pending ? <Clock size={14} /> : <CheckCircle2 size={14} />}
                                {pending ? 'PENDING' : 'RESOLVED'}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2 leading-snug">{doubt.question}</h3>
                                {doubt.attachment && (
                                  <a 
                                    href={doubt.attachment_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-300 transition-colors py-2"
                                  >
                                    <Paperclip size={14} /> View Attachment
                                  </a>
                                )}
                              </div>

                              {answer ? (
                                <div className="mt-8 relative pt-8 border-t border-slate-200">
                                  <div className="absolute top-0 -translate-y-1/2 left-4 bg-slate-50 px-4">
                                    <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">Instructor Response</span>
                                  </div>
                                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                    <p className="text-slate-600 leading-relaxed">{answer}</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-8 flex items-center gap-2 text-slate-500 italic text-sm">
                                  <AlertCircle size={16} />
                                  <span>Waiting for an instructor to review your question...</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          )}

          {activePage === 'ai' && (
            <div className="animate-in space-y-8">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <div className="w-20 h-20 bg-blue-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                  <Brain size={40} className="text-blue-600" />
                </div>
                <h1 className="text-4xl font-black mb-4">Knowledge Base</h1>
                <p className="text-slate-500 text-lg">Search through our repository of solved doubts and educational resources verified by experts.</p>
              </div>

              {kbBrowse.subjects?.length > 0 && (
                <div className="max-w-5xl mx-auto mb-8 flex flex-wrap gap-2">
                  {kbBrowse.subjects.map((s) => (
                    <button key={s.subject} type="button" onClick={() => { setKbSubject(s.subject); setKbTopic(''); searchKnowledgeBase() }} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-400 hover:border-blue-500">{s.subject} ({s.total})</button>
                  ))}
                </div>
              )}

              <div className="max-w-3xl mx-auto mb-12">
                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={24} />
                  <input
                    type="text"
                    placeholder="Semantic search across resolved doubts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchKnowledgeBase()}
                    className="input-premium w-full pl-16 pr-32 py-6 rounded-[2rem] text-lg font-medium"
                  />
                  <button
                    onClick={searchKnowledgeBase}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {knowledgeResults.length === 0 ? (
                  <div className="md:col-span-2 text-center py-20 text-slate-600">No resources found. Try a different query.</div>
                ) : (
                  knowledgeResults.map((item) => (
                    <div key={item.id} className="glass-card-premium p-8 rounded-[2rem] flex flex-col h-full border border-slate-200">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">{item.subject}</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-4 flex-1 leading-tight">{item.question}</h3>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-6">
                        <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">{item.answer}</p>
                      </div>
                      <button className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:gap-3 transition-all mt-auto group">
                        Read Full Resolution <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  ))
                )}
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

                <h1 className="text-4xl font-black mb-2">{user.full_name || user.username || 'Student Name'}</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-10">{user.role || 'Student'}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                  {[
                    { label: 'Username', value: user.username, icon: Hash },
                    { label: 'Email Address', value: user.contact_email || user.email, icon: Mail },
                    { label: 'Roll Number', value: user.roll_number, icon: Hash },
                    { label: 'Department', value: user.department, icon: BookOpen },
                    { label: 'Year of Study', value: user.year_of_study, icon: Calendar },
                    { label: 'Section', value: user.section, icon: Hash },
                    { label: 'Contact', value: user.mobile, icon: Phone },
                    { label: 'Preferences', value: user.notification_preference, icon: Bell },
                  ].map((field, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <field.icon size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{field.label}</p>
                        <p className="font-bold text-slate-800">{field.value || 'Not provided'}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="mt-12 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 mx-auto">
                  Edit Account Settings <ExternalLink size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default StudentDashboard