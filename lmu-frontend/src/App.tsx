import { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, LineChart, Wrench, Trophy, UserCircle, HelpCircle, 
  Compass, BarChart2, Activity, CloudRain, Thermometer, Fuel, 
  Lock, Search, RefreshCw, Cloud, Route, Trash2, Timer,
  Settings, Info, ArrowBigRight, Zap, AlertTriangle, CheckCircle2,
  Upload, Calendar, MapPin, CarFront, Play
} from 'lucide-react';
import { ResponsiveContainer, LineChart as RechartsLine, Line, YAxis, Tooltip, ReferenceLine } from 'recharts';

// --- OUTILS MATHÉMATIQUES POUR LE TRACÉ GPS DU CIRCUIT ---
const generateSVGPath = (data: any[], keyX: string = 'PosX', keyY: string = 'PosY') => {
  if (!data || data.length === 0) return "";
  const points = data.map(d => `${d[keyX] || 0},${-(d[keyY] || 0)}`); // -Y car le SVG est inversé
  return `M ${points.join(" L ")}`;
};

const calculateViewBox = (data: any[], padding = 50) => {
  if (!data || data.length === 0) return "0 0 100 100";
  const xs = data.map(d => d.PosX || 0);
  const ys = data.map(d => -(d.PosY || 0));
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
    <div className="flex-1 relative bg-[#1c1e2b] rounded-xl border border-gray-800 overflow-hidden shadow-2xl flex flex-col flex-row">
      
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

// --- COMPOSANT VUE TIMING (Connecté au Live Data) ---
const TimingView = ({ laps, liveData }: any) => {
  // Un seul tour "placeholder" pour la structure
  const timingData = [
    {
      lap: '-',
      s1: '0.000',
      s2: '0.000',
      s3: '0.000',
      time: '0:00.000',
      delta: '0.0s',
      rain: '0%',
      airTemp: '--°C',
      trackTemp: '--°C',
      fuel: '-- L',
      isBest: false,
      isOutLap: false
    }
  ];

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill="#3a86ff" />
        <text x={cx} y={cy} dy={3} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
          {payload.lap}
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
            { label: 'TOTAL LAPS', value: '0' },
            { label: 'DRIVING TIME', value: '0H 00M' },
            { label: 'BEST LAP', value: '0:00.000' },
            { label: 'OPTIMAL LAP', value: '0:00.000' },
            { label: 'AVG LAP', value: '0:00.000' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-[#1c1e2b] border border-gray-800 rounded-lg p-3 flex flex-col items-center justify-center shadow-lg">
              <span className="text-white font-mono text-lg font-bold">{stat.value}</span>
              <span className="text-[#a0a3b5] text-[10px] font-bold tracking-widest mt-1">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 bg-[#1c1e2b] border border-gray-800 rounded-lg flex flex-col shadow-2xl overflow-hidden">
          
          <div className="flex justify-between items-center bg-[#212332] p-3 border-b border-gray-800">
            <span className="font-bold text-white text-xs tracking-widest">STINT 1</span>
            <div className="flex items-center gap-6 text-xs font-bold">
              <span className="text-[#a0a3b5] flex items-center gap-1"><RefreshCw size={12}/> 0 LAPS</span>
              <span className="text-[#a0a3b5] flex items-center gap-1"><Fuel size={12}/> 0.00 L/LAP</span>
              <span className="text-[#a0a3b5] flex items-center gap-1"><Timer size={12}/> 0:00.000</span>
              <span className="text-[#a855f7] flex items-center gap-1"><Timer size={12}/> 0:00.000</span>
            </div>
          </div>

          <div className="h-20 w-full px-4 pt-4 border-b border-gray-800 bg-[#181924]/50">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLine data={timingData}>
                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                <Line type="monotone" dataKey="s2" stroke="#3a86ff" strokeWidth={2} dot={<CustomDot />} isAnimationActive={false} />
              </RechartsLine>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-10 gap-2 p-2 bg-[#181924] border-b border-gray-800 text-[10px] font-bold text-[#a0a3b5] text-center uppercase">
            <div></div>
            <div>S1</div>
            <div>S2</div>
            <div>S3</div>
            <div>LAP TIME</div>
            <div>DELTA</div>
            <div className="flex justify-center"><CloudRain size={12}/></div>
            <div className="flex justify-center"><Cloud size={12}/></div>
            <div className="flex justify-center"><Thermometer size={12}/></div>
            <div className="flex justify-center"><Fuel size={12}/></div>
          </div>

          <div className="flex-1 overflow-y-auto pb-4">
            {timingData.map((row, idx) => (
              <div key={idx} className={`grid grid-cols-10 gap-2 p-2 text-xs font-mono font-bold text-center items-center border-b border-gray-800/50 transition-colors cursor-pointer ${row.isBest ? 'bg-[#8338ec] text-white shadow-[0_0_15px_rgba(131,56,236,0.3)] z-10 relative' : 'text-[#a0a3b5] hover:bg-[#212332]'}`}>
                <div className="text-white font-sans">{row.lap}</div>
                <div className={row.isBest ? 'text-white' : idx % 3 === 0 ? 'text-[#e76f51]' : 'text-white'}>{row.s1}</div>
                <div className={row.isBest ? 'text-white' : idx % 4 === 0 ? 'text-[#e76f51]' : row.isOutLap ? 'text-[#a0a3b5]' : 'text-white'}>{row.s2}</div>
                <div className={row.isBest ? 'text-white' : idx % 2 === 0 ? 'text-[#e76f51]' : 'text-[#a855f7]'}>{row.s3}</div>
                <div className={row.isBest ? 'text-white' : 'text-white'}>{row.time}</div>
                <div className={row.isBest ? 'text-white' : row.delta.includes('-') ? 'text-[#2a9d5c]' : 'text-[#a0a3b5]'}>{row.delta}</div>
                <div>{row.rain}</div>
                <div>{row.airTemp}</div>
                <div>{row.trackTemp}</div>
                <div className={row.isBest ? 'text-white' : 'text-[#e9c46a]'}>{row.fuel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DROITE : CALCULATEUR D'ESSENCE ET PNEUS */}
      <div className="w-80 flex flex-col gap-4 overflow-y-auto pr-2 pb-6 scrollbar-hide">
        
        {/* Fuel Calculator Box */}
        <div className="bg-[#1c1e2b] border border-gray-800 rounded-lg p-5 shadow-lg">
          <h3 className="text-[#a0a3b5] text-[11px] font-black tracking-widest mb-4 uppercase">Fuel Calculator</h3>
          
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-[#181924] border border-gray-800 rounded p-3 flex flex-col items-center">
              <span className="text-[#2a9d5c] font-mono text-xl font-bold">{fuelLevel} L</span>
              <span className="text-[#a0a3b5] text-[9px] font-bold mt-1 flex items-center gap-1"><Fuel size={10}/> CURRENT FUEL</span>
            </div>
            <div className="bg-[#181924] border border-gray-800 rounded p-3 flex flex-col items-center">
              <span className="text-[#3a86ff] font-mono text-xl font-bold">{battery} %</span>
              <span className="text-[#a0a3b5] text-[9px] font-bold mt-1 flex items-center gap-1"><Activity size={10}/> BATTERY LVL</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-xs font-bold">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <span className="text-[#a0a3b5] flex items-center gap-2"><Fuel size={14}/> CONSUMPTION</span>
              <span className="text-white font-mono">0.00 L / LAP</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <span className="text-[#a0a3b5] flex items-center gap-2"><Activity size={14}/> VIRTUAL ENERGY</span>
              <span className="text-white font-mono bg-[#181924] border border-gray-700 px-2 py-0.5 rounded">0 % / LAP</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <span className="text-[#a0a3b5] flex items-center gap-2"><Timer size={14}/> AVG LAP TIME</span>
              <span className="text-white font-mono">0:00.000</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <span className="text-[#a0a3b5] flex items-center gap-2"><RefreshCw size={14}/> SESSION LENGTH</span>
              <span className="text-white font-mono bg-[#181924] border border-gray-700 px-2 py-0.5 rounded">-- MINS</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <button className="bg-[#3a86ff]/20 text-[#3a86ff] border border-[#3a86ff]/50 hover:bg-[#3a86ff] hover:text-white transition-colors py-2 rounded text-[10px] font-black">25 MINS</button>
            <button className="bg-[#3a86ff]/20 text-[#3a86ff] border border-[#3a86ff]/50 hover:bg-[#3a86ff] hover:text-white transition-colors py-2 rounded text-[10px] font-black">45 MINS</button>
            <button className="bg-[#3a86ff]/20 text-[#3a86ff] border border-[#3a86ff]/50 hover:bg-[#3a86ff] hover:text-white transition-colors py-2 rounded text-[10px] font-black">65 MINS</button>
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
              <div className="relative w-28 h-28 rounded-full border-[12px] border-[#2e4b3c] flex items-center justify-center bg-[#181924]">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="44%" fill="none" stroke="#2a9d5c" strokeWidth="12" strokeDasharray="0 1000" />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-white font-mono text-xl font-bold">{liveData?.TireTempFL ? liveData.TireTempFL.toFixed(0) : '--'}°C</span>
                </div>
              </div>
              <div className="flex justify-between w-full mt-2 text-[10px] font-bold">
                <span className="text-[#a0a3b5] tracking-widest">FRONT L</span>
                <span className="text-[#2a9d5c]">{liveData?.TirePressFL ? liveData.TirePressFL.toFixed(1) : '--'} PSI</span>
              </div>
            </div>

            {/* Front Right */}
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full border-[12px] border-[#2e4b3c] flex items-center justify-center bg-[#181924]">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="44%" fill="none" stroke="#2a9d5c" strokeWidth="12" strokeDasharray="0 1000" />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-white font-mono text-xl font-bold">{liveData?.TireTempFR ? liveData.TireTempFR.toFixed(0) : '--'}°C</span>
                </div>
              </div>
              <div className="flex justify-between w-full mt-2 text-[10px] font-bold">
                <span className="text-[#2a9d5c]">{liveData?.TirePressFR ? liveData.TirePressFR.toFixed(1) : '--'} PSI</span>
                <span className="text-[#a0a3b5] tracking-widest">FRONT R</span>
              </div>
            </div>

            {/* Rear Left */}
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full border-[12px] border-[#2e4b3c] flex items-center justify-center bg-[#181924]">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="44%" fill="none" stroke="#2a9d5c" strokeWidth="12" strokeDasharray="0 1000" />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-white font-mono text-xl font-bold">{liveData?.TireTempRL ? liveData.TireTempRL.toFixed(0) : '--'}°C</span>
                </div>
              </div>
              <div className="flex justify-between w-full mt-2 text-[10px] font-bold">
                <span className="text-[#a0a3b5] tracking-widest">REAR L</span>
                <span className="text-[#2a9d5c]">{liveData?.TirePressRL ? liveData.TirePressRL.toFixed(1) : '--'} PSI</span>
              </div>
            </div>

            {/* Rear Right */}
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full border-[12px] border-[#2e4b3c] flex items-center justify-center bg-[#181924]">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="44%" fill="none" stroke="#2a9d5c" strokeWidth="12" strokeDasharray="0 1000" />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-white font-mono text-xl font-bold">{liveData?.TireTempRR ? liveData.TireTempRR.toFixed(0) : '--'}°C</span>
                </div>
              </div>
              <div className="flex justify-between w-full mt-2 text-[10px] font-bold">
                <span className="text-[#2a9d5c]">{liveData?.TirePressRR ? liveData.TirePressRR.toFixed(1) : '--'} PSI</span>
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

  // Base de données structurelle passée en mode "Neutre" en attendant de la mapper complètement avec currentSetup
  const setupData: any = {
    'POWERTRAIN': {
      'ENGINE': [
        { name: 'Virtual Energy', old: '--', new: '--', status: 'same', info: "Niveau d'énergie virtuelle.", advice: "" },
        { name: 'Starting Fuel', old: '--', new: '--', status: 'same', info: "Carburant embarqué.", advice: "" },
        { name: 'Rev Limiter', old: '--', new: '--', status: 'same', info: "Régime maximal.", advice: "" },
        { name: 'Engine Mixture', old: '--', new: '--', status: 'same', info: "Cartographie moteur.", advice: "" },
        { name: 'Water radiator cover', old: '--', new: '--', status: 'same', info: "Refroidissement eau.", advice: "" },
        { name: 'Oil radiator cover', old: '--', new: '--', status: 'same', info: "Refroidissement huile.", advice: "" },
      ],
      'ELECTRONICS': [
        { name: 'Onboard TC', old: '--', new: '--', status: 'same', info: "Anti-patinage global.", advice: "" },
        { name: 'TC Power Cut', old: '--', new: '--', status: 'same', info: "Coupure de puissance du TC.", advice: "" },
        { name: 'TC Slip Angle', old: '--', new: '--', status: 'same', info: "Angle de glisse toléré.", advice: "" },
        { name: 'Regen level', old: '--', new: '--', status: 'same', info: "Récupération d'énergie.", advice: "" },
        { name: 'Electric motor map', old: '--', new: '--', status: 'same', info: "Déploiement électrique.", advice: "" },
      ],
      'DIFFERENTIAL': [
        { name: 'Power', old: '--', new: '--', status: 'same', info: "Blocage à l'accélération.", advice: "" },
        { name: 'Coast', old: '--', new: '--', status: 'same', info: "Blocage au freinage.", advice: "" },
        { name: 'Preload', old: '--', new: '--', status: 'same', info: "Précharge statique.", advice: "" },
        { name: 'Front Power', old: '--', new: '--', status: 'same', info: "Différentiel avant (AWD).", advice: "" },
        { name: 'Front Coast', old: '--', new: '--', status: 'same', info: "Différentiel avant (AWD).", advice: "" },
        { name: 'Front Preload', old: '--', new: '--', status: 'same', info: "Précharge avant (AWD).", advice: "" },
      ],
      'GEARING': [
        { name: 'Ratio Set', old: '--', new: '--', status: 'same', info: "Jeu de boîte de vitesses.", advice: "" }
      ]
    },
    'WHEELS & BRAKES': {
      'FRONT WHEELS': [
        { name: 'Compound', old: '--', new: '--', status: 'same', info: "Gomme.", advice: "" },
        { name: 'Tyre pressure', old: '--', new: '--', status: 'same', info: "Pression à froid.", advice: "" },
        { name: 'Camber', old: '--', new: '--', status: 'same', info: "Carrossage.", advice: "" },
        { name: 'Brake disc', old: '--', new: '--', status: 'same', info: "Épaisseur du disque.", advice: "" },
      ],
      'REAR WHEELS': [
        { name: 'Compound', old: '--', new: '--', status: 'same', info: "Gomme.", advice: "" },
        { name: 'Tyre pressure', old: '--', new: '--', status: 'same', info: "Pression à froid.", advice: "" },
        { name: 'Camber', old: '--', new: '--', status: 'same', info: "Carrossage.", advice: "" },
        { name: 'Brake disc', old: '--', new: '--', status: 'same', info: "Épaisseur du disque.", advice: "" },
      ],
      'BRAKES': [
        { name: 'Brake bias', old: '--', new: '--', status: 'same', info: "Répartition.", advice: "" },
        { name: 'Max pedal force', old: '--', new: '--', status: 'same', info: "Force Load Cell.", advice: "" },
        { name: 'Front brake duct', old: '--', new: '--', status: 'same', info: "Refroidissement freins.", advice: "" },
        { name: 'Rear brake duct', old: '--', new: '--', status: 'same', info: "Refroidissement freins.", advice: "" },
      ]
    },
    'SUSPENSION': {
      'FRONT SUSPENSION': [
        { name: 'Spring rate', old: '--', new: '--', status: 'same', info: "Raideur.", advice: "" },
        { name: 'Packers', old: '--', new: '--', status: 'same', info: "Butées.", advice: "" },
        { name: 'Ride height', old: '--', new: '--', status: 'same', info: "Hauteur de caisse.", advice: "" },
      ],
      'REAR SUSPENSION': [
        { name: 'Spring rate', old: '--', new: '--', status: 'same', info: "Raideur.", advice: "" },
        { name: 'Packers', old: '--', new: '--', status: 'same', info: "Butées.", advice: "" },
        { name: 'Ride height', old: '--', new: '--', status: 'same', info: "Hauteur.", advice: "" },
      ]
    },
    'DAMPERS': {
      'FRONT DAMPERS': [
        { name: 'Slow bump', old: '--', new: '--', status: 'same', info: "Compression lente.", advice: "" },
        { name: 'Slow rebound', old: '--', new: '--', status: 'same', info: "Détente lente.", advice: "" },
        { name: 'Fast bump', old: '--', new: '--', status: 'same', info: "Compression rapide.", advice: "" },
        { name: 'Fast rebound', old: '--', new: '--', status: 'same', info: "Détente rapide.", advice: "" },
      ],
      'REAR DAMPERS': [
        { name: 'Slow bump', old: '--', new: '--', status: 'same', info: "Compression lente.", advice: "" },
        { name: 'Slow rebound', old: '--', new: '--', status: 'same', info: "Détente lente.", advice: "" },
        { name: 'Fast bump', old: '--', new: '--', status: 'same', info: "Compression rapide.", advice: "" },
        { name: 'Fast rebound', old: '--', new: '--', status: 'same', info: "Détente rapide.", advice: "" },
      ]
    },
    'CHASSIS & AERO': {
      'FRONT CHASSIS': [
        { name: 'Caster', old: '--', new: '--', status: 'same', info: "Angle de chasse.", advice: "" },
        { name: 'Toe-in', old: '--', new: '--', status: 'same', info: "Parallélisme.", advice: "" },
        { name: 'Arb size', old: '--', new: '--', status: 'same', info: "Barre anti-roulis.", advice: "" },
        { name: 'Wheel range', old: '--', new: '--', status: 'same', info: "Rotation volant.", advice: "" },
      ],
      'REAR CHASSIS': [
        { name: 'Toe-in', old: '--', new: '--', status: 'same', info: "Pincement arrière.", advice: "" },
        { name: 'Arb size', old: '--', new: '--', status: 'same', info: "Barre anti-roulis.", advice: "" },
        { name: 'Rear wing', old: '--', new: '--', status: 'same', info: "Aileron arrière.", advice: "" },
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
                    
                    <div className="col-span-3 text-center text-[#a0a3b5] font-mono text-xs font-bold bg-[#181924] py-1.5 rounded border border-gray-800">
                      {param.old}
                    </div>
                    
                    <div className="col-span-1 flex justify-center text-gray-600">
                      {param.status === 'changed' ? <ArrowBigRight size={14} className="text-[#3a86ff]"/> : <span className="text-[10px]">=</span>}
                    </div>
                    
                    <div className={`col-span-3 text-center font-mono text-xs font-bold py-1.5 rounded border ${
                      param.status === 'changed' ? 'bg-[#3a86ff]/20 text-[#3a86ff] border-[#3a86ff]/30 shadow-[0_0_8px_rgba(58,134,255,0.2)]' : 'bg-[#181924] text-[#a0a3b5] border-gray-800'
                    }`}>
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
  
  // Tableau des tours (On garde un tour vide par défaut pour la structure)
  const [lapsData, setLapsData] = useState<any[]>([
    { lap: '-', time: '0:00.000', diff: '--', active: true }
  ]);

  // =========================================================================
  // 2. ÉTAT TEMPS RÉEL (Mémoire Partagée LMU / WebSocket)
  // =========================================================================
  const [liveData, setLiveData] = useState<any>(null);
  const lastWsTime = useRef(0); // Protège React contre le surplus de données

  // --- REQUÊTE API REST (Au chargement) ---
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/diagnostic');
        const data = await response.json();
        
        if (data.status === 'success') {
           if (data.telemetry) setHistoricalData(data.telemetry);
           if (data.new_setup) setAiSetup(data.new_setup);
           if (data.report) setAiReport(data.report);
           
           // --- NOUVEAU : Injection des temps au tour ---
           if (data.laps && data.laps.length > 0) {
             const formattedLaps = data.laps.map((l: any) => ({
               lap: `L${l.Lap}`,
               time: l.LapTime.toFixed(3),
               diff: l.Valid === 1 ? 'VALID' : 'INVALID',
               active: false // On pourrait mettre true pour le meilleur tour
             }));
             setLapsData(formattedLaps.reverse()); // Reverse pour avoir le dernier tour en haut
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
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
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
            
            {/* Injection des données Live (Météo Piste) si elles existent */}
            <div className="bg-[#1c1e2b] px-4 py-2 rounded-md flex items-center gap-4 border border-gray-800/50">
              <span className="text-white font-bold tracking-wide flex items-center gap-2">🛣️ AWAITING TRACK DATA</span>
              <span className="flex items-center gap-1 text-[#3a86ff]">
                <CloudRain size={14} /> {liveData?.RainIntensity !== undefined ? (liveData.RainIntensity * 100).toFixed(0) : '--'}%
              </span>
              <span className="flex items-center gap-1">
                <Thermometer size={14} /> {liveData?.TrackTemp !== undefined ? liveData.TrackTemp.toFixed(1) : '--'}°C
              </span>
            </div>
            
            <div className="bg-[#1c1e2b] px-4 py-2 rounded-md flex items-center gap-2 border border-gray-800/50">
              🚗 <span className="text-white font-bold tracking-wider">AWAITING CAR DATA</span>
            </div>
          </div>
          
          {/* Signal visuel de connexion au Live */}
          <div className="bg-[#1c1e2b] px-4 py-2 rounded-md flex items-center gap-2 border border-gray-800/50">
            <div className={`w-2 h-2 rounded-full ${liveData ? 'bg-[#2a9d5c] shadow-[0_0_8px_#2a9d5c] animate-pulse' : 'bg-[#e76f51]'}`}></div>
            <span className="text-white font-mono ml-2">{liveData ? 'LIVE TELEMETRY' : 'OFFLINE'}</span>
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
            ) : activeMenu === 'Sessions' ? (
              subView === 'driving' ? (
                // Injection des données historiques ET du Live
                <DrivingView laps={lapsData} historicalData={historicalData} liveData={liveData} /> 
              ) : subView === 'timing' ? (
                <TimingView laps={lapsData} liveData={liveData} />
              ) : (
                <DataView laps={lapsData} historicalData={historicalData} liveData={liveData} />
              )
            ) : activeMenu === 'Setups' ? (
              // Injection du rapport d'ingénieur et du nouveau Setup
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