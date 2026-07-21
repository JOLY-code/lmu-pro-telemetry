import { useState } from 'react';
import { 
  LayoutDashboard, LineChart, Wrench, Trophy, UserCircle, HelpCircle, 
  Compass, BarChart2, Activity, CloudRain, Thermometer, Fuel, 
  Lock, Search, RefreshCw, Cloud, Route, Trash2, Timer,
  Settings, Info, ArrowBigRight, Zap, AlertTriangle, CheckCircle2,
  Upload, Calendar, MapPin, CarFront, ChevronRight, Play
} from 'lucide-react';
import { ResponsiveContainer, LineChart as RechartsLine, Line, YAxis, Tooltip, ReferenceLine } from 'recharts';

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

// --- COMPOSANT VUE DATA COMPLET (100% Coach Dave Replica) ---
const DataView = ({ laps }: any) => {
  // État pour traquer la position de la souris sur les graphiques
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Génération des données de simulation
  const data = Array.from({ length: 150 }, (_, i) => {
    const isBraking = Math.sin(i / 10) > 0.5;
    const speedBase = 150 + Math.sin(i / 15) * 100;
    return {
      distance: i,
      delta: Math.sin(i / 20) * -0.4,
      speedMy: Math.max(50, speedBase),
      speedRef: Math.max(50, speedBase + (Math.random() * 5 - 1)),
      throttleMy: isBraking ? 0 : 100,
      throttleRef: isBraking ? 0 : 100 - Math.random() * 5,
      brakeMy: isBraking ? 80 + Math.random() * 20 : 0,
      brakeRef: isBraking ? 75 + Math.random() * 15 : 0,
    };
  });

  const refColor = "#e9c46a"; // Jaune/Doré de référence Coach Dave

  // --- MATHÉMATIQUES DU CIRCUIT ---
  // Calcul de la position du point sur la courbe de Bézier SVG (Imola Zoom) en fonction du hover du graphique
  let dotX = 91;
  let dotY = 115;
  if (hoverIndex !== null && hoverIndex >= 0) {
    const t = hoverIndex / (data.length - 1);
    const invT = 1 - t;
    // Points de la courbe M 80,200 Q 90,60 200,40
    dotX = invT * invT * 80 + 2 * invT * t * 90 + t * t * 200;
    dotY = invT * invT * 200 + 2 * invT * t * 60 + t * t * 40;
  }

  // Événements pour synchroniser le point de la carte
  const handleMouseMove = (e: any) => {
    if (e && e.activeTooltipIndex !== undefined) setHoverIndex(e.activeTooltipIndex);
  };
  const handleMouseLeave = () => setHoverIndex(null);

  return (
    <div className="flex-1 flex gap-6 h-full">
      {/* COLONNE GAUCHE : GRAPHIQUES EMPILÉS & HUD */}
      <div className="flex-1 flex flex-col gap-2">
        
        {/* 1. DELTA (Violet) */}
        <div className="flex-[1.2] bg-[#212332] border border-gray-800 rounded-lg relative p-2 pt-4">
          <span className="absolute top-2 left-3 text-[10px] font-bold text-[#8338ec]">DELTA</span>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLine data={data} syncId="dataSync" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
              <YAxis hide domain={[-1, 1]} />
              <Tooltip content={<CrosshairTooltip colorMy="#8338ec" colorRef={refColor} unit="S" />} cursor={{ stroke: '#3a86ff', strokeWidth: 1.5 }} isAnimationActive={false} />
              <ReferenceLine y={0} stroke="#333" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="delta" stroke="#8338ec" strokeWidth={2} dot={false} isAnimationActive={false} />
            </RechartsLine>
          </ResponsiveContainer>
        </div>

        {/* 2. SPEED (Bleu) */}
        <div className="flex-[2] bg-[#212332] border border-gray-800 rounded-lg relative p-2 pt-4">
          <span className="absolute top-2 left-3 text-[10px] font-bold text-[#3a86ff]">SPEED</span>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLine data={data} syncId="dataSync" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
              <YAxis hide domain={[0, 300]} />
              <Tooltip content={<CrosshairTooltip colorMy="#3a86ff" colorRef={refColor} unit="KMH" />} cursor={{ stroke: '#3a86ff', strokeWidth: 1.5 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="speedMy" stroke="#3a86ff" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="speedRef" stroke={refColor} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </RechartsLine>
          </ResponsiveContainer>
        </div>

        {/* 3. THROTTLE (Vert) */}
        <div className="flex-[2] bg-[#212332] border border-gray-800 rounded-lg relative p-2 pt-4">
          <span className="absolute top-2 left-3 text-[10px] font-bold text-[#2a9d8f]">THROTTLE</span>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLine data={data} syncId="dataSync" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
              <YAxis hide domain={[0, 105]} />
              <Tooltip content={<CrosshairTooltip colorMy="#2a9d8f" colorRef={refColor} unit="%" />} cursor={{ stroke: '#3a86ff', strokeWidth: 1.5 }} isAnimationActive={false} />
              <Line type="stepBefore" dataKey="throttleMy" stroke="#2a9d8f" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="stepBefore" dataKey="throttleRef" stroke={refColor} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </RechartsLine>
          </ResponsiveContainer>
        </div>

        {/* 4. BRAKE (Rouge) */}
        <div className="flex-[2] bg-[#212332] border border-gray-800 rounded-lg relative p-2 pt-4">
          <span className="absolute top-2 left-3 text-[10px] font-bold text-[#e76f51]">BRAKE</span>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLine data={data} syncId="dataSync" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
              <YAxis hide domain={[0, 105]} />
              <Tooltip content={<CrosshairTooltip colorMy="#e76f51" colorRef={refColor} unit="%" />} cursor={{ stroke: '#3a86ff', strokeWidth: 1.5 }} isAnimationActive={false} />
              <Line type="stepBefore" dataKey="brakeMy" stroke="#e76f51" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="stepBefore" dataKey="brakeRef" stroke={refColor} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </RechartsLine>
          </ResponsiveContainer>
        </div>

        {/* HUD INFÉRIEUR (Parfaitement calqué sur image_49436a) */}
        <div className="flex flex-col gap-3 mt-2">
          {/* Ligne des Temps et Météo */}
          <div className="flex justify-between items-center bg-[#181924] pt-2">
            
            {/* My Lap */}
            <div className="flex items-center gap-4">
              <div className="bg-[#192434] text-[#3a86ff] px-3 py-1.5 rounded flex items-center gap-3 font-mono font-bold text-[13px] border border-[#3a86ff]/20">
                1:44.475
                <span className="w-px h-4 bg-gray-700"></span>
                <span className="flex items-center gap-1.5 text-[11px] font-sans text-[#a0a3b5]">
                  <CloudRain size={12} className="text-[#3a86ff]"/> 0% 
                  <Cloud size={12} className="text-[#3a86ff]"/> 18°C 
                  <Fuel size={12} className="text-[#3a86ff]"/> 73.49 L
                </span>
              </div>
              <span className="text-[#3a86ff] font-bold text-xs tracking-wide">MY LAP</span>
            </div>
            
            {/* Delta Central */}
            <div className="text-[#2a9d5c] font-mono font-black text-xl tracking-widest drop-shadow-[0_0_8px_rgba(42,157,92,0.8)]">
              -0.035S
            </div>

            {/* Reference */}
            <div className="flex items-center gap-4">
              <span className="text-[#e9c46a] font-bold text-xs tracking-wide">REFERENCE</span>
              {/* Icône Soleil/Coucher de soleil */}
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-red-800 shadow-inner flex items-center justify-center border border-orange-900/50">
                <div className="w-5 h-5 rounded-full bg-black/40"></div>
              </div>
              <div className="bg-[#332a18] text-[#e9c46a] px-3 py-1.5 rounded flex items-center gap-3 font-mono font-bold text-[13px] border border-[#e9c46a]/20">
                1:44.362
                <span className="w-px h-4 bg-gray-700"></span>
                <span className="flex items-center gap-1.5 text-[11px] font-sans text-[#a0a3b5]">
                  <CloudRain size={12} className="text-[#e9c46a]"/> 0% 
                  <Cloud size={12} className="text-[#e9c46a]"/> 19°C 
                  <Fuel size={12} className="text-[#e9c46a]"/> 7.10 L
                </span>
              </div>
            </div>
          </div>

          {/* Ligne des Outils et Secteurs */}
          <div className="flex items-center justify-between pb-1">
            {/* Outils Gauche */}
            <div className="flex items-center gap-1.5">
              <button className="bg-[#212332] p-1.5 rounded text-[#a0a3b5] hover:text-white transition border border-gray-800"><Lock size={14} /></button>
              <button className="bg-[#3a86ff] p-1.5 rounded text-white shadow-[0_0_12px_rgba(58,134,255,0.6)]"><Route size={14} /></button>
            </div>
            
            {/* Blocs Secteurs */}
            <div className="flex-1 flex gap-1.5 mx-4 justify-center">
              <div className="bg-[#1e3b2e] text-[#2a9d5c] rounded px-3 py-1.5 text-[11px] font-bold">SQ1 -0.04s</div>
              <div className="bg-[#3d1e20] text-[#e76f51] rounded px-3 py-1.5 text-[11px] font-bold">SQ2 +0.06s</div>
              <div className="bg-[#1e3b2e] text-[#2a9d5c] rounded px-3 py-1.5 text-[11px] font-bold">SQ3 -0.18s</div>
              <div className="bg-[#2a2c3d] text-[#a0a3b5] rounded px-3 py-1.5 text-[11px] font-bold">SQ4 -0.00s</div>
              
              {/* Le Secteur Actif avec le Glow Rouge de l'image */}
              <div className="bg-[#3d1e20] text-[#e76f51] border border-[#e76f51] shadow-[0_0_10px_rgba(231,111,81,0.6)] rounded px-3 py-1.5 text-[11px] font-bold relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-[#e76f51]/20 to-transparent animate-pulse"></div>
                 SQ5 +0.18s
              </div>
              
              <div className="bg-[#1e3b2e] text-[#2a9d5c] rounded px-3 py-1.5 text-[11px] font-bold">SQ6 -0.16s</div>
              <div className="bg-[#1e3b2e] text-[#2a9d5c] rounded px-3 py-1.5 text-[11px] font-bold">SQ7 -0.12s</div>
              <div className="bg-[#3d1e20] text-[#e76f51] rounded px-3 py-1.5 text-[11px] font-bold">SQ8 +0.36s</div>
            </div>
            
            {/* Outils Droite */}
            <div className="flex items-center gap-1.5">
              <button className="bg-[#212332] p-1.5 rounded text-[#a0a3b5] hover:text-white transition border border-gray-800"><Search size={14}/></button>
              <button className="bg-[#212332] p-1.5 rounded text-[#a0a3b5] hover:text-white transition border border-gray-800"><Trash2 size={14}/></button>
            </div>
          </div>
        </div>
      </div>

      {/* COLONNE DROITE : MAP DYNAMIQUE & STINTS */}
      <div className="w-80 flex flex-col gap-4">
        {/* MAP OVERVIEW BOX (Identique à image_494a6c) */}
        <div className="h-64 bg-[#181924] border border-[#212332] rounded-lg relative overflow-hidden flex flex-col shadow-lg">
          {/* Top Left Mini Map (Imola outline) */}
          <div className="absolute top-4 left-4 w-28 h-16 opacity-70">
            <svg viewBox="0 0 200 100" className="w-full h-full drop-shadow-md">
              <path d="M 20,70 L 10,80 L 15,90 L 40,85 L 120,80 L 150,50 L 140,20 L 110,25 L 90,15 L 85,25 Z" fill="none" stroke="#4a4d65" strokeWidth="3" strokeLinejoin="round"/>
              <circle cx="85" cy="25" r="5" fill="#2a9d8f" />
            </svg>
          </div>
          
          {/* Zoomed Track Line Dynamique */}
          <div className="flex-1 w-full h-full relative mt-8">
            <svg viewBox="0 0 200 200" className="w-full h-full absolute -right-6 bottom-0">
              {/* Track limits (Darker inner, lighter outer) */}
              <path d="M 80,200 Q 90,60 200,40" fill="none" stroke="#212332" strokeWidth="24" />
              <path d="M 80,200 Q 90,60 200,40" fill="none" stroke="#181924" strokeWidth="22" />
              
              {/* Reference Line (Yellow/Orange dashed) */}
              <path d="M 85,200 Q 98,58 200,45" fill="none" stroke="#e9c46a" strokeWidth="1.5" strokeDasharray="4 3" />
              
              {/* My Lap Line (Cyan) */}
              <path d="M 75,200 Q 82,62 200,38" fill="none" stroke="#2a9d8f" strokeWidth="2" />
              
              {/* Point dynamique de position voiture */}
              <circle 
                cx={dotX} cy={dotY} r="4" 
                fill="#2a9d8f" 
                className="drop-shadow-[0_0_6px_#2a9d8f] transition-all duration-75 ease-out" 
              />
            </svg>
          </div>
        </div>

        {/* Le bloc STINTS existant... */}
        <div className="flex-1 bg-[#212332] border border-gray-800 rounded-lg flex flex-col overflow-hidden shadow-lg">
          <div className="flex bg-[#181924]">
            <button className="flex-1 bg-[#3a86ff] text-white text-xs font-bold py-3 shadow-md">STINTS</button>
            <button className="flex-1 text-[#a0a3b5] text-xs font-bold py-3 hover:bg-gray-800 transition-colors">SPLITS</button>
          </div>
          
          <div className="p-3 bg-[#1c1e2b] border-y border-gray-800 flex justify-between items-center text-xs font-bold">
            <span className="text-white tracking-widest">STINT 2</span>
            <span className="text-[#8338ec] flex items-center gap-1"><RefreshCw size={12}/> 1:44.475</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {laps.map((l: any) => (
              <div key={l.lap} className={`flex items-center px-4 py-2.5 rounded-md cursor-pointer transition-colors ${l.active ? 'bg-[#3a86ff]/20 border border-[#3a86ff]/50 text-white' : 'hover:bg-gray-800 text-[#a0a3b5]'}`}>
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

// Données de test (simulation de télémétrie pour les graphiques)
const telemetryData = [
  { distance: 0, speed: 120, throttle: 100, brake: 0 },
  { distance: 100, speed: 250, throttle: 100, brake: 0 },
  { distance: 200, speed: 280, throttle: 80, brake: 0 },
  { distance: 300, speed: 140, throttle: 0, brake: 100 },
  { distance: 400, speed: 90, throttle: 20, brake: 40 },
  { distance: 500, speed: 180, throttle: 100, brake: 0 },
  { distance: 600, speed: 260, throttle: 100, brake: 0 },
];

// --- COMPOSANT VUE DRIVING (100% Coach Dave Replica avec Map Géante & IA Insights Optimisé) ---
const DrivingView = ({ laps }: any) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showInsights, setShowInsights] = useState(true);

  // Simulation de données
  const data = Array.from({ length: 200 }, (_, i) => {
    const percent = i / 200;
    const isBraking = percent > 0.3 && percent < 0.4 || percent > 0.7 && percent < 0.85;
    const isAccelerating = !isBraking && (percent < 0.25 || percent > 0.45 && percent < 0.65 || percent > 0.9);
    
    return {
      index: i,
      speedMy: 100 + Math.sin(percent * Math.PI * 4) * 80 + (isAccelerating ? 40 : -20),
      speedRef: 100 + Math.sin(percent * Math.PI * 4) * 80 + (isAccelerating ? 45 : -15),
      throttleMy: isAccelerating ? 100 : 0,
      throttleRef: isAccelerating ? 95 : 0,
      brakeMy: isBraking ? 80 : 0,
      brakeRef: isBraking ? 75 : 0,
      gearMy: Math.max(1, Math.floor((100 + Math.sin(percent * Math.PI * 4) * 80) / 40)),
      gearRef: Math.max(1, Math.floor((100 + Math.sin(percent * Math.PI * 4) * 80) / 40)),
    };
  });

  // Calcul dynamique de la position du point sur la grande carte
  let dotX = -10, dotY = -10;
  if (hoverIndex !== null) {
    const t = hoverIndex / (data.length - 1);
    const invT = 1 - t;
    dotX = invT * invT * 50 + 2 * invT * t * 400 + t * t * 900;
    dotY = invT * invT * 250 + 2 * invT * t * 50 + t * t * 350;
  }

  const activeData = hoverIndex !== null ? data[hoverIndex] : data[0];

  return (
    <div className="flex-1 relative bg-[#1c1e2b] rounded-xl border border-gray-800 overflow-hidden shadow-2xl flex flex-col flex-row">
      
      {/* BANDEAU IA INSIGHTS DÉPLIABLE (Optimisé Pixel-Perfect) */}
      <div 
        className={`absolute left-0 top-0 h-full bg-[#11111a] border-r-2 border-[#5b21b6] shadow-[10px_0_30px_rgba(0,0,0,0.5)] z-20 transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${showInsights ? 'w-80' : 'w-0'}`}
      >
        <div className={`w-80 p-5 flex flex-col h-full transition-opacity duration-300 ${showInsights ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-white text-[13px] font-bold leading-relaxed mb-4 pr-2">
            Looks like you are losing the most time in SQ8. Here is how you can improve:
          </p>
          
          <button className="w-full bg-[#5b21b6] hover:bg-[#6d28d9] transition-colors text-white font-bold py-2.5 rounded shadow-[0_0_15px_rgba(91,33,182,0.4)] flex items-center justify-center gap-2 mb-6 uppercase tracking-wider text-[13px]">
            <Activity size={16} /> SHOW ME
          </button>

          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 pb-4 scrollbar-hide">
            
            {/* Insight 1 */}
            <div className="bg-[#11111a] border border-[#4c1d95] rounded-lg p-4 flex gap-3 shadow-lg">
              <div className="mt-1 flex-shrink-0"><div className="w-7 h-7 rounded-full bg-[#2e1065] flex items-center justify-center"><Activity size={12} className="text-[#a855f7]" /></div></div>
              <p className="text-[#94a3b8] text-xs leading-relaxed">
                You were on the brakes <strong className="text-white">2.3s more</strong>, you might be over-slowing or inefficient in your application.
              </p>
            </div>

            {/* Insight 2 */}
            <div className="bg-[#11111a] border border-[#4c1d95] rounded-lg p-4 flex gap-3 shadow-lg">
              <div className="mt-1 flex-shrink-0"><div className="w-7 h-7 rounded-full bg-[#2e1065] flex items-center justify-center"><Activity size={12} className="text-[#a855f7]" /></div></div>
              <p className="text-[#94a3b8] text-xs leading-relaxed">
                You were on the throttle <strong className="text-white">1.9s less</strong> overall. You may be hesitating on the power delivery.
              </p>
            </div>

            {/* Insight 3 */}
            <div className="bg-[#11111a] border border-[#4c1d95] rounded-lg p-4 flex gap-3 shadow-lg">
              <div className="mt-1 flex-shrink-0"><div className="w-7 h-7 rounded-full bg-[#2e1065] flex items-center justify-center"><Activity size={12} className="text-[#a855f7]" /></div></div>
              <p className="text-[#94a3b8] text-xs leading-relaxed">
                Your lap was slower and, on average, you began braking <strong className="text-white">6 m earlier</strong>. Try braking later.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* BOUTON POUR PLIER/DÉPLIER LE BANDEAU (Style Onglet Noir & Violet) */}
      <button 
        onClick={() => setShowInsights(!showInsights)}
        className={`absolute top-6 z-30 bg-[#11111a] border-y-2 border-r-2 border-[#5b21b6] border-l-0 text-white py-4 px-1 rounded-r-lg shadow-[5px_0_15px_rgba(0,0,0,0.5)] hover:bg-[#1a1a24] transition-all duration-300 flex items-center justify-center ${showInsights ? 'left-80' : 'left-0'}`}
        title="Toggle AI Insights"
      >
        <span 
          className="text-[10px] font-black tracking-[0.2em] uppercase text-white" 
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
        >
          Insights
        </span>
      </button>

      {/* ========================================================= */}
      {/* LE RESTE DE LA VUE DRIVING (Map & HUD) */}
      {/* ========================================================= */}

      {/* 1. MAP BACKGROUND GÉANTE */}
      <div className={`absolute inset-0 h-full transition-all duration-300 pointer-events-none ${showInsights ? 'ml-80 w-[calc(100%-20rem)]' : 'w-full'}`}>
        <svg viewBox="0 0 1000 400" className="w-full h-full object-cover opacity-90">
          <defs>
            <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              {data.map((d, i) => {
                let color = "#3a86ff"; 
                if (d.brakeMy > 0) color = "#e76f51"; 
                else if (d.throttleMy > 0) color = "#2a9d5c"; 
                return <stop key={i} offset={`${(i / data.length) * 100}%`} stopColor={color} />;
              })}
            </linearGradient>
          </defs>

          {/* Lignes de circuit */}
          <path d="M 50,240 Q 400,40 900,340" fill="none" stroke="#e9c46a" strokeWidth="2" strokeDasharray="6 4" />
          <path d="M 50,250 Q 400,50 900,350" fill="none" stroke="url(#trackGradient)" strokeWidth="4" />
          
          {hoverIndex !== null && (
            <circle cx={dotX} cy={dotY} r="6" fill="#ffffff" className="drop-shadow-[0_0_8px_#ffffff]" />
          )}
        </svg>

        <div className="absolute top-6 left-6 w-32 opacity-50">
          <svg viewBox="0 0 200 100">
             <path d="M 20,70 L 10,80 L 15,90 L 40,85 L 120,80 L 150,50 L 140,20 L 110,25 L 90,15 L 85,25 Z" fill="none" stroke="#a0a3b5" strokeWidth="3" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* 2. PANNEAU STINTS DROITE */}
      <div className="absolute top-6 right-6 w-80 bg-[#212332]/95 backdrop-blur-md border border-gray-800 rounded-lg flex flex-col shadow-2xl z-10 h-[50vh]">
        <div className="flex bg-[#181924] rounded-t-lg overflow-hidden">
          <button className="flex-1 bg-[#3a86ff] text-white text-xs font-bold py-3 shadow-md">STINTS</button>
          <button className="flex-1 text-[#a0a3b5] text-xs font-bold py-3 hover:bg-gray-800 transition-colors">SPLITS</button>
        </div>
        <div className="p-3 bg-[#1c1e2b]/80 border-y border-gray-800 flex justify-between items-center text-xs font-bold">
          <span className="text-white tracking-widest">STINT 2</span>
          <span className="text-[#8338ec] flex items-center gap-1"><RefreshCw size={12}/> 1:44.475</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {laps.map((l: any) => (
            <div key={l.lap} className={`flex items-center px-4 py-2.5 rounded-md cursor-pointer transition-colors ${l.active ? 'bg-[#3a86ff]/20 border border-[#3a86ff]/50 text-white' : 'hover:bg-gray-800 text-[#a0a3b5]'}`}>
              <span className="w-8 text-[11px] font-bold">{l.lap}</span>
              <span className="flex-1 font-mono text-xs font-bold">{l.time}</span>
              <span className="text-[10px] font-bold">{l.diff}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1"></div> 

      {/* 3. HUD INFÉRIEUR (Ajusté en fonction du bandeau Insight) */}
      <div className={`relative z-10 bg-[#181924]/95 backdrop-blur-xl border-t border-gray-800 flex flex-col p-4 gap-2 transition-all duration-300 ${showInsights ? 'ml-80' : 'ml-0'}`}>
        
        {/* Entête Temps & Météo */}
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-4">
            <div className="bg-[#1c2438] text-[#3a86ff] px-3 py-1.5 rounded flex items-center gap-3 font-mono font-bold text-xs border border-[#3a86ff]/20">
              0:37.358 <span className="w-px h-3 bg-gray-700"></span>
              <span className="flex items-center gap-1.5 text-[10px] text-[#a0a3b5]"><CloudRain size={10} className="text-[#3a86ff]"/> 0% <Cloud size={10} className="text-[#3a86ff]"/> 18°C <Fuel size={10} className="text-[#3a86ff]"/> 72.40 L</span>
            </div>
            <span className="text-[#3a86ff] font-bold text-xs tracking-wide">MY LAP</span>
          </div>
          <div className="text-[#2a9d5c] font-mono font-black text-lg tracking-widest drop-shadow-[0_0_8px_rgba(42,157,92,0.8)]">-0.295S</div>
          <div className="flex items-center gap-4">
            <span className="text-[#e9c46a] font-bold text-xs tracking-wide">REFERENCE</span>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-800 flex items-center justify-center border border-orange-900/50"><div className="w-4 h-4 rounded-full bg-black/40"></div></div>
            <div className="bg-[#332a18] text-[#e9c46a] px-3 py-1.5 rounded flex items-center gap-3 font-mono font-bold text-xs border border-[#e9c46a]/20">
              0:39.653 <span className="w-px h-3 bg-gray-700"></span>
              <span className="flex items-center gap-1.5 text-[10px] text-[#a0a3b5]"><CloudRain size={10} className="text-[#e9c46a]"/> 0% <Cloud size={10} className="text-[#e9c46a]"/> 19°C <Fuel size={10} className="text-[#e9c46a]"/> 6.80 L</span>
            </div>
          </div>
        </div>

        {/* Barres de Télémétrie Dynamiques */}
        <div className="flex items-center justify-between bg-[#212332] p-2 rounded-lg border border-gray-800">
          <div className="flex items-center gap-3 w-[45%]">
            <div className="w-6 h-6 rounded-full border-2 border-[#3a86ff] flex items-center justify-center text-[#3a86ff]">🛞</div>
            <div className="flex-1 h-3 bg-gray-900 rounded overflow-hidden flex"><div style={{width: `${activeData.throttleMy}%`}} className="bg-[#2a9d5c] h-full transition-all duration-75"></div></div>
            <span className="w-8 text-[10px] font-bold text-[#2a9d5c] text-right">{Math.round(activeData.throttleMy)}%</span>
            <div className="w-16 h-3 bg-gray-900 rounded overflow-hidden flex"><div style={{width: `${activeData.brakeMy}%`}} className="bg-[#e76f51] h-full transition-all duration-75"></div></div>
            <span className="w-6 text-[10px] font-bold text-[#e76f51] text-right">{Math.round(activeData.brakeMy)}%</span>
            <span className="text-[11px] font-bold text-white ml-2 flex gap-2">⚙️ {activeData.gearMy} <span className="text-[#a0a3b5]">🚀 {Math.round(activeData.speedMy)} KMH</span></span>
          </div>
          
          <div className="w-12 h-6 bg-[#181924] rounded-full border border-gray-700 flex items-center px-1"><div className="w-4 h-4 bg-[#3a86ff] rounded-full"></div></div>

          <div className="flex items-center gap-3 w-[45%] justify-end">
            <span className="text-[11px] font-bold text-white flex gap-2"><span className="text-[#a0a3b5]">🚀 {Math.round(activeData.speedRef)} KMH</span> ⚙️ {activeData.gearRef}</span>
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

        {/* Sectors */}
        <div className="flex items-center gap-1 mt-1">
          <button className="bg-[#212332] p-1.5 rounded text-gray-500 hover:text-white transition"><Lock size={12} /></button>
          <button className="bg-[#3a86ff] p-1.5 rounded text-white"><Route size={12} /></button>
          <div className="flex-1 grid grid-cols-8 gap-1 mx-2">
             <div className="bg-[#1e3b2e] text-[#2a9d5c] rounded px-3 py-1 text-[10px] font-bold text-center">SQ1 -0.04s</div>
             <div className="bg-[#3d1e20] text-[#e76f51] rounded px-3 py-1 text-[10px] font-bold text-center">SQ2 +0.06s</div>
             <div className="bg-[#1e3b2e] text-[#2a9d5c] rounded px-3 py-1 text-[10px] font-bold text-center">SQ3 -0.18s</div>
             <div className="bg-[#2a2c3d] text-[#a0a3b5] rounded px-3 py-1 text-[10px] font-bold text-center border border-gray-600">SQ4 -0.00s</div>
             <div className="bg-[#3d1e20] text-[#e76f51] rounded px-3 py-1 text-[10px] font-bold text-center">SQ5 +0.18s</div>
             <div className="bg-[#1e3b2e] text-[#2a9d5c] rounded px-3 py-1 text-[10px] font-bold text-center border border-[#2a9d5c] shadow-[0_0_8px_rgba(42,157,92,0.4)]">SQ6 -0.16s</div>
             <div className="bg-[#1e3b2e] text-[#2a9d5c] rounded px-3 py-1 text-[10px] font-bold text-center">SQ7 -0.12s</div>
             <div className="bg-[#3d1e20] text-[#e76f51] rounded px-3 py-1 text-[10px] font-bold text-center">SQ8 +0.36s</div>
          </div>
          <button className="bg-[#212332] p-1.5 rounded text-gray-500 hover:text-white transition"><Search size={12}/></button>
          <button className="bg-[#212332] p-1.5 rounded text-gray-500 hover:text-white transition"><Trash2 size={12}/></button>
        </div>

      </div>
    </div>
  );
};

// --- COMPOSANT VUE TIMING (100% Coach Dave Replica) ---
const TimingView = () => {
  // Simulation des tours pour le tableau
  const timingData = Array.from({ length: 14 }, (_, i) => {
    const lap = i + 1;
    const isBest = lap === 3;
    const isOutLap = lap === 1;
    
    return {
      lap,
      s1: isOutLap ? '47.905' : (38 + Math.random() * 0.5).toFixed(3),
      s2: isOutLap ? '69.007' : (63 + Math.random() * 2).toFixed(3),
      s3: isOutLap ? '40.699' : (39 + Math.random() * 1.5).toFixed(3),
      time: isOutLap ? '2:37.611' : isBest ? '2:21.263' : `2:2${Math.floor(2+Math.random()*2)}.${Math.floor(Math.random()*999).toString().padStart(3, '0')}`,
      delta: isOutLap ? '0.0s' : isBest ? '-1.4s' : `+${(Math.random()*1.5).toFixed(1)}s`,
      rain: '0%',
      airTemp: '18°C',
      trackTemp: '28°C',
      fuel: (4.10 - (Math.random() * 0.2)).toFixed(2) + ' L',
      isBest,
      isOutLap
    };
  });

  // Point personnalisé pour le graphique (Affiche le numéro du tour dans un cercle bleu)
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

  return (
    <div className="flex-1 flex gap-6 h-full overflow-hidden">
      
      {/* GAUCHE : TABLEAU DES TEMPS ET GRAPHIQUE */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        
        {/* Cartes de statistiques (Top Bar) */}
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'TOTAL LAPS', value: '14' },
            { label: 'DRIVING TIME', value: '0H 31M' },
            { label: 'BEST LAP', value: '2:21.263' },
            { label: 'OPTIMAL LAP', value: '2:20.927' },
            { label: 'AVG LAP', value: '2:22.496' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-[#1c1e2b] border border-gray-800 rounded-lg p-3 flex flex-col items-center justify-center shadow-lg">
              <span className="text-white font-mono text-lg font-bold">{stat.value}</span>
              <span className="text-[#a0a3b5] text-[10px] font-bold tracking-widest mt-1">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Tableau principal (Conteneur) */}
        <div className="flex-1 bg-[#1c1e2b] border border-gray-800 rounded-lg flex flex-col shadow-2xl overflow-hidden">
          
          {/* Header du Stint */}
          <div className="flex justify-between items-center bg-[#212332] p-3 border-b border-gray-800">
            <span className="font-bold text-white text-xs tracking-widest">STINT 1</span>
            <div className="flex items-center gap-6 text-xs font-bold">
              <span className="text-[#a0a3b5] flex items-center gap-1"><RefreshCw size={12}/> 14 LAPS</span>
              <span className="text-[#a0a3b5] flex items-center gap-1"><Fuel size={12}/> 3.69 L/LAP</span>
              <span className="text-[#a0a3b5] flex items-center gap-1"><Timer size={12}/> 2:23.870</span>
              <span className="text-[#a855f7] flex items-center gap-1"><Timer size={12}/> 2:21.263</span>
            </div>
          </div>

          {/* Graphique d'allure (Pace Chart) */}
          <div className="h-20 w-full px-4 pt-4 border-b border-gray-800 bg-[#181924]/50">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLine data={timingData}>
                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                <Line type="monotone" dataKey="s2" stroke="#3a86ff" strokeWidth={2} dot={<CustomDot />} isAnimationActive={false} />
              </RechartsLine>
            </ResponsiveContainer>
          </div>

          {/* En-têtes du tableau */}
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

          {/* Lignes du tableau (Scrollable) */}
          <div className="flex-1 overflow-y-auto pb-4">
            {timingData.map((row, idx) => (
              <div 
                key={idx} 
                className={`grid grid-cols-10 gap-2 p-2 text-xs font-mono font-bold text-center items-center border-b border-gray-800/50 transition-colors cursor-pointer
                  ${row.isBest ? 'bg-[#8338ec] text-white shadow-[0_0_15px_rgba(131,56,236,0.3)] z-10 relative' : 'text-[#a0a3b5] hover:bg-[#212332]'}
                `}
              >
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
              <span className="text-[#2a9d5c] font-mono text-xl font-bold">58.00 L</span>
              <span className="text-[#a0a3b5] text-[9px] font-bold mt-1 flex items-center gap-1"><Fuel size={10}/> REQUIRED FUEL</span>
            </div>
            <div className="bg-[#181924] border border-gray-800 rounded p-3 flex flex-col items-center">
              <span className="text-[#3a86ff] font-mono text-xl font-bold">0.00 %</span>
              <span className="text-[#a0a3b5] text-[9px] font-bold mt-1 flex items-center gap-1"><Activity size={10}/> VIRTUAL ENERGY</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-xs font-bold">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <span className="text-[#a0a3b5] flex items-center gap-2"><Fuel size={14}/> CONSUMPTION</span>
              <span className="text-white font-mono">3.96 L / LAP</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <span className="text-[#a0a3b5] flex items-center gap-2"><Activity size={14}/> VIRTUAL ENERGY</span>
              <span className="text-white font-mono bg-[#181924] border border-gray-700 px-2 py-0.5 rounded">0 % / LAP</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <span className="text-[#a0a3b5] flex items-center gap-2"><Timer size={14}/> AVG LAP TIME</span>
              <span className="text-white font-mono">2:22.575</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <span className="text-[#a0a3b5] flex items-center gap-2"><RefreshCw size={14}/> SESSION LENGTH</span>
              <span className="text-white font-mono bg-[#181924] border border-gray-700 px-2 py-0.5 rounded">30 MINS</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <span className="text-[#a0a3b5] flex items-center gap-2"><RefreshCw size={14}/> LAPS REMAINING</span>
              <span className="text-white font-mono bg-[#181924] border border-gray-700 px-2 py-0.5 rounded">13 LAPS</span>
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
          {/* Badge central absolu (Comme sur ton image) */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#212332] px-3 py-1 rounded text-[#a0a3b5] text-[10px] font-black tracking-widest border border-gray-800 z-10">
            TIRES
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 relative z-0">
            
            {/* Front Left */}
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full border-[12px] border-[#2e4b3c] flex items-center justify-center bg-[#181924]">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="44%" fill="none" stroke="#2a9d5c" strokeWidth="12" strokeDasharray="100 100" />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-white font-mono text-xl font-bold">76°C</span>
                </div>
              </div>
              <div className="flex justify-between w-full mt-2 text-[10px] font-bold">
                <span className="text-[#a0a3b5] tracking-widest">FRONT L</span>
                <span className="text-[#2a9d5c]">51.2 PSI</span>
              </div>
            </div>

            {/* Front Right */}
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full border-[12px] border-[#2e4b3c] flex items-center justify-center bg-[#181924]">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="44%" fill="none" stroke="#2a9d5c" strokeWidth="12" strokeDasharray="100 100" />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-white font-mono text-xl font-bold">75°C</span>
                </div>
              </div>
              <div className="flex justify-between w-full mt-2 text-[10px] font-bold">
                <span className="text-[#2a9d5c]">50.7 PSI</span>
                <span className="text-[#a0a3b5] tracking-widest">FRONT R</span>
              </div>
            </div>

            {/* Rear Left */}
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full border-[12px] border-[#2e4b3c] flex items-center justify-center bg-[#181924]">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="44%" fill="none" stroke="#2a9d5c" strokeWidth="12" strokeDasharray="100 100" />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-white font-mono text-xl font-bold">71°C</span>
                </div>
              </div>
              <div className="flex justify-between w-full mt-2 text-[10px] font-bold">
                <span className="text-[#a0a3b5] tracking-widest">REAR L</span>
                <span className="text-[#2a9d5c]">50.8 PSI</span>
              </div>
            </div>

            {/* Rear Right */}
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full border-[12px] border-[#2e4b3c] flex items-center justify-center bg-[#181924]">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="44%" fill="none" stroke="#2a9d5c" strokeWidth="12" strokeDasharray="100 100" />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-white font-mono text-xl font-bold">72°C</span>
                </div>
              </div>
              <div className="flex justify-between w-full mt-2 text-[10px] font-bold">
                <span className="text-[#2a9d5c]">50.5 PSI</span>
                <span className="text-[#a0a3b5] tracking-widest">REAR R</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

// --- COMPOSANT VUE SETUPS (Car Setup, Changements & IA Ingénieur) ---
const SetupView = () => {
  const [activeCategory, setActiveCategory] = useState('POWERTRAIN');
  const [selectedParam, setSelectedParam] = useState<any | null>(null);

  const categories = ['POWERTRAIN', 'WHEELS & BRAKES', 'SUSPENSION', 'DAMPERS', 'CHASSIS & AERO'];

  // Base de données simulée structurée par CATÉGORIE > SOUS-CATÉGORIE
  const setupData: any = {
    'POWERTRAIN': {
      'ENGINE': [
        { name: 'Virtual Energy', old: '0%', new: '0%', status: 'same', info: "Niveau d'énergie virtuelle.", advice: "" },
        { name: 'Starting Fuel', old: '100.0L (0.0 laps)', new: '85.0L', status: 'changed', info: "Carburant embarqué.", advice: "La voiture est plus légère d'environ 11 kg. Le freinage sera plus court." },
        { name: 'Rev Limiter', old: '7000', new: '7000', status: 'same', info: "Régime maximal.", advice: "" },
        { name: 'Engine Mixture', old: 'N/A', new: 'Map 1', status: 'changed', info: "Cartographie moteur.", advice: "Plus de puissance disponible, attention à la réaccélération." },
        { name: 'Water radiator cover', old: 'Open', new: 'Open', status: 'same', info: "Refroidissement eau.", advice: "" },
        { name: 'Oil radiator cover', old: 'Open', new: 'Open', status: 'same', info: "Refroidissement huile.", advice: "" },
      ],
      'ELECTRONICS': [
        { name: 'Onboard TC', old: '6', new: '5', status: 'changed', info: "Anti-patinage global.", advice: "Tu as baissé le TC. Le train arrière sera plus joueur en sortie de courbe." },
        { name: 'TC Power Cut', old: '5', new: '5', status: 'same', info: "Coupure de puissance du TC.", advice: "" },
        { name: 'TC Slip Angle', old: 'Linked', new: 'Linked', status: 'same', info: "Angle de glisse toléré.", advice: "" },
        { name: 'Regen level', old: '0%', new: '0%', status: 'same', info: "Récupération d'énergie.", advice: "" },
        { name: 'Electric motor map', old: '0', new: '0', status: 'same', info: "Déploiement électrique.", advice: "" },
      ],
      'DIFFERENTIAL': [
        { name: 'Power', old: '4F/60 deg (24.9%)', new: '4F/60 deg (24.9%)', status: 'same', info: "Blocage à l'accélération.", advice: "" },
        { name: 'Coast', old: '8F/30 deg (64.3%)', new: '8F/30 deg (64.3%)', status: 'same', info: "Blocage au freinage.", advice: "" },
        { name: 'Preload', old: '90.0 Nm', new: '110.0 Nm', status: 'changed', info: "Précharge statique.", advice: "Le train arrière est plus verrouillé au lever de pied. Sous-virage en milieu de courbe à prévoir." },
        { name: 'Front Power', old: '0%', new: '0%', status: 'same', info: "Différentiel avant (AWD).", advice: "" },
        { name: 'Front Coast', old: '0%', new: '0%', status: 'same', info: "Différentiel avant (AWD).", advice: "" },
        { name: 'Front Preload', old: '1', new: '1', status: 'same', info: "Précharge avant (AWD).", advice: "" },
      ],
      'GEARING': [
        { name: 'Ratio Set', old: 'Standard', new: 'Standard', status: 'same', info: "Jeu de boîte de vitesses.", advice: "" }
      ]
    },
    'WHEELS & BRAKES': {
      'FRONT WHEELS': [
        { name: 'Compound', old: 'Medium', new: 'Medium', status: 'same', info: "Gomme.", advice: "" },
        { name: 'Tyre pressure', old: '150 kPa', new: '148 kPa', status: 'changed', info: "Pression à froid.", advice: "Chauffe plus rapide de la carcasse." },
        { name: 'Camber', old: '-2.4 deg', new: '-2.6 deg', status: 'changed', info: "Carrossage.", advice: "Meilleur appui latéral." },
        { name: 'Brake disc', old: '3.20 cm', new: '3.20 cm', status: 'same', info: "Épaisseur du disque.", advice: "" },
      ],
      'REAR WHEELS': [
        { name: 'Compound', old: 'Medium', new: 'Medium', status: 'same', info: "Gomme.", advice: "" },
        { name: 'Tyre pressure', old: '130 kPa', new: '130 kPa', status: 'same', info: "Pression à froid.", advice: "" },
        { name: 'Camber', old: '-1.6 deg', new: '-1.6 deg', status: 'same', info: "Carrossage.", advice: "" },
        { name: 'Brake disc', old: '3.20 cm', new: '3.20 cm', status: 'same', info: "Épaisseur du disque.", advice: "" },
      ],
      'BRAKES': [
        { name: 'Brake bias', old: '49.0:51.0', new: '51.0:49.0', status: 'changed', info: "Répartition.", advice: "Voiture plus stable au freinage droit, mais pivotera moins bien." },
        { name: 'Max pedal force', old: '56 kgf (70%)', new: '56 kgf (70%)', status: 'same', info: "Force Load Cell.", advice: "" },
        { name: 'Front brake duct', old: '67%', new: '67%', status: 'same', info: "Refroidissement freins.", advice: "" },
        { name: 'Rear brake duct', old: '33%', new: '33%', status: 'same', info: "Refroidissement freins.", advice: "" },
      ]
    },
    'SUSPENSION': {
      'FRONT SUSPENSION': [
        { name: 'Spring rate', old: '1100 lbf/in', new: '1150 lbf/in', status: 'changed', info: "Raideur.", advice: "Moins de plongée au freinage." },
        { name: 'Packers', old: '18.0 mm', new: '18.0 mm', status: 'same', info: "Butées.", advice: "" },
        { name: 'Ride height', old: '45.0 mm', new: '42.0 mm', status: 'changed', info: "Hauteur de caisse.", advice: "Plus d'appui aéro, attention aux vibreurs." },
      ],
      'REAR SUSPENSION': [
        { name: 'Spring rate', old: '700 lbf/in', new: '700 lbf/in', status: 'same', info: "Raideur.", advice: "" },
        { name: 'Packers', old: '12.0 mm', new: '12.0 mm', status: 'same', info: "Butées.", advice: "" },
        { name: 'Ride height', old: '70.0 mm', new: '70.0 mm', status: 'same', info: "Hauteur.", advice: "" },
      ]
    },
    'DAMPERS': {
      'FRONT DAMPERS': [
        { name: 'Slow bump', old: '12', new: '12', status: 'same', info: "Compression lente.", advice: "" },
        { name: 'Slow rebound', old: '10', new: '10', status: 'same', info: "Détente lente.", advice: "" },
        { name: 'Fast bump', old: '20', new: '16', status: 'changed', info: "Compression rapide.", advice: "Les vibreurs seront mieux absorbés." },
        { name: 'Fast rebound', old: '10', new: '10', status: 'same', info: "Détente rapide.", advice: "" },
      ],
      'REAR DAMPERS': [
        { name: 'Slow bump', old: '12', new: '12', status: 'same', info: "Compression lente.", advice: "" },
        { name: 'Slow rebound', old: '10', new: '8', status: 'changed', info: "Détente lente.", advice: "L'arrière se lèvera plus vite au freinage." },
        { name: 'Fast bump', old: '20', new: '20', status: 'same', info: "Compression rapide.", advice: "" },
        { name: 'Fast rebound', old: '10', new: '10', status: 'same', info: "Détente rapide.", advice: "" },
      ]
    },
    'CHASSIS & AERO': {
      'FRONT CHASSIS': [
        { name: 'Caster', old: '8.9 deg', new: '8.9 deg', status: 'same', info: "Angle de chasse.", advice: "" },
        { name: 'Toe-in', old: '-0.00 deg', new: '-0.10 deg', status: 'changed', info: "Parallélisme.", advice: "Meilleure inscription en virage." },
        { name: 'Arb size', old: '15mm Med', new: '15mm Med', status: 'same', info: "Barre anti-roulis.", advice: "" },
        { name: 'Wheel range', old: '440 deg', new: '440 deg', status: 'same', info: "Rotation volant.", advice: "" },
      ],
      'REAR CHASSIS': [
        { name: 'Toe-in', old: '0.32 deg', new: '0.32 deg', status: 'same', info: "Pincement arrière.", advice: "" },
        { name: 'Arb size', old: '13mm Med', new: '13mm Med', status: 'same', info: "Barre anti-roulis.", advice: "" },
        { name: 'Rear wing', old: '7.5 deg', new: '8.5 deg', status: 'changed', info: "Aileron arrière.", advice: "Plus de stabilité, moins de vitesse max." },
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
              <Settings className="text-[#3a86ff]"/> QUALIFYING SETUP V2
            </h2>
            <p className="text-[#a0a3b5] text-xs font-bold mt-1 tracking-widest">IMOLA / FERRARI 296 GT3 / DRY</p>
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
                      param.status === 'changed' ? 'bg-[#3a86ff]/20 text-[#3a86ff] border-[#3a86ff]/30 shadow-[0_0_8px_rgba(58,134,255,0.2)]' : 'bg-[#181924] text-white border-gray-800'
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
            {selectedParam ? (
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
            <span className="text-[#2a9d5c] text-[10px] font-black tracking-widest bg-[#1e3b2e] px-2 py-0.5 rounded">OVERSTEER BIASED</span>
          </div>
          <p className="text-[#a0a3b5] text-[11px] leading-relaxed italic">
            "This setup will be highly responsive on turn-in, but requires precise throttle control on exit."
          </p>
        </div>
      </div>
    </div>
  );
};

// --- COMPOSANT VUE DASHBOARD (Centre de commandement & Import) ---
const DashboardView = ({ setActiveMenu }: any) => {
  // Historique simulé des sessions
  const recentSessions = [
    { id: 1, date: 'TODAY, 14:30', track: 'IMOLA', car: 'FERRARI 296 GT3', laps: 14, best: '1:44.475', condition: 'DRY' },
    { id: 2, date: 'YESTERDAY, 21:00', track: 'LE MANS', car: 'PORSCHE 499P', laps: 22, best: '3:28.102', condition: 'WET' },
    { id: 3, date: '18 JULY, 18:45', track: 'SPA-FRANCORCHAMPS', car: 'BMW M4 GT3', laps: 18, best: '2:18.990', condition: 'DRY' },
    { id: 4, date: '15 JULY, 10:15', track: 'SEBRING', car: 'CADILLAC V-SERIES.R', laps: 30, best: '1:46.330', condition: 'DRY' },
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
                <p className="text-[#a855f7] text-[10px] font-bold tracking-widest uppercase mt-0.5">Based on your 5 last sessions</p>
              </div>
            </div>
            <div className="bg-[#1e3b2e] text-[#2a9d5c] px-3 py-1.5 rounded font-black text-xs tracking-widest">
              RATING: PRO-AM
            </div>
          </div>
          
          <div className="flex-1 p-5 grid grid-cols-2 gap-6 z-10 relative">
            <div className="flex flex-col gap-2">
              <h4 className="text-[#e76f51] text-[10px] font-black tracking-widest flex items-center gap-2 mb-1"><AlertTriangle size={12}/> MAJOR TIME LOSS</h4>
              <div className="bg-[#212332] p-3 rounded border border-gray-800 flex flex-col gap-1 shadow-md">
                <span className="text-white text-xs font-bold">Imola - Tosa Hairpin (T7)</span>
                <span className="text-[#a0a3b5] text-[11px] leading-relaxed">You are braking too early and missing the apex. Average time loss vs Reference: <strong className="text-[#e76f51]">-0.45s</strong>.</span>
              </div>
              <div className="bg-[#212332] p-3 rounded border border-gray-800 flex flex-col gap-1 shadow-md">
                <span className="text-white text-xs font-bold">Le Mans - Porsche Curves</span>
                <span className="text-[#a0a3b5] text-[11px] leading-relaxed">Aerodynamic bottoming detected. Raise front ride height or stiffen front packers.</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-[#2a9d5c] text-[10px] font-black tracking-widest flex items-center gap-2 mb-1"><CheckCircle2 size={12}/> STRENGTHS</h4>
              <div className="bg-[#212332] p-3 rounded border border-gray-800 flex flex-col gap-1 shadow-md">
                <span className="text-white text-xs font-bold">Consistent Throttle Application</span>
                <span className="text-[#a0a3b5] text-[11px] leading-relaxed">Your traction out of slow corners is perfectly matching the Pro reference laps.</span>
              </div>
            </div>
          </div>
          <Activity size={250} className="absolute -bottom-16 -right-16 text-[#8338ec] opacity-5 pointer-events-none" />
        </div>

        {/* PANEL DROITE : Import & Compare Engine */}
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
          <span className="text-[#a0a3b5] text-xs font-bold">Showing 4 of 42 sessions</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-2">
            {recentSessions.map((session) => (
              <div 
                key={session.id}
                onClick={() => setActiveMenu('Sessions')}
                className="bg-[#212332] border border-gray-800 hover:border-[#3a86ff]/50 hover:bg-[#181924] transition-all rounded-lg p-4 flex items-center justify-between cursor-pointer group"
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
                    <span className="text-[#a855f7] text-lg font-mono font-bold drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">{session.best}</span>
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
  const [subView, setSubView] = useState<'driving' | 'data' | 'timing'>('timing');

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Sessions', icon: <LineChart size={20} /> },
    { name: 'Setups', icon: <Wrench size={20} /> },
    { name: 'Leaderboards', icon: <Trophy size={20} /> },
    { name: 'Team', icon: <UserCircle size={20} /> },
    { name: 'Support', icon: <HelpCircle size={20} /> },
  ];

  const laps = [
    { lap: 7, time: '2:24.376', diff: '-9.42L' },
    { lap: 8, time: '1:46.422', diff: '3.69L' },
    { lap: 9, time: '1:44.954', diff: '3.09L' },
    { lap: 10, time: '1:44.517', diff: '3.12L' },
    { lap: 11, time: '1:44.475', diff: '3.07L', active: true },
    { lap: 12, time: '2:29.391', diff: '0.50L' },
  ];

  return (
    <div className="flex h-screen w-full bg-[#181924] overflow-hidden font-sans text-white">
      
      {/* 1. SIDEBAR PRINCIPALE */}
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
        
        {/* Top Header Session Bar */}
        <div className="h-16 bg-[#181924] border-b border-gray-800 px-6 flex items-center justify-between text-xs font-semibold text-[#a0a3b5]">
          <div className="flex items-center gap-3">
            {/* LMU class badge */}
            <div className="bg-[#1e3b2e] text-[#2a9d5c] px-3 py-1.5 rounded font-black tracking-widest flex items-center gap-2">
              <span className="italic">LM</span> P
            </div>
            {/* Track Info */}
            <div className="bg-[#1c1e2b] px-4 py-2 rounded-md flex items-center gap-4 border border-gray-800/50">
              <span className="text-white font-bold tracking-wide flex items-center gap-2">
                🛣️ AUTODROMO ENZO E DINO FERRARI
              </span>
              <span className="flex items-center gap-1 text-[#3a86ff]"><CloudRain size={14} /> 0%</span>
              <span className="flex items-center gap-1"><Cloud size={14} /> 18°C</span>
              <span className="flex items-center gap-1"><Thermometer size={14} /> 35°C</span>
            </div>
            {/* Car Info */}
            <div className="bg-[#1c1e2b] px-4 py-2 rounded-md flex items-center gap-2 border border-gray-800/50">
              🚗 <span className="text-white font-bold tracking-wider">FERRARI 296GT3 2023</span>
            </div>
          </div>
          {/* Record */}
          <div className="bg-[#1c1e2b] px-4 py-2 rounded-md flex items-center gap-2 border border-gray-800/50">
            📊 YOUR RECORD <span className="text-white font-mono ml-2">-:--.---</span>
          </div>
        </div>

        {/* Corps de l'application */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sous-menu Coach Dave (Driving / Data / Timing) si on est dans Sessions */}
          {activeMenu === 'Sessions' && (
            <div className="w-16 bg-[#1c1e2b] border-r border-gray-800 flex flex-col items-center py-6 gap-6">
              <button 
                onClick={() => setSubView('driving')}
                title="Driving View"
                className={`p-3 rounded-xl transition-all ${subView === 'driving' ? 'bg-[#3a86ff] text-white shadow-[0_0_15px_rgba(58,134,255,0.4)]' : 'text-[#a0a3b5] hover:bg-gray-800'}`}
              >
                <Compass size={22} />
              </button>
              <button 
                onClick={() => setSubView('timing')}
                title="Timing View"
                className={`p-3 rounded-xl transition-all ${subView === 'timing' ? 'bg-[#3a86ff] text-white shadow-[0_0_15px_rgba(58,134,255,0.4)]' : 'text-[#a0a3b5] hover:bg-gray-800'}`}
              >
                <Timer size={22} />
              </button>
              <button 
                onClick={() => setSubView('data')}
                title="Data View"
                className={`p-3 rounded-xl transition-all ${subView === 'data' ? 'bg-[#3a86ff] text-white shadow-[0_0_15px_rgba(58,134,255,0.4)]' : 'text-[#a0a3b5] hover:bg-gray-800'}`}
              >
                <BarChart2 size={22} />
              </button>
            </div>
          )}

          {/* Affichage des vues dynamiques */}
          <div className="flex-1 p-6 overflow-hidden flex gap-6">
            
            {activeMenu === 'Dashboard' ? (
              // NOUVELLE VUE DASHBOARD (Accueil)
              <DashboardView setActiveMenu={setActiveMenu} />
            ) : activeMenu === 'Sessions' ? (
              // VUE DRIVING, TIMING OU DATA
              subView === 'driving' ? (
                <DrivingView laps={laps} />
              ) : subView === 'timing' ? (
                <TimingView />
              ) : (
                <DataView laps={laps} />
              )
            ) : activeMenu === 'Setups' ? (
              // VUE SETUP
              <SetupView />
            ) : (
              // Vues par défaut des autres menus
              <div className="flex-1 bg-[#212332] rounded-xl border border-gray-800 flex items-center justify-center text-[#a0a3b5] font-bold">
                Module {activeMenu} en cours de construction...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}