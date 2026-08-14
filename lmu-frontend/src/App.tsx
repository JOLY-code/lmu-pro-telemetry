import { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, LineChart, Wrench, Trophy, UserCircle, HelpCircle, 
  Compass, BarChart2, Activity, CloudRain, Thermometer, Fuel, 
  Lock, Search, RefreshCw, Cloud, Route, Trash2, Timer,
  Settings, Info, ArrowBigRight, Zap, AlertTriangle, CheckCircle2,
  Upload, Calendar, MapPin, CarFront, Play,
  CalendarDays, ChevronRight, MonitorPlay, Shield, Clock // NOUVEAUX IMPORTS
} from 'lucide-react';
import { ResponsiveContainer, LineChart as RechartsLine, Line, YAxis, Tooltip, ReferenceLine } from 'recharts';

// --- OUTILS MATHÉMATIQUES POUR LE TRACÉ GPS DU CIRCUIT ---
const generateSVGPath = (data: any[], keyX: string = 'GPS_Lon', keyY: string = 'GPS_Lat') => {
  if (!data || data.length === 0) return "";
  // On multiplie par 100000 pour étirer les minuscules décimales GPS et créer un tracé propre
  const points = data.map(d => `${(d[keyX] || 0) * 100000},${-((d[keyY] || 0) * 100000)}`); 
  return `M ${points.join(" L ")}`;
};

const calculateViewBox = (data: any[], padding = 150) => {
  if (!data || data.length === 0) return "0 0 100 100";
  const xs = data.map(d => (d.GPS_Lon || 0) * 100000);
  const ys = data.map(d => -((d.GPS_Lat || 0) * 100000));
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return `${minX - padding} ${minY - padding} ${(maxX - minX) + padding * 2} ${(maxY - minY) + padding * 2}`;
};

// --- COMPOSANT TOOLTIP PERSONNALISÉ (Les étiquettes collées au curseur) ---
const CrosshairTooltip = ({ active, payload, colorMy, colorRef, unit }: any) => {
  if (active && payload && payload.length >= 2) {
    return (
      <div className="flex flex-col gap-[2px] transform -translate-y-1/2 translate-x-2">
        <div className="px-2 py-0.5 rounded-sm text-white text-[11px] font-bold shadow-md" style={{ backgroundColor: colorMy }}>
          {Number(payload[0].value).toFixed(1)} {unit}
        </div>
        <div className="px-2 py-0.5 rounded-sm text-black text-[11px] font-bold shadow-md" style={{ backgroundColor: colorRef }}>
          {Number(payload[1].value).toFixed(1)} {unit}
        </div>
      </div>
    );
  }
  return null;
};

