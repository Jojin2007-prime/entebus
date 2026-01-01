import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  QrCode, CheckCircle, XCircle, Loader, Bus, 
  User, ImageIcon, RefreshCw, AlertTriangle, 
  Calendar, MapPin, StopCircle, Camera, ChevronDown, X, ArrowRight
} from 'lucide-react';

export default function TicketVerifier() {
    // --- 1. State Management ---
    const [ticketData, setTicketData] = useState(null);
    const [ticketStatus, setTicketStatus] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    
    // --- 2. Refs for Hardware & Engine Control ---
    const html5QrCodeRef = useRef(null);
    const fileInputRef = useRef(null);

    const API_URL = "https://entebus-api.onrender.com";

    // --- 3. Success Beep Logic (Web Audio API) ---
    // Generates a digital beep without needing an external .mp3 file
    const playSuccessBeep = () => {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();

            oscillator.type = "sine";
            oscillator.frequency.value = 880; // High pitch clear beep
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);

            oscillator.start();
            // Short 0.2s duration with a quick fade-out
            gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.2);
            oscillator.stop(context.currentTime + 0.2);
        } catch (e) { 
            console.error("Audio beep error:", e); 
        }
    };

    // --- 4. Helper: Format 24h time to AM/PM ---
    const formatTime = (time24) => {
        if (!time24) return "";
        const [hours, minutes] = time24.split(':');
        const period = +hours >= 12 ? 'PM' : 'AM';
        const hours12 = (+hours % 12) || 12;
        return `${hours12}:${minutes} ${period}`;
    };

    // --- 5. Hardware Discovery (Initialization) ---
    const initHardware = async () => {
        try {
            setError('');
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
                setCameras(devices);
                // Priority: select the back/rear camera if it exists
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
            console.error("Hardware Discovery Error:", err);
            setError("Camera permission denied. Please allow access in settings.");
        }
    };

    useEffect(() => {
        initHardware();
        // Cleanup scanner on component unmount
        return () => { stopScannerInstance(); };
    }, []);

    // --- 6. Instance Manager (Prevents "Camera Busy" crashes) ---
    const stopScannerInstance = async () => {
        if (html5QrCodeRef.current) {
            try {
                if (html5QrCodeRef.current.isScanning) {
                    await html5QrCodeRef.current.stop();
                }
                html5QrCodeRef.current.clear();
            } catch (e) {
                console.warn("Cleanup warning:", e);
            }
            html5QrCodeRef.current = null;
        }
    };

    const startCamera = async () => {
        if (!selectedCamera) return setError("Please select a lens.");
        
        await stopScannerInstance(); 
        setIsCameraActive(true);
        setError('');
        setTicketData(null);

        // Timeout ensures the DOM element #reader is ready
        setTimeout(async () => {
            try {
                const scanner = new Html5Qrcode("reader");
                html5QrCodeRef.current = scanner;

                const config = {
                    fps: 25, // Higher FPS for faster capture
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        const size = Math.floor(minEdge * 0.8);
                        return { width: size, height: size };
                    },
                    aspectRatio: 1.0
                };

                await scanner.start(
                    selectedCamera, 
                    config, 
                    (decodedText) => handleScannedID(decodedText),
                    () => {} // Quietly skip frame processing errors
                );
            } catch (err) {
                console.error("Camera Start Error:", err);
                setError("Failed to start camera. Lens might be in use.");
                setIsCameraActive(false);
            }
        }, 300);
    };

    // --- 7. Processing & Verification Logic ---
    const handleScannedID = (decodedText) => {
        // Regex to extract the 24-character MongoDB ID
        const cleanID = decodedText.replace('TicketID:', '').trim();
        const idMatch = cleanID.match(/[a-f\d]{24}/i);
        
        if (idMatch) {
            playSuccessBeep(); // 🔊 Play Beep
            stopScannerInstance();
            setIsCameraActive(false);
            verifyTicket(idMatch[0]);
        }
    };

    const verifyTicket = async (id) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/verify/${id}`);
            const ticket = res.data;
            
            const travelDate = new Date(ticket.travelDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0); travelDate.setHours(0, 0, 0, 0);

            setTicketStatus(travelDate < today ? 'expired' : 'valid');
            setTicketData(ticket);
        } catch (err) { 
            setError("❌ Invalid Ticket: No database record found."); 
        } finally { 
            setLoading(false); 
        }
    };

    // --- 8. High-Accuracy Media Scan (Screenshot fix) ---
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true); setError(''); setTicketData(null);
        await stopScannerInstance();

        try {
            const scanner = new Html5Qrcode("file-scan-worker");
            // Pass 1: Raw scan attempt
            try {
                const result = await scanner.scanFile(file, true);
                handleScannedID(result);
            } catch (err) {
                // Pass 2: Vision Repair attempt (sharpening image)
                const repairedResult = await attemptManualRepair(file);
                handleScannedID(repairedResult);
            }
        } catch (err) {
            setError("QR Code not readable. Ensure the image is clear and sharp.");
        } finally {
            setLoading(false);
            e.target.value = null; 
        }
    };

    const attemptManualRepair = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = async () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width; canvas.height = img.height;
                    
                    // Vision Pre-processing for accurate scanning
                    ctx.filter = 'contrast(2.5) grayscale(1)'; 
                    ctx.drawImage(img, 0, 0);
                    
                    canvas.toBlob(async (blob) => {
                        const repairedFile = new File([blob], "temp.png", { type: "image/png" });
                        const scanner = new Html5Qrcode("file-scan-worker");
                        try {
                            const res = await scanner.scanFile(repairedFile, false);
                            resolve(res);
                        } catch (err) { reject(err); }
                    });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 font-sans">
            
            {/* HIDDEN WORKER FOR FILE PROCESSING */}
            <div id="file-scan-worker" style={{ display: 'none' }}></div>

            <header className="text-center mb-10 animate-in fade-in duration-1000">
                <div className="bg-indigo-600/20 p-5 rounded-full w-fit mx-auto mb-4 border border-indigo-500/30 shadow-[0_0_40px_rgba(79,70,229,0.3)]">
                    <QrCode className="text-indigo-500" size={50} />
                </div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Ente Bus Verifier</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Ticket Information View</p>
            </header>

            {/* --- SCANNER OVERLAY --- */}
            {isCameraActive && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
                    <div className="relative w-full max-w-md aspect-square rounded-[3rem] border-4 border-indigo-600 overflow-hidden shadow-[0_0_80px_rgba(79,70,229,0.4)]">
                        <div id="reader" className="w-full h-full bg-slate-950"></div>
                        
                        <div className="absolute inset-0 border-[50px] border-black/50 pointer-events-none"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-indigo-400 rounded-3xl animate-pulse pointer-events-none"></div>
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-indigo-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                           Auto-Scan Active
                        </div>
                    </div>
                    <button onClick={() => { stopScannerInstance(); setIsCameraActive(false); }} className="mt-12 bg-red-600 hover:bg-red-700 px-12 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl active:scale-95 transition-all">
                        <StopCircle size={24} /> Terminate Scan
                    </button>
                </div>
            )}

            {/* --- DASHBOARD ACTIONS (Visible when no ticket or camera) --- */}
            {!ticketData && !loading && !error && !isCameraActive && (
                <div className="w-full max-w-sm space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-2xl">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2 block ml-1">Hardware Lens</label>
                        <div className="relative">
                            <select value={selectedCamera} onChange={(e) => setSelectedCamera(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl font-bold text-sm outline-none appearance-none pr-10 focus:ring-2 ring-indigo-500 transition-all">
                                {cameras.length === 0 && <option>Searching hardware...</option>}
                                {cameras.map(cam => <option key={cam.id} value={cam.id}>{cam.label || `Lens ${cam.id.slice(0,5)}`}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>
                        <button onClick={initHardware} className="text-[10px] text-indigo-500 font-bold mt-3 ml-1 flex items-center gap-1 active:scale-95 transition-all">
                           <RefreshCw size={10}/> Reload Camera Hardware
                        </button>
                    </div>

                    <button onClick={startCamera} className="w-full bg-indigo-600 hover:bg-indigo-500 py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all">
                        <Camera size={32} /> Launch Scanner
                    </button>

                    <div className="flex items-center gap-4 py-2 opacity-30">
                        <div className="h-px bg-gray-500 flex-1"></div>
                        <span className="text-[10px] font-black">OR</span>
                        <div className="h-px bg-gray-500 flex-1"></div>
                    </div>

                    <div onClick={() => fileInputRef.current.click()} className="bg-slate-800/50 p-10 rounded-3xl border-2 border-dashed border-slate-700 text-center cursor-pointer hover:border-indigo-500 group transition-all shadow-2xl">
                        <ImageIcon size={48} className="mx-auto text-slate-600 group-hover:text-indigo-500 mb-4 transition-colors" />
                        <p className="font-bold text-slate-400 group-hover:text-slate-200 uppercase text-xs">Verify from Screenshot</p>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                </div>
            )}

            {/* --- VERIFICATION RESULT CARD --- */}
            {ticketData && (
                <div className="w-full max-w-md bg-white text-slate-900 rounded-[2.5rem] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.5)] animate-in zoom-in duration-500 border border-gray-200">
                    <div className={`${ticketStatus === 'valid' ? 'bg-green-600' : 'bg-orange-500'} p-7 text-white text-center font-black text-xl tracking-wide flex items-center justify-center gap-3 shadow-lg`}>
                        {ticketStatus === 'valid' ? <CheckCircle size={28} /> : <AlertTriangle size={28} />}
                        {ticketStatus === 'valid' ? 'TICKET VERIFIED' : 'TICKET EXPIRED'}
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Passenger Row */}
                        <div className="flex gap-5 border-b border-gray-100 pb-5">
                            <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><User size={28} /></div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Identity</p>
                                <p className="font-bold text-2xl text-gray-800 leading-tight">{ticketData.customerName || "Guest User"}</p>
                            </div>
                        </div>

                        {/* Bus Service Row */}
                        <div className="flex gap-5 border-b border-gray-100 pb-5">
                            <div className="bg-orange-50 p-4 rounded-2xl text-orange-600"><Bus size={28} /></div>
                            <div className="flex-1">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Assigned Route</p>
                                <p className="font-bold text-xl text-gray-900 leading-tight">{ticketData.busId?.name || "EnteBus Standard"}</p>
                                <div className="text-indigo-600 font-black text-sm flex items-center gap-2 mt-1">
                                   <span>{ticketData.busId?.from}</span>
                                   <ArrowRight size={14} className="opacity-30"/>
                                   <span>{ticketData.busId?.to}</span>
                                </div>
                            </div>
                        </div>

                        {/* Travel Data Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Date</p>
                                <p className="font-black text-lg text-gray-800">{ticketData.travelDate}</p>
                            </div>
                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Seats</p>
                                <p className="font-black text-lg text-gray-800 tracking-widest">{ticketData.seatNumbers.join(', ')}</p>
                            </div>
                        </div>

                        {/* Departure Timing */}
                        <div className="bg-indigo-900 text-white p-4 rounded-2xl text-center shadow-lg">
                           <p className="text-[10px] font-black uppercase opacity-60">Departure Time</p>
                           <p className="text-xl font-bold">{formatTime(ticketData.busId?.departureTime)}</p>
                        </div>

                        <button onClick={() => setTicketData(null)} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg active:scale-95 transition-all shadow-xl hover:bg-slate-800">Verify Next Ticket</button>
                    </div>
                </div>
            )}

            {/* --- ERROR CARD --- */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 p-10 rounded-[2.5rem] text-center max-w-sm shadow-2xl animate-in zoom-in">
                    <XCircle size={72} className="mx-auto text-red-500 mb-6" />
                    <p className="text-red-400 font-bold mb-10 text-lg leading-relaxed">{error}</p>
                    <button onClick={() => {setError(''); setTicketData(null);}} className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all">Try Again</button>
                </div>
            )}

            {/* --- GLOBAL LOADER --- */}
            {loading && (
                <div className="text-center py-10 animate-in fade-in">
                    <Loader className="animate-spin text-indigo-500 mx-auto" size={64} />
                    <p className="mt-6 font-black uppercase text-[10px] tracking-widest text-slate-500">Retrieving Database Record...</p>
                </div>
            )}
        </div>
    );
}