import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, ChevronRight, Compass, UserCircle, Wrench, 
  CloudRain, AlertTriangle, Activity, Fuel, Clock, MonitorPlay 
} from 'lucide-react';

import { 
  getTrackDetails, 
  getTrackCountryCode, 
  CountryFlag 
} from '../lmu_constants';

// --- COMPOSANT VUE SCHEDULE (VRAIES DATA + VRAIS CIRCUITS WIKIMEDIA) ---
const ScheduleView = () => {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [nextUpEvents, setNextUpEvents] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeFilter, setActiveFilter] = useState('All');
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [trackView, setTrackView] = useState<'LAYOUT' | 'SECTORS' | 'CORNERS'>('LAYOUT');

  // NOUVEAU : États pour faire fonctionner les menus déroulants
  const [seriesFilter, setSeriesFilter] = useState('All series');
  const [classFilter, setClassFilter] = useState('All classes');
  const [trackFilter, setTrackFilter] = useState('All tracks');
  const [setupFilter, setSetupFilter] = useState('Any setup');
  const [srFilter, setSrFilter] = useState('All SR');

  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const getCountdownData = (timestamp: number) => {
    const diff = timestamp - now;
    if (diff <= 0) return { text: 'STARTED', color: 'text-gray-600', diff };
    
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

    return { text: timeString, color: colorClass, diff };
  };

  useEffect(() => {
    let isMounted = true;
    const fetchSchedule = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/schedule');
        const json = await res.json();
        if (isMounted) {
          if (json.status === 'success') {
            setNextUpEvents(json.data.nextUp);
            setUpcomingEvents(json.data.upcoming);
          } else {
            console.error("Erreur API RaceControl :", json.message);
          }
        }
      } catch (err) {
        console.error("Impossible de contacter le serveur Python", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchSchedule();
    const interval = setInterval(fetchSchedule, 60000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const allEvents = Array.from(new Map([...nextUpEvents, ...upcomingEvents].map(e => [e.id, e])).values())
                         .sort((a, b) => a.timestamp - b.timestamp);

  // GÉNÉRATION DES OPTIONS UNIQUES POUR LES FILTRES
  const uniqueSeries = ['All series', ...Array.from(new Set(allEvents.map(e => e.title)))];
  const uniqueClasses = ['All classes', ...Array.from(new Set(allEvents.flatMap(e => e.classes)))];
  const uniqueTracks = ['All tracks', ...Array.from(new Set(allEvents.map(e => e.track)))];

  // LE SUPER-MOTEUR DE FILTRES
  const filteredEvents = allEvents.filter(ev => {
    // Vérifie les onglets du haut (Beginner, etc.)
    const catMatch = activeFilter === 'All' || ev.category.toUpperCase() === activeFilter.toUpperCase();
    
    // Vérifie les menus déroulants
    const seriesMatch = seriesFilter === 'All series' || ev.title === seriesFilter;
    const classMatch = classFilter === 'All classes' || ev.classes.includes(classFilter);
    const trackMatch = trackFilter === 'All tracks' || ev.track === trackFilter;
    
    let setupMatch = true;
    if (setupFilter === 'Fixed setup') setupMatch = ev.type.toLowerCase() === 'fixed';
    if (setupFilter === 'Open setup') setupMatch = ev.type.toLowerCase() === 'open';
    
    const srMatch = srFilter === 'All SR' || ev.rank.toUpperCase().includes(srFilter.replace(' SR', '').toUpperCase());

    return catMatch && seriesMatch && classMatch && trackMatch && setupMatch && srMatch && ev.timestamp > now - 60;
  });

  
  const imminentEvents = filteredEvents.length > 0 ? [filteredEvents[0]] : [];
  const futureEventsList = filteredEvents.length > 1 ? filteredEvents.slice(1) : [];
  const [isTrackDropdownOpen, setIsTrackDropdownOpen] = useState(false);

  const getClassColor = (cls: string) => {
    switch(cls.toUpperCase()) {
      case 'HYPER': return 'border-red-600/50 text-red-500 bg-red-900/10';
      case 'LMP2': return 'border-blue-600/50 text-blue-400 bg-blue-900/10';
      case 'LMP3': return 'border-purple-600/50 text-purple-400 bg-purple-900/10';
      case 'GTE': return 'border-indigo-600/50 text-indigo-400 bg-indigo-900/10';
      case 'GT3': return 'border-green-600/50 text-green-500 bg-green-900/10';
      default: return 'border-gray-600/50 text-gray-400 bg-gray-800/10';
    }
  };

  const getRankColor = (rank: string) => {
    switch(rank.toUpperCase()) {
      case 'BRONZE': return 'border-[#cd7f32]/50 text-[#cd7f32] bg-[#cd7f32]/10';
      case 'SILVER': return 'border-[#c0c0c0]/50 text-[#c0c0c0] bg-[#c0c0c0]/10';
      case 'GOLD': return 'border-[#ffd700]/50 text-[#ffd700] bg-[#ffd700]/10';
      default: return 'border-gray-600 text-white bg-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-[#3a86ff] font-bold tracking-widest text-sm animate-pulse">
        <RefreshCw size={24} className="mr-3 animate-spin" /> ESTABLISHING LINK WITH RACE CONTROL...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] rounded-xl overflow-hidden relative border border-gray-800/50 shadow-2xl">
      
      {/* OVERLAY DÉTAIL DE L'ÉVÉNEMENT (Slide Panel) */}
      {selectedEvent && (
        <div className="absolute inset-0 z-50 bg-[#09090b]/95 backdrop-blur-sm flex p-6 animate-in fade-in duration-200">
          <div className="w-[45%] flex flex-col relative border-r border-gray-800/50 pr-6">
            <button onClick={() => setSelectedEvent(null)} className="absolute -top-2 -left-2 text-gray-500 hover:text-white transition-colors"><ChevronRight size={32} className="rotate-180"/></button>
            <div className="mt-4 ml-8">
              <span className="text-gray-500 text-[10px] font-bold tracking-widest uppercase">{selectedEvent.category}</span>
              <h1 className="text-3xl font-black text-gray-100 mt-1">{selectedEvent.title}</h1>
              <div className="flex items-center gap-3 mt-3 text-sm">
                <span className={`${getCountdownData(selectedEvent.timestamp).color} font-bold`}>{getCountdownData(selectedEvent.timestamp).text || selectedEvent.time}</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400 font-medium">{selectedEvent.date}</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400 font-medium">{selectedEvent.length}</span>
              </div>
            </div>
            
            {/* BOUTONS ET AFFICHAGE DU CIRCUIT */}
            <div className="flex-1 flex flex-col items-center justify-center relative mt-8">
              
              {/* Menu Toggle: Layout / Sectors / Corners */}
              <div className="flex bg-[#0f1015] rounded-xl p-1 mb-6 border border-gray-800/50">
                {['LAYOUT', 'SECTORS', 'CORNERS'].map((view) => (
                  <button 
                    key={view}
                    onClick={() => setTrackView(view as any)}
                    className={`px-5 py-1.5 rounded-lg text-[10px] font-bold tracking-widest transition-colors ${trackView === view ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {view}
                  </button>
                ))}
              </div>

              {/* Image du Circuit */}
              {(() => {
                const trk = getTrackDetails(selectedEvent.track);
                const imageUrl = trk.images[trackView];
                return (
                  <div className="w-full flex-1 flex flex-col items-center justify-center relative">
                    <img 
                      src={imageUrl} 
                      alt={`${trk.name} - ${trackView}`} 
                      className="max-w-full max-h-56 object-contain transition-opacity drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden flex-col items-center text-gray-700 opacity-50 text-center">
                      <Compass size={48} className="mb-2" />
                      <span className="text-[10px] uppercase font-bold tracking-widest">Image missing</span>
                      <span className="text-[9px] mt-1">Please add <b>{imageUrl}</b> to your public folder</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div className="flex flex-col gap-5 border-t border-gray-800/50 pt-5 mt-auto">
              <div className="flex justify-between">
                <div><span className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-1">Length</span><span className="text-gray-200 font-bold text-sm">{selectedEvent.length}</span></div>
                <div><span className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-1">Type</span><span className="text-gray-200 font-bold text-sm uppercase">{selectedEvent.type}</span></div>
              </div>
              {(() => {
                  const trk = getTrackDetails(selectedEvent.track);
                  return (
                      <div>
                          <span className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-1">Track</span>
                          <span className="text-gray-200 font-bold text-[13px] flex items-center gap-1.5">
                              <CountryFlag code={trk.code} /> {trk.name}
                          </span>
                          <span className="text-gray-500 text-[11px] mt-0.5 block pl-7">{trk.location}</span>
                      </div>
                  );
              })()}
            </div>
          </div>
          
          <div className="flex-1 flex flex-col pl-6">
             <div className="flex gap-3 mb-6">
                <button className="bg-white text-black px-6 py-1.5 rounded-full font-bold text-xs tracking-wide shadow-sm">EVENT</button>
                <button className="bg-transparent text-gray-400 px-6 py-1.5 rounded-full font-bold text-xs tracking-wide hover:bg-white/5 transition-colors">YOUR PREP</button>
             </div>
             
             {/* RACE INFO */}
             <h3 className="text-gray-500 text-[10px] font-black tracking-widest mb-3 uppercase">Race Info</h3>
             <div className="grid grid-cols-3 gap-3 mb-6">
               <div className="bg-[#121318] p-3 rounded-xl border border-gray-800/50">
                  <span className="block text-gray-500 text-[10px] font-bold tracking-widest mb-2 uppercase">Safety Rank</span>
                  <span className={`px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${getRankColor(selectedEvent.details.safety_rank)}`}>{selectedEvent.details.safety_rank}</span>
               </div>
               <div className="bg-[#121318] p-3 rounded-xl border border-gray-800/50">
                  <span className="block text-gray-500 text-[10px] font-bold tracking-widest mb-2 uppercase">Classes</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedEvent.classes.map((c: string) => <span key={c} className={`px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${getClassColor(c)}`}>{c}</span>)}
                  </div>
               </div>
               <div className="bg-[#121318] p-3 rounded-xl border border-gray-800/50 flex flex-col justify-center gap-1.5">
                  <div className="flex items-center justify-between">
                    <Clock size={16} className="text-gray-500"/>
                    <span className="text-gray-200 font-bold text-base">{selectedEvent.details.race.replace(' Minutes', 'M')}</span>
                  </div>
                  <div className="text-gray-400 font-bold text-[9px] tracking-widest flex items-center gap-1.5"><Wrench size={12}/> {selectedEvent.details.setup_type}</div>
               </div>
             </div>

             {/* DETAILS EXHAUSTIFS DE LA COURSE */}
             <h3 className="text-gray-500 text-[10px] font-black tracking-widest mb-3 uppercase">Details</h3>
             <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-4 mb-6">
                <div className="grid grid-cols-3 gap-4 border-b border-gray-800/50 pb-4 mb-4">
                   <div><span className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-0.5">Practice</span><span className="text-gray-200 font-bold text-sm">{selectedEvent.details.practice}</span></div>
                   <div><span className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-0.5">Qualifying</span><span className="text-gray-200 font-bold text-sm">{selectedEvent.details.qualifying}</span></div>
                   <div><span className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-0.5">Race</span><span className="text-gray-200 font-bold text-sm">{selectedEvent.details.race}</span></div>
                </div>
                <div className="grid grid-cols-4 gap-x-4 gap-y-5">
                   <div className="flex justify-between items-center"><span className="text-gray-500"><UserCircle size={14}/></span><span className="text-gray-300 font-bold text-xs">{selectedEvent.details.grid}</span></div>
                   <div className="flex justify-between items-center"><span className="text-gray-500 border border-gray-600 rounded px-1 text-[9px] font-bold">DR</span><span className="text-gray-300 font-bold text-xs">{selectedEvent.details.dr}</span></div>
                   <div className="flex justify-between items-center"><span className="text-gray-500 border border-gray-600 rounded px-1 text-[9px] font-bold">SR</span><span className="text-gray-300 font-bold text-xs">{selectedEvent.details.sr}</span></div>
                   <div className="flex justify-between items-center"><span className="text-gray-500 text-[14px]">🛞</span><span className="text-gray-300 font-bold text-xs">{selectedEvent.details.tyres}</span></div>

                   <div className="flex justify-between items-center"><span className="text-gray-500"><Wrench size={14}/></span><span className="text-gray-300 font-bold text-[10px] uppercase">{selectedEvent.type}</span></div>
                   <div className="flex justify-between items-center"><span className="text-gray-500 text-[14px]">🐕</span><span className="text-gray-300 font-bold text-[10px] uppercase">DEFAULT</span></div>
                   <div className="flex justify-between items-center"><span className="text-gray-500 text-[14px]">🔥</span><span className="text-gray-300 font-bold text-[10px] uppercase">{selectedEvent.details.warmers}</span></div>
                   <div className="flex justify-between items-center"><span className="text-gray-500"><CloudRain size={14}/></span><span className="text-gray-300 font-bold text-[10px] uppercase">{selectedEvent.details.track_limits}</span></div>

                   <div className="flex justify-between items-center"><span className="text-gray-500"><AlertTriangle size={14}/></span><span className="text-gray-300 font-bold text-[10px] uppercase">{selectedEvent.details.damage}</span></div>
                   <div className="flex justify-between items-center"><span className="text-gray-500"><Activity size={14}/></span><span className="text-gray-300 font-bold text-[10px] uppercase">{selectedEvent.details.assists}</span></div>
                   <div className="flex justify-between items-center"><span className="text-gray-500"><UserCircle size={14}/></span><span className="text-gray-300 font-bold text-[10px] uppercase">{selectedEvent.details.mode}</span></div>
                   <div className="flex justify-between items-center"><span className="text-gray-500"><Fuel size={14}/></span><span className="text-gray-300 font-bold text-[10px] uppercase">{selectedEvent.details.fuel}</span></div>
                </div>
             </div>

             {/* SESSION TIMES DYNAMIQUES */}
             <h3 className="text-gray-500 text-[10px] font-black tracking-widest mb-1 uppercase">Session Times</h3>
             {(() => {
                 const d = new Date(now * 1000);
                 const currentMins = d.getHours() * 60 + d.getMinutes();
                 let nextFound = false;

                 const sessionsLeft = selectedEvent.details.session_times.filter((t: string) => {
                     const parts = t.split(':');
                     let tMins = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                     if (tMins < currentMins && (currentMins - tMins) > 720) tMins += 24 * 60; // Gère les courses de demain matin
                     return tMins >= currentMins;
                 }).length;

                 return (
                   <>
                     <p className="text-gray-400 text-[11px] font-medium mb-3">
                       {sessionsLeft} left today · {selectedEvent.details.session_times.length} sessions · Click a time to set a reminder
                     </p>
                     <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[140px] scrollbar-hide pb-2">
                       {selectedEvent.details.session_times.map((t: string) => {
                         const parts = t.split(':');
                         let tMins = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                         if (tMins < currentMins && (currentMins - tMins) > 720) tMins += 24 * 60; 
                         
                         let status = 'future';
                         if (tMins < currentMins) {
                           status = 'past';
                         } else if (!nextFound) {
                           status = 'next';
                           nextFound = true;
                         }

                         let btnClass = 'bg-[#1a1b26] text-gray-300 border-transparent hover:bg-gray-800'; 
                         if (status === 'past') {
                           btnClass = 'bg-[#2a1518] text-[#ef4444] border-[#ef4444]/20 line-through opacity-50'; 
                         } else if (status === 'next') {
                           btnClass = 'bg-emerald-900/30 text-emerald-400 border border-emerald-800 shadow-[0_0_10px_rgba(52,211,153,0.1)]'; 
                         }

                         return (
                           <button key={t} className={`px-3 py-1.5 rounded-md border text-xs font-mono font-bold transition-colors ${btnClass}`}>
                             {t}
                           </button>
                         );
                       })}
                     </div>
                   </>
                 );
             })()}
          </div>
        </div>
      )}

      {/* HEADER FILTRES */}
      <div className="p-6 pb-2">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-[#121318] p-1 rounded-full flex gap-1 border border-gray-800/50">
            {['All', 'Beginner', 'Intermediate', 'Advanced', 'Weekly', 'Special', 'Championships'].map(f => (
              <button 
                key={f} 
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${activeFilter === f ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex-1"></div>
          <button className="bg-transparent border border-gray-700 text-gray-300 hover:bg-white/5 px-4 py-1.5 rounded-md flex items-center gap-2 text-xs font-semibold transition-colors">
            <MonitorPlay size={14}/> Reminders
          </button>
        </div>

        <div className="flex flex-wrap gap-3 text-xs font-semibold">
          {/* Dropdown Series */}
          <select value={seriesFilter} onChange={(e) => setSeriesFilter(e.target.value)} className="bg-transparent border border-gray-800/80 text-gray-400 px-3 py-1.5 rounded-md outline-none cursor-pointer hover:bg-white/5 hover:text-gray-200 transition-colors truncate max-w-[160px]">
            {uniqueSeries.map(s => <option key={s} value={s} className="bg-[#121318] text-gray-300">{s}</option>)}
          </select>

          {/* Dropdown Classes */}
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="bg-transparent border border-gray-800/80 text-gray-400 px-3 py-1.5 rounded-md outline-none cursor-pointer hover:bg-white/5 hover:text-gray-200 transition-colors">
            {uniqueClasses.map(c => <option key={c} value={c} className="bg-[#121318] text-gray-300">{c}</option>)}
          </select>

          {/* Dropdown Tracks Custom avec VRAIS Drapeaux SVG (Schedule) */}
          <div className="relative">
            <div 
              onClick={() => setIsTrackDropdownOpen(!isTrackDropdownOpen)} 
              className="bg-transparent border border-gray-800/80 text-gray-400 px-3 py-1.5 rounded-md cursor-pointer hover:bg-white/5 hover:text-gray-200 transition-colors min-w-[180px] max-w-[220px] flex items-center justify-between"
            >
              <div className="flex items-center gap-2 truncate pr-2">
                {trackFilter === 'All tracks' ? (
                  <span>🌍 All tracks</span>
                ) : (
                  <>
                    <div className="flex-shrink-0"><CountryFlag code={getTrackCountryCode(trackFilter)} /></div>
                    <span className="truncate text-gray-200">{trackFilter}</span>
                  </>
                )}
              </div>
              <ChevronRight size={12} className={`shrink-0 opacity-50 transform transition-transform ${isTrackDropdownOpen ? 'rotate-90' : ''}`} />
            </div>

            {isTrackDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsTrackDropdownOpen(false)}></div>
                <div className="absolute top-full mt-2 left-0 w-[300px] max-h-64 overflow-y-auto bg-[#121318] border border-gray-800 rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 scrollbar-hide">
                  <div onClick={() => { setTrackFilter('All tracks'); setIsTrackDropdownOpen(false); }} className="p-3 hover:bg-gray-800 cursor-pointer text-xs font-bold text-gray-400 border-b border-gray-800/50">
                    🌍 All tracks
                  </div>
                  {uniqueTracks.filter(t => t !== 'All tracks').map(t => (
                    <div key={t} onClick={() => { setTrackFilter(t); setIsTrackDropdownOpen(false); }} className="p-3 hover:bg-[#1a1b26] cursor-pointer flex items-center gap-3 border-b border-gray-800/30 last:border-0 transition-colors">
                      <div className="flex-shrink-0"><CountryFlag code={getTrackCountryCode(t)} /></div>
                      <span className="text-xs font-bold text-gray-200 truncate">{t}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Dropdown Setup */}
          <select value={setupFilter} onChange={(e) => setSetupFilter(e.target.value)} className="bg-transparent border border-gray-800/80 text-gray-400 px-3 py-1.5 rounded-md outline-none cursor-pointer hover:bg-white/5 hover:text-gray-200 transition-colors">
            {['Any setup', 'Fixed setup', 'Open setup'].map(s => <option key={s} value={s} className="bg-[#121318] text-gray-300">{s}</option>)}
          </select>

          {/* Dropdown SR */}
          <select value={srFilter} onChange={(e) => setSrFilter(e.target.value)} className="bg-transparent border border-gray-800/80 text-gray-400 px-3 py-1.5 rounded-md outline-none cursor-pointer hover:bg-white/5 hover:text-gray-200 transition-colors">
            {['All SR', 'Bronze', 'Silver', 'Gold'].map(sr => <option key={sr} value={sr} className="bg-[#121318] text-gray-300">{sr}</option>)}
          </select>
          
          {/* Bouton pour annuler tous les filtres s'ils sont actifs */}
          {(seriesFilter !== 'All series' || classFilter !== 'All classes' || trackFilter !== 'All tracks' || setupFilter !== 'Any setup' || srFilter !== 'All SR') && (
            <button 
              onClick={() => { setSeriesFilter('All series'); setClassFilter('All classes'); setTrackFilter('All tracks'); setSetupFilter('Any setup'); setSrFilter('All SR'); }} 
              className="text-gray-500 hover:text-white transition-colors px-2 font-bold text-xs"
            >
              ✕ Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-10 scrollbar-hide">
        {/* BANDEAU "NEXT UP" (Affiche les courses à moins de 5 minutes) */}
        <h2 className="text-gray-500 text-[10px] font-bold tracking-widest mt-6 mb-3 uppercase">Next Up</h2>
        <div className="flex flex-col gap-3 mb-10">
          {imminentEvents.length > 0 ? imminentEvents.map(ev => {
            const trk = getTrackDetails(ev.track);
            const countdown = getCountdownData(ev.timestamp);
            return (
              <div key={`imminent-${ev.id}`} className="bg-[#121318] border border-gray-800/50 rounded-xl p-5 flex items-center justify-between group cursor-pointer hover:border-gray-600 transition-colors" onClick={() => setSelectedEvent(ev)}>
                
                <div className="flex flex-col gap-3 w-[60%]">
                  <div className="flex items-center gap-3">
                    <h3 className="text-gray-100 text-lg font-black">{ev.title}</h3>
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${getRankColor(ev.rank)}`}>{ev.rank}</span>
                    <Wrench size={14} className="text-gray-600"/>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] font-medium">
                    <span className={`${countdown.color} font-bold`}>{countdown.text}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-400 font-medium">{ev.date}, {ev.time}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-400 font-medium">{ev.length}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300 font-semibold text-sm">
                    <CountryFlag code={trk.code} />
                    <span>{trk.name}</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap mt-1">
                    {ev.classes.map((c: string) => (
                      <span key={c} className={`px-2 py-[2px] rounded border text-[9px] font-bold uppercase tracking-wider ${getClassColor(c)}`}>{c}</span>
                    ))}
                  </div>
                </div>

                {/* DESSIN DU CIRCUIT SVG SUR LE CÔTÉ DROIT */}
                <div className="flex flex-col items-end justify-between h-full w-[40%]">
                  <div className="flex items-center gap-2 text-gray-500 group-hover:text-gray-300 transition-colors">
                    <MonitorPlay size={14} />
                    <span className="text-[10px] font-bold tracking-widest uppercase flex items-center gap-1">View details <ChevronRight size={14}/></span>
                  </div>
                  <div className="mt-4">
                    <img 
                      src={trk.images.LAYOUT} 
                      alt={trk.name} 
                      className="w-32 h-20 object-contain opacity-50 group-hover:opacity-80 transition-opacity"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <Compass size={32} className="text-gray-700 opacity-50 hidden" />
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="p-4 rounded-xl border border-gray-800/30 text-gray-500 text-xs italic bg-[#0f1015]">No imminent events for this category.</div>
          )}
        </div>

        {/* TABLEAU "UPCOMING" (Affiche les courses à plus de 5 minutes) */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-gray-500 text-[10px] font-bold tracking-widest uppercase">Upcoming</h2>
          <div className="flex rounded-md border border-gray-800/50 overflow-hidden text-[10px] font-bold tracking-widest uppercase">
            <button className="bg-white text-black px-4 py-1.5">List</button>
            <button className="bg-[#121318] text-gray-500 px-4 py-1.5 hover:text-gray-300 transition-colors">Month</button>
            <button className="bg-[#121318] text-gray-500 px-4 py-1.5 hover:text-gray-300 transition-colors border-l border-gray-800/50">Day</button>
          </div>
        </div>

        <div className="border border-gray-800/50 rounded-xl overflow-hidden bg-[#0a0a0f]">
          <div className="grid grid-cols-12 gap-4 p-3 px-5 border-b border-gray-800/50 text-gray-500 text-[9px] font-bold tracking-widest uppercase bg-[#0d0e12]">
            <div className="col-span-2">When</div>
            <div className="col-span-3">Series</div>
            <div className="col-span-1">SR</div>
            <div className="col-span-3">Track</div>
            <div className="col-span-1">Classes</div>
            <div className="col-span-1">Length</div>
            <div className="col-span-1 text-right">Setup</div>
          </div>
          
          <div className="flex flex-col">
            {futureEventsList.length > 0 ? futureEventsList.map((ev, i) => {
              const trk = getTrackDetails(ev.track);
              const countdown = getCountdownData(ev.timestamp);
              
              return (
                <div key={`future-${i}`} onClick={() => setSelectedEvent(ev)} className="grid grid-cols-12 gap-4 p-3 px-5 items-center border-b border-gray-800/30 hover:bg-[#15161d] cursor-pointer transition-colors group last:border-b-0">
                  <div className="col-span-2 flex flex-col">
                    {/* LE CHRONOMÈTRE MULTICOLORE SUR LE TABLEAU */}
                    <span className={`${countdown.color} font-bold text-sm`}>{countdown.text}</span>
                    <span className="text-gray-500 text-[10px] font-medium mt-0.5">{ev.date}, {ev.time}</span>
                  </div>
                  <div className="col-span-3 flex flex-col pr-4">
                    <span className="text-gray-200 font-bold text-xs truncate">{ev.title}</span>
                    <span className="text-gray-500 text-[10px] font-medium mt-0.5">{ev.category}</span>
                  </div>
                  <div className="col-span-1">
                    <span className={`px-2 py-0.5 rounded border text-[8px] font-bold uppercase tracking-wider ${getRankColor(ev.rank)}`}>{ev.rank}</span>
                  </div>
                  <div className="col-span-3 flex items-center gap-2 text-gray-300 text-xs font-semibold pr-2 truncate">
                    <CountryFlag code={trk.code} />
                    <span className="truncate">{trk.name}</span>
                  </div>
                  <div className="col-span-1 flex gap-1.5 flex-wrap">
                    {ev.classes.map((c: string) => <span key={c} className={`px-1.5 py-[2px] rounded border text-[8px] font-bold uppercase tracking-wider ${getClassColor(c)}`}>{c}</span>)}
                  </div>
                  <div className="col-span-1 text-gray-400 text-xs font-semibold">{ev.length}</div>
                  <div className="col-span-1 flex justify-end items-center gap-3 text-gray-600 group-hover:text-gray-300 transition-colors">
                    <Wrench size={12} />
                    <MonitorPlay size={12} />
                    <ChevronRight size={12} />
                  </div>
                </div>
              );
            }) : (
              <div className="p-8 text-center text-gray-500 text-xs italic">No future events found for this filter.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default ScheduleView;