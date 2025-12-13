import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // <--- NEW STATE
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://entebus-api.onrender.com/api/auth/register', { name, email, password });
      alert('Registration Successful! Please Login.');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || 'Registration Failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-black text-gray-900 mb-2">Create Account</h2>
        <p className="text-gray-500 mb-8">Join us to book your journey instantly.</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-3">
            <User className="text-gray-400" size={20} />
            <input 
              placeholder="Full Name" 
              className="bg-transparent w-full outline-none font-medium"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-3">
            <Mail className="text-gray-400" size={20} />
            <input 
              type="email" 
              placeholder="Email Address" 
              className="bg-transparent w-full outline-none font-medium"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-3">
            <Lock className="text-gray-400" size={20} />
            <input 
              type={showPassword ? "text" : "password"} // <--- TOGGLE TYPE
              placeholder="Password" 
              className="bg-transparent w-full outline-none font-medium"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {/* TOGGLE ICON */}
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
            Register Now
          </button>
        </form>

        <p className="text-center mt-6 text-gray-500">
          Already have an account? <Link to="/login" className="text-indigo-600 font-bold">Login</Link>
        </p>
      </div>
    </div>
  );
}