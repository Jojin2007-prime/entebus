import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import jsQR from 'jsqr';
import { 
  QrCode, CheckCircle, XCircle, Loader, Bus, 
  User, ImageIcon, RefreshCw,
  X, AlertTriangle, Download, Calendar, MapPin, StopCircle, Camera, ChevronDown
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

    // --- 1. FORCE PERMISSION & FETCH ALL CAMERAS ---
    const loadCameras = async () => {
        try {
            setError('');
            // Trigger the "Allow" popup first
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            
            // Once allowed, we can see the real labels (Back Camera, Front Camera)
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            setCameras(videoDevices);
            
            // Set default: Prefer the "back" camera
            if (videoDevices.length > 0) {
                const backCam = videoDevices.find(dev => dev.label.toLowerCase().includes('back')) || videoDevices[videoDevices.length - 1];
                setSelectedCamera(backCam.deviceId);
            }

            // Stop the temporary stream so the camera light turns off
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            console.error("Camera Error:", err);
            setError("Camera access denied. Please enable camera permissions in your browser settings.");
        }
    };

    useEffect(() => {
        loadCameras();
    }, []);

    // --- 2. START THE CHOSEN CAMERA ---
    const startCamera = async () => {
        if (!selectedCamera) return setError("No camera selected.");
        
        setIsCameraActive(true);
        setError('');
        setTicketData(null);
        
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
                requestRef.current = requestAnimationFrame(scanFrame);
            }
        } catch (err) {
            setError("Failed to start this lens. Try picking a different one from the list.");
            setIsCameraActive(false);
        }
    };

    const stopCamera = () => {
        setIsCameraActive(false);
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };

    // --- 3. THE ACCURATE SCAN ENGINE ---
    const scanFrame = () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const context = canvas.getContext('2d', { willReadFrequently: true });
            
            canvas.height = videoRef.current.videoHeight;
            canvas.width = videoRef.current.videoWidth;
            
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
        if (isCameraActive) {
            requestRef.current = requestAnimationFrame(scanFrame);
        }
    };

    // --- 4. ACCURATE IMAGE UPLOAD (REPAIR LOGIC) ---
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true); setError('');

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width; canvas.height = img.height;
                
                // Scan 1: Enhance Contrast
                ctx.filter = 'contrast(2.5) grayscale(1)';
                ctx.drawImage(img, 0, 0);
                let data = ctx.getImageData(0, 0, canvas.width, canvas.height);
                let code = jsQR(data.data, data.width, data.height, { inversionAttempts: "attemptBoth" });

                // Scan 2: Thresholding (For very old/blurry codes)
                if (!code) {
                    const pixels = data.data;
                    for (let i = 0; i < pixels.length; i += 4) {
                        const v = (pixels[i] + pixels[i+1] + pixels[i+2]) / 3 < 128 ? 0 : 255;
                        pixels[i] = pixels[i+1] = pixels[i+2] = v;
                    }
                    ctx.putImageData(data, 0, 0);
                    code = jsQR(pixels, data.width, data.height, { inversionAttempts: "attemptBoth" });
                }

                if (code) {
                    const idMatch = code.data.match(/[a-f\d]{24}/i);
                    if (idMatch) verifyTicket(idMatch[0]);
                } else setError("Could not read QR. Please try a clearer screenshot.");
                setLoading(false);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    // --- 5. VERIFICATION LOGIC ---
    const verifyTicket = async (id) => {
        setLoading(true); setTicketData(null); setError(''); setTicketStatus(null);
        try {
            const res = await axios.get(`https://entebus-api.onrender.com/api/verify/${id}`);
            const ticket = res.data;
            const travelDate = new Date(ticket.travelDate);
            const today = new Date();
            today.setHours(0,0,0,0); travelDate.setHours(0,0,0,0);

            setTicketStatus(travelDate < today ? 'expired' : 'valid');
            setTicketData(ticket);
        } catch (err) { setError("❌ Ticket record not found in database."); }
        finally { setLoading(false); }
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
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 font-sans">
            
            <header className="text-center mb-10">
                <div className="bg-indigo-600/20 p-5 rounded-full w-fit mx-auto mb-4 border border-indigo-500/30 shadow-[0_0_30px_rgba(79,70,229,0.3)]">
                    <QrCode className="text-indigo-500" size={50} />
                </div>
                <h2 className="text-3xl font-black tracking-tight">Ente Bus Verifier</h2>
                <p className="text-gray-500 text-sm mt-1">Multi-Lens Web Scanner</p>
            </header>

            {/* LIVE CAMERA OVERLAY */}
            {isCameraActive && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
                    <div className="relative w-full max-w-md aspect-square rounded-[3rem] border-4 border-indigo-500 overflow-hidden shadow-[0_0_60px_#4f46e5]">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />
                        
                        {/* Scanner Viewfinder UI */}
                        <div className="absolute inset-0 border-[60px] border-black/50"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-indigo-400 rounded-3xl animate-pulse"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1 bg-indigo-500 shadow-[0_0_15px_#4f46e5]"></div>
                    </div>
                    <button onClick={stopCamera} className="mt-10 bg-red-600 hover:bg-red-700 px-12 py-4 rounded-2xl font-black flex items-center gap-3 transition-all active:scale-95">
                        <StopCircle size={24} /> Close Scanner
                    </button>
                </div>
            )}

            {!ticketData && !loading && !error && !isCameraActive && (
                <div className="w-full max-w-sm space-y-6">
                    {/* CAMERA SELECTOR */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Select Active Lens</label>
                        <div className="relative">
                            <select 
                                value={selectedCamera} 
                                onChange={(e) => setSelectedCamera(e.target.value)}
                                className="w-full bg-gray-800 border-2 border-gray-700 p-4 rounded-2xl appearance-none font-bold outline-none focus:border-indigo-500 transition-all text-sm"
                            >
                                {cameras.length === 0 && <option>Detecting hardware...</option>}
                                {cameras.map(cam => (
                                    <option key={cam.deviceId} value={cam.deviceId}>
                                        {cam.label || `Camera ${cam.deviceId.slice(0, 5)}`}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        </div>
                        <button onClick={loadCameras} className="text-[10px] text-indigo-400 flex items-center gap-1 font-bold mt-1 ml-1 active:scale-95"><RefreshCw size={10}/> Reload Lenses</button>
                    </div>

                    <button onClick={startCamera} className="w-full bg-indigo-600 hover:bg-indigo-500 py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-4 transition-all shadow-xl active:scale-95 shadow-indigo-900/30">
                        <Camera size={32} /> Open Scanner
                    </button>

                    <div className="flex items-center gap-4 py-2">
                        <div className="h-px bg-gray-800 flex-1"></div>
                        <span className="text-gray-600 text-[10px] font-black uppercase">OR</span>
                        <div className="h-px bg-gray-800 flex-1"></div>
                    </div>

                    <div onClick={() => fileInputRef.current.click()} className="bg-gray-800 p-10 rounded-3xl border-2 border-dashed border-gray-700 text-center cursor-pointer hover:border-indigo-500 transition-all group shadow-2xl">
                        <ImageIcon size={48} className="mx-auto text-gray-600 group-hover:text-indigo-500 mb-4 transition-colors" />
                        <p className="font-bold text-gray-400">Upload Screenshot</p>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                </div>
            )}

            {/* RESULTS CARD */}
            {ticketData && (
                <div className="w-full max-w-md bg-white text-gray-900 rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] animate-in zoom-in">
                    <div className={`${ticketStatus === 'valid' ? 'bg-green-600' : 'bg-orange-500'} p-6 text-white text-center font-black text-xl tracking-wide flex items-center justify-center gap-3 shadow-lg`}>
                        {ticketStatus === 'valid' ? <CheckCircle size={28} /> : <AlertTriangle size={28} />}
                        {ticketStatus === 'valid' ? 'TICKET VERIFIED' : 'TICKET EXPIRED'}
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="flex gap-5 border-b border-gray-100 pb-5">
                            <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><User size={28} /></div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Passenger</p>
                                <p className="font-bold text-2xl text-gray-800 leading-tight">{ticketData.customerName}</p>
                            </div>
                        </div>

                        <div className="flex gap-5 border-b border-gray-100 pb-5">
                            <div className="bg-orange-50 p-4 rounded-2xl text-orange-600"><Bus size={28} /></div>
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Bus Service</p>
                                <p className="font-bold text-xl text-gray-900 mb-1 leading-tight">{ticketData.busId?.name || "KSRTC Super Fast"}</p>
                                <div className="text-indigo-600 font-black text-sm">{ticketData.busId?.from} → {ticketData.busId?.to}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100"><p className="text-[10px] text-gray-400 font-black uppercase mb-1">Date</p><p className="font-black text-gray-900 text-lg">{ticketData.travelDate}</p></div>
                            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100"><p className="text-[10px] text-gray-400 font-black uppercase mb-1">Seats</p><p className="font-black text-gray-900 text-lg">{ticketData.seatNumbers?.join(', ')}</p></div>
                        </div>

                        <div className="pt-4 space-y-3">
                            <button onClick={() => downloadTicket(ticketData._id)} disabled={downloading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 shadow-indigo-100">
                                {downloading ? <Loader className="animate-spin" /> : <Download />} Download Ticket
                            </button>
                            <button onClick={() => setTicketData(null)} className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all">Verify Another</button>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 p-8 rounded-[2.5rem] text-center max-w-sm shadow-2xl animate-in zoom-in">
                    <XCircle size={64} className="mx-auto text-red-500 mb-6" />
                    <p className="text-red-400 font-bold mb-8 leading-relaxed">{error}</p>
                    <button onClick={() => {setError(''); setTicketData(null);}} className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-red-900/40 active:scale-95">Try Again</button>
                </div>
            )}

            {loading && <div className="text-center py-10"><Loader className="animate-spin text-indigo-500 mx-auto" size={64} /><p className="mt-6 font-black uppercase text-xs tracking-widest text-gray-500">Querying Database...</p></div>}
        </div>
    );
}