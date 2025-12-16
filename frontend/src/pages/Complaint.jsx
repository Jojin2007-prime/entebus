import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export default function Complaint() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // ✅ UPDATED: Your actual Backend URL is now here
  const API_URL = "https://entebus-api.onrender.com"; 

  const [formData, setFormData] = useState({
    name: user ? user.name : '',
    email: user ? user.email : '',
    category: 'Travel Experience',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Sending the complaint to your Render backend
      await axios.post(`${API_URL}/api/complaints/add`, {
        ...formData,
        userId: user ? user._id : null
      });
      toast.success("Complaint submitted successfully!");
      navigate('/');
    } catch (err) {
      console.error("Submission Error:", err);
      toast.error("Failed to submit complaint. Check internet connection.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 px-4 transition-colors duration-300">
      <div className="max-w-md mx-auto bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Register a Complaint</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Full Name</label>
            <input 
              type="text" 
              required
              className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Issue Category</label>
            <select 
              className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option>Travel Experience</option>
              <option>Payment Issue</option>
              <option>Bus Condition</option>
              <option>Staff Behavior</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Description</label>
            <textarea 
              required
              rows="4"
              className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
              placeholder="Describe your issue in detail..."
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
            ></textarea>
          </div>

          <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition shadow-md hover:shadow-lg">
            Submit Complaint
          </button>
        </form>
      </div>
    </div>
  );
}