import React, { useState, useEffect } from 'react';
import { 
  X, Plus, UploadCloud, Search, Layers, 
  SlidersHorizontal, Trash2, Flag, Trophy, 
  ArrowUp, ArrowDown, CarFront, ChevronRight 
} from 'lucide-react';

import { 
  getTrackCountryCode, 
  getClassColor, 
  CountryFlag 
} from '../lmu_constants';

// --- COMPOSANT VUE SESSIONS HISTORY (Import XML & Historique) ---
const SessionsHistoryView = ({ onSelectSession }: { onSelectSession: (s: any) => void }) => {
  const [showImport, setShowImport] = useState(false);
  
  const [filterSession, setFilterSession] = useState('All Sessions');
  const [filterMode, setFilterMode] = useState('All Modes');
  const [filterTrack, setFilterTrack] = useState('All Tracks');
  const [filterCar, setFilterCar] = useState('All Cars');
  const [filterClass, setFilterClass] = useState('All Classes');
  
  const [historyList, setHistoryList] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetch('http://127.0.0.1:8000/api/sessions/history')
      .then(res => res.json())
      .then(json => {
        if (isMounted && json.status === 'success') {
          setHistoryList(json.data);
        }
      })
      .catch(err => console.error("Erreur historique :", err));
    return () => { isMounted = false; };
  }, []);

  const uniqueSessions = ['All Sessions', ...Array.from(new Set(historyList.map(s => s.type)))];
  const uniqueTracks = ['All Tracks', ...Array.from(new Set(historyList.map(s => s.track)))];
  const uniqueCars = ['All Cars', ...Array.from(new Set(historyList.map(s => s.car)))];
  const uniqueClasses = ['All Classes', 'Hypercar', 'LMP2', 'LMP3', 'LMGT3', 'GTE'];

  const displayList = historyList.filter(s => {
    if (filterSession !== 'All Sessions' && s.type !== filterSession) return false;
    if (filterTrack !== 'All Tracks' && s.track !== filterTrack) return false;
    if (filterCar !== 'All Cars' && s.car !== filterCar) return false;
    if (filterClass !== 'All Classes' && s.class.toUpperCase() !== filterClass.toUpperCase().replace('CAR', '')) return false;
    return true;
  });

  const handleDeleteSession = async (e: React.MouseEvent, filename: string) => {
    e.stopPropagation(); 
    if (window.confirm("Are you sure you want to delete this session data completely?")) {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/sessions/delete?file=${filename}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.status === 'success') {
          setHistoryList(prev => prev.filter(s => s.file !== filename));
        } else { alert("Error: " + data.message); }
      } catch (err) { console.error("Delete failed", err); }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] rounded-xl overflow-hidden shadow-2xl border border-gray-800/50">
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        
        <button onClick={() => setShowImport(!showImport)} className="w-full py-3 bg-[#121318] hover:bg-[#1a1b26] border border-gray-800 rounded-xl text-sm font-bold text-gray-300 transition-colors flex items-center justify-center gap-2 mb-6 shadow-sm">
          {showImport ? <><X size={16}/> Hide Import Options</> : <><Plus size={16}/> Import Session Results</>}
        </button>

        {showImport && (
          <div className="flex flex-col gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <label className="border-2 border-dashed border-gray-700 rounded-xl bg-[#0a0a0f] hover:bg-[#15161d] transition-colors flex flex-col items-center justify-center py-12 cursor-pointer">
                  <UploadCloud size={40} className="text-[#3a86ff] mb-4 animate-bounce" />
                  <h4 className="text-lg font-bold text-white mb-1">Upload Session Results</h4>
                  <p className="text-sm text-gray-400 mb-4">Drop your Le Mans Ultimate XML files here or click to browse</p>
                  <input type="file" accept=".xml" className="hidden" onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      const formData = new FormData();
                      formData.append("file", files[0]);
                      try {
                        const res = await fetch("http://127.0.0.1:8000/api/upload-xml", { method: "POST", body: formData });
                        const data = await res.json();
                        if (data.status === "success") { window.location.reload(); } 
                        else { alert("❌ Erreur : " + data.message); }
                      } catch (err) { alert("❌ Impossible de contacter le serveur Python."); }
                    }} 
                  />
                  <div className="bg-gray-800/50 text-gray-400 text-[10px] font-bold px-3 py-1 rounded-full font-mono">.xml <span className="font-sans font-medium">format only</span></div>
            </label>
          </div>
        )}

        {/* HEADER HISTORY & FILTERS */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-white">Session History</h2>
            <p className="text-sm font-medium text-gray-500">{displayList.length} sessions</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input type="text" placeholder="Search..." className="bg-[#121318] border border-gray-800 text-sm text-white rounded-lg pl-9 pr-4 py-2 outline-none focus:border-[#3a86ff] transition-colors w-40 placeholder-gray-600"/>
            </div>
            <select value={filterSession} onChange={e => setFilterSession(e.target.value)} className="bg-[#121318] border border-gray-800 text-sm font-semibold text-gray-300 px-3 py-2 rounded-lg outline-none cursor-pointer">
              {uniqueSessions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterMode} onChange={e => setFilterMode(e.target.value)} className="bg-[#121318] border border-gray-800 text-sm font-semibold text-gray-300 px-3 py-2 rounded-lg outline-none cursor-pointer">
              <option value="All Modes">All Modes</option>
              <option value="Multiplayer">Multiplayer</option>
              <option value="Singleplayer">Singleplayer</option>
            </select>
            <select value={filterTrack} onChange={e => setFilterTrack(e.target.value)} className="bg-[#121318] border border-gray-800 text-sm font-semibold text-gray-300 max-w-[120px] truncate px-3 py-2 rounded-lg outline-none cursor-pointer">
              {uniqueTracks.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={filterCar} onChange={e => setFilterCar(e.target.value)} className="bg-[#121318] border border-gray-800 text-sm font-semibold text-gray-300 max-w-[120px] truncate px-3 py-2 rounded-lg outline-none cursor-pointer">
              {uniqueCars.map(c => <option key={c}>{c}</option>)}
            </select>
            <div className="flex items-center gap-2 ml-2">
              <div className="relative group">
                <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10">
                   {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button className="bg-[#121318] border border-gray-800 p-2 rounded-lg text-gray-400 group-hover:text-white transition-colors relative z-0"><Layers size={16}/></button>
              </div>
              <button className="bg-[#121318] border border-gray-800 p-2 rounded-lg text-gray-400 hover:text-white transition-colors"><SlidersHorizontal size={16}/></button>
              <button onClick={() => { setFilterSession('All Sessions'); setFilterTrack('All Tracks'); setFilterCar('All Cars'); setFilterClass('All Classes'); }} className="bg-[#121318] border border-gray-800 p-2 rounded-lg text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
            </div>
          </div>
        </div>

        {/* LISTE DES SESSIONS - FORMAT TABLEAU LARGE */}
        {displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-60">
            <Flag size={64} className="text-gray-600 mb-6" strokeWidth={1.5} />
            <h3 className="text-xl font-bold text-gray-300 mb-2">No sessions found</h3>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pb-10">
            {/* Headers du tableau */}
            <div className="flex items-center px-4 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800/50 mb-2">
              <div className="w-[12%]">Date</div>
              <div className="w-[8%]">Session</div>
              <div className="w-[10%]">Mode</div>
              <div className="w-[18%]">Track</div>
              <div className="w-[6%]">Class</div>
              <div className="w-[18%]">Car</div>
              <div className="w-[6%]">Grid</div>
              <div className="w-[6%]">Finish</div>
              <div className="w-[6%]">Laps</div>
              <div className="w-[10%]">Best Lap</div>
            </div>

            {displayList.map((session, idx) => (
              <div key={idx} onClick={() => onSelectSession(session)} className="bg-[#121318] border border-gray-800/50 rounded-lg px-4 py-3 flex items-center hover:bg-[#1a1b26] transition-colors cursor-pointer group shadow-sm">
                <div className="w-[12%] text-xs font-medium text-gray-400">{session.date}</div>
                <div className="w-[8%]"><span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${session.type === 'Race' ? 'bg-red-900/20 text-red-500 border-red-800/50' : 'bg-green-900/20 text-green-500 border-green-800/50'}`}>{session.type}</span></div>
                <div className="w-[10%]"><span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-gray-800/50 text-gray-400 border border-gray-700/50">MULTIPLAYER</span></div>
                <div className="w-[18%] text-sm font-bold text-white flex items-center gap-2"><CountryFlag code={getTrackCountryCode(session.track)} /> <span className="truncate">{session.track}</span></div>
                <div className="w-[6%]"><span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getClassColor(session.class)}`}>{session.class}</span></div>
                <div className="w-[18%] text-xs font-bold text-gray-300 truncate pr-4">{session.car}</div>
                <div className="w-[6%] text-xs font-bold text-gray-400">P{session.grid}</div>
                <div className="w-[6%] text-xs font-bold text-white">{session.finish}TH</div>
                <div className="w-[6%] text-xs font-bold text-gray-400">{session.laps}</div>
                <div className="w-[10%] text-sm font-black text-white">{session.best}</div>
                
                <div className="flex-1 flex justify-end items-center gap-3">
                  <button onClick={(e) => handleDeleteSession(e, session.file)} className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsHistoryView;