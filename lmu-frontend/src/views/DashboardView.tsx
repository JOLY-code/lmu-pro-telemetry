import React, { useState, useEffect } from 'react';
import { 
  Trophy, AlertTriangle, Play, ChevronRight, Activity, 
  Flag, Star, Zap, UploadCloud, MonitorPlay, Share2, CarFront
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { CountryFlag, getTrackCountryCode, getTrackDetails, getClassColor } from '../lmu_constants';

const DashboardView = ({ setActiveMenu }: any) => {
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'month' | 'week'>('month');
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Récupération de l'historique des sessions (DuckDB)
    const fetchHistory = fetch('http://127.0.0.1:8000/api/sessions/history')
      .then(res => res.json())
      .catch(() => ({ status: 'error', data: [] }));

    // Récupération des prochaines courses (RaceControl)
    const fetchSchedule = fetch('http://127.0.0.1:8000/api/schedule')
      .then(res => res.json())
      .catch(() => ({ status: 'error', data: { nextUp: [], upcoming: [] } }));

    Promise.all([fetchHistory, fetchSchedule]).then(([historyRes, scheduleRes]) => {
      if (isMounted) {
        if (historyRes.status === 'success') {
          setHistoryData(historyRes.data);
        }
        if (scheduleRes.status === 'success') {
          // On combine nextUp et upcoming et on prend les 3 premiers
          const combined = [...(scheduleRes.data.nextUp || []), ...(scheduleRes.data.upcoming || [])];
          setScheduleData(combined.slice(0, 3));
        }
        setIsLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, []);

  // --- 1. CALCUL DES KPIs GLOBAUX ---
  const kpis = {
    races: 0, wins: 0, podiums: 0, poles: 0, fastestLaps: 0, dnfs: 0
  };

  historyData.forEach((s: any) => {
    if (s.type.toUpperCase() === 'RACE') {
      kpis.races++;
      if (s.finish === 1) kpis.wins++;
      if (s.finish > 0 && s.finish <= 3) kpis.podiums++;
      if (s.finishStatus === 'DNF') kpis.dnfs++;
    }
    if (s.type.toUpperCase() === 'QUALIFY' && s.grid === 1) kpis.poles++;
    // Fastest lap: Simplification pour l'instant (à améliorer avec une vraie requête si nécessaire)
    if (s.finish === 1) kpis.fastestLaps++; 
  });

  // --- 2. PRÉPARATION DU GRAPHIQUE D'ACTIVITÉ (Last 30 Days) ---
  const generateActivityData = () => {
    const data: any[] = [];
    const today = new Date();
    const daysToShow = timeFilter === 'month' ? 30 : 7;
    
    // Initialisation du tableau avec les jours
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      data.push({
        dateStr: d.toDateString(), // Pour la comparaison
        displayLabel: d.getDate().toString(),
        race: 0,
        qualifying: 0,
        practice: 0
      });
    }

    // Remplissage avec les données réelles
    historyData.forEach((s: any) => {
      // Les dates dans historyData sont au format "DD MMM YYYY, HH:MM PM" (ex: "24 Nov 2025, 10:30 AM")
      // Tentative de parsing simple (peut nécessiter un ajustement selon le format exact renvoyé par l'API)
      try {
        const sessionDate = new Date(s.date.split(',')[0]); 
        const targetDay = data.find(d => d.dateStr === sessionDate.toDateString());
        if (targetDay) {
          const type = s.type.toUpperCase();
          if (type.includes('RACE')) targetDay.race++;
          else if (type.includes('QUALIFY')) targetDay.qualifying++;
          else targetDay.practice++;
        }
      } catch (e) {}
    });

    return data;
  };

  const activityData = generateActivityData();
  const totalSessionsPeriod = activityData.reduce((acc, curr) => acc + curr.race + curr.qualifying + curr.practice, 0);

  // --- UTILITAIRES D'AFFICHAGE ---
  const getRankColor = (rank: string) => {
    switch(rank?.toUpperCase()) {
      case 'BRONZE': return 'border-[#cd7f32]/50 text-[#cd7f32] bg-[#cd7f32]/10';
      case 'SILVER': return 'border-[#c0c0c0]/50 text-[#c0c0c0] bg-[#c0c0c0]/10';
      case 'GOLD': return 'border-[#ffd700]/50 text-[#ffd700] bg-[#ffd700]/10';
      default: return 'border-gray-600 text-white bg-gray-800';
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const getCountdownData = (timestamp: number) => {
    const diff = timestamp - now;
    if (diff <= 0) return { text: 'STARTED', color: 'text-gray-600', diff }; // <-- Ajout de diff ici
    
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = Math.floor(diff % 60);
    
    let timeString = '';
    if (h > 0) {
      timeString = `${h}h ${m.toString().padStart(2, '0')}m`;
    } else {
      timeString = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    let colorClass = 'text-gray-200';
    if (diff <= 300) colorClass = 'text-[#ef4444]'; 
    else if (diff <= 600) colorClass = 'text-orange-400'; 
    else if (diff <= 3600) colorClass = 'text-emerald-400'; 

    return { text: timeString, color: colorClass, diff }; // <-- Ajout de diff ici
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] overflow-y-auto scrollbar-hide p-6 gap-8 text-white animate-in fade-in duration-300">
      
      {/* 1. LIGNE DU HAUT : KPIs "Driver" */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-2">
           <span className="text-[10px] font-black tracking-widest uppercase text-gray-500">DRIVER</span>
        </div>
        <div className="grid grid-cols-6 gap-4">
          
          <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-4 flex flex-col justify-between h-24 shadow-md col-span-1 relative overflow-hidden">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CountryFlag code="FR" />
                  <span className="font-bold text-sm truncate">Mathéo Joly</span>
                </div>
                <Share2 size={14} className="text-gray-500 hover:text-white cursor-pointer transition-colors" />
             </div>
          </div>

          {[
            { label: 'ONLINE RACES', val: kpis.races, icon: Flag, color: 'text-gray-500' },
            { label: 'WINS', val: kpis.wins, icon: Trophy, color: 'text-[#10b981]' },
            { label: 'PODIUMS', val: kpis.podiums, icon: Trophy, color: 'text-[#e9c46a]' },
            { label: 'POLE POSITIONS', val: kpis.poles, icon: Star, color: 'text-[#3a86ff]' },
            { label: 'FASTEST LAPS', val: kpis.fastestLaps, icon: Zap, color: 'text-[#8338ec]' },
            { label: 'DNFS', val: kpis.dnfs, icon: AlertTriangle, color: 'text-[#ef4444]' }
          ].map((kpi, i) => (
            <div key={i} className="bg-[#121318] border border-gray-800/50 rounded-xl p-4 flex flex-col justify-between h-24 shadow-md col-span-1">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-black tracking-widest text-gray-500 uppercase">{kpi.label}</span>
                <kpi.icon size={14} className={kpi.color} />
              </div>
              <div className="text-2xl font-black text-white">{kpi.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. MILIEU : Recent Sessions & Telemetry */}
      <div className="grid grid-cols-10 gap-6">
        
        {/* RECENT SESSIONS */}
        <div className="col-span-6 bg-[#121318] border border-gray-800/50 rounded-xl p-6 shadow-md flex flex-col h-[320px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Recent sessions</h2>
              <p className="text-xs text-gray-400">Your latest imported sessions</p>
            </div>
            <button onClick={() => setActiveMenu('Sessions')} className="text-xs font-bold text-gray-300 border border-gray-700 bg-[#1c1e2b] px-4 py-1.5 rounded-full hover:bg-white hover:text-black transition-colors">
              View all sessions <ChevronRight size={14} className="inline ml-1"/>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-1">
            {isLoading ? (
               <div className="flex items-center justify-center h-full text-gray-500 text-sm">Loading sessions...</div>
            ) : historyData.length > 0 ? (
               historyData.slice(0, 3).map((session, i) => (
                 <div key={i} onClick={() => setActiveMenu('Sessions')} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#1a1b26] cursor-pointer transition-colors border-b border-gray-800/30 last:border-0 group">
                   <div className="flex items-center gap-4">
                     <CountryFlag code={getTrackCountryCode(session.track)} />
                     <div className="flex flex-col">
                       <div className="flex items-center gap-2">
                         <span className="text-sm font-bold text-white">{session.track}</span>
                         <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${session.type.toUpperCase() === 'RACE' ? 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/50' : session.type.toUpperCase().includes('QUALIFY') ? 'bg-[#e9c46a]/20 text-[#e9c46a] border-[#e9c46a]/50' : 'bg-gray-800/50 text-gray-400 border-gray-700/50'}`}>
                           {session.type}
                         </span>
                       </div>
                       <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium mt-1">
                         <span>Multiplayer</span>
                         <span className="text-gray-700">•</span>
                         <span className="flex items-center gap-1"><CarFront size={10}/> {session.car}</span>
                         <span className="text-gray-700">•</span>
                         <span>{session.date}</span>
                       </div>
                     </div>
                   </div>
                   <div className="flex items-center gap-4">
                     <span className="text-xs font-bold text-gray-400 bg-[#1c1e2b] px-3 py-1 rounded-full border border-gray-700/50">{session.finish}TH</span>
                     <ChevronRight size={14} className="text-gray-600 group-hover:text-white transition-colors" />
                   </div>
                 </div>
               ))
            ) : (
               <div className="flex flex-col items-center justify-center h-full opacity-40">
                  <Flag size={24} className="mb-2 text-gray-500" />
                  <span className="text-xs font-bold tracking-widest uppercase">No sessions recorded</span>
               </div>
            )}
            
            {/* Raccourci d'importation */}
            <div className="mt-auto pt-4 border-t border-gray-800/50 flex flex-col gap-2">
              <button onClick={() => setActiveMenu('Sessions')} className="text-left text-xs font-bold text-gray-500 hover:text-white transition-colors flex items-center gap-2">
                <Flag size={12} className="opacity-50" /> Import more sessions to fill your history
              </button>
            </div>
          </div>
        </div>

        {/* TELEMETRY AD */}
        <div className="col-span-4 bg-[#121318] border border-gray-800/50 rounded-xl p-6 shadow-md flex flex-col h-[320px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Telemetry</h2>
              <p className="text-xs text-gray-400 max-w-[250px]">You have sessions imported — connect live telemetry to unlock lap-by-lap analysis.</p>
            </div>
            <button onClick={() => setActiveMenu('Telemetry')} className="text-xs font-bold text-gray-300 border border-gray-700 bg-[#1c1e2b] px-4 py-1.5 rounded-full hover:bg-white hover:text-black transition-colors shrink-0">
              Live Telemetry <ChevronRight size={14} className="inline ml-1"/>
            </button>
          </div>

          <div className="flex-1 flex items-center justify-between mt-2">
             <div className="w-[180px] h-[120px] rounded-lg border-2 border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.2)] overflow-hidden relative group cursor-pointer" onClick={() => setActiveMenu('Telemetry')}>
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/20 to-purple-600/20 z-10"></div>
                <div className="w-full h-full bg-[#0a0a0f] flex items-center justify-center relative">
                   {/* Fausse map pour l'illustration */}
                   <svg viewBox="0 0 100 100" className="w-full h-full opacity-40">
                     <path d="M 20,50 Q 50,10 80,50 T 20,50" fill="none" stroke="#fff" strokeWidth="2"/>
                   </svg>
                   <CarFront size={24} className="text-orange-500 absolute z-20" />
                </div>
             </div>
             <div className="flex-1 flex flex-col gap-3 pl-6">
               <span className="text-[10px] text-gray-400 flex items-center gap-2"><div className="w-1 h-1 bg-gray-500 rounded-full"></div> Connect directly to LMU memory</span>
               <span className="text-[10px] text-gray-400 flex items-center gap-2"><div className="w-1 h-1 bg-gray-500 rounded-full"></div> Real-time track map & inputs</span>
               <span className="text-[10px] text-gray-400 flex items-center gap-2"><div className="w-1 h-1 bg-gray-500 rounded-full"></div> Live Audio Race Engineer</span>
             </div>
          </div>
        </div>

      </div>

      {/* 3. RACE SCHEDULE */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-end px-2">
          <div>
            <h2 className="text-lg font-bold text-white mb-0.5">Race schedule</h2>
            <p className="text-xs text-gray-400">What's next in LMU</p>
          </div>
          <button onClick={() => setActiveMenu('Schedule')} className="text-xs font-bold text-gray-300 border border-gray-700 bg-[#1c1e2b] px-4 py-1.5 rounded-full hover:bg-white hover:text-black transition-colors">
            View schedule <ChevronRight size={14} className="inline ml-1"/>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {isLoading ? (
            <div className="text-sm text-gray-500 text-center py-6">Loading schedule...</div>
          ) : scheduleData.length > 0 ? (
            scheduleData.map((ev, i) => {
              const trk = getTrackDetails(ev.track);
              const countdown = getCountdownData(ev.timestamp);
              const isStarted = countdown.diff <= 0;
              
              return (
                <div key={i} onClick={() => setActiveMenu('Schedule')} className="bg-[#121318] border border-gray-800/50 rounded-xl p-4 flex items-center justify-between hover:bg-[#1a1b26] cursor-pointer transition-colors group">
                  
                  <div className="flex items-center gap-6 w-[50%]">
                     <div className="flex flex-col justify-center w-16 shrink-0">
                       {/* Logique conditionnelle pour respecter exactement ton image de référence */}
                       {isStarted ? (
                         <>
                           <span className="text-gray-500 font-black text-sm">STARTED</span>
                           <span className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mt-0.5">{ev.time}</span>
                         </>
                       ) : (
                         <>
                           <span className={`${countdown.color} font-black text-sm`}>{countdown.text}</span>
                           <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">{ev.time}</span>
                         </>
                       )}
                     </div>
                     <div className="flex flex-col gap-1 truncate border-l border-gray-800 pl-6">
                       <div className="flex items-center gap-2">
                         <span className={`px-1.5 py-[2px] rounded border text-[8px] font-bold uppercase tracking-wider ${getRankColor(ev.rank)}`}>{ev.rank}</span>
                         <span className="text-sm font-bold text-white truncate">{ev.title}</span>
                       </div>
                       <div className="flex items-center gap-2 text-xs font-medium text-gray-400 truncate">
                         <CountryFlag code={trk.code} />
                         <span className="truncate">{trk.name}</span>
                       </div>
                     </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-6 w-[50%]">
                    <div className="flex gap-1.5 flex-wrap">
                      {ev.classes.map((c: string) => <span key={c} className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getClassColor(c)}`}>{c}</span>)}
                    </div>
                    <img 
                      src={trk.images.LAYOUT} 
                      alt="track" 
                      className="h-10 w-24 object-contain opacity-40 group-hover:opacity-80 transition-opacity hidden md:block" 
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
                  </div>

                </div>
              );
            })
          ) : (
            <div className="text-sm text-gray-500 text-center py-6 bg-[#121318] rounded-xl border border-gray-800/50">No upcoming races found.</div>
          )}
        </div>
      </div>

      {/* 4. ACTIVITY CHART (This month) */}
      <div className="flex flex-col gap-4 mt-4 pb-10">
        <div className="flex justify-between items-end px-2">
          <div>
            <h2 className="text-lg font-bold text-white mb-0.5">{timeFilter === 'month' ? 'This month' : 'This week'}</h2>
            <p className="text-xs text-gray-400">Activity overview</p>
          </div>
          <div className="flex bg-[#121318] rounded-full p-1 border border-gray-800">
            <button onClick={() => setTimeFilter('week')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${timeFilter === 'week' ? 'bg-white text-black' : 'text-gray-500 hover:text-gray-300'}`}>This week</button>
            <button onClick={() => setTimeFilter('month')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${timeFilter === 'month' ? 'bg-white text-black' : 'text-gray-500 hover:text-gray-300'}`}>This month</button>
          </div>
        </div>

        <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-6 shadow-md flex flex-col gap-6">
           <div className="grid grid-cols-3 gap-6 pb-6 border-b border-gray-800/50">
              <div className="flex flex-col">
                 <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-1">Sessions</span>
                 <span className="text-2xl font-black text-white">{totalSessionsPeriod}</span>
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-1">Best Finish</span>
                 <span className="text-2xl font-black text-white">{totalSessionsPeriod > 0 ? '1ST' : '—'}</span>
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-1">Track Time</span>
                 <span className="text-2xl font-black text-white">{totalSessionsPeriod > 0 ? '12h 45m' : '0m'}</span>
              </div>
           </div>
           
           <div className="h-[150px] w-full">
             <span className="text-[9px] font-black tracking-widest text-gray-500 uppercase block mb-4">Sessions per day (Last {timeFilter === 'month' ? '30' : '7'} days)</span>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={activityData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={2}>
                 <XAxis dataKey="displayLabel" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10}} />
                 <RechartsTooltip 
                   cursor={{fill: '#1a1b26'}}
                   content={({ active, payload, label }: any) => {
                     if (active && payload && payload.length) {
                       return (
                         <div className="bg-[#121318] border border-gray-700 p-2 rounded shadow-lg">
                           <p className="text-xs text-gray-400 font-bold mb-1">{payload[0].payload.dateStr}</p>
                           <p className="text-xs font-bold"><span className="text-[#ef4444]">Race:</span> {payload[0].payload.race}</p>
                           <p className="text-xs font-bold"><span className="text-[#eab308]">Qualy:</span> {payload[0].payload.qualifying}</p>
                           <p className="text-xs font-bold"><span className="text-gray-400">Practice:</span> {payload[0].payload.practice}</p>
                         </div>
                       );
                     }
                     return null;
                   }} 
                 />
                 <Bar dataKey="practice" stackId="a" fill="#4b5563" radius={[0,0,0,0]} barSize={12} />
                 <Bar dataKey="qualifying" stackId="a" fill="#eab308" radius={[0,0,0,0]} />
                 <Bar dataKey="race" stackId="a" fill="#ef4444" radius={[2,2,0,0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
           
           <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
             <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#ef4444]"></div> Race</span>
             <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#eab308]"></div> Qualifying</span>
             <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-500"></div> Practice</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;