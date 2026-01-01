import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  QrCode, CheckCircle, XCircle, Loader, Bus, 
  User, ImageIcon, RefreshCw, AlertTriangle, 
  Download, Calendar, MapPin, StopCircle, Camera, ChevronDown, X 
} from 'lucide-react';

export default function TicketVerifier() {
    const [ticketData, setTicketData] = useState(null);
    const [ticketStatus, setTicketStatus] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Camera Engine States
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    
    const html5QrCodeRef = useRef(null);
    const fileInputRef = useRef(null);

    const API_URL = "https://entebus-api.onrender.com";

    // --- 1. INITIALIZE HARDWARE (Unlock & List Lenses) ---
    const initHardware = async () => {
        try {
            setError('');
            // Get available cameras using the professional library
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
                setCameras(devices);
                // Default logic: Priority to the Back/Rear camera
                const backCam = devices.find(d => 
                    d.label.toLowerCase().includes('back') || 
                    d.label.toLowerCase().includes('rear') ||
                    d.label.toLowerCase().includes('environment')
                ) || devices[devices.length - 1];
                
                setSelectedCamera(backCam.id);
            } else {
                setError("No cameras found on this device.");
            }
        } catch (err) {
            console.error("Hardware initialization error:", err);
            setError("Camera permission denied. Please allow access in browser settings.");
        }
    };

    useEffect(() => {
        initHardware();
        // Cleanup scanner on component unmount
        return () => {
            if (html5QrCodeRef.current?.isScanning) {
                html5QrCodeRef.current.stop().catch(e => console.error(e));
            }
        };
    }, []);

    // --- 2. CAMERA CONTROLS ---
    const startCamera = async () => {
        if (!selectedCamera) return setError("Please select a camera lens.");
        
        setIsCameraActive(true);
        setError('');
        setTicketData(null);

        // Brief timeout to ensure the DOM div "reader" is rendered
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode("reader");
                html5QrCodeRef.current = html5QrCode;

                const config = {
                    fps: 15,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };

                await html5QrCode.start(
                    selectedCamera, 
                    config, 
                    (decodedText) => handleScannedID(decodedText),
                    () => {} // Quietly handle frame-by-frame scan misses
                );
            } catch (err) {
                console.error("Camera Start Error:", err);
                setError("Failed to start scanner. Lens may be blocked or in use.");
                setIsCameraActive(false);
            }
        }, 300);
    };

    const stopCamera = async () => {
        if (html5QrCodeRef.current) {
            try {
                if (html5QrCodeRef.current.isScanning) {
                    await html5QrCodeRef.current.stop();
                }
            } catch (e) {
                console.warn("Stop Error:", e);
            }
        }
        setIsCameraActive(false);
    };

    const handleScannedID = (decodedText) => {
        // Find 24-character MongoDB ID
        const cleanID = decodedText.replace('TicketID:', '').trim();
        const idMatch = cleanID.match(/[a-f\d]{24}/i);
        
        if (idMatch) {
            if (isCameraActive) stopCamera();
            verifyTicket(idMatch[0]);
        }
    };

    // --- 3. FIX: RELIABLE MEDIA UPLOAD ---
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setError('');
        setTicketData(null);

        // We use a hidden dedicated worker div to prevent conflicts with the live camera
        const tempScanner = new Html5Qrcode("file-scan-worker");
        
        try {
            const decodedText = await tempScanner.scanFile(file, true);
            handleScannedID(decodedText);
        } catch (err) {
            setError("QR Code not detected. Please ensure the screenshot is sharp and clear.");
        } finally {
            setLoading(false);
            try { tempScanner.clear(); } catch(e) {}
            e.target.value = null; // Allow re-uploading same file
        }
    };

    // --- 4. DATA VERIFICATION ---
    const verifyTicket = async (id) => {
        setLoading(true); setTicketData(null); setError(''); setTicketStatus(null);
        try {
            const res = await axios.get(`${API_URL}/api/verify/${id}`);
            const ticket = res.data;
            
            // Check travel date vs today
            const travelDate = new Date(ticket.travelDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0); travelDate.setHours(0, 0, 0, 0);

            setTicketStatus(travelDate < today ? 'expired' : 'valid');
            setTicketData(ticket);
        } catch (err) { 
            setError("❌ Invalid Ticket ID or record not found in database."); 
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 font-sans">
            
            {/* HIDDEN FILE SCANNING WORKER */}
            <div id="file-scan-worker" style={{ display: 'none' }}></div>

            <header className="text-center mb-10 animate-in fade-in duration-700">
                <div className="bg-indigo-600/20 p-5 rounded-full w-fit mx-auto mb-4 border border-indigo-500/30">
                    <QrCode className="text-indigo-500" size={50} />
                </div>
                <h2 className="text-3xl font-black tracking-tight uppercase italic">Ente Bus Verifier</h2>
                <p className="text-slate-400 text-sm font-bold tracking-widest uppercase mt-1">Universal Entry System</p>
            </header>

            {/* LIVE CAMERA OVERLAY */}
            {isCameraActive && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
                    <div className="relative w-full max-w-md aspect-square rounded-[3rem] border-4 border-indigo-500 overflow-hidden shadow-[0_0_80px_rgba(79,70,229,0.4)]">
                        <div id="reader" className="w-full h-full bg-slate-950"></div>
                        
                        <div className="absolute inset-0 border-[60px] border-black/50 pointer-events-none"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-indigo-400 rounded-3xl animate-pulse pointer-events-none"></div>
                    </div>
                    <button onClick={stopCamera} className="mt-12 bg-red-600 hover:bg-red-700 px-12 py-4 rounded-2xl font-black flex items-center gap-3 transition-all active:scale-95 shadow-xl">
                        <StopCircle size={24} /> Close Scanner
                    </button>
                </div>
            )}

            {/* INITIAL DASHBOARD VIEW */}
            {!ticketData && !loading && !error && !isCameraActive && (
                <div className="w-full max-w-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* LENS SELECTION */}
                    <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1 mb-2 block">Choose Hardware</label>
                        <div className="relative">
                            <select 
                                value={selectedCamera} 
                                onChange={(e) => setSelectedCamera(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl appearance-none font-bold text-sm outline-none focus:border-indigo-500 transition-all pr-10"
                            >
                                {cameras.length === 0 && <option>Waiting for device list...</option>}
                                {cameras.map(cam => (
                                    <option key={cam.id} value={cam.id}>
                                        {cam.label || `Lens ${cam.id.slice(0, 5)}`}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                        </div>
                        <button onClick={initHardware} className="text-[10px] text-indigo-400 font-bold flex items-center gap-1 mt-3 ml-1 active:scale-95 transition-all"><RefreshCw size={10}/> Reload Camera List</button>
                    </div>

                    <button onClick={startCamera} className="w-full bg-indigo-600 hover:bg-indigo-500 py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-4 shadow-xl active:scale-95 shadow-indigo-900/40 transition-all">
                        <Camera size={32} /> Scan Ticket
                    </button>

                    <div className="flex items-center gap-4 py-2 opacity-30">
                        <div className="h-px bg-gray-500 flex-1"></div>
                        <span className="text-[10px] font-black uppercase">OR</span>
                        <div className="h-px bg-gray-500 flex-1"></div>
                    </div>

                    <div onClick={() => fileInputRef.current.click()} className="bg-slate-800/50 p-10 rounded-3xl border-2 border-dashed border-slate-700 text-center cursor-pointer hover:border-indigo-500 transition-all group shadow-2xl">
                        <ImageIcon size={48} className="mx-auto text-slate-600 group-hover:text-indigo-500 mb-4 transition-colors" />
                        <p className="font-bold text-slate-400 group-hover:text-slate-200">Upload Screenshot</p>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                </div>
            )}

            {/* VERIFICATION RESULT CARD */}
            {ticketData && (
                <div className="w-full max-w-md bg-white text-slate-900 rounded-[2.5rem] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.5)] animate-in zoom-in duration-500">
                    <div className={`${ticketStatus === 'valid' ? 'bg-green-600' : 'bg-orange-500'} p-6 text-white text-center font-black text-xl tracking-wide flex items-center justify-center gap-3 shadow-lg`}>
                        {ticketStatus === 'valid' ? <CheckCircle size={28} /> : <AlertTriangle size={28} />}
                        {ticketStatus === 'valid' ? 'TICKET VERIFIED' : 'TICKET EXPIRED'}
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Passenger Detail */}
                        <div className="flex gap-5 border-b border-gray-100 pb-5">
                            <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><User size={28} /></div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Passenger Name</p>
                                <p className="font-bold text-2xl text-slate-800 leading-tight">{ticketData.customerName || ticketData.customerEmail}</p>
                            </div>
                        </div>

                        {/* Bus Details Row with BUS NAME */}
                        <div className="flex gap-5 border-b border-gray-100 pb-5">
                            <div className="bg-orange-50 p-4 rounded-2xl text-orange-600"><Bus size={28} /></div>
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Bus Service</p>
                                <p className="font-bold text-xl text-gray-900 mb-1 leading-tight">
                                    {ticketData.busId?.name || "EnteBus Standard"}
                                </p>
                                <div className="text-indigo-600 font-black text-sm flex items-center gap-2">
                                    <span>{ticketData.busId?.from}</span>
                                    <span className="text-gray-300 font-normal">→</span>
                                    <span>{ticketData.busId?.to}</span>
                                </div>
                            </div>
                        </div>

                        {/* Travel Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Date</p>
                                <p className="font-black text-slate-900 text-lg">{ticketData.travelDate}</p>
                            </div>
                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Seats</p>
                                <p className="font-black text-slate-900 text-lg">{ticketData.seatNumbers?.join(', ')}</p>
                            </div>
                        </div>

                        <button onClick={() => setTicketData(null)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 transition-all active:scale-95">Verify Next Ticket</button>
                    </div>
                </div>
            )}

            {/* ERROR CARD */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 p-10 rounded-[2.5rem] text-center max-w-sm shadow-2xl animate-in zoom-in">
                    <XCircle size={72} className="mx-auto text-red-500 mb-6" />
                    <p className="text-red-400 font-bold mb-10 text-lg leading-relaxed">{error}</p>
                    <button onClick={() => {setError(''); setTicketData(null);}} className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black shadow-lg shadow-red-900/40 active:scale-95 transition-all">Try Again</button>
                </div>
            )}

            {/* GLOBAL LOADER */}
            {loading && (
                <div className="text-center py-10 animate-in fade-in duration-300">
                    <Loader className="animate-spin text-indigo-500 mx-auto" size={64} />
                    <p className="mt-6 font-black uppercase text-xs tracking-widest text-slate-500">Querying Database...</p>
                </div>
            )}
        </div>
    );
}