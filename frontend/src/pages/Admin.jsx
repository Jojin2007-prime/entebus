import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Plus, LogOut, Edit, Trash2, ClipboardList, Users, ArrowRight, History, Mail, Phone } from 'lucide-react'; // Added Mail & Phone icons

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'manifest'
  
  // Data State
  const [bookings, setBookings] = useState([]);
  const [buses, setBuses] = useState([]);
  
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

  useEffect(() => {
    if (!localStorage.getItem('admin')) navigate('/admin-login');
    else { fetchBookings(); fetchBuses(); }
  }, [navigate]);

  // --- HELPER: 12-Hour Clock ---
  const formatTime = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    const period = +hours >= 12 ? 'PM' : 'AM';
    const hours12 = (+hours % 12) || 12;
    return `${hours12}:${minutes} ${period}`;
  };

  // --- API CALLS ---
  const fetchBookings = async () => {
    try {
      const res = await axios.get('https://entebus-api.onrender.com/api/admin/bookings');
      setBookings(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchBuses = async () => {
    try {
      const res = await axios.get('https://entebus-api.onrender.com/api/buses');
      setBuses(res.data);
    } catch (err) { console.error(err); }
  };
  
  const handleBusSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`https://entebus-api.onrender.com/api/buses/${editId}`, formData);
        alert('✅ Bus Updated Successfully!');
        setIsEditing(false); 
        setEditId(null);
      } else {
        await axios.post('https://entebus-api.onrender.com/api/buses', formData);
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
        await axios.delete(`https://entebus-api.onrender.com/api/buses/${id}`);
        fetchBuses();
      } catch (err) { alert("Error deleting bus"); }
    }
  };

  const handleFetchManifest = async () => {
    if (!manifestBusId || !manifestDate) return alert("Please select both a Bus and a Date.");
    try {
      const res = await axios.get(`https://entebus-api.onrender.com/api/admin/manifest?busId=${manifestBusId}&date=${manifestDate}`);
      setManifestData(res.data);
    } catch (err) { alert("Error fetching manifest data"); }
  };

  const handleLogout = () => { 
    localStorage.removeItem('admin'); 
    navigate('/'); 
  };

  // --- UPDATED LOGIC: Include Email & Phone properly ---
  const processedManifest = manifestData.flatMap(booking => 
    booking.seatNumbers.map(seat => ({
      seat,
      name: booking.customerName || "Guest",
      email: booking.customerEmail || "N/A",  // Added Email Field
      phone: booking.customerPhone || "N/A",  // Added Phone Field
      status: 'CONFIRMED',
      id: booking._id
    }))
  ).sort((a, b) => a.seat - b.seat);

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-black flex items-center gap-2 text-gray-800">
          <Shield className="text-red-600" size={32}/> Admin Panel
        </h1>
        
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
           <button 
             onClick={() => setActiveTab('dashboard')} 
             className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab==='dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
           >
             Dashboard
           </button>
           <button 
             onClick={() => setActiveTab('manifest')} 
             className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab==='manifest' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
           >
             Manifest
           </button>
        </div>

        <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 font-bold bg-white px-5 py-2.5 rounded-xl border border-red-100 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm">
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* --- TAB 1: DASHBOARD --- */}
      {activeTab === 'dashboard' && (
        <div className="animate-in fade-in duration-500">
          
          {/* QUICK ACTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
             <Link to="/admin/history" className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-3 text-center group cursor-pointer no-underline">
                <div className="bg-orange-100 p-3 rounded-full text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition">
                   <History size={24}/>
                </div>
                <div>
                   <h3 className="font-bold text-gray-800">Trip History</h3>
                   <p className="text-xs text-gray-500 mt-1">View past trips & revenue</p>
                </div>
             </Link>
          </div>

          {/* BUS FORM */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-10">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
              {isEditing ? <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Edit size={24}/></div> : <div className="p-2 bg-green-100 rounded-lg text-green-600"><Plus size={24}/></div>}
              {isEditing ? 'Edit Bus Route' : 'Add New Bus Route'}
            </h3>
            
            <form onSubmit={handleBusSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Bus Name</label>
                <input className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 ring-indigo-500 outline-none" placeholder="e.g. KSRTC Super Fast" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Registration Number</label>
                <input className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 ring-indigo-500 outline-none" placeholder="e.g. KL-15-A-1234" value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">From</label>
                <input className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 ring-indigo-500 outline-none" placeholder="Origin" value={formData.from} onChange={e => setFormData({...formData, from: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">To</label>
                <input className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 ring-indigo-500 outline-none" placeholder="Destination" value={formData.to} onChange={e => setFormData({...formData, to: e.target.value})} required />
              </div>
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase ml-1">Departure Time</label>
                 <input type="time" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 ring-indigo-500 outline-none" value={formData.departureTime} onChange={e => setFormData({...formData, departureTime: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ticket Price</label>
                <input type="number" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 ring-indigo-500 outline-none" placeholder="₹ Amount" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Driver Name</label>
                <input className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 ring-indigo-500 outline-none" placeholder="Driver Name" value={formData.driverName} onChange={e => setFormData({...formData, driverName: e.target.value})} required />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Driver Contact</label>
                <input className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 ring-indigo-500 outline-none" placeholder="Phone Number" value={formData.driverContact} onChange={e => setFormData({...formData, driverContact: e.target.value})} required />
              </div>

              <div className="col-span-full flex gap-3 mt-4">
                <button className="flex-1 bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg shadow-gray-200">
                  {isEditing ? 'Update Bus Details' : 'Add New Bus'}
                </button>
                {isEditing && (
                  <button type="button" onClick={() => { setIsEditing(false); setFormData({}); }} className="bg-gray-100 text-gray-600 px-8 rounded-xl font-bold hover:bg-gray-200 transition">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* BUS LIST */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-10">
             <h3 className="text-xl font-bold mb-6 text-gray-800">Fleet Management</h3>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wider">
                   <tr>
                     <th className="p-4 rounded-tl-xl">Bus Details</th>
                     <th className="p-4">Route</th>
                     <th className="p-4">Schedule</th>
                     <th className="p-4">Driver</th>
                     <th className="p-4 rounded-tr-xl">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {buses.map(b => (
                     <tr key={b._id} className="hover:bg-gray-50 transition">
                       <td className="p-4">
                         <p className="font-bold text-gray-900">{b.name}</p>
                         <p className="text-xs font-mono text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded mt-1">{b.registrationNumber}</p>
                       </td>
                       <td className="p-4">
                         <div className="flex items-center gap-2 font-medium text-gray-700">
                           {b.from} <ArrowRight size={14} className="text-gray-400"/> {b.to}
                         </div>
                       </td>
                       <td className="p-4">
                         <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold font-mono">
                           {formatTime(b.departureTime)}
                         </span>
                       </td>
                       <td className="p-4 text-sm text-gray-600">
                         {b.driverName} <br/> <span className="text-xs text-gray-400">{b.driverContact}</span>
                       </td>
                       <td className="p-4">
                         <div className="flex gap-2">
                           <button onClick={() => handleEditClick(b)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"><Edit size={18}/></button>
                           <button onClick={() => handleDeleteBus(b._id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"><Trash2 size={18}/></button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: MANIFEST (UPDATED) --- */}
      {activeTab === 'manifest' && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 animate-in slide-in-from-right-4 duration-500">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
            <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
              <ClipboardList size={32}/> 
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900">Passenger Manifest</h3>
              <p className="text-gray-500">Generate passenger lists for specific trips.</p>
            </div>
          </div>
          
          {/* FILTERS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Select Bus Route</label>
                <div className="relative">
                  <select className="w-full p-4 border border-gray-200 rounded-xl bg-white appearance-none outline-none focus:ring-2 ring-indigo-500 cursor-pointer" onChange={(e) => setManifestBusId(e.target.value)}>
                    <option value="">-- Choose Bus --</option>
                    {buses.map(b => <option key={b._id} value={b._id}>{b.name} ({b.from} - {b.to})</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Select Travel Date</label>
                <input type="date" className="w-full p-4 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 ring-indigo-500 cursor-pointer" onChange={(e) => setManifestDate(e.target.value)} />
              </div>
              
              <div className="flex items-end">
                <button onClick={handleFetchManifest} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
                  Generate List
                </button>
              </div>
          </div>

          {/* RESULTS TABLE */}
          {manifestData.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-left">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="p-4 font-bold uppercase text-xs tracking-wider">Seat</th>
                    <th className="p-4 font-bold uppercase text-xs tracking-wider">Passenger Name</th>
                    {/* 👇 ADDED NEW COLUMNS 👇 */}
                    <th className="p-4 font-bold uppercase text-xs tracking-wider">Phone</th>
                    <th className="p-4 font-bold uppercase text-xs tracking-wider">Email</th>
                    <th className="p-4 font-bold uppercase text-xs tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {processedManifest.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-800 font-black rounded border border-gray-200">
                          {row.seat}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-gray-800">{row.name}</td>
                      
                      {/* 👇 ADDED PHONE CELL 👇 */}
                      <td className="p-4 text-gray-600 font-mono text-sm">
                        <div className="flex items-center gap-2"><Phone size={14}/> {row.phone}</div>
                      </td>
                      
                      {/* 👇 ADDED EMAIL CELL 👇 */}
                      <td className="p-4 text-gray-600 text-sm">
                        <div className="flex items-center gap-2"><Mail size={14}/> {row.email}</div>
                      </td>

                      <td className="p-4">
                        <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 w-fit">
                          <Shield size={12}/> {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 bg-gray-50 border-t border-gray-200 text-right">
                  <button onClick={() => window.print()} className="text-indigo-600 font-bold hover:text-indigo-800 hover:underline flex items-center justify-end gap-2 ml-auto">
                    <ClipboardList size={18}/> Print Manifest
                  </button>
              </div>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-2xl border-2 border-dashed border-gray-200">
               <div className="bg-gray-50 p-4 rounded-full mb-4">
                 <Users size={48} className="opacity-20 text-gray-900"/>
               </div>
               <p className="font-medium text-lg text-gray-500">No passengers found for this route and date.</p>
               <p className="text-sm">Try selecting a different date or bus.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}