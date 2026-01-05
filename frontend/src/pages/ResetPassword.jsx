import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();

    // Enforce 8-character minimum for the new password
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long!');
      return;
    }

    setLoading(true);
    try {
      await axios.post('https://entebus-api.onrender.com/api/auth/reset-password', { 
        email, 
        newPassword 
      });

      toast.success('Password updated successfully! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password. Check the email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl w-full max-w-md transition-colors border border-transparent dark:border-slate-700">
        
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-indigo-500 font-bold text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <div className="bg-orange-100 dark:bg-orange-500/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
          <KeyRound className="text-orange-600 dark:text-orange-400" size={28} />
        </div>

        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Reset Password</h2>
        <p className="text-gray-500 dark:text-slate-400 mb-8">Enter your registered email and a new password.</p>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center gap-3">
            <div className="text-gray-400 dark:text-slate-500"><Mail size={20} /></div>
            <input 
              type="email" 
              placeholder="Email Address" 
              className="bg-transparent w-full outline-none font-medium text-gray-900 dark:text-white"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center gap-3">
            <div className="text-gray-400 dark:text-slate-500"><Lock size={20} /></div>
            <input 
              type={showPassword ? "text" : "password"}
              placeholder="New Password (min 8 chars)" 
              className="bg-transparent w-full outline-none font-medium text-gray-900 dark:text-white"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}