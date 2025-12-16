import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // 1. AUTO-REDIRECT: If already logged in, go straight to Dashboard
  useEffect(() => {
    if (localStorage.getItem('admin')) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://entebus-api.onrender.com/api/admin/login', { username, password });
      if (res.data.success) {
        localStorage.setItem('admin', 'true'); // Keeps you logged in
        window.location.href = "/admin"; // Force reload to update Navbar
      } else {
        alert('Invalid Credentials');
      }
    } catch (err) {
      alert('Login Failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-slate-700">
        
        <div className="text-center mb-8">
          <div className="bg-red-100 dark:bg-red-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-500">
            <Shield size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Admin Portal</h2>
          <p className="text-gray-500 dark:text-slate-400">Authorized personnel only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-700 p-3 rounded-xl border border-gray-200 dark:border-slate-600 transition-colors">
            <User className="text-gray-400 dark:text-slate-400" size={20} />
            <input 
              className="bg-transparent w-full outline-none font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500" 
              placeholder="Username" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
            />
          </div>
          
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-700 p-3 rounded-xl border border-gray-200 dark:border-slate-600 transition-colors">
            <Lock className="text-gray-400 dark:text-slate-400" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              className="bg-transparent w-full outline-none font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 transition">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition shadow-lg shadow-red-200 dark:shadow-none">
            Access Dashboard
          </button>
        </form>

      </div>
    </div>
  );
}