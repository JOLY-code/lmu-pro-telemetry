import React from 'react';
import { 
  Zap, AlertTriangle, CheckCircle2, Upload, Search, 
  Calendar, MapPin, CarFront, Play, Activity, Route 
} from 'lucide-react';

// --- COMPOSANT VUE DASHBOARD (Centre de commandement & Import) ---
const DashboardView = ({ setActiveMenu }: any) => {
  // Historique vidé, on garde juste une ligne "fantôme" pour la structure UI
  const recentSessions = [
    { id: 1, date: '--', track: 'AWAITING DATA...', car: '--', laps: 0, best: '0:00.000', condition: '--' }
  ];

  return (
    <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
      
      {/* LIGNE DU HAUT : Insights Globaux & Importation */}
      <div className="flex gap-6 h-72">
        
        {/* PANEL GAUCHE : AI Track Engineer Summary */}
        <div className="flex-[2] bg-[#1c1e2b] border border-[#8338ec]/50 shadow-[0_0_20px_rgba(131,56,236,0.1)] rounded-xl flex flex-col overflow-hidden relative">
          <div className="bg-[#181924] border-b border-gray-800 p-4 flex justify-between items-center z-10 relative">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#8338ec]/20 border-2 border-[#8338ec] flex items-center justify-center">
                <Zap size={18} className="text-[#8338ec]" />
              </div>
              <div>
                <h3 className="text-white font-black tracking-widest text-sm flex items-center gap-2">PERFORMANCE SUMMARY</h3>
                <p className="text-[#a855f7] text-[10px] font-bold tracking-widest uppercase mt-0.5">Based on your latest sessions</p>
              </div>
            </div>
            <div className="bg-[#1c1e2b] text-[#a0a3b5] border border-gray-700 px-3 py-1.5 rounded font-black text-xs tracking-widest">
              RATING: --
            </div>
          </div>
          
          <div className="flex-1 p-5 grid grid-cols-2 gap-6 z-10 relative">
            <div className="flex flex-col gap-2">
              <h4 className="text-[#e76f51] text-[10px] font-black tracking-widest flex items-center gap-2 mb-1"><AlertTriangle size={12}/> MAJOR TIME LOSS</h4>
              <div className="bg-[#212332] p-3 rounded border border-gray-800 flex flex-col gap-1 shadow-md opacity-60">
                <span className="text-white text-xs font-bold">Awaiting Telemetry</span>
                <span className="text-[#a0a3b5] text-[11px] leading-relaxed">Complete a valid stint to allow the AI to detect your time loss sectors.</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-[#2a9d5c] text-[10px] font-black tracking-widest flex items-center gap-2 mb-1"><CheckCircle2 size={12}/> STRENGTHS</h4>
              <div className="bg-[#212332] p-3 rounded border border-gray-800 flex flex-col gap-1 shadow-md opacity-60">
                <span className="text-white text-xs font-bold">Awaiting Telemetry</span>
                <span className="text-[#a0a3b5] text-[11px] leading-relaxed">Your driving strengths and consistencies will be highlighted here.</span>
              </div>
            </div>
          </div>
          <Activity size={250} className="absolute -bottom-16 -right-16 text-[#8338ec] opacity-5 pointer-events-none" />
        </div>

        {/* PANEL DROITE : Import & Compare Engine (Intact) */}
        <div className="flex-1 bg-[#1c1e2b] border border-gray-800 rounded-xl flex flex-col p-5 shadow-lg relative overflow-hidden">
          <h3 className="text-white font-black tracking-widest text-sm flex items-center gap-2 mb-4 z-10">TELEMETRY ENGINE</h3>
          
          <div className="flex-1 flex flex-col gap-3 z-10">
            <button className="flex-1 bg-[#3a86ff]/10 border border-[#3a86ff]/50 hover:bg-[#3a86ff] hover:border-[#3a86ff] transition-all rounded-lg flex flex-col items-center justify-center gap-2 group shadow-[0_0_15px_rgba(58,134,255,0.1)]">
              <Upload size={24} className="text-[#3a86ff] group-hover:text-white transition-colors" />
              <span className="text-[#3a86ff] group-hover:text-white text-xs font-bold tracking-widest uppercase">Connect DuckDB Stream (.db)</span>
            </button>

            <button className="flex-1 bg-[#212332] border border-gray-700 hover:bg-gray-800 transition-all rounded-lg flex flex-col items-center justify-center gap-2">
              <Search size={24} className="text-[#a0a3b5]" />
              <span className="text-white text-xs font-bold tracking-widest uppercase">Load Reference Lap</span>
            </button>
          </div>
        </div>

      </div>

      {/* LIGNE DU BAS : Historique des Sessions */}
      <div className="flex-1 bg-[#1c1e2b] border border-gray-800 rounded-xl flex flex-col shadow-lg overflow-hidden">
        <div className="bg-[#181924] border-b border-gray-800 p-4 flex justify-between items-center">
          <h3 className="text-white font-black tracking-widest text-sm flex items-center gap-2"><Calendar size={16} className="text-[#3a86ff]"/> RECENT SESSIONS</h3>
          <span className="text-[#a0a3b5] text-xs font-bold">Showing 0 sessions</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-2">
            {recentSessions.map((session) => (
              <div 
                key={session.id}
                onClick={() => setActiveMenu('Sessions')}
                className="bg-[#212332] border border-gray-800 hover:border-[#3a86ff]/50 hover:bg-[#181924] transition-all rounded-lg p-4 flex items-center justify-between cursor-pointer group opacity-50"
              >
                <div className="flex items-center gap-8 w-1/2">
                  <div className="flex flex-col w-32">
                    <span className="text-[#a0a3b5] text-[10px] font-black tracking-widest">{session.date}</span>
                    <span className="text-[#3a86ff] text-xs font-bold mt-1">{session.condition}</span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-white text-sm font-black tracking-wider flex items-center gap-2"><MapPin size={14} className="text-gray-500"/> {session.track}</span>
                    <span className="text-[#a0a3b5] text-xs font-bold mt-1 flex items-center gap-2"><CarFront size={14}/> {session.car}</span>
                  </div>
                </div>

                <div className="flex items-center gap-12">
                  <div className="flex flex-col items-center">
                    <span className="text-[#a0a3b5] text-[10px] font-black tracking-widest">LAPS</span>
                    <span className="text-white text-lg font-mono font-bold">{session.laps}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[#a0a3b5] text-[10px] font-black tracking-widest">BEST LAP</span>
                    <span className="text-[#a0a3b5] text-lg font-mono font-bold">{session.best}</span>
                  </div>
                  <button className="w-10 h-10 rounded-full bg-[#3a86ff] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_#3a86ff]">
                    <Play size={18} className="ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default DashboardView;