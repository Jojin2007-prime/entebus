import React, { useState, useEffect } from 'react'; // Added useEffect
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom'; // Added useLocation
import { toast } from 'react-toastify';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';

export default function ResetPassword() {
  const { state } = useLocation(); // Catch the state (email) passed from Login.jsx
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- ✅ NEW LOGIC: Auto-fill email if passed from Login page ---
  useEffect(() => {
    if (state?.email) {
      setEmail(state.email);
    }
  }, [state]);

  const handleReset = async (e) => {
    e.preventDefault();

    // --- Validation Checks ---
    if (!email.trim()) {
      toast.error('Please enter your registered email address.');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long!');
      return;
    }
    // -------------------------

    setLoading(true);
    try {
      // Sending lowercase email to ensure consistency with backend fix
      const response = await axios.post('https://entebus-api.onrender.com/api/auth/reset-password', { 
        email: email.toLowerCase().trim(), 
        newPassword 
      });

      toast.success(response.data.message || 'Password updated successfully!');
      
      // --- ✅ LOGIC: Save email for auto-fill on Login page after redirect ---
      localStorage.setItem('resetEmail', email.toLowerCase().trim());
      
      // Delay redirect so user can see the success message
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      // Pull specific error message (e.g., "No account found") from server.js
      const errorMessage = err.response?.data?.message || 'Failed to reset password. Please check the email.';
      toast.error(errorMessage);
      console.error('Reset Error Details:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl w-full max-w-md border border-transparent dark:border-slate-700 transition-colors">
        
        {/* Navigation Back */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-indigo-500 font-bold text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Login
        </Link>

        {/* Visual Header */}
        <div className="bg-orange-100 dark:bg-orange-500/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
          <KeyRound className="text-orange-600 dark:text-orange-400" size={28} />
        </div>

        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Reset Password</h2>
        <p className="text-gray-500 dark:text-slate-400 mb-8 font-medium">
          Enter your registered email to update your credentials.
        </p>

        <form onSubmit={handleReset} className="space-y-4">
          {/* Email Input */}
          <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center gap-3 focus-within:border-indigo-500 transition-colors">
            <div className="text-gray-400 dark:text-slate-500"><Mail size={20} /></div>
            <input 
              type="email" 
              placeholder="Registered Email" 
              className="bg-transparent w-full outline-none font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          {/* New Password Input */}
          <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center gap-3 focus-within:border-indigo-500 transition-colors">
            <div className="text-gray-400 dark:text-slate-500"><Lock size={20} /></div>
            <input 
              type={showPassword ? "text" : "password"}
              placeholder="New Password (min 8 chars)" 
              className="bg-transparent w-full outline-none font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="text-gray-400 hover:text-indigo-500 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Action Button */}
          <button 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Verify & Update Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}