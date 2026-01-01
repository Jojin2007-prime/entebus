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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors duration-300">
      <div className="max-w-md w-full animate-in fade-in duration-700">
        
        {/* Back Link */}
        <Link to="/login-options" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs uppercase tracking-widest mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Gateway
        </Link>

        {/* --- Main Card --- */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-2xl w-full border border-transparent dark:border-slate-700 transition-colors">
          
          <div className="mb-8 text-center md:text-left">
            {/* ✅ LOGO ICON ADDED TO MATCH IMAGE STYLE */}
            <div className="bg-indigo-100 dark:bg-indigo-900/30 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto md:mx-0">
               <Bus className="text-indigo-600 dark:text-indigo-400" size={32} />
            </div>

            {/* ✅ TYPOGRAPHY APPLIED HERE: font-black, italic, uppercase, tracking-tighter */}
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white leading-none">
              Create Account
            </h2>
            <p className="text-gray-500 dark:text-slate-400 font-medium mt-2">
              Join us to book your journey instantly.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            
            {/* Full Name Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-1 tracking-widest">Full Name</label>
              <div className="bg-gray-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 flex items-center gap-3 transition-all focus-within:ring-2 ring-indigo-500">
                <div className="text-gray-400 dark:text-slate-500"><User size={20} /></div>
                <input 
                  placeholder="Enter your name" 
                  className="bg-transparent w-full outline-none font-medium text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-slate-600"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-1 tracking-widest">Email Address</label>
              <div className="bg-gray-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 flex items-center gap-3 transition-all focus-within:ring-2 ring-indigo-500">
                <div className="text-gray-400 dark:text-slate-500"><Mail size={20} /></div>
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="bg-transparent w-full outline-none font-medium text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-slate-600"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-1 tracking-widest">Security Password</label>
              <div className="bg-gray-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 flex items-center gap-3 transition-all focus-within:ring-2 ring-indigo-500">
                <div className="text-gray-400 dark:text-slate-500"><Lock size={20} /></div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="bg-transparent w-full outline-none font-medium text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-slate-600"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Register Button */}
            <button 
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl shadow-indigo-200 dark:shadow-none active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Register Now <UserPlus size={20}/></>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center mt-8 text-gray-500 dark:text-slate-400 font-bold text-sm">
            Already have an account? <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}