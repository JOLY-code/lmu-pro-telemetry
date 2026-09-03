import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, LineChart, Wrench, CalendarDays, FileText, 
  BarChart2, Compass, Timer, Activity, Menu, ChevronLeft, Scale
} from 'lucide-react';

// --- IMPORTS DES VUES SÉPARÉES ---
import DashboardView from './views/DashboardView';
import ScheduleView from './views/ScheduleView';
import SetupView from './views/SetupView';
import SessionsHistoryView from './views/SessionsHistoryView';
import AnalyticsView from './views/AnalyticsView';
import SessionDetailView from './views/SessionDetailView';
import BoPView from './views/BoPView';
import { 
  DataView, 
  DrivingView, 
  TimingView, 
  TelemetryOverview, 
  TelemetryPitWall, 
  TelemetryLiveSetup 
} from './views/TelemetryViews';

export default function App() {
  // L'application démarre maintenant sur le Dashboard
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [subView, setSubView] = useState<'overview' | 'driving' | 'pitwall' | 'setup' | 'timing' | 'data'>('overview');
  const [selectedHistorySession, setSelectedHistorySession] = useState<any | null>(null); 
  
  // =========================================================================
  // 1. ÉTATS DE POST-ANALYSE (DuckDB / REST API)
  // =========================================================================
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [aiSetup, setAiSetup] = useState<any>(null);
  const [aiReport, setAiReport] = useState<string[]>([]);
  const [sessionInfo, setSessionInfo] = useState<any>(null); 
  
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
        const sessRes = await fetch('http://127.0.0.1:8000/api/sessions/latest');
        const sessData = await sessRes.json();
        if (sessData.status === 'success') {
          setSessionInfo(sessData.session);
        }

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
    return () => ws.close();
  }, []);

  // Menu latéral allégé (Suppression de Leaderboards, Team, Support)
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Schedule', icon: <CalendarDays size={20} /> },
    { name: 'Analytics', icon: <BarChart2 size={20} /> }, 
    { name: 'Sessions', icon: <FileText size={20} /> },
    { name: 'Telemetry', icon: <LineChart size={20} /> },
    { name: 'Setups', icon: <Wrench size={20} /> },
    { name: 'BoP Limits', icon: <Scale size={20} /> }, 
  ];

  return (
    <div className="flex h-screen w-full bg-[#181924] overflow-hidden font-sans text-white">
      
      {/* 1. SIDEBAR PRINCIPALE (RÉTRACTABLE) */}
      <div className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-[#212332] flex flex-col border-r border-gray-800 transition-all duration-300 z-50 shrink-0`}>
        <div className="p-6 flex items-center justify-between border-b border-gray-800 h-20">
          <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'hidden' : 'flex'}`}>
            <div className="w-8 h-8 bg-[#3a86ff] rounded-md flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30 shrink-0">
              LMU
            </div>
            <span className="font-bold text-lg tracking-wide whitespace-nowrap">ENGINEER</span>
          </div>
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-gray-400 hover:text-white p-1 rounded-md bg-[#181924] border border-gray-700 mx-auto transition-colors">
            {isSidebarCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setActiveMenu(item.name);
                if (item.name !== 'Sessions') setSelectedHistorySession(null);
              }}
              className={`w-full flex items-center px-6 py-4 transition-all duration-200 hover:bg-[#181924] ${activeMenu === item.name ? 'border-r-4 border-[#3a86ff] bg-[#181924]' : ''} ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4'}`}
              title={isSidebarCollapsed ? item.name : ''}
            >
              <span className={activeMenu === item.name ? 'text-[#3a86ff]' : 'text-gray-400'}>
                {item.icon}
              </span>
              {!isSidebarCollapsed && <span className={`text-sm tracking-wider ${activeMenu === item.name ? 'font-bold text-white' : 'text-gray-400'}`}>{item.name.toUpperCase()}</span>}
            </button>
          ))}
        </nav>

        <div className={`p-4 border-t border-gray-800 flex items-center bg-[#1c1e2b] transition-all ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 bg-[#3a86ff]/20 text-[#3a86ff] rounded-full flex items-center justify-center font-bold shrink-0">
            MJ
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-sm font-bold truncate">Mathéo Joly</span>
              <span className="text-[10px] text-[#3a86ff] font-bold tracking-widest truncate">PRO-AM DRIVER</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. ZONE PRINCIPALE (Top Bar Supprimée) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* ROUTING DES VUES (Injection des props) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* BARRE LATÉRALE DE LA TÉLÉMÉTRIE */}
          {activeMenu === 'Telemetry' && (
            <div className="w-16 bg-[#1c1e2b] border-r border-gray-800 flex flex-col items-center py-6 gap-6 z-50 shadow-[10px_0_20px_rgba(0,0,0,0.2)]">
              <button onClick={() => setSubView('overview')} className={`p-3 rounded-xl transition-all ${subView === 'overview' ? 'bg-[#3a86ff] text-white shadow-[0_0_15px_rgba(58,134,255,0.4)]' : 'text-[#a0a3b5] hover:bg-gray-800'}`} title="Overview"><LayoutDashboard size={22} /></button>
              <button onClick={() => setSubView('driving')} className={`p-3 rounded-xl transition-all ${subView === 'driving' ? 'bg-[#3a86ff] text-white shadow-[0_0_15px_rgba(58,134,255,0.4)]' : 'text-[#a0a3b5] hover:bg-gray-800'}`} title="Track Map"><Compass size={22} /></button>
              <button onClick={() => setSubView('pitwall')} className={`p-3 rounded-xl transition-all ${subView === 'pitwall' ? 'bg-[#3a86ff] text-white shadow-[0_0_15px_rgba(58,134,255,0.4)]' : 'text-[#a0a3b5] hover:bg-gray-800'}`} title="Pit Wall"><Activity size={22} /></button>
              <button onClick={() => setSubView('setup')} className={`p-3 rounded-xl transition-all ${subView === 'setup' ? 'bg-[#3a86ff] text-white shadow-[0_0_15px_rgba(58,134,255,0.4)]' : 'text-[#a0a3b5] hover:bg-gray-800'}`} title="Live Setup"><Wrench size={22} /></button>
              <div className="w-8 h-[1px] bg-gray-700 my-2"></div>
              <button onClick={() => setSubView('timing')} className={`p-3 rounded-xl transition-all ${subView === 'timing' ? 'bg-[#3a86ff] text-white shadow-[0_0_15px_rgba(58,134,255,0.4)]' : 'text-[#a0a3b5] hover:bg-gray-800'}`} title="Timing"><Timer size={22} /></button>
              <button onClick={() => setSubView('data')} className={`p-3 rounded-xl transition-all ${subView === 'data' ? 'bg-[#3a86ff] text-white shadow-[0_0_15px_rgba(58,134,255,0.4)]' : 'text-[#a0a3b5] hover:bg-gray-800'}`} title="Data Analysis"><BarChart2 size={22} /></button>
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
              
              /* LE ROUTING DE LA TÉLÉMÉTRIE */
              subView === 'overview' ? (
                <TelemetryOverview laps={lapsData} liveData={liveData} />
              ) : subView === 'driving' ? (
                <DrivingView laps={lapsData} historicalData={historicalData} liveData={liveData} /> 
              ) : subView === 'pitwall' ? (
                <TelemetryPitWall laps={lapsData} liveData={liveData} />
              ) : subView === 'setup' ? (
                <TelemetryLiveSetup liveData={liveData} />
              ) : subView === 'timing' ? (
                <TimingView laps={lapsData} liveData={liveData} />
              ) : (
                <DataView laps={lapsData} historicalData={historicalData} liveData={liveData} />
              )

            ) : activeMenu === 'Setups' ? (
              <SetupView currentSetup={aiSetup} aiReport={aiReport} sessionInfo={sessionInfo} />
            ) : activeMenu === 'BoP Limits' ? (
              <BoPView />  
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