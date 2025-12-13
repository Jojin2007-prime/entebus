import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // <--- NEW STATE
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
        localStorage.setItem('admin', 'true'); // Keeps you logged in even after refresh
        window.location.href = "/admin"; // Force reload to update Navbar
      } else {
        alert('Invalid Credentials');
      }
    } catch (err) {
      alert('Login Failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
            <Shield size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-900">Admin Portal</h2>
          <p className="text-gray-500">Authorized personnel only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <User className="text-gray-400" size={20} />
            <input 
              className="bg-transparent w-full outline-none font-medium" 
              placeholder="Username" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
            />
          </div>
          
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <Lock className="text-gray-400" size={20} />
            <input 
              type={showPassword ? "text" : "password"} // <--- TOGGLE TYPE
              className="bg-transparent w-full outline-none font-medium" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
            {/* TOGGLE ICON */}
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition shadow-lg shadow-red-200">
            Access Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}