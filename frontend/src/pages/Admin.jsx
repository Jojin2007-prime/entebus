import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import {
  Shield, Plus, LogOut, Edit, Trash2,
  Users, ArrowRight, History, MessageSquareWarning,
  CheckCircle, Bus, QrCode, Camera, StopCircle,
  XCircle, Loader, UserCheck, AlertTriangle, User, Printer, Calendar
} from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [bookings, setBookings] = useState([]);
  const [buses, setBuses] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [ticketData, setTicketData] = useState(null);
  const [ticketStatus, setTicketStatus] = useState(null);
  const [scanError, setScanError] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const html5QrCodeRef = useRef(null);
  const [manifestBusId, setManifestBusId] = useState('');
  const [manifestDate, setManifestDate] = useState('');
  const [manifestData, setManifestData] = useState([]);
  const [formData, setFormData] = useState({
    name: '', registrationNumber: '', from: '', to: '',
    departureTime: '', price: '', driverName: '', driverContact: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const API_URL = "https://entebus-api.onrender.com";

  // Audio feedback for scanner
  const playSuccessBeep = () => {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.2);
      oscillator.stop(context.currentTime + 0.2);
    } catch (e) { console.error("Audio error", e); }
  };

  useEffect(() => {
    if (!localStorage.getItem('admin')) {
      navigate('/admin-login');
    } else {
      fetchBookings();
      fetchBuses();
      fetchComplaints();
      initHardware();
    }
    return () => { stopScanner(); };
  }, [navigate]);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/bookings`);
      setBookings(res.data);
    } catch (err) { }
  };

  const fetchBuses = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/buses`);
      setBuses(res.data);
    } catch (err) { }
  };

  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/complaints/all`);
      setComplaints(res.data);
    } catch (err) { }
  };

  const initHardware = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        const backCam = devices.find(d => d.label.toLowerCase().includes('back')) || devices[devices.length - 1];
        setSelectedCamera(backCam.id);
      }
    } catch (err) { }
  };

  const startScanner = async () => {
    if (!selectedCamera) return showToast("Select camera hardware.", "info");
    setIsCameraActive(true); setScanError(''); setTicketData(null);
    
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("admin-reader");
        html5QrCodeRef.current = scanner;
        await scanner.start(
          selectedCamera,
          { fps: 20, qrbox: { width: 250, height: 250 } },
          (decodedText) => handleScannedID(decodedText),
          () => {}
        );
      } catch (err) {
        setScanError("Camera access failed.");
        showToast("Camera access failed. Check permissions.", "error");
        setIsCameraActive(false);
      }
    }, 400);
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current?.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) { console.warn(e); }
    }
    setIsCameraActive(false);
  };

  const handleScannedID = (decodedText) => {
    const idMatch = decodedText.match(/[a-f\d]{24}/i);
    if (idMatch) {
      playSuccessBeep();
      stopScanner();
      verifyScannedTicket(idMatch[0]);
    }
  };

  const verifyScannedTicket = async (id) => {
    setScanLoading(true); setScanError('');
    try {
      const res = await axios.get(`${API_URL}/api/verify/${id}`);
      const ticket = res.data;
      const travelDate = new Date(ticket.travelDate);
      const today = new Date();
      travelDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (travelDate.getTime() < today.getTime()) {
        setTicketStatus('expired');
        showToast("This ticket has expired!", "error");
      } else if (travelDate.getTime() > today.getTime()) {
        setTicketStatus('future'); 
        showToast("Ticket is for a future date.", "info");
      } else {
        setTicketStatus('valid');
        showToast("Ticket Verified!", "success");
      }
      setTicketData(ticket);
    } catch (err) { 
      setScanError("❌ Record not found."); 
      showToast("Record not found in database.", "error");
    }
    finally { setScanLoading(false); }
  };

  const confirmBoarding = async () => {
    if (!ticketData || ticketStatus !== 'valid') return;
    setConfirmLoading(true);
    try {
      await axios.put(`${API_URL}/api/bookings/board/${ticketData._id}`);
      setTicketData(prev => ({ ...prev, status: 'Boarded' }));
      playSuccessBeep();
      showToast("Passenger Boarded Successfully! ✅", "success");
      fetchBookings();
      if(activeTab === 'manifest') handleFetchManifest(); 
    } catch (err) { 
      showToast("Failed to update boarding status.", "error"); 
    } finally { 
      setConfirmLoading(false); 
    }
  };

  const handleBusSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`${API_URL}/api/buses/${editId}`, formData);
        setIsEditing(false); setEditId(null);
        showToast('Bus Details Updated! ✅', "success");
      } else {
        await axios.post(`${API_URL}/api/buses`, formData);
        showToast('New Bus Route Added! ✅', "success");
      }
      setFormData({ name: '', registrationNumber: '', from: '', to: '', departureTime: '', price: '', driverName: '', driverContact: '' });
      fetchBuses();
    } catch (err) { showToast('Error processing request', "error"); }
  };

  const handleEditClick = (bus) => {
    setFormData({
      name: bus.name, registrationNumber: bus.registrationNumber || '',
      from: bus.from, to: bus.to, departureTime: bus.departureTime,
      price: bus.price, driverName: bus.driverName || '', driverContact: bus.driverContact || ''
    });
    setEditId(bus._id); setIsEditing(true); window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleDeleteBus = async (id) => {
    if (window.confirm("Delete this bus permanently?")) {
      try { 
        await axios.delete(`${API_URL}/api/buses/${id}`); 
        fetchBuses(); 
        showToast("Bus deleted successfully.", "success");
      } catch (err) { showToast("Error deleting bus", "error"); }
    }
  };

  const handleResolveComplaint = async (id) => {
    try {
      await axios.put(`${API_URL}/api/complaints/resolve/${id}`);
      fetchComplaints();
      showToast("Issue marked as Resolved ✅", "success");
    } catch (err) { showToast("Error updating complaint", "error"); }
  };

  // ✅ UPDATED: Manifest Logic with Params and Debugging
  const handleFetchManifest = async () => {
    if (!manifestBusId || !manifestDate) {
      return showToast("Select Bus and Date first.", "info");
    }
    try {
      const res = await axios.get(`${API_URL}/api/admin/manifest`, {
        params: { busId: manifestBusId, date: manifestDate }
      });
      console.log("Data from Server:", res.data); // ✅ Check this in F12 Console
      
      if (res.data.length === 0) {
        showToast("No bookings found for this trip", "info");
      } else {
        showToast(`Manifest loaded: ${res.data.length} passengers found`, "success");
      }
      setManifestData(res.data);
    } catch (err) {
      showToast("Error connecting to backend", "error");
    }
  };

  const handleLogout = () => { localStorage.removeItem('admin'); navigate('/'); };

  const formatTime = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    const period = +hours >= 12 ? 'PM' : 'AM';
    const hours12 = (+hours % 12) || 12;
    return `${hours12}:${minutes} ${period}`;
  };

  const processedManifest = manifestData.flatMap(booking =>
    booking.seatNumbers.map(seat => ({
      seat,
      name: booking.customerName || "Guest",
      phone: booking.customerPhone || "N/A",
      email: booking.customerEmail || "N/A",
      status: booking.status
    }))
  ).sort((a, b) => a.seat - b.seat);

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors duration-300 pb-20 md:pb-10">
      <div className="max-w-7xl mx-auto p-4 md:p-10">
        
        {/* --- RESPONSIVE HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <h1 className="text-2xl md:text-3xl font-black dark:text-white italic uppercase flex items-center gap-2">
            <Shield className="text-red-600" size={28}/> EnteBus Admin
          </h1>
          
          <div className="w-full md:w-auto flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border dark:border-slate-700 shadow-sm overflow-x-auto no-scrollbar">
            {['dashboard', 'manifest', 'scanner', 'complaints'].map((tab) => (
              <button
                key={tab}
                onClick={() => { stopScanner(); setActiveTab(tab); }}
                className={`flex-1 md:flex-none md:px-8 py-3 rounded-xl font-black text-[10px] md:text-xs uppercase transition-all flex items-center justify-center gap-2 ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 dark:text-slate-400'}`}
              >
                {tab === 'scanner' && <QrCode size={14}/>}
                {tab}
                {tab === 'complaints' && complaints.filter(c => c.status === 'Pending').length > 0 && (
                   <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{complaints.filter(c => c.status === 'Pending').length}</span>
                )}
              </button>
            ))}
          </div>

          <button onClick={handleLogout} className="hidden md:block bg-red-50 dark:bg-red-900/20 text-red-600 px-6 py-3 rounded-xl font-black uppercase text-xs active:scale-95 transition-all">
            Logout
          </button>
        </div>

        {/* --- DASHBOARD TAB --- */}
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in duration-500 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/admin/history" className="p-6 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition flex items-center gap-4">
                   <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl text-orange-600"><History size={24}/></div>
                   <div><h3 className="font-bold text-gray-800 dark:text-white text-sm">Trip History</h3><p className="text-[10px] text-gray-400 uppercase">Revenue & Logs</p></div>
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border dark:border-slate-700">
                  <h3 className="text-lg font-bold mb-6 dark:text-white flex items-center gap-2">
                    {isEditing ? <Edit size={20} className="text-indigo-500" /> : <Plus size={20} className="text-green-500" />}
                    {isEditing ? 'Update Route' : 'Add New Route'}
                  </h3>
                  <form onSubmit={handleBusSubmit} className="space-y-4">
                    {[
                      { label: 'Bus Service Name', value: 'name' },
                      { label: 'Registration ID', value: 'registrationNumber' },
                      { label: 'From', value: 'from' }, { label: 'To', value: 'to' },
                      { label: 'Departure Time', value: 'departureTime', type: 'time' }, { label: 'Price (₹)', value: 'price', type: 'number' },
                      { label: 'Driver Name', value: 'driverName' }, { label: 'Driver Contact', value: 'driverContact' },
                    ].map((field, idx) => (
                      <div key={idx}>
                        <label className="text-[9px] font-black uppercase text-gray-400 block mb-1 tracking-widest">{field.label}</label>
                        <input type={field.type || 'text'} className="w-full p-3 border dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl focus:ring-2 ring-indigo-500 outline-none text-sm" value={formData[field.value]} onChange={e => setFormData({...formData, [field.value]: e.target.value})} required />
                      </div>
                    ))}
                    <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg text-xs uppercase italic tracking-widest">
                      {isEditing ? 'Update Database' : 'Register Bus'}
                    </button>
                    {isEditing && <button type="button" onClick={() => { setIsEditing(false); setFormData({name:'', registrationNumber:'', from:'', to:'', departureTime:'', price:'', driverName:'', driverContact:''}); }} className="w-full py-4 bg-gray-200 dark:bg-slate-700 dark:text-white font-bold rounded-xl text-xs uppercase">Cancel</button>}
                  </form>
                </div>

                <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 p-6 shadow-sm overflow-hidden">
                    <h3 className="text-lg font-bold mb-6 dark:text-white">Active Fleet Management</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px] text-left">
                        <thead className="text-[10px] uppercase text-gray-400 tracking-widest border-b dark:border-slate-700">
                          <tr><th className="pb-4">Bus Details</th><th className="pb-4">Route</th><th className="pb-4">Departure</th><th className="pb-4 text-center">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                          {buses.map(b => (
                            <tr key={b._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                              <td className="py-5 pr-2 font-bold dark:text-white text-sm">{b.name} <br/><span className="text-[10px] font-mono opacity-40">{b.registrationNumber}</span></td>
                              <td className="py-5 text-xs dark:text-slate-300">{b.from} → {b.to}</td>
                              <td className="py-5 font-bold text-indigo-500 text-sm">{formatTime(b.departureTime)}</td>
                              <td className="py-5">
                                 <div className="flex justify-center gap-2">
                                   <button onClick={() => handleEditClick(b)} className="p-2.5 text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:scale-110 transition"><Edit size={16}/></button>
                                   <button onClick={() => handleDeleteBus(b._id)} className="p-2.5 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:scale-110 transition"><Trash2 size={16}/></button>
                                 </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                </div>
              </div>
          </div>
        )}

        {/* --- MANIFEST TAB --- */}
        {activeTab === 'manifest' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Select Route</label>
                  <select className="w-full p-4 border dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-900 dark:text-white font-bold text-sm" value={manifestBusId} onChange={(e) => setManifestBusId(e.target.value)}>
                    <option value="">-- Choose Route --</option>
                    {buses.map(b => <option key={b._id} value={b._id}>{b.name} ({b.from} - {b.to})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Travel Date</label>
                  <input type="date" className="w-full p-4 border dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-900 dark:text-white font-bold text-sm" value={manifestDate} onChange={(e) => setManifestDate(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={handleFetchManifest} 
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold uppercase text-xs italic tracking-widest shadow-lg active:scale-95 transition-all"
                  >
                    Generate Manifest
                  </button>
                </div>
            </div>
            
            {manifestData.length > 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto p-4">
                  <table className="w-full min-w-[700px] text-left">
                    <thead className="bg-gray-50 dark:bg-slate-900 border-b dark:border-slate-700">
                      <tr className="text-[10px] text-gray-400 uppercase tracking-widest"><th className="p-4">Seat</th><th className="p-4">Passenger</th><th className="p-4">Contact Details</th><th className="p-4">Status</th></tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-700">
                      {processedManifest.map((row, idx) => (
                        <tr key={idx} className={`hover:bg-gray-50 dark:hover:bg-slate-700/30 transition text-sm ${row.status === 'Boarded' ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}>
                          <td className="p-4 font-black dark:text-gray-300">#{row.seat}</td>
                          <td className="p-4 font-bold dark:text-white">{row.name}</td>
                          <td className="p-4 text-xs text-gray-500 leading-tight">{row.phone}<br/>{row.email}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm border ${
                              row.status === 'Boarded' 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : 'bg-blue-100 text-blue-700 border-blue-200'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-slate-900 flex justify-end border-t dark:border-slate-800">
                  <button onClick={() => window.print()} className="bg-white dark:bg-slate-800 border dark:border-slate-700 px-8 py-3 rounded-xl text-indigo-600 font-black text-xs uppercase flex items-center gap-2 shadow-sm"><Printer size={16}/> Print Passenger List</button>
                </div>
              </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed dark:border-slate-700">
                  <Users size={48} className="opacity-10 mb-4"/><p className="font-bold text-xs text-gray-400 uppercase tracking-widest">No passengers found for selection</p>
                </div>
            )}
          </div>
        )}

        {/* --- SCANNER TAB --- */}
        {activeTab === 'scanner' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
            {!isCameraActive && !ticketData && !scanLoading && (
              <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border dark:border-slate-700 shadow-xl text-center space-y-8">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-3xl">
                  <QrCode size={64} className="mx-auto text-indigo-600 mb-4 opacity-40" />
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-3">Lens Selection</label>
                  <select value={selectedCamera} onChange={(e) => setSelectedCamera(e.target.value)} className="w-full max-w-xs mx-auto bg-white dark:bg-slate-900 border dark:border-slate-700 p-4 rounded-2xl font-bold text-xs appearance-none text-center">
                    {cameras.map(cam => <option key={cam.id} value={cam.id}>{cam.label || `Camera ${cam.id.slice(0,5)}`}</option>)}
                  </select>
                </div>
                <button onClick={startScanner} className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-4 shadow-xl uppercase italic shadow-indigo-500/20 active:scale-95 transition-all">
                  <Camera size={28} /> Start Validator
                </button>
              </div>
            )}

            {isCameraActive && (
              <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col items-center justify-center p-6">
                <div className="relative w-full aspect-square max-w-[400px] rounded-[3rem] border-8 border-indigo-600 overflow-hidden bg-slate-950">
                   <div id="admin-reader" className="w-full h-full"></div>
                </div>
                <button onClick={stopScanner} className="mt-12 bg-red-600 text-white px-12 py-4 rounded-2xl font-black uppercase italic tracking-widest shadow-xl active:scale-95 transition-all">Stop Camera</button>
              </div>
            )}

            {ticketData && (
              <div className="bg-white dark:bg-slate-800 rounded-[3rem] overflow-hidden shadow-2xl border dark:border-slate-700 animate-in zoom-in max-w-md mx-auto">
                <div className={`${ticketStatus === 'valid' ? 'bg-green-600' : ticketStatus === 'future' ? 'bg-blue-600' : 'bg-orange-500'} p-6 text-white text-center font-black uppercase text-sm flex items-center justify-center gap-3 italic`}>
                  {ticketStatus === 'valid' ? <CheckCircle size={24} /> : ticketStatus === 'future' ? <Calendar size={24} /> : <AlertTriangle size={24} />}
                  {ticketStatus === 'valid' ? 'Access Permitted' : ticketStatus === 'future' ? 'Future Trip' : 'Ticket Expired'}
                </div>
                <div className="p-8 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-2xl text-indigo-600"><User size={32} /></div>
                    <div><p className="text-[10px] text-gray-400 font-black uppercase">Passenger</p><p className="font-bold text-xl dark:text-white leading-tight">{ticketData.customerName}</p></div>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-700">
                    <p className="font-bold text-sm dark:text-white">{ticketData.busId?.name}</p>
                    <p className="text-xs font-black text-indigo-600 uppercase mt-1 tracking-tighter">{ticketData.busId?.from} → {ticketData.busId?.to} • {ticketData.travelDate}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-700 text-center"><p className="text-[10px] text-gray-400 uppercase font-black mb-1">Seats</p><p className="font-black text-lg dark:text-white tracking-widest">{ticketData.seatNumbers?.join(', ')}</p></div>
                  
                  {ticketData.status === 'Boarded' ? (
                      <div className="bg-green-100 text-green-700 p-5 rounded-2xl text-center font-black border border-green-200 flex items-center justify-center gap-2 uppercase text-[10px] italic shadow-inner"><UserCheck size={18}/> Already Boarded</div>
                  ) : (
                      <button onClick={confirmBoarding} disabled={confirmLoading || ticketStatus !== 'valid'} className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl uppercase italic transition-all ${ticketStatus === 'valid' ? 'bg-green-600 text-white active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                        {confirmLoading ? <Loader className="animate-spin" /> : <UserCheck />} Confirm Entry
                      </button>
                  )}
                  <button onClick={() => setTicketData(null)} className="w-full text-xs font-black text-gray-400 uppercase py-2">Reset & Scan Next</button>
                </div>
              </div>
            )}
            {scanLoading && <div className="text-center py-20"><Loader className="animate-spin text-indigo-500 mx-auto" size={48} /><p className="mt-4 font-black text-[10px] tracking-widest text-gray-400 uppercase">Checking Records...</p></div>}
          </div>
        )}

        {/* --- COMPLAINTS TAB --- */}
        {activeTab === 'complaints' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <h3 className="text-xl font-black dark:text-white uppercase italic tracking-tighter px-1">Support Dashboard</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {complaints.length > 0 ? complaints.map((c) => (
                <div key={c._id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700 space-y-4 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase ${c.status === 'Resolved' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100'}`}>{c.status}</span>
                      <span className="text-[10px] text-gray-400 font-bold">{new Date(c.date).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-black text-md dark:text-white uppercase tracking-tight leading-tight">{c.category}</h3>
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900 italic text-xs text-gray-600 dark:text-slate-300 leading-relaxed border dark:border-slate-800">"{c.message}"</div>
                  </div>
                  <div className="pt-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="text-[9px] font-black text-gray-400 uppercase opacity-60">From: {c.name}<br/>{c.email}</div>
                    {c.status === 'Pending' && (<button onClick={() => handleResolveComplaint(c._id)} className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase shadow-lg hover:bg-green-700 active:scale-95 transition-all">Mark Resolved</button>)}
                  </div>
                </div>
              )) : <div className="col-span-full py-20 text-center opacity-20"><p className="font-black uppercase tracking-widest text-xs">Support Inbox is Empty</p></div>}
            </div>
          </div>
        )}

      </div>

      {/* MOBILE LOGOUT FOOTER */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-t dark:border-slate-700 flex justify-center z-50">
        <button onClick={handleLogout} className="text-red-600 font-black uppercase text-[11px] tracking-widest flex items-center gap-2">
            <LogOut size={14}/> Exit Admin Portal
        </button>
      </div>

    </div>
  );
}