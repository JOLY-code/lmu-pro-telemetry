import React, { useState, useEffect, useRef } from 'react'; // <--- AJOUT DE 'React' ICI
import { 
  LayoutDashboard, LineChart, Wrench, Trophy, UserCircle, HelpCircle, 
  Compass, BarChart2, Activity, CloudRain, Thermometer, Fuel, 
  Lock, Search, RefreshCw, Cloud, Route, Trash2, Timer,
  Settings, Info, ArrowBigRight, Zap, AlertTriangle, CheckCircle2,
  Upload, Calendar, MapPin, CarFront, Play,
  CalendarDays, ChevronRight, MonitorPlay, Shield, Clock,
  Filter, Wifi, WifiOff, LayoutGrid, Flag, PlayCircle, Gauge, Droplet,
  Plus, X, Copy, FileText, UploadCloud, Layers, Tag, SlidersHorizontal, ChevronDown, 
  Star, ArrowRight, Settings2, RotateCcw, ArrowUp, ArrowDown,
  MessageSquare, Edit3, Save, CornerUpLeft, MessageCircle, 
  Flame, Wind, Navigation, Pause, StepForward, ChevronLeft, ArrowUpRight,
  Globe, Minus
} from 'lucide-react';

import { 
  ResponsiveContainer, LineChart as RechartsLine, Line, YAxis, XAxis, 
  Tooltip as RechartsTooltip, CartesianGrid, 
  BarChart, Bar, Cell, Tooltip, ReferenceLine, AreaChart, Area, 
  ScatterChart, Scatter, ZAxis, ComposedChart
} from 'recharts';

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

