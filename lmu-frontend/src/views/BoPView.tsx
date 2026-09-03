import React, { useState, useEffect, useMemo } from 'react';
import { 
  Scale, Zap, ChevronDown, BarChart2, ShieldAlert, 
  Target, AlertTriangle, Wind, Info, CarFront, BatteryCharging
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip, Cell 
} from 'recharts';
import { CountryFlag, getTrackCountryCode, BRAND_LOGOS } from '../lmu_constants';

export default function BoPView() {
  const [bopData, setBopData] = useState<any>(null);
  const [commDb, setCommDb] = useState<any>(null); // NOUVEAU
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('HYPERCAR');
  const [isTrackDropdownOpen, setIsTrackDropdownOpen] = useState(false);

  // 1. Fetching Data (BoP + Community JSON)
  useEffect(() => {
    Promise.all([
      fetch('http://127.0.0.1:8000/api/bop').then(res => res.json()),
      fetch('http://127.0.0.1:8000/api/community-reference').then(res => res.json())
    ]).then(([bopJson, commJson]) => {
      if (bopJson.status === 'success') {
        setBopData(bopJson.data);
        const tracks = Object.keys(bopJson.data);
        if (tracks.length > 0) setSelectedTrack(tracks[0]);
      }
      if (commJson.status === 'success') {
        setCommDb(commJson.data);
      }
      setIsLoading(false);
    }).catch(err => {
      console.error(err);
      setIsLoading(false);
    });
  }, []);

  // 2. Data Processing & AI Insights
  const currentData = useMemo(() => {
    if (!bopData || !selectedTrack || !bopData[selectedTrack]) return null;
    return bopData[selectedTrack][selectedCategory] || {};
  }, [bopData, selectedTrack, selectedCategory]);

  const { chartData, insights, tableColumns } = useMemo(() => {
    if (!currentData || Object.keys(currentData).length === 0) 
      return { chartData: [], insights: null, tableColumns: [] };

    let dataArr = Object.entries(currentData).map(([carModel, specs]: any) => {
      // Normalisation Puissance (Gestion du P13 en LMGT3 vs kW en Hypercar)
      let powerVal = 0;
      if (specs.MaxPowerStage1) {
        if (typeof specs.MaxPowerStage1 === 'string' && specs.MaxPowerStage1.startsWith('P')) {
          powerVal = 100 - parseInt(specs.MaxPowerStage1.replace('P', '')); // Approximation P1 = 100%, P10 = 90%
        } else {
          powerVal = parseFloat(specs.MaxPowerStage1);
        }
      } else if (specs.Power && specs.Power !== "Base") {
        powerVal = 95; // Reduced LMP2
      } else {
        powerVal = 100; // Base
      }

      return {
        car: carModel,
        brand: specs.Manufacturer || "Unknown",
        weight: parseFloat(specs.MinWeight) || 0,
        power: powerVal,
        powerToWeight: (powerVal / (parseFloat(specs.MinWeight) || 1)) * 1000, // Ratio
        ...specs
      };
    });

    // --- NOUVEAU : CALCUL DU META TIER DE CHAQUE VOITURE ---
    dataArr = dataArr.map((d: any) => {
       let tier = 'C-Tier';
       let metaPct = null;
       if (commDb && commDb[selectedCategory] && commDb[selectedCategory].meta_ranking) {
           const rankingData = commDb[selectedCategory].meta_ranking;
           const carKey = Object.keys(rankingData).find(k => {
               const jName = k.toLowerCase();
               const bBrand = d.brand.toLowerCase();
               const bModel = d.car.toLowerCase();
               
               // Traductions explicites pour les modèles complexes entre LMU et le JSON
               if (bBrand.includes('porsche') && bModel.includes('911') && jName.includes('992')) return true; // GT3
               if (bBrand.includes('porsche') && bModel.includes('rsr') && jName.includes('rsr')) return true; // GTE
               if (bBrand.includes('aston') && jName.includes('aston')) return true; 
               if (bBrand.includes('mercedes') && jName.includes('amg')) return true;
               
               // Nettoyage générique (enlève les espaces, traits, et mots parasites comme "lmgt3" ou "evo")
               const cleanJson = jName.replace(/[^a-z0-9]/g, '');
               const cleanBop = (bBrand + bModel).replace(/[^a-z0-9]/g, '').replace('lmgt3', '').replace('gte', '').replace('evo2', '').replace('evo', '');
               
               // 1. Match par nom nettoyé | 2. Match par numéro de modèle (ex: "488", "296", "720")
               return cleanBop.includes(cleanJson) || cleanJson.includes(cleanBop) || 
                      (bModel.match(/\d{3}/) && jName.includes(bModel.match(/\d{3}/)![0]));
           });
           
           if (carKey) {
               metaPct = rankingData[carKey];
               if (metaPct <= 100.10) tier = 'S-Tier';
               else if (metaPct <= 100.30) tier = 'A-Tier';
               else if (metaPct <= 100.60) tier = 'B-Tier';
           }
       }
       return { ...d, tier, metaPct };
    });

    // Tri par ordre alphabétique
    dataArr = dataArr.sort((a, b) => a.brand.localeCompare(b.brand));

    // Calcul des Min/Max pour les couleurs (Rouge/Vert)
    const weights = dataArr.map(d => d.weight).filter(w => w > 0);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);

    const ratios = dataArr.map(d => d.powerToWeight).filter(r => r > 0);
    const maxRatio = Math.max(...ratios);
    const minRatio = Math.min(...ratios);

    // AI Insights
    const bestRatioCar = dataArr.find(d => d.powerToWeight === maxRatio);
    const heaviestCar = dataArr.find(d => d.weight === maxW);
    const lightestCar = dataArr.find(d => d.weight === minW);

    const generatedInsights = {
      bestPace: bestRatioCar,
      heaviest: heaviestCar,
      lightest: lightestCar,
      minWeight: minW,
      maxWeight: maxW,
      maxRatio: maxRatio,
      minRatio: minRatio
    };

    // Définition dynamique des colonnes selon la catégorie
    let cols = ['Manufacturer', 'Model', 'Meta Tier', 'Min Weight'];
    if (selectedCategory === 'HYPERCAR') cols.push('Power Stg 1', 'Stg 2 Speed', 'Stg 2 Gain', 'Deploy Kph', 'Stint Energy');
    if (selectedCategory === 'LMGT3') cols.push('Power', 'Stint Energy', 'Wing Min/Max', 'Ride Height');
    if (selectedCategory === 'LMP2') cols.push('Power', 'Max RPM', 'Aero Pack', 'Fuel Tank');
    if (selectedCategory === 'LMP3') cols.push('Front Dive', 'Engine Gurney');
    if (selectedCategory === 'LMGTE') cols.push('Fuel Tank', 'Refuel Rate', 'Aero Pack');

    return { chartData: dataArr, insights: generatedInsights, tableColumns: cols };
  }, [currentData, selectedCategory]);

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center h-full text-[#3a86ff] font-bold tracking-widest text-sm animate-pulse">EXTRACTING BOP DATABASE...</div>;
  }

  if (!bopData) {
    return <div className="flex-1 flex items-center justify-center text-gray-500 font-bold">No BoP data found. Please run the backend parser.</div>;
  }

  const allTracks = Object.keys(bopData);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] rounded-xl overflow-hidden shadow-2xl border border-gray-800/50">
      
      {/* 1. TOP BAR : Filtres Circuit & Catégorie */}
      <div className="bg-[#121318] border-b border-gray-800/60 p-5 flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-[#8338ec]/20 rounded-lg border border-[#8338ec]/50 shadow-[0_0_15px_rgba(131,56,236,0.3)]">
            <Scale className="text-[#8338ec]" size={20} />
          </div>
          <div>
            <h1 className="text-white font-black text-xl tracking-wide">Balance of Performance</h1>
            <p className="text-gray-400 text-[10px] tracking-widest uppercase font-bold mt-0.5">FIA WEC Official Constraints</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Menu Déroulant Circuit */}
          <div className="relative">
            <div 
              onClick={() => setIsTrackDropdownOpen(!isTrackDropdownOpen)} 
              className="bg-[#0a0a0f] border border-gray-700 hover:border-gray-500 text-sm font-bold text-white px-4 py-2 rounded-lg cursor-pointer transition-colors min-w-[250px] flex items-center justify-between shadow-inner"
            >
              <div className="flex items-center gap-3 truncate pr-2">
                <div className="flex-shrink-0"><CountryFlag code={getTrackCountryCode(selectedTrack)} /></div>
                <span className="truncate">{selectedTrack}</span>
              </div>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${isTrackDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {isTrackDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsTrackDropdownOpen(false)}></div>
                <div className="absolute top-full right-0 mt-2 w-[350px] max-h-[400px] overflow-y-auto bg-[#121318] border border-gray-700 rounded-lg shadow-[0_15px_40px_rgba(0,0,0,0.9)] z-50 scrollbar-hide">
                  <div className="sticky top-0 bg-[#0a0a0f] p-3 text-[10px] font-black text-gray-500 tracking-widest uppercase border-b border-gray-800">Select Track Layout</div>
                  {allTracks.map(t => (
                    <div 
                      key={t} 
                      onClick={() => { setSelectedTrack(t); setIsTrackDropdownOpen(false); }} 
                      className="p-3 hover:bg-[#1a1b26] cursor-pointer flex items-center gap-3 border-b border-gray-800/50 last:border-0 transition-colors"
                    >
                      <CountryFlag code={getTrackCountryCode(t)} />
                      <span className={`text-xs font-bold truncate ${selectedTrack === t ? 'text-[#3a86ff]' : 'text-gray-200'}`}>{t}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Onglets Catégories */}
          <div className="flex bg-[#0a0a0f] rounded-lg p-1 border border-gray-800">
            {["HYPERCAR", "LMP2", "LMP3", "LMGT3", "LMGTE"].map(cat => (
              <button 
                key={cat} 
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-md text-[11px] font-black tracking-widest transition-all ${selectedCategory === cat ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide bg-[#09090b]">
        
        {/* 2. AI INSIGHTS (Cartes du haut) */}
        {insights && chartData.length > 0 ? (
          <div className="grid grid-cols-3 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Vitesse / Ratio */}
            <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between group hover:border-[#10b981]/50 transition-colors">
              <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="text-[10px] font-black tracking-widest text-[#10b981] uppercase flex items-center gap-1.5"><Zap size={14}/> Paper Favorite</span>
                {BRAND_LOGOS[insights.bestPace?.brand] && <img src={BRAND_LOGOS[insights.bestPace.brand]} className="h-6 opacity-80 invert brightness-0" alt="logo"/>}
              </div>
              <div className="relative z-10">
                <span className="text-xl font-black text-white block truncate">{insights.bestPace?.car}</span>
                <span className="text-xs font-semibold text-gray-400 mt-1 block">Best Power-to-Weight Ratio</span>
              </div>
              <div className="absolute -bottom-6 -right-6 text-[#10b981] opacity-5 group-hover:scale-110 transition-transform"><Target size={120} /></div>
            </div>

            {/* Voiture la plus lourde */}
            <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between group hover:border-[#ef4444]/50 transition-colors">
              <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="text-[10px] font-black tracking-widest text-[#ef4444] uppercase flex items-center gap-1.5"><ShieldAlert size={14}/> Heaviest Car</span>
                <span className="text-lg font-black text-white font-mono">{insights.heaviest?.weight} kg</span>
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <span className="text-xl font-black text-white block truncate">{insights.heaviest?.car}</span>
                  <span className="text-xs font-semibold text-gray-400 mt-1 block">Tire wear penalty expected</span>
                </div>
                {BRAND_LOGOS[insights.heaviest?.brand] && <img src={BRAND_LOGOS[insights.heaviest.brand]} className="h-6 opacity-40 invert brightness-0" alt="logo"/>}
              </div>
            </div>

            {/* Voiture la plus légère */}
            <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between group hover:border-[#3a86ff]/50 transition-colors">
              <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="text-[10px] font-black tracking-widest text-[#3a86ff] uppercase flex items-center gap-1.5"><Wind size={14}/> Lightest Chassis</span>
                <span className="text-lg font-black text-white font-mono">{insights.lightest?.weight} kg</span>
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <span className="text-xl font-black text-white block truncate">{insights.lightest?.car}</span>
                  <span className="text-xs font-semibold text-gray-400 mt-1 block">Agile in slow technical corners</span>
                </div>
                {BRAND_LOGOS[insights.lightest?.brand] && <img src={BRAND_LOGOS[insights.lightest.brand]} className="h-6 opacity-40 invert brightness-0" alt="logo"/>}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 font-bold text-sm uppercase tracking-widest">No valid data for this category</div>
        )}

        {/* 3. GRAPHIQUE INTERACTIF */}
        {chartData.length > 0 && (
          <div className="bg-[#121318] border border-gray-800/50 rounded-xl p-6 shadow-lg mb-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <BarChart2 className="text-gray-500" size={18} />
              <h2 className="text-white font-bold text-sm uppercase tracking-widest">Power vs Weight Distribution</h2>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="car" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10, fontWeight: 'bold'}} tickLine={false} axisLine={false} angle={-35} textAnchor="end" />
                  <YAxis yAxisId="left" domain={['dataMin - 10', 'dataMax + 10']} stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} />
                  
                  <RechartsTooltip 
                    cursor={{fill: '#1a1b26', opacity: 0.4}}
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#121318]/95 backdrop-blur-md border border-gray-700 rounded-xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)] min-w-[200px] z-50">
                            <div className="flex items-center gap-3 border-b border-gray-800 pb-3 mb-3">
                              {BRAND_LOGOS[d.brand] ? <img src={BRAND_LOGOS[d.brand]} className="h-5" alt="logo" /> : <CarFront size={16} className="text-gray-400"/>}
                              <span className="text-white font-black tracking-wide text-sm">{d.car}</span>
                            </div>
                            <div className="flex flex-col gap-2 font-mono text-xs font-bold">
                              <div className="flex justify-between"><span className="text-gray-500">Weight:</span> <span className="text-white">{d.weight} kg</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Power Ref:</span> <span className="text-white">{d.power} {selectedCategory === 'LMGT3' ? 'Index' : 'kW'}</span></div>
                              {d.MaxStintEnergy && <div className="flex justify-between"><span className="text-[#3a86ff]">Energy:</span> <span className="text-white">{d.MaxStintEnergy} MJ</span></div>}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  
                  {/* BARRE = Poids (Colorée de vert à rouge selon le poids) */}
                  <Bar yAxisId="left" dataKey="weight" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {chartData.map((entry: any, index: number) => {
                      // Normalisation de 0 (le plus léger) à 1 (le plus lourd)
                      const pct = insights?.maxWeight === insights?.minWeight ? 0.5 : (entry.weight - (insights?.minWeight || 0)) / ((insights?.maxWeight || 1) - (insights?.minWeight || 0));
                      // Plus c'est lourd (pct=1), plus c'est rouge. Plus c'est léger (pct=0), plus c'est vert.
                      const r = Math.floor(pct * 239 + (1-pct) * 16);
                      const g = Math.floor(pct * 68 + (1-pct) * 185);
                      const b = Math.floor(pct * 68 + (1-pct) * 129);
                      return <Cell key={`cell-${index}`} fill={`rgb(${r}, ${g}, ${b})`} fillOpacity={0.8} />;
                    })}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#10b981]"></div> Lightest</span>
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#ef4444]"></div> Heaviest</span>
            </div>
          </div>
        )}

        {/* 4. DATAGRID (Le Tableau Officiel) */}
        {chartData.length > 0 && (
          <div className="bg-[#121318] border border-gray-800/50 rounded-xl shadow-lg overflow-x-auto scrollbar-hide animate-in fade-in slide-in-from-bottom-8 duration-700">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
              <thead>
                <tr className="bg-[#0f1015] border-b border-gray-800/50 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                  {tableColumns.map((col, i) => (
                    <th key={i} className={`p-4 ${i === 0 ? 'pl-6' : ''} ${i === tableColumns.length - 1 ? 'pr-6' : ''}`}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-xs font-semibold text-gray-300">
                {chartData.map((row: any, i: number) => {
                  const isHeaviest = row.weight === insights?.maxWeight;
                  const isLightest = row.weight === insights?.minWeight;

                  return (
                    <tr key={i} className="border-b border-gray-800/30 hover:bg-[#1a1b26] transition-colors last:border-0 group">
                      
                      {/* Logo + Marque */}
                      <td className="p-4 pl-6 font-bold flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-center p-1 shrink-0">
                          {BRAND_LOGOS[row.brand] ? (
                            <img src={BRAND_LOGOS[row.brand]} alt={row.brand} className="max-w-full max-h-full object-contain" />
                          ) : <CarFront size={14} className="text-gray-500"/>}
                        </div>
                        <span className="text-white tracking-wide">{row.brand}</span>
                      </td>
                      
                      {/* Modèle */}
                      <td className="p-4 text-gray-400 truncate max-w-[150px] group-hover:text-white transition-colors">{row.car}</td>
                      
                      {/* NOUVEAU : META TIER */}
                      <td className="p-4 font-bold">
                        {row.metaPct ? (
                           <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded border text-[10px] tracking-widest font-black ${
                                row.tier === 'S-Tier' ? 'bg-[#8338ec]/20 text-[#8338ec] border-[#8338ec]/50 shadow-[0_0_10px_rgba(131,56,236,0.3)]' :
                                row.tier === 'A-Tier' ? 'bg-[#3a86ff]/20 text-[#3a86ff] border-[#3a86ff]/50' :
                                row.tier === 'B-Tier' ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/50' :
                                'bg-gray-800/50 text-gray-400 border-gray-700/50'
                              }`}>{row.tier}</span>
                              <span className="text-gray-500 font-mono text-[10px]">{row.metaPct}%</span>
                           </div>
                        ) : <span className="text-gray-600 text-[10px] font-bold tracking-widest uppercase">No Data</span>}
                      </td>
                      
                      {/* Poids (Coloré si min/max) */}
                      <td className="p-4 font-mono">
                        <span className={`px-2 py-1 rounded border ${isHeaviest ? 'bg-red-900/20 text-red-500 border-red-800/50' : isLightest ? 'bg-green-900/20 text-green-500 border-green-800/50' : 'bg-[#1c1e2b] text-gray-300 border-gray-700'}`}>
                          {row.weight} kg
                        </span>
                      </td>

                      {/* --- COLONNES DYNAMIQUES SELON CATÉGORIE --- */}
                      
                      {selectedCategory === 'HYPERCAR' && (
                        <>
                          <td className="p-4 font-mono text-white">{row.MaxPowerStage1} kW</td>
                          <td className="p-4 font-mono text-gray-400">{row.Stage2Start} kph</td>
                          <td className="p-4 font-mono text-gray-400">{row.PowerGainLossStage2 !== null ? `${row.PowerGainLossStage2 > 0 ? '+' : ''}${row.PowerGainLossStage2}%` : '--'}</td>
                          <td className="p-4 font-mono text-[#3a86ff]">{row.DeployActivationSpeed !== null ? `${row.DeployActivationSpeed} kph` : '--'}</td>
                          <td className="p-4 font-mono text-[#e9c46a] font-bold flex items-center gap-1.5"><BatteryCharging size={14}/> {row.MaxStintEnergy} MJ</td>
                        </>
                      )}

                      {selectedCategory === 'LMGT3' && (
                        <>
                          <td className="p-4 font-mono text-white">{row.MaxPowerStage1}</td>
                          <td className="p-4 font-mono text-[#e9c46a] font-bold">{row.MaxStintEnergy} MJ</td>
                          <td className="p-4 font-mono text-gray-400">{row.MinRearwingAngle}°  to  {row.MaxRearwingAngle}°</td>
                          <td className="p-4 font-mono text-gray-400">{row.MinRideHeight} mm</td>
                        </>
                      )}

                      {selectedCategory === 'LMP2' && (
                        <>
                          <td className="p-4 font-mono text-white">{row.Power}</td>
                          <td className="p-4 font-mono text-gray-400">{row.MaxRPM} rpm</td>
                          <td className="p-4 font-bold text-gray-300">{row.BaseAeroPackage}</td>
                          <td className="p-4 font-mono text-[#3a86ff]">{row.FuelTankCapacity} L</td>
                        </>
                      )}

                      {selectedCategory === 'LMP3' && (
                        <>
                          <td className="p-4 font-bold text-gray-300">{row.FrontDivePlane || '--'}</td>
                          <td className="p-4 font-bold text-gray-300">{row.EngineCoverGurney || '--'}</td>
                        </>
                      )}

                      {selectedCategory === 'LMGTE' && (
                        <>
                          <td className="p-4 font-mono text-[#3a86ff]">{row.FuelTankCapacity} L</td>
                          <td className="p-4 font-mono text-gray-400">{row.RefuelRate} L/s</td>
                          <td className="p-4 font-bold text-gray-300">{row.AeroPackage}</td>
                        </>
                      )}

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}