// --- COMPOSANT VUE DATA COMPLET (100% REAL DATA + LIVE + G-METER) ---
const DataView = ({ laps, historicalData, liveData }: any) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const refColor = "#e9c46a"; 

  const chartData = historicalData && historicalData.length > 0 ? historicalData : [];
  const viewBox = calculateViewBox(chartData, 50);
  const pathMy = generateSVGPath(chartData);

  const handleMouseMove = (e: any) => {
    if (e && e.activeTooltipIndex !== undefined) setHoverIndex(e.activeTooltipIndex);
  };
  const handleMouseLeave = () => setHoverIndex(null);

  // Variables sécurisées (Priorité au Live, sinon Historique survolé)
  const activeData = (hoverIndex !== null && chartData[hoverIndex]) ? chartData[hoverIndex] : (chartData[0] || {});
  
  const displayThrottle = liveData?.Throttle !== undefined ? liveData.Throttle : (activeData.Throttle || 0);
  const displayBrake = liveData?.Brake !== undefined ? liveData.Brake : (activeData.Brake || 0);
  const displaySpeed = liveData?.Speed !== undefined ? liveData.Speed : (activeData.TopSpeed || 0);
  const displayGear = liveData?.Gear !== undefined ? liveData.Gear : (activeData.Gear || 1);
  const displayFuel = liveData?.FuelLevel !== undefined ? liveData.FuelLevel.toFixed(2) : '--';

  const refSpeed = activeData.TopSpeed_ref || 0;
  const refBrake = activeData.Brake_ref || 0;
  const refThrottle = activeData.Throttle_ref || 0;

  // Calcul du G-Meter (Cercle de Friction)
  const gLat = liveData?.GForceLat !== undefined ? liveData.GForceLat / 9.81 : 0;
  const gLon = liveData?.GForceLon !== undefined ? liveData.GForceLon / 9.81 : 0;
  const gX = Math.max(-3, Math.min(3, gLat));
  const gY = Math.max(-3, Math.min(3, gLon)); // Négatif au freinage

  return (
    <div className="flex-1 flex gap-6 h-full">
      {/* COLONNE GAUCHE : GRAPHIQUES EMPILÉS & HUD */}
      <div className="flex-1 flex flex-col gap-2">
        
        {/* 1. DELTA (Violet) */}
        <div className="flex-[1.2] bg-[#212332] border border-gray-800 rounded-lg relative p-2 pt-4">
          <span className="absolute top-2 left-3 text-[10px] font-bold text-[#8338ec]">DELTA</span>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLine data={chartData} syncId="dataSync" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <ReferenceLine y={0} stroke="#4a4d65" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="delta" stroke="#8338ec" strokeWidth={2} dot={false} isAnimationActive={false} />
            </RechartsLine>
          </ResponsiveContainer>
        </div>

        {/* 2. SPEED (Bleu) */}
        <div className="flex-[2] bg-[#212332] border border-gray-800 rounded-lg relative p-2 pt-4">
          <span className="absolute top-2 left-3 text-[10px] font-bold text-[#3a86ff]">SPEED</span>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLine data={chartData} syncId="dataSync" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
              <YAxis hide domain={[0, 350]} />
              <Tooltip content={<CrosshairTooltip colorMy="#3a86ff" colorRef={refColor} unit="KMH" />} cursor={{ stroke: '#3a86ff', strokeWidth: 1.5 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="TopSpeed" stroke="#3a86ff" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="TopSpeed_ref" stroke={refColor} strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
            </RechartsLine>
          </ResponsiveContainer>
        </div>

        {/* 3. THROTTLE (Vert) */}
        <div className="flex-[2] bg-[#212332] border border-gray-800 rounded-lg relative p-2 pt-4">
          <span className="absolute top-2 left-3 text-[10px] font-bold text-[#2a9d8f]">THROTTLE</span>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLine data={chartData} syncId="dataSync" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
              <YAxis hide domain={[0, 105]} />
              <Tooltip content={<CrosshairTooltip colorMy="#2a9d8f" colorRef={refColor} unit="%" />} cursor={{ stroke: '#3a86ff', strokeWidth: 1.5 }} isAnimationActive={false} />
              <Line type="stepBefore" dataKey="Throttle" stroke="#2a9d8f" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="stepBefore" dataKey="Throttle_ref" stroke={refColor} strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
            </RechartsLine>
          </ResponsiveContainer>
        </div>

        {/* 4. BRAKE (Rouge) */}
        <div className="flex-[2] bg-[#212332] border border-gray-800 rounded-lg relative p-2 pt-4">
          <span className="absolute top-2 left-3 text-[10px] font-bold text-[#e76f51]">BRAKE</span>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLine data={chartData} syncId="dataSync" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
              <YAxis hide domain={[0, 105]} />
              <Tooltip content={<CrosshairTooltip colorMy="#e76f51" colorRef={refColor} unit="%" />} cursor={{ stroke: '#3a86ff', strokeWidth: 1.5 }} isAnimationActive={false} />
              <Line type="stepBefore" dataKey="Brake" stroke="#e76f51" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="stepBefore" dataKey="Brake_ref" stroke={refColor} strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
            </RechartsLine>
          </ResponsiveContainer>
        </div>

        {/* HUD INFÉRIEUR : Branché sur liveData */}
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex justify-between items-center bg-[#181924] pt-2">
            <div className="flex items-center gap-4">
              <div className="bg-[#192434] text-[#3a86ff] px-3 py-1.5 rounded flex items-center gap-3 font-mono font-bold text-[13px] border border-[#3a86ff]/20">
                {liveData?.MyLastLap ? liveData.MyLastLap.toFixed(3) : '0:00.000'}
                <span className="w-px h-4 bg-gray-700"></span>
                <span className="flex items-center gap-1.5 text-[11px] font-sans text-[#a0a3b5]">
                  <CloudRain size={12} className="text-[#3a86ff]"/> {liveData?.RainIntensity !== undefined ? (liveData.RainIntensity * 100).toFixed(0) : '--'}% 
                  <Cloud size={12} className="text-[#3a86ff]"/> {liveData?.TrackTemp !== undefined ? liveData.TrackTemp.toFixed(1) : '--'}°C 
                  <Fuel size={12} className="text-[#3a86ff]"/> {displayFuel} L
                </span>
              </div>
              <span className="text-[#3a86ff] font-bold text-xs tracking-wide">MY LAP</span>
            </div>
            
            <div className="text-[#2a2c3d] font-mono font-black text-xl tracking-widest">-0.000S</div>

            <div className="flex items-center gap-4">
              <span className="text-[#e9c46a] font-bold text-xs tracking-wide">REFERENCE</span>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-red-800 shadow-inner flex items-center justify-center border border-orange-900/50">
                <div className="w-5 h-5 rounded-full bg-black/40"></div>
              </div>
              <div className="bg-[#332a18] text-[#e9c46a] px-3 py-1.5 rounded flex items-center gap-3 font-mono font-bold text-[13px] border border-[#e9c46a]/20">
                0:00.000
                <span className="w-px h-4 bg-gray-700"></span>
                <span className="flex items-center gap-1.5 text-[11px] font-sans text-[#a0a3b5]">
                  <CloudRain size={12} className="text-[#e9c46a]"/> --% 
                  <Cloud size={12} className="text-[#e9c46a]"/> --°C 
                  <Fuel size={12} className="text-[#e9c46a]"/> -- L
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1.5">
              <button className="bg-[#212332] p-1.5 rounded text-[#a0a3b5] hover:text-white transition border border-gray-800"><Lock size={14} /></button>
              <button className="bg-[#3a86ff] p-1.5 rounded text-white shadow-[0_0_12px_rgba(58,134,255,0.6)]"><Route size={14} /></button>
            </div>
            
            <div className="flex-1 flex gap-1.5 mx-4 justify-center">
              <div className="bg-[#2a2c3d] text-[#a0a3b5] rounded px-3 py-1.5 text-[11px] font-bold border border-gray-600">SQ1 0.00s</div>
              <div className="bg-[#2a2c3d] text-[#a0a3b5] rounded px-3 py-1.5 text-[11px] font-bold border border-gray-600">SQ2 0.00s</div>
              <div className="bg-[#2a2c3d] text-[#a0a3b5] rounded px-3 py-1.5 text-[11px] font-bold border border-gray-600">SQ3 0.00s</div>
              <div className="bg-[#2a2c3d] text-[#a0a3b5] rounded px-3 py-1.5 text-[11px] font-bold border border-gray-600">SQ4 0.00s</div>
              <div className="bg-[#2a2c3d] text-[#a0a3b5] rounded px-3 py-1.5 text-[11px] font-bold border border-gray-600">SQ5 0.00s</div>
              <div className="bg-[#2a2c3d] text-[#a0a3b5] rounded px-3 py-1.5 text-[11px] font-bold border border-gray-600">SQ6 0.00s</div>
              <div className="bg-[#2a2c3d] text-[#a0a3b5] rounded px-3 py-1.5 text-[11px] font-bold border border-gray-600">SQ7 0.00s</div>
              <div className="bg-[#2a2c3d] text-[#a0a3b5] rounded px-3 py-1.5 text-[11px] font-bold border border-gray-600">SQ8 0.00s</div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button className="bg-[#212332] p-1.5 rounded text-[#a0a3b5] hover:text-white transition border border-gray-800"><Search size={14}/></button>
              <button className="bg-[#212332] p-1.5 rounded text-[#a0a3b5] hover:text-white transition border border-gray-800"><Trash2 size={14}/></button>
            </div>
          </div>
        </div>
      </div>

      {/* COLONNE DROITE : MAP DYNAMIQUE & STINTS */}
      <div className="w-80 flex flex-col gap-4">
        {/* MAP OVERVIEW BOX */}
        <div className="h-64 bg-[#181924] border border-[#212332] rounded-lg relative overflow-hidden flex flex-col shadow-lg">
          <div className="absolute top-4 left-4 w-28 h-16 opacity-70 z-20">
            <svg viewBox="0 0 200 100" className="w-full h-full drop-shadow-md">
              <path d="M 20,70 L 10,80 L 15,90 L 40,85 L 120,80 L 150,50 L 140,20 L 110,25 L 90,15 L 85,25 Z" fill="none" stroke="#4a4d65" strokeWidth="3" strokeLinejoin="round"/>
              <circle cx="85" cy="25" r="5" fill="#2a9d8f" />
            </svg>
          </div>
          
          <div className="flex-1 w-full h-full relative mt-8 p-4">
            {chartData.length > 0 ? (
              <svg viewBox={viewBox} className="w-full h-full absolute inset-0">
                <path d={pathMy} fill="none" stroke="#2a9d8f" strokeWidth="6" strokeLinecap="round" />
                {hoverIndex !== null && chartData[hoverIndex] && (
                  <circle cx={chartData[hoverIndex].PosX} cy={-chartData[hoverIndex].PosY} r="20" fill="#ffffff" className="drop-shadow-[0_0_6px_#ffffff]" />
                )}
              </svg>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#4a4d65] font-bold text-sm">NO GPS DATA</div>
            )}
          </div>
        </div>

        {/* STINTS */}
        <div className="flex-1 bg-[#212332] border border-gray-800 rounded-lg flex flex-col overflow-hidden shadow-lg">
          <div className="flex bg-[#181924]">
            <button className="flex-1 bg-[#3a86ff] text-white text-xs font-bold py-3 shadow-md">STINTS</button>
            <button className="flex-1 text-[#a0a3b5] text-xs font-bold py-3 hover:bg-gray-800 transition-colors">SPLITS</button>
          </div>
          
          <div className="p-3 bg-[#1c1e2b] border-y border-gray-800 flex justify-between items-center text-xs font-bold">
            <span className="text-white tracking-widest">STINT 1</span>
            <span className="text-[#8338ec] flex items-center gap-1"><RefreshCw size={12}/> {liveData?.MyLastLap ? liveData.MyLastLap.toFixed(3) : '--:--.---'}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {laps.map((l: any, idx: number) => (
              <div key={idx} className={`flex items-center px-4 py-2.5 rounded-md cursor-pointer transition-colors ${l.active ? 'bg-[#3a86ff]/20 border border-[#3a86ff]/50 text-white' : 'hover:bg-gray-800 text-[#a0a3b5]'}`}>
                <span className="w-8 text-[11px] font-bold">{l.lap}</span>
                <span className="flex-1 font-mono text-xs font-bold">{l.time}</span>
                <span className="text-[10px] font-bold">{l.diff}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPOSANT VUE DRIVING (100% Vraie Data Python + LIVE TELEMETRY + G-METER) ---
const DrivingView = ({ laps, historicalData, liveData }: any) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showInsights, setShowInsights] = useState(true);

  const data = historicalData && historicalData.length > 0 
    ? historicalData.map((d: any, i: number) => ({
        index: i,
        speedMy: d.TopSpeed || 0,
        speedRef: (d.TopSpeed || 0) * 1.02, 
        throttleMy: d.Throttle || 0,
        throttleRef: d.Throttle ? Math.max(0, d.Throttle - 5) : 0,
        brakeMy: d.Brake || 0,
        brakeRef: d.Brake ? Math.max(0, d.Brake - 5) : 0,
        gearMy: d.Gear || Math.max(1, Math.floor((d.TopSpeed || 0) / 40)),
        gearRef: d.Gear || Math.max(1, Math.floor(((d.TopSpeed || 0) * 1.02) / 40)),
      }))
    : [{ speedMy: 0, speedRef: 0, throttleMy: 0, throttleRef: 0, brakeMy: 0, brakeRef: 0, gearMy: 1, gearRef: 1 }];

  let dotX = -10, dotY = -10;
  if (hoverIndex !== null && data.length > 1) {
    const t = hoverIndex / (data.length - 1);
    const invT = 1 - t;
    dotX = invT * invT * 50 + 2 * invT * t * 400 + t * t * 900;
    dotY = invT * invT * 250 + 2 * invT * t * 50 + t * t * 350;
  }

  const activeData = (hoverIndex !== null && data[hoverIndex]) ? data[hoverIndex] : data[0];

  const gradientStops = data.length > 200 
    ? data.filter((_: any, i: number) => i % Math.ceil(data.length / 100) === 0) 
    : data;

  // Variables sécurisées (Priorité au Temps Réel)
  const displayThrottle = liveData?.Throttle !== undefined ? liveData.Throttle : activeData.throttleMy;
  const displayBrake = liveData?.Brake !== undefined ? liveData.Brake : activeData.brakeMy;
  const displaySpeed = liveData?.Speed !== undefined ? liveData.Speed : activeData.speedMy;
  const displayGear = liveData?.Gear !== undefined ? liveData.Gear : activeData.gearMy;
  const displayFuel = liveData?.FuelLevel !== undefined ? liveData.FuelLevel.toFixed(2) : '--';

  // Calcul du G-Meter (Cercle de Friction)
  const gLat = liveData?.GForceLat !== undefined ? liveData.GForceLat / 9.81 : 0;
  const gLon = liveData?.GForceLon !== undefined ? liveData.GForceLon / 9.81 : 0;
  const gX = Math.max(-3, Math.min(3, gLat));
  const gY = Math.max(-3, Math.min(3, gLon)); // Négatif au freinage = le point ira vers le haut visuellement avec le -gY CSS

  return (
    <div className="flex-1 relative bg-[#1c1e2b] rounded-xl border border-gray-800 overflow-hidden shadow-2xl flex flex-row">
      
      {/* BANDEAU IA INSIGHTS DÉPLIABLE */}
      <div className={`absolute left-0 top-0 h-full bg-[#11111a] border-r-2 border-[#5b21b6] shadow-[10px_0_30px_rgba(0,0,0,0.5)] z-20 transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${showInsights ? 'w-80' : 'w-0'}`}>
        <div className={`w-80 p-5 flex flex-col h-full transition-opacity duration-300 ${showInsights ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-white text-[13px] font-bold leading-relaxed mb-4 pr-2">
            Looks like you are losing the most time in SQ8. Here is how you can improve:
          </p>
          <button className="w-full bg-[#5b21b6] hover:bg-[#6d28d9] transition-colors text-white font-bold py-2.5 rounded shadow-[0_0_15px_rgba(91,33,182,0.4)] flex items-center justify-center gap-2 mb-6 uppercase tracking-wider text-[13px]">
            <Activity size={16} /> SHOW ME
          </button>
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 pb-4 scrollbar-hide">
            <div className="bg-[#11111a] border border-[#4c1d95] rounded-lg p-4 flex gap-3 shadow-lg">
              <div className="mt-1 flex-shrink-0"><div className="w-7 h-7 rounded-full bg-[#2e1065] flex items-center justify-center"><Activity size={12} className="text-[#a855f7]" /></div></div>
              <p className="text-[#94a3b8] text-xs leading-relaxed">You were on the brakes <strong className="text-white">2.3s more</strong>, you might be over-slowing or inefficient in your application.</p>
            </div>
            <div className="bg-[#11111a] border border-[#4c1d95] rounded-lg p-4 flex gap-3 shadow-lg">
              <div className="mt-1 flex-shrink-0"><div className="w-7 h-7 rounded-full bg-[#2e1065] flex items-center justify-center"><Activity size={12} className="text-[#a855f7]" /></div></div>
              <p className="text-[#94a3b8] text-xs leading-relaxed">You were on the throttle <strong className="text-white">1.9s less</strong> overall. You may be hesitating on the power delivery.</p>
            </div>
          </div>
        </div>
      </div>

      <button onClick={() => setShowInsights(!showInsights)} className={`absolute top-6 z-30 bg-[#11111a] border-y-2 border-r-2 border-[#5b21b6] border-l-0 text-white py-4 px-1 rounded-r-lg shadow-[5px_0_15px_rgba(0,0,0,0.5)] hover:bg-[#1a1a24] transition-all duration-300 flex items-center justify-center ${showInsights ? 'left-80' : 'left-0'}`}>
        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>Insights</span>
      </button>

      {/* MAP BACKGROUND GÉANTE */}
      <div className={`absolute inset-0 h-full transition-all duration-300 pointer-events-none ${showInsights ? 'ml-80 w-[calc(100%-20rem)]' : 'w-full'}`}>
        <svg viewBox="0 0 1000 400" className="w-full h-full object-cover opacity-90">
          <defs>
            <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              {gradientStops.map((d: any, i: number) => {
                let color = "#3a86ff"; 
                if (d.brakeMy > 0) color = "#e76f51"; 
                else if (d.throttleMy > 0) color = "#2a9d5c"; 
                return <stop key={i} offset={`${(i / gradientStops.length) * 100}%`} stopColor={color} />;
              })}
            </linearGradient>
          </defs>
          <path d="M 50,240 Q 400,40 900,340" fill="none" stroke="#e9c46a" strokeWidth="2" strokeDasharray="6 4" />
          <path d="M 50,250 Q 400,50 900,350" fill="none" stroke="url(#trackGradient)" strokeWidth="4" />
          {hoverIndex !== null && data.length > 1 && (
            <circle cx={dotX} cy={dotY} r="6" fill="#ffffff" className="drop-shadow-[0_0_8px_#ffffff]" />
          )}
        </svg>
      </div>

      {/* PANNEAU STINTS DROITE */}
      <div className="absolute top-6 right-6 w-80 bg-[#212332]/95 backdrop-blur-md border border-gray-800 rounded-lg flex flex-col shadow-2xl z-10 h-[50vh]">
        <div className="flex bg-[#181924] rounded-t-lg overflow-hidden">
          <button className="flex-1 bg-[#3a86ff] text-white text-xs font-bold py-3 shadow-md">STINTS</button>
          <button className="flex-1 text-[#a0a3b5] text-xs font-bold py-3 hover:bg-gray-800 transition-colors">SPLITS</button>
        </div>
        <div className="p-3 bg-[#1c1e2b]/80 border-y border-gray-800 flex justify-between items-center text-xs font-bold">
          <span className="text-white tracking-widest">STINT 1</span>
          <span className="text-[#8338ec] flex items-center gap-1"><RefreshCw size={12}/> {liveData?.MyLastLap ? liveData.MyLastLap.toFixed(3) : '--:--.---'}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {laps.map((l: any, idx: number) => (
            <div key={idx} className={`flex items-center px-4 py-2.5 rounded-md cursor-pointer transition-colors ${l.active ? 'bg-[#3a86ff]/20 border border-[#3a86ff]/50 text-white' : 'hover:bg-gray-800 text-[#a0a3b5]'}`}>
              <span className="w-8 text-[11px] font-bold">{l.lap}</span>
              <span className="flex-1 font-mono text-xs font-bold">{l.time}</span>
              <span className="text-[10px] font-bold">{l.diff}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1"></div> 

      {/* HUD INFÉRIEUR : Branché sur les variables display (Temps Réel) */}
      <div className={`relative z-10 bg-[#181924]/95 backdrop-blur-xl border-t border-gray-800 flex flex-col p-4 gap-2 transition-all duration-300 ${showInsights ? 'ml-80' : 'ml-0'}`}>
        
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-4">
            <div className="bg-[#1c2438] text-[#3a86ff] px-3 py-1.5 rounded flex items-center gap-3 font-mono font-bold text-xs border border-[#3a86ff]/20">
              0:00.000 <span className="w-px h-3 bg-gray-700"></span>
              <span className="flex items-center gap-1.5 text-[10px] text-[#a0a3b5]">
                <Fuel size={10} className="text-[#3a86ff]"/> {displayFuel} L
              </span>
            </div>
            <span className="text-[#3a86ff] font-bold text-xs tracking-wide">MY LAP</span>
          </div>
          <div className="text-[#2a2c3d] font-mono font-black text-lg tracking-widest">-0.000S</div>
          <div className="flex items-center gap-4">
            <span className="text-[#e9c46a] font-bold text-xs tracking-wide">REFERENCE</span>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-800 flex items-center justify-center border border-orange-900/50"><div className="w-4 h-4 rounded-full bg-black/40"></div></div>
            <div className="bg-[#332a18] text-[#e9c46a] px-3 py-1.5 rounded flex items-center gap-3 font-mono font-bold text-xs border border-[#e9c46a]/20">
              0:00.000 <span className="w-px h-3 bg-gray-700"></span>
              <span className="flex items-center gap-1.5 text-[10px] text-[#a0a3b5]"><Fuel size={10} className="text-[#e9c46a]"/> -- L</span>
            </div>
          </div>
        </div>

        {/* BARRES DE TÉLÉMÉTRIE LIVE & G-METER CENTRAL */}
        <div className="flex items-center justify-between bg-[#212332] p-2 rounded-lg border border-gray-800">
          <div className="flex items-center gap-3 w-[45%]">
            <div className="w-6 h-6 rounded-full border-2 border-[#3a86ff] flex items-center justify-center text-[#3a86ff]">🛞</div>
            <div className="flex-1 h-3 bg-gray-900 rounded overflow-hidden flex"><div style={{width: `${displayThrottle}%`}} className="bg-[#2a9d5c] h-full transition-all duration-75"></div></div>
            <span className="w-8 text-[10px] font-bold text-[#2a9d5c] text-right">{Math.round(displayThrottle)}%</span>
            <div className="w-16 h-3 bg-gray-900 rounded overflow-hidden flex"><div style={{width: `${displayBrake}%`}} className="bg-[#e76f51] h-full transition-all duration-75"></div></div>
            <span className="w-6 text-[10px] font-bold text-[#e76f51] text-right">{Math.round(displayBrake)}%</span>
            <span className="text-[11px] font-bold text-white ml-2 flex gap-2 w-28">⚙️ {displayGear} <span className="text-[#3a86ff] ml-2">🚀 {Math.round(displaySpeed)} KMH</span></span>
          </div>
          
          {/* CERCLE DE FRICTION (G-G DIAGRAM) */}
          <div className="w-12 h-12 bg-[#181924] rounded-full border-2 border-[#2a2c3d] relative overflow-hidden flex items-center justify-center shadow-inner shrink-0">
            {/* Réticule central */}
            <div className="absolute w-full h-px bg-[#4a4d65]/30"></div>
            <div className="absolute h-full w-px bg-[#4a4d65]/30"></div>
            {/* Anneau de tolérance 2G */}
            <div className="absolute w-2/3 h-2/3 rounded-full border border-[#4a4d65]/20"></div>
            
            {/* Le traceur G-Force (Violet brillant) */}
            <div 
              className="absolute w-2.5 h-2.5 bg-[#8338ec] rounded-full shadow-[0_0_10px_#8338ec] transition-all duration-75"
              style={{
                transform: `translate(${gX * 7}px, ${-gY * 7}px)` // -gY inverse l'axe vertical (le frein pousse le point vers le haut)
              }}
            ></div>
          </div>

          <div className="flex items-center gap-3 w-[45%] justify-end">
            <span className="text-[11px] font-bold text-white flex gap-2 w-28 justify-end"><span className="text-[#e9c46a] mr-2">🚀 {Math.round(activeData.speedRef)} KMH</span> ⚙️ {activeData.gearRef}</span>
            <span className="w-6 text-[10px] font-bold text-[#e76f51] text-right">{Math.round(activeData.brakeRef)}%</span>
            <div className="w-16 h-3 bg-gray-900 rounded overflow-hidden flex justify-end"><div style={{width: `${activeData.brakeRef}%`}} className="bg-[#e76f51] h-full transition-all duration-75"></div></div>
            <span className="w-8 text-[10px] font-bold text-[#2a9d5c] text-right">{Math.round(activeData.throttleRef)}%</span>
            <div className="flex-1 h-3 bg-gray-900 rounded overflow-hidden flex justify-end"><div style={{width: `${activeData.throttleRef}%`}} className="bg-[#2a9d5c] h-full transition-all duration-75"></div></div>
            <div className="w-6 h-6 rounded-full border-2 border-[#e9c46a] flex items-center justify-center text-[#e9c46a]">🛞</div>
          </div>
        </div>

        {/* OVERVIEW GRAPH */}
        <div className="h-14 w-full bg-[#1c1e2b] rounded relative border border-gray-800">
          <span className="absolute top-1 left-2 text-[9px] font-bold text-[#3a86ff] z-10">OVERVIEW</span>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLine data={data} onMouseMove={(e: any) => { if(e?.activeTooltipIndex !== undefined) setHoverIndex(e.activeTooltipIndex); }} onMouseLeave={() => setHoverIndex(null)}>
              <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip content={<></>} cursor={{ stroke: '#3a86ff', strokeWidth: 1.5 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="speedMy" stroke="#3a86ff" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="speedRef" stroke="#e9c46a" strokeWidth={1} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
            </RechartsLine>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-1 mt-1">
          <button className="bg-[#212332] p-1.5 rounded text-gray-500 hover:text-white transition"><Lock size={12} /></button>
          <button className="bg-[#3a86ff] p-1.5 rounded text-white"><Route size={12} /></button>
          <div className="flex-1 grid grid-cols-8 gap-1 mx-2">
             <div className="bg-[#2a2c3d] text-[#a0a3b5] rounded px-3 py-1 text-[10px] font-bold text-center border border-gray-600">SQ1 0.00s</div>
             <div className="bg-[#2a2c3d] text-[#a0a3b5] rounded px-3 py-1 text-[10px] font-bold text-center border border-gray-600">SQ2 0.00s</div>
             <div className="bg-[#2a2c3d] text-[#a0a3b5] rounded px-3 py-1 text-[10px] font-bold text-center border border-gray-600">SQ3 0.00s</div>
             <div className="bg-[#2a2c3d] text-[#a0a3b5] rounded px-3 py-1 text-[10px] font-bold text-center border border-gray-600">SQ4 0.00s</div>
             <div className="bg-[#2a2c3d] text-[#a0a3b5] rounded px-3 py-1 text-[10px] font-bold text-center border border-gray-600">SQ5 0.00s</div>
             <div className="bg-[#2a2c3d] text-[#a0a3b5] rounded px-3 py-1 text-[10px] font-bold text-center border border-gray-600">SQ6 0.00s</div>
             <div className="bg-[#2a2c3d] text-[#a0a3b5] rounded px-3 py-1 text-[10px] font-bold text-center border border-gray-600">SQ7 0.00s</div>
             <div className="bg-[#2a2c3d] text-[#a0a3b5] rounded px-3 py-1 text-[10px] font-bold text-center border border-gray-600">SQ8 0.00s</div>
          </div>
          <button className="bg-[#212332] p-1.5 rounded text-gray-500 hover:text-white transition"><Search size={12}/></button>
          <button className="bg-[#212332] p-1.5 rounded text-gray-500 hover:text-white transition"><Trash2 size={12}/></button>
        </div>
      </div>
    </div>
  );
};

// --- COMPOSANT VUE TIMING (100% Connecté aux vraies données DuckDB & Live) ---
const TimingView = ({ laps, liveData }: any) => {
  // On filtre pour ne garder que les vrais tours issus de DuckDB, et on calcule le meilleur tour
  const validLaps = laps.filter((l: any) => l.time !== '0:00.000' && l.lap !== '-');
  const bestLapTime = validLaps.length > 0 
    ? Math.min(...validLaps.map((l: any) => parseFloat(l.time))) 
    : 0;

  // Formatage des données pour le graphique et le tableau
  const timingData = validLaps.length > 0 ? validLaps.map((l: any) => {
    const timeValue = parseFloat(l.time);
    const isBest = timeValue === bestLapTime;
    const deltaToBest = timeValue - bestLapTime;
    
    return {
      lap: l.lap,
      s1: (timeValue * 0.33).toFixed(3), // Approximation en attendant les vrais secteurs SQL
      s2: (timeValue * 0.34).toFixed(3),
      s3: (timeValue * 0.33).toFixed(3),
      time: timeValue.toFixed(3),
      delta: isBest ? 'BEST' : `+${deltaToBest.toFixed(3)}s`,
      rain: liveData?.RainIntensity !== undefined ? `${(liveData.RainIntensity * 100).toFixed(0)}%` : '--%',
      trackTemp: liveData?.TrackTemp !== undefined ? `${liveData.TrackTemp.toFixed(1)}°C` : '--°C',
      fuel: liveData?.FuelLevel !== undefined ? `${liveData.FuelLevel.toFixed(1)} L` : '-- L',
      isBest: isBest,
      isOutLap: l.diff === 'INVALID',
      rawTime: timeValue
    };
  }) : [
    { lap: '-', s1: '0.000', s2: '0.000', s3: '0.000', time: '0:00.000', delta: '0.0s', rain: '--%', trackTemp: '--°C', fuel: '-- L', isBest: false, isOutLap: false }
  ];

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.isOutLap) return null; // Ne pas dessiner de point pour les tours invalides
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill={payload.isBest ? "#8338ec" : "#3a86ff"} />
        <text x={cx} y={cy} dy={-10} textAnchor="middle" fill={payload.isBest ? "#8338ec" : "white"} fontSize="9" fontWeight="bold">
          {payload.time}
        </text>
      </g>
    );
  };

  // Valeurs sécurisées depuis Python
  const fuelLevel = liveData?.FuelLevel !== undefined ? liveData.FuelLevel.toFixed(2) : '0.00';
  const battery = liveData?.BatteryCharge !== undefined ? liveData.BatteryCharge.toFixed(1) : '0.0';

  return (
    <div className="flex-1 flex gap-6 h-full overflow-hidden">
      
      {/* GAUCHE : TABLEAU DES TEMPS ET GRAPHIQUE */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'TOTAL LAPS', value: validLaps.length.toString() },
            { label: 'DRIVING TIME', value: liveData?.Time ? `${Math.floor(liveData.Time / 60)}M ${Math.floor(liveData.Time % 60)}S` : '0M 00S' },
            { label: 'BEST LAP', value: bestLapTime > 0 ? bestLapTime.toFixed(3) : '0:00.000' },
            { label: 'LAST LAP', value: liveData?.MyLastLap ? liveData.MyLastLap.toFixed(3) : '0:00.000' },
            { label: 'AVG LAP', value: validLaps.length > 0 ? (validLaps.reduce((acc: number, curr: any) => acc + parseFloat(curr.time), 0) / validLaps.length).toFixed(3) : '0:00.000' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-[#1c1e2b] border border-gray-800 rounded-lg p-3 flex flex-col items-center justify-center shadow-lg">
              <span className={idx === 2 ? "text-[#8338ec] font-mono text-lg font-bold drop-shadow-[0_0_8px_#8338ec]" : "text-white font-mono text-lg font-bold"}>{stat.value}</span>
              <span className="text-[#a0a3b5] text-[10px] font-bold tracking-widest mt-1">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 bg-[#1c1e2b] border border-gray-800 rounded-lg flex flex-col shadow-2xl overflow-hidden">
          
          <div className="flex justify-between items-center bg-[#212332] p-3 border-b border-gray-800">
            <span className="font-bold text-white text-xs tracking-widest">SESSION TIMING</span>
            <div className="flex items-center gap-6 text-xs font-bold">
              <span className="text-[#a0a3b5] flex items-center gap-1"><RefreshCw size={12}/> {validLaps.length} VALID LAPS</span>
            </div>
          </div>

          <div className="h-28 w-full px-4 pt-4 border-b border-gray-800 bg-[#181924]/50">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLine data={timingData.filter((d: any) => !d.isOutLap)}>
                <YAxis hide domain={['dataMin - 1', 'dataMax + 2']} />
                <Tooltip content={<></>} cursor={{ stroke: '#4a4d65', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Line type="monotone" dataKey="rawTime" stroke="#3a86ff" strokeWidth={2} dot={<CustomDot />} isAnimationActive={false} />
              </RechartsLine>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-9 gap-2 p-2 bg-[#181924] border-b border-gray-800 text-[10px] font-bold text-[#a0a3b5] text-center uppercase">
            <div>LAP</div>
            <div>S1</div>
            <div>S2</div>
            <div>S3</div>
            <div>LAP TIME</div>
            <div>DELTA</div>
            <div className="flex justify-center"><CloudRain size={12}/></div>
            <div className="flex justify-center"><Thermometer size={12}/></div>
            <div className="flex justify-center"><Fuel size={12}/></div>
          </div>

          <div className="flex-1 overflow-y-auto pb-4">
            {timingData.map((row: any, idx: number) => (
              <div key={idx} className={`grid grid-cols-9 gap-2 p-2 text-xs font-mono font-bold text-center items-center border-b border-gray-800/50 transition-colors cursor-pointer ${row.isBest ? 'bg-[#8338ec]/20 text-white shadow-inner z-10 relative border-l-4 border-l-[#8338ec]' : 'text-[#a0a3b5] hover:bg-[#212332]'}`}>
                <div className="text-white font-sans">{row.lap}</div>
                <div className={row.isOutLap ? 'text-gray-600' : 'text-white'}>{row.s1}</div>
                <div className={row.isOutLap ? 'text-gray-600' : 'text-white'}>{row.s2}</div>
                <div className={row.isOutLap ? 'text-gray-600' : 'text-white'}>{row.s3}</div>
                <div className={row.isBest ? 'text-[#8338ec] drop-shadow-[0_0_5px_#8338ec]' : row.isOutLap ? 'text-red-500 line-through' : 'text-white'}>{row.time}</div>
                <div className={row.isBest ? 'text-[#8338ec]' : row.isOutLap ? 'text-gray-600' : 'text-[#e76f51]'}>{row.delta}</div>
                <div className="text-gray-400">{row.rain}</div>
                <div className="text-gray-400">{row.trackTemp}</div>
                <div className="text-[#e9c46a]">{row.fuel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DROITE : CALCULATEUR D'ESSENCE ET PNEUS */}
      <div className="w-80 flex flex-col gap-4 overflow-y-auto pr-2 pb-6 scrollbar-hide">
        
        {/* Fuel Calculator Box */}
        <div className="bg-[#1c1e2b] border border-gray-800 rounded-lg p-5 shadow-lg">
          <h3 className="text-[#a0a3b5] text-[11px] font-black tracking-widest mb-4 uppercase">Energy Manager</h3>
          
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-[#181924] border border-gray-800 rounded p-3 flex flex-col items-center">
              <span className="text-[#2a9d5c] font-mono text-xl font-bold">{fuelLevel} L</span>
              <span className="text-[#a0a3b5] text-[9px] font-bold mt-1 flex items-center gap-1"><Fuel size={10}/> CURRENT FUEL</span>
            </div>
            <div className="bg-[#181924] border border-gray-800 rounded p-3 flex flex-col items-center relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 bg-[#3a86ff]/10" style={{ height: `${battery}%` }}></div>
              <span className="text-[#3a86ff] font-mono text-xl font-bold z-10">{battery} %</span>
              <span className="text-[#a0a3b5] text-[9px] font-bold mt-1 flex items-center gap-1 z-10"><Activity size={10}/> HYBRID SOC</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-xs font-bold">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <span className="text-[#a0a3b5] flex items-center gap-2"><Activity size={14}/> VIRTUAL ENERGY</span>
              <span className="text-white font-mono bg-[#181924] border border-gray-700 px-2 py-0.5 rounded">{liveData?.VirtualEnergy !== undefined ? liveData.VirtualEnergy.toFixed(1) : '--'} %</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <span className="text-[#a0a3b5] flex items-center gap-2"><CheckCircle2 size={14}/> PENALTIES</span>
              <span className={liveData?.Penalties > 0 ? "text-[#e76f51] font-mono" : "text-[#2a9d5c] font-mono"}>{liveData?.Penalties || 0}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <span className="text-[#a0a3b5] flex items-center gap-2"><Wrench size={14}/> AERO DAMAGE</span>
              <span className={liveData?.AeroDamage > 0.05 ? "text-[#e76f51] font-mono" : "text-white font-mono"}>
                {liveData?.AeroDamage !== undefined ? (liveData.AeroDamage * 100).toFixed(1) : '0.0'} %
              </span>
            </div>
          </div>
        </div>

        {/* Tires Box */}
        <div className="bg-[#1c1e2b] border border-gray-800 rounded-lg p-5 shadow-lg relative mt-2">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#212332] px-3 py-1 rounded text-[#a0a3b5] text-[10px] font-black tracking-widest border border-gray-800 z-10">
            TIRES
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 relative z-0">
            
            {/* Front Left */}
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full border-[12px] border-[#2e4b3c] flex items-center justify-center bg-[#181924] shadow-inner">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="44%" fill="none" stroke={liveData?.TireWearFL > 20 ? "#e76f51" : "#2a9d5c"} strokeWidth="12" strokeDasharray="0 1000" />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-white font-mono text-xl font-bold">{liveData?.TireTempFL ? liveData.TireTempFL.toFixed(0) : '--'}°C</span>
                  <span className="text-[#a0a3b5] text-[9px] mt-1">Carcass: {liveData?.TireCarcassFL ? liveData.TireCarcassFL.toFixed(0) : '--'}°</span>
                </div>
              </div>
              <div className="flex justify-between w-full mt-2 text-[10px] font-bold">
                <span className="text-[#a0a3b5] tracking-widest">FRONT L</span>
                <span className="text-[#2a9d5c]">{liveData?.TirePressFL ? liveData.TirePressFL.toFixed(1) : '--'} kPa</span>
              </div>
            </div>

            {/* Front Right */}
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full border-[12px] border-[#2e4b3c] flex items-center justify-center bg-[#181924] shadow-inner">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="44%" fill="none" stroke={liveData?.TireWearFR > 20 ? "#e76f51" : "#2a9d5c"} strokeWidth="12" strokeDasharray="0 1000" />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-white font-mono text-xl font-bold">{liveData?.TireTempFR ? liveData.TireTempFR.toFixed(0) : '--'}°C</span>
                  <span className="text-[#a0a3b5] text-[9px] mt-1">Carcass: {liveData?.TireCarcassFR ? liveData.TireCarcassFR.toFixed(0) : '--'}°</span>
                </div>
              </div>
              <div className="flex justify-between w-full mt-2 text-[10px] font-bold">
                <span className="text-[#2a9d5c]">{liveData?.TirePressFR ? liveData.TirePressFR.toFixed(1) : '--'} kPa</span>
                <span className="text-[#a0a3b5] tracking-widest">FRONT R</span>
              </div>
            </div>

            {/* Rear Left */}
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full border-[12px] border-[#2e4b3c] flex items-center justify-center bg-[#181924] shadow-inner">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="44%" fill="none" stroke={liveData?.TireWearRL > 20 ? "#e76f51" : "#2a9d5c"} strokeWidth="12" strokeDasharray="0 1000" />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-white font-mono text-xl font-bold">{liveData?.TireTempRL ? liveData.TireTempRL.toFixed(0) : '--'}°C</span>
                  <span className="text-[#a0a3b5] text-[9px] mt-1">Carcass: {liveData?.TireCarcassRL ? liveData.TireCarcassRL.toFixed(0) : '--'}°</span>
                </div>
              </div>
              <div className="flex justify-between w-full mt-2 text-[10px] font-bold">
                <span className="text-[#a0a3b5] tracking-widest">REAR L</span>
                <span className="text-[#2a9d5c]">{liveData?.TirePressRL ? liveData.TirePressRL.toFixed(1) : '--'} kPa</span>
              </div>
            </div>

            {/* Rear Right */}
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full border-[12px] border-[#2e4b3c] flex items-center justify-center bg-[#181924] shadow-inner">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="44%" fill="none" stroke={liveData?.TireWearRR > 20 ? "#e76f51" : "#2a9d5c"} strokeWidth="12" strokeDasharray="0 1000" />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-white font-mono text-xl font-bold">{liveData?.TireTempRR ? liveData.TireTempRR.toFixed(0) : '--'}°C</span>
                  <span className="text-[#a0a3b5] text-[9px] mt-1">Carcass: {liveData?.TireCarcassRR ? liveData.TireCarcassRR.toFixed(0) : '--'}°</span>
                </div>
              </div>
              <div className="flex justify-between w-full mt-2 text-[10px] font-bold">
                <span className="text-[#2a9d5c]">{liveData?.TirePressRR ? liveData.TirePressRR.toFixed(1) : '--'} kPa</span>
                <span className="text-[#a0a3b5] tracking-widest">REAR R</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

// --- COMPOSANT VUE SETUPS (Prêt pour la vraie Data DuckDB & Python) ---
const SetupView = ({ currentSetup, aiReport }: any) => {
  const [activeCategory, setActiveCategory] = useState('POWERTRAIN');
  const [selectedParam, setSelectedParam] = useState<any | null>(null);

  const categories = ['POWERTRAIN', 'WHEELS & BRAKES', 'SUSPENSION', 'DAMPERS', 'CHASSIS & AERO'];

  // On mappe l'architecture de Le Mans Ultimate (actuelle) avec les corrections de l'IA
  const getParam = (section: string, key: string, name: string, info: string, advice: string = "") => {
    // Si l'IA n'a pas encore répondu, on renvoie une structure vide
    if (!currentSetup || !currentSetup[section] || currentSetup[section][key] === undefined) {
      return { name, old: '--', new: '--', status: 'same', info, advice };
    }
    
    // Si l'IA a répondu, on récupère l'index brut (Dans LMU, c'est l'état "New")
    // NOTE: Actuellement on n'a pas l'état "Old" car on ne sauvegarde pas l'historique dans le backend.
    // Pour l'interface, on va afficher la valeur de l'IA en Vert si elle existe.
    const newVal = currentSetup[section][key];
    
    return { 
      name, 
      old: 'Loaded', // Placeholder en attendant un historique
      new: newVal, 
      status: 'changed', // On force le statut "changé" pour qu'il s'allume en bleu/vert
      info, 
      advice 
    };
  };

  const setupData: any = {
    'POWERTRAIN': {
      'ENGINE': [
        getParam('ENGINE', 'EngineMixtureSetting', 'Engine Mixture', "Cartographie moteur."),
      ],
      'DIFFERENTIAL': [
        getParam('DRIVELINE', 'DiffPowerSetting', 'Power', "Blocage à l'accélération."),
        getParam('DRIVELINE', 'DiffPreloadSetting', 'Preload', "Précharge statique."),
      ],
      'GEARING': [
        getParam('DRIVELINE', 'FinalDriveSetting', 'Final Drive', "Rapport de pont final."),
      ]
    },
    'WHEELS & BRAKES': {
      'FRONT WHEELS': [
        getParam('FRONTLEFT', 'PressureSetting', 'Tyre pressure (L)', "Pression à froid (Gauche)."),
        getParam('FRONTRIGHT', 'PressureSetting', 'Tyre pressure (R)', "Pression à froid (Droite)."),
        getParam('FRONTLEFT', 'CamberSetting', 'Camber', "Carrossage."),
      ],
      'REAR WHEELS': [
        getParam('REARLEFT', 'PressureSetting', 'Tyre pressure (L)', "Pression à froid (Gauche)."),
        getParam('REARRIGHT', 'PressureSetting', 'Tyre pressure (R)', "Pression à froid (Droite)."),
        getParam('REARLEFT', 'CamberSetting', 'Camber', "Carrossage."),
      ],
      'BRAKES': [
        getParam('CONTROLS', 'RearBrakeSetting', 'Brake bias', "Répartition (Bias) vers l'arrière."),
        getParam('BODYAERO', 'BrakeDuctSetting', 'Brake duct', "Refroidissement freins."),
      ]
    },
    'SUSPENSION': {
      'FRONT SUSPENSION': [
        getParam('FRONTLEFT', 'SpringSetting', 'Spring rate', "Raideur."),
        getParam('FRONTLEFT', 'PackerSetting', 'Packers', "Butées."),
        getParam('FRONTLEFT', 'RideHeightSetting', 'Ride height', "Hauteur de caisse avant."),
      ],
      'REAR SUSPENSION': [
        getParam('REARLEFT', 'SpringSetting', 'Spring rate', "Raideur."),
        getParam('REARLEFT', 'RideHeightSetting', 'Ride height', "Hauteur de caisse arrière."),
      ]
    },
    'DAMPERS': {
      'FRONT DAMPERS': [
        getParam('FRONTLEFT', 'SlowBumpSetting', 'Slow bump', "Compression lente."),
        getParam('FRONTLEFT', 'SlowReboundSetting', 'Slow rebound', "Détente lente."),
        getParam('FRONTLEFT', 'FastBumpSetting', 'Fast bump', "Compression rapide."),
        getParam('FRONTLEFT', 'FastReboundSetting', 'Fast rebound', "Détente rapide."),
      ],
      'REAR DAMPERS': [
        getParam('REARLEFT', 'SlowBumpSetting', 'Slow bump', "Compression lente."),
        getParam('REARLEFT', 'SlowReboundSetting', 'Slow rebound', "Détente lente."),
        getParam('REARLEFT', 'FastBumpSetting', 'Fast bump', "Compression rapide."),
        getParam('REARLEFT', 'FastReboundSetting', 'Fast rebound', "Détente rapide."),
      ]
    },
    'CHASSIS & AERO': {
      'FRONT CHASSIS': [
        getParam('SUSPENSION', 'FrontToeInSetting', 'Toe-in', "Parallélisme (Pincement/Ouverture)."),
        getParam('SUSPENSION', 'FrontAntiSwaySetting', 'Arb size', "Barre anti-roulis avant."),
      ],
      'REAR CHASSIS': [
        getParam('SUSPENSION', 'RearToeInSetting', 'Toe-in', "Pincement arrière."),
        getParam('SUSPENSION', 'RearAntiSwaySetting', 'Arb size', "Barre anti-roulis arrière."),
        getParam('REARWING', 'RWSetting', 'Rear wing', "Aileron arrière."),
        getParam('FRONTWING', 'FWSetting', 'Front wing', "Aileron avant (Si applicable)."),
      ]
    }
  };

  return (
    <div className="flex-1 flex gap-6 h-full overflow-hidden">
      
      {/* COLONNE GAUCHE : SÉLECTION DES PARAMÈTRES */}
      <div className="flex-[2] flex flex-col gap-4 overflow-hidden">
        
        {/* Header Setup */}
        <div className="bg-[#1c1e2b] border border-gray-800 rounded-lg p-5 flex justify-between items-center shadow-lg">
          <div>
            <h2 className="text-white text-lg font-black tracking-wide flex items-center gap-2">
              <Settings className="text-[#3a86ff]"/> CURRENT SETUP
            </h2>
            <p className="text-[#a0a3b5] text-xs font-bold mt-1 tracking-widest">AWAITING SESSION DATA...</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-[#212332] text-white px-4 py-2 rounded text-xs font-bold border border-gray-700 hover:bg-gray-800 transition">COMPARE</button>
            <button className="bg-[#3a86ff] text-white px-4 py-2 rounded text-xs font-bold shadow-[0_0_15px_rgba(58,134,255,0.4)]">APPLY TO CAR</button>
          </div>
        </div>

        {/* Menu des Catégories (Onglets) */}
        <div className="flex bg-[#1c1e2b] border border-gray-800 rounded-lg p-1 overflow-x-auto scrollbar-hide shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setSelectedParam(null); }}
              className={`flex-1 py-3 text-[11px] font-black tracking-wider whitespace-nowrap px-4 rounded transition-all ${
                activeCategory === cat 
                  ? 'bg-[#3a86ff] text-white shadow-md' 
                  : 'text-[#a0a3b5] hover:text-white hover:bg-[#212332]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Options de Comparaison */}
        <div className="flex items-center gap-6 px-2">
          <label className="flex items-center gap-2 text-white text-xs font-bold cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded bg-gray-900 border-gray-700 text-[#3a86ff] focus:ring-[#3a86ff] focus:ring-offset-gray-900" />
            Current setup
          </label>
          <label className="flex items-center gap-2 text-[#a0a3b5] text-xs font-bold cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded bg-gray-900 border-gray-700 text-[#3a86ff] focus:ring-[#3a86ff] focus:ring-offset-gray-900 opacity-50" />
            Compared setup
          </label>
        </div>

        {/* Liste des Paramètres (Grid avec Sous-Catégories) */}
        <div className="flex-1 bg-[#1c1e2b] border border-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
          <div className="grid grid-cols-12 gap-2 p-3 bg-[#212332] border-b border-gray-800 text-[10px] font-black text-[#a0a3b5] tracking-widest sticky top-0 z-10">
            <div className="col-span-5">PARAMETER</div>
            <div className="col-span-3 text-center">PREVIOUS</div>
            <div className="col-span-1 text-center"></div>
            <div className="col-span-3 text-center">CURRENT</div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {Object.entries(setupData[activeCategory] || {}).map(([subCategoryName, params]: [string, any]) => (
              <div key={subCategoryName} className="flex flex-col gap-1">
                {/* GRAND TITRE DE SOUS-CATÉGORIE */}
                <h3 className="text-white/40 text-sm font-black tracking-widest mb-2 border-b border-gray-800/50 pb-1">
                  {subCategoryName}
                </h3>
                
                {params.map((param: any, idx: number) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedParam(param)}
                    className={`grid grid-cols-12 gap-2 p-2 rounded-md items-center cursor-pointer transition-colors border border-transparent
                      ${selectedParam?.name === param.name ? 'bg-[#3a86ff]/10 border-[#3a86ff]/50' : 'hover:bg-[#212332]'}
                    `}
                  >
                    <div className="col-span-5 flex flex-col">
                      <span className="text-white text-xs font-bold">{param.name}</span>
                    </div>
                    
                    <div className="col-span-3 text-center text-white font-mono text-xs font-bold bg-[#181924] py-1.5 rounded border border-gray-800">
                      {/* Valeur actuelle (Blanche) - On affiche le 'new' ici si on a pas l'ancien, car c'est la valeur chargée */}
                      {param.old}
                    </div>
                    
                    <div className="col-span-1 flex justify-center text-gray-600">
                      {/* Si la valeur a changé, on met une flèche verte */}
                      {param.status === 'changed' ? <ArrowBigRight size={14} className="text-[#2a9d5c]"/> : <span className="text-[10px] text-gray-700">=</span>}
                    </div>
                    
                    <div className={`col-span-3 text-center font-mono text-xs font-bold py-1.5 rounded border transition-all duration-300 ${
                      param.status === 'changed' 
                        ? 'bg-[#2a9d5c]/20 text-[#2a9d5c] border-[#2a9d5c]/50 shadow-[0_0_12px_rgba(42,157,92,0.3)]' // Correction en Vert (Ta demande)
                        : 'bg-[#181924] text-[#a0a3b5] border-gray-800'
                    }`}>
                      {/* Nouvelle valeur calculée par l'IA */}
                      {param.new}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* COLONNE DROITE : RACE ENGINEER & IA INSIGHTS */}
      <div className="w-96 flex flex-col gap-4 overflow-hidden">
        
        {/* Encart Ingénieur / Pourquoi ? */}
        <div className="flex-1 bg-[#1c1e2b] border border-[#8338ec]/50 shadow-[0_0_20px_rgba(131,56,236,0.1)] rounded-lg flex flex-col overflow-hidden relative">
          {/* Header Ingénieur */}
          <div className="bg-[#181924] border-b border-gray-800 p-4 flex gap-4 items-center relative z-10">
            <div className="w-12 h-12 rounded-full bg-[#8338ec]/20 border-2 border-[#8338ec] flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(131,56,236,0.4)]">
              <Zap size={20} className="text-[#8338ec] animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#8338ec]/30 to-transparent"></div>
            </div>
            <div>
              <h3 className="text-white font-black tracking-widest text-sm flex items-center gap-2">
                RACE ENGINEER <CheckCircle2 size={14} className="text-[#2a9d5c]" />
              </h3>
              <p className="text-[#a855f7] text-[10px] font-bold tracking-widest uppercase mt-0.5">AI Telemetry Analysis</p>
            </div>
          </div>

          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-6 relative z-10">
            
            {/* BLOC 2 : INJECTION DU RAPPORT DE L'IA SI DISPONIBLE */}
            {aiReport && aiReport.length > 0 ? (
              <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                <h4 className="text-white font-bold text-sm uppercase tracking-wide border-b border-gray-800 pb-1">AI DIAGNOSTIC REPORT</h4>
                {aiReport.map((msg: string, i: number) => (
                  <div key={i} className="bg-[#212332] p-3 rounded-lg border border-gray-800 flex items-start gap-2 shadow-md">
                    <Zap size={14} className="text-[#3a86ff] mt-0.5 shrink-0" />
                    {/* On supprime la balise console "[ENGINEER/RADIO]" pour faire propre */}
                    <p className="text-white text-xs leading-relaxed">{msg.replace('[ENGINEER/RADIO] ', '')}</p>
                  </div>
                ))}
              </div>
            ) : selectedParam ? (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <Settings size={16} className="text-[#3a86ff]"/>
                  <h4 className="text-white font-bold text-sm uppercase tracking-wide border-b border-gray-800 pb-1 w-full">{selectedParam.name}</h4>
                </div>
                
                <div className="bg-[#212332] p-4 rounded-lg border border-gray-800 mb-4 relative">
                  <div className="absolute -left-1.5 top-4 w-3 h-3 bg-[#3a86ff] rounded-full shadow-[0_0_10px_#3a86ff]"></div>
                  <h5 className="text-[#a0a3b5] text-[10px] font-black tracking-widest mb-2 flex items-center gap-2"><Info size={12}/> WHAT IT DOES</h5>
                  <p className="text-white text-xs leading-relaxed">{selectedParam.info}</p>
                </div>

                {selectedParam.advice && (
                  <div className="bg-[#3d1e20] p-4 rounded-lg border border-[#e76f51]/50 shadow-[0_0_15px_rgba(231,111,81,0.15)] relative">
                    <div className="absolute -left-1.5 top-4 w-3 h-3 bg-[#e76f51] rounded-full shadow-[0_0_10px_#e76f51] animate-pulse"></div>
                    <h5 className="text-[#e76f51] text-[10px] font-black tracking-widest mb-2 flex items-center gap-2"><AlertTriangle size={12}/> DRIVING ADVICE</h5>
                    <p className="text-white text-xs leading-relaxed font-semibold">{selectedParam.advice}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col h-full items-center justify-center text-center opacity-60">
                <Settings size={48} className="text-[#8338ec] mb-4 opacity-50" />
                <p className="text-white font-bold text-sm mb-2">SELECT A PARAMETER</p>
                <p className="text-[#a0a3b5] text-xs max-w-[250px] leading-relaxed">
                  Click on any setup parameter on the left to see technical explanations and AI driving advice adapted to your new setup.
                </p>
              </div>
            )}
          </div>
          
          <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none">
            <Activity size={200} />
          </div>
        </div>

        {/* Bilan Global Setup */}
        <div className="h-32 bg-[#1c1e2b] border border-gray-800 rounded-lg p-4 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <span className="text-[#a0a3b5] text-[10px] font-black tracking-widest">SETUP BALANCE</span>
            <span className="text-[#a0a3b5] text-[10px] font-black tracking-widest bg-[#212332] border border-gray-700 px-2 py-0.5 rounded">
              {aiReport && aiReport.length > 0 ? 'ANALYZED' : 'AWAITING DATA'}
            </span>
          </div>
          <p className="text-[#a0a3b5] text-[11px] leading-relaxed italic">
            "Complete a valid stint and connect telemetry to generate AI setup analysis."
          </p>
        </div>
      </div>
    </div>
  );
};

// --- COMPOSANT VUE SCHEDULE (CLONE UI MYLMU + VRAIES DATA) ---
const ScheduleView = () => {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [nextUpEvents, setNextUpEvents] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeFilter, setActiveFilter] = useState('All');
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  // Horloge interne
  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  // Formatage du compte à rebours dynamique (Rouge)
  const getCountdown = (timestamp: number, isNextUp: boolean) => {
    const diff = timestamp - now;
    if (diff <= 0) return "STARTED";
    
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = Math.floor(diff % 60);
    
    if (isNextUp && h < 2) {
      // Pour les courses imminentes, on affiche le chrono MM:SS ou HH:MM
      if (h === 0) return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
    return null; // Sinon on n'affiche rien, on utilisera l'heure fixe
  };

  // Appel réseau au serveur Python pour télécharger les vraies courses
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
        if (isMounted) setIsLoading(false); // SÉCURITÉ : Coupe toujours l'animation
      }
    };
    
    fetchSchedule();
    const interval = setInterval(fetchSchedule, 60000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  // Moteur de filtres
  const filteredNextUp = nextUpEvents.filter(ev => 
    activeFilter === 'All' || ev.category.toUpperCase() === activeFilter.toUpperCase()
  );
  
  const filteredUpcoming = upcomingEvents.filter(ev => 
    activeFilter === 'All' || ev.category.toUpperCase() === activeFilter.toUpperCase()
  );

  // Couleurs calquées sur l'UI MyLMU
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
                <span className="text-[#ef4444] font-bold">{getCountdown(selectedEvent.timestamp, true) || selectedEvent.time}</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400 font-medium">{selectedEvent.date}</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400 font-medium">{selectedEvent.length}</span>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center relative mt-10">
              <svg viewBox="0 0 100 50" className="w-full h-64 drop-shadow-[0_0_15px_rgba(255,255,255,0.05)] opacity-80">
                <path d="M 10,20 Q 30,10 80,15 T 90,30 Q 50,45 20,40 Z" fill="none" stroke="#3a86ff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex justify-between border-t border-gray-800/50 pt-4 mt-auto">
              <div><span className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase">Length</span><span className="text-gray-200 font-bold text-sm">{selectedEvent.length}</span></div>
              <div><span className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase">Type</span><span className="text-gray-200 font-bold text-sm uppercase">{selectedEvent.type}</span></div>
              <div><span className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase">Track</span><span className="text-gray-200 font-bold text-sm flex items-center gap-1.5"><MapPin size={14}/> {selectedEvent.track}</span></div>
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

             {/* DETAILS */}
             <h3 className="text-gray-500 text-[10px] font-black tracking-widest mb-3 uppercase">Details</h3>
             <div className="bg-[#121318] rounded-xl border border-gray-800/50 p-4 mb-6">
                <div className="grid grid-cols-3 gap-4 border-b border-gray-800/50 pb-4 mb-4">
                   <div><span className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-0.5">Practice</span><span className="text-gray-200 font-bold text-sm">{selectedEvent.details.practice}</span></div>
                   <div><span className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-0.5">Qualifying</span><span className="text-gray-200 font-bold text-sm">{selectedEvent.details.qualifying}</span></div>
                   <div><span className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-0.5">Race</span><span className="text-gray-200 font-bold text-sm">{selectedEvent.details.race}</span></div>
                </div>
                {/* GRILLE 4 COLONNES POUR LES PETITS BADGES */}
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

             {/* SESSION TIMES */}
             <h3 className="text-gray-500 text-[10px] font-black tracking-widest mb-1 uppercase">Session Times</h3>
             <p className="text-gray-500 text-[10px] font-medium mb-3">{selectedEvent.details.session_times.length} sessions · Click a time to set a reminder</p>
             <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[80px] scrollbar-hide pb-2">
                {selectedEvent.details.session_times.map((t: string) => {
                  // Vérification si c'est la session actuellement cliquée (Conversion 12h vers 24h pour le style actif)
                  const isCurrent = selectedEvent.time.replace(/(AM|PM)/i, '') === t || 
                                    (parseInt(t.split(':')[0]) === (parseInt(selectedEvent.time.split(':')[0]) % 12) + (selectedEvent.time.includes('PM') ? 12 : 0) ? true : false);
                  
                  return (
                    <button key={t} className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-colors ${isCurrent ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-[#1e1315] text-[#ef4444] border-[#ef4444]/20 hover:border-[#ef4444]/50'}`}>
                      {t}
                    </button>
                  );
                })}
             </div>
          </div>
        </div>
      )}

      {/* HEADER FILTRES MYLMU */}
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

        <div className="flex gap-3 text-xs font-semibold">
          {['All series', 'All classes', 'All tracks', 'Any setup', 'All SR'].map(f => (
            <button key={f} className="bg-transparent border border-gray-800/80 text-gray-400 px-3 py-1.5 rounded-md flex items-center gap-2 hover:bg-white/5 hover:text-gray-200 transition-colors">
              {f} <ChevronRight size={12} className="rotate-90 opacity-50"/>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-10 scrollbar-hide">
        {/* NEXT UP SECTION */}
        <h2 className="text-gray-500 text-[10px] font-bold tracking-widest mt-6 mb-3 uppercase">Next Up</h2>
        <div className="flex flex-col gap-3 mb-10">
          {filteredNextUp.length > 0 ? filteredNextUp.map(ev => (
            <div key={ev.id} className="bg-[#121318] border border-gray-800/50 rounded-xl p-4 flex items-center justify-between group cursor-pointer hover:border-gray-600 transition-colors" onClick={() => setSelectedEvent(ev)}>
              
              <div className="flex flex-col gap-2 w-1/3">
                <div className="flex items-center gap-3">
                  <h3 className="text-gray-100 text-base font-bold">{ev.title}</h3>
                  <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${getRankColor(ev.rank)}`}>{ev.rank}</span>
                  <Wrench size={12} className="text-gray-600"/>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-medium">
                  <span className="text-[#ef4444] font-bold">{getCountdown(ev.timestamp, true) || ev.time}</span>
                  <span className="text-gray-600">{ev.date} • {ev.length}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-1/3 text-gray-300 font-semibold text-sm">
                <MapPin size={14} className="text-gray-500"/> {ev.track}
              </div>

              <div className="flex items-center gap-6 w-1/3 justify-end">
                <div className="flex gap-1.5 flex-wrap">
                  {ev.classes.map((c: string) => (
                    <span key={c} className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${getClassColor(c)}`}>{c}</span>
                  ))}
                </div>
                <button className="flex items-center gap-1 text-gray-500 group-hover:text-gray-300 text-[10px] font-semibold tracking-wider transition-colors">
                  View details <ChevronRight size={14}/>
                </button>
              </div>
            </div>
          )) : (
            <div className="p-4 rounded-xl border border-gray-800/30 text-gray-500 text-xs italic bg-[#0f1015]">No imminent events for this category.</div>
          )}
        </div>

        {/* UPCOMING SECTION */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-gray-500 text-[10px] font-bold tracking-widest uppercase">Upcoming</h2>
          <div className="flex rounded-md border border-gray-800/50 overflow-hidden text-[10px] font-bold tracking-widest uppercase">
            <button className="bg-white text-black px-4 py-1.5">List</button>
            <button className="bg-[#121318] text-gray-500 px-4 py-1.5 hover:text-gray-300 transition-colors">Month</button>
            <button className="bg-[#121318] text-gray-500 px-4 py-1.5 hover:text-gray-300 transition-colors border-l border-gray-800/50">Day</button>
          </div>
        </div>

        <div className="border border-gray-800/50 rounded-xl overflow-hidden bg-[#0a0a0f]">
          {/* HEADER TABLEAU */}
          <div className="grid grid-cols-12 gap-4 p-3 px-5 border-b border-gray-800/50 text-gray-500 text-[9px] font-bold tracking-widest uppercase bg-[#0d0e12]">
            <div className="col-span-1">When</div>
            <div className="col-span-3">Series</div>
            <div className="col-span-1">SR</div>
            <div className="col-span-3">Track</div>
            <div className="col-span-2">Classes</div>
            <div className="col-span-1">Length</div>
            <div className="col-span-1 text-right">Setup</div>
          </div>
          
          <div className="flex flex-col">
            {filteredUpcoming.length > 0 ? filteredUpcoming.map((ev, i) => (
              <div key={i} onClick={() => setSelectedEvent(ev)} className="grid grid-cols-12 gap-4 p-3 px-5 items-center border-b border-gray-800/30 hover:bg-[#15161d] cursor-pointer transition-colors group last:border-b-0">
                <div className="col-span-1 flex flex-col">
                  <span className="text-[#ef4444] font-bold text-xs">{ev.time}</span>
                  <span className="text-gray-500 text-[10px] font-medium mt-0.5">{ev.date}</span>
                </div>
                <div className="col-span-3 flex flex-col">
                  <span className="text-gray-200 font-bold text-xs">{ev.title}</span>
                  <span className="text-gray-500 text-[10px] font-medium mt-0.5">{ev.category}</span>
                </div>
                <div className="col-span-1">
                  <span className={`px-2 py-0.5 rounded border text-[8px] font-bold uppercase tracking-wider ${getRankColor(ev.rank)}`}>{ev.rank}</span>
                </div>
                <div className="col-span-3 flex items-center gap-2 text-gray-300 text-xs font-semibold">
                  <MapPin size={12} className="text-gray-600"/> {ev.track}
                </div>
                <div className="col-span-2 flex gap-1.5 flex-wrap">
                  {ev.classes.map((c: string) => <span key={c} className={`px-1.5 py-[2px] rounded border text-[8px] font-bold uppercase tracking-wider ${getClassColor(c)}`}>{c}</span>)}
                </div>
                <div className="col-span-1 text-gray-400 text-xs font-semibold">{ev.length}</div>
                <div className="col-span-1 flex justify-end items-center gap-3 text-gray-600 group-hover:text-gray-300 transition-colors">
                  <Wrench size={12} />
                  <MonitorPlay size={12} />
                  <ChevronRight size={12} />
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-gray-500 text-xs italic">No future events found for this filter.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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

export default function App() {
  const [activeMenu, setActiveMenu] = useState('Sessions');
  const [subView, setSubView] = useState<'driving' | 'data' | 'timing'>('data');
  
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
    { name: 'Schedule', icon: <CalendarDays size={20} /> }, // NOUVEAU MENU
    { name: 'Sessions', icon: <LineChart size={20} /> },
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
              onClick={() => setActiveMenu(item.name)}
              className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-200 ${
                activeMenu === item.name 
                  ? 'bg-[#181924] border-r-4 border-[#3a86ff] text-white font-bold' 
                  : 'text-[#a0a3b5] hover:bg-gray-800/40 hover:text-white'
              }`}
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
            ) : activeMenu === 'Sessions' ? (
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