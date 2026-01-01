import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify'; 
import { User, Lock, Mail, Eye, EyeOff, UserPlus, ArrowLeft, Bus } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('https://entebus-api.onrender.com/api/auth/register', { name, email, password });
      toast.success("Registration Successful! Please Login."); 
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration Failed! Email might already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] flex items-center justify-center p-6 transition-colors duration-300">
      <div className="max-w-md w-full animate-in fade-in duration-700">
        
        {/* Navigation Link */}
        <Link to="/login-options" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 font-bold text-xs uppercase tracking-widest mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Login
        </Link>

        {/* --- Main Card --- */}
        <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] shadow-2xl w-full border border-transparent dark:border-slate-700 transition-colors">
          
          <div className="mb-8 text-center md:text-left">
            {/* Themed Icon Box */}
            <div className="bg-indigo-100 dark:bg-indigo-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto md:mx-0 shadow-sm">
               <Bus className="text-indigo-600 dark:text-indigo-400" size={32} />
            </div>

            {/* Typography: Black, Italic, Uppercase, Tracking-Tighter */}
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white leading-none">
              Create Account
            </h2>
            <p className="text-gray-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-3 opacity-70">
              Join us to book your journey instantly.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            
            {/* Full Name Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-1 tracking-widest">Full Name</label>
              <div className="bg-gray-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 flex items-center gap-3 transition-all focus-within:ring-2 ring-indigo-500 shadow-inner">
                <div className="text-gray-400 dark:text-slate-500"><User size={20} /></div>
                <input 
                  placeholder="Enter your name" 
                  className="bg-transparent w-full outline-none font-bold text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-slate-600"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-1 tracking-widest">Email Address</label>
              <div className="bg-gray-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 flex items-center gap-3 transition-all focus-within:ring-2 ring-indigo-500 shadow-inner">
                <div className="text-gray-400 dark:text-slate-500"><Mail size={20} /></div>
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="bg-transparent w-full outline-none font-bold text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-slate-600"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-1 tracking-widest">Security Password</label>
              <div className="bg-gray-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 flex items-center gap-3 transition-all focus-within:ring-2 ring-indigo-500 shadow-inner">
                <div className="text-gray-400 dark:text-slate-500"><Lock size={20} /></div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="bg-transparent w-full outline-none font-bold text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-slate-600"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-indigo-400 transition-colors">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Enhanced Register Button */}
            <button 
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden bg-indigo-600 text-white py-5 rounded-2xl flex items-center justify-center transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-70 shadow-xl shadow-indigo-500/20"
            >
              <span className={`flex items-center gap-2 font-black italic uppercase tracking-tighter text-xl ${loading ? 'opacity-0' : 'opacity-100'}`}>
                Register Now <UserPlus size={22}/>
              </span>
              
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center mt-8 text-gray-500 dark:text-slate-400 font-black text-[11px] uppercase tracking-widest">
            Already have an account? <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline ml-1">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}