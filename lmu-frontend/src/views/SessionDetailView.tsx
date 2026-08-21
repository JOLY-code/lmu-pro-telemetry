import React, { useState, useEffect } from 'react';
import { 
  Info, Search, X, Trophy, ArrowUp, ArrowDown, CarFront, 
  ChevronRight, RefreshCw, AlertTriangle, Wrench, Flag, 
  Zap, Shield, Clock, ChevronLeft, MapPin, Activity, Settings2, 
  FileText, Edit3, Save, CornerUpLeft, MessageCircle, Star, 
  Route, Tag, ArrowRight, BarChart2
} from 'lucide-react';

import { 
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, 
  Tooltip as RechartsTooltip, ReferenceLine, LineChart as RechartsLine, Line, 
  BarChart, Bar, Cell, ScatterChart, Scatter, ZAxis, ComposedChart 
} from 'recharts';

import { 
  getTrackCountryCode, 
  getClassColor, 
  CountryFlag 
} from '../lmu_constants';

const CHART_COLORS = [
  '#3a86ff', '#8338ec', '#ffbe0b', '#2a9d8f', '#f4a261', 
  '#4cc9f0', '#7209b7', '#e76f51', '#48bfe3', '#9c6644',
  '#a7c957', '#e29578', '#0077b6', '#00b4d8', '#fca311'
];

