import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, Wifi, WifiOff, Flag, Timer, PlayCircle, 
  ChevronDown, BarChart2, RefreshCw, MapPin, CarFront, 
  ChevronRight, Info, Settings2, Trophy, Star, Route, 
  Activity, Gauge, Droplet, Zap, ArrowUpRight, Filter
} from 'lucide-react';

import { 
  ResponsiveContainer, LineChart as RechartsLine, Line, YAxis, XAxis, 
  Tooltip as RechartsTooltip, CartesianGrid, 
  BarChart, Bar, Cell, AreaChart, Area, 
  ScatterChart, Scatter, ZAxis, ComposedChart, ReferenceLine
} from 'recharts';

import { 
  TRACK_NATIONS, LMU_CARS, LMU_ALL_TRACKS, BRAND_LOGOS, 
  getTrackDetails, getTrackCountryCode, getClassColor, 
  isTrackMatch, isCarMatch, CountryFlag 
} from '../lmu_constants';

// --- PALETTE DE COULEURS POUR LES CONCURRENTS (Utilisée dans les graphiques) ---
const CHART_COLORS = [
  '#3a86ff', '#8338ec', '#ffbe0b', '#2a9d8f', '#f4a261', 
  '#4cc9f0', '#7209b7', '#e76f51', '#48bfe3', '#9c6644',
  '#a7c957', '#e29578', '#0077b6', '#00b4d8', '#fca311'
];

// --- SOUS-COMPOSANTS POUR DEEPER ANALYTICS (TYRE WEAR) ---
const TyreCard = ({ title, youVal, commVal }: any) => {
  const hasYou = youVal !== null && youVal !== undefined && youVal > 0;
  const hasComm = commVal !== null && commVal !== undefined && commVal > 0;
    
  let diff: number | null = null, status = '', colorClass = 'text-white', badgeClass = '';

  if (hasYou && hasComm) {
    diff = ((youVal - commVal) / commVal) * 100;
    if (diff > 0) {
      status = 'WORSE'; colorClass = 'text-[#ef4444]'; badgeClass = 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]';
    } else {
      status = 'BETTER'; colorClass = 'text-[#10b981]'; badgeClass = 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]';
    }
  }

  const youPos = hasYou ? Math.min(100, Math.max(0, (youVal / 3) * 100)) : 0;
  const commPos = hasComm ? Math.min(100, Math.max(0, (commVal / 3) * 100)) : 50;

  return (
    <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-5 shadow-lg flex flex-col h-[170px]">
      <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-4">{title}</span>
      <div className="flex justify-between items-end mb-4">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">You</span>
          <span className={`text-3xl font-black ${colorClass}`}>{hasYou ? youVal.toFixed(3) : '—'}</span>
          <span className="text-[9px] text-gray-500">% / Lap</span>
        </div>
        <div className="flex flex-col items-end text-right">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Community</span>
          <span className="text-xl font-black text-gray-300">{hasComm ? commVal.toFixed(3) : '—'}</span>
          <span className="text-[9px] text-gray-500">% / Lap</span>
        </div>
      </div>
       
      <div className="mt-auto relative w-full h-8 flex flex-col justify-center">
         <div className="h-1 w-full bg-[#1c1e2b] rounded-full relative">
            {hasComm && <div className="absolute w-2 h-2 rounded-full bg-gray-500 -top-0.5 transform -translate-x-1/2" style={{ left: `${commPos}%`}}></div>}
            {hasYou && <div className={`absolute w-3 h-3 rounded-full -top-1 transform -translate-x-1/2 shadow-[0_0_10px_currentColor] ${hasComm && diff !== null && diff > 0 ? 'bg-[#ef4444]' : (hasComm ? 'bg-[#10b981]' : 'bg-[#3a86ff]')}`} style={{ left: `${youPos}%`}}></div>}
         </div>
         {hasYou && hasComm && diff !== null && (
           <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 whitespace-nowrap">
             <span className={`px-2 py-0.5 rounded-full border text-[8px] font-bold tracking-widest uppercase ${badgeClass}`}>
               {Math.abs(diff as number).toFixed(1)}% {status}
             </span>
           </div>
         )}
      </div>
    </div>
  );
}

  // NOUVEAU COMPOSANT : Carte Statistique Générique (Conso / Vitesse)
const StatCard = ({ title, youVal, commVal, unit, lowerIsBetter = true, subLeft = '', subRight = '' }: any) => {
  const hasYou = youVal !== null && youVal !== undefined && youVal > 0;
  const hasComm = commVal !== null && commVal !== undefined && commVal > 0;
    
  let diff: number | null = null, status = '', colorClass = 'text-white', badgeClass = '';
  if (hasYou && hasComm) {
    diff = ((youVal - commVal) / commVal) * 100;
    const isBetter = lowerIsBetter ? diff <= 0 : diff > 0;
    if (!isBetter) {
      status = 'WORSE'; colorClass = 'text-[#ef4444]'; badgeClass = 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]';
    } else {
      status = 'BETTER'; colorClass = 'text-[#10b981]'; badgeClass = 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]';
    }
  }

  const youPos = hasYou ? (lowerIsBetter ? Math.min(100, Math.max(0, 50 + (diff || 0))) : Math.min(100, Math.max(0, 50 - (diff || 0)))) : 0;
  const commPos = 50;

  return (
    <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-5 shadow-lg flex flex-col h-[170px]">
      <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-4">{title}</span>
      <div className="flex justify-between items-end mb-2">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">You</span>
          <span className={`text-3xl font-black ${colorClass}`}>{hasYou ? youVal.toFixed(2) : '—'}</span>
          <span className="text-[9px] text-gray-500">{unit}</span>
          {subLeft && <span className="text-[10px] font-bold text-gray-400 mt-1">{subLeft}</span>}
        </div>
        <div className="flex flex-col items-end text-right">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Community</span>
          <span className="text-xl font-black text-gray-300">{hasComm ? commVal.toFixed(2) : '—'}</span>
          <span className="text-[9px] text-gray-500">{unit}</span>
          {subRight && <span className="text-[10px] font-bold text-gray-400 mt-1">{subRight}</span>}
        </div>
      </div>
        
      <div className="mt-auto relative w-full h-8 flex flex-col justify-center">
         <div className="h-1 w-full bg-[#1c1e2b] rounded-full relative">
            {hasComm && <div className="absolute w-2 h-2 rounded-full bg-gray-500 -top-0.5 transform -translate-x-1/2" style={{ left: `${commPos}%`}}></div>}
            {hasYou && <div className={`absolute w-3 h-3 rounded-full -top-1 transform -translate-x-1/2 shadow-[0_0_10px_currentColor] ${hasComm && diff !== null && (lowerIsBetter ? diff > 0 : diff < 0) ? 'bg-[#ef4444]' : (hasComm ? 'bg-[#10b981]' : 'bg-[#3a86ff]')}`} style={{ left: `${youPos}%`}}></div>}
         </div>
         {hasYou && hasComm && diff !== null && (
           <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 whitespace-nowrap">
             <span className={`px-2 py-0.5 rounded-full border text-[8px] font-bold tracking-widest uppercase ${badgeClass}`}>
               {Math.abs(diff as number).toFixed(1)}% {status}
             </span>
           </div>
         )}
      </div>
    </div>
  );
}

