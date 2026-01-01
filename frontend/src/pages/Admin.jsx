import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode'; // Professional QR Engine
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, Plus, LogOut, Edit, Trash2, ClipboardList, 
  Users, ArrowRight, History, Mail, Phone, MessageSquareWarning, 
  CheckCircle, Bus, QrCode, Camera, StopCircle, RefreshCw,
  XCircle, Loader, MapPin, Calendar, ChevronDown, AlertTriangle, User
} from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // --- Global Data State ---
  const [bookings, setBookings] = useState([]);
  const [buses, setBuses] = useState([]);
  const [complaints, setComplaints] = useState([]); 

  // --- QR Scanner Specific State ---
  const [ticketData, setTicketData] = useState(null);
  const [ticketStatus, setTicketStatus] = useState(null);
  const [scanError, setScanError] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  
  const html5QrCodeRef = useRef(null);

  // --- Manifest State ---
  const [manifestBusId, setManifestBusId] = useState('');
  const [manifestDate, setManifestDate] = useState('');
  const [manifestData, setManifestData] = useState([]);

  // --- Bus Form State ---
  const [formData, setFormData] = useState({ 
    name: '', registrationNumber: '', from: '', to: '', 
    departureTime: '', price: '', driverName: '', driverContact: '' 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const API_URL = "https://entebus-api.onrender.com";

  // --- INITIALIZATION ---
  useEffect(() => {
    if (!localStorage.getItem('admin')) {
      navigate('/admin-login');
    } else { 
      fetchBookings(); 
      fetchBuses(); 
      fetchComplaints();
      initHardware();
    }

    // Cleanup scanner if admin leaves the page
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        stopScanner();
      }
    };
  }, [navigate]);

  // --- ✅ SCANNER HARDWARE LOGIC ---
  const initHardware = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        // Default to the last camera in the list (usually the back camera)
        const backCam = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear')
        ) || devices[devices.length - 1];
        setSelectedCamera(backCam.id);
      }
    } catch (err) {
      console.error("Hardware Init Error", err);
    }
  };

  const startScanner = async () => {
    if (!selectedCamera) return alert("Please select a camera lens.");
    
    setIsCameraActive(true);
    setScanError('');
    setTicketData(null);

    // Wait for DOM to render the #admin-reader div
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("admin-reader");
        html5QrCodeRef.current = scanner;
        
        await scanner.start(
          selectedCamera, 
          { 
            fps: 20, 
            qrbox: (viewfinderWidth, viewfinderHeight) => {
                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                const size = Math.floor(minEdge * 0.75);
                return { width: size, height: size };
            }
          },
          (decodedText) => handleScannedID(decodedText),
          () => {} // Quietly ignore frame misses
        );
      } catch (err) {
        setScanError("Camera failed to start. Lens may be blocked.");
        setIsCameraActive(false);
      }
    }, 300);
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn("Scanner Stop Error:", e);
      }
    }
    setIsCameraActive(false);
  };

  const handleScannedID = (decodedText) => {
    const cleanID = decodedText.replace('TicketID:', '').trim();
    const idMatch = cleanID.match(/[a-f\d]{24}/i); // Find MongoDB ID
    
    if (idMatch) {
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
      today.setHours(0,0,0,0); travelDate.setHours(0,0,0,0);

      setTicketStatus(travelDate < today ? 'expired' : 'valid');
      setTicketData(ticket);
    } catch (err) {
      setScanError("❌ Invalid ID: Ticket record not found.");
    } finally {
      setScanLoading(false);
    }
  };

  // --- DATA FETCHING ---
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
    } catch (err) { console.error(err); }
  };

  // --- ACTION HANDLERS ---
  const formatTime = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    const period = +hours >= 12 ? 'PM' : 'AM';
    const hours12 = (+hours % 12) || 12;
    return `${hours12}:${minutes} ${period}`;
  };

  const handleResolveComplaint = async (id) => {
    try {
      await axios.put(`${API_URL}/api/complaints/resolve/${id}`);
      fetchComplaints(); 
      alert("Complaint marked as Resolved ✅");
    } catch (err) { alert("Error updating status"); }
  };
  
  const handleBusSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`${API_URL}/api/buses/${editId}`, formData);
        alert('✅ Bus Details Updated!');
        setIsEditing(false); setEditId(null);
      } else {
        await axios.post(`${API_URL}/api/buses`, formData);
        alert('✅ New Bus Route Added!');
      }
      setFormData({ name: '', registrationNumber: '', from: '', to: '', departureTime: '', price: '', driverName: '', driverContact: '' });
      fetchBuses();
    } catch (err) { alert('Error saving bus details'); }
  };

  const handleEditClick = (bus) => {
    setFormData({
      name: bus.name, 
      registrationNumber: bus.registrationNumber || '', 
      from: bus.from, to: bus.to, departureTime: bus.departureTime, 
      price: bus.price, driverName: bus.driverName || '', 
      driverContact: bus.driverContact || ''
    });
    setEditId(bus._id); 
    setIsEditing(true); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBus = async (id) => {
    if (window.confirm("Delete this bus route? This cannot be undone.")) {
      try {
        await axios.delete(`${API_URL}/api/buses/${id}`);
        fetchBuses();
      } catch (err) { alert("Error deleting bus"); }
    }
  };

  const handleFetchManifest = async () => {
    if (!manifestBusId || !manifestDate) return alert("Please select a Bus and Date.");
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
      seat, name: booking.customerName || "Guest", 
      email: booking.customerEmail || "N/A", phone: booking.customerPhone || "N/A", 
      status: 'CONFIRMED', id: booking._id
    }))
  ).sort((a, b) => a.seat - b.seat);

  return (
    <div className="p-6 md:p-10 bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors duration-300">
      
      {/* --- TOP BAR & NAVIGATION --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-black flex items-center gap-2 text-gray-800 dark:text-white italic uppercase">
          <Shield className="text-red-600" size={32}/> EnteBus Admin
        </h1>
        
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-x-auto">
           <button onClick={() => { stopScanner(); setActiveTab('dashboard'); }} className={`px-6 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${activeTab==='dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50'}`}>Dashboard</button>
           <button onClick={() => { stopScanner(); setActiveTab('manifest'); }} className={`px-6 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${activeTab==='manifest' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50'}`}>Manifest</button>
           
           <button onClick={() => setActiveTab('scanner')} className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap transition-all ${activeTab==='scanner' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50'}`}>
             <QrCode size={18}/> Scanner
           </button>

           <button onClick={() => { stopScanner(); setActiveTab('complaints'); }} className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap transition-all ${activeTab==='complaints' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 dark:text-slate-300'}`}>
             <MessageSquareWarning size={16} /> Complaints
             {complaints.filter(c => c.status === 'Pending').length > 0 && (
               <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{complaints.filter(c => c.status === 'Pending').length}</span>
             )}
           </button>
        </div>

        <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold bg-white dark:bg-slate-800 px-5 py-2.5 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm transition-all active:scale-95">
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* --- TAB 1: DASHBOARD --- */}
      {activeTab === 'dashboard' && (
        <div className="animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
             <Link to="/admin/history" className="p-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-3 text-center group no-underline">
                <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition">
                   <History size={24}/>
                </div>
                <div>
                   <h3 className="font-bold text-gray-800 dark:text-white">Trip History</h3>
                   <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Total revenue & completed trips</p>
                </div>
             </Link>
          </div>

          {/* BUS ROUTE FORM */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 mb-10">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-white">
              {isEditing ? <Edit size={24} className="text-indigo-600"/> : <Plus size={24} className="text-green-600"/>}
              {isEditing ? 'Edit Route Details' : 'Register New Bus Route'}
            </h3>
            <form onSubmit={handleBusSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {[
                { label: 'Bus Service Name', value: 'name', placeholder: 'e.g. KSRTC Super Fast', col: 'md:col-span-2' },
                { label: 'Registration ID', value: 'registrationNumber', placeholder: 'KL-XX-X-XXXX', col: 'md:col-span-2' },
                { label: 'Departure Station', value: 'from', placeholder: 'Origin' },
                { label: 'Arrival Station', value: 'to', placeholder: 'Destination' },
                { label: 'Start Time', value: 'departureTime', type: 'time' },
                { label: 'Base Fare (₹)', value: 'price', type: 'number' },
                { label: 'Driver Name', value: 'driverName', col: 'md:col-span-2' },
                { label: 'Driver Contact', value: 'driverContact', col: 'md:col-span-2' },
              ].map((field, idx) => (
                <div key={idx} className={field.col || ''}>
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1 mb-1 block tracking-widest">{field.label}</label>
                  <input type={field.type || 'text'} className="w-full p-3 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl focus:ring-2 ring-indigo-500 outline-none transition-all" value={formData[field.value]} onChange={e => setFormData({...formData, [field.value]: e.target.value})} required />
                </div>
              ))}
              <div className="col-span-full flex gap-3 mt-4">
                <button className="flex-1 bg-gray-900 dark:bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg">{isEditing ? 'Update Database' : 'Add to Fleet'}</button>
                {isEditing && (<button type="button" onClick={() => { setIsEditing(false); setFormData({ name: '', registrationNumber: '', from: '', to: '', departureTime: '', price: '', driverName: '', driverContact: '' }); }} className="bg-gray-100 dark:bg-slate-700 text-gray-600 px-8 rounded-xl font-bold">Cancel</button>)}
              </div>
            </form>
          </div>

          {/* FLEET TABLE */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 transition-colors">
              <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Active Fleet Management</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 dark:bg-slate-700/50 text-[10px] uppercase text-gray-500 tracking-widest">
                    <tr><th className="p-4 rounded-tl-xl">Bus Details</th><th className="p-4">Route</th><th className="p-4">Schedule</th><th className="p-4">Driver</th><th className="p-4 rounded-tr-xl">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {buses.map(b => (
                      <tr key={b._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="p-4"><p className="font-bold text-gray-900 dark:text-white">{b.name}</p><p className="text-xs font-mono text-gray-400 mt-1 uppercase tracking-tighter">{b.registrationNumber}</p></td>
                        <td className="p-4"><div className="flex items-center gap-2 font-medium text-gray-700 dark:text-slate-300">{b.from} <ArrowRight size={14} className="opacity-30"/> {b.to}</div></td>
                        <td className="p-4"><span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold">{formatTime(b.departureTime)}</span></td>
                        <td className="p-4 text-sm text-gray-600 dark:text-slate-400">{b.driverName} <br/> <span className="text-[10px] font-mono opacity-50">{b.driverContact}</span></td>
                        <td className="p-4"><div className="flex gap-2"><button onClick={() => handleEditClick(b)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Edit size={18}/></button><button onClick={() => handleDeleteBus(b._id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={18}/></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: MANIFEST --- */}
      {activeTab === 'manifest' && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 animate-in slide-in-from-right-4 duration-500 transition-colors">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100 dark:border-slate-700">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl text-indigo-600"><ClipboardList size={32}/></div>
            <div><h3 className="text-2xl font-black text-gray-900 dark:text-white">Passenger Manifest</h3><p className="text-gray-500 text-sm">Download trip boarding lists for drivers.</p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-gray-50 dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Bus Selection</label>
                <select className="w-full p-4 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 font-bold outline-none focus:ring-2 ring-indigo-500" onChange={(e) => setManifestBusId(e.target.value)}>
                  <option value="">-- Choose Route --</option>
                  {buses.map(b => <option key={b._id} value={b._id}>{b.name} ({b.from} - {b.to})</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Select Trip Date</label>
                <input type="date" className="w-full p-4 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 font-bold outline-none focus:ring-2 ring-indigo-500" onChange={(e) => setManifestDate(e.target.value)} />
              </div>
              <div className="flex items-end"><button onClick={handleFetchManifest} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition">Generate List</button></div>
          </div>
          {manifestData.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
              <table className="w-full text-left">
                <thead className="bg-gray-800 text-white">
                  <tr><th className="p-4 font-bold uppercase text-[10px] tracking-widest">Seat</th><th className="p-4 font-bold uppercase text-[10px] tracking-widest">Passenger</th><th className="p-4 font-bold uppercase text-[10px] tracking-widest">Phone</th><th className="p-4 font-bold uppercase text-[10px] tracking-widest">Email</th><th className="p-4 font-bold uppercase text-[10px] tracking-widest">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                  {processedManifest.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="p-4"><span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white font-black rounded border border-gray-200">{row.seat}</span></td>
                      <td className="p-4 font-bold text-gray-800 dark:text-white">{row.name}</td>
                      <td className="p-4 text-gray-600 font-mono text-sm dark:text-slate-300 flex items-center gap-1 mt-1"><Phone size={14} className="opacity-40"/> {row.phone}</td>
                      <td className="p-4 text-gray-500 text-xs dark:text-slate-400">{row.email}</td>
                      <td className="p-4"><span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Confirmed</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t dark:border-slate-700 text-right">
                <button onClick={() => window.print()} className="text-indigo-600 font-bold hover:underline flex items-center gap-2 justify-end ml-auto"><ClipboardList size={18}/> Print manifest for Driver</button>
              </div>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-gray-200">
               <Users size={48} className="opacity-10 mb-4"/>
               <p className="font-bold tracking-widest uppercase text-xs">No bookings found for this trip.</p>
             </div>
          )}
        </div>
      )}

      {/* --- ✅ TAB 3: ACCURATE SCANNER --- */}
      {activeTab === 'scanner' && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 animate-in slide-in-from-bottom-4 duration-500 transition-colors">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100 dark:border-slate-700">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl text-indigo-600"><QrCode size={32}/></div>
            <div><h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic">Entry Scan Module</h3><p className="text-gray-500 text-sm">Professional real-time boarding verification.</p></div>
          </div>

          <div className="max-w-xl mx-auto space-y-6">
            {!isCameraActive && !ticketData && !scanLoading && (
              <div className="space-y-6 bg-gray-50 dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-700">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-2 block">Choose Hardware Lens</label>
                  <div className="relative">
                    <select value={selectedCamera} onChange={(e) => setSelectedCamera(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 p-4 rounded-xl appearance-none font-bold text-sm outline-none focus:ring-2 ring-indigo-500 pr-10">
                      {cameras.length === 0 && <option>Searching hardware...</option>}
                      {cameras.map(cam => <option key={cam.id} value={cam.id}>{cam.label || `Lens ${cam.id.slice(0, 5)}`}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                  </div>
                  <button onClick={initHardware} className="text-[10px] text-indigo-500 font-bold mt-2 ml-1 flex items-center gap-1 active:scale-95"><RefreshCw size={10}/> Reload available lenses</button>
                </div>
                <button onClick={startScanner} className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black text-xl flex items-center justify-center gap-4 shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
                  <Camera size={32} /> Launch Entry Scanner
                </button>
              </div>
            )}

            {isCameraActive && (
              <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
                <div className="relative w-full max-w-md aspect-square rounded-[3rem] border-4 border-indigo-600 overflow-hidden shadow-[0_0_80px_rgba(79,70,229,0.5)]">
                   <div id="admin-reader" className="w-full h-full bg-slate-950"></div>
                   <div className="absolute inset-0 border-[50px] border-black/50 pointer-events-none"></div>
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-indigo-400 rounded-3xl animate-pulse pointer-events-none"></div>
                </div>
                <button onClick={stopScanner} className="mt-12 bg-red-600 hover:bg-red-700 text-white px-12 py-4 rounded-2xl font-black flex items-center gap-3 transition-all active:scale-95 shadow-xl">
                  <StopCircle size={24} /> Terminate Scan Session
                </button>
              </div>
            )}

            {ticketData && (
              <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-500 border border-gray-200 dark:border-slate-700">
                <div className={`${ticketStatus === 'valid' ? 'bg-green-600' : 'bg-orange-500'} p-7 text-white text-center font-black text-xl flex items-center justify-center gap-3 shadow-lg`}>
                  {ticketStatus === 'valid' ? <CheckCircle size={28} /> : <AlertTriangle size={28} />}
                  {ticketStatus === 'valid' ? 'BOARDING PERMITTED' : 'EXPIRED / INVALID'}
                </div>

                <div className="p-8 space-y-6">
                  <div className="flex gap-5 border-b border-gray-100 dark:border-slate-700 pb-5">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-2xl text-indigo-600"><User size={28} /></div>
                    <div><p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Passenger Identity</p><p className="font-bold text-2xl text-gray-800 dark:text-white leading-tight">{ticketData.customerName || "Verified Guest"}</p></div>
                  </div>

                  <div className="flex gap-5 border-b border-gray-100 dark:border-slate-700 pb-5">
                    <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-2xl text-orange-600"><Bus size={28} /></div>
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Assigned Route</p>
                      <p className="font-bold text-xl text-gray-900 dark:text-white leading-tight">{ticketData.busId?.name || "EnteBus Standard"}</p>
                      <div className="text-indigo-600 dark:text-indigo-400 font-black text-sm flex items-center gap-2 mt-1">
                         <span>{ticketData.busId?.from}</span>
                         <ArrowRight size={14}/>
                         <span>{ticketData.busId?.to}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-700"><p className="text-[10px] text-gray-400 font-black uppercase mb-1">Trip Date</p><p className="font-black text-lg dark:text-white">{ticketData.travelDate}</p></div>
                    <div className="bg-gray-50 dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-700"><p className="text-[10px] text-gray-400 font-black uppercase mb-1">Seats</p><p className="font-black text-lg dark:text-white tracking-widest">{ticketData.seatNumbers?.join(', ')}</p></div>
                  </div>

                  <button onClick={() => setTicketData(null)} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg active:scale-95 transition-all shadow-xl shadow-indigo-100">Reset for Next Scan</button>
                </div>
              </div>
            )}

            {scanError && (
              <div className="bg-red-500/10 border border-red-500/30 p-10 rounded-[2.5rem] text-center shadow-2xl animate-in zoom-in">
                <XCircle size={72} className="mx-auto text-red-500 mb-6" />
                <p className="text-red-400 font-bold mb-10 text-lg leading-relaxed">{scanError}</p>
                <button onClick={() => {setScanError(''); setTicketData(null);}} className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black active:scale-95 transition-all">Try Again</button>
              </div>
            )}

            {scanLoading && <div className="text-center py-20 animate-in fade-in"><Loader className="animate-spin text-indigo-500 mx-auto" size={64} /><p className="mt-6 font-black uppercase text-[10px] tracking-widest text-gray-500">Retrieving Ticket History...</p></div>}
          </div>
        </div>
      )}

      {/* --- TAB 4: COMPLAINTS --- */}
      {activeTab === 'complaints' && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 animate-in slide-in-from-right-4 duration-500 transition-colors">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100 dark:border-slate-700">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-xl text-yellow-600"><MessageSquareWarning size={32}/></div>
            <div><h3 className="text-2xl font-black text-gray-900 dark:text-white">Traveler Complaints</h3><p className="text-gray-500 text-sm">Review and manage feedback submitted by users.</p></div>
          </div>
          <div className="space-y-4">
            {complaints.length > 0 ? (
              complaints.map((c) => (
                <div key={c._id} className="bg-gray-50 dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${c.status === 'Resolved' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>{c.status}</span>
                      <span className="text-xs text-gray-500">• {new Date(c.date).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{c.category}</h3>
                    {c.tripDetails && c.tripDetails !== 'Not Specified' && (
                      <div className="my-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 flex items-center gap-2"><Bus size={14}/> {c.tripDetails}</div>
                    )}
                    <p className="text-gray-600 dark:text-slate-300 mt-2 mb-4 bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700 italic">"{c.message}"</p>
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400"><span className="flex items-center gap-1"><User size={12}/> {c.name}</span><span className="flex items-center gap-1"><Mail size={12}/> {c.email}</span></div>
                  </div>
                  {c.status === 'Pending' && (<button onClick={() => handleResolveComplaint(c._id)} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-green-700 transition shadow-sm">Mark as Resolved</button>)}
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-gray-400"><p className="font-black uppercase tracking-widest text-xs">No active complaints. Excellent!</p></div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}