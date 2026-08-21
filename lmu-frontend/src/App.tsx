import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, LineChart, Wrench, Trophy, UserCircle, HelpCircle, 
  CloudRain, Thermometer, MapPin, CarFront, CalendarDays, FileText, BarChart2, Compass, Timer
} from 'lucide-react';

import DashboardView from './views/DashboardView';
import ScheduleView from './views/ScheduleView';
import SetupView from './views/SetupView';
import SessionsHistoryView from './views/SessionsHistoryView';
import AnalyticsView from './views/AnalyticsView';
import SessionDetailView from './views/SessionDetailView';
import { DataView, DrivingView, TimingView } from './views/TelemetryViews';





export default function App() {
  const [activeMenu, setActiveMenu] = useState('Sessions');
  const [subView, setSubView] = useState<'driving' | 'data' | 'timing'>('data');
  const [selectedHistorySession, setSelectedHistorySession] = useState<any | null>(null); // NOUVEAU
  
  // =========================================================================
  // 1. ÉTATS DE POST-ANALYSE (DuckDB / REST API)
  // =========================================================================
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [aiSetup, setAiSetup] = useState<any>(null);
  const [aiReport, setAiReport] = useState<string[]>([]);
  const [sessionInfo, setSessionInfo] = useState<any>(null); // NOUVEAU: Stockage du contexte
  
  // Tableau des tours (On garde un tour vide par défaut pour la structure)
  const [lapsData, setLapsData] = useState<any[]>([
    { lap: '-', time: '0:00.000', diff: '--', active: true }
  ]);

  // =========================================================================
  // 2. ÉTAT TEMPS RÉEL (Mémoire Partagée LMU / WebSocket)
  // =========================================================================
  const [liveData, setLiveData] = useState<any>(null);
  const lastWsTime = useRef(0); 

  // --- REQUÊTE API REST (Au chargement) ---
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        // 1. On récupère d'abord les infos du circuit et de la voiture
        const sessRes = await fetch('http://127.0.0.1:8000/api/sessions/latest');
        const sessData = await sessRes.json();
        if (sessData.status === 'success') {
          setSessionInfo(sessData.session);
        }

        // 2. On récupère le diagnostic et le nouveau Setup
        const response = await fetch('http://127.0.0.1:8000/api/diagnostic');
        const data = await response.json();
        
        if (data.status === 'success') {
           if (data.telemetry) setHistoricalData(data.telemetry);
           if (data.new_setup) setAiSetup(data.new_setup);
           if (data.report) setAiReport(data.report);
           
           if (data.laps && data.laps.length > 0) {
             const formattedLaps = data.laps.map((l: any) => ({
               lap: `L${l.Lap}`,
               time: l.LapTime.toFixed(3),
               diff: l.Valid === 1 ? 'VALID' : 'INVALID',
               active: false
             }));
             setLapsData(formattedLaps.reverse());
           }
        }
      } catch(err) {
        console.error("En attente du serveur Python...");
      }
    };
    fetchTelemetry();
  }, []);

  // --- CONNEXION WEBSOCKET (Temps Réel) ---
  useEffect(() => {
    const ws = new WebSocket('ws://127.0.0.1:8000/ws/telemetry');

    ws.onmessage = (event) => {
      const now = performance.now();
      // THROTTLING CHIRURGICAL : 
      // On met à jour l'interface seulement toutes les 50ms (~20 Hz)
      // L'API Python tourne toujours à 60Hz en arrière-plan sans surcharger le front-end.
      if (now - lastWsTime.current > 50) {
        try {
          const parsedData = JSON.parse(event.data);
          setLiveData(parsedData);
          lastWsTime.current = now;
        } catch (err) {
          console.error("Erreur de parsing WebSocket", err);
        }
      }
    };

    ws.onclose = () => console.log("Lien Télémétrique (WebSocket) coupé.");

    // Cleanup : on ferme proprement le flux si le composant est détruit
    return () => ws.close();
  }, []);

  // Menu latéral
  // Menu latéral
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Schedule', icon: <CalendarDays size={20} /> },
    { name: 'Analytics', icon: <BarChart2 size={20} /> }, 
    { name: 'Sessions', icon: <FileText size={20} /> }, // NOUVEAU : Historique XML
    { name: 'Telemetry', icon: <LineChart size={20} /> }, // RENOMMÉ : L'ancienne vue complexe
    { name: 'Setups', icon: <Wrench size={20} /> },
    { name: 'Leaderboards', icon: <Trophy size={20} /> },
    { name: 'Team', icon: <UserCircle size={20} /> },
    { name: 'Support', icon: <HelpCircle size={20} /> },
  ];

  return (
    <div className="flex h-screen w-full bg-[#181924] overflow-hidden font-sans text-white">
      
      {/* 1. SIDEBAR PRINCIPALE (INTACTE) */}
      <div className="w-64 bg-[#212332] flex flex-col border-r border-gray-800">
        <div className="p-6 flex items-center gap-3 border-b border-gray-800">
          <div className="w-8 h-8 bg-[#3a86ff] rounded-md flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
            LMU
          </div>
          <span className="font-bold text-lg tracking-wide">PRO ENGINEER</span>
        </div>

        <nav className="flex-1 py-4">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setActiveMenu(item.name);
                if (item.name !== 'Sessions') setSelectedHistorySession(null); // Réinitialise la vue
              }}
              className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-200 ... `}
            >
              <span className={activeMenu === item.name ? 'text-[#3a86ff]' : ''}>
                {item.icon}
              </span>
              <span className="text-sm tracking-wider">{item.name.toUpperCase()}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 flex items-center gap-3 bg-[#1c1e2b]">
          <div className="w-10 h-10 bg-[#3a86ff]/20 text-[#3a86ff] rounded-full flex items-center justify-center font-bold">
            MJ
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-bold">Mathéo Joly</span>
            <span className="text-xs text-[#3a86ff] font-bold">PRO-AM DRIVER</span>
          </div>
        </div>
      </div>

      {/* 2. ZONE PRINCIPALE */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* HEADER TOP BAR (Statuts Météo et Live Data) */}
        <div className="h-16 bg-[#181924] border-b border-gray-800 px-6 flex items-center justify-between text-xs font-semibold text-[#a0a3b5]">
          <div className="flex items-center gap-3">
            
            <div className="bg-[#1e3b2e] text-[#2a9d5c] px-3 py-1.5 rounded font-black tracking-widest flex items-center gap-2">
              <span className="italic">LM</span> P
            </div>
            
            {/* Injection dynamique du Circuit et de la Météo (DuckDB ou Live) */}
            <div className="bg-[#1c1e2b] px-4 py-2 rounded-md flex items-center gap-4 border border-gray-800/50">
              <span className="text-white font-bold tracking-wide flex items-center gap-2">
                <MapPin size={14} className="text-[#3a86ff]"/> 
                {sessionInfo ? sessionInfo.TrackName : 'AWAITING TRACK DATA'}
              </span>
              <span className="flex items-center gap-1 text-[#3a86ff]">
                <CloudRain size={14} /> 
                {liveData?.RainIntensity !== undefined 
                  ? (liveData.RainIntensity * 100).toFixed(0) 
                  : (sessionInfo ? (sessionInfo.RainPathLevel * 100).toFixed(0) : '--')}%
              </span>
              <span className="flex items-center gap-1 text-[#e76f51]">
                <Thermometer size={14} /> 
                {liveData?.TrackTemp !== undefined 
                  ? liveData.TrackTemp.toFixed(1) 
                  : (sessionInfo ? sessionInfo.TrackTemp.toFixed(1) : '--')}°C
              </span>
            </div>
            
            {/* Injection dynamique de la Voiture */}
            <div className="bg-[#1c1e2b] px-4 py-2 rounded-md flex items-center gap-2 border border-gray-800/50">
              <CarFront size={14} className="text-[#e9c46a]"/>
              <span className="text-white font-bold tracking-wider">
                {sessionInfo ? `${sessionInfo.VehicleName} (${sessionInfo.VehicleClass})` : 'AWAITING CAR DATA'}
              </span>
            </div>
          </div>
          
          {/* Signal visuel de connexion au Live */}
          <div className="bg-[#1c1e2b] px-4 py-2 rounded-md flex items-center gap-2 border border-gray-800/50">
            <div className={`w-2 h-2 rounded-full ${liveData ? 'bg-[#2a9d5c] shadow-[0_0_8px_#2a9d5c] animate-pulse' : 'bg-[#e76f51]'}`}></div>
            <span className="text-white font-mono ml-2">{liveData ? 'LIVE TELEMETRY ACTIVE' : 'OFFLINE'}</span>
          </div>
        </div>

        {/* ROUTING DES VUES (Injection des props) */}
        <div className="flex-1 flex overflow-hidden">
          
          {activeMenu === 'Sessions' && (
            <div className="w-16 bg-[#1c1e2b] border-r border-gray-800 flex flex-col items-center py-6 gap-6">
              <button onClick={() => setSubView('driving')} className={`p-3 rounded-xl transition-all ${subView === 'driving' ? 'bg-[#3a86ff] text-white shadow-[0_0_15px_rgba(58,134,255,0.4)]' : 'text-[#a0a3b5] hover:bg-gray-800'}`}><Compass size={22} /></button>
              <button onClick={() => setSubView('timing')} className={`p-3 rounded-xl transition-all ${subView === 'timing' ? 'bg-[#3a86ff] text-white shadow-[0_0_15px_rgba(58,134,255,0.4)]' : 'text-[#a0a3b5] hover:bg-gray-800'}`}><Timer size={22} /></button>
              <button onClick={() => setSubView('data')} className={`p-3 rounded-xl transition-all ${subView === 'data' ? 'bg-[#3a86ff] text-white shadow-[0_0_15px_rgba(58,134,255,0.4)]' : 'text-[#a0a3b5] hover:bg-gray-800'}`}><BarChart2 size={22} /></button>
            </div>
          )}
          <div className="flex-1 p-6 overflow-hidden flex gap-6">
            {activeMenu === 'Dashboard' ? (
              <DashboardView setActiveMenu={setActiveMenu} />
            ) : activeMenu === 'Schedule' ? (
              <ScheduleView />
            ) : activeMenu === 'Analytics' ? (
              <AnalyticsView 
                setActiveMenu={setActiveMenu} 
                setSelectedHistorySession={setSelectedHistorySession} 
              />
            ) : activeMenu === 'Sessions' ? (
              selectedHistorySession ? (
                <SessionDetailView 
                  session={selectedHistorySession} 
                  onBack={() => setSelectedHistorySession(null)} 
                />
              ) : (
                <SessionsHistoryView onSelectSession={setSelectedHistorySession} /> 
              )
            ) : activeMenu === 'Telemetry' ? (
              subView === 'driving' ? (
                <DrivingView laps={lapsData} historicalData={historicalData} liveData={liveData} /> 
              ) : subView === 'timing' ? (
                <TimingView laps={lapsData} liveData={liveData} />
              ) : (
                <DataView laps={lapsData} historicalData={historicalData} liveData={liveData} />
              )
            ) : activeMenu === 'Setups' ? (
              <SetupView currentSetup={aiSetup} aiReport={aiReport} />
            ) : (
              <div className="flex-1 bg-[#212332] rounded-xl border border-gray-800 flex items-center justify-center text-[#a0a3b5] font-bold">
                Module {activeMenu} is under construction...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}