// --- COMPOSANT VUE DRIVING (Vraie Track Map GPS 2D + HUD MyLMU Symétrique Parfait + Traces Pro) ---
const DrivingView = ({ laps, historicalData, liveData }: any) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [showTraces, setShowTraces] = useState(false); // Le Toggle Magique !
  const [xAxisMode, setXAxisMode] = useState<'Dist' | 'Time'>('Dist');
  const [currentSegment, setCurrentSegment] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [followCar, setFollowCar] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // 1. FORMATAGE COMPLET DES DONNÉES (Ajout des Secteurs et Temps au Tour)
  const data = historicalData && historicalData.length > 0 
    ? historicalData.map((d: any, i: number) => ({
        index: i,
        speedMy: d.TopSpeed || 0,
        speedRef: d.TopSpeed_ref || 0, 
        throttleMy: d.Throttle || 0,
        throttleRef: d.Throttle_ref || 0,
        brakeMy: d.Brake || 0,
        brakeRef: d.Brake_ref || 0,
        gearMy: d.Gear || 1,
        gearRef: d.Gear_ref || 1,
        rpmMy: d.EngineRPM || 0,
        rpmRef: d.EngineRPM_ref || 0,
        steeringMy: d.SteeringAngle || 0,
        steeringRef: d.SteeringAngle_ref || 0,
        fuelMy: d.FuelConsumed || 0,
        fuelRef: d.FuelConsumed_ref || 0,
        veMy: d.VirtualEnergy || 0,
        veRef: d.VirtualEnergy_ref || 0,
        airMy: d.AmbientTemp || 0,
        airRef: d.AmbientTemp_ref || 0,
        trackMy: d.TrackTemp || 0,
        trackRef: d.TrackTemp_ref || 0,
        windMy: d.WindSpeed || 0,
        windRef: d.WindSpeed_ref || 0,
        windHeadingMy: d.WindHeading || 0,
        windHeadingRef: d.WindHeading_ref || 0,
        delta: d.delta || 0,
        GPS_Lat: d.GPS_Lat || 0,
        GPS_Lon: d.GPS_Lon || 0,
        // --- NOUVEAU : SECTEURS ET LAP TIME ---
        s1My: d.Sector1 || 0,
        s1Ref: d.Sector1_ref || 0,
        s2My: d.Sector2 || 0,
        s2Ref: d.Sector2_ref || 0,
        s3My: d.Sector3 || 0,
        s3Ref: d.Sector3_ref || 0,
        lapTimeMy: d.LapTime || 0,
        lapTimeRef: d.LapTime_ref || 0,
        distMy: d.LapDist || 0
      }))
    : [];

  // 2. CALCUL DU CADRAGE SVG
  const viewBox = data.length > 0 ? calculateViewBox(data, 300) : "0 0 1000 400";

  // 3. POSITIONNEMENT DE LA VOITURE
  let dotX = -10000, dotY = -10000;
  if (hoverIndex !== null && data[hoverIndex]) {
    dotX = data[hoverIndex].GPS_Lon * 100000;
    dotY = -data[hoverIndex].GPS_Lat * 100000;
  } else if (data.length > 0) {
    dotX = data[0].GPS_Lon * 100000;
    dotY = -data[0].GPS_Lat * 100000;
  }

  const activeData = (hoverIndex !== null && data[hoverIndex]) ? data[hoverIndex] : (data[0] || {});

  // VRAIES VARIABLES D'AFFICHAGE (Live en priorité, sinon Historique)
  const myThrottle = liveData?.Throttle !== undefined ? liveData.Throttle : (activeData.throttleMy || 0);
  const myBrake = liveData?.Brake !== undefined ? liveData.Brake : (activeData.brakeMy || 0);
  const mySpeed = liveData?.Speed !== undefined ? liveData.Speed : (activeData.speedMy || 0);
  const myGear = liveData?.Gear !== undefined ? liveData.Gear : (activeData.gearMy || 1);
  const myRPM = liveData?.EngineRPM !== undefined ? liveData.EngineRPM : (activeData.rpmMy || 0);
  const mySteering = liveData?.Steering !== undefined ? liveData.Steering : (activeData.steeringMy || 0);
  
  const myFuel = liveData?.FuelLevel !== undefined ? liveData.FuelLevel.toFixed(1) : (activeData.fuelMy || 0).toFixed(1);
  const myVE = liveData?.VirtualEnergy !== undefined ? liveData.VirtualEnergy.toFixed(1) : (activeData.veMy || 0).toFixed(1);
  const myAir = liveData?.AmbientTemp !== undefined ? liveData.AmbientTemp.toFixed(1) : (activeData.airMy || 0).toFixed(1);
  const myTrack = liveData?.TrackTemp !== undefined ? liveData.TrackTemp.toFixed(1) : (activeData.trackMy || 0).toFixed(1);
  const myWind = liveData?.WindSpeed !== undefined ? liveData.WindSpeed.toFixed(1) : (activeData.windMy || 0).toFixed(1);
  const myWindHeading = liveData?.WindHeading !== undefined ? liveData.WindHeading : (activeData.windHeadingMy || 0);

  // RÉFÉRENCES (Alien Lap)
  const refThrottle = activeData.throttleRef || 0;
  const refBrake = activeData.brakeRef || 0;
  const refSpeed = activeData.speedRef || 0;
  const refGear = activeData.gearRef || 1;
  const refRPM = activeData.rpmRef || 0;
  const refSteering = activeData.steeringRef || 0;
  
  const refFuel = activeData.fuelRef ? activeData.fuelRef.toFixed(1) : '0.0';
  const refVE = activeData.veRef ? activeData.veRef.toFixed(1) : '0.0';
  const refAir = activeData.airRef ? activeData.airRef.toFixed(1) : '0.0';
  const refTrack = activeData.trackRef ? activeData.trackRef.toFixed(1) : '0.0';
  const refWind = activeData.windRef ? activeData.windRef.toFixed(1) : '0.0';
  const refWindHeading = activeData.windHeadingRef || 0;

  const delta = activeData.delta ? activeData.delta.toFixed(3) : "0.000";
  const deltaDist = activeData.delta ? Math.round(activeData.delta * (mySpeed / 3.6)) : 0; 

  const trackGeom = React.useMemo(() => {
    if (!data || data.length < 2) return null;
    
    const avgLat = data[0].GPS_Lat * (Math.PI / 180);
    const lonScale = Math.cos(avgLat) || 1; // Compensation de la courbure terrestre
    const mToSvg = 100000 / 111320; // Conversion Mètres physiques -> Unités SVG
    
    const centers = [];
    const refs = [];
    let totalEdge = 0;

    for (let i = 0; i < data.length; i++) {
      const pt = data[i];
      // 1. Sauvegarde du parcours de la voiture de référence (Fantôme)
      if (pt.GPS_Lon_ref && pt.GPS_Lat_ref) {
        refs.push(`${pt.GPS_Lon_ref * 100000},${-pt.GPS_Lat_ref * 100000}`);
      }
      
      // 2. Mathématiques du vecteur normal (Perpendiculaire à la piste)
      const prev = i === 0 ? pt : data[i - 1];
      const next = i === data.length - 1 ? pt : data[i + 1];
      
      let dx = next.GPS_Lon - prev.GPS_Lon;
      let dy = -next.GPS_Lat - (-prev.GPS_Lat);
      let len = Math.sqrt(dx*dx + dy*dy);
      if (len === 0) { dx = 1; dy = 0; len = 1; }
      
      const nx = -dy / len;
      const ny = dx / len;

      const cx = pt.GPS_Lon * 100000;
      const cy = -pt.GPS_Lat * 100000;

      // 3. Décalage de la trajectoire pour trouver le CENTRE absolu de la piste
      const centerX = cx + (nx * (pt.PathLateral || 0) * mToSvg) / lonScale;
      const centerY = cy + (ny * (pt.PathLateral || 0) * mToSvg);
      
      centers.push(`${centerX},${centerY}`);
      totalEdge += (pt.TrackEdge || 6); // Largeur de la piste jusqu'à l'herbe
    }

    return {
      surfacePath: "M " + centers.join(" L "),
      refPath: refs.length > 0 ? "M " + refs.join(" L ") : "",
      width: (totalEdge / data.length) * 2 * mToSvg // Largeur totale SVG
    };
  }, [data]);

  // --- NOUVEAU : CALCUL DES 8 SEGMENTS DYNAMIQUES ---
  const trackSegments = React.useMemo(() => {
    if (!data || data.length < 8 || !trackGeom) return [];
    const segmentSize = Math.floor(data.length / 8);
    const segments = [];
    let bestDelta = Infinity;
    let bestIndex = -1;

    for (let i = 0; i < 8; i++) {
      const startIndex = i * segmentSize;
      const endIndex = i === 7 ? data.length - 1 : (i + 1) * segmentSize - 1;
      
      // Calcul du temps perdu/gagné uniquement dans CE segment
      const startDelta = data[startIndex]?.delta || 0;
      const endDelta = data[endIndex]?.delta || 0;
      const segmentDelta = endDelta - startDelta;
      
      if (segmentDelta < bestDelta) {
        bestDelta = segmentDelta;
        bestIndex = i;
      }

      segments.push({
        id: i + 1,
        startIndex,
        endIndex,
        delta: segmentDelta,
        color: segmentDelta > 0 ? '#ef4444' : '#10b981' // Rouge si perte, Vert si gain
      });
    }
    
    // Le meilleur de tous les segments devient Violet
    if (bestIndex !== -1) segments[bestIndex].color = '#a855f7';

    return segments;
  }, [data, trackGeom]);

  // Si on clique sur un segment, on place la tête de lecture au début de ce segment !
  useEffect(() => {
    if (trackSegments.length > 0 && trackSegments[currentSegment - 1]) {
      setHoverIndex(trackSegments[currentSegment - 1].startIndex);
    }
  }, [currentSegment, trackSegments]);
  
  // --- NOUVEAU : FONCTIONS DE CALCUL POUR LE SECTOR COMPARISON ---
  const formatTime = (t: number) => t > 0 ? (t >= 60 ? `${Math.floor(t/60)}:${(t%60).toFixed(3).padStart(6,'0')}` : t.toFixed(3)) : '--.---';
  
  const s1Gap = (activeData.s1My || 0) - (activeData.s1Ref || 0);
  const s2Gap = (activeData.s2My || 0) - (activeData.s2Ref || 0);
  const s3Gap = (activeData.s3My || 0) - (activeData.s3Ref || 0);
  const lapGap = (activeData.lapTimeMy || 0) - (activeData.lapTimeRef || 0);

  const SectorRow = ({ label, myTime, gap, refTime, isBad }: any) => (
    <div className="grid grid-cols-4 gap-2 text-center items-center py-2 font-mono text-[12px] font-bold border-b border-gray-800/40 last:border-0">
      <div className="text-gray-400 text-left font-sans">{label}</div>
      <div className="text-gray-200">{formatTime(myTime)}</div>
      <div className={isBad ? "text-[#ef4444]" : "text-[#10b981]"}>{gap > 0 ? `+${gap.toFixed(3)}` : gap < 0 ? gap.toFixed(3) : '--.---'}</div>
      <div className="text-[#3b82f6]">{formatTime(refTime)}</div>
    </div>
  );

  // === HELPER POUR LES GRAPHIQUES TRACES (Style MoTeC/MyLMU avec Transparence) ===
  const TraceChart = ({ dataKeyMy, dataKeyRef, colorMy, colorRef, label, domain, isStep=false, isArea=false, activeMy, activeRef }: any) => (
    <div className="flex w-full h-[85px] border-b border-gray-800/60 pb-1">
      <div className="w-28 flex flex-col justify-between py-1 pr-2 shrink-0">
        <span className="text-[10px] font-black tracking-widest text-gray-400">{label}</span>
        <div className="flex flex-col">
          <span className="text-xs font-bold" style={{ color: colorMy }}>
             {label === 'DELTA' && activeMy > 0 ? '+' : ''}{label === 'DELTA' ? Number(activeMy).toFixed(3) : Math.round(activeMy)}{label === 'DELTA' ? 's' : ''}
          </span>
          <span className="text-xs font-bold opacity-60" style={{ color: colorRef }}>
             {label === 'DELTA' ? '' : Math.round(activeRef)}
          </span>
        </div>
      </div>
      <div className="flex-1 relative">
        <ResponsiveContainer width="100%" height="100%">
          {isArea ? (
            <AreaChart data={data} syncId="telemetry" margin={{top:5, bottom:5, left:0, right:0}}>
              <YAxis hide domain={domain} />
              <Tooltip content={<></>} cursor={{ stroke: '#ffffff', strokeWidth: 1.5, opacity: 0.5 }} isAnimationActive={false} />
              <Area type="stepBefore" dataKey={dataKeyMy} stroke={colorMy} fill={colorMy} fillOpacity={0.15} strokeWidth={1.5} isAnimationActive={false} />
              <Area type="stepBefore" dataKey={dataKeyRef} stroke={colorRef} fill="none" strokeWidth={1} strokeDasharray="3 3" isAnimationActive={false} />
            </AreaChart>
          ) : (
            <RechartsLine data={data} syncId="telemetry" margin={{top:5, bottom:5, left:0, right:0}}>
              <YAxis hide domain={domain} />
              <Tooltip content={<></>} cursor={{ stroke: '#ffffff', strokeWidth: 1.5, opacity: 0.5 }} isAnimationActive={false} />
              {isStep ? (
                <>
                  <Line type="stepBefore" dataKey={dataKeyMy} stroke={colorMy} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Line type="stepBefore" dataKey={dataKeyRef} stroke={colorRef} strokeWidth={1} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
                </>
              ) : (
                <>
                  <Line type="monotone" dataKey={dataKeyMy} stroke={colorMy} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey={dataKeyRef} stroke={colorRef} strokeWidth={1} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
                </>
              )}
            </RechartsLine>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="flex-1 relative bg-[#090a0f] rounded-xl border border-gray-800 overflow-hidden shadow-2xl flex flex-col">
      
      {/* NOUVEAU : TOP NAVIGATION BAR (MyLMU Style) */}
      <div className="h-12 bg-[#121318] border-b border-gray-800/60 flex items-center justify-between px-4 shrink-0 relative z-40">
        <div className="flex items-center gap-6 h-full">
          <button className="h-full flex items-center gap-2 text-gray-500 hover:text-gray-300 font-bold text-[11px] uppercase tracking-widest transition-colors"><LayoutGrid size={14}/> Overview</button>
          <button className="h-full flex items-center gap-2 text-white font-bold text-[11px] uppercase tracking-widest border-b-2 border-[#3a86ff]"><Route size={14}/> Track Map</button>
          <button className="h-full flex items-center gap-2 text-gray-500 hover:text-gray-300 font-bold text-[11px] uppercase tracking-widest transition-colors"><Activity size={14}/> Pit Wall</button>
          <button className="h-full flex items-center gap-2 text-gray-500 hover:text-gray-300 font-bold text-[11px] uppercase tracking-widest transition-colors"><Wrench size={14}/> Setup</button>
        </div>
        
        {/* Distance Dynamique au centre */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-[#1a1b26] px-4 py-1.5 rounded-lg border border-gray-800 shadow-inner">
          <MapPin size={14} className="text-gray-400" />
          <span className="text-white font-mono font-bold text-xs">{Math.round(activeData.distMy || 0)} M</span>
        </div>
        <div></div>
      </div>

      <div className="flex-1 relative flex flex-row overflow-hidden bg-[#090a0f]">
        
        {/* NOUVEAU : TOOLBAR VERTICALE GAUCHE (100% Connectée) */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-[42px] bg-[#121318]/90 backdrop-blur-md border border-gray-800/60 rounded-2xl flex flex-col items-center py-4 gap-5 z-30 shadow-lg">
          <button className="text-gray-500 hover:text-white transition-colors"><Settings size={18}/></button>
          <button className="text-white font-black text-[11px] tracking-widest">2D</button>
          <div className="w-5 h-[1px] bg-gray-800"></div>
          <button onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 5))} className="text-gray-400 hover:text-white transition-colors"><Plus size={20}/></button>
          <button onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 0.5))} className="text-gray-400 hover:text-white transition-colors"><Minus size={20}/></button>
          <button onClick={() => { setZoomLevel(1); setFollowCar(true); }} className="text-gray-400 hover:text-white transition-colors"><RotateCcw size={16}/></button>
          <div className="w-5 h-[1px] bg-gray-800"></div>
          <div onClick={() => setFollowCar(!followCar)} className="flex flex-col items-center gap-1 cursor-pointer group">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors border shadow-inner ${followCar ? 'bg-[#3b82f6]/20 border-[#3b82f6]/50 text-[#3b82f6]' : 'bg-gray-800/80 border-gray-700 text-white group-hover:bg-gray-700'}`}>
              <CarFront size={16} />
            </div>
            <span className="text-[9px] font-mono text-gray-500 font-bold">{zoomLevel.toFixed(1)}x</span>
          </div>
          <button className="text-gray-500 hover:text-white transition-colors mt-1"><Globe size={18}/></button>
        </div>

        {/* CARTE GPS TOUJOURS EN PLEIN ÉCRAN (Z-0) */}
        <div className="absolute inset-0 flex items-center justify-center z-0 overflow-hidden">
          {data.length > 0 ? (
            <svg viewBox={viewBox} className="w-[90%] h-[90%] object-contain opacity-90 drop-shadow-2xl overflow-visible transition-transform duration-200" style={{ transform: `scale(${zoomLevel || 1})` }}>
              
              {/* 1. BORDURES BLANCHES (Lignes de limites de piste) */}
              {trackGeom && <path d={trackGeom.surfacePath} fill="none" stroke="#ffffff" strokeWidth={(trackGeom.width || 0) + 6} strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />}
              
              {/* 2. ASPHALTE GRIS (La surface roulable) */}
              {trackGeom && <path d={trackGeom.surfacePath} fill="none" stroke="#121318" strokeWidth={trackGeom.width || 0} strokeLinecap="round" strokeLinejoin="round" />}
              
              {/* 3. LIGNE CENTRALE DE LA PISTE (Pointillés discrets) */}
              {trackGeom && <path d={trackGeom.surfacePath} fill="none" stroke="#2a2c3d" strokeWidth="2" strokeDasharray="10 15" strokeLinecap="round" strokeLinejoin="round" />}
              
              {/* 4. TRAJECTOIRE DU FANTÔME (La ligne de référence, jaune pointillée) */}
              {trackGeom && trackGeom.refPath && <path d={trackGeom.refPath} fill="none" stroke="#e9c46a" strokeWidth={showTraces ? "4" : "6"} strokeDasharray="15 10" opacity="0.5" />}

              {/* 5. TA TRAJECTOIRE (Liée à tes pédales) */}
              {data.map((pt: any, i: number) => {
                if (i === 0) return null;
                const prev = data[i - 1];
                let color = "#3a86ff"; 
                if (pt.brakeMy > 5) color = "#ef4444"; 
                else if (pt.throttleMy > 50) color = "#10b981"; 
                return (
                  <line key={i} x1={prev.GPS_Lon * 100000} y1={-prev.GPS_Lat * 100000} x2={pt.GPS_Lon * 100000} y2={-pt.GPS_Lat * 100000} stroke={color} strokeWidth={showTraces ? "16" : "12"} strokeLinecap="round" />
                );
              })}
              
              {/* 6. LA VOITURE (Point lumineux) */}
              {hoverIndex !== null && (
                <circle cx={dotX} cy={dotY} r={showTraces ? "45" : "35"} fill="#ffffff" className="drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] transition-all duration-75" />
              )}
            </svg>
          ) : (
            <div className="text-gray-500 font-bold text-sm bg-[#121318] p-6 rounded-xl border border-gray-800 z-10">
              AWAITING TELEMETRY TO DRAW TRACK MAP
            </div>
          )}

          {/* NOUVEAU : MINI TRACK MAP (Flottant en haut à droite sur la map principale) */}
          {!showTraces && trackSegments.length > 0 && (
            <div className="absolute top-4 right-6 w-[320px] bg-[#0d0e12]/95 backdrop-blur-md border border-[#2a2c3d]/60 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-30 flex flex-col overflow-hidden p-4">
              <div className="h-[160px] w-full relative">
                <svg viewBox={viewBox} className="w-full h-full object-contain overflow-visible">
                  
                  {/* Lignes épaisses des 8 Segments */}
                  {trackSegments.map((seg: any) => {
                    const segmentData = data.slice(seg.startIndex, seg.endIndex + 1);
                    return (
                      <path 
                        key={`path-${seg.id}`}
                        d={`M ${segmentData.map((d:any) => `${d.GPS_Lon * 100000},${-d.GPS_Lat * 100000}`).join(" L ")}`} 
                        fill="none" stroke={seg.color} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" 
                        className={`cursor-pointer transition-all duration-300 ${currentSegment === seg.id ? 'opacity-100' : 'opacity-30 hover:opacity-70'}`}
                        onClick={() => setCurrentSegment(seg.id)}
                      />
                    );
                  })}

                  {/* Bulles cliquables numérotées */}
                  {trackSegments.map((seg: any) => {
                    // On place la bulle au milieu du segment
                    const centerPt = data[Math.floor((seg.startIndex + seg.endIndex) / 2)];
                    if (!centerPt) return null;
                    return (
                      <g key={`bubble-${seg.id}`} onClick={() => setCurrentSegment(seg.id)} className="cursor-pointer">
                        <circle cx={centerPt.GPS_Lon * 100000} cy={-centerPt.GPS_Lat * 100000} r="22" fill={currentSegment === seg.id ? seg.color : "#121318"} stroke={seg.color} strokeWidth="5" className="transition-colors" />
                        <text x={centerPt.GPS_Lon * 100000} y={-(centerPt.GPS_Lat * 100000) + 7} textAnchor="middle" fill={currentSegment === seg.id ? "#fff" : seg.color} fontSize="20" fontWeight="900" fontFamily="monospace">
                          {seg.id}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              
              {/* Résumé du temps du segment sélectionné */}
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-800/60">
                <span className="text-gray-300 text-[11px] font-bold">Time loss / gain</span>
                <span className={`font-mono text-sm font-black ${trackSegments[currentSegment-1]?.color === '#ef4444' ? 'text-[#ef4444]' : trackSegments[currentSegment-1]?.color === '#a855f7' ? 'text-[#a855f7]' : 'text-[#10b981]'}`}>
                  {trackSegments[currentSegment-1]?.delta > 0 ? '+' : ''}{trackSegments[currentSegment-1]?.delta?.toFixed(3)}s
                </span>
              </div>
            </div>
          )}
        </div>

        {/* PANNEAU SECTOR COMPARISON (Flottant sur la carte) */}
        <div className="absolute bottom-4 left-20 w-[260px] bg-[#0d0e12]/95 backdrop-blur-md border border-[#2a2c3d]/60 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-10 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-3 border-b border-gray-800/60 bg-[#121318]">
            <span className="text-white font-bold text-sm tracking-wide">Sector Comparison</span>
            <ArrowUpRight size={16} className="text-gray-500 hover:text-white cursor-pointer" />
          </div>
          
          <div className="p-4 pb-2">
            <div className="grid grid-cols-4 gap-2 text-center mb-3 items-center">
              <div></div>
              <div className="flex justify-center"><img src="/steering-wheel.png" className="w-6 opacity-70" alt="My Car" /></div>
              <div className="text-[10px] font-black text-gray-500 tracking-widest">GAP</div>
              <div className="flex justify-center">
                <div className="w-6 h-6 bg-[#3b82f6] rounded flex items-center justify-center shadow-inner"></div>
              </div>
            </div>
            
            <SectorRow label="S1" myTime={activeData.s1My} gap={s1Gap} refTime={activeData.s1Ref} isBad={s1Gap > 0} />
            <SectorRow label="S2" myTime={activeData.s2My} gap={s2Gap} refTime={activeData.s2Ref} isBad={s2Gap > 0} />
            <SectorRow label="S3" myTime={activeData.s3My} gap={s3Gap} refTime={activeData.s3Ref} isBad={s3Gap > 0} />
            <div className="mt-2 pt-2 border-t border-gray-800/60">
              <SectorRow label="LAP" myTime={activeData.lapTimeMy} gap={lapGap} refTime={activeData.lapTimeRef} isBad={lapGap > 0} />
            </div>
          </div>
          
          <div className="bg-[#0a0a0f] p-3 flex flex-col items-center justify-center border-t border-gray-800/60">
            <div className="flex items-center justify-between w-full px-2">
              <button onClick={() => setCurrentSegment(Math.max(1, currentSegment - 1))} className="text-gray-500 hover:text-white transition-colors"><ChevronLeft size={18}/></button>
              <span className="text-gray-200 font-bold text-[13px] tracking-wide">Segment {currentSegment} / 8</span>
              <button onClick={() => setCurrentSegment(Math.min(8, currentSegment + 1))} className="text-gray-500 hover:text-white transition-colors"><ChevronRight size={18}/></button>
            </div>
            <span className="text-[9px] font-mono text-gray-500 mt-1.5 flex items-center gap-2">
              {Math.round(data[trackSegments[currentSegment-1]?.startIndex]?.distMy || 0)}m - {Math.round(data[trackSegments[currentSegment-1]?.endIndex]?.distMy || 0)}m
              {trackSegments.length > 0 && (
                <span className={`font-bold px-1.5 rounded ${trackSegments[currentSegment-1]?.delta > 0 ? 'text-[#ef4444] bg-red-900/20' : trackSegments[currentSegment-1]?.color === '#a855f7' ? 'text-[#a855f7] bg-purple-900/20' : 'text-[#10b981] bg-green-900/20'}`}>
                  {trackSegments[currentSegment-1]?.delta > 0 ? '+' : ''}{trackSegments[currentSegment-1]?.delta?.toFixed(3)}s
                </span>
              )}
            </span>
          </div>
        </div>

        {/* PANNEAU DES TRACES (A droite, OVERLAY TRANSLUCIDE sur la map) */}
        {showTraces && (
          <div className="absolute right-0 top-0 h-full w-[55%] flex flex-col border-l border-[#5b21b6]/30 bg-[#0d0e12]/80 backdrop-blur-xl shadow-[-20px_0_40px_rgba(0,0,0,0.7)] z-20">
            
            {/* Header Traces Connecté */}
            <div className="p-4 border-b border-gray-800/60 flex flex-col gap-3 shrink-0">
              <div className="flex items-center gap-4 justify-between">
                
                <div className="bg-[#121318]/80 rounded-xl border border-gray-800/50 p-3 flex items-center justify-between flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-gray-700 bg-gray-900 flex items-center justify-center shrink-0 overflow-hidden">
                      <img src="/steering-wheel.png" alt="Steering" className="w-7 h-7 opacity-80 object-contain" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white text-[13px] font-bold flex items-center gap-1.5"><CountryFlag code="FR"/> Mathéo Joly</span>
                      <span className="text-gray-400 text-[10px] tracking-widest font-mono mt-0.5">Lap <span className="text-white text-xs">{formatTime(activeData.lapTimeMy || 0)}</span></span>
                    </div>
                  </div>
                  <div className="flex gap-4 text-[11px] font-bold text-gray-200 font-mono text-right shrink-0">
                    <span>{Math.round(activeData.speedMy || 0)} km/h</span>
                    <span>⚙ {activeData.gearMy === 0 ? 'R' : activeData.gearMy || 1}</span>
                    <span>RPM {Math.round(activeData.rpmMy || 0)}</span>
                  </div>
                </div>

                <div className="bg-[#121318]/80 rounded-xl border border-gray-800/50 p-3 flex items-center justify-between flex-1 opacity-80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-[#10b981]/50 bg-gray-900 flex items-center justify-center shrink-0 overflow-hidden shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                      <div className="w-5 h-5 bg-[#3b82f6] rounded shadow-inner"></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white text-[13px] font-bold flex items-center gap-1.5"><CountryFlag code="GB"/> Reference</span>
                      <span className="text-gray-400 text-[10px] tracking-widest font-mono mt-0.5">Lap <span className="text-white text-xs">{formatTime(activeData.lapTimeRef || 0)}</span></span>
                    </div>
                  </div>
                  <div className="flex gap-4 text-[11px] font-bold text-gray-300 font-mono text-right shrink-0">
                    <span>{Math.round(activeData.speedRef || 0)} km/h</span>
                    <span>⚙ {activeData.gearRef === 0 ? 'R' : activeData.gearRef || 1}</span>
                    <span>RPM {Math.round(activeData.rpmRef || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 px-1 mt-1">
                <div className="bg-[#181a24] rounded-full flex border border-gray-700 text-[11px] font-sans font-bold p-[2px]">
                  <button onClick={() => setXAxisMode('Dist')} className={`px-4 py-1 rounded-full transition-colors ${xAxisMode === 'Dist' ? 'bg-[#3b82f6] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>Dist</button>
                  <button onClick={() => setXAxisMode('Time')} className={`px-4 py-1 rounded-full transition-colors ${xAxisMode === 'Time' ? 'bg-[#3b82f6] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>Time</button>
                </div>
                <div className="flex items-center gap-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest flex-1 justify-center">
                  TRACE ZOOM <input type="range" className="w-32 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer opacity-70" /> 15S
                </div>
                <button className="text-gray-300 text-[10px] font-bold px-3 py-1.5 rounded-md bg-[#1a1b26] border border-gray-700 flex items-center gap-1.5 hover:bg-gray-800 transition">EXPORT <ChevronDown size={12}/></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 scrollbar-hide flex flex-col gap-1">
              <TraceChart data={data} dataKeyMy="delta" dataKeyRef="delta" colorMy="#ef4444" colorRef="transparent" label="DELTA" domain={['-2', '2']} activeMy={delta} activeRef={0} />
              <TraceChart data={data} dataKeyMy="throttleMy" dataKeyRef="throttleRef" colorMy="#10b981" colorRef="#059669" label="THROTTLE" domain={[0, 105]} isArea={true} activeMy={myThrottle} activeRef={refThrottle} />
              <TraceChart data={data} dataKeyMy="brakeMy" dataKeyRef="brakeRef" colorMy="#ef4444" colorRef="#b91c1c" label="BRAKE" domain={[0, 105]} isArea={true} activeMy={myBrake} activeRef={refBrake} />
              <TraceChart data={data} dataKeyMy="speedMy" dataKeyRef="speedRef" colorMy="#06b6d4" colorRef="#164e63" label="SPEED" domain={['auto', 'auto']} activeMy={mySpeed} activeRef={refSpeed} />
              <TraceChart data={data} dataKeyMy="steeringMy" dataKeyRef="steeringRef" colorMy="#8b5cf6" colorRef="#4c1d95" label="STEERING" domain={[-180, 180]} activeMy={mySteering} activeRef={refSteering} />
              <TraceChart data={data} dataKeyMy="gearMy" dataKeyRef="gearRef" colorMy="#a855f7" colorRef="#581c87" label="GEAR" domain={[0, 8]} isStep={true} activeMy={myGear} activeRef={refGear} />
              <TraceChart data={data} dataKeyMy="rpmMy" dataKeyRef="rpmRef" colorMy="#d97706" colorRef="#78350f" label="ENGINE RPM" domain={['auto', 'auto']} activeMy={myRPM} activeRef={refRPM} />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* GROS HUD SYMÉTRIQUE DU BAS (Seulement si Traces MASQUÉS)  */}
      {/* ========================================================= */}
      {!showTraces && (
        <div className="w-full bg-[#0d0e12]/90 backdrop-blur-md border-t border-gray-800 flex flex-col pt-3 pb-4 px-8 gap-3 z-30 font-mono text-white shrink-0">
          {/* LIGNE 1 : INFOS ENVIRONNEMENT & CHRONOS */}
          <div className="flex justify-between items-end text-[10px] font-bold tracking-widest uppercase relative">
            <div className="flex items-center gap-4">
              <span className="text-[#eab308] font-black">Current</span>
              <div className="flex items-center gap-3.5 text-gray-300">
                <span className="flex items-center gap-1.5"><Fuel size={12} className="text-[#eab308]" /> {myFuel} L</span>
                <span className="flex items-center gap-1.5"><Activity size={12} className="text-[#3b82f6]" /> {myVE}%</span>
                <span className="flex items-center gap-1.5 text-[#3b82f6]"><Thermometer size={12} /> {myAir}°C</span>
                <span className="flex items-center gap-1.5 text-[#f97316]"><Flame size={12} /> {myTrack}°C</span>
                <span className="flex items-center gap-1.5 text-[#10b981]">
                  <Wind size={12} /> {myWind} m/s 
                  <Navigation size={10} className="ml-0.5 opacity-80" style={{ transform: `rotate(${myWindHeading}deg)` }} />
                </span>
              </div>
            </div>

            <div className="flex items-end gap-16 absolute left-1/2 transform -translate-x-1/2 bottom-0">
              <div className="text-gray-400 font-sans tracking-wide flex items-baseline gap-2 pb-1">
                Lap <span className="text-white text-[18px] font-mono font-bold leading-none">{liveData?.MyLastLap ? liveData.MyLastLap.toFixed(3) : '0:00.000'}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className={`text-[24px] font-black leading-none ${Number(delta) > 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
                  {Number(delta) > 0 ? '+' : ''}{delta}s
                </span>
                <div className="text-gray-500 text-[10px] mt-1 leading-none font-bold">
                  {Number(delta) > 0 ? '' : '+'}{deltaDist} m
                </div>
              </div>
              <div className="text-gray-400 font-sans tracking-wide flex items-baseline gap-2 pb-1">
                Lap <span className="text-white text-[18px] font-mono font-bold leading-none">0:00.000</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3.5 text-gray-400 opacity-80">
                <span className="flex items-center gap-1.5"><Fuel size={12} className="text-[#eab308]" /> {refFuel} L</span>
                <span className="flex items-center gap-1.5"><Activity size={12} className="text-[#3b82f6]" /> {refVE}%</span>
                <span className="flex items-center gap-1.5 text-[#3b82f6]"><Thermometer size={12} /> {refAir}°C</span>
                <span className="flex items-center gap-1.5 text-[#f97316]"><Flame size={12} /> {refTrack}°C</span>
                <span className="flex items-center gap-1.5 text-[#10b981]">
                  <Wind size={12} /> {refWind} m/s
                  <Navigation size={10} className="ml-0.5 opacity-80" style={{ transform: `rotate(${refWindHeading}deg)` }} />
                </span>
              </div>
              <span className="text-[#3b82f6] font-black">Reference</span>
            </div>
          </div>

          {/* LIGNE 2 : TÉLÉMÉTRIE SYMÉTRIQUE */}
          <div className="flex justify-between items-center mt-2 relative">
            <div className="flex items-center gap-6 w-[40%]">
              <div className="flex flex-col items-center justify-center w-16">
                <img src="/steering-wheel.png" alt="Steering" className="w-14 h-14 object-contain transition-transform duration-75" style={{ transform: `rotate(${mySteering}deg)` }} />
                <span className="text-[10px] text-gray-400 font-sans mt-0.5 font-bold">{Math.round(mySteering)}°</span>
              </div>
              <div className="flex flex-col gap-2 w-32">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 font-sans font-bold w-6">THR</span>
                  <div className="flex-1 h-3.5 bg-[#181924] rounded-sm overflow-hidden border border-gray-800">
                    <div className="h-full bg-[#10b981] transition-all duration-75" style={{width: `${myThrottle}%`}}></div>
                  </div>
                  <span className="text-[10px] w-8 text-right text-gray-200 font-bold">{Math.round(myThrottle)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 font-sans font-bold w-6">BRK</span>
                  <div className="flex-1 h-3.5 bg-[#181924] rounded-sm overflow-hidden border border-gray-800">
                    <div className="h-full bg-[#ef4444] transition-all duration-75" style={{width: `${myBrake}%`}}></div>
                  </div>
                  <span className="text-[10px] w-8 text-right text-gray-200 font-bold">{Math.round(myBrake)}%</span>
                </div>
              </div>
              <div className="flex items-center gap-6 ml-6">
                <div className="flex items-center justify-center w-11 h-11 rounded-full border-2 border-gray-700 bg-transparent">
                  <span className="text-[22px] font-black text-white leading-none">{myGear === 0 ? 'R' : myGear}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <Zap size={14} className="text-gray-500 mr-1" strokeWidth={2.5}/>
                  <span className="text-[32px] font-black text-white tracking-tighter leading-none">{Math.round(mySpeed)}</span>
                  <span className="text-[10px] text-gray-500 font-sans ml-1 font-bold">km/h</span>
                </div>
                <div className="flex items-baseline gap-1 ml-4">
                  <Gauge size={14} className="text-gray-500 mr-1" strokeWidth={2.5}/>
                  <span className="text-xl font-bold text-gray-200 leading-none">{Math.round(myRPM)}</span>
                  <span className="text-[10px] text-gray-500 font-sans ml-1 font-bold">rpm</span>
                </div>
              </div>
            </div>

            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-4">
              <div className="bg-[#181a24] border border-gray-700 rounded-full px-5 py-2 text-gray-300 text-[11px] font-sans font-bold flex items-center gap-2 cursor-pointer hover:bg-gray-800 transition-colors">
                Best lap <ChevronDown size={14}/>
              </div>
              <div className="bg-[#181a24] rounded-full flex border border-gray-700 text-[11px] font-sans font-bold p-[2px]">
                <button 
                  onClick={() => setXAxisMode('Dist')} 
                  className={`px-4 py-1 rounded-full transition-colors ${xAxisMode === 'Dist' ? 'bg-[#3b82f6] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                >
                  Dist
                </button>
                <button 
                  onClick={() => setXAxisMode('Time')} 
                  className={`px-4 py-1 rounded-full transition-colors ${xAxisMode === 'Time' ? 'bg-[#3b82f6] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                >
                  Time
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6 w-[40%] justify-end opacity-70">
              <div className="flex items-center gap-6 mr-6">
                <div className="flex items-baseline gap-1 mr-4">
                  <Gauge size={14} className="text-gray-500 mr-1" strokeWidth={2.5}/>
                  <span className="text-xl font-bold text-gray-300 leading-none">{Math.round(refRPM)}</span>
                  <span className="text-[10px] text-gray-500 font-sans ml-1 font-bold">rpm</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <Zap size={14} className="text-gray-500 mr-1" strokeWidth={2.5}/>
                  <span className="text-[32px] font-black text-gray-200 tracking-tighter leading-none">{Math.round(refSpeed)}</span>
                  <span className="text-[10px] text-gray-500 font-sans ml-1 font-bold">km/h</span>
                </div>
                <div className="flex items-center justify-center w-11 h-11 rounded-full border-2 border-gray-700 bg-transparent">
                  <span className="text-[22px] font-black text-gray-300 leading-none">{refGear === 0 ? 'R' : refGear}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-32">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] w-8 text-gray-300 font-bold text-left">{Math.round(refThrottle)}%</span>
                  <div className="flex-1 h-3.5 bg-[#181924] rounded-sm overflow-hidden border border-gray-800 flex justify-end">
                    <div className="h-full bg-[#4ade80] opacity-60 transition-all duration-75" style={{width: `${refThrottle}%`}}></div>
                  </div>
                  <span className="text-[9px] text-gray-600 font-sans font-bold w-6 text-right">THR</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] w-8 text-gray-300 font-bold text-left">{Math.round(refBrake)}%</span>
                  <div className="flex-1 h-3.5 bg-[#181924] rounded-sm overflow-hidden border border-gray-800 flex justify-end">
                    <div className="h-full bg-[#ef4444] opacity-60 transition-all duration-75" style={{width: `${refBrake}%`}}></div>
                  </div>
                  <span className="text-[9px] text-gray-600 font-sans font-bold w-6 text-right">BRK</span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center w-16">
                <img src="/steering-wheel.png" alt="Ref Steering" className="w-14 h-14 object-contain transition-transform duration-75" style={{ transform: `rotate(${refSteering}deg)` }} />
                <span className="text-[10px] text-gray-400 font-sans mt-0.5 font-bold">{Math.round(refSteering)}°</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* BARRE DE LECTURE GLOBALE (Partagée en bas en permanence)  */}
      {/* ========================================================= */}
      <div className="h-14 bg-[#0a0a0f] border-t border-gray-800 flex items-center px-6 gap-4 z-40 shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] relative">
        <div className="flex items-center gap-3 text-gray-400 shrink-0">
          <button onClick={() => setHoverIndex(0)} className="hover:text-white transition-colors" title="Restart"><RotateCcw size={16} strokeWidth={2}/></button>
          <button onClick={() => setIsPlaying(!isPlaying)} className="bg-white text-black p-2 rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            {isPlaying ? <Pause size={14} fill="currentColor" strokeWidth={0} /> : <Play size={14} fill="currentColor" strokeWidth={0} />}
          </button>
          <button onClick={() => setHoverIndex((prev) => Math.min((prev || 0) + 10, data.length - 1))} className="hover:text-white transition-colors" title="Forward 10 frames"><StepForward size={16} strokeWidth={2}/></button>
          <button onClick={() => setPlaybackSpeed(prev => prev === 1 ? 2 : prev === 2 ? 0.5 : 1)} className="hover:text-white transition-colors ml-1 flex items-center gap-1" title="Playback Speed">
            <Gauge size={16} strokeWidth={2}/> <span className="text-[9px] font-bold">{playbackSpeed}x</span>
          </button>
        </div>
        
        {/* TEMPS INITIAL DYNAMIQUE */}
        <span className="text-[11px] text-gray-500 w-16 text-right font-bold tracking-wide font-mono shrink-0">0:00.000</span>
        
        <div className="flex-1 relative flex items-center h-6 group cursor-pointer px-1">
          <input 
            type="range" min="0" max={data.length > 0 ? data.length - 1 : 100} 
            value={hoverIndex !== null ? hoverIndex : 0} 
            onChange={(e) => setHoverIndex(Number(e.target.value))}
            className="w-full absolute inset-0 opacity-0 cursor-pointer z-20"
          />
          <div className="w-full h-1.5 bg-[#181924] rounded-full border border-gray-800 overflow-hidden relative z-0">
            <div className="h-full bg-gray-500 rounded-full" style={{ width: `${data.length > 0 && hoverIndex !== null ? (hoverIndex / data.length) * 100 : 0}%` }}></div>
          </div>
          <div className="absolute w-3 h-3 bg-white rounded-full shadow-[0_0_10px_#ffffff] z-10 pointer-events-none transition-all duration-75" style={{ left: `calc(${data.length > 0 && hoverIndex !== null ? (hoverIndex / data.length) * 100 : 0}% - 6px)` }}></div>
        </div>
        
        {/* TEMPS FIN DYNAMIQUE */}
        <span className="text-[11px] text-gray-500 w-16 font-bold tracking-wide font-mono shrink-0 text-left">
          {data.length > 0 ? formatTime(data[data.length - 1].lapTimeMy) : '0:00.000'}
        </span>
        
        {/* BOUTON TOGGLE (TRACES <-> TRACK MAP) */}
        <button 
          onClick={() => setShowTraces(!showTraces)}
          className="text-[10px] text-gray-300 font-bold uppercase tracking-widest flex items-center gap-1.5 hover:text-white transition-colors ml-4 mr-2 shrink-0 bg-[#1c1e2b] px-4 py-2 rounded border border-gray-700 hover:bg-gray-800"
        >
          {showTraces ? <><ChevronRight size={14} className="rotate-180 text-gray-500"/> TRACK MAP</> : <>TRACES <ChevronRight size={14} className="text-gray-500"/></>}
        </button>
        
        <div className="w-8 h-8 rounded-full border-2 border-orange-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
          <div className="w-4 h-4 rounded-full border-2 border-orange-500/80"></div>
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

// --- COMPOSANT DES VRAIS DRAPEAUX SVG ---
const CountryFlag = ({ code }: { code: string }) => {
  switch(code) {
    case 'US': return <svg viewBox="0 0 19 10" className="w-5 h-4 rounded-[2px] shadow-sm"><rect width="19" height="10" fill="#B22234"/><path d="M0,1.42h19M0,4.28h19M0,7.14h19" stroke="#fff" strokeWidth="1.42"/><rect width="7.6" height="5.38" fill="#3C3B6E"/></svg>;
    case 'FR': return <svg viewBox="0 0 3 2" className="w-5 h-4 rounded-[2px] shadow-sm"><rect width="1" height="2" fill="#002395"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ed2939"/></svg>;
    case 'BE': return <svg viewBox="0 0 3 2" className="w-5 h-4 rounded-[2px] shadow-sm"><rect width="1" height="2" fill="#000"/><rect x="1" width="1" height="2" fill="#fdda24"/><rect x="2" width="1" height="2" fill="#ef3340"/></svg>;
    case 'IT': return <svg viewBox="0 0 3 2" className="w-5 h-4 rounded-[2px] shadow-sm"><rect width="1" height="2" fill="#009246"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ce2b37"/></svg>;
    case 'BH': return <svg viewBox="0 0 5 3" className="w-5 h-4 rounded-[2px] shadow-sm"><rect width="5" height="3" fill="#ce1126"/><path d="M0,0 H1.2 L1.8,0.3 L1.2,0.6 L1.8,0.9 L1.2,1.2 L1.8,1.5 L1.2,1.8 L1.8,2.1 L1.2,2.4 L1.8,2.7 L1.2,3 H0 Z" fill="#fff"/></svg>;
    case 'ES': return <svg viewBox="0 0 3 2" className="w-5 h-4 rounded-[2px] shadow-sm"><rect width="3" height="2" fill="#c60b1e"/><rect y="0.5" width="3" height="1" fill="#ffc400"/></svg>;
    case 'JP': return <svg viewBox="0 0 3 2" className="w-5 h-4 rounded-[2px] shadow-sm border border-gray-600"><rect width="3" height="2" fill="#fff"/><circle cx="1.5" cy="1" r="0.6" fill="#bc002d"/></svg>;
    case 'BR': return <svg viewBox="0 0 10 7" className="w-5 h-4 rounded-[2px] shadow-sm"><rect width="10" height="7" fill="#009c3b"/><polygon points="5,0.5 9.5,3.5 5,6.5 0.5,3.5" fill="#ffdf00"/><circle cx="5" cy="3.5" r="1.5" fill="#002776"/></svg>;
    case 'PT': return <svg viewBox="0 0 3 2" className="w-5 h-4 rounded-[2px] shadow-sm"><rect width="3" height="2" fill="#f00"/><rect width="1.2" height="2" fill="#0f0"/><circle cx="1.2" cy="1" r="0.4" fill="#ff0"/></svg>;
    case 'GB': return <svg viewBox="0 0 60 30" className="w-5 h-4 rounded-[2px] shadow-sm"><rect width="60" height="30" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/><path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10"/><path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6"/></svg>;
    case 'QA': return <svg viewBox="0 0 28 11" className="w-5 h-4 rounded-[2px] shadow-sm"><rect width="28" height="11" fill="#8A1538"/><polygon points="0,0 9,0 11,0.5 9,1 11,1.5 9,2 11,2.5 9,3 11,3.5 9,4 11,4.5 9,5 11,5.5 9,6 11,6.5 9,7 11,7.5 9,8 11,8.5 9,9 11,9.5 9,10 11,10.5 9,11 0,11" fill="#fff"/></svg>;
    default: return <span className="text-sm leading-none">🏁</span>;
  }
};


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

// =========================================================================
// BASE DE DONNÉES DES VOITURES & CIRCUITS LMU POUR L'ANALYTICS
// =========================================================================
const LMU_CARS: Record<string, { category: string; brand: string; layout: string; trait: string; weakness: string }> = {
  // === LMGT3 ===
  'Porsche 911 LMGT3 R (992) 2026': { category: 'LMGT3', brand: 'Porsche', layout: 'Rear-Engine Flat-6', trait: 'Traction absolue, freinage redoutable.', weakness: 'Sous-virage on-throttle si l avant se déleste.' },
  'Ford Mustang LMGT3 Evo': { category: 'LMGT3', brand: 'Ford', layout: 'Front-Engine V8', trait: 'Couple massif à bas régime.', weakness: 'Surchauffe et destruction des pneus arrière en sortie.' },
  'Aston Martin Vantage AMR LMGT3 Evo': { category: 'LMGT3', brand: 'Aston Martin', layout: 'Front-Engine V8', trait: 'Plateforme très stable en endurance.', weakness: 'Paresse directionnelle initiale.' },
  'Lamborghini Huracán LMGT3 Evo 2': { category: 'LMGT3', brand: 'Lamborghini', layout: 'Mid-Engine V10', trait: 'Vitesse de pointe et stabilité.', weakness: 'Sous-virage prononcé au point de corde.' },
  'BMW M4 LMGT3 Evo': { category: 'LMGT3', brand: 'BMW', layout: 'Front-Engine Straight-6 Turbo', trait: 'Stabilité aéro à haute vitesse.', weakness: 'Empattement long, paresseux en épingle.' },
  'Chevrolet Corvette Z06 LMGT3.R': { category: 'LMGT3', brand: 'Chevrolet', layout: 'Mid-Engine V8', trait: 'Changements de direction très vifs.', weakness: 'Risque de snap-oversteer (survirage brutal).' },
  'Ferrari 296 LMGT3 Evo': { category: 'LMGT3', brand: 'Ferrari', layout: 'Mid-Engine V6 Turbo', trait: 'Appui aéro massif.', weakness: 'Sensible à la hauteur de caisse (Bottoming).' },
  'Lexus RC F LMGT3': { category: 'LMGT3', brand: 'Lexus', layout: 'Front-Engine V8', trait: 'Adhérence mécanique exceptionnelle.', weakness: 'Forte traînée aéro (drag).' },
  'McLaren 720S LMGT3 Evo': { category: 'LMGT3', brand: 'McLaren', layout: 'Mid-Engine V8 Turbo', trait: 'Châssis rigide type prototype.', weakness: 'Suspension punitive sur les vibreurs.' },
  'Mercedes-AMG LMGT3': { category: 'LMGT3', brand: 'Mercedes-AMG', layout: 'Front-Mid Engine V8', trait: 'Véhicule ultra-polyvalent.', weakness: 'Sous-virage aéro dans les grandes courbes.' },

  // === LMGTE ===
  'Aston Martin Vantage GTE': { category: 'LMGTE', brand: 'Aston Martin', layout: 'Front-Engine V8 Turbo', trait: 'Couple moteur massif, plateforme très stable.', weakness: 'Dégradation accélérée des pneus arrière sous forte charge.' },
  'Chevrolet Corvette C8.R': { category: 'LMGTE', brand: 'Chevrolet', layout: 'Mid-Engine V8', trait: 'Châssis hyper-rigide, freinage redoutable.', weakness: 'Instabilité brutale sur les vibreurs prononcés.' },
  'Ferrari 488 GTE Evo': { category: 'LMGTE', brand: 'Ferrari', layout: 'Mid-Engine V8 Turbo', trait: 'Aérodynamique redoutable, train avant incisif.', weakness: 'Survirage brutal (snap oversteer) à la limite absolue.' },
  'Porsche 911 RSR-19': { category: 'LMGTE', brand: 'Porsche', layout: 'Mid-Engine Flat-6', trait: 'Usure pneumatique excellente, diffuseur géant.', weakness: 'Léger sous-virage aéro si le Rake est insuffisant.' },

  // === HYPERCAR ===
  'Alpine A424': { category: 'HYPERCAR', brand: 'Alpine', layout: 'LMDh Rear-MGU V6 Turbo', trait: 'Équilibre et accessibilité.', weakness: 'Sous-virage en milieu de courbe lente.' },
  'Aston Martin Valkyrie AMR LMH Hypercar': { category: 'HYPERCAR', brand: 'Aston Martin', layout: 'LMH Non-Hybrid V12', trait: 'Linéarité moteur, train avant pur.', weakness: 'Usure freins carbone (absence de régénération MGU).' },
  'BMW M Hybrid V8 Evo (2026)': { category: 'HYPERCAR', brand: 'BMW', layout: 'LMDh Rear-MGU V8 Bi-Turbo', trait: 'Constance thermique exemplaire.', weakness: 'Train avant sensible aux transferts brusques.' },
  'BMW M Hybrid V8': { category: 'HYPERCAR', brand: 'BMW', layout: 'LMDh Rear-MGU V8 Bi-Turbo', trait: 'Constance thermique exemplaire.', weakness: 'Train avant sensible aux transferts brusques.' },
  'Cadillac V-Series.R': { category: 'HYPERCAR', brand: 'Cadillac', layout: 'LMDh Rear-MGU V8 Atmo', trait: 'Rigidité structurelle, linéarité V8.', weakness: 'Sous-virage chronique, rebond sur les vibreurs.' },
  'Ferrari 499P': { category: 'HYPERCAR', brand: 'Ferrari', layout: 'LMH Front-MGU V6 Bi-Turbo', trait: 'Train avant vissé au sol.', weakness: 'Traction steer agressif au-dessus de 190 km/h.' },
  'Genesis GMR-001 LMDh': { category: 'HYPERCAR', brand: 'Genesis', layout: 'LMDh Rear-MGU', trait: 'Aéro moderne.', weakness: 'Répartition des masses complexe.' },
  'Glickenhaus SCG 007': { category: 'HYPERCAR', brand: 'Glickenhaus', layout: 'LMH Non-Hybrid V8 Bi-Turbo', trait: 'Excellente réponse au trailbraking.', weakness: 'Électronique (TC) très basique, sous-virage naturel.' },
  'Isotta Fraschini Tipo 6-C': { category: 'HYPERCAR', brand: 'Isotta Fraschini', layout: 'LMH Front-MGU V6 Turbo', trait: 'Motricité intégrale agressive.', weakness: 'Gestion du transfert de charge hybride.' },
  'Lamborghini SC63': { category: 'HYPERCAR', brand: 'Lamborghini', layout: 'LMDh Rear-MGU V8 Bi-Turbo', trait: 'Moteur viscéral et explosif.', weakness: 'Survirage de puissance sévère à la relance.' },
  'Peugeot 9X8 2023': { category: 'HYPERCAR', brand: 'Peugeot', layout: 'LMH Front-MGU (Wingless)', trait: 'Rotation basse vitesse (Boost 150 km/h).', weakness: 'Sous-virage aérodynamique à haute vélocité.' },
  'Peugeot 9X8 2024': { category: 'HYPERCAR', brand: 'Peugeot', layout: 'LMH Front-MGU (Winged)', trait: 'Stabilité arrière restaurée.', weakness: 'Perte d agilité dans les épingles lentes.' },
  'Porsche 963': { category: 'HYPERCAR', brand: 'Porsche', layout: 'LMDh Rear-MGU V8 Bi-Turbo', trait: 'Stabilité impériale à haute vitesse.', weakness: 'Paresse dans la rotation (yaw) à basse vitesse.' },
  'Toyota GR010 Hybrid': { category: 'HYPERCAR', brand: 'Toyota', layout: 'LMH Front-MGU V6 Bi-Turbo', trait: 'Train avant incisif, référence globale.', weakness: 'Instabilité arrière en transfert d appui moyen.' },
  'Toyota TR010 Hybrid (2026)': { category: 'HYPERCAR', brand: 'Toyota', layout: 'LMH Front-MGU V6 Bi-Turbo', trait: 'Aéro perfectionnée.', weakness: 'Gestion de la dégradation des gommes arrière.' },
  'Vanwall Vandervell 680': { category: 'HYPERCAR', brand: 'Vanwall', layout: 'LMH Non-Hybrid V8 Atmo', trait: 'Excellente VMax brute.', weakness: 'Train arrière extrêmement vif et instable.' },

  // === LMP2 ===
  'Oreca 07 Gibson': { category: 'LMP2', brand: 'Oreca', layout: 'LMP2 Mid-Engine V8', trait: 'Appui aérodynamique monotype massif.', weakness: 'Dépendance absolue au Rake et à la barre anti-roulis.' },
  'Oreca 07 Gibson ELMS': { category: 'LMP2', brand: 'Oreca', layout: 'LMP2 Mid-Engine V8', trait: 'Appui aérodynamique monotype massif.', weakness: 'Dépendance absolue au Rake et à la barre anti-roulis.' },

  // === LMP3 ===
  'Duqueine D09': { category: 'LMP3', brand: 'Duqueine', layout: 'LMP3 Mid-Engine V6 Bi-Turbo', trait: 'Plateforme neutre, pardonne le trailbraking.', weakness: 'Léger manque de vivacité au point de corde.' },
  'Ginetta G61-LT-P3': { category: 'LMP3', brand: 'Ginetta', layout: 'LMP3 Mid-Engine V6 Bi-Turbo', trait: 'Rotation agressive, train arrière mobile.', weakness: 'Instabilité punitive au relâchement des freins.' },
  'Ligier JS P325': { category: 'LMP3', brand: 'Ligier', layout: 'LMP3 Mid-Engine V6 Bi-Turbo', trait: 'Stabilité aéro à haute vitesse.', weakness: 'Sous-virage prononcé à basse vitesse.' },
  'Adess AD25': { category: 'LMP3', brand: 'Adess', layout: 'LMP3 Mid-Engine V6 Bi-Turbo', trait: 'VMax potentielle.', weakness: 'Déficit de performance aérodynamique globale.' }
};

const LMU_ALL_TRACKS = [
  { name: 'Algarve International Circuit', flag: '🇵🇹' },
  { name: 'Autodromo Enzo e Dino Ferrari', flag: '🇮🇹' },
  { name: 'Autodromo Jose Carlos Pace', flag: '🇧🇷' },
  { name: 'Autodromo Nazionale Monza', flag: '🇮🇹' },
  { name: 'Bahrain Endurance Circuit', flag: '🇧🇭' },
  { name: 'Bahrain International Circuit', flag: '🇧🇭' },
  { name: 'Bahrain Outer Circuit', flag: '🇧🇭' },
  { name: 'Bahrain Paddock Circuit', flag: '🇧🇭' },
  { name: 'Circuit de Barcelona-Catalunya', flag: '🇪🇸' },
  { name: 'Circuit de la Sarthe', flag: '🇫🇷' },
  { name: 'Circuit de la Sarthe Mulsanne', flag: '🇫🇷' },
  { name: 'Circuit de Spa-Francorchamps', flag: '🇧🇪' },
  { name: 'Circuit de Spa-Francorchamps Endurance', flag: '🇧🇪' },
  { name: 'Circuit of the Americas', flag: '🇺🇸' },
  { name: 'COTA International Circuit', flag: '🇺🇸' },
  { name: 'Daytona International Speedway Road Course', flag: '🇺🇸' },
  { name: 'Fuji Speedway', flag: '🇯🇵' },
  { name: 'Fuji International Circuit', flag: '🇯🇵' },
  { name: 'Monza Curva Grande Circuit', flag: '🇮🇹' },
  { name: 'Paul Ricard - 1A', flag: '🇫🇷' },
  { name: 'Paul Ricard - 1A-V2', flag: '🇫🇷' },
  { name: 'Paul Ricard - 1A-V2-short', flag: '🇫🇷' },
  { name: 'Paul Ricard - ELMS', flag: '🇫🇷' },
  { name: 'Sebring International Raceway', flag: '🇺🇸' },
  { name: 'Sebring School Circuit', flag: '🇺🇸' },
  { name: 'Silverstone Grand Prix Circuit - ELMS', flag: '🇬🇧' },
  { name: 'Silverstone Grand Prix Circuit - WEC', flag: '🇬🇧' },
  { name: 'Silverstone International Circuit', flag: '🇬🇧' },
  { name: 'Silverstone National Circuit', flag: '🇬🇧' },
  { name: 'WeatherTech Raceway Laguna Seca', flag: '🇺🇸' }
];

// --- VRAIS LOGOS DES MARQUES (SVG INTERNET) & CODES PAYS ---
const BRAND_LOGOS: Record<string, string> = {
  // 1. Les fichiers avec l'icône "Image" (Assure-toi que ce sont bien des .png, sinon remplace par .jpg)
  'Alpine': '/Logo_constructeur/Alpine.png',
  'BMW': '/Logo_constructeur/BMW.png',
  'Cadillac': '/Logo_constructeur/Cadilac.png', // Ton fichier est orthographié avec un seul 'l'
  'Ferrari': '/Logo_constructeur/Ferrari.png',
  'Isotta Fraschini': '/Logo_constructeur/Isotta Fraschini.png',
  'Lexus': '/Logo_constructeur/Lexus.png',
  'McLaren': '/Logo_constructeur/Mclaren.png',
  'Porsche': '/Logo_constructeur/Porsche.png',
  'Toyota': '/Logo_constructeur/Toyota.png',
  'Genesis': '/Logo_constructeur/Genesis.png',

  // 2. Les fichiers avec l'icône "Navigateur/Edge" (C'est du .svg pur)
  'Aston Martin': '/Logo_constructeur/Aston Martin.svg',
  'Chevrolet': '/Logo_constructeur/Corvette.svg', // Chevrolet = Modèle Corvette
  'Ford': '/Logo_constructeur/Ford.svg',
  'Ginetta': '/Logo_constructeur/Ginetta.svg',
  'Glickenhaus': '/Logo_constructeur/Glickenhaus.svg',
  'Lamborghini': '/Logo_constructeur/Lamborghini.svg',
  'Ligier': '/Logo_constructeur/LIGIER.svg',
  'Oreca': '/Logo_constructeur/Oreca.svg',
  'Peugeot': '/Logo_constructeur/Peugeot.svg',
  'Vanwall': '/Logo_constructeur/Vanwall.svg',

  // 3. --- FALLBACKS (Ceux qui manquent dans ta capture) ---
  // On garde les liens Internet en attendant que tu télécharges leurs logos pour éviter que l'UI ne crashe.
  'Mercedes-AMG': 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg',
  'Duqueine': 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Duqueine_Engineering_logo.png',
  'Adess': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/ADESS_AG_Logo.png/320px-ADESS_AG_Logo.png'
};

const getTrackDetails = (trackStr: string) => {
  const t = trackStr.toLowerCase();
  const getImages = (id: string) => ({
    LAYOUT: `/tracks/${id}_layout.svg`,
    SECTORS: `/tracks/${id}_sectors.svg`,
    CORNERS: `/tracks/${id}_corners.svg`,
  });

  if (t.includes('daytona')) return { name: 'Daytona International Speedway Road Course', location: 'Daytona Beach, FL · USA', code: 'US', images: getImages('daytona') };
  if (t.includes('spa')) return { name: 'Circuit de Spa-Francorchamps', location: 'Stavelot, Wallonia · Belgium', code: 'BE', images: getImages('spa') };
  if (t.includes('mans') || t.includes('sarthe')) return { name: 'Circuit de la Sarthe', location: 'Le Mans, Pays de la Loire · France', code: 'FR', images: getImages('lemans') };
  if (t.includes('laguna') || t.includes('seca')) return { name: 'WeatherTech Raceway Laguna Seca', location: 'Monterey, CA · USA', code: 'US', images: getImages('laguna') };
  if (t.includes('bahrain')) return { name: 'Bahrain International Circuit', location: 'Sakhir · Bahrain', code: 'BH', images: getImages('bahrain') };
  if (t.includes('monza')) return { name: 'Autodromo Nazionale Monza', location: 'Monza, Lombardy · Italy', code: 'IT', images: getImages('monza') };
  if (t.includes('ricard')) return { name: 'Circuit Paul Ricard', location: 'Le Castellet · France', code: 'FR', images: getImages('paulricard') };
  if (t.includes('barcelona') || t.includes('catalunya')) return { name: 'Circuit de Barcelona-Catalunya', location: 'Montmeló, Catalonia · Spain', code: 'ES', images: getImages('barcelona') };
  if (t.includes('fuji')) return { name: 'Fuji Speedway', location: 'Oyama, Shizuoka · Japan', code: 'JP', images: getImages('fuji') };
  if (t.includes('interlagos') || t.includes('pace')) return { name: 'Autódromo José Carlos Pace', location: 'São Paulo · Brazil', code: 'BR', images: getImages('interlagos') };
  if (t.includes('portim') || t.includes('algarve')) return { name: 'Algarve International Circuit', location: 'Portimão, Algarve · Portugal', code: 'PT', images: getImages('portimao') };
  if (t.includes('sebri')) return { name: 'Sebring International Raceway', location: 'Sebring, FL · USA', code: 'US', images: getImages('sebring') };
  if (t.includes('imola') || t.includes('enzo')) return { name: 'Autodromo Enzo e Dino Ferrari', location: 'Imola, Emilia-Romagna · Italy', code: 'IT', images: getImages('imola') };
  if (t.includes('cota') || t.includes('americas')) return { name: 'Circuit of the Americas', location: 'Austin, TX · USA', code: 'US', images: getImages('cota') };
  if (t.includes('silverstone')) return { name: 'Silverstone Circuit', location: 'Silverstone, Northamptonshire · UK', code: 'GB', images: getImages('silverstone') };
  if (t.includes('losail') || t.includes('qatar')) return { name: 'Losail International Circuit', location: 'Lusail · Qatar', code: 'QA', images: getImages('losail') };
  
  return { name: trackStr, location: 'International Circuit', code: 'UN', images: getImages('unknown') };
};

const getTrackCountryCode = (trackName: string) => {
  const lower = trackName.toLowerCase();
  if (lower.includes('daytona') || lower.includes('laguna') || lower.includes('seca') || lower.includes('cota') || lower.includes('americas') || lower.includes('sebri')) return 'US';
  if (lower.includes('spa')) return 'BE';
  if (lower.includes('mans') || lower.includes('sarthe') || lower.includes('ricard')) return 'FR';
  if (lower.includes('bahrain')) return 'BH';
  if (lower.includes('monza') || lower.includes('imola') || lower.includes('enzo')) return 'IT';
  if (lower.includes('barcelona') || lower.includes('catalunya')) return 'ES';
  if (lower.includes('fuji') || lower.includes('suzuka')) return 'JP';
  if (lower.includes('interlagos') || lower.includes('pace')) return 'BR';
  if (lower.includes('portim') || lower.includes('algarve')) return 'PT';
  if (lower.includes('silverstone')) return 'GB';
  if (lower.includes('losail') || lower.includes('qatar')) return 'QA';
  return 'UN';
};

const getClassColor = (cls: string) => {
  if (!cls) return 'border-gray-600/50 text-gray-400 bg-gray-800/10';
  switch(cls.toUpperCase()) {
    case 'HYPER': return 'border-red-600/50 text-red-500 bg-red-900/10';
    case 'LMP2': return 'border-blue-600/50 text-blue-400 bg-blue-900/10';
    case 'LMP3': return 'border-purple-600/50 text-purple-400 bg-purple-900/10';
    case 'GTE': return 'border-indigo-600/50 text-indigo-400 bg-indigo-900/10';
    case 'GT3': return 'border-green-600/50 text-green-500 bg-green-900/10';
    default: return 'border-gray-600/50 text-gray-400 bg-gray-800/10';
  }
};

// --- FONCTIONS DE CORRESPONDANCE INTELLIGENTE (XML <-> MENU) ---
const isTrackMatch = (sessionTrack: string, targetTrack: string) => {
  if (!sessionTrack || !targetTrack || targetTrack === 'Select track' || targetTrack === 'All') return true;
  const sT = sessionTrack.toLowerCase();
  const tT = targetTrack.toLowerCase();
  return sT.includes(tT) || tT.includes(sT);
};

const isCarMatch = (sessionCar: string, sessionClass: string, targetCar: string) => {
  if (!sessionCar || !targetCar || targetCar === 'Select car' || targetCar === 'All') return true;
  const sC = sessionCar.toLowerCase();
  const sClass = sessionClass ? sessionClass.toLowerCase() : '';
  const tC = targetCar.toLowerCase();
  
  if (sC === tC || sC.includes(tC) || tC.includes(sC)) return true;

  // Ferrari AF Corse : HYP vs GT3 vs GTE
  if (tC.includes('499p') && sClass.includes('hyp') && (sC.includes('ferrari') || sC.includes('af corse'))) return true;
  if (tC.includes('296') && sClass.includes('gt3') && (sC.includes('ferrari') || sC.includes('af corse'))) return true;
  if (tC.includes('488') && sClass.includes('gte') && (sC.includes('ferrari') || sC.includes('af corse'))) return true;
  
  // Porsche Penske vs Manthey / 963 vs 911 vs RSR
  if (tC.includes('963') && sClass.includes('hyp') && (sC.includes('porsche') || sC.includes('penske') || sC.includes('jota') || sC.includes('proton'))) return true;
  if (tC.includes('911') && sClass.includes('gt') && (sC.includes('porsche') || sC.includes('manthey') || sC.includes('proton'))) return true;
  if (tC.includes('rsr') && sClass.includes('gte') && sC.includes('porsche')) return true;
  
  // Aston Martin Valkyrie vs Vantage
  if (tC.includes('valkyrie') && sClass.includes('hyp') && sC.includes('aston martin')) return true;
  if (tC.includes('vantage') && sClass.includes('gt') && (sC.includes('aston martin') || sC.includes('heart of racing') || sC.includes('d\'station'))) return true;

  // BMW M Hybrid vs M4
  if (tC.includes('m hybrid') && sClass.includes('hyp') && (sC.includes('bmw') || sC.includes('wrt'))) return true;
  if (tC.includes('m4') && sClass.includes('gt') && (sC.includes('bmw') || sC.includes('wrt'))) return true;

  // Lamborghini SC63 vs Huracan
  if (tC.includes('sc63') && sClass.includes('hyp') && (sC.includes('lamborghini') || sC.includes('iron lynx'))) return true;
  if (tC.includes('huracán') && sClass.includes('gt') && (sC.includes('lamborghini') || sC.includes('iron lynx') || sC.includes('bovy'))) return true;
  
  // Chevrolet Corvette C8.R GTE vs Z06 GT3
  if (tC.includes('z06') && sClass.includes('gt3') && (sC.includes('corvette') || sC.includes('chevrolet') || sC.includes('tf sport'))) return true;
  if (tC.includes('c8.r') && sClass.includes('gte') && (sC.includes('corvette') || sC.includes('chevrolet'))) return true;

  // Autres prototypes et GTE
  if (tC.includes('gr010') && (sC.includes('toyota') || sC.includes('gazoo'))) return true;
  if (tC.includes('9x8') && sC.includes('peugeot')) return true;
  if (tC.includes('v-series') && (sC.includes('cadillac') || sC.includes('action express'))) return true;
  if (tC.includes('a424') && sC.includes('alpine')) return true;
  if (tC.includes('007') && sC.includes('glickenhaus')) return true;
  if (tC.includes('tipo 6') && sC.includes('isotta')) return true;
  if (tC.includes('680') && sC.includes('vanwall')) return true;
  if (tC.includes('mustang') && (sC.includes('ford') || sC.includes('proton'))) return true;
  if (tC.includes('720s') && (sC.includes('mclaren') || sC.includes('united'))) return true;
  if (tC.includes('rc f') && (sC.includes('lexus') || sC.includes('akkodis'))) return true;
  if (tC.includes('oreca 07') && sC.includes('oreca')) return true;

  return false;
};

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
  const [activeType, setActiveType] = useState<'All Types' | 'Races' | 'Qualifying' | 'Practice'>('Practice');
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

  const TRACK_NATIONS = [
    { code: 'PT', name: 'PORTUGAL' },
    { code: 'IT', name: 'ITALY' },
    { code: 'BR', name: 'BRAZIL' },
    { code: 'BH', name: 'BAHRAIN' },
    { code: 'ES', name: 'SPAIN' },
    { code: 'FR', name: 'FRANCE' },
    { code: 'BE', name: 'BELGIUM' },
    { code: 'US', name: 'USA' },
    { code: 'JP', name: 'JAPAN' },
    { code: 'GB', name: 'GREAT BRITAIN' },
    { code: 'QA', name: 'QATAR' }
  ];

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

  // --- MOTEUR DE CALCUL DYNAMIQUE (Basé sur l'historique XML existant) ---
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch('http://127.0.0.1:8000/api/sessions/history')
      .then(res => res.json())
      .then(json => {
        if (isMounted && json.status === 'success') {
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

            if (!ltCategoryMap.has(s.class)) ltCategoryMap.set(s.class, { category: s.class, sessions: 0, tracks: new Set() });
            const cMap = ltCategoryMap.get(s.class);
            cMap.sessions++;
            cMap.tracks.add(s.track);

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
          const deeperTarget = filtered.filter((s:any) => isTrackMatch(s.track, selectedTrack) && isCarMatch(s.car, s.class, selectedCar));
          
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
              byCategory: Array.from(ltCategoryMap.values()).map((c: any) => ({
                category: c.category, sessions: c.sessions, tracks: c.tracks.size, avgRef: '102.8%'
              })),
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
      })
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
                  const totalLaps = lapSecs > 0 ? Math.ceil(totalRaceSecs / lapSecs) : 0;
                  
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
                    <div className="text-right text-[#10b981]">{row.avgRef}</div>
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

/// --- PALETTE DE COULEURS POUR LES CONCURRENTS ---
const CHART_COLORS = [
  '#3a86ff', '#8338ec', '#ffbe0b', '#2a9d8f', '#f4a261', 
  '#4cc9f0', '#7209b7', '#e76f51', '#48bfe3', '#9c6644',
  '#a7c957', '#e29578', '#0077b6', '#00b4d8', '#fca311'
];



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

  const CustomChartTooltip = ({ active, payload, label, dataKeySuffix, isTime = false }: any) => {
    if (active && payload && payload.length) {
      const sortedPayload = [...payload].sort((a, b) => a.value - b.value);
      return (
        <div className="bg-[#121318]/95 backdrop-blur-md border border-gray-700 rounded-xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.8)] min-w-[200px] z-50">
          <div className="text-gray-400 text-[10px] font-bold tracking-widest uppercase border-b border-gray-800 pb-2 mb-2">Lap {label}</div>
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto scrollbar-hide">
            {sortedPayload.map((entry: any, index: number) => {
              const driverName = entry.dataKey ? entry.dataKey.replace(dataKeySuffix, '') : entry.payload.driver;
              const isPlayer = driverName === chartsData?.player;
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


export default function App() {
  const [activeMenu, setActiveMenu] = useState('Sessions');
  const [subView, setSubView] = useState<'driving' | 'data' | 'timing'>('data');
  const [selectedHistorySession, setSelectedHistorySession] = useState<any | null>(null); // NOUVEAU
  
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
    { name: 'Schedule', icon: <CalendarDays size={20} /> },
    { name: 'Analytics', icon: <BarChart2 size={20} /> }, 
    { name: 'Sessions', icon: <FileText size={20} /> }, // NOUVEAU : Historique XML
    { name: 'Telemetry', icon: <LineChart size={20} /> }, // RENOMMÉ : L'ancienne vue complexe
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
              onClick={() => {
                setActiveMenu(item.name);
                if (item.name !== 'Sessions') setSelectedHistorySession(null); // Réinitialise la vue
              }}
              className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-200 ... `}
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
            ) : activeMenu === 'Analytics' ? (
              <AnalyticsView 
                setActiveMenu={setActiveMenu} 
                setSelectedHistorySession={setSelectedHistorySession} 
              />
            ) : activeMenu === 'Sessions' ? (
              selectedHistorySession ? (
                <SessionDetailView 
                  session={selectedHistorySession} 
                  onBack={() => setSelectedHistorySession(null)} 
                />
              ) : (
                <SessionsHistoryView onSelectSession={setSelectedHistorySession} /> 
              )
            ) : activeMenu === 'Telemetry' ? (
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