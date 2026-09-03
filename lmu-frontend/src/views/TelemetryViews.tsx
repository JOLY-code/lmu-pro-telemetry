import React, { useState, useEffect } from 'react';
import { 
  CloudRain, Cloud, Fuel, Lock, Route, Search, Trash2, 
  RefreshCw, MapPin, Settings, Plus, Minus, RotateCcw, 
  CarFront, Globe, ChevronLeft, ChevronRight, ArrowUpRight, 
  Activity, Thermometer, Wind, Navigation, Zap, Gauge, 
  Flame, Pause, Play, StepForward, CheckCircle2, Wrench,
  LayoutGrid, ChevronDown, AlertTriangle, Info
} from 'lucide-react';

import { 
  ResponsiveContainer, LineChart as RechartsLine, Line, YAxis, 
  Tooltip, ReferenceLine, AreaChart, Area 
} from 'recharts';

import { CountryFlag } from '../lmu_constants';

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
      
      {/* NOUVEAU : TOP NAVIGATION BAR (Épurée) */}
      <div className="h-12 bg-[#121318] border-b border-gray-800/60 flex items-center justify-center px-4 shrink-0 relative z-40">
        {/* Distance Dynamique au centre (Les boutons en doublon ont été retirés) */}
        <div className="flex items-center gap-2 bg-[#1a1b26] px-4 py-1.5 rounded-lg border border-gray-800 shadow-inner">
          <MapPin size={14} className="text-gray-400" />
          <span className="text-white font-mono font-bold text-xs">{Math.round(activeData.distMy || 0)} M</span>
        </div>
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

// --- NOUVELLES VUES (OVERVIEW, PIT WALL, LIVE SETUP) ---

