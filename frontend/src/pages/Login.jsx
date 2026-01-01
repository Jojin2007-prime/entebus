import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify'; 
import { User, Lock, Eye, EyeOff, AlertTriangle, LogOut } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  
  // Check if Admin is currently logged in
  const isAdminLoggedIn = localStorage.getItem('admin');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://entebus-api.onrender.com/api/auth/login', { email, password });
      
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('token', res.data.token);
      
      toast.success(`Welcome back, ${res.data.user.name}!`);

      navigate('/');
      setTimeout(() => {
        window.location.reload(); 
      }, 1500); 
      
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login Failed. Check your password.');
    }
  };

  // Function to logout admin and refresh so user can login
  const handleAdminSwitch = () => {
    localStorage.removeItem('admin'); 
    window.location.reload(); 
  };

  // --- SCENARIO 1: ADMIN IS LOGGED IN (Show Warning) ---
  if (isAdminLoggedIn) {
    return (
      // Update 1: Background
      <div className="min-h-screen bg-red-50 dark:bg-red-950/30 flex items-center justify-center p-6 transition-colors duration-300">
        {/* Update 2: Card */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border-t-8 border-red-500 transition-colors">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 dark:bg-red-900/50 p-4 rounded-full text-red-600 dark:text-red-400">
              <AlertTriangle size={48} />
            </div>
          </div>
          
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Admin Session Active</h1>
          <p className="text-gray-600 dark:text-slate-300 mb-8 leading-relaxed">
            You are currently logged in as an <strong>Administrator</strong>. 
            To sign in as a User, you must switch accounts.
          </p>

          <button 
            onClick={handleAdminSwitch}
            className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-lg shadow-red-200 dark:shadow-none"
          >
            <LogOut size={20} /> Logout Admin & Login as User
          </button>
          
          <button 
            onClick={() => navigate('/admin')}
            className="w-full mt-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 py-4 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition"
          >
            Cancel (Go to Dashboard)
          </button>
        </div>
      </div>
    );
  }

  // --- SCENARIO 2: NORMAL LOGIN FORM (For Guests) ---
  return (
    // Update 3: Background
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors duration-300">
      {/* Update 4: Card */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl w-full max-w-md transition-colors">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Welcome Back</h2>
        <p className="text-gray-500 dark:text-slate-400 mb-8">Please enter your details to sign in.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Input */}
          <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center gap-3 transition-colors">
            <div className="text-gray-400 dark:text-slate-500"><User size={20} /></div>
            <input 
              type="email" 
              placeholder="Email Address" 
              className="bg-transparent w-full outline-none font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input */}
          <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center gap-3 transition-colors">
            <div className="text-gray-400 dark:text-slate-500"><Lock size={20} /></div>
            <input 
              type={showPassword ? "text" : "password"}
              placeholder="Password" 
              className="bg-transparent w-full outline-none font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button className="w-full bg-gray-900 dark:bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-black dark:hover:bg-indigo-500 transition shadow-lg shadow-gray-200 dark:shadow-none">
            Sign In
          </button>
        </form>

        <p className="text-center mt-6 text-gray-500 dark:text-slate-400">
          Don't have an account? <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}