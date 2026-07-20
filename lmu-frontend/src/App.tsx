import { useState } from 'react';
import { 
  LayoutDashboard, LineChart, Wrench, Trophy, UserCircle, HelpCircle, 
  Compass, BarChart2, Activity, CloudRain, Thermometer, Fuel, 
  Lock, Search, RefreshCw, Cloud, Route, Trash2
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

export default function App() {
  const [activeMenu, setActiveMenu] = useState('Sessions');
  const [subView, setSubView] = useState<'driving' | 'data'>('driving');

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
          
          {/* Sous-menu Coach Dave (Driving / Data) si on est dans Sessions */}
          {activeMenu === 'Sessions' && (
            <div className="w-16 bg-[#1c1e2b] border-r border-gray-800 flex flex-col items-center py-6 gap-6">
              <button 
                onClick={() => setSubView('driving')}
                title="Driving View"
                className={`p-3 rounded-xl transition-all ${subView === 'driving' ? 'bg-[#3a86ff] text-white shadow-lg shadow-blue-500/30' : 'text-[#a0a3b5] hover:bg-gray-800'}`}
              >
                <Compass size={22} />
              </button>
              <button 
                onClick={() => setSubView('data')}
                title="Data View"
                className={`p-3 rounded-xl transition-all ${subView === 'data' ? 'bg-[#3a86ff] text-white shadow-lg shadow-blue-500/30' : 'text-[#a0a3b5] hover:bg-gray-800'}`}
              >
                <BarChart2 size={22} />
              </button>
            </div>
          )}

          {/* Affichage des vues dynamiques */}
          <div className="flex-1 p-6 overflow-hidden flex gap-6">
            
            {activeMenu === 'Sessions' ? (
              // VUE DRIVING OU VUE DATA
              subView === 'driving' ? (
                <DrivingView laps={laps} />
              ) : (
                <DataView laps={laps} />
              )
            ) : (
              // Vues par défaut des autres menus
              <div className="flex-1 bg-[#212332] rounded-xl border border-gray-800 flex items-center justify-center text-[#a0a3b5] font-bold">
                Module {activeMenu} prêt à être configuré.
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}