import React, { useEffect, useState } from 'react'
import api from '../api'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  UserCheck, 
  Clock, 
  UsersRound, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle,
  PlusCircle,
  TrendingUp,
  Shield,
  LogOut,
  Mail,
  User,
  Hash,
  BookOpen,
  Briefcase,
  Smartphone,
  Lock,
  ArrowRight,
  Trash2
} from 'lucide-react'
import { toast } from 'react-toastify'

function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({})
  const [users, setUsers] = useState([])
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    userId: null,
    username: '',
    role: ''
  })
  const [faculty, setFaculty] = useState({
    full_name: '',
    username: '',
    email: '',
    employee_id: '',
    department: '',
    designation: '',
    subject_expertise: '',
    mobile: '',
    password: ''
  })

  useEffect(() => {
    const admin = localStorage.getItem('admin')
    if (!admin) {
      navigate('/admin-login')
      return
    }
    fetchStats()
    fetchUsers()
    
    const interval = setInterval(() => {
      fetchStats()
      fetchUsers()
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [navigate])

  const fetchStats = async () => {
    try {
      const response = await api.get('users/admin-dashboard/')
      setStats(response.data)
    } catch (error) {
      console.log('Error fetching stats:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await api.get('users/list-users/')
      setUsers(response.data)
    } catch (error) {
      console.log('Error fetching users:', error)
    }
  }

  const triggerDelete = (userId, username, role) => {
    setDeleteConfirm({
      isOpen: true,
      userId,
      username,
      role
    })
  }

  const confirmDelete = async () => {
    try {
      const { userId, username, role } = deleteConfirm
      const response = await api.delete(`users/delete-user/${userId}/`)
      toast.success(response.data.message || 'User deleted successfully')
      setDeleteConfirm({ isOpen: false, userId: null, username: '', role: '' })
      fetchStats()
      fetchUsers()
    } catch (error) {
      console.log('Error deleting user:', error)
      toast.error(error.response?.data?.message || 'Failed to delete user account')
      setDeleteConfirm({ isOpen: false, userId: null, username: '', role: '' })
    }
  }

  const handleChange = (e) => {
    setFaculty({ ...faculty, [e.target.name]: e.target.value })
  }

  const createFaculty = async (e) => {
    e.preventDefault()
    try {
      await api.post('users/create-faculty/', faculty)
      toast.success('Faculty Account Created Successfully')
      setFaculty({
        full_name: '',
        username: '',
        email: '',
        employee_id: '',
        department: '',
        designation: '',
        subject_expertise: '',
        mobile: '',
        password: ''
      })
      fetchStats()
      fetchUsers()
    } catch (error) {
      console.log('Error creating faculty:', error)
      toast.error('Failed To Create Faculty Account')
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  return (
    <div className="min-h-screen page-shell text-slate-800 p-6 lg:p-12">
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[-5%] right-[-5%] w-[30%] h-[30%] rounded-full bg-blue-600/5 blur-[100px]"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] rounded-full bg-blue-600/5 blur-[100px]"></div>
      </div>

      {/* TOP BAR */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 animate-in">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Shield size={20} />
            </div>
            <span className="text-xs font-black tracking-widest text-blue-500 uppercase">System Administration</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight">Admin <span className="text-gradient">Console</span></h1>
          <p className="text-slate-500 mt-2 font-medium">Control and monitor the entire system from one hub.</p>
        </div>

        <button
          onClick={handleLogout}
          className="bg-slate-50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-200 hover:border-red-500/20 px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2"
        >
          <LogOut size={18} />
          <span>Secure Sign Out</span>
        </button>
      </header>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-12 animate-in" style={{ animationDelay: '0.1s' }}>
        {[
          { label: 'Students', value: stats.students, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Faculty', value: stats.teachers, icon: UserCheck, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Total Users', value: stats.total_users, icon: UsersRound, color: 'text-slate-400', bg: 'bg-slate-50' },
          { label: 'Pending', value: stats.pending_doubts, icon: HelpCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Resolved', value: stats.answered_doubts, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Avg Time', value: `${stats.average_resolution_time || 0}m`, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'SLA Risk', value: stats.sla_risk_doubts, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map((stat, i) => (
          <div key={i} className="glass-card-premium p-6 rounded-3xl border border-slate-200">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color} mb-4`}>
              <stat.icon size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-black mt-1">{stat.value || 0}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 animate-in" style={{ animationDelay: '0.2s' }}>
        {/* TOPICS ANALYTICS */}
        <div className="lg:col-span-1 glass-panel p-8 rounded-[2.5rem] border border-slate-200">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="text-blue-500" size={24} />
            <h2 className="text-2xl font-black">Hot Topics</h2>
          </div>
          
          <div className="space-y-4">
            {stats.common_topics && stats.common_topics.length > 0 ? (
              stats.common_topics.map((item, i) => (
                <div key={i} className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center group hover:bg-blue-500/5 transition-colors border border-slate-200 hover:border-blue-500/20">
                  <span className="text-slate-600 font-bold group-hover:text-blue-300 transition-colors">{item.topic || 'General'}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-600 uppercase">{item.count} Doubts</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-slate-600 font-medium italic">No topic data available yet.</p>
            )}
          </div>
        </div>

        {/* CREATE FACULTY FORM */}
        <div className="lg:col-span-2 glass-panel p-8 lg:p-10 rounded-[2.5rem] border border-slate-200">
          <div className="flex items-center gap-3 mb-8">
            <PlusCircle className="text-blue-500" size={24} />
            <h2 className="text-2xl font-black">Provision Faculty</h2>
          </div>

          <form onSubmit={createFaculty} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="text" name="full_name" placeholder="Dr. Alice Smith" value={faculty.full_name} onChange={handleChange} className="input-premium w-full pl-12 pr-4 py-4 rounded-2xl text-sm" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Username</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="text" name="username" placeholder="alice_smith" value={faculty.username} onChange={handleChange} className="input-premium w-full pl-12 pr-4 py-4 rounded-2xl text-sm" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Official Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="email" name="email" placeholder="alice@university.edu" value={faculty.email} onChange={handleChange} className="input-premium w-full pl-12 pr-4 py-4 rounded-2xl text-sm" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Employee ID</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="text" name="employee_id" placeholder="EMP-9021" value={faculty.employee_id} onChange={handleChange} className="input-premium w-full pl-12 pr-4 py-4 rounded-2xl text-sm" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Department</label>
              <div className="relative">
                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="text" name="department" placeholder="Quantum Physics" value={faculty.department} onChange={handleChange} className="input-premium w-full pl-12 pr-4 py-4 rounded-2xl text-sm" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Designation</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="text" name="designation" placeholder="Assoc. Professor" value={faculty.designation} onChange={handleChange} className="input-premium w-full pl-12 pr-4 py-4 rounded-2xl text-sm" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Expertise</label>
              <div className="relative">
                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="text" name="subject_expertise" placeholder="Thermodynamics, Optics" value={faculty.subject_expertise} onChange={handleChange} className="input-premium w-full pl-12 pr-4 py-4 rounded-2xl text-sm" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Mobile</label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="text" name="mobile" placeholder="+1 234 567 890" value={faculty.mobile} onChange={handleChange} className="input-premium w-full pl-12 pr-4 py-4 rounded-2xl text-sm" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="password" name="password" placeholder="••••••••" value={faculty.password} onChange={handleChange} className="input-premium w-full pl-12 pr-4 py-4 rounded-2xl text-sm" required />
              </div>
            </div>

            <div className="md:col-span-2 pt-4">
              <button type="submit" className="btn-premium w-full py-5 rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-3 group">
                Establish Faculty Account
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* USERS REGISTRY */}
      <div className="glass-panel p-8 lg:p-10 rounded-[2.5rem] border border-slate-200 animate-in mt-12" style={{ animationDelay: '0.3s' }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900">User Registry</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">Manage all student and faculty accounts in the system.</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-2xl flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 font-extrabold shadow-sm">
              Active: {users.length} Users
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white/50 backdrop-blur-md">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-wider">User Details</th>
                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-wider">Account Role</th>
                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-wider">Department / Expertise</th>
                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-wider">Identifier / Mobile</th>
                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-500 italic font-medium">
                    No registered student or faculty accounts found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors last:border-0">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-black text-sm">
                          {u.full_name ? u.full_name.charAt(0).toUpperCase() : u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.full_name || 'No full name'}</p>
                          <p className="text-xs text-slate-500 font-medium">@{u.username} • {u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase ${
                        u.role === 'admin'
                          ? 'bg-red-500/10 text-red-600 border border-red-500/10'
                          : u.role === 'teacher' 
                            ? 'bg-blue-500/10 text-blue-600 border border-blue-500/10' 
                            : 'bg-green-500/10 text-green-600 border border-green-500/10'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          u.role === 'admin' 
                            ? 'bg-red-500' 
                            : u.role === 'teacher' 
                              ? 'bg-blue-500' 
                              : 'bg-green-500'
                        }`}></div>
                        {u.role === 'admin' ? 'Admin' : u.role === 'teacher' ? 'Faculty' : 'Student'}
                      </span>
                    </td>
                    <td className="p-5">
                      <p className="text-sm font-bold text-slate-800">{u.department || 'General'}</p>
                      {u.role === 'teacher' && u.subject_expertise && (
                        <p className="text-xs text-slate-600 font-medium mt-0.5">{u.subject_expertise}</p>
                      )}
                    </td>
                    <td className="p-5">
                      <p className="text-sm font-bold text-slate-800">
                        {u.role === 'admin' ? 'N/A' : u.role === 'teacher' ? (u.employee_id || 'N/A') : (u.roll_number || 'N/A')}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{u.mobile || 'No contact mobile'}</p>
                    </td>
                    <td className="p-5 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => triggerDelete(u.id, u.username, u.role)}
                          className="p-3 bg-red-50 hover:bg-red-500/10 text-red-500 border border-red-200 hover:border-red-500/20 rounded-2xl transition-all inline-flex items-center justify-center hover:scale-105"
                          title={`Delete ${u.username}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 transition-all duration-300">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 max-w-md w-full shadow-2xl transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-6">
              <Trash2 size={32} />
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-2">Delete Account?</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Are you sure you want to permanently delete the {deleteConfirm.role} account <strong className="text-slate-900">@{deleteConfirm.username}</strong>? This action is irreversible.
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, userId: null, username: '', role: '' })}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-xl transition-all text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-500/20 text-sm cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard