import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, Plus, LogOut, Edit, Trash2, ClipboardList, 
  Users, ArrowRight, History, Mail, Phone, MessageSquareWarning, CheckCircle, Bus 
} from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data State
  const [bookings, setBookings] = useState([]);
  const [buses, setBuses] = useState([]);
  const [complaints, setComplaints] = useState([]); 

  // Manifest State
  const [manifestBusId, setManifestBusId] = useState('');
  const [manifestDate, setManifestDate] = useState('');
  const [manifestData, setManifestData] = useState([]);

  // Form State
  const [formData, setFormData] = useState({ 
    name: '', registrationNumber: '', from: '', to: '', 
    departureTime: '', price: '', driverName: '', driverContact: '' 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const API_URL = "https://entebus-api.onrender.com";

  useEffect(() => {
    if (!localStorage.getItem('admin')) navigate('/admin-login');
    else { 
      fetchBookings(); 
      fetchBuses(); 
      fetchComplaints();
    }
  }, [navigate]);

  const formatTime = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    const period = +hours >= 12 ? 'PM' : 'AM';
    const hours12 = (+hours % 12) || 12;
    return `${hours12}:${minutes} ${period}`;
  };

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/bookings`);
      setBookings(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchBuses = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/buses`);
      setBuses(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/complaints/all`);
      setComplaints(res.data);
    } catch (err) { console.error("Error fetching complaints", err); }
  };

  const handleResolveComplaint = async (id) => {
    try {
      await axios.put(`${API_URL}/api/complaints/resolve/${id}`);
      fetchComplaints(); 
      alert("Issue marked as Resolved ✅");
    } catch (err) { alert("Error updating status"); }
  };
  
  const handleBusSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`${API_URL}/api/buses/${editId}`, formData);
        alert('✅ Bus Updated Successfully!');
        setIsEditing(false); 
        setEditId(null);
      } else {
        await axios.post(`${API_URL}/api/buses`, formData);
        alert('✅ New Bus Added!');
      }
      setFormData({ name: '', registrationNumber: '', from: '', to: '', departureTime: '', price: '', driverName: '', driverContact: '' });
      fetchBuses();
    } catch (err) { alert('Error saving bus details'); }
  };

  const handleEditClick = (bus) => {
    setFormData({
      name: bus.name, 
      registrationNumber: bus.registrationNumber || '', 
      from: bus.from, 
      to: bus.to,
      departureTime: bus.departureTime, 
      price: bus.price, 
      driverName: bus.driverName || '', 
      driverContact: bus.driverContact || ''
    });
    setEditId(bus._id); 
    setIsEditing(true); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBus = async (id) => {
    if (window.confirm("Are you sure you want to delete this bus route? This action cannot be undone.")) {
      try {
        await axios.delete(`${API_URL}/api/buses/${id}`);
        fetchBuses();
      } catch (err) { alert("Error deleting bus"); }
    }
  };

  const handleFetchManifest = async () => {
    if (!manifestBusId || !manifestDate) return alert("Please select both a Bus and a Date.");
    try {
      const res = await axios.get(`${API_URL}/api/admin/manifest?busId=${manifestBusId}&date=${manifestDate}`);
      setManifestData(res.data);
    } catch (err) { alert("Error fetching manifest data"); }
  };

  const handleLogout = () => { 
    localStorage.removeItem('admin'); 
    navigate('/'); 
  };

  const processedManifest = manifestData.flatMap(booking => 
    booking.seatNumbers.map(seat => ({
      seat,
      name: booking.customerName || "Guest",
      email: booking.customerEmail || "N/A",  
      phone: booking.customerPhone || "N/A",  
      status: 'CONFIRMED',
      id: booking._id
    }))
  ).sort((a, b) => a.seat - b.seat);

  return (
    <div className="p-6 md:p-10 bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-black flex items-center gap-2 text-gray-800 dark:text-white">
          <Shield className="text-red-600" size={32}/> Admin Panel
        </h1>
        
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-colors overflow-x-auto">
           <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab==='dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>Dashboard</button>
           <button onClick={() => setActiveTab('manifest')} className={`px-6 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab==='manifest' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>Manifest</button>
           <button onClick={() => setActiveTab('complaints')} className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab==='complaints' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
             <MessageSquareWarning size={16} /> Complaints
             {complaints.filter(c => c.status === 'Pending').length > 0 && (
               <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{complaints.filter(c => c.status === 'Pending').length}</span>
             )}
           </button>
        </div>

        <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold bg-white dark:bg-slate-800 px-5 py-2.5 rounded-xl border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 transition-all shadow-sm">
          <LogOut size={18} /> Logout
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
             <Link to="/admin/history" className="p-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-3 text-center group cursor-pointer no-underline">
                <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full text-orange-600 dark:text-orange-400 group-hover:bg-orange-600 group-hover:text-white transition">
                   <History size={24}/>
                </div>
                <div>
                   <h3 className="font-bold text-gray-800 dark:text-white">Trip History</h3>
                   <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">View past trips & revenue</p>
                </div>
             </Link>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 mb-10 transition-colors">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-white">
              {isEditing ? <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400"><Edit size={24}/></div> : <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400"><Plus size={24}/></div>}
              {isEditing ? 'Edit Bus Route' : 'Add New Bus Route'}
            </h3>
            <form onSubmit={handleBusSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {[
                { label: 'Bus Name', value: 'name', placeholder: 'e.g. KSRTC Super Fast', col: 'md:col-span-2' },
                { label: 'Registration Number', value: 'registrationNumber', placeholder: 'e.g. KL-15-A-1234', col: 'md:col-span-2' },
                { label: 'From', value: 'from', placeholder: 'Origin' },
                { label: 'To', value: 'to', placeholder: 'Destination' },
                { label: 'Departure Time', value: 'departureTime', type: 'time' },
                { label: 'Ticket Price', value: 'price', type: 'number', placeholder: '₹ Amount' },
                { label: 'Driver Name', value: 'driverName', placeholder: 'Driver Name', col: 'md:col-span-2' },
                { label: 'Driver Contact', value: 'driverContact', placeholder: 'Phone Number', col: 'md:col-span-2' },
              ].map((field, idx) => (
                <div key={idx} className={field.col || ''}>
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-1">{field.label}</label>
                  <input type={field.type || 'text'} className="w-full p-3 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl focus:ring-2 ring-indigo-500 outline-none transition-colors" placeholder={field.placeholder} value={formData[field.value]} onChange={e => setFormData({...formData, [field.value]: e.target.value})} required />
                </div>
              ))}
              <div className="col-span-full flex gap-3 mt-4">
                <button className="flex-1 bg-gray-900 dark:bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-black dark:hover:bg-indigo-500 transition shadow-lg shadow-gray-200 dark:shadow-none">{isEditing ? 'Update Bus Details' : 'Add New Bus'}</button>
                {isEditing && (<button type="button" onClick={() => { setIsEditing(false); setFormData({}); }} className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-200 px-8 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition">Cancel</button>)}
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 mb-10 transition-colors">
              <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Fleet Management</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 dark:bg-slate-700/50 text-xs uppercase text-gray-500 dark:text-slate-400 tracking-wider">
                    <tr>
                      <th className="p-4 rounded-tl-xl">Bus Details</th>
                      <th className="p-4">Route</th>
                      <th className="p-4">Schedule</th>
                      <th className="p-4">Driver</th>
                      <th className="p-4 rounded-tr-xl">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {buses.map(b => (
                      <tr key={b._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                        <td className="p-4"><p className="font-bold text-gray-900 dark:text-white">{b.name}</p><p className="text-xs font-mono text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 inline-block px-2 py-0.5 rounded mt-1">{b.registrationNumber}</p></td>
                        <td className="p-4"><div className="flex items-center gap-2 font-medium text-gray-700 dark:text-slate-300">{b.from} <ArrowRight size={14} className="text-gray-400 dark:text-slate-500"/> {b.to}</div></td>
                        <td className="p-4"><span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold font-mono">{formatTime(b.departureTime)}</span></td>
                        <td className="p-4 text-sm text-gray-600 dark:text-slate-400">{b.driverName} <br/> <span className="text-xs text-gray-400 dark:text-slate-500">{b.driverContact}</span></td>
                        <td className="p-4"><div className="flex gap-2"><button onClick={() => handleEditClick(b)} className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"><Edit size={18}/></button><button onClick={() => handleDeleteBus(b._id)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition"><Trash2 size={18}/></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </div>
        </div>
      )}

      {activeTab === 'manifest' && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 animate-in slide-in-from-right-4 duration-500 transition-colors">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100 dark:border-slate-700">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl text-indigo-600 dark:text-indigo-400"><ClipboardList size={32}/></div>
            <div><h3 className="text-2xl font-black text-gray-900 dark:text-white">Passenger Manifest</h3><p className="text-gray-500 dark:text-slate-400">Generate passenger lists for specific trips.</p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-gray-50 dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-2 block">Select Bus Route</label>
                <div className="relative">
                  <select className="w-full p-4 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white appearance-none outline-none focus:ring-2 ring-indigo-500 cursor-pointer" onChange={(e) => setManifestBusId(e.target.value)}>
                    <option value="">-- Choose Bus --</option>
                    {buses.map(b => <option key={b._id} value={b._id}>{b.name} ({b.from} - {b.to})</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-2 block">Select Travel Date</label>
                <input type="date" className="w-full p-4 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 ring-indigo-500 cursor-pointer dark:color-scheme-dark" onChange={(e) => setManifestDate(e.target.value)} />
              </div>
              <div className="flex items-end"><button onClick={handleFetchManifest} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-none">Generate List</button></div>
          </div>
          {manifestData.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
              <table className="w-full text-left">
                <thead className="bg-gray-800 dark:bg-slate-950 text-white">
                  <tr><th className="p-4 font-bold uppercase text-xs tracking-wider">Seat</th><th className="p-4 font-bold uppercase text-xs tracking-wider">Passenger Name</th><th className="p-4 font-bold uppercase text-xs tracking-wider">Phone</th><th className="p-4 font-bold uppercase text-xs tracking-wider">Email</th><th className="p-4 font-bold uppercase text-xs tracking-wider">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                  {processedManifest.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                      <td className="p-4"><span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white font-black rounded border border-gray-200 dark:border-slate-600">{row.seat}</span></td>
                      <td className="p-4 font-bold text-gray-800 dark:text-white">{row.name}</td>
                      <td className="p-4 text-gray-600 dark:text-slate-300 font-mono text-sm"><div className="flex items-center gap-2"><Phone size={14}/> {row.phone}</div></td>
                      <td className="p-4 text-gray-600 dark:text-slate-300 text-sm"><div className="flex items-center gap-2"><Mail size={14}/> {row.email}</div></td>
                      <td className="p-4"><span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 w-fit"><Shield size={12}/> {row.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-200 dark:border-slate-700 text-right"><button onClick={() => window.print()} className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline flex items-center justify-end gap-2 ml-auto"><ClipboardList size={18}/> Print Manifest</button></div>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700">
               <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-full mb-4"><Users size={48} className="opacity-20 text-gray-900 dark:text-white"/></div>
               <p className="font-medium text-lg text-gray-500 dark:text-slate-400">No passengers found for this route and date.</p>
               <p className="text-sm">Try selecting a different date or bus.</p>
             </div>
          )}
        </div>
      )}

      {/* --- TAB 3: COMPLAINTS --- */}
      {activeTab === 'complaints' && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 animate-in slide-in-from-right-4 duration-500 transition-colors">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100 dark:border-slate-700">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-xl text-yellow-600 dark:text-yellow-400"><MessageSquareWarning size={32}/></div>
            <div><h3 className="text-2xl font-black text-gray-900 dark:text-white">User Complaints</h3><p className="text-gray-500 dark:text-slate-400">Review and resolve issues submitted by passengers.</p></div>
          </div>
          <div className="space-y-4">
            {complaints.length > 0 ? (
              complaints.map((c) => (
                <div key={c._id} className="bg-gray-50 dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${c.status === 'Resolved' ? 'bg-green-100 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400' : 'bg-yellow-100 border-yellow-200 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-400'}`}>{c.status}</span>
                      <span className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1">• {new Date(c.date).toLocaleDateString()}</span>
                    </div>

                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{c.category}</h3>

                    {/* ✅ SHOW BUS DETAILS ONLY IF AVAILABLE */}
                    {c.tripDetails && c.tripDetails !== 'Not Specified' && (
                      <div className="my-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg text-sm text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                        <Bus size={16}/> <strong>Related Trip:</strong> {c.tripDetails}
                      </div>
                    )}

                    <p className="text-gray-600 dark:text-slate-300 mt-2 mb-4 bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700 italic">"{c.message}"</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Users size={14}/> {c.name}</span>
                      <span className="flex items-center gap-1"><Mail size={14}/> {c.email}</span>
                    </div>
                  </div>
                  {c.status === 'Pending' && (
                    <button onClick={() => handleResolveComplaint(c._id)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition shadow-sm"><CheckCircle size={16} /> Mark Resolved</button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                <div className="bg-gray-100 dark:bg-slate-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} className="text-gray-400 dark:text-slate-500"/></div>
                <p>No complaints found. Good job!</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}