const TelemetryOverview = ({ laps, liveData, historicalData }: any) => {
  const validLaps = laps.filter((l: any) => l.time !== '0:00.000' && l.lap !== '-');
  const bestLapTime = validLaps.length > 0 ? Math.min(...validLaps.map((l: any) => parseFloat(l.time))) : 0;
  const formatTime = (t: number) => t > 0 ? (t >= 60 ? `${Math.floor(t/60)}:${(t%60).toFixed(3).padStart(6,'0')}` : t.toFixed(3)) : '--:--.---';

  // --- CALCULS DYNAMIQUES AVANCÉS (G-Forces & Extremes) ---
  // DuckDB sort LatAccel/LongAccel/VertAccel, on sécurise avec fallback
  const maxLatG = historicalData && historicalData.length > 0 ? Math.max(...historicalData.map((d:any) => Math.abs(d.LatAccel || d.GForceLat || 0) / 9.81)) : 0;
  const maxLonG = historicalData && historicalData.length > 0 ? Math.max(...historicalData.map((d:any) => Math.abs(d.LongAccel || d.GForceLon || 0) / 9.81)) : 0;
  const maxVertG = historicalData && historicalData.length > 0 ? Math.max(...historicalData.map((d:any) => Math.abs(d.VertAccel || d.GForceVert || 0) / 9.81)) : 0;
  const topSpeed = historicalData && historicalData.length > 0 ? Math.max(...historicalData.map((d:any) => d.TopSpeed || 0)) : 0;

  // --- CALCUL DE FLUIDITÉ ET D'ABUS (Coasting, Overdriving & Rupteur) ---
  let coastingFrames = 0, totalActiveFrames = 0, overdrivingFrames = 0, revLimiterHits = 0;
  
  if (historicalData && historicalData.length > 0) {
      historicalData.forEach((d:any) => {
          // 1. Sur-régime (Rupteur)
          if (d.EngineRPM > 0 && d.EngineMaxRPM > 0 && d.EngineRPM >= (d.EngineMaxRPM * 0.98)) {
              revLimiterHits++;
          }
          
          if (d.TopSpeed > 80) { // Uniquement quand la voiture roule vite
              totalActiveFrames++;
              
              // 2. Coasting = Ni gaz, ni frein à haute vitesse
              if (d.Throttle < 2 && d.Brake < 2) coastingFrames++;
              
              // 3. Overdriving = L'ABS ou le TC s'active fortement
              if ((d.ABS && d.ABS > 0) || (d.TC && d.TC > 0) || (d.TCCut && d.TCCut > 0)) {
                  overdrivingFrames++;
              }
          }
      });
  }
  const coastingPct = totalActiveFrames > 0 ? (coastingFrames / totalActiveFrames) * 100 : 0;
  const overdrivingPct = totalActiveFrames > 0 ? (overdrivingFrames / totalActiveFrames) * 100 : 0;

  // --- CALCULATEUR D'ESSENCE BASIQUE ---
  const fuelLevel = liveData?.FuelLevel || 0;
  const avgFuelUsage = historicalData && historicalData.length > 0 ? (historicalData[historicalData.length - 1].FuelConsumed || 0) / Math.max(1, validLaps.length) : 0;
  const estLapsLeft = avgFuelUsage > 0 ? Math.floor(fuelLevel / avgFuelUsage) : '--';

  return (
    <div className="flex-1 flex flex-col gap-6 h-full overflow-y-auto scrollbar-hide pb-6">
      <div className="flex items-center gap-2 mb-2">
        <LayoutGrid size={18} className="text-[#3a86ff]"/> 
        <h2 className="text-white font-black tracking-widest text-lg uppercase">Session Overview</h2>
      </div>
      
      {/* LIGNE 1 : GÉNÉRAL & MÉTÉO AVANCÉE */}
      <div className="grid grid-cols-4 gap-6">
        
        {/* PACE & TOP SPEED */}
        <div className="col-span-2 bg-[#121318] border border-gray-800/50 rounded-xl p-6 flex flex-col shadow-lg">
          <span className="text-gray-500 text-[10px] font-black tracking-widest mb-6 uppercase">Pace & Extremes</span>
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-end border-b border-gray-800/60 pb-2">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Best Lap</span>
                <span className="text-[#8338ec] font-mono text-2xl font-black">{bestLapTime > 0 ? formatTime(bestLapTime) : '--:--.---'}</span>
              </div>
              <div className="flex justify-between items-end border-b border-gray-800/60 pb-2">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Valid Laps</span>
                <span className="text-[#3a86ff] font-mono text-2xl font-black">{validLaps.length}</span>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-end border-b border-gray-800/60 pb-2">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Top Speed</span>
                <span className="text-[#10b981] font-mono text-2xl font-black">{topSpeed > 0 ? topSpeed.toFixed(0) : '--'} <span className="text-sm">km/h</span></span>
              </div>
              <div className="flex justify-between items-end border-b border-gray-800/60 pb-2">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Max Cornering G</span>
                <span className="text-[#ef4444] font-mono text-2xl font-black">{maxLatG > 0 ? maxLatG.toFixed(2) : '--'} G</span>
              </div>
            </div>
          </div>
        </div>

        {/* WEATHER RADAR & AERO */}
        <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-6 flex flex-col shadow-lg">
          <span className="text-gray-500 text-[10px] font-black tracking-widest mb-6 uppercase">Environment Radar</span>
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><CloudRain size={16} className="text-[#3a86ff]" /><span className="text-gray-300 text-xs font-bold">Racing Line</span></div>
              <span className="text-white font-mono text-lg font-bold">{liveData?.['Minimum Path Wetness'] !== undefined ? (liveData['Minimum Path Wetness'] * 100).toFixed(0) : '0'}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><CloudRain size={16} className="text-[#64748b]" /><span className="text-gray-300 text-xs font-bold">Off-Path</span></div>
              <span className="text-gray-400 font-mono text-lg font-bold">{liveData?.OffpathWetness !== undefined ? (liveData.OffpathWetness * 100).toFixed(0) : '0'}%</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-800/60 mt-auto">
              <div className="flex items-center gap-3"><Wind size={16} className="text-[#10b981]" /><span className="text-gray-300 text-xs font-bold">Wind Vector</span></div>
              <span className="text-white font-mono text-lg font-bold flex items-center gap-2">
                 {liveData?.WindSpeed ? liveData.WindSpeed.toFixed(1) : '0.0'} <span className="text-[10px] text-gray-500 uppercase mt-1">m/s</span>
                 <Navigation size={12} className="text-[#10b981]" style={{ transform: `rotate(${liveData?.WindHeading || 0}deg)` }} />
              </span>
            </div>
          </div>
        </div>

        {/* STRATEGY & HEALTH */}
        <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-6 flex flex-col shadow-lg">
          <span className="text-gray-500 text-[10px] font-black tracking-widest mb-6 uppercase">Strategy & Health</span>
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><Fuel size={16} className="text-[#e9c46a]" /><span className="text-gray-300 text-xs font-bold">Est. Laps</span></div>
              <span className={`font-mono text-lg font-bold ${Number(estLapsLeft) < 3 ? 'text-[#ef4444] animate-pulse' : 'text-white'}`}>{estLapsLeft}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><Activity size={16} className={liveData?.AeroDamage > 0.05 ? "text-[#ef4444]" : "text-[#10b981]"} /><span className="text-gray-300 text-xs font-bold">Aero Health</span></div>
              <span className={`font-mono text-[10px] tracking-widest font-black px-2 py-0.5 rounded border ${liveData?.AeroDamage > 0.05 ? 'bg-red-900/20 text-red-500 border-red-800' : 'bg-green-900/20 text-green-500 border-green-800'}`}>{liveData?.AeroDamage > 0.05 ? 'DAMAGED' : 'OPTIMAL'}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-800/60 mt-auto">
              <div className="flex items-center gap-3"><CheckCircle2 size={16} className={liveData?.Penalties > 0 ? "text-[#ef4444]" : "text-[#e9c46a]"} /><span className="text-gray-300 text-xs font-bold">Penalties</span></div>
              <span className={`font-mono text-lg font-bold ${liveData?.Penalties > 0 ? 'text-[#ef4444]' : 'text-white'}`}>{liveData?.Penalties || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* LIGNE 2 : KINEMATICS & DRIVING QUALITY */}
      <div className="grid grid-cols-3 gap-6">
        
        {/* DRIVING SMOOTHNESS */}
        <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-6 flex flex-col shadow-lg">
          <span className="text-gray-500 text-[10px] font-black tracking-widest mb-6 uppercase flex items-center gap-2">Pedal Smoothness <Info size={12}/></span>
          <div className="flex flex-col gap-6 h-full justify-center">
             <div className="flex items-center justify-between border-b border-gray-800/60 pb-3">
                <div className="flex flex-col gap-1">
                   <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Coasting (Free Roll)</span>
                   <span className="text-[9px] text-gray-500 max-w-[150px]">Time spent off pedals. Indicates entry confidence.</span>
                </div>
                <span className={`font-mono text-3xl font-black ${coastingPct > 8 ? 'text-[#ef4444]' : coastingPct > 4 ? 'text-[#e9c46a]' : 'text-[#10b981]'}`}>{coastingPct.toFixed(1)}%</span>
             </div>
             <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                   <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Max Braking Force</span>
                   <span className="text-[9px] text-gray-500 max-w-[150px]">Maximum longitudinal decel (Threshold).</span>
                </div>
                <span className="text-[#ef4444] font-mono text-3xl font-black">{maxLonG > 0 ? maxLonG.toFixed(2) : '--'} G</span>
             </div>
          </div>
        </div>

        {/* SUSPENSION RISK (KERB STRIKES) */}
        <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-6 flex flex-col shadow-lg">
          <span className="text-gray-500 text-[10px] font-black tracking-widest mb-6 uppercase flex items-center gap-2">Suspension Kinematics <Wrench size={12}/></span>
          <div className="flex flex-col h-full justify-center gap-6">
             <div className="flex items-center justify-between border-b border-gray-800/60 pb-3">
                <div className="flex flex-col gap-1">
                   <span className="text-gray-300 text-xs font-bold uppercase tracking-widest">Peak Vertical Impact</span>
                   <span className="text-[9px] text-gray-500 max-w-[150px]">Kerb strike severity.</span>
                </div>
                <div className="flex flex-col items-end">
                   <span className={`font-mono text-3xl font-black ${maxVertG > 3.0 ? 'text-[#ef4444]' : maxVertG > 2.0 ? 'text-[#e9c46a]' : 'text-[#3a86ff]'}`}>{maxVertG > 0 ? maxVertG.toFixed(2) : '--'} G</span>
                   {maxVertG > 3.0 && <span className="mt-1 text-red-500 text-[9px] font-black tracking-widest uppercase animate-pulse">BOTTOMING RISK</span>}
                </div>
             </div>
             <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                   <span className="text-gray-300 text-xs font-bold uppercase tracking-widest">Aero Platform</span>
                   <span className="text-[9px] text-gray-500 max-w-[150px]">Ride height compliance.</span>
                </div>
                <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${maxVertG > 3.0 ? 'bg-orange-900/20 text-orange-500 border-orange-800' : 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/50'}`}>{maxVertG > 3.0 ? 'COMPROMISED' : 'STABLE'}</span>
             </div>
          </div>
        </div>

        {/* NOUVEAU : MECHANICAL & ELECTRONIC ABUSE */}
        <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-6 flex flex-col shadow-lg">
          <span className="text-gray-500 text-[10px] font-black tracking-widest mb-6 uppercase flex items-center gap-2">Mechanical Abuse <AlertTriangle size={12}/></span>
          <div className="flex flex-col h-full justify-center gap-6">
             <div className="flex items-center justify-between border-b border-gray-800/60 pb-3">
                <div className="flex flex-col gap-1">
                   <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Electronic Overdriving</span>
                   <span className="text-[9px] text-gray-500 max-w-[150px]">ABS/TC high intervention time.</span>
                </div>
                <span className={`font-mono text-3xl font-black ${overdrivingPct > 15 ? 'text-[#ef4444]' : overdrivingPct > 5 ? 'text-[#e9c46a]' : 'text-[#10b981]'}`}>{overdrivingPct.toFixed(1)}%</span>
             </div>
             <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                   <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Rev Limiter Hits</span>
                   <span className="text-[9px] text-gray-500 max-w-[150px]">Engine stress and gearing efficiency.</span>
                </div>
                <span className={`font-mono text-3xl font-black ${revLimiterHits > 50 ? 'text-[#ef4444]' : 'text-[#e9c46a]'}`}>{revLimiterHits} <span className="text-xs">hits</span></span>
             </div>
          </div>
        </div>

      </div>

      {/* LIGNE 3 : RACE ENGINEER LOIC */}
      <div className="bg-[#121318] border border-[#8338ec]/50 shadow-[0_0_20px_rgba(131,56,236,0.1)] rounded-xl flex flex-col overflow-hidden relative">
        <div className="bg-[#121318] border-b border-gray-800/60 p-5 flex gap-4 items-center relative z-10">
          <div className="w-12 h-12 rounded-full bg-[#8338ec]/20 border-2 border-[#8338ec] flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(131,56,236,0.4)]">
            <Zap size={20} className="text-[#8338ec] animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#8338ec]/30 to-transparent"></div>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-black tracking-widest text-sm flex items-center gap-2">RACE ENGINEER LOÏC <CheckCircle2 size={14} className="text-[#2a9d5c]" /></h3>
            <p className="text-[#a855f7] text-[10px] font-bold tracking-widest uppercase mt-0.5">Live Audio Spotter & Telemetry Analysis</p>
          </div>
          <div className="flex items-center gap-3 bg-[#0a0a0f] border border-gray-800 rounded-lg px-4 py-2">
            <div className={`w-2 h-2 rounded-full ${liveData ? 'bg-[#2a9d5c] shadow-[0_0_8px_#2a9d5c] animate-pulse' : 'bg-[#e76f51]'}`}></div>
            <span className="text-xs font-bold text-gray-300">TTS Audio Connected</span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 gap-8 relative z-10">
          <div className="flex flex-col gap-4">
            <h4 className="text-gray-500 text-[10px] font-black tracking-widest uppercase flex items-center gap-2"><Activity size={14}/> Live Driving Diagnostics</h4>
            {liveData?.ABS_Active || liveData?.TC_Active ? (
              <div className="bg-[#2a1518]/50 border border-[#ef4444]/30 p-4 rounded-lg flex items-start gap-3">
                <AlertTriangle size={16} className="text-[#ef4444] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#ef4444] text-xs font-bold uppercase tracking-wider block mb-1">Overdriving Detected</span>
                  <span className="text-gray-300 text-xs leading-relaxed">High intervention from {liveData?.ABS_Active ? 'ABS' : 'Traction Control'} detected. Smooth your inputs to protect the tires.</span>
                </div>
              </div>
            ) : (
              <div className="bg-[#12221b]/50 border border-[#10b981]/30 p-4 rounded-lg flex items-start gap-3">
                <CheckCircle2 size={16} className="text-[#10b981] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#10b981] text-xs font-bold uppercase tracking-wider block mb-1">Inputs Optimal</span>
                  <span className="text-gray-300 text-xs leading-relaxed">Steering, braking, and throttle traces look smooth. Keep pushing.</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4 border-l border-gray-800/60 pl-8">
            <h4 className="text-gray-500 text-[10px] font-black tracking-widest uppercase flex items-center gap-2"><Route size={14}/> Proximity Radar</h4>
            <div className="bg-[#0a0a0f] border border-gray-800 p-4 rounded-lg flex flex-col gap-3">
                {liveData?.CompetitorsCount > 0 ? (
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-gray-400 text-xs">Tracking {liveData.CompetitorsCount} cars on track.</span>
                    <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden relative">
                      <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white z-10 transform -translate-x-1/2"></div>
                      <div className="absolute top-0 bottom-0 left-[45%] w-2 bg-[#ef4444] rounded-full shadow-[0_0_8px_#ef4444]"></div>
                    </div>
                  </div>
                ) : <span className="text-gray-500 text-xs">Clear track. No traffic detected nearby.</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TelemetryPitWall = ({ laps, liveData, historicalData }: any) => {
  const [fuelHistory, setFuelHistory] = useState<number[]>([]);
  const [lastLapFuel, setLastLapFuel] = useState<number | null>(null);
  const [commDb, setCommDb] = useState<any>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/community-reference')
      .then(res => res.json())
      .then(json => { if (json.status === 'success') setCommDb(json.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
     const currentFuel = liveData?.FuelLevel;
     const dist = liveData?.MyLapDist;
     if (dist !== undefined && currentFuel !== undefined) {
         if (dist < 100 && dist > 0 && lastLapFuel !== null) {
             const usage = lastLapFuel - currentFuel;
             if (usage > 0.5 && usage < 15) setFuelHistory(prev => [...prev.slice(-4), usage]); 
             setLastLapFuel(currentFuel);
         } else if (lastLapFuel === null || Math.abs(lastLapFuel - currentFuel) > 15) {
             setLastLapFuel(currentFuel);
         }
     }
  }, [liveData?.MyLapDist, liveData?.FuelLevel, lastLapFuel]);

  // --- MATHÉMATIQUES STRATÉGIQUES ---
  const avgFuelUsage = fuelHistory.length > 0 ? fuelHistory.reduce((a,b)=>a+b,0)/fuelHistory.length : 0;
  const lapsRemaining = avgFuelUsage > 0 ? (liveData?.FuelLevel / avgFuelUsage).toFixed(1) : '--';
  const fuelCap = liveData?.FuelCapacity || 110;
  const maxLapsStint = avgFuelUsage > 0 ? Math.floor(fuelCap / avgFuelUsage) : '--';
  
  const fuelLevel = liveData?.FuelLevel !== undefined ? liveData.FuelLevel.toFixed(1) : '0.0';
  const battery = liveData?.VirtualEnergy !== undefined ? liveData.VirtualEnergy.toFixed(1) : '0.0';

  let targetCommLaps: number | string = '--';
  if (commDb && liveData?.TrackName && liveData?.MyClass) {
     let cClass = liveData.MyClass.toUpperCase();
     if (cClass.includes('HYPER')) cClass = 'HYPERCAR';
     else if (cClass.includes('GT3')) cClass = 'LMGT3';
     else if (cClass.includes('GTE')) cClass = 'LMGTE';
     else if (cClass.includes('P2')) cClass = 'LMP2WEC';
     
     const catData = commDb[cClass];
     if (catData) {
        const tKey = Object.keys(catData).find(k => liveData.TrackName.toLowerCase().replace(/[^a-z]/g, '').includes(k.toLowerCase().replace(/[^a-z]/g, '')) || k.toLowerCase().replace(/[^a-z]/g, '').includes(liveData.TrackName.toLowerCase().replace(/[^a-z]/g, '')));
        if (tKey && catData[tKey].fuel_stints) {
           const stints = catData[tKey].fuel_stints;
           const maxStint = Math.max(...Object.values(stints as Record<string, number>));
           if (maxStint > 0) targetCommLaps = maxStint;
        }
     }
  }

  // Jauges Fuel
  const fuelPct = Math.min(100, (Number(fuelLevel) / fuelCap) * 100);
  const currentTargetFuel = avgFuelUsage > 0 ? (avgFuelUsage * 0.95).toFixed(2) : '--';
  
  // Correction: La télémétrie mémoire (Live) ne contient pas l'épaisseur des freins, il faut lire la BDD (History)
  const currentBrakeFL = historicalData && historicalData.length > 0 ? (historicalData[historicalData.length - 1].BrakeThickFL || 25.0) : 25.0;
  const isBrakeDanger = currentBrakeFL > 0 && currentBrakeFL < 12.0;

  // Calcul Pneus Restants
  const avgTireWear = ((liveData?.TireWearFL||0) + (liveData?.TireWearFR||0) + (liveData?.TireWearRL||0) + (liveData?.TireWearRR||0)) / 4;
  const validLapsCount = laps.filter((l:any)=>l.time!=='0:00.000').length;
  const wearPerLap = validLapsCount > 0 ? avgTireWear / validLapsCount : 0;
  const estTireLaps = wearPerLap > 0 ? Math.floor((100 - avgTireWear) / wearPerLap) : '--';

  // --- TRAFFIC & PIT WINDOW RADAR ---
  const traffic = liveData?.CompetitorsLive || [];
  const myDist = liveData?.MyLapDist || 0;
  const carsAhead = traffic.filter((c:any) => c.lap_dist > myDist && c.lap_dist < myDist + 300).length;
  const carsBehind = traffic.filter((c:any) => c.lap_dist < myDist && c.lap_dist > myDist - 300).length;

  // Calcul du Pit Window (Où ressort-on si on s'arrête maintenant ?)
  const carsInPitWindow = traffic.filter((c:any) => {
      let dDiff = myDist - c.lap_dist;
      if (dDiff < 0) dDiff += 13000; // Approximation piste 13km (Le Mans)
      return dDiff > 500 && dDiff < 2500; // Fenêtre d'arrêt aux stands
  }).length;
  const pitTrafficRisk = carsInPitWindow > 2 ? 'HIGH RISK' : carsInPitWindow > 0 ? 'MEDIUM' : 'CLEAR AIR';
  const pitRiskColor = carsInPitWindow > 2 ? 'text-[#ef4444]' : carsInPitWindow > 0 ? 'text-[#e9c46a]' : 'text-[#10b981]';
  const pitRiskBg = carsInPitWindow > 2 ? 'bg-red-900/20 border-red-800' : carsInPitWindow > 0 ? 'bg-orange-900/20 border-orange-800' : 'bg-[#181924] border-gray-800';

  // --- ERS & LOCK-UPS ---
  const socLevel = liveData?.SoC !== undefined ? liveData.SoC : 100;
  const ersStatus = socLevel < 20 ? 'CLIPPING (LOSS VMAX)' : socLevel > 85 ? 'UNDERUSED (PUSH)' : 'OPTIMAL';
  const ersColor = socLevel < 20 ? 'text-[#ef4444]' : socLevel > 85 ? 'text-[#e9c46a]' : 'text-[#10b981]';
  
  // Alarme de blocage de roue (Freinage fort sans ABS)
  const isFrontLocking = liveData?.Brake > 85 && liveData?.ABS_Active === false;

  return (
    <div className="flex-1 flex gap-6 h-full overflow-hidden pb-6">
      {/* TIMING BOARD GAUCHE */}
      <div className="flex-[2] bg-[#121318] border border-gray-800/50 rounded-xl p-6 shadow-2xl flex flex-col">
        <h2 className="text-white font-black tracking-widest text-lg flex items-center gap-2 mb-6"><Activity size={18} className="text-[#3a86ff]"/> PIT WALL TIMING</h2>
        <div className="flex-1 bg-[#0a0a0f] border border-gray-800 rounded-lg overflow-hidden flex flex-col">
           <div className="flex justify-between items-center bg-[#121318] p-4 border-b border-gray-800/60">
             <span className="font-bold text-white text-xs tracking-widest">LIVE LAPS</span>
           </div>
           <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
             {laps.map((l: any, idx: number) => (
               <div key={idx} className={`flex items-center px-4 py-2.5 rounded-md cursor-pointer transition-colors ${l.active ? 'bg-[#3a86ff]/20 border border-[#3a86ff]/50 text-white' : 'hover:bg-[#121318] text-[#a0a3b5]'}`}>
                 <span className="w-12 text-[11px] font-bold">{l.lap}</span>
                 <span className="flex-1 font-mono text-sm font-bold">{l.time}</span>
                 <span className="text-xs font-bold">{l.diff}</span>
               </div>
             ))}
           </div>
        </div>
      </div>
      
      {/* COLONNE DROITE : STRATEGIE & RADAR */}
      <div className="w-[450px] flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-hide">
        
        <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-6 shadow-lg">
          <h3 className="text-[#a0a3b5] text-[11px] font-black tracking-widest mb-4 uppercase">Live Strategy Calculator</h3>
          <div className="flex flex-col gap-4">
            
            <div className="flex items-center gap-4 bg-[#0a0a0f] p-4 rounded-xl border border-gray-800">
              <div className="w-16 h-16 rounded-full border-[6px] border-[#181924] relative flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="44%" fill="none" stroke={fuelPct < 15 ? "#ef4444" : "#2a9d5c"} strokeWidth="6" strokeDasharray={`${fuelPct * 1.5} 150`} />
                </svg>
                <Fuel size={20} className={fuelPct < 15 ? "text-[#ef4444]" : "text-[#2a9d5c]"}/>
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">Fuel Remaining</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-white font-mono text-3xl font-black">{fuelLevel}</span>
                  <span className="text-gray-500 font-bold text-sm">/ {fuelCap} L</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-1">Consumption</span>
                <span className="text-[#e9c46a] font-mono text-lg font-black">{avgFuelUsage > 0 ? avgFuelUsage.toFixed(2) : '--'} <span className="text-xs">L/Lap</span></span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#181924] border border-gray-800 rounded-lg p-3 flex flex-col items-center">
                <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest text-center h-6">Est. Laps<br/>Left</span>
                <span className={Number(lapsRemaining) < 3 ? "text-[#ef4444] font-mono text-2xl font-black mt-2 animate-pulse" : "text-white font-mono text-2xl font-black mt-2"}>{lapsRemaining}</span>
              </div>
              <div className="bg-[#181924] border border-gray-800 rounded-lg p-3 flex flex-col items-center">
                <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest text-center h-6">Your Max<br/>Stint</span>
                <span className="text-[#3a86ff] font-mono text-2xl font-black mt-2">{maxLapsStint}</span>
              </div>
              <div className="bg-[#181924] border border-gray-800 rounded-lg p-3 flex flex-col items-center relative overflow-hidden">
                <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest text-center h-6">Community<br/>Target</span>
                <span className="text-[#e9c46a] font-mono text-2xl font-black mt-2 z-10">{targetCommLaps}</span>
                {maxLapsStint !== '--' && targetCommLaps !== '--' && Number(maxLapsStint) > Number(targetCommLaps) && (
                  <div className="absolute bottom-0 w-full h-1 bg-[#10b981]"></div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
               <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                 <div className="flex flex-col">
                    <span className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">Lift & Coast</span>
                    <span className="text-gray-300 text-[10px]">Target L/Lap</span>
                 </div>
                 <span className="text-[#10b981] font-mono text-lg font-black">{currentTargetFuel}</span>
               </div>
               
               <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                 <div className="flex flex-col">
                    <span className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">Front Brakes</span>
                    <span className="text-gray-300 text-[10px]">Pads Thick.</span>
                 </div>
                 <span className={`font-mono text-lg font-black ${isBrakeDanger ? 'text-[#ef4444] animate-pulse' : 'text-white'}`}>
                    {currentBrakeFL.toFixed(1)}mm
                 </span>
               </div>

               <div className="col-span-2 flex items-center justify-between border-b border-gray-800 pb-2">
                 <div className="flex flex-col">
                    <span className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">ERS Deployment</span>
                    <span className="text-gray-300 text-xs">Battery Status: {socLevel.toFixed(1)}%</span>
                 </div>
                 <span className={`font-mono text-[11px] font-black tracking-widest ${ersColor}`}>{ersStatus}</span>
               </div>
            </div>
          </div>
        </div>

        {/* NOUVEAU : TRAFFIC & PIT WINDOW RADAR */}
        <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-6 shadow-lg">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-[#a0a3b5] text-[11px] font-black tracking-widest uppercase">Race Control Radar</h3>
              {isFrontLocking && <span className="bg-red-900/30 text-red-500 border border-red-800 px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase animate-pulse">FRONT LOCK-UP</span>}
           </div>
           
           <div className="flex flex-col gap-3">
              <div className={`p-3 rounded-lg border flex items-center justify-between ${liveData?.YellowFlag > 0 ? 'bg-[#e9c46a]/20 border-[#e9c46a]/50 text-[#e9c46a]' : 'bg-[#181924] border-gray-800 text-gray-400'}`}>
                 <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><AlertTriangle size={14}/> Track Status</span>
                 <span className="text-sm font-black">{liveData?.YellowFlag > 0 ? 'YELLOW FLAG' : 'GREEN'}</span>
              </div>

              <div className={`p-3 rounded-lg border flex items-center justify-between ${pitRiskBg}`}>
                 <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-white"><Route size={14}/> Pit Window Traffic</span>
                 <span className={`text-sm font-black ${pitRiskColor}`}>{pitTrafficRisk}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-[#181924] border border-gray-800 rounded-lg p-3 flex flex-col items-center">
                    <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Cars Ahead (300m)</span>
                    <span className="text-white font-mono text-xl font-black mt-1">{carsAhead}</span>
                 </div>
                 <div className="bg-[#181924] border border-gray-800 rounded-lg p-3 flex flex-col items-center">
                    <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Cars Behind (300m)</span>
                    <span className="text-white font-mono text-xl font-black mt-1">{carsBehind}</span>
                 </div>
              </div>
           </div>
        </div>
        
        {/* TIRE TELEMETRY */}
        <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[#a0a3b5] text-[11px] font-black tracking-widest uppercase">Tire Telemetry</h3>
            <span className="bg-[#181924] border border-gray-700 px-3 py-1 rounded-full text-[9px] font-mono font-bold text-gray-300 shadow-inner">
               EST LAPS LEFT: <span className={Number(estTireLaps) < 5 ? "text-[#ef4444]" : "text-[#8338ec]"}>{estTireLaps}</span>
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 relative z-0">
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full border-[10px] border-[#2e4b3c] flex items-center justify-center bg-[#0a0a0f] shadow-inner">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="44%" fill="none" stroke={liveData?.TireWearFL > 20 ? "#ef4444" : "#2a9d5c"} strokeWidth="10" strokeDasharray="0 1000" />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-white font-mono text-xl font-bold">{liveData?.TireTempFL ? liveData.TireTempFL.toFixed(0) : '--'}°C</span>
                  <span className="text-[#a0a3b5] text-[9px] mt-1">Wear: {liveData?.TireWearFL ? liveData.TireWearFL.toFixed(1) : '--'}%</span>
                </div>
              </div>
              <div className="flex justify-between w-full mt-3 text-[10px] font-bold">
                <span className="text-gray-500 tracking-widest">FRONT L</span>
                <span className="text-[#2a9d5c]">{liveData?.TirePressFL ? liveData.TirePressFL.toFixed(1) : '--'} kPa</span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full border-[10px] border-[#2e4b3c] flex items-center justify-center bg-[#0a0a0f] shadow-inner">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="44%" fill="none" stroke={liveData?.TireWearFR > 20 ? "#ef4444" : "#2a9d5c"} strokeWidth="10" strokeDasharray="0 1000" />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-white font-mono text-xl font-bold">{liveData?.TireTempFR ? liveData.TireTempFR.toFixed(0) : '--'}°C</span>
                  <span className="text-[#a0a3b5] text-[9px] mt-1">Wear: {liveData?.TireWearFR ? liveData.TireWearFR.toFixed(1) : '--'}%</span>
                </div>
              </div>
              <div className="flex justify-between w-full mt-3 text-[10px] font-bold">
                <span className="text-[#2a9d5c]">{liveData?.TirePressFR ? liveData.TirePressFR.toFixed(1) : '--'} kPa</span>
                <span className="text-gray-500 tracking-widest">FRONT R</span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full border-[10px] border-[#2e4b3c] flex items-center justify-center bg-[#0a0a0f] shadow-inner">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="44%" fill="none" stroke={liveData?.TireWearRL > 20 ? "#ef4444" : "#2a9d5c"} strokeWidth="10" strokeDasharray="0 1000" />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-white font-mono text-xl font-bold">{liveData?.TireTempRL ? liveData.TireTempRL.toFixed(0) : '--'}°C</span>
                  <span className="text-[#a0a3b5] text-[9px] mt-1">Wear: {liveData?.TireWearRL ? liveData.TireWearRL.toFixed(1) : '--'}%</span>
                </div>
              </div>
              <div className="flex justify-between w-full mt-3 text-[10px] font-bold">
                <span className="text-gray-500 tracking-widest">REAR L</span>
                <span className="text-[#2a9d5c]">{liveData?.TirePressRL ? liveData.TirePressRL.toFixed(1) : '--'} kPa</span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full border-[10px] border-[#2e4b3c] flex items-center justify-center bg-[#0a0a0f] shadow-inner">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="44%" fill="none" stroke={liveData?.TireWearRR > 20 ? "#ef4444" : "#2a9d5c"} strokeWidth="10" strokeDasharray="0 1000" />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-white font-mono text-xl font-bold">{liveData?.TireTempRR ? liveData.TireTempRR.toFixed(0) : '--'}°C</span>
                  <span className="text-[#a0a3b5] text-[9px] mt-1">Wear: {liveData?.TireWearRR ? liveData.TireWearRR.toFixed(1) : '--'}%</span>
                </div>
              </div>
              <div className="flex justify-between w-full mt-3 text-[10px] font-bold">
                <span className="text-[#2a9d5c]">{liveData?.TirePressRR ? liveData.TirePressRR.toFixed(1) : '--'} kPa</span>
                <span className="text-gray-500 tracking-widest">REAR R</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const TelemetryLiveSetup = ({ liveData }: any) => {
  const renderBar = (value: number, max: number, color: string) => {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return (
      <div className="flex-1 h-2 bg-[#0a0a0f] rounded-full overflow-hidden border border-gray-800">
         <div className="h-full transition-all duration-75" style={{ width: `${pct}%`, backgroundColor: color }}></div>
      </div>
    );
  };

  // --- DIAGNOSTICS CHASSIS & PILOTAGE ---
  const frontAvg = ((liveData?.RideHeightFL || 0) + (liveData?.RideHeightFR || 0)) / 2;
  const rearAvg = ((liveData?.RideHeightRL || 0) + (liveData?.RideHeightRR || 0)) / 2;
  const rake = (rearAvg - frontAvg) * 1000; 

  // Bottoming basé sur l'enfoncement du 3ème ressort (Heave) ou la hauteur de caisse
  const heaveFront = liveData?.Front3rdDeflection || 0;
  const isAeroStall = (liveData?.RideHeightFL < 0.015 || liveData?.RideHeightFR < 0.015) && liveData?.Speed > 240;
  const isBottoming = (liveData?.RideHeightFL < 0.015 || liveData?.RideHeightFR < 0.015) && liveData?.Speed > 240;
  
  // Traction & Diff Monitor: Patinage d'une seule roue détectée via l'écart de température brutale
  const rearTempDiff = Math.abs((liveData?.TireTempRL || 0) - (liveData?.TireTempRR || 0));
  const isDiffSlipping = liveData?.Throttle > 80 && liveData?.Speed < 150 && rearTempDiff > 10;

  const flSpread = (liveData?.TireTempFL || 0) - (liveData?.TireCarcassFL || 0);
  const frSpread = (liveData?.TireTempFR || 0) - (liveData?.TireCarcassFR || 0);
  const rlSpread = (liveData?.TireTempRL || 0) - (liveData?.TireCarcassRL || 0);
  const rrSpread = (liveData?.TireTempRR || 0) - (liveData?.TireCarcassRR || 0);

  // Sous-virage: Fort angle de volant, mais couple directionnel très faible (les pneus glissent sur l'asphalte)
  const isUndersteering = Math.abs(liveData?.Steering || 0) > 60 && Math.abs(liveData?.SteeringTorque || 10) < 4.0 && liveData?.Speed > 80;

  // --- NOUVEAU : SOUFFLERIE VIRTUELLE (LIFT / DRAG) ---
  const totalDownforce = (liveData?.FrontDownforceN || 0) + (liveData?.RearDownforceN || 0);
  const aeroBalanceFront = totalDownforce > 0 ? ((liveData?.FrontDownforceN || 0) / totalDownforce) * 100 : 0;
  const aeroEfficiency = (liveData?.DragN || 0) > 0 ? (totalDownforce / liveData?.DragN) : 0;

  return (
    <div className="flex-1 bg-[#121318] border border-gray-800/50 rounded-xl p-6 shadow-2xl flex flex-col overflow-hidden pb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-white font-black tracking-widest text-lg flex items-center gap-2"><Wrench size={18} className="text-[#3a86ff]"/> LIVE SETUP SENSORS</h2>
        <div className="flex gap-2">
           {isAeroStall && <span className="bg-red-900/30 text-red-500 border border-red-800 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase animate-pulse">AERO STALL (BOTTOMING)</span>}
           {isUndersteering && <span className="bg-orange-900/30 text-orange-500 border border-orange-800 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase animate-pulse">FRONT TIRE SATURATION</span>}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-8 h-full">
        <div className="flex flex-col gap-6">
          {/* RIDE HEIGHT ET RAKE DYNAMIQUE */}
          <div className="bg-[#0a0a0f] border border-gray-800/60 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
               <span className="text-[#a0a3b5] text-[10px] font-bold tracking-widest block">RIDE HEIGHT (m)</span>
               <span className="bg-[#181924] border border-gray-700 px-3 py-1 rounded-full text-xs font-mono font-bold text-white shadow-inner">
                 RAKE: <span className="text-[#8338ec]">{rake.toFixed(1)} mm</span>
               </span>
            </div>
            <div className="grid grid-cols-2 gap-6 text-xs font-bold text-gray-300">
              <div className="flex flex-col gap-1.5"><div className="flex justify-between"><span>FL</span><span className={liveData?.RideHeightFL < 0.015 ? 'text-[#ef4444]' : 'text-white'}>{liveData?.RideHeightFL ? liveData.RideHeightFL.toFixed(4) : '--'}</span></div>{renderBar(liveData?.RideHeightFL || 0, 0.1, '#3a86ff')}</div>
              <div className="flex flex-col gap-1.5"><div className="flex justify-between"><span>FR</span><span className={liveData?.RideHeightFR < 0.015 ? 'text-[#ef4444]' : 'text-white'}>{liveData?.RideHeightFR ? liveData.RideHeightFR.toFixed(4) : '--'}</span></div>{renderBar(liveData?.RideHeightFR || 0, 0.1, '#3a86ff')}</div>
              <div className="flex flex-col gap-1.5 mt-2"><div className="flex justify-between"><span>RL</span><span className="text-white">{liveData?.RideHeightRL ? liveData.RideHeightRL.toFixed(4) : '--'}</span></div>{renderBar(liveData?.RideHeightRL || 0, 0.1, '#8338ec')}</div>
              <div className="flex flex-col gap-1.5 mt-2"><div className="flex justify-between"><span>RR</span><span className="text-white">{liveData?.RideHeightRR ? liveData.RideHeightRR.toFixed(4) : '--'}</span></div>{renderBar(liveData?.RideHeightRR || 0, 0.1, '#8338ec')}</div>
            </div>
          </div>

          <div className="bg-[#0a0a0f] border border-gray-800/60 rounded-xl p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
               <span className="text-[#a0a3b5] text-[10px] font-bold tracking-widest block">AERO & CHASSIS</span>
               <span className="bg-[#181924] border border-gray-700 px-3 py-1 rounded-full text-xs font-mono font-bold text-white shadow-inner" title="Lift to Drag Ratio (Aero Efficiency)">
                 L/D RATIO: <span className="text-[#10b981]">{aeroEfficiency > 0 ? aeroEfficiency.toFixed(2) : '--'}</span>
               </span>
            </div>
            <div className="flex flex-col gap-3 text-xs font-bold text-gray-400">
              <div className="flex justify-between items-center border-b border-gray-800/50 pb-2">
                 <span>Aero Balance (Front)</span>
                 <span className="text-[#3a86ff] text-lg font-mono">{aeroBalanceFront > 0 ? aeroBalanceFront.toFixed(1) : '--'}%</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800/50 pb-2">
                 <span>Brake Bias</span>
                 <span className="text-[#e9c46a] text-lg font-mono">{liveData?.BrakeBias ? liveData.BrakeBias.toFixed(1) : '--'}%</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800/50 pb-2">
                 <span>Aero Damage</span>
                 <span className={liveData?.AeroDamage > 0.05 ? "text-[#ef4444] text-lg font-mono" : "text-[#10b981] text-lg font-mono"}>{liveData?.AeroDamage ? (liveData.AeroDamage * 100).toFixed(1) : '0'}%</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800/50 pb-2">
                 <span>Steering Torque</span>
                 <span className={isUndersteering ? "text-[#ef4444] text-lg font-mono animate-pulse" : "text-[#3a86ff] text-lg font-mono"}>{liveData?.SteeringTorque ? Math.abs(liveData.SteeringTorque).toFixed(1) : '--'} Nm</span>
              </div>
              <div className="flex justify-between items-center">
                 <span>Differential Slip</span>
                 <span className={isDiffSlipping ? "text-[#ef4444] animate-pulse font-black" : "text-[#10b981]"}>{isDiffSlipping ? 'HIGH (WHEELSPIN)' : 'LOCKED'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
           <div className="bg-[#0a0a0f] border border-gray-800/60 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[#a0a3b5] text-[10px] font-bold tracking-widest block">TIRE SPREAD (°C)</span>
              <span className="text-gray-500 text-[9px] uppercase tracking-widest">Surface vs Core</span>
            </div>
            <div className="grid grid-cols-2 gap-6 text-xs font-bold text-gray-300">
              <div className="flex flex-col gap-1.5"><div className="flex justify-between"><span>FL</span><span className={flSpread > 15 ? "text-[#ef4444]" : "text-white"}>{flSpread > 0 ? '+' : ''}{flSpread.toFixed(1)}</span></div>{renderBar(Math.abs(flSpread), 30, flSpread > 15 ? '#ef4444' : '#10b981')}</div>
              <div className="flex flex-col gap-1.5"><div className="flex justify-between"><span>FR</span><span className={frSpread > 15 ? "text-[#ef4444]" : "text-white"}>{frSpread > 0 ? '+' : ''}{frSpread.toFixed(1)}</span></div>{renderBar(Math.abs(frSpread), 30, frSpread > 15 ? '#ef4444' : '#10b981')}</div>
              <div className="flex flex-col gap-1.5 mt-2"><div className="flex justify-between"><span>RL</span><span className={rlSpread > 15 ? "text-[#ef4444]" : "text-white"}>{rlSpread > 0 ? '+' : ''}{rlSpread.toFixed(1)}</span></div>{renderBar(Math.abs(rlSpread), 30, rlSpread > 15 ? '#ef4444' : '#10b981')}</div>
              <div className="flex flex-col gap-1.5 mt-2"><div className="flex justify-between"><span>RR</span><span className={rrSpread > 15 ? "text-[#ef4444]" : "text-white"}>{rrSpread > 0 ? '+' : ''}{rrSpread.toFixed(1)}</span></div>{renderBar(Math.abs(rrSpread), 30, rrSpread > 15 ? '#ef4444' : '#10b981')}</div>
            </div>
          </div>

          <div className="bg-[#0a0a0f] border border-gray-800/60 rounded-xl p-6 shadow-sm">
            <span className="text-[#a0a3b5] text-[10px] font-bold tracking-widest mb-4 block">ELECTRONICS & ENGINE</span>
            <div className="flex flex-col gap-5 text-xs font-bold text-gray-400">
              <div className="flex justify-between items-center"><span>ABS Intervention</span><span className={liveData?.ABS_Active ? "text-[#ef4444] animate-pulse text-sm font-black" : "text-gray-600 text-sm"}>{liveData?.ABS_Active ? 'ACTIVE' : 'IDLE'}</span></div>
              <div className="flex justify-between items-center"><span>TC Intervention</span><span className={liveData?.TC_Active ? "text-[#ef4444] animate-pulse text-sm font-black" : "text-gray-600 text-sm"}>{liveData?.TC_Active ? 'ACTIVE' : 'IDLE'}</span></div>
              <div className="flex justify-between items-center mt-2 border-t border-gray-800/60 pt-4"><span>Water Temp</span><span className={liveData?.EngineWaterTemp > 105 ? "text-[#ef4444] text-lg font-mono" : "text-white text-lg font-mono"}>{liveData?.EngineWaterTemp ? liveData.EngineWaterTemp.toFixed(1) : '--'}°C</span></div>
              <div className="flex justify-between items-center"><span>Oil Temp</span><span className="text-white text-lg font-mono">{liveData?.EngineOilTemp ? liveData.EngineOilTemp.toFixed(1) : '--'}°C</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Le React.memo bloque les rafraîchissements inutiles de la carte GPS (Boost FPS)
const MemoizedDrivingView = React.memo(DrivingView);

export { 
  DataView, 
  MemoizedDrivingView as DrivingView, 
  TimingView, 
  TelemetryOverview, 
  TelemetryPitWall, 
  TelemetryLiveSetup 
};