const BalanceBar = ({ title, leftLabel, rightLabel, youL, youR, commL, commR }: any) => {
  const hasYou = youL !== null && youR !== null;
  const hasComm = commL !== null && commR !== null;

  const commPos = hasComm ? commL : 50;
  const youPos = hasYou ? youL : 50;

  let diff = null, dir = '';
  if (hasYou && hasComm) {
    diff = Math.abs(youL - commL);
    dir = youL > commL ? leftLabel : rightLabel;
  }

  return (
    <div className="flex flex-col mb-8 last:mb-0">
      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-4">{title} ({leftLabel} / {rightLabel})</span>
      <div className="relative w-full h-8 flex flex-col justify-center mb-2 px-4">
         <div className="flex justify-between text-[9px] font-bold text-gray-600 mb-2 w-full absolute -top-4 left-0 px-1"><span>{leftLabel}</span><span>{rightLabel}</span></div>
         <div className="h-1 w-full bg-[#1c1e2b] rounded-full relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-700 h-3 -mt-1 transform -translate-x-1/2"></div>
            {hasComm && (
              <div className="absolute flex flex-col items-center -top-3 transform -translate-x-1/2" style={{ left: `${commPos}%` }}>
                <span className="text-[7px] font-bold text-gray-500 mb-0.5">COMM</span>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
              </div>
            )}
            {hasYou && (
              <div className="absolute flex flex-col items-center top-2 transform -translate-x-1/2" style={{ left: `${youPos}%` }}>
                <div className="w-2.5 h-2.5 rounded-full bg-[#3a86ff] shadow-[0_0_8px_#3a86ff]"></div>
                <span className="text-[7px] font-bold text-[#3a86ff] mt-0.5">YOU {hasComm ? '+ COMM' : ''}</span>
              </div>
            )}
         </div>
      </div>
      <div className="flex justify-between items-end mt-4">
         <div className="flex flex-col">
           <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">You</span>
           <span className="text-sm font-black text-white">{hasYou ? `${youL.toFixed(1)}% / ${youR.toFixed(1)}%` : '—'}</span>
           <span className="text-[8px] text-gray-500">{leftLabel} / {rightLabel}</span>
         </div>
         <div className="flex flex-col items-end">
           <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Community</span>
           <span className="text-xs font-black text-gray-300">{hasComm ? `${commL.toFixed(1)}% / ${commR.toFixed(1)}%` : '—'}</span>
         </div>
      </div>
      {hasYou && hasComm && diff !== null && (
        <div className="text-center mt-2">
          <span className="text-[8px] font-bold tracking-widest uppercase text-gray-400 border border-gray-700 bg-[#1a1b26] px-2 py-0.5 rounded-full">
            {diff.toFixed(1)}% TOWARD {dir} VS COMMUNITY
          </span>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// COMPOSANT PRINCIPAL ANALYTICS VIEW (Propre, sans espaces invisibles)
// =========================================================================
const AnalyticsView = ({ setActiveMenu, setSelectedHistorySession }: any) => {
  // Navigation principale
  const [activeTab, setActiveTab] = useState<'Overall' | 'Deeper' | 'LapTimes' | 'Tracks'>('Overall');
  
  // État pour le graphique déroulant "Lap Times by Track"
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  
  // Filtres globaux
  const [activeMode, setActiveMode] = useState<'All Modes' | 'Online' | 'Offline'>('Online');
  const [activeType, setActiveType] = useState<'All Types' | 'Races' | 'Qualifying' | 'Practice'>('Races');
  const [category, setCategory] = useState('All Categories');
  const [trackNationFilter, setTrackNationFilter] = useState('All Nations');
  const [isTrackDropdownOpen, setIsTrackDropdownOpen] = useState(false);
  const [isCarDropdownOpen, setIsCarDropdownOpen] = useState(false);

  // Filtres spécifiques à "Deeper Analytics"
  const [selectedTrack, setSelectedTrack] = useState('Select track');
  const [selectedCar, setSelectedCar] = useState('Select car');
  const [activeMetric, setActiveMetric] = useState<'Tyre Wear' | 'Consumption' | 'Top Speed'>('Tyre Wear');
  const [selectedCompound, setSelectedCompound] = useState('Medium');
  const [isNationDropdownOpen, setIsNationDropdownOpen] = useState(false);

  // Filtrage dynamique des voitures selon la catégorie choisie
  const availableCars = Object.keys(LMU_CARS).filter(carKey => {
    if (category === 'All Categories') return true;
    return LMU_CARS[carKey].category === category;
  });

  const selectedCarDetails = LMU_CARS[selectedCar];

  const FilterButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
        active 
          ? 'bg-white text-black shadow-sm' 
          : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200'
      }`}
    >
      {Icon && <Icon size={14} />}
      {label}
    </button>
  );

  // --- ÉTATS DE DONNÉES DYNAMIQUES ---
  const [isLoading, setIsLoading] = useState(false);
  const [calcState, setCalcState] = useState({ timeH: 1, timeM: 0, lapM: 1, lapS: 33, multi: 1, useComm: false });
  const [commDb, setCommDb] = useState<any>(null);
  
  // L'unique structure globale qui connecte l'UI aux futures données de DuckDB
  const [stats, setStats] = useState({
    sessions: 0, wins: 0, podiums: 0, top5: 0, poles: 0, top3Starts: 0,
    avgFinish: 0.0, fastestLaps: 0, lapsLed: 0, lapsCompleted: 0,
    tracksPracticed: 0, combos: 0,
    categoryBreakdown: [] as any[], trackPerformance: [] as any[], trackCarCombos: [] as any[],
    topTracks: [] as any[], trackProficiency: [] as any[],
    dnfIndicator: 0, dnfs: 0, dnfRate: 0.0, currentStreak: 0, highestStreak: 0,
    lapTimesData: { totalValid: 0, totalTracks: 0, byType: { race: 0, qualy: 0, practice: 0 }, byMode: { online: 0, offline: 0 }, byCategory: [] as any[], byTrack: [] as any[], allSessions: [] as any[] },
    // --- DEEPER ANALYTICS (Séparé par gomme) ---
    // Remplace uniquement le bloc deeperAnalytics dans "stats" par celui-ci :
    deeperAnalytics: {
      tyreWear: {
        communityLaps: 0, playerLaps: 0,
        compounds: {
          soft: { laps: 0, fl: null as number|null, fr: null as number|null, rl: null as number|null, rr: null as number|null },
          medium: { laps: 0, fl: null as number|null, fr: null as number|null, rl: null as number|null, rr: null as number|null },
          hard: { laps: 0, fl: null as number|null, fr: null as number|null, rl: null as number|null, rr: null as number|null },
          wet: { laps: 0, fl: null as number|null, fr: null as number|null, rl: null as number|null, rr: null as number|null }
        },
        comm: { fl: null as number|null, fr: null as number|null, rl: null as number|null, rr: null as number|null, axle: { f: null as number|null, r: null as number|null }, lat: { l: null as number|null, r: null as number|null } },
        you: { fl: null as number|null, fr: null as number|null, rl: null as number|null, rr: null as number|null, axle: { f: null as number|null, r: null as number|null }, lat: { l: null as number|null, r: null as number|null } }
      },
      consumption: {
        fuelYou: null as number|null, fuelComm: null as number|null,
        veYou: null as number|null, veComm: null as number|null, tankCapacity: 110
      },
      topSpeed: {
        avgYou: null as number|null, avgComm: null as number|null,
        maxYou: null as number|null, maxComm: null as number|null,
        trendData: [] as any[]
      }
    }
  });

  // --- MOTEUR DE CALCUL DYNAMIQUE (Basé sur l'historique XML + JSON Communauté) ---
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      fetch('http://127.0.0.1:8000/api/sessions/history').then(res => res.json()),
      fetch('http://127.0.0.1:8000/api/community-reference').then(res => res.json())
    ]).then(([json, commJson]) => {
        if (isMounted) {
          const commData = commJson.status === 'success' ? commJson.data : null;
          setCommDb(commData);
          
          if (json.status === 'success') {
            const allSessions = json.data;
          
          // 1. Filtrage local
          const filtered = allSessions.filter((s: any) => {
            const sType = s.type ? s.type.toUpperCase() : '';
            let typeMatch = activeType === 'All Types';
            if (activeType === 'Practice' && sType.includes('PRACTICE')) typeMatch = true;
            if (activeType === 'Qualifying' && sType.includes('QUALIFY')) typeMatch = true;
            if (activeType === 'Races' && sType.includes('RACE')) typeMatch = true;

            const sClass = s.class ? s.class.toUpperCase() : '';
            let catMatch = category === 'All Categories';
            if (category !== 'All Categories') {
              catMatch = sClass.includes(category.substring(0, 4).toUpperCase()) || category.toUpperCase().includes(sClass.substring(0, 4));
            }
            return typeMatch && catMatch;
          });

          // 2. Agréger les statistiques globales (Overall)
          let wins = 0, podiums = 0, top5 = 0, poles = 0, top3Starts = 0;
          let totalFinish = 0, totalQual = 0, lapsCompleted = 0;
          const trackMap = new Map();
          const comboMap = new Map();
          const categoryMap = new Map();

          filtered.forEach((s: any) => {
            const finishPos = parseInt(String(s.finish).replace(/\D/g, '')) || 0;
            const gridPos = parseInt(String(s.grid).replace(/\D/g, '')) || 0;
            const laps = parseInt(s.laps) || 0;

            if (finishPos === 1) wins++;
            if (finishPos > 0 && finishPos <= 3) podiums++;
            if (finishPos > 0 && finishPos <= 5) top5++;
            if (gridPos === 1) poles++;
            if (gridPos > 0 && gridPos <= 3) top3Starts++;
            
            totalFinish += finishPos;
            totalQual += gridPos;
            lapsCompleted += laps;

            if (!trackMap.has(s.track)) {
              trackMap.set(s.track, { track: s.track, sessions: 0, bestLap: '9:99.999', totalFinish: 0, totalQual: 0, category: s.class, car: s.car });
            }
            const t = trackMap.get(s.track);
            t.sessions++;
            t.totalFinish += finishPos;
            t.totalQual += gridPos;
            if (s.best && s.best !== '--:--.---' && s.best < t.bestLap) t.bestLap = s.best;
            
            if (!categoryMap.has(s.class)) {
              categoryMap.set(s.class, { category: s.class, sessions: 0, races: 0, wins: 0, podiums: 0, totalQual: 0, totalFinish: 0 });
            }
            const c = categoryMap.get(s.class);
            c.sessions++;
            c.races++;
            if (finishPos === 1) c.wins++;
            if (finishPos > 0 && finishPos <= 3) c.podiums++;
            c.totalFinish += finishPos;
            c.totalQual += gridPos;

            comboMap.set(`${s.track}-${s.car}`, true);
          });

          // 3. Agréger les statistiques spécifiques à la vue "Lap Times"
          const validLapSessions = filtered.filter((s: any) => s.best && s.best !== '--:--.---' && s.best !== '0:00.000');
          let ltRace = 0, ltQualy = 0, ltPractice = 0, ltOnline = 0, ltOffline = 0;
          const ltCategoryMap = new Map();
          const ltTrackMap = new Map();

          const timeToSecs = (t: string) => {
            if (!t || t === '--:--.---') return Infinity;
            const [m, sec] = t.split(':');
            return parseInt(m) * 60 + parseFloat(sec);
          };

          const formatSecs = (secs: number) => {
            if (secs === Infinity || !secs || isNaN(secs)) return '-';
            const m = Math.floor(secs / 60);
            const sec = (secs % 60).toFixed(3);
            return `${m}:${sec.padStart(6, '0')}`;
          };

          validLapSessions.forEach((s: any) => {
            const sType = s.type ? s.type.toUpperCase() : '';
            if (sType.includes('RACE')) ltRace++;
            if (sType.includes('QUALIFY')) ltQualy++;
            if (sType.includes('PRACTICE')) ltPractice++;
            if (s.mode === 'Multiplayer') ltOnline++; else ltOffline++;

            if (!ltCategoryMap.has(s.class)) ltCategoryMap.set(s.class, { category: s.class, sessions: 0, tracks: new Set(), totalPct: 0, validPctCount: 0 });
            const cMap = ltCategoryMap.get(s.class);
            cMap.sessions++;
            cMap.tracks.add(s.track);
            
            // Calcul du % vs Alien Pace
            if (commData) {
               let cClass = s.class.toUpperCase().replace(' CAR', '');
               if (cClass.includes('HYPER')) cClass = 'HYPERCAR';
               if (cClass.includes('GT3')) cClass = 'LMGT3';
               if (cClass.includes('GTE')) cClass = 'LMGTE';
               if (cClass.includes('LMP2')) cClass = 'LMP2WEC';
               
               const catData = commData[cClass];
               if (catData) {
                  // Matching du circuit
                  const tKey = Object.keys(catData).find(k => s.track.toLowerCase().replace(/[^a-z]/g, '').includes(k.toLowerCase().replace(/[^a-z]/g, '')) || k.toLowerCase().replace(/[^a-z]/g, '').includes(s.track.toLowerCase().replace(/[^a-z]/g, '')));
                  if (tKey && catData[tKey].alien_time_sec) {
                     const refSec = catData[tKey].alien_time_sec;
                     const sSecs = timeToSecs(s.best);
                     if (sSecs !== Infinity && refSec > 0) {
                         cMap.totalPct += (sSecs / refSec) * 100;
                         cMap.validPctCount++;
                     }
                  }
               }
            }

            if (!ltTrackMap.has(s.track)) {
              ltTrackMap.set(s.track, {
                track: s.track, sessions: 0, races: Infinity, qualy: Infinity, practice: Infinity,
                onlineBest: Infinity, offlineBest: Infinity, overallBest: Infinity, sessionList: []
              });
            }
            const tMap = ltTrackMap.get(s.track);
            tMap.sessions++;
            tMap.sessionList.push(s);
            
            const secs = timeToSecs(s.best);
            if (sType.includes('RACE')) tMap.races = Math.min(tMap.races, secs);
            if (sType.includes('QUALIFY')) tMap.qualy = Math.min(tMap.qualy, secs);
            if (sType.includes('PRACTICE')) tMap.practice = Math.min(tMap.practice, secs);
            if (s.mode === 'Multiplayer') tMap.onlineBest = Math.min(tMap.onlineBest, secs);
            else tMap.offlineBest = Math.min(tMap.offlineBest, secs);
            tMap.overallBest = Math.min(tMap.overallBest, secs);
          });

          // --- 4. CALCULS SPÉCIFIQUES POUR "DEEPER ANALYTICS" (TYRE WEAR) ---
          const deeperTarget = filtered.filter((s:any) => isTrackMatch(s.track, selectedTrack) && isCarMatch(s.car, s.carType, selectedCar));
          
          const compStats = {
            soft: { laps: 0, fl: 0, fr: 0, rl: 0, rr: 0 },
            medium: { laps: 0, fl: 0, fr: 0, rl: 0, rr: 0 },
            hard: { laps: 0, fl: 0, fr: 0, rl: 0, rr: 0 },
            wet: { laps: 0, fl: 0, fr: 0, rl: 0, rr: 0 }
          };

          let totalDeeperLaps = 0;
          let dCommLaps = 0;
          let sumCommFL = 0, sumCommFR = 0, sumCommRL = 0, sumCommRR = 0;

          let sumFuelYou=0, sumVeYou=0, sumTopSpeedYou=0, maxTopSpeedYou=0;
          let fuelLapsYou=0, veLapsYou=0, tsLapsYou=0;
          let sumFuelComm=0, sumVeComm=0, sumTopSpeedComm=0, maxTopSpeedComm=0;
          let fuelLapsComm=0, veLapsComm=0, tsLapsComm=0;
          const trendDataMap = new Map();

          deeperTarget.forEach((s: any) => {
             const laps = parseInt(s.laps) || 0;
             const cLaps = parseInt(s.commLaps) || 0;

             // Calcul du Joueur
             if (laps > 0) {
               totalDeeperLaps += laps;
               let comp = (s.startingTires || 'Medium').toLowerCase();
               if (!compStats[comp as keyof typeof compStats]) comp = 'medium';
               
               const c = compStats[comp as keyof typeof compStats];
               c.laps += laps;
               
               if (s.wearFL !== undefined && s.wearFL !== null) { 
                 c.fl += parseFloat(s.wearFL) * laps; c.fr += parseFloat(s.wearFR) * laps;
                 c.rl += parseFloat(s.wearRL) * laps; c.rr += parseFloat(s.wearRR) * laps;
               }
               
               // Normalisation stricte : on saute les 0 pour ne pas casser la moyenne !
               const fU = parseFloat(s.fuelUsed);
               if (!isNaN(fU) && fU > 0) { sumFuelYou += fU * laps; fuelLapsYou += laps; }
               
               const vU = parseFloat(s.veUsed);
               if (!isNaN(vU) && vU > 0) { sumVeYou += vU * laps; veLapsYou += laps; }
               
               const ts = parseFloat(s.topSpeed);
               if (!isNaN(ts) && ts > 0) { 
                 sumTopSpeedYou += ts * laps; tsLapsYou += laps; 
                 const mts = parseFloat(s.maxTopSpeed);
                 if (!isNaN(mts) && mts > maxTopSpeedYou) maxTopSpeedYou = mts;
               }
               
               // Graphe de vitesse
               const mTS = parseFloat(s.maxTopSpeed);
               const cMTS = parseFloat(s.commMaxTopSpeed);
               if ((!isNaN(mTS) && mTS > 0) || (!isNaN(cMTS) && cMTS > 0)) {
                  const dStr = s.date ? s.date.split(',')[0] : 'Unknown';
                  if (!trendDataMap.has(dStr)) {
                      trendDataMap.set(dStr, { date: dStr, you: !isNaN(mTS) && mTS > 0 ? mTS : null, comm: !isNaN(cMTS) && cMTS > 0 ? cMTS : null });
                  } else {
                      const ex = trendDataMap.get(dStr);
                      if (!isNaN(mTS) && mTS > (ex.you || 0)) ex.you = mTS;
                      if (!isNaN(cMTS) && cMTS > (ex.comm || 0)) ex.comm = cMTS;
                  }
               }
             }

             // Calcul de la Communauté
             if (cLaps > 0) {
               dCommLaps += cLaps;
               if (s.commWearFL !== undefined && s.commWearFL !== null) { 
                 sumCommFL += parseFloat(s.commWearFL) * cLaps; sumCommFR += parseFloat(s.commWearFR) * cLaps;
                 sumCommRL += parseFloat(s.commWearRL) * cLaps; sumCommRR += parseFloat(s.commWearRR) * cLaps;
               }
               
               const cfU = parseFloat(s.commFuelUsed);
               if (!isNaN(cfU) && cfU > 0) { sumFuelComm += cfU * cLaps; fuelLapsComm += cLaps; }
               
               const cvU = parseFloat(s.commVeUsed);
               if (!isNaN(cvU) && cvU > 0) { sumVeComm += cvU * cLaps; veLapsComm += cLaps; }
               
               const cts = parseFloat(s.commTopSpeed);
               if (!isNaN(cts) && cts > 0) { 
                 sumTopSpeedComm += cts * cLaps; tsLapsComm += cLaps;
                 const cmts = parseFloat(s.commMaxTopSpeed);
                 if (!isNaN(cmts) && cmts > maxTopSpeedComm) maxTopSpeedComm = cmts;
               }
             }
          });

          // Résolution Finale
          let tankCap = 110;
          if (selectedCarDetails?.category?.includes('HYPER')) tankCap = 90;
          else if (selectedCarDetails?.category?.includes('LMP2')) tankCap = 75;
          else if (selectedCarDetails?.category?.includes('LMP3')) tankCap = 100;

          // Normalisation des moyennes d'usure Joueur (% par tour)
          Object.keys(compStats).forEach(k => {
             const c = compStats[k as keyof typeof compStats] as any;
             if (c.laps > 0 && c.fl > 0) {
               c.fl = c.fl / c.laps;
               c.fr = c.fr / c.laps;
               c.rl = c.rl / c.laps;
               c.rr = c.rr / c.laps;
             } else {
               c.fl = null; c.fr = null; c.rl = null; c.rr = null;
             }
          });

          // Normalisation des moyennes Communauté
          const commFL = (dCommLaps > 0 && sumCommFL > 0) ? (sumCommFL / dCommLaps) : null;
          const commFR = (dCommLaps > 0 && sumCommFR > 0) ? (sumCommFR / dCommLaps) : null;
          const commRL = (dCommLaps > 0 && sumCommRL > 0) ? (sumCommRL / dCommLaps) : null;
          const commRR = (dCommLaps > 0 && sumCommRR > 0) ? (sumCommRR / dCommLaps) : null;

          let commAxleF = null, commAxleR = null, commLatL = null, commLatR = null;
          if (commFL !== null && commFR !== null && commRL !== null && commRR !== null) {
            const totF = commFL + commFR;
            const totR = commRL + commRR;
            const totW = totF + totR;
            if (totW > 0) {
              commAxleF = (totF / totW) * 100;
              commAxleR = (totR / totW) * 100;
              commLatL = ((commFL + commRL) / totW) * 100;
              commLatR = ((commFR + commRR) / totW) * 100;
            }
          }

          // 5. Assemblage final et mathématiques (Moyennes, Ecart Types)
          const sessionsCount = filtered.length;
          
          const trackPerf = Array.from(trackMap.values()).map((t: any) => ({
            ...t,
            bestLap: t.bestLap === '9:99.999' ? '--:--.---' : t.bestLap,
            avgFinish: t.sessions > 0 ? (t.totalFinish / t.sessions) : 0,
            avgQual: t.sessions > 0 ? (t.totalQual / t.sessions) : 0,
            avgLap: '--:--.---'
          }));

          const catBreakdown = Array.from(categoryMap.values()).map((c: any) => ({
            ...c,
            avgFinish: c.races > 0 ? (c.totalFinish / c.races) : 0,
            avgQual: c.races > 0 ? (c.totalQual / c.races) : 0,
            avgPos: c.races > 0 ? ((c.totalFinish + c.totalQual) / (c.races * 2)) : 0
          }));

          const byTrackData = Array.from(ltTrackMap.values()).map((t: any) => {
            const validSecs = t.sessionList.map((s:any) => timeToSecs(s.best)).filter((sec:number) => sec !== Infinity);
            const pb = Math.min(...validSecs);
            
            let avgLapStr = '--:--.---';
            let stdDevStr = '--.---s';
            let consistencyStr = '--/--';

            if (validSecs.length > 0) {
               const sum = validSecs.reduce((a:number, b:number) => a + b, 0);
               const avg = sum / validSecs.length;
               avgLapStr = formatSecs(avg);

               if (validSecs.length > 1) {
                 const variance = validSecs.reduce((a:number, b:number) => a + Math.pow(b - avg, 2), 0) / validSecs.length;
                 stdDevStr = Math.sqrt(variance).toFixed(3) + 's';
               }

               const withinHalfSec = validSecs.filter((sec:number) => sec <= pb + 0.5).length;
               consistencyStr = `${withinHalfSec}/${validSecs.length}`;
            }

            return {
              track: t.track, sessions: t.sessions,
              races: formatSecs(t.races), qualy: formatSecs(t.qualy), practice: formatSecs(t.practice),
              onlineBest: formatSecs(t.onlineBest), offlineBest: formatSecs(t.offlineBest),
              offlineDelta: '-', overallBest: formatSecs(t.overallBest),
              sessionList: t.sessionList.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()),
              calculatedAvgLap: avgLapStr,
              calculatedStdDev: stdDevStr,
              calculatedConsistency: consistencyStr
            };
          });

          // 6. UN SEUL setStats Global (Fini les doublons !)
          setStats({
            sessions: sessionsCount, wins, podiums, top5, poles, top3Starts,
            avgFinish: sessionsCount > 0 ? (totalFinish / sessionsCount) : 0,
            fastestLaps: 0, lapsLed: 0, lapsCompleted, tracksPracticed: trackMap.size, combos: comboMap.size,
            categoryBreakdown: catBreakdown, trackPerformance: trackPerf, trackCarCombos: trackPerf,
            topTracks: [...trackPerf].sort((a, b) => a.avgFinish - b.avgFinish),
            trackProficiency: trackPerf,
            dnfIndicator: 0, dnfs: 0, dnfRate: 0.0, currentStreak: sessionsCount, highestStreak: sessionsCount,
            lapTimesData: {
              totalValid: validLapSessions.length,
              totalTracks: ltTrackMap.size,
              byType: { race: ltRace, qualy: ltQualy, practice: ltPractice },
              byMode: { online: ltOnline, offline: ltOffline },
              byCategory: Array.from(ltCategoryMap.values()).map((c: any) => {
                const avg = c.validPctCount > 0 ? (c.totalPct / c.validPctCount) : null;
                return {
                  category: c.category, sessions: c.sessions, tracks: c.tracks.size, 
                  avgRef: avg ? `${avg.toFixed(2)}%` : 'N/A',
                  colorRef: avg ? (avg <= 101.5 ? '#3a86ff' : avg <= 103.5 ? '#10b981' : avg <= 106 ? '#e9c46a' : '#ef4444') : '#4b5563'
                };
              }),
              byTrack: byTrackData,
              allSessions: validLapSessions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            },
            deeperAnalytics: { 
              tyreWear: { communityLaps: dCommLaps, playerLaps: totalDeeperLaps, compounds: compStats, comm: { fl: commFL, fr: commFR, rl: commRL, rr: commRR, axle: { f: commAxleF, r: commAxleR }, lat: { l: commLatL, r: commLatR } }, you: { fl: null, fr: null, rl: null, rr: null, axle: { f: null, r: null }, lat: { l: null, r: null } } },
              consumption: { fuelYou: fuelLapsYou > 0 ? sumFuelYou / fuelLapsYou : null, fuelComm: fuelLapsComm > 0 ? sumFuelComm / fuelLapsComm : null, veYou: veLapsYou > 0 ? sumVeYou / veLapsYou : null, veComm: veLapsComm > 0 ? sumVeComm / veLapsComm : null, tankCapacity: tankCap },
              topSpeed: { avgYou: tsLapsYou > 0 ? sumTopSpeedYou / tsLapsYou : null, avgComm: tsLapsComm > 0 ? sumTopSpeedComm / tsLapsComm : null, maxYou: maxTopSpeedYou > 0 ? maxTopSpeedYou : null, maxComm: maxTopSpeedComm > 0 ? maxTopSpeedComm : null, trendData: Array.from(trendDataMap.values()).reverse() }
            }
          });
        }
      }})
      .catch(err => console.error("Erreur Analytics :", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [activeMode, activeType, category, selectedTrack, selectedCar]); // Recalcule à chaque clic sur un filtre !

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] text-gray-200 rounded-xl overflow-hidden shadow-2xl border border-gray-800/50">
      
      {/* HEADER TABS */}
      <div className="flex items-center gap-8 px-6 pt-6 pb-4 border-b border-gray-800/50">
        {[
          { label: 'Overall Analytics', key: 'Overall' },
          { label: 'Deeper Analytics', key: 'Deeper' },
          { label: 'Lap Times', key: 'LapTimes' },
          { label: 'Tracks', key: 'Tracks' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`text-sm font-bold tracking-wide transition-colors relative pb-1 ${
              activeTab === tab.key ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute left-0 right-0 -bottom-[17px] h-[2px] bg-white rounded-t-full"></span>
            )}
          </button>
        ))}
      </div>

      {/* GLOBAL FILTER BAR */}
      <div className="px-6 py-4 bg-[#0d0e12] border-b border-gray-800/50 flex flex-wrap items-center gap-3">
        <div className="text-gray-500 pr-2 border-r border-gray-800"><Filter size={16} /></div>
        
        <div className="flex items-center bg-[#121318] rounded-full p-1 border border-gray-800/50">
          <FilterButton active={activeMode === 'All Modes'} onClick={() => setActiveMode('All Modes')} icon={LayoutGrid} label="All Modes" />
          <FilterButton active={activeMode === 'Online'} onClick={() => setActiveMode('Online')} icon={Wifi} label="Online" />
          <FilterButton active={activeMode === 'Offline'} onClick={() => setActiveMode('Offline')} icon={WifiOff} label="Offline" />
        </div>

        <div className="flex items-center bg-[#121318] rounded-full p-1 border border-gray-800/50">
          <FilterButton active={activeType === 'All Types'} onClick={() => setActiveType('All Types')} icon={LayoutGrid} label="All Types" />
          <FilterButton active={activeType === 'Races'} onClick={() => setActiveType('Races')} icon={Flag} label="Races" />
          <FilterButton active={activeType === 'Qualifying'} onClick={() => setActiveType('Qualifying')} icon={Timer} label="Qualifying" />
          <FilterButton active={activeType === 'Practice'} onClick={() => setActiveType('Practice')} icon={PlayCircle} label="Practice" />
        </div>

        <div className="flex items-center gap-2 ml-2">
          <span className="text-xs text-gray-500 font-semibold">Category:</span>
          <select 
            value={category} 
            onChange={(e) => {
              setCategory(e.target.value);
              setSelectedCar('Select car');
            }} 
            className="bg-[#121318] text-sm font-bold text-gray-200 outline-none cursor-pointer border border-gray-800 rounded px-3 py-1.5"
          >
            <option>All Categories</option>
            <option>HYPERCAR</option>
            <option>LMGT3</option>
            <option>LMP2</option>
            <option>LMP3</option>
            <option>LMGTE</option>
          </select>
        </div>

        {/* --- NOUVEAU : Filtre Nation Custom (Visible uniquement sur l'onglet Tracks) --- */}
        {activeTab === 'Tracks' && (
          <div className="flex items-center gap-2 ml-2 border-l border-gray-800/50 pl-4 relative">
            <span className="text-xs text-gray-500 font-semibold">Nation:</span>
            <div className="relative">
              <div 
                onClick={() => setIsNationDropdownOpen(!isNationDropdownOpen)} 
                className="bg-[#121318] border border-gray-800 text-xs font-bold text-gray-200 px-3 py-1.5 rounded-md cursor-pointer hover:bg-white/5 transition-colors min-w-[150px] flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-2">
                  {trackNationFilter === 'All Nations' ? (
                    <span className="flex items-center gap-2">🌍 All Nations</span>
                  ) : (
                    <>
                      <div className="w-5 flex items-center justify-center shrink-0">
                        <CountryFlag code={trackNationFilter} />
                      </div>
                      <span className="truncate">{TRACK_NATIONS.find(n => n.code === trackNationFilter)?.name}</span>
                    </>
                  )}
                </div>
                <ChevronDown size={14} className={`shrink-0 text-gray-500 transform transition-transform ${isNationDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {isNationDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNationDropdownOpen(false)}></div>
                  <div className="absolute top-full mt-2 left-0 w-full max-h-[300px] overflow-y-auto bg-[#121318] border border-gray-800 rounded-md shadow-[0_15px_40px_rgba(0,0,0,0.9)] z-50 scrollbar-hide">
                    <div 
                      onClick={() => { setTrackNationFilter('All Nations'); setIsNationDropdownOpen(false); }} 
                      className="p-3 hover:bg-[#3a86ff] hover:text-white cursor-pointer text-xs font-bold text-gray-300 border-b border-gray-800/50 transition-colors flex items-center gap-2"
                    >
                      🌍 All Nations
                    </div>
                    {TRACK_NATIONS.map(n => (
                      <div 
                        key={n.code} 
                        onClick={() => { setTrackNationFilter(n.code); setIsNationDropdownOpen(false); }} 
                        className="p-3 hover:bg-[#3a86ff] hover:text-white cursor-pointer flex items-center gap-3 border-b border-gray-800/30 last:border-0 transition-colors text-gray-300 group"
                      >
                        <div className="w-5 flex items-center justify-center shrink-0">
                          <CountryFlag code={n.code} />
                        </div>
                        <span className="text-xs font-bold group-hover:text-white">{n.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* COMPTEUR DE SESSIONS HEADER */}
      {activeTab !== 'Tracks' && (
        <div className="px-6 py-3 bg-[#0a0a0f] border-b border-gray-800/50 flex items-center text-xs font-bold text-gray-400">
          <BarChart2 size={14} className="mr-2" /> 
          {stats.sessions} session{stats.sessions !== 1 ? 's' : ''}
        </div>
      )}

      {/* ============================================================== */}
      {/* ZONE DE CONTENU DYNAMIQUE OVERALL ANALYTICS */}
      {/* ============================================================== */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0f] scrollbar-hide relative">
        
        {/* LOADING OVERLAY */}
        {isLoading && (
          <div className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <RefreshCw size={32} className="text-[#3a86ff] animate-spin" />
          </div>
        )}

        {activeTab === 'Overall' && (
          <div className="flex flex-col gap-8">
            
            {/* ----------------------------------------------------------------- */}
            {/* VUE 1 : PRACTICE (ou All Types)                                   */}
            {/* ----------------------------------------------------------------- */}
            {(activeType === 'Practice' || activeType === 'All Types') && (
              <div className="animate-in fade-in duration-300 flex flex-col gap-8">
                
                {/* KPIs */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between h-32 shadow-lg">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Tracks Practiced</span>
                      <MapPin size={16} className="text-[#3a86ff]" />
                    </div>
                    <div>
                      <div className="text-4xl font-black text-white italic">{stats?.tracksPracticed || 0}</div>
                      <div className="text-xs text-gray-500 mt-1">Unique circuits practiced on</div>
                    </div>
                  </div>
                  
                  <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between h-32 shadow-lg">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Track/Car Combos</span>
                      <CarFront size={16} className="text-[#10b981]" />
                    </div>
                    <div>
                      <div className="text-4xl font-black text-white italic">{stats?.combos || 0}</div>
                      <div className="text-xs text-gray-500 mt-1">Unique track and car combinations</div>
                    </div>
                  </div>
                  
                  <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between h-32 shadow-lg">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Total Sessions</span>
                      <PlayCircle size={16} className="text-[#0ea5e9]" />
                    </div>
                    <div>
                      <div className="text-4xl font-black text-white italic">{stats?.sessions || 0}</div>
                      <div className="text-xs text-gray-500 mt-1">Practice sessions recorded</div>
                    </div>
                  </div>
                </div>

                {/* Tables Practice */}
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">Track Performance</h2>
                    <p className="text-xs text-gray-400 mb-4">Best laps and consistency across circuits</p>
                    <div className="bg-[#121318] border border-gray-800/50 rounded-xl overflow-hidden min-h-[250px] flex flex-col relative">
                      
                      {isLoading && (
                        <div className="absolute inset-0 bg-[#121318]/80 backdrop-blur-sm z-10 flex items-center justify-center">
                          <RefreshCw size={24} className="text-[#3a86ff] animate-spin" />
                        </div>
                      )}
                      
                      <div className="grid grid-cols-4 p-4 border-b border-gray-800/50 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                        <div className="col-span-1">Track</div>
                        <div className="col-span-1 text-center">Sessions</div>
                        <div className="col-span-1 text-center">Personal Best</div>
                        <div className="col-span-1 text-right">Avg Lap Time</div>
                      </div>
                      
                      {stats?.trackPerformance && stats.trackPerformance.length > 0 ? (
                        <div className="flex-1 overflow-y-auto">
                          {stats.trackPerformance.map((row: any, i: number) => (
                            <div key={i} className="grid grid-cols-4 p-4 border-b border-gray-800/30 hover:bg-[#1a1b26] transition-colors items-center text-sm font-bold">
                              <div className="col-span-1 text-white flex items-center gap-2">
                                <CountryFlag code={getTrackCountryCode(row.track || row.name)} /> 
                                <span className="truncate">{row.track || row.name}</span>
                              </div>
                              <div className="col-span-1 text-center text-gray-400">{row.sessions}</div>
                              <div className="col-span-1 text-center text-[#8338ec] font-mono">{row.bestLap}</div>
                              <div className="col-span-1 text-right text-gray-300 font-mono">{row.avgLap || row.avgFinish}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-sm font-medium text-gray-500">
                          No data available for these filters.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* VUE 2 : QUALIFYING (Basée sur ta capture d'écran Qualy)           */}
            {/* ----------------------------------------------------------------- */}
            {activeType === 'Qualifying' && (
              <div className="animate-in fade-in duration-300 flex flex-col gap-8">
                {/* KPIs Qualy */}
                <div className="grid grid-cols-4 gap-6">
                  {[
                    { label: 'Total Sessions', sub: 'Online qualifying sessions recorded', val: stats.sessions, icon: Flag, color: 'text-[#3a86ff]' },
                    { label: 'Poles', sub: 'Pole positions earned', val: stats.poles, icon: Trophy, color: 'text-[#10b981]' },
                    { label: 'Top 3', sub: 'Top-three starts', val: stats.top3Starts, icon: Trophy, color: 'text-[#e9c46a]' },
                    { label: 'Top 5', sub: 'Top-five finishes', val: stats.top5, icon: Star, color: 'text-gray-400' }
                  ].map((kpi, i) => (
                    <div key={i} className="bg-[#121318] border border-gray-800/50 rounded-xl p-5 flex flex-col justify-between h-32 shadow-lg">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">{kpi.label}</span>
                        <kpi.icon size={16} className={kpi.color} />
                      </div>
                      <div>
                        <div className="text-4xl font-black text-white italic">{kpi.val}</div>
                        <div className="text-[10px] text-gray-500 mt-1">{kpi.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">Car Category Breakdown</h2>
                    <p className="text-xs text-gray-400 mb-4">Performance across endurance classes in qualifying sessions</p>
                    <div className="bg-[#121318] border border-gray-800/50 rounded-xl overflow-hidden">
                      <div className="grid grid-cols-5 p-4 border-b border-gray-800/50 text-[9px] font-black tracking-widest text-gray-500 uppercase">
                        <div>Category</div>
                        <div className="text-center">Sessions</div>
                        <div className="text-center">Poles</div>
                        <div className="text-center">Top 3</div>
                        <div className="text-right">Avg Position</div>
                      </div>
                      {stats.categoryBreakdown && stats.categoryBreakdown.length > 0 ? stats.categoryBreakdown.map((row: any, i: number) => (
                        <div key={i} className="grid grid-cols-5 p-4 border-b border-gray-800/30 text-sm font-bold items-center hover:bg-[#1a1b26] transition-colors last:border-0">
                          <div><span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase border ${getClassColor(row.category)}`}>{row.category.substring(0, 5)}</span></div>
                          <div className="text-center text-gray-300">{row.sessions || row.races}</div>
                          <div className="text-center text-[#10b981]">{row.poles || 0}</div>
                          <div className="text-center text-[#e9c46a]">{row.top3Starts || 0}</div>
                          <div className="text-right text-white">{row.avgQual?.toFixed(1) || '0.0'}</div>
                        </div>
                      )) : <div className="p-4 text-center text-gray-500 text-sm">No data available</div>}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">Top Tracks by Performance</h2>
                    <p className="text-xs text-gray-400 mb-4">Best performing tracks by average qualifying position</p>
                    <div className="bg-[#121318] border border-gray-800/50 rounded-xl overflow-hidden">
                      {stats.topTracks && stats.topTracks.length > 0 ? stats.topTracks.map((row: any, i: number) => (
                        <div key={i} className="flex justify-between p-4 border-b border-gray-800/30 items-center hover:bg-[#1a1b26] transition-colors last:border-0">
                          <div className="flex items-center gap-4">
                            <span className="bg-[#1c1e2b] border border-gray-700 w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-gray-400">{i+1}</span>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-white flex items-center gap-2"><CountryFlag code={getTrackCountryCode(row.track)} /> {row.track}</span>
                              <span className="text-[10px] text-gray-500 font-medium">{row.sessions} session</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-lg font-black text-white">{row.avgQual?.toFixed(1) || '0.0'} <ChevronRight size={14} className="inline text-gray-600"/></span>
                            <span className="text-[10px] text-gray-500 font-medium">Avg Qual.</span>
                          </div>
                        </div>
                      )) : <div className="p-4 text-center text-gray-500 text-sm">No data available</div>}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">Track Proficiency</h2>
                    <p className="text-xs text-gray-400 mb-4">Performance breakdown by circuit in qualifying sessions</p>
                    <div className="bg-[#121318] border border-gray-800/50 rounded-xl overflow-hidden">
                      <div className="grid grid-cols-3 p-4 border-b border-gray-800/50 text-[9px] font-black tracking-widest text-gray-500 uppercase">
                        <div>Track</div>
                        <div className="text-center">Sessions</div>
                        <div className="text-right">Avg Qual.</div>
                      </div>
                      {stats.trackProficiency && stats.trackProficiency.length > 0 ? stats.trackProficiency.map((row: any, i: number) => (
                        <div key={i} className="grid grid-cols-3 p-4 border-b border-gray-800/30 text-sm font-bold items-center hover:bg-[#1a1b26] transition-colors last:border-0">
                          <div className="flex items-center gap-2"><CountryFlag code={getTrackCountryCode(row.track)} /> {row.track}</div>
                          <div className="text-center text-gray-400">{row.sessions}</div>
                          <div className="text-right text-white">{row.avgQual?.toFixed(1) || '0.0'}</div>
                        </div>
                      )) : <div className="p-4 text-center text-gray-500 text-sm">No data available</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* VUE 3 : RACES (Basée sur ta capture d'écran Races)                */}
            {/* ----------------------------------------------------------------- */}
            {activeType === 'Races' && (
              <div className="animate-in fade-in duration-300 flex flex-col gap-8">
                {/* KPIs Race (8 blocs) */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Total Sessions', sub: 'Total race sessions recorded', val: stats.sessions, icon: Flag, color: 'text-[#3a86ff]' },
                    { label: 'Average Finish', sub: 'Across all race sessions', val: stats.avgFinish?.toFixed(1) || '0.0', icon: Activity, color: 'text-gray-400' },
                    { label: 'Wins', sub: 'Race victories', val: stats.wins, icon: Trophy, color: 'text-[#10b981]' },
                    { label: 'Podiums', sub: 'Top-three finishes', val: stats.podiums, icon: Trophy, color: 'text-[#e9c46a]' },
                    { label: 'Top 5', sub: 'Top-five finishes', val: stats.top5, icon: Star, color: 'text-gray-400' },
                    { label: 'Fastest Laps', sub: 'Fastest laps set in races', val: stats.fastestLaps, icon: Zap, color: 'text-[#ef4444]' },
                    { label: 'Laps Led', sub: 'Total laps led in online races', val: stats.lapsLed, icon: Route, color: 'text-orange-400' },
                    { label: 'Laps Completed', sub: 'Total laps completed in online races', val: stats.lapsCompleted, icon: PlayCircle, color: 'text-[#3a86ff]' }
                  ].map((kpi, i) => (
                    <div key={i} className="bg-[#121318] border border-gray-800/50 rounded-xl p-4 flex flex-col justify-between h-28 shadow-lg">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-bold tracking-widest text-gray-500 uppercase">{kpi.label}</span>
                        <kpi.icon size={14} className={kpi.color} />
                      </div>
                      <div>
                        <div className="text-3xl font-black text-white italic">{kpi.val}</div>
                        <div className="text-[9px] text-gray-500 mt-1">{kpi.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">Car Category Breakdown</h2>
                    <p className="text-xs text-gray-400 mb-4">Performance across endurance classes in race sessions</p>
                    <div className="bg-[#121318] border border-gray-800/50 rounded-xl overflow-hidden">
                      <div className="grid grid-cols-7 p-4 border-b border-gray-800/50 text-[9px] font-black tracking-widest text-gray-500 uppercase">
                        <div className="col-span-1">Category</div>
                        <div className="col-span-1 text-center">Races</div>
                        <div className="col-span-1 text-center">Wins</div>
                        <div className="col-span-1 text-center">Podiums</div>
                        <div className="col-span-1 text-center">Avg Qualy Pos</div>
                        <div className="col-span-1 text-center">Avg Finish</div>
                        <div className="col-span-1 text-right">Avg G Position</div>
                      </div>
                      {stats.categoryBreakdown && stats.categoryBreakdown.length > 0 ? stats.categoryBreakdown.map((row: any, i: number) => (
                        <div key={i} className="grid grid-cols-7 p-4 border-b border-gray-800/30 text-sm font-bold items-center hover:bg-[#1a1b26] transition-colors last:border-0">
                          <div className="col-span-1"><span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase border ${getClassColor(row.category)}`}>{row.category.substring(0, 5)}</span></div>
                          <div className="col-span-1 text-center text-gray-300">{row.races}</div>
                          <div className="col-span-1 text-center text-[#10b981]">{row.wins}</div>
                          <div className="col-span-1 text-center text-[#e9c46a]">{row.podiums}</div>
                          <div className="col-span-1 text-center text-white">{row.avgQual?.toFixed(1) || '0.0'}</div>
                          <div className="col-span-1 text-center text-white">{row.avgFinish?.toFixed(1) || '0.0'}</div>
                          <div className="col-span-1 text-right text-white">{row.avgPos?.toFixed(1) || '0.0'}</div>
                        </div>
                      )) : <div className="p-4 text-center text-gray-500 text-sm">No data available</div>}
                    </div>
                  </div>

                  {/* Grid pour "Top Tracks" et "Reliability" */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h2 className="text-lg font-bold text-white mb-1">Top Tracks by Performance</h2>
                      <p className="text-xs text-gray-400 mb-4">Best performing tracks by average finish position</p>
                      <div className="bg-[#121318] border border-gray-800/50 rounded-xl overflow-hidden h-[240px]">
                        {stats.topTracks && stats.topTracks.length > 0 ? stats.topTracks.map((row: any, i: number) => (
                          <div key={i} className="flex justify-between p-4 border-b border-gray-800/30 items-center hover:bg-[#1a1b26] transition-colors last:border-0">
                            <div className="flex items-center gap-4">
                              <span className="bg-[#1c1e2b] border border-gray-700 w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-gray-400">{i+1}</span>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-white flex items-center gap-2"><CountryFlag code={getTrackCountryCode(row.track)} /> {row.track}</span>
                                <span className="text-[10px] text-gray-500 font-medium">{row.sessions} session</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-lg font-black text-white">{row.avgFinish?.toFixed(1) || '0.0'} <ChevronRight size={14} className="inline text-gray-600"/></span>
                              <span className="text-[10px] text-gray-500 font-medium">Avg Finish</span>
                            </div>
                          </div>
                        )) : <div className="p-4 text-center text-gray-500 text-sm">No data available</div>}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-white mb-1">Reliability Insights</h2>
                      <p className="text-xs text-gray-400 mb-4">Track your ability to bring the car home</p>
                      <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-5 flex flex-col h-[112px]">
                            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">DNF Indicator</span>
                            <div className="text-3xl font-black text-white italic mt-auto">{stats.dnfIndicator}</div>
                          </div>
                          <div className="bg-[#2a1518] border border-[#ef4444]/20 rounded-xl p-5 flex flex-col h-[112px]">
                            <span className="text-[10px] font-bold tracking-widest text-[#ef4444] uppercase">DNFs</span>
                            <div className="text-3xl font-black text-[#ef4444] italic mt-auto">{stats.dnfs}</div>
                          </div>
                        </div>
                        <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-5 flex flex-col h-[112px]">
                          <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">DNF Rate</span>
                          <div className="text-3xl font-black text-white italic mt-auto">{stats.dnfRate?.toFixed(1) || '0.0'}%</div>
                          <span className="text-[10px] text-gray-500 mt-1">Percentage of multiplayer races ending as DNF</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[#12221b] border border-[#10b981]/20 rounded-xl p-5 flex flex-col h-[112px]">
                            <span className="text-[10px] font-bold tracking-widest text-[#10b981] uppercase">Current Streak</span>
                            <div className="text-3xl font-black text-[#10b981] italic mt-auto">{stats.currentStreak}</div>
                            <span className="text-[9px] text-[#10b981]/60 mt-1">Races since last DNF</span>
                          </div>
                          <div className="bg-[#121318] border border-[#3a86ff]/20 rounded-xl p-5 flex flex-col h-[112px]">
                            <span className="text-[10px] font-bold tracking-widest text-[#3a86ff] uppercase">Highest Streak</span>
                            <div className="text-3xl font-black text-[#3a86ff] italic mt-auto">{stats.highestStreak}</div>
                            <span className="text-[9px] text-gray-500 mt-1">All-time best streak</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-white mb-1 mt-4">Track Proficiency</h2>
                    <p className="text-xs text-gray-400 mb-4">Performance breakdown by circuit in race sessions</p>
                    <div className="bg-[#121318] border border-gray-800/50 rounded-xl overflow-hidden">
                      <div className="grid grid-cols-3 p-4 border-b border-gray-800/50 text-[9px] font-black tracking-widest text-gray-500 uppercase">
                        <div>Track</div>
                        <div className="text-center">Sessions</div>
                        <div className="text-right">Avg Finish</div>
                      </div>
                      {stats.trackProficiency && stats.trackProficiency.length > 0 ? stats.trackProficiency.map((row: any, i: number) => (
                        <div key={i} className="grid grid-cols-3 p-4 border-b border-gray-800/30 text-sm font-bold items-center hover:bg-[#1a1b26] transition-colors last:border-0">
                          <div className="flex items-center gap-2"><CountryFlag code={getTrackCountryCode(row.track)} /> {row.track}</div>
                          <div className="text-center text-gray-400">{row.sessions}</div>
                          <div className="text-right text-white">{row.avgFinish?.toFixed(1) || '0.0'}</div>
                        </div>
                      )) : <div className="p-4 text-center text-gray-500 text-sm">No data available</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* === TAB 2 : DEEPER ANALYTICS === */}
        {activeTab === 'Deeper' && (
          <div className="flex flex-col gap-6 h-full animate-in fade-in duration-300">
            
            {/* NOUVEAUX FILTRES VISIBLES (TRACK ET CAR) */}
            <div className="flex items-center gap-6 pb-2 border-b border-gray-800/50">
              {/* Select Track Custom */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-semibold">Track:</span>
                <div className="relative z-50">
                  <div onClick={() => setIsTrackDropdownOpen(!isTrackDropdownOpen)} className="bg-[#121318] border border-gray-800/80 text-xs font-bold text-gray-200 px-4 py-2 rounded-md cursor-pointer hover:bg-white/5 transition-colors min-w-[220px] flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2 truncate pr-2">
                      {selectedTrack === 'Select track' ? <span>🌍 Select track</span> : (
                        <><div className="flex-shrink-0"><CountryFlag code={getTrackCountryCode(selectedTrack)} /></div><span className="truncate">{selectedTrack}</span></>
                      )}
                    </div>
                    <ChevronDown size={14} className={`shrink-0 text-gray-500 transform transition-transform ${isTrackDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {isTrackDropdownOpen && (
                    <>
                      <div className="fixed inset-0" onClick={() => setIsTrackDropdownOpen(false)}></div>
                      <div className="absolute top-full mt-2 left-0 w-[320px] max-h-64 overflow-y-auto bg-[#121318] border border-gray-800 rounded-md shadow-2xl scrollbar-hide">
                        <div onClick={() => { setSelectedTrack('Select track'); setIsTrackDropdownOpen(false); }} className="p-3 hover:bg-gray-800 cursor-pointer text-xs font-bold text-gray-400 border-b border-gray-800/50">🌍 Select track</div>
                        {LMU_ALL_TRACKS.map(t => (
                          <div key={t.name} onClick={() => { setSelectedTrack(t.name); setIsTrackDropdownOpen(false); }} className="p-3 hover:bg-[#1a1b26] cursor-pointer flex items-center gap-3 border-b border-gray-800/30 last:border-0 transition-colors">
                            <div className="flex-shrink-0"><CountryFlag code={getTrackCountryCode(t.name)} /></div>
                            <span className="text-xs font-bold text-gray-200 truncate">{t.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Select Car Custom */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-semibold">Car:</span>
                <div className="relative z-50">
                  <div onClick={() => setIsCarDropdownOpen(!isCarDropdownOpen)} className="bg-[#121318] border border-gray-800/80 text-xs font-bold text-gray-200 px-4 py-2 rounded-md cursor-pointer hover:bg-white/5 transition-colors min-w-[240px] flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3 truncate pr-2">
                      {selectedCar === 'Select car' ? <span>🏎️ Select car</span> : (
                        <><div className="w-5 flex justify-center shrink-0"><img src={BRAND_LOGOS[LMU_CARS[selectedCar]?.brand]} alt="" className="max-h-4" /></div><span className="truncate">{selectedCar}</span></>
                      )}
                    </div>
                    <ChevronDown size={14} className={`shrink-0 text-gray-500 transform transition-transform ${isCarDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {isCarDropdownOpen && (
                    <>
                      <div className="fixed inset-0" onClick={() => setIsCarDropdownOpen(false)}></div>
                      <div className="absolute top-full mt-2 left-0 w-[350px] max-h-64 overflow-y-auto bg-[#121318] border border-gray-800 rounded-md shadow-2xl scrollbar-hide">
                        <div onClick={() => { setSelectedCar('Select car'); setIsCarDropdownOpen(false); }} className="p-3 hover:bg-gray-800 cursor-pointer text-xs font-bold text-gray-400 border-b border-gray-800/50">🏎️ Select car</div>
                        {availableCars.map(c => (
                          <div key={c} onClick={() => { setSelectedCar(c); setIsCarDropdownOpen(false); }} className="p-3 hover:bg-[#1a1b26] cursor-pointer flex items-center gap-4 border-b border-gray-800/30 last:border-0 transition-colors">
                            <div className="w-6 h-6 bg-white/5 rounded flex justify-center p-1"><img src={BRAND_LOGOS[LMU_CARS[c]?.brand]} className="max-h-full" /></div>
                            <span className="text-xs font-bold text-gray-200 truncate">{c}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Metrics Sub-Nav */}
            <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-1 flex shadow-md shrink-0">
              <button onClick={() => setActiveMetric('Tyre Wear')} className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${activeMetric === 'Tyre Wear' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}><Gauge size={16} /> Tyre Wear</button>
              <button onClick={() => setActiveMetric('Consumption')} className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${activeMetric === 'Consumption' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}><Droplet size={16} /> Consumption</button>
              <button onClick={() => setActiveMetric('Top Speed')} className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${activeMetric === 'Top Speed' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}><Zap size={16} /> Top Speed</button>
            </div>

            {selectedCar !== 'Select car' && selectedTrack !== 'Select track' ? (
              <div className="flex flex-col gap-6 pb-10">
                {/* Context Bar */}
                <div className="bg-[#121318] border border-gray-800/50 rounded-xl px-5 py-3 flex items-center shadow-sm text-[10px] font-bold tracking-widest uppercase text-gray-400">
                  <div className="flex items-center gap-3">
                    <BarChart2 size={14} className="text-gray-500" />
                    <CountryFlag code={getTrackCountryCode(selectedTrack)} />
                    <span className="text-white">{selectedTrack}</span>
                    <span className="opacity-40">•</span>
                    <CarFront size={12} className="text-gray-500" />
                    <span className="text-white">{selectedCar}</span>
                    <span className="opacity-40">•</span>
                    <span>{activeType}</span>
                    <span className="opacity-40">•</span>
                    <span>{activeMode}</span>
                    <span className="opacity-40">•</span>
                    <span>Sample Size: <span className="text-white">{stats.deeperAnalytics.tyreWear.communityLaps} laps</span></span>
                    <span className="opacity-40">•</span>
                    <span>Your Data: <span className="text-white">{stats.deeperAnalytics.tyreWear.compounds[selectedCompound.toLowerCase() as 'soft'|'medium'|'hard'|'wet'].laps} laps</span></span>
                  </div>
                  <div className="ml-auto"><Info size={14} className="text-gray-500 cursor-pointer hover:text-white transition-colors" /></div>
                </div>

                {/* --- SOUS-VUES DE DEEPER ANALYTICS --- */}
                
                {/* 1. TYRE WEAR */}
                {activeMetric === 'Tyre Wear' && (() => {
                  const compData = stats.deeperAnalytics.tyreWear.compounds[selectedCompound.toLowerCase() as 'soft'|'medium'|'hard'|'wet'];
                  const commData = stats.deeperAnalytics.tyreWear.comm;
                  let axleF = null, axleR = null, latL = null, latR = null;
                  if (compData.fl !== null && compData.fr !== null && compData.rl !== null && compData.rr !== null) {
                    const totF = compData.fl + compData.fr; const totR = compData.rl + compData.rr; const totW = totF + totR;
                    if (totW > 0) { axleF = (totF / totW) * 100; axleR = (totR / totW) * 100; latL = ((compData.fl + compData.rl) / totW) * 100; latR = ((compData.fr + compData.rr) / totW) * 100; }
                  }
                  return (
                    <div className="flex flex-col gap-6 animate-in fade-in">
                      {/* Compound Selector Intégré */}
                      <div className="flex items-center gap-6 border-b border-gray-800/50 pb-2">
                        <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Tyre Compound</span>
                        <div className="flex gap-4">
                          {['Soft', 'Medium', 'Hard', 'Wet'].map(comp => {
                            const l = stats.deeperAnalytics.tyreWear.compounds[comp.toLowerCase() as 'soft'|'medium'|'hard'|'wet'].laps;
                            const isAct = selectedCompound === comp;
                            const colors = { Soft: 'bg-[#ef4444]', Medium: 'bg-[#e9c46a]', Hard: 'bg-white', Wet: 'bg-[#3a86ff]' };
                            return (
                              <button key={comp} onClick={() => setSelectedCompound(comp)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isAct ? 'bg-[#1a1b26] text-white border border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}>
                                <div className={`w-2.5 h-2.5 rounded-full ${colors[comp as keyof typeof colors]} ${isAct ? 'shadow-[0_0_8px_currentColor]' : 'opacity-50'}`}></div>
                                {comp.toUpperCase()} <span className="text-[9px] text-gray-600">({l})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6">
                        <div className="flex flex-col gap-6"><TyreCard title="Front Left" youVal={compData.fl} commVal={commData.fl} /><TyreCard title="Rear Left" youVal={compData.rl} commVal={commData.rl} /></div>
                        <div className="flex flex-col gap-6"><TyreCard title="Front Right" youVal={compData.fr} commVal={commData.fr} /><TyreCard title="Rear Right" youVal={compData.rr} commVal={commData.rr} /></div>
                        <div className="flex flex-col h-full"><div className="bg-[#121318] border border-gray-800/50 rounded-xl p-5 shadow-lg flex flex-col flex-1"><span className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-8">Handling Balance</span><div className="flex flex-col justify-center flex-1 gap-12"><BalanceBar title="Axle Balance" leftLabel="F" rightLabel="R" youL={axleF} youR={axleR} commL={commData.axle.f} commR={commData.axle.r} /><BalanceBar title="Lateral Balance" leftLabel="L" rightLabel="R" youL={latL} youR={latR} commL={commData.lat.l} commR={commData.lat.r} /></div></div></div>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. CONSUMPTION & FUEL CALCULATOR */}
                {activeMetric === 'Consumption' && (() => {
                  const cons = stats.deeperAnalytics.consumption;
                  const youLiters = cons.fuelYou ? (cons.fuelYou * cons.tankCapacity / 100).toFixed(1) : '--';
                  const commLiters = cons.fuelComm ? (cons.fuelComm * cons.tankCapacity / 100).toFixed(1) : '--';
                  
                  // Mathématiques du Calculateur
                  const totalRaceSecs = (calcState.timeH * 3600) + (calcState.timeM * 60);
                  const lapSecs = (calcState.lapM * 60) + calcState.lapS;
                  let totalLaps = lapSecs > 0 ? Math.ceil(totalRaceSecs / lapSecs) : 0;
                  
                  // NOUVEAU : Injection des relais (stints) de la communauté !
                  let commStintsData = null;
                  if (commDb && selectedTrack && selectedCarDetails) {
                     let cClass = selectedCarDetails.category.toUpperCase();
                     if (cClass.includes('HYPER')) cClass = 'HYPERCAR';
                     if (cClass.includes('GT3')) cClass = 'LMGT3';
                     if (cClass.includes('GTE')) cClass = 'LMGTE';
                     if (cClass.includes('LMP2')) cClass = 'LMP2WEC';
                     
                     const catData = commDb[cClass];
                     if (catData) {
                        const tKey = Object.keys(catData).find(k => selectedTrack.toLowerCase().replace(/[^a-z]/g, '').includes(k.toLowerCase().replace(/[^a-z]/g, '')) || k.toLowerCase().replace(/[^a-z]/g, '').includes(selectedTrack.toLowerCase().replace(/[^a-z]/g, '')));
                        if (tKey && catData[tKey].fuel_stints) {
                           commStintsData = catData[tKey].fuel_stints;
                        }
                     }
                  }
                  
                  // Si l'utilisateur clique sur "COMMUNITY", on lit les vrais tours e-sport
                  if (calcState.useComm && commStintsData) {
                     const totalMins = Math.round(totalRaceSecs / 60);
                     const exactKey = `${totalMins}_min`;
                     if (commStintsData[exactKey]) {
                         totalLaps = commStintsData[exactKey];
                     }
                  }
                  
                  const targetFuelPct = calcState.useComm ? cons.fuelComm : cons.fuelYou;
                  const targetVePct = calcState.useComm ? cons.veComm : cons.veYou;
                  
                  // Le multiplicateur (1X, 2X...) s'applique ici nativement !
                  const fuelPerLapLiters = targetFuelPct ? (targetFuelPct * cons.tankCapacity / 100) * calcState.multi : 0;
                  const energyPerLapPct = targetVePct ? targetVePct * calcState.multi : 0;
                  
                  const totalFuelNeeded = fuelPerLapLiters * totalLaps;
                  const totalEnergyNeeded = energyPerLapPct * totalLaps;
                  const stints = fuelPerLapLiters > 0 ? Math.ceil(totalFuelNeeded / cons.tankCapacity) : 0;
                  const lapsPerStint = fuelPerLapLiters > 0 ? Math.floor(cons.tankCapacity / fuelPerLapLiters) : 0;

                  return (
                    <div className="flex flex-col gap-6 animate-in fade-in">
                      <div className="grid grid-cols-2 gap-6">
                        <StatCard title="Fuel" youVal={cons.fuelYou} commVal={cons.fuelComm} unit="% / Lap" subLeft={`EST. VOLUME: ${youLiters} L / lap`} subRight={`EST. VOLUME: ${commLiters} L / lap`} />
                        <StatCard title="Energy" youVal={cons.veYou} commVal={cons.veComm} unit="% / Lap" subLeft="Average virtual energy consumption." />
                      </div>
                      
                      {/* Fuel Calculator Panel */}
                      <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-6 shadow-lg">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Fuel Calculator</h3>
                          <div className="flex bg-[#0a0a0f] border border-gray-800 rounded-full p-1 text-[9px] font-bold">
                            <button onClick={() => setCalcState({...calcState, useComm: false})} className={`px-4 py-1.5 rounded-full ${!calcState.useComm ? 'bg-white text-black' : 'text-gray-500'}`}>YOUR AVG</button>
                            <button onClick={() => setCalcState({...calcState, useComm: true})} className={`px-4 py-1.5 rounded-full ${calcState.useComm ? 'bg-white text-black' : 'text-gray-500'}`}>COMMUNITY</button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-8">Estimate race strategy based on benchmarks and car class limits.</p>
                        
                        <div className="grid grid-cols-12 gap-8">
                          {/* Inputs */}
                          <div className="col-span-5 grid grid-cols-2 gap-x-4 gap-y-6">
                            <div className="flex flex-col"><span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">Total Race Time</span><div className="flex gap-2"><input type="number" value={calcState.timeH} onChange={e=>setCalcState({...calcState, timeH: +e.target.value})} className="w-full bg-[#1a1b26] border border-gray-800 rounded px-3 py-2 text-white text-sm" /><input type="number" value={calcState.timeM} onChange={e=>setCalcState({...calcState, timeM: +e.target.value})} className="w-full bg-[#1a1b26] border border-gray-800 rounded px-3 py-2 text-white text-sm" /></div></div>
                            <div className="flex flex-col"><span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">Average Laptime</span><div className="flex gap-2"><input type="number" value={calcState.lapM} onChange={e=>setCalcState({...calcState, lapM: +e.target.value})} className="w-full bg-[#1a1b26] border border-gray-800 rounded px-3 py-2 text-white text-sm" /><input type="number" value={calcState.lapS} onChange={e=>setCalcState({...calcState, lapS: +e.target.value})} className="w-full bg-[#1a1b26] border border-gray-800 rounded px-3 py-2 text-white text-sm" /></div></div>
                            <div className="flex flex-col"><span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">Fuel Per Lap (L)</span><input type="text" disabled value={fuelPerLapLiters.toFixed(2)} className="bg-[#1a1b26] border border-gray-800 rounded px-3 py-2 text-gray-400 text-sm" /></div>
                            <div className="flex flex-col"><span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">Tank Capacity (L)</span><input type="number" value={cons.tankCapacity} disabled className="bg-[#1a1b26] border border-gray-800 rounded px-3 py-2 text-gray-400 text-sm" /></div>
                            <div className="flex flex-col"><span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">Energy Per Lap (%)</span><input type="text" disabled value={energyPerLapPct.toFixed(2)} className="bg-[#1a1b26] border border-gray-800 rounded px-3 py-2 text-gray-400 text-sm" /></div>
                            <div className="flex flex-col justify-end pb-2">
                               <select value={calcState.multi} onChange={e=>setCalcState({...calcState, multi: +e.target.value})} className="bg-[#1a1b26] border border-gray-800 rounded px-3 py-2 text-white text-sm outline-none"><option value={1}>1X CONSUMPTION</option><option value={2}>2X CONSUMPTION</option><option value={3}>3X CONSUMPTION</option></select>
                            </div>
                          </div>
                          
                          {/* Output Grid */}
                          <div className="col-span-7 flex flex-col justify-center">
                             <div className="grid grid-cols-4 text-center border-b border-gray-800 pb-4 mb-4">
                                <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest"></div>
                                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Total</div>
                                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Per Stint</div>
                                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Stints</div>
                             </div>
                             <div className="grid grid-cols-4 text-center items-center mb-6">
                                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest text-left pl-4">Lap Details</div>
                                <div className="text-xl font-black text-white">{totalLaps}</div>
                                <div className="text-xl font-black text-white">{lapsPerStint}</div>
                                <div className="text-xl font-black text-white">{stints}</div>
                             </div>
                             <div className="grid grid-cols-4 text-center items-center mb-6">
                                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest text-left pl-4">Fuel (L)</div>
                                <div className="text-xl font-black text-[#3a86ff]">{totalFuelNeeded.toFixed(1)}</div>
                                <div className="text-xl font-black text-[#3a86ff]">{(lapsPerStint * fuelPerLapLiters).toFixed(1)}</div>
                                <div className="text-xl font-black text-[#3a86ff]">-</div>
                             </div>
                             <div className="grid grid-cols-4 text-center items-center">
                                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest text-left pl-4">Energy (%)</div>
                                <div className="text-xl font-black text-[#3a86ff]">{totalEnergyNeeded.toFixed(0)}</div>
                                <div className="text-xl font-black text-[#3a86ff]">{(lapsPerStint * energyPerLapPct).toFixed(0)}</div>
                                <div className="text-xl font-black text-[#3a86ff]">-</div>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. TOP SPEED */}
                {activeMetric === 'Top Speed' && (() => {
                  const spd = stats.deeperAnalytics.topSpeed;
                  return (
                    <div className="flex flex-col gap-6 animate-in fade-in">
                      <div className="grid grid-cols-2 gap-6">
                        <StatCard title="Avg. Max Speed" youVal={spd.avgYou} commVal={spd.avgComm} unit="km/h" lowerIsBetter={false} subLeft="Average maximum speed achieved across all laps." />
                        <StatCard title="Session Max" youVal={spd.maxYou} commVal={spd.maxComm} unit="km/h" lowerIsBetter={false} />
                      </div>
                      
                      {/* Graphe des VMax */}
                      <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-6 shadow-lg h-[300px] flex flex-col">
                        <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2">Weekly Performance Trend</span>
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-6">Community speed growth over time for this track/car combination.</p>
                        <div className="flex-1 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsLine data={spd.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                              <XAxis dataKey="date" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 9}} tickLine={false} axisLine={false} />
                              <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 9}} tickLine={false} axisLine={false} />
                              <RechartsTooltip contentStyle={{backgroundColor: '#121318', border: '1px solid #1f2937', borderRadius: '8px'}} itemStyle={{color: '#fff', fontSize: '12px', fontWeight: 'bold'}} />
                              <Line type="monotone" dataKey="you" name="You" stroke="#3a86ff" strokeWidth={2} dot={{ r: 3, fill: '#121318', strokeWidth: 2 }} activeDot={{ r: 5 }} />
                              <Line type="monotone" dataKey="comm" name="Community" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#121318', strokeWidth: 2 }} activeDot={{ r: 5 }} />
                            </RechartsLine>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>
            ) : (
              <div className="flex-1 bg-[#121318] border border-gray-800/50 rounded-xl flex flex-col items-center justify-center min-h-[400px]">
                <BarChart2 size={32} className="text-gray-600 mb-4" />
                <h3 className="text-lg font-bold text-white mb-1">Select track and car</h3>
                <p className="text-sm text-gray-400">Select a track and a car above to see deeper analytics.</p>
              </div>
            )}
          </div>
        )}

        {/* === TAB 3 : LAP TIMES === */}
        {activeTab === 'LapTimes' && (
          <div className="animate-in fade-in duration-300 flex flex-col gap-6 pb-10">
            <p className="text-xs text-gray-400">Lap times are shown per track — race, qualifying, and practice across online and offline modes.</p>
            
            {/* Legend */}
            <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-4 shadow-lg">
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest block mb-3">Reference data from Ohne Speed's LMU Laptimes Spreadsheet <ArrowUpRight size={10} className="inline"/></span>
              <div className="grid grid-cols-3 gap-y-2 text-xs font-bold">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#3a86ff]"></div><span className="text-[#3a86ff]">Alien</span><span className="text-gray-500 font-medium">{"<"}100.5%</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#3a86ff] opacity-60"></div><span className="text-[#3a86ff] opacity-80">Competitive</span><span className="text-gray-500 font-medium">100.5-101.5%</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#10b981]"></div><span className="text-[#10b981]">Good</span><span className="text-gray-500 font-medium">101.5-103.5%</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#e9c46a]"></div><span className="text-[#e9c46a]">Midpack</span><span className="text-gray-500 font-medium">103.5-105.5%</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div><span className="text-[#f59e0b]">Tail-ender</span><span className="text-gray-500 font-medium">105.5-106.5%</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ef4444]"></div><span className="text-[#ef4444]">Offline</span><span className="text-gray-500 font-medium">{"≥"}106.5%</span></div>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-4 flex flex-col justify-between h-24 shadow-lg">
                <span className="text-[9px] font-bold tracking-widest text-gray-500 uppercase">Sessions with lap times</span>
                <div className="text-3xl font-black text-white italic">{stats.lapTimesData.totalValid}</div>
              </div>
              <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-4 flex flex-col justify-between h-24 shadow-lg">
                <span className="text-[9px] font-bold tracking-widest text-gray-500 uppercase">Tracks with lap times</span>
                <div className="text-3xl font-black text-white italic">{stats.lapTimesData.totalTracks}</div>
              </div>
              <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-4 flex flex-col justify-between h-24 shadow-lg">
                <span className="text-[9px] font-bold tracking-widest text-gray-500 uppercase mb-2">Sessions by type</span>
                <div className="flex justify-between items-center text-xs font-bold text-gray-300"><span className="text-gray-400">Race</span><span>{stats.lapTimesData.byType.race}</span></div>
                <div className="flex justify-between items-center text-xs font-bold text-gray-300"><span className="text-gray-400">Qualifying</span><span>{stats.lapTimesData.byType.qualy}</span></div>
              </div>
              <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-4 flex flex-col justify-between h-24 shadow-lg">
                <span className="text-[9px] font-bold tracking-widest text-gray-500 uppercase mb-2">By session mode</span>
                <div className="flex justify-between items-center text-xs font-bold text-gray-300"><span className="text-gray-400">Online</span><span>{stats.lapTimesData.byMode.online}</span></div>
                <div className="flex justify-between items-center text-xs font-bold text-gray-300"><span className="text-gray-400">Offline</span><span>{stats.lapTimesData.byMode.offline}</span></div>
              </div>
            </div>

            {/* Lap Times by Category */}
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Lap Times by Category</h2>
              <p className="text-xs text-gray-400 mb-4">Session volume and average reference pace per car class.</p>
              <div className="bg-[#121318] border border-gray-800/50 rounded-xl overflow-hidden">
                <div className="grid grid-cols-4 p-4 border-b border-gray-800/50 text-[9px] font-black tracking-widest text-gray-500 uppercase">
                  <div>Category</div>
                  <div className="text-center">Sessions</div>
                  <div className="text-center">Tracks</div>
                  <div className="text-right">Avg % vs Reference</div>
                </div>
                {stats.lapTimesData.byCategory.map((row: any, i: number) => (
                  <div key={i} className="grid grid-cols-4 p-4 border-b border-gray-800/30 text-sm font-bold items-center hover:bg-[#1a1b26] transition-colors last:border-0">
                    <div><span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase border ${getClassColor(row.category)}`}>{row.category}</span></div>
                    <div className="text-center text-gray-300">{row.sessions}</div>
                    <div className="text-center text-gray-300">{row.tracks}</div>
                    <div className="text-right font-mono font-bold" style={{ color: row.colorRef }}>{row.avgRef}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lap Times by Track (Expandable Graph) */}
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Lap Times by Track</h2>
              <p className="text-xs text-gray-400 mb-4">Expand a row to see lap time evolution and consistency stats.</p>
              <div className="bg-[#121318] border border-gray-800/50 rounded-xl overflow-hidden flex flex-col">
                <div className="grid grid-cols-9 p-4 border-b border-gray-800/50 text-[9px] font-black tracking-widest text-gray-500 uppercase">
                  <div className="col-span-2">Track</div>
                  <div className="text-center">Races</div>
                  <div className="text-center">Qualifying</div>
                  <div className="text-center">Practice</div>
                  <div className="text-center">Online Best</div>
                  <div className="text-center">Offline Best</div>
                  <div className="text-center">Offline Δ</div>
                  <div className="text-center">Overall Best</div>
                  <div className="text-right">Sessions</div>
                </div>
                {stats.lapTimesData.byTrack.map((row: any, i: number) => {
                  const isExpanded = expandedTrack === row.track;
                  // Préparation des données du Graphique
                  const chartData = row.sessionList.map((s: any) => {
                    const timeToSecs = (t: string) => { if (!t || t === '--:--.---') return null; const [m, sec] = t.split(':'); return parseInt(m) * 60 + parseFloat(sec); };
                    return {
                      date: s.date,
                      qualifying: s.type.toUpperCase().includes('QUALIFY') ? timeToSecs(s.best) : null,
                      race: s.type.toUpperCase().includes('RACE') ? timeToSecs(s.best) : null,
                      car: s.car,
                      mode: s.mode,
                      rawTime: s.best
                    };
                  });

                  return (
                    <div key={i} className="flex flex-col border-b border-gray-800/30 last:border-0">
                      <div onClick={() => setExpandedTrack(isExpanded ? null : row.track)} className="grid grid-cols-9 p-4 text-sm font-bold items-center hover:bg-[#1a1b26] cursor-pointer transition-colors">
                        <div className="col-span-2 flex items-center gap-2 text-white"><ChevronRight size={14} className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}/><CountryFlag code={getTrackCountryCode(row.track)} /> <span className="truncate">{row.track}</span></div>
                        <div className="text-center text-gray-200 font-mono">{row.races}</div>
                        <div className="text-center text-gray-200 font-mono">{row.qualy}</div>
                        <div className="text-center text-gray-500 font-mono">{row.practice}</div>
                        <div className="text-center text-gray-200 font-mono">{row.onlineBest}</div>
                        <div className="text-center text-gray-500 font-mono">{row.offlineBest}</div>
                        <div className="text-center text-gray-500 font-mono">{row.offlineDelta}</div>
                        <div className="text-center text-white font-mono">{row.overallBest}</div>
                        <div className="text-right text-gray-400">{row.sessions}</div>
                      </div>
                      
                      {/* LE GRAPHIQUE DÉROULANT MYLMU */}
                      {isExpanded && (
                        <div className="bg-[#0f1015] p-6 border-t border-gray-800/30 shadow-inner flex flex-col gap-6">
                          <div className="flex items-center gap-3 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                            Dot color = session mode <span className="flex items-center gap-1 text-gray-300"><div className="w-2 h-2 rounded-full bg-[#3a86ff]"></div> Online</span> <span className="flex items-center gap-1 text-gray-300"><div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div> Offline</span>
                          </div>
                          <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsLine data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis dataKey="date" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} />
                                <YAxis domain={['auto', 'auto']} stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(v) => { const m=Math.floor(v/60); const s=(v%60).toFixed(3); return `${m}:${s.padStart(6,'0')}`; }} />
                                <RechartsTooltip 
                                  content={({ active, payload }: any) => {
                                    if (active && payload && payload.length) {
                                      const pData = payload[0].payload;
                                      return (
                                        <div className="bg-[#121318]/95 backdrop-blur-md border border-gray-700 rounded-xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 min-w-[200px]">
                                          <div className="text-gray-400 text-[10px] font-bold mb-2">{pData.date}</div>
                                          <div className="flex items-center gap-2 text-white font-bold text-sm mb-3"><CarFront size={14} className="text-gray-500"/> {pData.car}</div>
                                          <div className="flex flex-col gap-1 text-xs">
                                            {pData.race && <div className="text-gray-300">Races</div>}
                                            {pData.qualifying && <div className="text-gray-300">Qualifying</div>}
                                            <div className="text-gray-400">Lap Time: <span className="text-white font-mono font-bold ml-1">{pData.rawTime}</span></div>
                                            <div className="text-gray-400">{pData.mode}</div>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }} 
                                  cursor={{ stroke: '#4a4d65', strokeWidth: 1, strokeDasharray: '3 3' }} 
                                />
                                <Line type="monotone" dataKey="qualifying" name="Qualifying" stroke="#8338ec" strokeWidth={2} connectNulls dot={{ r: 4, strokeWidth: 2, fill: '#121318' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="race" name="Races" stroke="#ef4444" strokeWidth={2} connectNulls dot={{ r: 4, strokeWidth: 2, fill: '#121318' }} activeDot={{ r: 6 }} />
                              </RechartsLine>
                            </ResponsiveContainer>
                          </div>
                          
                          {/* Stats sous le graph */}
                          <div className="grid grid-cols-4 pt-4 border-t border-gray-800/50">
                            <div className="flex flex-col"><span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">Personal Best</span><span className="text-base font-black text-white font-mono">{row.overallBest}</span></div>
                            <div className="flex flex-col"><span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">Average Lap</span><span className="text-base font-black text-white font-mono">{row.calculatedAvgLap}</span></div>
                            <div className="flex flex-col"><span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">Std Dev</span><span className="text-base font-black text-white font-mono">{row.calculatedStdDev}</span></div>
                            <div className="flex flex-col"><span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">Within 0.5s of PB</span><span className="text-base font-black text-white font-mono">{row.calculatedConsistency}</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* All Sessions (Cliquables vers SessionDetailView) */}
            <div>
              <h2 className="text-lg font-bold text-white mb-1">All Sessions</h2>
              <p className="text-xs text-gray-400 mb-4">Every session with a recorded best lap, newest first.</p>
              <div className="bg-[#121318] border border-gray-800/50 rounded-xl overflow-hidden">
                <div className="grid grid-cols-6 p-4 border-b border-gray-800/50 text-[9px] font-black tracking-widest text-gray-500 uppercase">
                  <div>Date</div>
                  <div>Track</div>
                  <div>Type</div>
                  <div>Mode</div>
                  <div>Car</div>
                  <div className="text-right">Lap Time</div>
                </div>
                {stats.lapTimesData.allSessions.map((row: any, i: number) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      if (setActiveMenu && setSelectedHistorySession) {
                        setSelectedHistorySession(row);
                        setActiveMenu('Sessions');
                      }
                    }} 
                    className="grid grid-cols-6 p-4 border-b border-gray-800/30 text-sm font-bold items-center hover:bg-[#1a1b26] cursor-pointer transition-colors last:border-0"
                  >
                    <div className="text-gray-400">{row.date}</div>
                    <div className="text-white flex items-center gap-2"><CountryFlag code={getTrackCountryCode(row.track)} /> <span className="truncate">{row.track}</span></div>
                    <div className="text-gray-300">{row.type}</div>
                    <div className="text-gray-400">{row.mode}</div>
                    <div className="text-gray-200 flex items-center gap-2"><CarFront size={14} className="text-gray-600 truncate"/>{row.car}</div>
                    <div className="text-right text-white font-mono">{row.best}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* === TAB 4 : TRACKS === */}
        {activeTab === 'Tracks' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300 pb-10">
            <div className="mb-2">
              <h2 className="text-xl font-black text-white">Track Database</h2>
              <p className="text-sm text-gray-400">Explore your session history across all available circuits</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {LMU_ALL_TRACKS.filter(t => trackNationFilter === 'All Nations' || getTrackCountryCode(t.name) === trackNationFilter).map((t, i) => {
                const trkDetails = getTrackDetails(t.name);
                const isExpanded = expandedTrack === t.name;
                
                // On récupère dynamiquement toutes les sessions roulées sur CE circuit
                const trackSessions = stats?.lapTimesData?.allSessions?.filter((s: any) => s.track === t.name) || [];

                return (
                  <div 
                    key={i} 
                    className={`bg-[#121318] border border-gray-800/50 rounded-xl overflow-hidden transition-all duration-200 ${
                      isExpanded 
                        ? 'col-span-1 md:col-span-2 lg:col-span-3 border-gray-600 shadow-[0_0_30px_rgba(58,134,255,0.1)]' 
                        : 'hover:border-gray-700 hover:bg-[#1a1b26]'
                    }`}
                  >
                    {/* EN-TÊTE DE LA CARTE CIRCUIT */}
                    <div 
                      onClick={() => setExpandedTrack(isExpanded ? null : t.name)}
                      className="p-5 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        {/* Miniature SVG du tracé */}
                        <div className="w-16 h-12 bg-[#1c1e2b] rounded-lg border border-gray-800 flex items-center justify-center shrink-0 p-1">
                          <img 
                            src={trkDetails.images.LAYOUT} 
                            alt={t.name} 
                            className="max-w-full max-h-full object-contain opacity-80"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                        {/* Infos Circuit */}
                        <div className="flex flex-col">
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <CountryFlag code={getTrackCountryCode(t.name)} />
                            {t.name}
                          </h3>
                          <span className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">{trkDetails.location}</span>
                        </div>
                      </div>
                      
                      {/* Compteur de sessions à droite */}
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <span className="text-lg font-black text-white">{trackSessions.length}</span>
                          <span className="block text-[9px] text-gray-500 uppercase tracking-widest">Sessions</span>
                        </div>
                        <ChevronDown size={20} className={`text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white' : ''}`} />
                      </div>
                    </div>

                    {/* CONTENU DÉROULANT : HISTORIQUE DES SESSIONS */}
                    {isExpanded && (
                      <div className="border-t border-gray-800/50 bg-[#0f1015]">
                        {trackSessions.length > 0 ? (
                          <div className="flex flex-col">
                            {/* En-têtes du tableau */}
                            <div className="grid grid-cols-6 p-4 border-b border-gray-800/50 text-[9px] font-black tracking-widest text-gray-500 uppercase bg-[#0a0a0f]">
                              <div className="pl-2">Date</div>
                              <div>Type</div>
                              <div>Mode</div>
                              <div>Car</div>
                              <div className="text-center">Laps</div>
                              <div className="text-right pr-2">Best Lap</div>
                            </div>
                            
                            {/* Liste des sessions cliquables */}
                            <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                              {trackSessions.map((session: any, idx: number) => (
                                <div 
                                  key={idx}
                                  onClick={(e) => {
                                    e.stopPropagation(); // Évite de refermer la carte circuit
                                    // Redirection vers Analytics > Vue détaillée (comme l'onglet All Sessions)
                                    if (setActiveMenu && setSelectedHistorySession) {
                                      setSelectedHistorySession(session);
                                      setActiveMenu('Sessions');
                                    }
                                  }}
                                  className="grid grid-cols-6 p-4 border-b border-gray-800/30 text-sm font-bold items-center hover:bg-[#1c1e2b] cursor-pointer transition-colors last:border-0 group"
                                >
                                  <div className="text-gray-400 text-xs pl-2 group-hover:text-white transition-colors">{session.date}</div>
                                  <div>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${session.type?.toUpperCase().includes('RACE') ? 'bg-red-900/20 text-red-500 border-red-800/50' : 'bg-green-900/20 text-green-500 border-green-800/50'}`}>
                                      {session.type}
                                    </span>
                                  </div>
                                  <div className="text-gray-400 text-xs">{session.mode}</div>
                                  <div className="text-gray-200 text-xs flex items-center gap-2">
                                    <CarFront size={14} className="text-gray-600 shrink-0"/>
                                    <span className="truncate pr-4">{session.car}</span>
                                  </div>
                                  <div className="text-center text-gray-400 font-mono">{session.laps}</div>
                                  <div className="text-right text-white font-mono pr-2 flex items-center justify-end gap-3">
                                    {session.best}
                                    <ChevronRight size={14} className="text-gray-600 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="p-12 flex flex-col items-center justify-center opacity-40">
                            <MapPin size={32} className="text-gray-500 mb-3" />
                            <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">No sessions recorded on this track yet</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};


export default AnalyticsView;