import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import jsQR from 'jsqr';
import { 
  QrCode, CheckCircle, XCircle, Loader, Bus, 
  User, ImageIcon, RefreshCw,
  AlertTriangle, Download, Calendar, MapPin, StopCircle, Camera, ChevronDown 
} from 'lucide-react';

export default function TicketVerifier() {
    const [ticketData, setTicketData] = useState(null);
    const [ticketStatus, setTicketStatus] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    
    // Camera States
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const requestRef = useRef(null);

    // --- 1. INITIALIZE HARDWARE & UNLOCK LENS NAMES ---
    const initHardware = async () => {
        try {
            setError('');
            // Permission Handshake: Open a stream to unlock device labels
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            setCameras(videoDevices);
            
            // Auto-select: Prefer 'back' camera for scanning
            if (videoDevices.length > 0) {
                const backCam = videoDevices.find(dev => 
                    dev.label.toLowerCase().includes('back') || 
                    dev.label.toLowerCase().includes('rear')
                ) || videoDevices[videoDevices.length - 1];
                
                setSelectedCamera(backCam.deviceId);
            }

            // Close handshake stream
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            console.error("Hardware Init Error:", err);
            setError("Camera permission denied. Please enable it in browser settings.");
        }
    };

    useEffect(() => {
        initHardware();
    }, []);

    // --- 2. START THE CHOSEN CAMERA ---
    const startCamera = async () => {
        if (!selectedCamera) return setError("No camera detected.");
        
        setIsCameraActive(true);
        setError('');
        setTicketData(null);
        
        // Delay to ensure DOM elements are rendered
        setTimeout(async () => {
            try {
                const constraints = {
                    video: { 
                        deviceId: { exact: selectedCamera },
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                };
                
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.setAttribute("playsinline", "true"); // Fix for iOS Safari
                    videoRef.current.play();
                    requestRef.current = requestAnimationFrame(scanLoop);
                }
            } catch (err) {
                console.error("Stream Error:", err);
                setError("Failed to start this lens. Try picking a different one.");
                setIsCameraActive(false);
            }
        }, 300);
    };

    const stopCamera = () => {
        setIsCameraActive(false);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    // --- 3. THE HIGH-ACCURACY SCAN ENGINE ---
    const scanLoop = () => {
        if (!isCameraActive) return;

        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const context = canvas.getContext('2d', { willReadFrequently: true });
            
            canvas.height = videoRef.current.videoHeight;
            canvas.width = videoRef.current.videoWidth;
            
            // Frame Processing: Boost contrast to help pattern detection
            context.filter = 'contrast(1.2) brightness(1.1)';
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });

            if (code) {
                const idMatch = code.data.match(/[a-f\d]{24}/i);
                if (idMatch) {
                    stopCamera();
                    verifyTicket(idMatch[0]);
                    return;
                }
            }
        }
        requestRef.current = requestAnimationFrame(scanLoop);
    };

    // --- 4. IMAGE UPLOAD REPAIR (For Screenshots) ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true); setError('');

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width; canvas.height = img.height;
                
                // Pass 1: High Contrast Grayscale
                ctx.filter = 'contrast(2.5) grayscale(1)';
                ctx.drawImage(img, 0, 0);
                let data = ctx.getImageData(0, 0, canvas.width, canvas.height);
                let code = jsQR(data.data, data.width, data.height, { inversionAttempts: "attemptBoth" });

                // Pass 2: Binarization Repair
                if (!code) {
                    const pixels = data.data;
                    for (let i = 0; i < pixels.length; i += 4) {
                        const avg = (pixels[i] + pixels[i+1] + pixels[i+2]) / 3;
                        const v = avg < 128 ? 0 : 255;
                        pixels[i] = pixels[i+1] = pixels[i+2] = v;
                    }
                    ctx.putImageData(data, 0, 0);
                    code = jsQR(pixels, data.width, data.height, { inversionAttempts: "attemptBoth" });
                }

                if (code) {
                    const idMatch = code.data.match(/[a-f\d]{24}/i);
                    if (idMatch) verifyTicket(idMatch[0]);
                } else {
                    setError("QR Code not detected. Use a sharper image.");
                }
                setLoading(false);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    // --- 5. GLOBAL VERIFICATION & BUS DISPLAY ---
    const verifyTicket = async (id) => {
        setLoading(true); setTicketData(null); setError('');
        try {
            const res = await axios.get(`https://entebus-api.onrender.com/api/verify/${id}`);
            const ticket = res.data;
            
            const travelDate = new Date(ticket.travelDate);
            const today = new Date();
            today.setHours(0,0,0,0); travelDate.setHours(0,0,0,0);
            
            setTicketStatus(travelDate < today ? 'expired' : 'valid');
            setTicketData(ticket);
        } catch (err) {
            setError("❌ Ticket record not found in database.");
        } finally {
            setLoading(false);
        }
    };

    const downloadTicket = async (id) => {
        setDownloading(true);
        try {
            const res = await axios.get(`https://entebus-api.onrender.com/api/tickets/download/${id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `EnteBus_Ticket_${id}.jpg`);
            document.body.appendChild(link);
            link.click();
            setDownloading(false);
        } catch (e) { setDownloading(false); }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 font-sans">
            
            {/* Header */}
            <header className="text-center mb-10">
                <div className="bg-indigo-600/20 p-5 rounded-full w-fit mx-auto mb-4 border border-indigo-500/30">
                    <QrCode className="text-indigo-500" size={50} />
                </div>
                <h2 className="text-3xl font-black tracking-tight">Ente Bus Verifier</h2>
                <p className="text-slate-400 text-sm">Professional Boarding Scanner</p>
            </header>

            {/* FULL SCREEN SCANNER */}
            {isCameraActive && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
                    <div className="relative w-full max-w-md aspect-square rounded-[2.5rem] border-4 border-indigo-500 overflow-hidden bg-slate-800">
                        <video ref={videoRef} playsInline className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />
                        
                        <div className="absolute inset-0 border-[50px] border-black/50"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-indigo-400 rounded-3xl animate-pulse"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1 bg-indigo-500 shadow-[0_0_15px_#4f46e5]"></div>
                    </div>
                    <button onClick={stopCamera} className="mt-12 bg-red-600 hover:bg-red-700 px-12 py-4 rounded-2xl font-black flex items-center gap-3 transition-all active:scale-95 shadow-xl">
                        <StopCircle size={24} /> Close Scanner
                    </button>
                </div>
            )}

            {/* ACTION DASHBOARD */}
            {!ticketData && !loading && !error && !isCameraActive && (
                <div className="w-full max-w-sm space-y-6 animate-in fade-in duration-500">
                    <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1 mb-2 block">Available Hardware</label>
                        <div className="relative">
                            <select 
                                value={selectedCamera} 
                                onChange={(e) => setSelectedCamera(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl appearance-none font-bold text-sm outline-none focus:border-indigo-500"
                            >
                                {cameras.length === 0 && <option>Waiting for permission...</option>}
                                {cameras.map(cam => (
                                    <option key={cam.deviceId} value={cam.deviceId}>
                                        {cam.label || `Camera ${cam.deviceId.slice(0, 5)}`}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        </div>
                        <button onClick={initHardware} className="text-[10px] text-indigo-400 font-bold flex items-center gap-1 mt-2 ml-1 active:scale-95"><RefreshCw size={10}/> Reload Lens List</button>
                    </div>

                    <button onClick={startCamera} className="w-full bg-indigo-600 hover:bg-indigo-500 py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all shadow-indigo-900/40">
                        <Camera size={32} /> Open Scanner
                    </button>

                    <div onClick={() => fileInputRef.current.click()} className="bg-slate-800/50 p-10 rounded-3xl border-2 border-dashed border-slate-700 text-center cursor-pointer hover:border-indigo-500 transition-all group">
                        <ImageIcon size={48} className="mx-auto text-slate-600 group-hover:text-indigo-500 mb-4 transition-colors" />
                        <p className="font-bold text-slate-400 group-hover:text-slate-200">Upload Image</p>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                </div>
            )}

            {/* RESULTS CARD */}
            {ticketData && (
                <div className="w-full max-w-md bg-white text-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in">
                    <div className={`${ticketStatus === 'valid' ? 'bg-green-600' : 'bg-orange-500'} p-6 text-white text-center font-black text-xl flex items-center justify-center gap-2 shadow-lg`}>
                        {ticketStatus === 'valid' ? <CheckCircle /> : <AlertTriangle />}
                        {ticketStatus === 'valid' ? 'TICKET VERIFIED' : 'TICKET EXPIRED'}
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="flex gap-4 items-center border-b pb-5">
                            <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><User size={28}/></div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Passenger</p>
                                <p className="font-bold text-2xl text-slate-800">{ticketData.customerName}</p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-center border-b pb-5">
                            <div className="bg-orange-50 p-4 rounded-2xl text-orange-600"><Bus size={28}/></div>
                            <div className="flex-1">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Bus Service</p>
                                <p className="font-bold text-xl text-slate-900 leading-tight">{ticketData.busId?.name || "KSRTC Super Fast"}</p>
                                <div className="text-indigo-600 font-black text-sm mt-1">{ticketData.busId?.from} → {ticketData.busId?.to}</div>
                            </div>
                        </div>

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

                        <div className="pt-4 space-y-3">
                            <button onClick={() => downloadTicket(ticketData._id)} disabled={downloading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-indigo-100">
                                {downloading ? <Loader className="animate-spin" /> : <Download size={22}/>}
                                {downloading ? 'Processing...' : 'Download Ticket'}
                            </button>
                            <button onClick={() => setTicketData(null)} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all">Scan Another</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ERROR CARD */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-10 rounded-[2.5rem] text-center max-w-sm shadow-2xl animate-in zoom-in">
                    <XCircle size={72} className="text-red-500 mx-auto mb-6" />
                    <p className="text-red-400 font-bold mb-10 text-lg">{error}</p>
                    <button onClick={() => {setError(''); setTicketData(null);}} className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black shadow-lg shadow-red-900/40 active:scale-95">Try Again</button>
                </div>
            )}

            {/* LOADER */}
            {loading && (
                <div className="text-center py-10">
                    <Loader className="animate-spin text-indigo-500 mx-auto" size={64} />
                    <p className="mt-6 font-black uppercase text-xs tracking-widest text-slate-500">Querying Database...</p>
                </div>
            )}
        </div>
    );
}