const CustomChartTooltip = ({ active, payload, label, dataKeySuffix, isTime = false, playerName }: any) => {
  if (active && payload && payload.length) {
    const sortedPayload = [...payload].sort((a, b) => a.value - b.value);
    return (
      <div className="bg-[#121318]/95 backdrop-blur-md border border-gray-700 rounded-xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.8)] min-w-[200px] z-50">
        <div className="text-gray-400 text-[10px] font-bold tracking-widest uppercase border-b border-gray-800 pb-2 mb-2">Lap {label}</div>
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto scrollbar-hide">
          {sortedPayload.map((entry: any, index: number) => {
            const driverName = entry.dataKey ? entry.dataKey.replace(dataKeySuffix, '') : entry.payload.driver;
            const isPlayer = driverName === playerName;
            let displayValue = entry.value;
            if (isTime) {
              const m = Math.floor(entry.value / 60);
              const s = (entry.value % 60).toFixed(3);
              displayValue = `${m}:${s.padStart(6, '0')}`;
            } else if (dataKeySuffix === '_pos') { displayValue = `P${entry.value}`; } 
            else if (dataKeySuffix === '_gap') { displayValue = `+${entry.value.toFixed(3)}s`; }
            return (
              <div key={index} className={`flex items-center justify-between text-xs font-bold ${isPlayer ? 'bg-[#ef4444]/10 -mx-1 px-1 rounded' : ''}`}>
                <div className="flex items-center gap-2 truncate pr-4">
                  <div className="w-2 h-0.5 rounded-full" style={{ backgroundColor: entry.color || '#3a86ff' }}></div>
                  <span className={`truncate ${isPlayer ? 'text-[#ef4444]' : 'text-gray-300'}`}>{driverName}</span>
                </div>
                <span className={`${isPlayer ? 'text-[#ef4444]' : 'text-gray-400'}`}>{displayValue}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

// --- NOUVEAU : Helper pour formater les statistiques ---
const StatBlock = ({ label, value, sub1, sub2, sub3, isPlayer }: any) => (
  <div className="flex flex-col mb-4">
    <span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">{label}</span>
    <span className="text-xl font-black text-white">{value || '--'}</span>
    {sub1 && <span className="text-xs font-bold text-gray-400 mt-1">{sub1}</span>}
    {sub2 && (
      <span className={`text-[10px] font-semibold flex items-center gap-1.5 mt-0.5 ${isPlayer ? 'text-[#ef4444]' : 'text-gray-200'}`}>
        {sub2} {isPlayer && <span className="text-[8px] bg-red-900/30 text-red-500 px-1 rounded">YOU</span>}
      </span>
    )}
    {sub3 && <span className="text-[9px] font-bold text-gray-500 flex items-center gap-1.5 mt-0.5"><CarFront size={10} /> {sub3}</span>}
  </div>
);

// --- NOUVEAU : TOOLTIP SPÉCIFIQUE POUR LE GRAPHIQUE DES INCIDENTS ---
const AreaChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#121318]/95 backdrop-blur-md border border-gray-700 rounded-xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 min-w-[200px]">
        <div className="text-gray-200 text-xs font-bold mb-2">Time: {label}</div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">Combined Force</span>
          <span className="text-[#ef4444] font-black text-sm">{data.impact.toFixed(1)}</span>
        </div>
        {data.contributors && data.contributors.length > 0 && (
          <>
            <div className="text-gray-500 text-[9px] font-bold tracking-widest uppercase mb-1.5 border-t border-gray-800 pt-2">Top Contributors</div>
            <div className="flex flex-col gap-1">
              {data.contributors.map((c: any, i: number) => (
                <div key={i} className="flex justify-between items-center">
                  <span className={`text-[10px] font-semibold ${c.driver.toUpperCase().includes('JOLY') ? 'text-[#ef4444]' : 'text-gray-300'}`}>{c.driver}</span>
                <span className="text-gray-400 text-[10px] font-mono">{c.impact.toFixed(1)}</span>
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    );
  }
  return null;
};

// --- NOUVEAU : TOOLTIP SPÉCIAL POUR "YOUR CHARTS" ---
const YourChartTooltip = ({ active, payload, label, isTime = false, suffix = '' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#121318]/95 backdrop-blur-md border border-gray-700 rounded-xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 min-w-[180px]">
        <div className="text-gray-200 text-xs font-bold mb-3">Lap {label}</div>
        <div className="flex flex-col gap-2">
          {payload.map((entry: any, index: number) => {
            let val = entry.value;
            if (isTime) {
              const m = Math.floor(val / 60);
              const s = (val % 60).toFixed(3);
              val = `${m}:${s.padStart(6, '0')}`;
            } else if (suffix) {
              val = `${val.toFixed(2)}${suffix}`;
            } else if (entry.dataKey.toLowerCase().includes('speed')) {
              val = `${val.toFixed(1)} km/h`;
            } else if (entry.dataKey === 'pos') {
              val = `P${val}`;
            } else if (entry.dataKey === 'gapToLeader') {
              val = `+${val.toFixed(3)}s`;
            }
            return (
              <div key={index} className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-0.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-gray-300">{entry.name}</span>
                </div>
                <span className="text-white">{val}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

// --- COMPOSANT VUE DÉTAILLÉE D'UNE SESSION ---
const SessionDetailView = ({ session, onBack }: { session: any, onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [activePaceTab, setActivePaceTab] = useState<'racePace' | 'validLaps' | 'allLaps' | 'bestLap'>('racePace');
  const [details, setDetails] = useState<any>(null);
  const [standings, setStandings] = useState<any>(null);
  const [chartsData, setChartsData] = useState<any>(null);
  
  // NOUVEAU : Données et contrôles pour les Race Stats
  const [statsData, setStatsData] = useState<any>(null);
  const [activeStatsClass, setActiveStatsClass] = useState<string>('');

  useEffect(() => {
    if (!session || !session.file || !session.type) return;
    fetch(`http://127.0.0.1:8000/api/sessions/details?file=${session.file}&type=${session.type}`)
      .then(res => res.json())
      .then(json => { if (json.status === 'success') setDetails(json.data); });
  }, [session]);

  useEffect(() => {
    if (activeTab === 'Standings' && !standings && session?.file) {
      fetch(`http://127.0.0.1:8000/api/sessions/standings?file=${session.file}&type=${session.type}`)
        .then(res => res.json())
        .then(json => { if (json.status === 'success') setStandings(json.data); });
    }
  }, [activeTab, session, standings]);

  useEffect(() => {
    if (activeTab === 'Race Charts' && !chartsData && session?.file) {
      fetch(`http://127.0.0.1:8000/api/sessions/charts?file=${session.file}&type=${session.type}`)
        .then(res => res.json())
        .then(json => { if (json.status === 'success') setChartsData(json.data); });
    }
  }, [activeTab, session, chartsData]);

  // NOUVEAU : Appel API pour Race Stats
  useEffect(() => {
    if (activeTab === 'Race Stats' && !statsData && session?.file) {
      fetch(`http://127.0.0.1:8000/api/sessions/stats?file=${session.file}&type=${session.type}`)
        .then(res => res.json())
        .then(json => { 
          if (json.status === 'success') {
            setStatsData(json.data);
            setActiveStatsClass(Object.keys(json.data)[0]); // Sélectionne la 1ère classe par défaut
          } 
        });
    }
  }, [activeTab, session, statsData]);

  const tabs = ['Overview', 'Standings', 'Race Charts', 'Race Stats', 'Race Director', 'Your Charts', 'Lap Data', 'Chat', 'Notes'];

  // ... (Garde ton code Overview, Pace Benchmark et Standings identiques ici) ...
  const paceInfo = details?.paceData?.[activePaceTab];
  const pctRaw = paceInfo?.percentRaw || 100;
  let barColor = '#10b981'; let paceTag = 'ALIEN'; let badgeStyle = 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30';
  if (pctRaw > 100 && pctRaw <= 103.5) { barColor = '#10b981'; paceTag = 'Good'; badgeStyle = 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30'; }
  else if (pctRaw > 103.5 && pctRaw <= 106) { barColor = '#e9c46a'; paceTag = 'Midpack'; badgeStyle = 'text-[#e9c46a] bg-[#e9c46a]/10 border-[#e9c46a]/30'; }
  else if (pctRaw > 106) { barColor = '#ef4444'; paceTag = 'Offline'; badgeStyle = 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30'; }
  const fillWidth = Math.min(100, Math.max(0, (pctRaw - 100) * 10));

  // --- NOUVEAUX ETATS POUR LE RACE DIRECTOR ---
  const [directorData, setDirectorData] = useState<any>(null);
  const [directorFilter, setDirectorFilter] = useState('All');
  const [directorOnlyMe, setDirectorOnlyMe] = useState(false);
  const [yourChartsData, setYourChartsData] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'Your Charts' && !yourChartsData && session?.file) {
      fetch(`http://127.0.0.1:8000/api/sessions/yourcharts?file=${session.file}&type=${session.type}`)
        .then(res => res.json())
        .then(json => { if (json.status === 'success') setYourChartsData(json.data); });
    }
  }, [activeTab, session, yourChartsData]);

  useEffect(() => {
    if (activeTab === 'Race Director' && !directorData && session?.file) {
      fetch(`http://127.0.0.1:8000/api/sessions/director?file=${session.file}&type=${session.type}`)
        .then(res => res.json())
        .then(json => { if (json.status === 'success') setDirectorData(json.data); });
    }
  }, [activeTab, session, directorData]);

  const directorEvents = directorData?.events.filter((ev: any) => {
    if (directorOnlyMe && !ev.driver.toUpperCase().includes('JOLY')) return false;
    if (directorFilter !== 'All' && ev.type !== directorFilter) return false;
    return true;
  });

  const [chatData, setChatData] = useState<any>(null);
  const [notesData, setNotesData] = useState<string>("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState("");

  useEffect(() => {
    if (activeTab === 'Chat' && !chatData && session?.file) {
      fetch(`http://127.0.0.1:8000/api/sessions/chat?file=${session.file}&type=${session.type}`)
        .then(res => res.json())
        .then(json => { if (json.status === 'success') setChatData(json.data); });
    }
  }, [activeTab, session, chatData]);

  useEffect(() => {
    if (activeTab === 'Notes' && session?.file) {
      fetch(`http://127.0.0.1:8000/api/sessions/notes?file=${session.file}`)
        .then(res => res.json())
        .then(json => { 
           if (json.status === 'success') {
             setNotesData(json.data);
             setTempNotes(json.data);
           }
        });
    }
  }, [activeTab, session]);

  const handleSaveNotes = () => {
    fetch('http://127.0.0.1:8000/api/sessions/notes/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: session.file, notes: tempNotes })
    })
    .then(res => res.json())
    .then(json => {
      if (json.status === 'success') {
        setNotesData(tempNotes);
        setIsEditingNotes(false);
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] rounded-xl overflow-hidden shadow-2xl border border-gray-800/50">
      
      {/* TABS HEADER */}
      <div className="flex items-center gap-6 px-6 pt-4 border-b border-gray-800/50 bg-[#121318] shrink-0">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide w-full">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`text-[11px] font-bold tracking-widest uppercase transition-colors relative pb-3 whitespace-nowrap ${activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {tab}
              {activeTab === tab && <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#3a86ff] rounded-t-full"></span>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 pb-3 shrink-0">
          <button className="p-1.5 text-gray-400 hover:text-white bg-[#1c1e2b] rounded-md border border-gray-800 transition-colors"><Info size={14}/></button>
          <button className="p-1.5 text-gray-400 hover:text-white bg-[#1c1e2b] rounded-md border border-gray-800 transition-colors"><Search size={14}/></button>
          <button onClick={onBack} className="p-1.5 text-[#ef4444] hover:text-white bg-[#2a1518] rounded-md border border-[#ef4444]/30 transition-colors ml-2 flex items-center gap-1 text-xs font-bold px-3"><X size={14}/> CLOSE</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        
        {/* ============================================================== */}
        {/* VUE 1 : OVERVIEW                                               */}
        {/* ============================================================== */}
        {activeTab === 'Overview' && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            {/* HEADER SESSION PRINCIPAL */}
            <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-6 shadow-md relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <CountryFlag code={getTrackCountryCode(session.track)} />
                    <h1 className="text-2xl font-black text-white">{session.track}</h1>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase border ${session.type.includes('Race') ? 'bg-red-900/20 text-red-500 border-red-800/50' : 'bg-green-900/20 text-green-500 border-green-800/50'}`}>
                      {details ? details.type : session.type}
                    </span>
                    <Star size={16} className="text-gray-500 cursor-pointer hover:text-[#e9c46a] transition-colors" />
                    <Tag size={16} className="text-gray-500 cursor-pointer hover:text-white transition-colors" />
                  </div>
                  <p className="text-xs text-gray-400 font-medium">{details ? details.date : session.date}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="text-[#3a86ff] text-[10px] font-bold tracking-widest uppercase mb-2">Link telemetry file(s)</div>
                  <button className="bg-[#1c1e2b] border border-gray-800 p-2 rounded-lg text-gray-400 hover:text-white transition-colors"><Route size={16}/></button>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-8">
                <CarFront size={18} className="text-gray-400" />
                <span className="text-sm font-bold text-white">{session.car}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border ${getClassColor(session.class)}`}>{session.class}</span>
              </div>

              <div className="grid grid-cols-5 gap-6 pt-6 border-t border-gray-800/50">
                <div className="flex gap-4">
                  <div className="flex flex-col"><span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">Class Grid Position</span><span className="text-2xl font-black text-white">{details ? details.gridPos : '--'}</span></div>
                  <div className="flex items-center pt-4"><ArrowRight size={14} className="text-gray-600" /></div>
                  <div className="flex flex-col"><span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">Class Finish Position</span><span className="text-2xl font-black text-white">{details ? details.finishPos : '--'}</span></div>
                </div>
                <div className="flex flex-col"><span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">Finish Status</span><span className="text-lg font-bold text-white mt-1">{details ? details.finishStatus : '--'}</span></div>
                <div className="flex flex-col"><span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">Best Lap Time</span><span className="text-2xl font-black text-white">{details ? details.bestLap : '--:--.---'}</span></div>
                <div className="flex flex-col"><span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">Total Race Time</span><span className="text-2xl font-black text-white">{details ? details.totalTime : '--:--.---'}</span></div>
                <div className="flex flex-col"><span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">Laps Completed</span><span className="text-2xl font-black text-white">{details ? details.laps : '--'}</span></div>
              </div>
            </div>

            {/* BANDEAU SECONDAIRE */}
            <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-6 shadow-md grid grid-cols-6 gap-6">
              <div className="flex flex-col">
                <span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-2">Starting Tires</span>
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black ${details?.startingTires === 'Hard' ? 'bg-white' : details?.startingTires === 'Soft' ? 'bg-red-500' : details?.startingTires === 'Wet' ? 'bg-blue-500' : 'bg-[#e9c46a]'}`}>{details?.startingTires ? details.startingTires.charAt(0) : 'M'}</span>
                  <span className="text-sm font-bold text-white">{details ? details.startingTires : '--'}</span>
                </div>
              </div>
              <div className="flex flex-col"><span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">Fuel Ratio</span><span className="text-sm font-bold text-white mt-1">{details ? details.fuelRatio : '--'}</span></div>
              <div className="flex flex-col"><span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">Track Length</span><span className="text-sm font-bold text-white mt-1">{details ? details.trackLength : '--'}</span></div>
              <div className="flex flex-col"><span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">Pitstops</span><span className="text-sm font-bold text-white mt-1">{details ? details.pitstops : '--'}</span></div>
              <div className="flex flex-col"><span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">Split</span><span className="text-sm font-bold text-white mt-1 flex items-center gap-1"><Info size={12} className="text-gray-500"/> ? / ?</span></div>
              <div className="flex flex-col items-start"><span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">Car Classes</span>
                <div className="flex gap-1 mt-1">{details?.carClasses ? details.carClasses.map((c: string) => (<span key={c} className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border ${getClassColor(c)}`}>{c}</span>)) : <span className="text-white text-sm font-bold">--</span>}</div>
              </div>
            </div>

            {/* PERFORMANCE SUMMARY */}
            <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-6 shadow-md grid grid-cols-3 gap-y-8 gap-x-6">
              <div className="flex flex-col"><span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">Consistency</span><span className="text-xl font-black text-white">{details ? details.consistency : '--:--.---'}</span><span className="text-[10px] text-gray-500 mt-1">Based on Race Pace (107%) • Best to worst delta</span></div>
              <div className="flex flex-col"><span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">Optimum Lap</span><span className="text-xl font-black text-white">{details ? details.optimumLap : '--:--.---'}</span><span className="text-[10px] text-gray-500 mt-1">Ideal session lap</span></div>
              <div className="flex flex-col"><span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">Average Lap Time</span><span className="text-xl font-black text-white">{details ? details.averageLap : '--:--.---'}</span><span className="text-[10px] text-gray-500 mt-1">Based on Race Pace (107%) • {details?.validLapsCount || 0} laps</span></div>
              <div className="flex flex-col"><span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">Best Sector 1</span><span className="text-xl font-black text-white">{details ? details.bestS1 : '--'}</span></div>
              <div className="flex flex-col"><span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">Best Sector 2</span><span className="text-xl font-black text-white">{details ? details.bestS2 : '--'}</span></div>
              <div className="flex flex-col"><span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">Best Sector 3</span><span className="text-xl font-black text-white">{details ? details.bestS3 : '--'}</span></div>
              <div className="flex flex-col"><span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">Top Speed</span><span className="text-xl font-black text-white">{details ? details.topSpeed : '---'}</span><span className="text-[10px] text-gray-500 mt-1">Maximum reached</span></div>
              <div className="flex flex-col"><span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">Avg Virtual Energy</span><span className="text-xl font-black text-white">{details ? details.avgVirtualEnergy : 'N/A'}</span><span className="text-[10px] text-gray-500 mt-1">Per lap consumption (%)</span></div>
              <div className="flex flex-col"><span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">Most Worn Tyre</span><span className="text-xl font-black text-white">{details ? details.mostWornTyre : '--'}</span><span className="text-[10px] text-gray-500 mt-1">Highest wear across session</span></div>
            </div>

            {/* PACE BENCHMARK */}
            <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-6 shadow-md flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">Pace Benchmark <Info size={14} className="text-gray-500"/></h2>
                  <p className="text-xs text-gray-400 mt-1">How your pace compares to community references</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-[#1c1e2b] rounded-full p-1 border border-gray-800">
                    {[
                      { id: 'racePace', label: 'RACE PACE (107%)' },
                      { id: 'validLaps', label: 'VALID LAPS' },
                      { id: 'allLaps', label: 'ALL LAPS' },
                      { id: 'bestLap', label: 'BEST LAP' }
                    ].map(btn => (
                      <button key={btn.id} onClick={() => setActivePaceTab(btn.id as any)} className={`px-4 py-1.5 text-[10px] font-bold rounded-full uppercase tracking-wider transition-all ${activePaceTab === btn.id ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white cursor-pointer'}`}>
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  <button className="p-2 text-gray-500 hover:text-white transition-colors"><Settings2 size={16}/></button>
                </div>
              </div>
              <div className="flex-1 flex flex-col w-full relative pt-10 pb-4">
                 <div className="w-full h-3 bg-[#1c1e2b] rounded-full relative overflow-hidden">
                    <div className="absolute left-0 top-0 h-full transition-all duration-500 ease-out flex items-center justify-end" style={{ width: `${fillWidth}%`, backgroundColor: barColor }}>
                      {fillWidth > 0 && <div className="h-5 w-1.5 bg-white shadow-lg absolute right-0"></div>}
                    </div>
                 </div>
                 <div className="absolute top-0 transition-all duration-500 ease-out" style={{ left: `calc(${fillWidth}% - 30px)`}}>
                     <div className="flex flex-col items-center">
                       <span className="font-bold text-sm" style={{ color: barColor }}>{paceInfo?.delta || '--'}</span>
                       <span className="text-gray-500 text-xs font-normal">from alien</span>
                     </div>
                 </div>
                 <div className="flex justify-between w-full mt-6 uppercase tracking-widest">
                    <div className="flex flex-col text-[#3a86ff]">
                        <span className="text-[10px] font-bold mb-1">Alien Pace</span>
                        <span className="text-lg font-black">{details?.alienPace || '--'}</span>
                    </div>
                    <div className="flex flex-col items-center justify-end">
                        <span className="text-gray-500 text-[10px] lowercase">{paceInfo?.laps || 0} laps</span>
                    </div>
                    <div className="flex flex-col text-right items-end" style={{ color: barColor }}>
                        <span className="text-[10px] font-bold mb-1 text-gray-400">Your Pace</span>
                        <span className="text-lg font-black">{paceInfo?.time || '--'}</span>
                        <span className={`mt-1 px-2 py-0.5 rounded border text-[9px] font-bold tracking-widest ${badgeStyle}`}>
                          {paceTag} {pctRaw > 100 ? `${pctRaw.toFixed(2)}%` : ''}
                        </span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VUE 2 : STANDINGS                                                */}
        {/* ============================================================== */}
        {activeTab === 'Standings' && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className="mb-2">
              <h2 className="text-xl font-black text-white">Driver Standings</h2>
              <p className="text-sm text-gray-400">Final race results by class ({Object.keys(standings || {}).length} classes)</p>
            </div>
            {!standings ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <RefreshCw size={32} className="text-[#3a86ff] animate-spin mb-4" />
                <p className="text-sm font-bold tracking-widest uppercase">Loading standings...</p>
              </div>
            ) : (
              Object.entries(standings).map(([carClass, drivers]: any) => (
                <div key={carClass} className="flex flex-col mb-6">
                  <div className="mb-4">
                    <span className={`px-3 py-1 rounded-md text-[11px] font-black tracking-widest uppercase border ${getClassColor(carClass)}`}>{carClass}</span>
                  </div>
                  <div className="bg-[#121318] rounded-xl border border-gray-800/50 overflow-hidden shadow-lg">
                    <div className="flex items-center p-3 border-b border-gray-800/50 text-[9px] font-black text-gray-500 tracking-widest uppercase bg-[#0f1015]">
                      <div className="w-[8%] pl-2">POS</div>
                      <div className="w-[22%]">DRIVER</div>
                      <div className="w-[24%]">CAR</div>
                      <div className="w-[8%] text-center">GRID</div>
                      <div className="w-[10%] text-center">BEST LAP</div>
                      <div className="w-[10%] text-center">FINISH TIME</div>
                      <div className="w-[10%] text-center">GAP</div>
                      <div className="w-[4%] text-center">LAPS</div>
                      <div className="w-[4%] text-center pr-2">PITSTOPS</div>
                    </div>
                    <div className="flex flex-col">
                      {drivers.map((d: any, idx: number) => {
                        const isMe = d.driver.toUpperCase().includes('JOLY');
                        return (
                          <div key={idx} className={`flex items-center p-3 text-xs font-bold border-b border-gray-800/30 last:border-0 transition-colors ${isMe ? 'bg-[#3a86ff]/10 border-l-2 border-l-[#3a86ff]' : 'hover:bg-[#1a1b26]'}`}>
                            <div className="w-[8%] flex items-center gap-2 pl-2">
                               {d.pos === 1 ? <Trophy size={14} className="text-[#e9c46a]" /> : d.pos === 2 ? <Trophy size={14} className="text-[#94a3b8]" /> : d.pos === 3 ? <Trophy size={14} className="text-[#b45309]" /> : <span className="w-[14px]"></span>}
                               <span className="text-gray-300">#{d.pos}</span>
                               {d.posChange > 0 ? (<span className="text-[#10b981] text-[9px] flex items-center"><ArrowUp size={10}/>{d.posChange}</span>) : d.posChange < 0 ? (<span className="text-[#ef4444] text-[9px] flex items-center"><ArrowDown size={10}/>{Math.abs(d.posChange)}</span>) : (<span className="text-gray-600 text-[10px] w-4 text-center">-</span>)}
                            </div>
                            <div className="w-[22%] flex items-center gap-2">
                              {isMe && <CountryFlag code="FR" />}
                              <span className={`truncate ${isMe ? 'text-[#3a86ff]' : 'text-gray-200'}`}>{d.driver}</span>
                              {isMe && <span className="text-gray-500 text-[9px] uppercase tracking-wider ml-1">You</span>}
                            </div>
                            <div className="w-[24%] text-gray-400 font-semibold truncate flex items-center gap-2"><CarFront size={14} className="shrink-0" /><span className="truncate">{d.car}</span></div>
                            <div className="w-[8%] text-center text-gray-400">{d.grid > 0 ? d.grid : '--'}</div>
                            <div className="w-[10%] text-center text-gray-300 font-mono">{d.bestLap}</div>
                            <div className="w-[10%] text-center text-gray-300 font-mono">{d.finishTime}</div>
                            <div className={`w-[10%] text-center font-mono ${d.gap === 'LEADER' ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>{d.gap}</div>
                            <div className="w-[4%] text-center text-gray-400">{d.status === 'DNF' ? '--' : d.laps}</div>
                            <div className="w-[4%] text-center text-gray-500 pr-2">{d.status === 'DNF' ? '--' : d.pitstops}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VUE 3 : RACE CHARTS (LES 8 GRAPHIQUES PROS)                      */}
        {/* ============================================================== */}
        {activeTab === 'Race Charts' && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className="mb-2">
              <h2 className="text-xl font-black text-white">Race Charts</h2>
              <p className="text-sm text-gray-400">Lap by lap telemetry analysis</p>
            </div>

            {!chartsData ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <RefreshCw size={32} className="text-[#3a86ff] animate-spin mb-4" />
                <p className="text-sm font-bold tracking-widest uppercase">Analyzing Telemetry Data...</p>
              </div>
            ) : (
              Object.entries(chartsData.classes).map(([carClass, classData]: any) => (
                <div key={`chart-${carClass}`} className="flex flex-col gap-6 border-b border-gray-800/50 pb-10 mb-10 last:border-0">
                  
                  {/* GRAPH 1 : Position Changes */}
                  <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg">
                     <div className="flex items-center gap-3 mb-2">
                       <h3 className="text-lg font-bold text-white flex items-center gap-2">Position Changes - All Drivers</h3>
                       <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase border ${getClassColor(carClass)}`}>{carClass}</span>
                     </div>
                     <p className="text-xs text-gray-500 mb-6">How positions changed throughout the session</p>
                     <div className="h-[250px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <RechartsLine data={classData.lapData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                           <XAxis dataKey="lap" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} />
                           <YAxis reversed domain={[1, 'dataMax']} stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} allowDecimals={false} />
                           <RechartsTooltip content={<CustomChartTooltip dataKeySuffix="_pos" />} cursor={{ stroke: '#4a4d65', strokeWidth: 1, strokeDasharray: '3 3' }} />
                           {classData.drivers.map((d: string, i: number) => (
                               <Line key={d} type="stepAfter" dataKey={`${d}_pos`} stroke={d === chartsData.player ? '#ef4444' : CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={d === chartsData.player ? 3 : 1.5} dot={false} isAnimationActive={false} opacity={d === chartsData.player ? 1 : 0.6} />
                           ))}
                         </RechartsLine>
                       </ResponsiveContainer>
                     </div>
                  </div>

                  {/* GRAPH 2 : Gap to Class Leader */}
                  <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg">
                     <div className="flex items-center gap-3 mb-2">
                       <h3 className="text-lg font-bold text-white flex items-center gap-2">Gap to Class Leader</h3>
                     </div>
                     <p className="text-xs text-gray-500 mb-6">Time gap to the class leader over time</p>
                     <div className="h-[250px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <RechartsLine data={classData.lapData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                           <XAxis dataKey="lap" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} />
                           <YAxis domain={['auto', 'auto']} stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(val) => `+${val}s`} />
                           <RechartsTooltip content={<CustomChartTooltip dataKeySuffix="_gap" />} cursor={{ stroke: '#4a4d65', strokeWidth: 1, strokeDasharray: '3 3' }} />
                           {classData.drivers.map((d: string, i: number) => (
                               <Line key={d} type="monotone" dataKey={`${d}_gap`} stroke={d === chartsData.player ? '#ef4444' : CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={d === chartsData.player ? 3 : 1.5} dot={false} isAnimationActive={false} opacity={d === chartsData.player ? 1 : 0.6} />
                           ))}
                         </RechartsLine>
                       </ResponsiveContainer>
                     </div>
                  </div>

                  {/* GRAPH 3 : Best Laptime Gap */}
                  <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg">
                     <div className="flex items-center gap-3 mb-2">
                       <h3 className="text-lg font-bold text-white flex items-center gap-2">Best Laptime Gap</h3>
                     </div>
                     <p className="text-xs text-gray-500 mb-6">Gap from each driver's best lap to the class fastest</p>
                     <div className="h-[250px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={classData.driverStats} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                           <XAxis dataKey="driver" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 9}} tickLine={false} axisLine={false} angle={-45} textAnchor="end" />
                           <YAxis domain={[0, 'auto']} stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(val) => `+${val.toFixed(1)}s`} />
                           <RechartsTooltip content={<CustomChartTooltip dataKeySuffix="gapToBest" />} cursor={{ fill: '#ffffff', opacity: 0.05 }} />
                           <Bar dataKey="gapToBest" radius={[2, 2, 0, 0]}>
                              {classData.driverStats.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.driver === chartsData.player ? '#ef4444' : CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                           </Bar>
                         </BarChart>
                       </ResponsiveContainer>
                     </div>
                  </div>

                  {/* GRAPH 4 : Ideal vs Best Lap */}
                  <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg">
                     <div className="flex items-center gap-3 mb-2">
                       <h3 className="text-lg font-bold text-white flex items-center gap-2">Ideal vs Best Lap</h3>
                     </div>
                     <p className="text-xs text-gray-500 mb-6">Theoretical best (best sectors combined) versus actual best lap</p>
                     <div className="h-[300px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <ComposedChart layout="vertical" data={classData.driverStats} margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={true} vertical={false} />
                           <XAxis type="number" domain={['dataMin - 1', 'dataMax + 1']} stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(v) => { const m=Math.floor(v/60); const s=(v%60).toFixed(1); return `${m}:${s.padStart(4,'0')}`; }} />
                           <YAxis type="category" dataKey="driver" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} width={100} />
                           <RechartsTooltip content={<CustomChartTooltip dataKeySuffix="idealLap" isTime={true} />} cursor={{ fill: '#ffffff', opacity: 0.05 }} />
                           <Scatter dataKey="bestLap" fill="#ffffff" />
                           <Scatter dataKey="idealLap" fill="#10b981" />
                         </ComposedChart>
                       </ResponsiveContainer>
                     </div>
                  </div>

                  {/* GRAPH 5 & 8 : Global Race Pace / Distribution */}
                  <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg">
                     <div className="flex items-center gap-3 mb-2">
                       <h3 className="text-lg font-bold text-white flex items-center gap-2">Laptime Distribution</h3>
                     </div>
                     <p className="text-xs text-gray-500 mb-6">Spread of valid lap times per driver</p>
                     <div className="h-[300px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <ScatterChart margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                           <XAxis type="category" dataKey="driver" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 9}} tickLine={false} axisLine={false} angle={-45} textAnchor="end" />
                           <YAxis type="number" dataKey="time" domain={['dataMin - 1', 'dataMax + 1']} stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(v) => { const m=Math.floor(v/60); const s=(v%60).toFixed(1); return `${m}:${s.padStart(4,'0')}`; }} />
                           <ZAxis type="number" range={[20, 20]} />
                           <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomChartTooltip dataKeySuffix="time" isTime={true} />} />
                           {classData.drivers.map((d: string, i: number) => (
                             <Scatter key={d} name={d} data={classData.scatterData.filter((x: any) => x.driver === d)} fill={d === chartsData.player ? '#ef4444' : CHART_COLORS[i % CHART_COLORS.length]} />
                           ))}
                         </ScatterChart>
                       </ResponsiveContainer>
                     </div>
                  </div>

                  {/* GRAPH 6 : Smoothed Lap-by-Lap Race Pace */}
                  <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg">
                     <div className="flex items-center gap-3 mb-2">
                       <h3 className="text-lg font-bold text-white flex items-center gap-2">Smoothed Lap-by-Lap Race Pace</h3>
                     </div>
                     <p className="text-xs text-gray-500 mb-6">Centered moving average of race-pace lap times across the field</p>
                     <div className="h-[250px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <RechartsLine data={classData.lapData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                           <XAxis dataKey="lap" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} />
                           <YAxis domain={['auto', 'auto']} stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(v) => { const m=Math.floor(v/60); const s=(v%60).toFixed(0); return `${m}:${s.padStart(2,'0')}`; }} />
                           <RechartsTooltip content={<CustomChartTooltip dataKeySuffix="_smoothed" isTime={true} />} cursor={{ stroke: '#4a4d65', strokeWidth: 1, strokeDasharray: '3 3' }} />
                           {classData.drivers.map((d: string, i: number) => (
                               <Line key={d} type="monotone" dataKey={`${d}_smoothed`} stroke={d === chartsData.player ? '#ef4444' : CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={d === chartsData.player ? 3 : 1.5} dot={false} isAnimationActive={false} opacity={d === chartsData.player ? 1 : 0.6} />
                           ))}
                         </RechartsLine>
                       </ResponsiveContainer>
                     </div>
                  </div>

                  {/* GRAPH 7 : Lap Times */}
                  <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg">
                     <div className="flex items-center gap-3 mb-2">
                       <h3 className="text-lg font-bold text-white flex items-center gap-2">Lap Times</h3>
                     </div>
                     <p className="text-xs text-gray-500 mb-6">Valid lap times for all drivers throughout the session</p>
                     <div className="h-[250px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <RechartsLine data={classData.lapData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                           <XAxis dataKey="lap" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} />
                           <YAxis domain={['auto', 'auto']} stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(v) => { const m=Math.floor(v/60); const s=(v%60).toFixed(0); return `${m}:${s.padStart(2,'0')}`; }} />
                           <RechartsTooltip content={<CustomChartTooltip dataKeySuffix="_time" isTime={true} />} cursor={{ stroke: '#4a4d65', strokeWidth: 1, strokeDasharray: '3 3' }} />
                           {classData.drivers.map((d: string, i: number) => (
                               <Line key={d} type="monotone" dataKey={`${d}_time`} stroke={d === chartsData.player ? '#ef4444' : CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={d === chartsData.player ? 3 : 1.5} dot={false} isAnimationActive={false} opacity={d === chartsData.player ? 1 : 0.6} />
                           ))}
                         </RechartsLine>
                       </ResponsiveContainer>
                     </div>
                  </div>

                </div>
              ))
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VUE 4 : RACE STATS                                             */}
        {/* ============================================================== */}
        {activeTab === 'Race Stats' && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            {statsData && Object.keys(statsData).length > 1 && (
               <div className="flex gap-2 mb-2">
                 {Object.keys(statsData).map(cls => (
                   <button key={cls} onClick={() => setActiveStatsClass(cls)} className={`px-4 py-1.5 rounded-md text-[11px] font-black tracking-widest uppercase transition-all ${activeStatsClass === cls ? getClassColor(cls).replace('bg-opacity-10', 'bg-opacity-100') : 'bg-[#121318] text-gray-500 hover:text-gray-300 border border-gray-800'}`}>
                     {cls}
                   </button>
                 ))}
               </div>
            )}

            {!statsData ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <RefreshCw size={32} className="text-[#3a86ff] animate-spin mb-4" />
                <p className="text-sm font-bold tracking-widest uppercase">Analyzing Race Statistics...</p>
              </div>
            ) : statsData[activeStatsClass] ? (
              <div className="flex flex-col gap-6">
                
                {/* 1. PACE, 2. RACING, 3. STRATEGY ... (Garde-les identiques à la version précédente) */}
                <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-white mb-1">Pace</h3>
                  <p className="text-xs text-gray-500 mb-6">Lap and sector highlights</p>
                  <div className="grid grid-cols-3 gap-6">
                    <StatBlock label="Fastest Lap" value={statsData[activeStatsClass].pace.fastest?.val} sub1={`Lap ${statsData[activeStatsClass].pace.fastest?.lap || '--'}`} sub2={statsData[activeStatsClass].pace.fastest?.driver} sub3={statsData[activeStatsClass].pace.fastest?.car} isPlayer={statsData[activeStatsClass].pace.fastest?.driver?.toUpperCase().includes('JOLY')} />
                    <StatBlock label="Most Consistent" value={statsData[activeStatsClass].pace.consistent?.val} sub1="std dev" sub2={statsData[activeStatsClass].pace.consistent?.driver} sub3={statsData[activeStatsClass].pace.consistent?.car} isPlayer={statsData[activeStatsClass].pace.consistent?.driver?.toUpperCase().includes('JOLY')} />
                    <StatBlock label="Top Speed" value={statsData[activeStatsClass].pace.topSpeed?.val} sub1={`Lap ${statsData[activeStatsClass].pace.topSpeed?.lap || '--'}`} sub2={statsData[activeStatsClass].pace.topSpeed?.driver} sub3={statsData[activeStatsClass].pace.topSpeed?.car} isPlayer={statsData[activeStatsClass].pace.topSpeed?.driver?.toUpperCase().includes('JOLY')} />
                    
                    <StatBlock label="Fastest Sector 1" value={statsData[activeStatsClass].pace.s1?.val} sub1={`Lap ${statsData[activeStatsClass].pace.s1?.lap || '--'}`} sub2={statsData[activeStatsClass].pace.s1?.driver} sub3={statsData[activeStatsClass].pace.s1?.car} isPlayer={statsData[activeStatsClass].pace.s1?.driver?.toUpperCase().includes('JOLY')} />
                    <StatBlock label="Fastest Sector 2" value={statsData[activeStatsClass].pace.s2?.val} sub1={`Lap ${statsData[activeStatsClass].pace.s2?.lap || '--'}`} sub2={statsData[activeStatsClass].pace.s2?.driver} sub3={statsData[activeStatsClass].pace.s2?.car} isPlayer={statsData[activeStatsClass].pace.s2?.driver?.toUpperCase().includes('JOLY')} />
                    <StatBlock label="Fastest Sector 3" value={statsData[activeStatsClass].pace.s3?.val} sub1={`Lap ${statsData[activeStatsClass].pace.s3?.lap || '--'}`} sub2={statsData[activeStatsClass].pace.s3?.driver} sub3={statsData[activeStatsClass].pace.s3?.car} isPlayer={statsData[activeStatsClass].pace.s3?.driver?.toUpperCase().includes('JOLY')} />
                  </div>
                </div>

                <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-white mb-1">Racing</h3>
                  <p className="text-xs text-gray-500 mb-6">Position changes, overtakes, recovery, and track limits</p>
                  <div className="grid grid-cols-3 gap-6">
                    <StatBlock label="Most Positions Gained" value={statsData[activeStatsClass].racing.gained?.val} sub1="positions" sub2={statsData[activeStatsClass].racing.gained?.driver} sub3={statsData[activeStatsClass].racing.gained?.car} isPlayer={statsData[activeStatsClass].racing.gained?.driver?.toUpperCase().includes('JOLY')} />
                    <StatBlock label="Most Positions Lost" value={statsData[activeStatsClass].racing.lost?.val} sub1="positions" sub2={statsData[activeStatsClass].racing.lost?.driver} sub3={statsData[activeStatsClass].racing.lost?.car} isPlayer={statsData[activeStatsClass].racing.lost?.driver?.toUpperCase().includes('JOLY')} />
                    <StatBlock label="Best Recovery" value={statsData[activeStatsClass].racing.recovery?.val} sub1={statsData[activeStatsClass].racing.recovery?.sub} sub2={statsData[activeStatsClass].racing.recovery?.driver} sub3={statsData[activeStatsClass].racing.recovery?.car} isPlayer={statsData[activeStatsClass].racing.recovery?.driver?.toUpperCase().includes('JOLY')} />
                    
                    <StatBlock label="Most Overtakes" value={statsData[activeStatsClass].racing.overtakes?.val || '--'} sub1="overtakes" sub2={statsData[activeStatsClass].racing.overtakes?.driver || '--'} sub3={statsData[activeStatsClass].racing.overtakes?.car} isPlayer={statsData[activeStatsClass].racing.overtakes?.driver?.toUpperCase().includes('JOLY')} />
                    <StatBlock label="Most Laps Led" value={statsData[activeStatsClass].racing.lapsLed?.val || '--'} sub1="laps led" sub2={statsData[activeStatsClass].racing.lapsLed?.driver || '--'} sub3={statsData[activeStatsClass].racing.lapsLed?.car} isPlayer={statsData[activeStatsClass].racing.lapsLed?.driver?.toUpperCase().includes('JOLY')} />
                    <StatBlock label="Most Track Limit Violations" value={statsData[activeStatsClass].racing.trackLimits?.val || '--'} sub1="violations" sub2={statsData[activeStatsClass].racing.trackLimits?.driver || '--'} sub3={statsData[activeStatsClass].racing.trackLimits?.car} isPlayer={statsData[activeStatsClass].racing.trackLimits?.driver?.toUpperCase().includes('JOLY')} />
                  </div>
                </div>

                <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-white mb-1">Strategy</h3>
                  <p className="text-xs text-gray-500 mb-6">Pits, crew changes, and car usage</p>
                  <div className="grid grid-cols-3 gap-6">
                    <StatBlock label="Most Pit Stops" value={statsData[activeStatsClass].strategy.pitstops?.val} sub1="pit stops" sub2={statsData[activeStatsClass].strategy.pitstops?.driver} sub3={statsData[activeStatsClass].strategy.pitstops?.car} isPlayer={statsData[activeStatsClass].strategy.pitstops?.driver?.toUpperCase().includes('JOLY')} />
                    <StatBlock label="Car Most Used" value={statsData[activeStatsClass].strategy.carUsed?.val} sub1={statsData[activeStatsClass].strategy.carUsed?.sub} />
                    <StatBlock label="Fuel Saver" value={statsData[activeStatsClass].strategy.fuelSaver?.val} sub1="Lowest average consumption" sub2={statsData[activeStatsClass].strategy.fuelSaver?.driver} sub3={statsData[activeStatsClass].strategy.fuelSaver?.car} isPlayer={statsData[activeStatsClass].strategy.fuelSaver?.driver?.toUpperCase().includes('JOLY')} />
                    <StatBlock label="Tyre Saver" value={statsData[activeStatsClass].strategy.tyreSaver?.val} sub1="Lowest average tyre wear" sub2={statsData[activeStatsClass].strategy.tyreSaver?.driver} sub3={statsData[activeStatsClass].strategy.tyreSaver?.car} isPlayer={statsData[activeStatsClass].strategy.tyreSaver?.driver?.toUpperCase().includes('JOLY')} />
                  </div>
                </div>

                {/* 4. INCIDENTS ZONE (Avec le Tooltip Dynamique) */}
                <div className="flex flex-col gap-6">
                  <h2 className="text-xl font-black text-white mt-4">Incidents</h2>
                  <p className="text-sm text-gray-400 mb-2 -mt-4">Incident stats are split by car class — solo offs are under Clumsiness.</p>
                  
                  {/* Top Bar Incidents */}
                  <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg grid grid-cols-3">
                    <StatBlock label="Total Contacts" value={statsData[activeStatsClass].incidents.total} />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-1">Top Rivalry</span>
                      <span className="text-xl font-black text-white">{statsData[activeStatsClass].incidents.topRivalry?.val || '0'} <span className="text-xs font-bold text-gray-400 ml-1">contacts</span></span>
                      {statsData[activeStatsClass].incidents.topRivalry?.val && (
                         <div className="mt-2 flex flex-col gap-1">
                           <span className="text-[10px] font-semibold flex items-center gap-2">
                             <span className={statsData[activeStatsClass].incidents.topRivalry.d1.toUpperCase().includes('JOLY') ? 'text-[#ef4444]' : 'text-gray-300'}>{statsData[activeStatsClass].incidents.topRivalry.d1}</span>
                             <span className="text-gray-600">vs</span>
                             <span className={statsData[activeStatsClass].incidents.topRivalry.d2.toUpperCase().includes('JOLY') ? 'text-[#ef4444]' : 'text-gray-300'}>{statsData[activeStatsClass].incidents.topRivalry.d2}</span>
                           </span>
                         </div>
                      )}
                    </div>
                    <StatBlock label="Biggest Crash" value={statsData[activeStatsClass].incidents.biggestCrash?.val ? `${statsData[activeStatsClass].incidents.biggestCrash.val}` : '--'} sub1={statsData[activeStatsClass].incidents.biggestCrash?.lap ? `Lap ${statsData[activeStatsClass].incidents.biggestCrash.lap}` : ''} sub2={statsData[activeStatsClass].incidents.biggestCrash?.driver} sub3={statsData[activeStatsClass].incidents.biggestCrash?.car} isPlayer={statsData[activeStatsClass].incidents.biggestCrash?.driver?.toUpperCase().includes('JOLY')} />
                  </div>

                  {/* Rivalries & Clumsiness */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg h-[400px] flex flex-col">
                      <h3 className="text-sm font-bold text-white mb-1">Top Rivalries</h3>
                      <p className="text-[10px] text-gray-500 mb-4 uppercase tracking-widest">Who Hit Whom</p>
                      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3">
                        {statsData[activeStatsClass].incidents.rivalries.map((riv: any, i: number) => {
                          const isD1 = riv.d1.toUpperCase().includes('JOLY');
                          const isD2 = riv.d2.toUpperCase().includes('JOLY');
                          return (
                            <div key={i} className="flex justify-between items-center border-b border-gray-800/30 pb-3 mt-3">
                               <div className="flex flex-col gap-1 w-[80%]">
                                 <div className="flex items-center gap-2 text-xs font-bold">
                                   <span className="text-gray-600 w-4">#{i+1}</span>
                                   <div className="flex flex-col">
                                      <span className={isD1 ? 'text-[#ef4444]' : 'text-gray-300'}>{riv.d1} {isD1 && <span className="text-[8px] bg-red-900/30 text-red-500 px-1 rounded ml-1">YOU</span>}</span>
                                   </div>
                                   <span className="text-gray-600 text-[10px] mx-2">vs</span>
                                   <div className="flex flex-col">
                                      <span className={isD2 ? 'text-[#ef4444]' : 'text-gray-300'}>{riv.d2} {isD2 && <span className="text-[8px] bg-red-900/30 text-red-500 px-1 rounded ml-1">YOU</span>}</span>
                                   </div>
                                 </div>
                               </div>
                               <span className="text-gray-400 text-xs font-bold text-right">{riv.count} contacts</span>
                            </div>
                          )
                        })}
                        {statsData[activeStatsClass].incidents.rivalries.length === 0 && <span className="text-gray-500 text-xs">No rivalries recorded.</span>}
                      </div>
                    </div>
                    
                    <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg h-[400px] flex flex-col">
                      <h3 className="text-sm font-bold text-white mb-1">Clumsiness Meter</h3>
                      <p className="text-[10px] text-gray-500 mb-4 uppercase tracking-widest">Solo offs and object hits</p>
                      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3">
                        {statsData[activeStatsClass].incidents.clumsiness.map((clum: any, i: number) => {
                          const isMe = clum.driver.toUpperCase().includes('JOLY');
                          return (
                            <div key={i} className="flex justify-between items-center border-b border-gray-800/30 pb-3 mt-3">
                              <div className="flex gap-3 text-xs font-bold">
                                <span className="text-gray-600 w-4 mt-0.5">#{i+1}</span>
                                <div className="flex flex-col">
                                  <span className={isMe ? 'text-[#ef4444]' : 'text-gray-300'}>{clum.driver} {isMe && <span className="text-[8px] bg-red-900/30 text-red-500 px-1 rounded ml-1">YOU</span>}</span>
                                  <span className="text-gray-500 text-[10px] font-normal mt-0.5">Hit: {clum.objects}</span>
                                </div>
                              </div>
                              <span className="text-gray-400 text-xs font-bold">{clum.count} solo incidents</span>
                            </div>
                          )
                        })}
                        {statsData[activeStatsClass].incidents.clumsiness.length === 0 && <span className="text-gray-500 text-xs">Clean race. No solo crashes.</span>}
                      </div>
                    </div>
                  </div>

                  {/* Severity Scores */}
                  <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg">
                    <h3 className="text-sm font-bold text-white mb-1">Severity Scores</h3>
                    <p className="text-[10px] text-gray-500 mb-4 uppercase tracking-widest">Impact Force Analysis</p>
                    <div className="grid grid-cols-5 gap-6">
                      {statsData[activeStatsClass].incidents.severity.slice(0, 10).map((sev: any, i: number) => {
                         const isMe = sev.driver.toUpperCase().includes('JOLY');
                         return (
                           <div key={i} className="flex flex-col gap-1 border-l-2 pl-3 py-1 border-gray-700">
                             <div className="flex items-center gap-2 mb-1">
                               <span className="text-gray-600 text-xs font-bold">#{i+1}</span>
                               <span className={`text-xs font-bold truncate ${isMe ? 'text-[#ef4444]' : 'text-white'}`}>{sev.driver}</span>
                             </div>
                             {sev.heavy > 0 && <span className="text-[#ef4444] text-[10px] font-bold">{sev.heavy} Heavy</span>}
                             <span className="text-gray-400 text-[10px]">Max Impact: <span className="text-gray-200">{sev.max.toFixed(1)}</span></span>
                             <span className="text-gray-400 text-[10px]">Avg Impact: <span className="text-gray-200">{sev.avg.toFixed(1)}</span></span>
                             <span className="text-gray-400 text-[10px]">Total Impact: <span className="text-gray-200">{sev.total.toFixed(1)}</span></span>
                             <span className="text-gray-400 text-[10px]">Scrapes: <span className="text-gray-200">{sev.scrapes}</span></span>
                           </div>
                         )
                      })}
                    </div>
                  </div>

                  {/* Incident Timeline Chart AVEC LE NOUVEAU TOOLTIP */}
                  <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg">
                    <h3 className="text-sm font-bold text-white mb-1">Incident Timeline</h3>
                    <p className="text-[10px] text-gray-500 mb-4 uppercase tracking-widest">Chaos Over Time (Combined impact force per 60s)</p>
                    <div className="w-full h-40 mt-6">
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={statsData[activeStatsClass].incidents.timeline} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                           <defs>
                             <linearGradient id="colorImpact" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                               <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                             </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                           <XAxis dataKey="time" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} />
                           <YAxis stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} />
                           {/* UTILISATION DU NOUVEAU TOOLTIP */}
                           <RechartsTooltip content={<AreaChartTooltip />} cursor={{ stroke: '#4a4d65', strokeWidth: 1, strokeDasharray: '3 3' }} />
                           <Area type="monotone" dataKey="impact" stroke="#ef4444" fillOpacity={1} fill="url(#colorImpact)" isAnimationActive={false} />
                         </AreaChart>
                       </ResponsiveContainer>
                    </div>
                  </div>

                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ============================================================== */}
        {/* VUE 5 : RACE DIRECTOR (NOUVEAU)                                  */}
        {/* ============================================================== */}
        {activeTab === 'Race Director' && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            {!directorData ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <RefreshCw size={32} className="text-[#3a86ff] animate-spin mb-4" />
                <p className="text-sm font-bold tracking-widest uppercase">Initializing Race Director...</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h2 className="text-xl font-black text-white">Race Director</h2>
                    <p className="text-sm text-gray-400 mt-1">
                      {directorData.summary.incidents} incidents, {directorData.summary.trackLimits} track limits, {directorData.summary.sectorBests} sector bests, {directorData.summary.penalties} penalties, {directorData.summary.damage} damage reports
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-white text-xs font-bold cursor-pointer bg-[#121318] px-3 py-1.5 rounded-lg border border-gray-800">
                      <input type="checkbox" checked={directorOnlyMe} onChange={(e) => setDirectorOnlyMe(e.target.checked)} className="w-4 h-4 rounded bg-gray-900 border-gray-700 text-[#3a86ff] focus:ring-[#3a86ff]" />
                      Only Matheo Joly
                    </label>
                    <select 
                      value={directorFilter} 
                      onChange={(e) => setDirectorFilter(e.target.value)} 
                      className="bg-[#121318] border border-gray-800 text-xs font-bold text-gray-200 px-3 py-1.5 rounded-md outline-none cursor-pointer"
                    >
                      {['All', 'Incident', 'TrackLimit', 'SectorBest', 'Damage', 'Penalty'].map(f => (
                        <option key={f} value={f} className="bg-[#121318]">{f === 'TrackLimit' ? 'Track Limits' : f === 'SectorBest' ? 'Sector Bests' : f}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-[#121318] rounded-xl border border-gray-800/50 shadow-lg overflow-hidden flex flex-col">
                   <div className="flex-1 overflow-y-auto max-h-[600px] p-4 flex flex-col scrollbar-hide">
                      {directorEvents && directorEvents.length > 0 ? directorEvents.map((ev: any, idx: number) => {
                         const isMe = ev.driver.toUpperCase().includes('JOLY');
                         return (
                           <div key={idx} className="flex items-center gap-4 py-3 border-b border-gray-800/30 hover:bg-[#1a1b26] px-4 -mx-4 transition-colors group last:border-0">
                             <span className="text-gray-500 font-mono text-xs w-12 shrink-0">{ev.time}</span>
                             <div className="w-6 flex justify-center shrink-0">
                                {ev.type === 'Incident' && <AlertTriangle size={14} className="text-[#ef4444]"/>}
                                {ev.type === 'Damage' && <Wrench size={14} className="text-orange-500"/>}
                                {ev.type === 'TrackLimit' && <Flag size={14} className="text-[#10b981]"/>}
                                {ev.type === 'SectorBest' && <Zap size={14} className="text-[#8338ec]"/>}
                                {ev.type === 'Penalty' && <Shield size={14} className="text-[#ef4444]"/>}
                             </div>
                             <div className="flex-1 text-sm font-semibold truncate">
                               <span className="text-gray-300">
                                 {ev.text.split(ev.driver).map((part: string, i: number, arr: any[]) => (
                                   <React.Fragment key={i}>
                                     {part}
                                     {i < arr.length - 1 && <span className={isMe ? 'text-[#ef4444]' : 'text-white'}>{ev.driver}</span>}
                                   </React.Fragment>
                                 ))}
                               </span>
                             </div>
                             <div className="text-right shrink-0">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-gray-800/50 border border-gray-700 ${ev.type === 'TrackLimit' ? 'text-[#10b981]' : ev.type === 'SectorBest' ? 'text-[#8338ec]' : ev.type === 'Damage' ? 'text-orange-500' : 'text-gray-400'}`}>
                                  {ev.badge || ev.type}
                                </span>
                             </div>
                           </div>
                         )
                      }) : (
                        <div className="py-10 text-center text-gray-500 text-xs italic">No events match the current filter.</div>
                      )}
                   </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VUE 6 : YOUR CHARTS                                              */}
        {/* ============================================================== */}
        {activeTab === 'Your Charts' && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className="mb-2">
              <h2 className="text-xl font-black text-white">Your Charts</h2>
              <p className="text-sm text-gray-400">Personal telemetry and performance analysis over the session</p>
            </div>

            {!yourChartsData ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <RefreshCw size={32} className="text-[#3a86ff] animate-spin mb-4" />
                <p className="text-sm font-bold tracking-widest uppercase">Analyzing Personal Telemetry...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6 border-b border-gray-800/50 pb-10 mb-10 last:border-0">
                
                {/* 1. Class Position Change */}
                <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-white mb-1">Class Position Change</h3>
                  <p className="text-xs text-gray-500 mb-6">Position within your class throughout the session</p>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLine data={yourChartsData.data} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="lap" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis reversed domain={[1, 'dataMax + 1']} stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} allowDecimals={false} />
                        <RechartsTooltip content={<YourChartTooltip />} cursor={{ stroke: '#4a4d65', strokeWidth: 1, strokeDasharray: '3 3' }} />
                        {yourChartsData.data.filter((d:any) => d.pit).map((d:any) => (
                          <ReferenceLine key={`pit-${d.lap}`} x={d.lap} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'PIT', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />
                        ))}
                        <Line type="stepAfter" dataKey="pos" name="Class Position" stroke="#3a86ff" strokeWidth={3} dot={false} isAnimationActive={false} />
                      </RechartsLine>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Gap to Class Leader */}
                <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-white mb-1">Gap to {yourChartsData.leader}</h3>
                  <p className="text-xs text-gray-500 mb-6">Time gap to the class leader over time</p>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={yourChartsData.data} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gapColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="lap" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 'auto']} stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(v)=>`+${v.toFixed(1)}s`} />
                        <RechartsTooltip content={<YourChartTooltip />} cursor={{ stroke: '#4a4d65', strokeWidth: 1, strokeDasharray: '3 3' }} />
                        {yourChartsData.data.filter((d:any) => d.pit).map((d:any) => (
                          <ReferenceLine key={`pit-${d.lap}`} x={d.lap} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'PIT', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />
                        ))}
                        <Area type="monotone" dataKey="gapToLeader" name="Gap to Leader" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#gapColor)" isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. Lap Time Progression */}
                <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Lap Time Progression</h3>
                      <p className="text-xs text-gray-500">Individual lap times throughout the race</p>
                    </div>
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLine data={yourChartsData.data} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="lap" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis domain={['auto', 'auto']} stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(v) => { const m=Math.floor(v/60); const s=(v%60).toFixed(0); return `${m}:${s.padStart(2,'0')}`; }} />
                        <RechartsTooltip content={<YourChartTooltip isTime={true} />} cursor={{ stroke: '#4a4d65', strokeWidth: 1, strokeDasharray: '3 3' }} />
                        {yourChartsData.data.filter((d:any) => d.pit).map((d:any) => (
                          <ReferenceLine key={`pit-${d.lap}`} x={d.lap} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'PIT', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />
                        ))}
                        <Line type="monotone" dataKey="lapTime" name="Lap Time" stroke="#ef4444" strokeWidth={2} dot={{r: 4, fill: '#ef4444', strokeWidth: 0}} activeDot={{r: 6}} isAnimationActive={false} />
                      </RechartsLine>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 4. Virtual Energy Usage */}
                <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-white mb-1">Virtual Energy Usage</h3>
                  <p className="text-xs text-gray-500 mb-6">Usage across the session (%)</p>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={yourChartsData.data} margin={{ top: 20, right: 30, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="veColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="lap" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} />
                        <RechartsTooltip content={<YourChartTooltip suffix="%" />} cursor={{ stroke: '#4a4d65', strokeWidth: 1, strokeDasharray: '3 3' }} />
                        {yourChartsData.data.filter((d:any) => d.pit).map((d:any) => (
                          <ReferenceLine key={`pit-${d.lap}`} x={d.lap} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'PIT', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />
                        ))}
                        <Area type="monotone" dataKey="veRemaining" name="Energy Remaining" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#veColor)" isAnimationActive={false} />
                        <Line type="monotone" dataKey="veUsed" name="Energy Used" stroke="#10b981" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 5. Top Speed by Lap */}
                <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-white mb-1">Top Speed by Lap</h3>
                  <p className="text-xs text-gray-500 mb-6">Maximum speed achieved each lap (km/h)</p>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={yourChartsData.data} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="tsColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="lap" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis domain={['dataMin - 10', 'dataMax + 10']} stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} />
                        <RechartsTooltip content={<YourChartTooltip />} cursor={{ stroke: '#4a4d65', strokeWidth: 1, strokeDasharray: '3 3' }} />
                        {yourChartsData.data.filter((d:any) => d.pit).map((d:any) => (
                          <ReferenceLine key={`pit-${d.lap}`} x={d.lap} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'PIT', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />
                        ))}
                        <Area type="monotone" dataKey="topSpeed" name="Top Speed" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#tsColor)" isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 6. Sector Times by Lap */}
                <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-white mb-1">Sector Times by Lap</h3>
                  <p className="text-xs text-gray-500 mb-6">Sector times throughout the race</p>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLine data={yourChartsData.data} margin={{ top: 20, right: 30, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="lap" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis domain={['auto', 'auto']} stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(v) => { const m=Math.floor(v/60); const s=(v%60).toFixed(0); return `${m}:${s.padStart(2,'0')}`; }} />
                        <RechartsTooltip content={<YourChartTooltip isTime={true} />} cursor={{ stroke: '#4a4d65', strokeWidth: 1, strokeDasharray: '3 3' }} />
                        {yourChartsData.data.filter((d:any) => d.pit).map((d:any) => (
                          <ReferenceLine key={`pit-${d.lap}`} x={d.lap} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'PIT', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />
                        ))}
                        <Line type="monotone" dataKey="s1" name="Sector 1" stroke="#3a86ff" strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="s2" name="Sector 2" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="s3" name="Sector 3" stroke="#e9c46a" strokeWidth={2} dot={false} isAnimationActive={false} />
                      </RechartsLine>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 7. Fuel Management */}
                <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-white mb-1">Fuel Management</h3>
                  <p className="text-xs text-gray-500 mb-6">Fuel remaining throughout the race (%)</p>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLine data={yourChartsData.data} margin={{ top: 20, right: 30, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="lap" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} />
                        <RechartsTooltip content={<YourChartTooltip suffix="%" />} cursor={{ stroke: '#4a4d65', strokeWidth: 1, strokeDasharray: '3 3' }} />
                        {yourChartsData.data.filter((d:any) => d.pit).map((d:any) => (
                          <ReferenceLine key={`pit-${d.lap}`} x={d.lap} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'PIT', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />
                        ))}
                        <Line type="monotone" dataKey="fuelRemaining" name="Fuel Remaining" stroke="#3a86ff" strokeWidth={2} dot={{r:4, fill:'#3a86ff', strokeWidth:0}} isAnimationActive={false} />
                        <Line type="monotone" dataKey="fuelUsed" name="Fuel Used" stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
                      </RechartsLine>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 8. Tyre Wear by Lap */}
                <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-white mb-1">Tyre Wear by Lap</h3>
                  <p className="text-xs text-gray-500 mb-6">Wear reported at each lap (%)</p>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLine data={yourChartsData.data} margin={{ top: 20, right: 30, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="lap" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis domain={['dataMin - 2', 100]} stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} />
                        <RechartsTooltip content={<YourChartTooltip suffix="%" />} cursor={{ stroke: '#4a4d65', strokeWidth: 1, strokeDasharray: '3 3' }} />
                        {yourChartsData.data.filter((d:any) => d.pit).map((d:any) => (
                          <ReferenceLine key={`pit-${d.lap}`} x={d.lap} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'PIT', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />
                        ))}
                        <Line type="monotone" dataKey="wearFL" name="Front Left" stroke="#3a86ff" strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="wearFR" name="Front Right" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="wearRL" name="Rear Left" stroke="#e9c46a" strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="wearRR" name="Rear Right" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
                      </RechartsLine>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VUE 7 : LAP DATA (TABLEAU DÉTAILLÉ AVEC PNEUS DYNAMIQUES)      */}
        {/* ============================================================== */}
        {activeTab === 'Lap Data' && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className="mb-2">
              <h2 className="text-xl font-black text-white">Lap-by-Lap Data</h2>
              <p className="text-sm text-gray-400">Detailed breakdown of all {yourChartsData?.data?.length || 0} laps</p>
            </div>

            {!yourChartsData ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <RefreshCw size={32} className="text-[#3a86ff] animate-spin mb-4" />
                <p className="text-sm font-bold tracking-widest uppercase">Loading Telemetry Table...</p>
              </div>
            ) : (
              <div className="bg-[#121318] rounded-xl border border-gray-800/50 shadow-lg overflow-x-auto scrollbar-hide">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1200px]">
                  <thead>
                    <tr className="bg-[#0f1015] border-b border-gray-800/50 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                      <th className="p-3 pl-6 w-12">LAP</th>
                      <th className="p-3 w-12 text-center">POS</th>
                      <th className="p-3 w-20 text-center">LAP TIME</th>
                      <th className="p-3 w-16 text-center">S1</th>
                      <th className="p-3 w-16 text-center">S2</th>
                      <th className="p-3 w-16 text-center">S3</th>
                      <th className="p-3 w-24 text-center">TOP SPEED</th>
                      <th className="p-3 w-28 text-center">FUEL USED</th>
                      <th className="p-3 w-28 text-center">FUEL REM.</th>
                      <th className="p-3 w-28 text-center">VE REM.</th>
                      <th className="p-3 w-20 text-center">VE USED</th>
                      <th className="p-3 w-24 text-center">TYRE WEAR FL</th>
                      <th className="p-3 w-24 text-center">TYRE WEAR FR</th>
                      <th className="p-3 w-24 text-center">TYRE WEAR RL</th>
                      <th className="p-3 w-24 text-center">TYRE WEAR RR</th>
                      <th className="p-3 w-20 text-center border-l border-gray-800/30">FRONT AXLE</th>
                      <th className="p-3 w-20 text-center border-r border-gray-800/30">REAR AXLE</th>
                      <th className="p-3 w-10 text-center">FL</th>
                      <th className="p-3 w-10 text-center">FR</th>
                      <th className="p-3 w-10 text-center">RL</th>
                      <th className="p-3 pr-6 w-10 text-center">RR</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-semibold text-gray-300">
                    {yourChartsData.data.map((row: any, i: number) => {
                      const formatT = (val: number) => {
                        if (val <= 0 || !val) return "--.---";
                        const m = Math.floor(val / 60);
                        const s = (val % 60).toFixed(3);
                        return m > 0 ? `${m}:${s.padStart(6, '0')}` : `0:${s.padStart(6, '0')}`;
                      };

                      const bestLap = Math.min(...yourChartsData.data.filter((d:any)=>d.lapTime>0).map((d:any) => d.lapTime));
                      const bestS1 = Math.min(...yourChartsData.data.filter((d:any)=>d.s1>0).map((d:any) => d.s1));
                      const bestS2 = Math.min(...yourChartsData.data.filter((d:any)=>d.s2>0).map((d:any) => d.s2));
                      const bestS3 = Math.min(...yourChartsData.data.filter((d:any)=>d.s3>0).map((d:any) => d.s3));

                      const fuelRemLitres = (row.fuelRemaining * 1.1).toFixed(1);
                      const fuelUsedLitres = (row.fuelUsed * 1.1).toFixed(1);

                      // --- FONCTION DE STYLE DE PNEUS DYNAMIQUE ---
                      const getTireStyle = (tireName: string) => {
                        const t = tireName ? tireName.toLowerCase() : "medium";
                        let color = "text-[#e9c46a] border-[#e9c46a]"; // Medium (Jaune) par défaut
                        let letter = "M";
                        
                        if (t.includes('soft')) { color = "text-[#ef4444] border-[#ef4444]"; letter = "S"; }
                        else if (t.includes('hard')) { color = "text-white border-white"; letter = "H"; }
                        else if (t.includes('wet') || t.includes('rain')) { color = "text-[#3a86ff] border-[#3a86ff]"; letter = "W"; }
                        
                        return { color, letter };
                      };

                      const frontStyle = getTireStyle(row.frontTire);
                      const rearStyle = getTireStyle(row.rearTire);

                      return (
                        <tr key={i} className="border-b border-gray-800/30 hover:bg-[#1a1b26] transition-colors last:border-0">
                          <td className="p-3 pl-6 font-bold flex items-center gap-2">
                            {row.lap}
                            {row.pit && <span className="text-[8px] bg-orange-500/20 text-orange-500 border border-orange-500/50 px-1 py-0.5 rounded uppercase tracking-wider font-black">PIT</span>}
                          </td>
                          <td className="p-3 text-center">{row.pos}</td>
                          <td className={`p-3 text-center font-mono ${row.lapTime === bestLap ? 'text-[#8338ec]' : 'text-gray-200'}`}>
                            {formatT(row.lapTime)}
                          </td>
                          <td className={`p-3 text-center font-mono ${row.s1 === bestS1 ? 'text-[#8338ec]' : 'text-gray-400'}`}>{formatT(row.s1)}</td>
                          <td className={`p-3 text-center font-mono ${row.s2 === bestS2 ? 'text-[#8338ec]' : 'text-gray-400'}`}>{formatT(row.s2)}</td>
                          <td className={`p-3 text-center font-mono ${row.s3 === bestS3 ? 'text-[#8338ec]' : 'text-gray-400'}`}>{formatT(row.s3)}</td>
                          
                          <td className="p-3 text-center font-bold text-gray-200">{row.topSpeed.toFixed(1)} km/h</td>
                          
                          <td className="p-3 text-center text-gray-400">{row.fuelUsed.toFixed(2)}% <span className="text-gray-600 text-[10px]">({fuelUsedLitres}L)</span></td>
                          <td className="p-3 text-center text-gray-200">{row.fuelRemaining.toFixed(2)}% <span className="text-gray-500 text-[10px]">({fuelRemLitres}L)</span></td>
                          
                          <td className="p-3 text-center text-gray-200">{row.veRemaining.toFixed(2)}%</td>
                          <td className="p-3 text-center text-gray-400">{row.veUsed.toFixed(2)}%</td>
                          
                          <td className="p-3 text-center text-gray-400">{row.wearFL.toFixed(2)}%</td>
                          <td className="p-3 text-center text-gray-400">{row.wearFR.toFixed(2)}%</td>
                          <td className="p-3 text-center text-gray-400">{row.wearRL.toFixed(2)}%</td>
                          <td className="p-3 text-center text-gray-400">{row.wearRR.toFixed(2)}%</td>

                          {/* AFFICHAGE DYNAMIQUE DES PNEUS */}
                          <td className="p-3 text-center border-l border-gray-800/30">
                             <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[8px] font-black mx-auto ${frontStyle.color}`}>{frontStyle.letter}</div>
                          </td>
                          <td className="p-3 text-center border-r border-gray-800/30">
                             <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[8px] font-black mx-auto ${rearStyle.color}`}>{rearStyle.letter}</div>
                          </td>
                          
                          <td className="p-3 text-center"><div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[6px] font-black mx-auto ${frontStyle.color}`}>{frontStyle.letter}</div></td>
                          <td className="p-3 text-center"><div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[6px] font-black mx-auto ${frontStyle.color}`}>{frontStyle.letter}</div></td>
                          <td className="p-3 text-center"><div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[6px] font-black mx-auto ${rearStyle.color}`}>{rearStyle.letter}</div></td>
                          <td className="p-3 pr-6 text-center"><div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[6px] font-black mx-auto ${rearStyle.color}`}>{rearStyle.letter}</div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VUE 8 : CHAT                                                     */}
        {/* ============================================================== */}
        {activeTab === 'Chat' && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className="mb-2">
              <h2 className="text-xl font-black text-white">Session Chat</h2>
              <p className="text-sm text-gray-400">{chatData ? chatData.length : 0} messages during the session</p>
            </div>

            {!chatData ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <RefreshCw size={32} className="text-[#3a86ff] animate-spin mb-4" />
                <p className="text-sm font-bold tracking-widest uppercase">Loading Chat History...</p>
              </div>
            ) : chatData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <MessageCircle size={48} className="text-gray-500 mb-4" />
                <p className="text-sm font-bold tracking-widest uppercase text-gray-400">No messages recorded.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6 pt-4 pl-4">
                 {chatData.map((msg: any, i: number) => {
                    // On vérifie si c'est toi pour colorer ton nom
                    const isMe = msg.driver.toUpperCase().includes('JOLY');
                    return (
                      <div key={i} className="flex gap-4 items-start">
                        <span className="text-gray-500 font-mono text-[11px] font-bold mt-0.5">{msg.time}</span>
                        <div className="flex items-start gap-2">
                          {/* Détecteur de nationalité basique (optionnel, pour faire comme ta maquette) */}
                          {msg.driver.includes('Yorick') && <CountryFlag code="SE" />}
                          {msg.driver.includes('Robert') && <CountryFlag code="PL" />}
                          {isMe && <CountryFlag code="FR" />}
                          
                          <div className="flex flex-col">
                             <span className={`text-[13px] font-bold ${isMe ? 'text-[#ef4444]' : 'text-gray-200'}`}>
                               {msg.driver} <span className="text-gray-500 font-normal">: {msg.message}</span>
                             </span>
                          </div>
                        </div>
                      </div>
                    )
                 })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VUE 9 : NOTES PERSONNELLES                                       */}
        {/* ============================================================== */}
        {activeTab === 'Notes' && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-xl font-black text-white">Personal Notes</h2>
                <p className="text-sm text-gray-400">Add thoughts or comments about your session</p>
              </div>
              
              {!isEditingNotes ? (
                <button onClick={() => setIsEditingNotes(true)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-bold bg-[#121318] px-3 py-1.5 rounded-lg border border-gray-800">
                  <Edit3 size={14} /> Edit Notes
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => { setIsEditingNotes(false); setTempNotes(notesData); }} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-bold">
                    <CornerUpLeft size={14} /> Cancel
                  </button>
                  <button onClick={handleSaveNotes} className="flex items-center gap-2 text-[#e9c46a] hover:text-yellow-400 transition-colors text-xs font-bold bg-[#e9c46a]/10 px-4 py-1.5 rounded-lg border border-[#e9c46a]/30">
                    <Save size={14} /> Save
                  </button>
                </div>
              )}
            </div>

            {isEditingNotes ? (
              <textarea 
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                placeholder="How did the race feel? Any setup notes? Strategy thoughts?"
                className="w-full min-h-[300px] bg-[#121318] border border-[#e9c46a]/50 rounded-xl p-6 text-sm text-gray-200 resize-none outline-none focus:ring-1 focus:ring-[#e9c46a] font-medium"
                autoFocus
              />
            ) : (
              <div className="w-full min-h-[300px] bg-[#121318] border border-gray-800/50 rounded-xl p-6 shadow-lg">
                 {notesData ? (
                   <div className="text-sm text-gray-300 font-medium whitespace-pre-wrap leading-relaxed">
                     {notesData}
                   </div>
                 ) : (
                   <div className="flex flex-col items-center justify-center h-full opacity-50 pt-20">
                     <FileText size={32} className="text-gray-600 mb-4" />
                     <p className="text-sm font-bold tracking-widest text-gray-400 italic mb-2">No notes added yet.</p>
                     <button onClick={() => setIsEditingNotes(true)} className="text-[#e9c46a] text-[10px] font-bold tracking-widest uppercase hover:underline">Click here to add notes</button>
                   </div>
                 )}
              </div>
            )}
          </div>
        )}

        {/* FALLBACK POUR LES AUTRES ONGLETS */}
        {activeTab !== 'Overview' && 
         activeTab !== 'Standings' && 
         activeTab !== 'Race Charts' && 
         activeTab !== 'Race Stats' && 
         activeTab !== 'Race Director' && 
         activeTab !== 'Your Charts' && 
         activeTab !== 'Lap Data' && 
         activeTab !== 'Chat' && 
         activeTab !== 'Notes' && ( 
           <div className="flex flex-col items-center justify-center h-full opacity-50 py-20">
             <BarChart2 size={64} className="text-[#3a86ff] mb-4" />
             <h2 className="text-xl font-black text-white mb-2 uppercase tracking-widest">{activeTab}</h2>
             <p className="text-sm text-gray-400">Data extraction module in development. Telemetry parsing incoming.</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default SessionDetailView;