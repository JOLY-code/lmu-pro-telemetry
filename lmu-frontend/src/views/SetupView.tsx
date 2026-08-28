import React, { useState } from 'react';
import { CountryFlag } from '../lmu_constants';
import { 
  Settings, 
  ArrowBigRight, 
  Info, 
  AlertTriangle, 
  Activity, 
  CheckCircle2,
  Zap,
  MapPin,
  CarFront,
  Wrench,
  Lock
} from 'lucide-react';

// --- COMPOSANT VUE SETUPS (Prêt pour la vraie Data DuckDB & Python) ---
const SetupView = ({ currentSetup, aiReport, sessionInfo }: any) => {
  const [activeCategory, setActiveCategory] = useState('POWERTRAIN');
  const [selectedParam, setSelectedParam] = useState<any | null>(null);
  const [showCompared, setShowCompared] = useState(true);

  const categories = ['POWERTRAIN', 'WHEELS & BRAKES', 'SUSPENSION', 'DAMPERS', 'CHASSIS & AERO'];

  const isFixed = sessionInfo?.IsFixedSetup === 1 || sessionInfo?.IsFixedSetup === true;

  // On mappe l'architecture de Le Mans Ultimate avec l'info inCar
  const getParam = (section: string, key: string, name: string, info: string, advice: string = "", inCar: boolean = false) => {
    // Si Fixed Setup ET que le paramètre ne peut pas se régler au volant = Verrouillé
    const isLocked = isFixed && !inCar;
    
    if (!currentSetup || !currentSetup[section] || currentSetup[section][key] === undefined) {
      return { name, old: '--', new: '--', status: 'same', info, advice, isLocked };
    }
    
    const newVal = currentSetup[section][key];
    
    return { 
      name, 
      old: 'Loaded',
      new: newVal, 
      status: 'changed',
      info, 
      advice,
      isLocked
    };
  };

  const setupData: any = {
    'POWERTRAIN': {
      'ENGINE': [
        getParam('ENGINE', 'VirtualEnergySetting', 'Virtual Energy', "Allocation d'énergie (Limité selon catégorie)."),
        getParam('ENGINE', 'StartingFuelSetting', 'Starting Fuel', "Carburant embarqué au départ."),
        getParam('ENGINE', 'RevLimiterSetting', 'Rev Limiter', "Régime maximal du moteur."),
        getParam('ENGINE', 'EngineMixtureSetting', 'Engine Mixture', "Cartographie moteur (Puissance vs Conso)."),
        getParam('BODYAERO', 'WaterRadiatorSetting', 'Water radiator cover', "Refroidissement eau (Traînée aéro vs Température)."),
        getParam('BODYAERO', 'OilRadiatorSetting', 'Oil radiator cover', "Refroidissement huile."),
      ],
      'ELECTRONICS': [
        getParam('CONTROLS', 'TCSetting', 'Onboard TC', "Niveau d'intervention global du Traction Control."),
        getParam('CONTROLS', 'TCCutSetting', 'TC Power Cut', "Intensité de la coupure d'allumage du TC."),
        getParam('CONTROLS', 'TCSlipAngleSetting', 'TC Slip Angle', "Angle de glissement toléré avant coupure."),
        getParam('ENGINE', 'RegenLevelSetting', 'Regen level', "Puissance de régénération au freinage (MGU/Hybride)."),
        getParam('ENGINE', 'ElectricMotorMapSetting', 'Electric motor map', "Déploiement de la puissance électrique (Hybride)."),
      ],
      'DIFFERENTIAL': [
        getParam('DRIVELINE', 'DiffPowerSetting', 'Power', "Verrouillage du différentiel arrière à l'accélération."),
        getParam('DRIVELINE', 'DiffCoastSetting', 'Coast', "Verrouillage du différentiel arrière au freinage."),
        getParam('DRIVELINE', 'DiffPreloadSetting', 'Preload', "Précharge statique arrière (Résistance de base)."),
        getParam('DRIVELINE', 'FrontDiffPowerSetting', 'Front Power', "Accélération - Différentiel Avant (AWD Hybride)."),
        getParam('DRIVELINE', 'FrontDiffCoastSetting', 'Front Coast', "Freinage - Différentiel Avant (AWD Hybride)."),
        getParam('DRIVELINE', 'FrontDiffPreloadSetting', 'Front Preload', "Précharge statique avant (AWD Hybride)."),
      ],
      'GEARING': [
        getParam('DRIVELINE', 'FinalDriveSetting', 'Ratio Set', "Étagement global de la boîte de vitesses."),
      ]
    },
    'WHEELS & BRAKES': {
      'FRONT WHEELS': [
        getParam('FRONTLEFT', 'TireCompoundSetting', 'Compound', "Type de gomme utilisée à l'avant."),
        getParam('FRONTLEFT', 'PressureSetting', 'Tyre pressure', "Pression à froid (S'applique à G/D)."),
        getParam('FRONTLEFT', 'CamberSetting', 'Camber', "Angle de carrossage vertical avant."),
        getParam('FRONTLEFT', 'BrakeDiscSetting', 'Brake disc', "Épaisseur du disque de frein avant."),
      ],
      'REAR WHEELS': [
        getParam('REARLEFT', 'TireCompoundSetting', 'Compound', "Type de gomme utilisée à l'arrière."),
        getParam('REARLEFT', 'PressureSetting', 'Tyre pressure', "Pression à froid (S'applique à G/D)."),
        getParam('REARLEFT', 'CamberSetting', 'Camber', "Angle de carrossage vertical arrière."),
        getParam('REARLEFT', 'BrakeDiscSetting', 'Brake disc', "Épaisseur du disque de frein arrière."),
      ],
      'BRAKES': [
        getParam('CONTROLS', 'RearBrakeSetting', 'Brake bias', "Répartition du freinage vers l'arrière.", "", true),
        getParam('CONTROLS', 'BrakeMigrationSetting', 'Brake Migration', "Déplacement dynamique du freinage (Hybrides).", "", true),
        getParam('CONTROLS', 'BrakePressureSetting', 'Max pedal force', "Pression maximale appliquée sur les freins.", "", true),
        getParam('FRONTLEFT', 'BrakeDuctSetting', 'Front brake duct blanking', "Refroidissement freins avant (Baisse la température, augmente la traînée)."),
        getParam('REARLEFT', 'BrakeDuctSetting', 'Rear brake duct blanking', "Refroidissement freins arrière."),
        getParam('CONTROLS', 'ABSSetting', 'Abs', "Niveau d'intervention de l'ABS (Modifiable au volant).", "", true),
      ]
    },
    'SUSPENSION': {
      'FRONT SUSPENSION': [
        getParam('FRONTLEFT', 'SpringSetting', 'Spring rate', "Raideur du ressort principal."),
        getParam('FRONTTHIRD', 'SpringSetting', '3rd Spring rate', "Raideur du 3ème ressort (Heave)."),
        getParam('FRONTLEFT', 'TenderSpringSetting', 'Tender spring rate', "Ressort auxiliaire."),
        getParam('FRONTTHIRD', 'TenderSpringSetting', '3rd Tender spring', "Ressort auxiliaire (Heave)."),
        getParam('FRONTLEFT', 'PackerSetting', 'Packers', "Butées mécaniques."),
        getParam('FRONTTHIRD', 'PackerSetting', '3rd Packers', "Butées mécaniques (Heave)."),
        getParam('FRONTLEFT', 'RideHeightSetting', 'Ride height', "Hauteur de caisse."),
        getParam('FRONTLEFT', 'SpringRubberSetting', 'Spring rubber', "Caoutchouc de réglage de rigidité."),
      ],
      'REAR SUSPENSION': [
        getParam('REARLEFT', 'SpringSetting', 'Spring rate', "Raideur du ressort principal."),
        getParam('REARTHIRD', 'SpringSetting', '3rd Spring rate', "Raideur du 3ème ressort (Heave)."),
        getParam('REARLEFT', 'TenderSpringSetting', 'Tender spring rate', "Ressort auxiliaire."),
        getParam('REARTHIRD', 'TenderSpringSetting', '3rd Tender spring', "Ressort auxiliaire (Heave)."),
        getParam('REARLEFT', 'PackerSetting', 'Packers', "Butées mécaniques."),
        getParam('REARTHIRD', 'PackerSetting', '3rd Packers', "Butées mécaniques (Heave)."),
        getParam('REARLEFT', 'RideHeightSetting', 'Ride height', "Hauteur de caisse."),
        getParam('REARLEFT', 'SpringRubberSetting', 'Spring rubber', "Caoutchouc de réglage de rigidité."),
      ]
    },
    'DAMPERS': {
      'FRONT DAMPERS': [
        getParam('FRONTLEFT', 'SlowBumpSetting', 'Slow bump', "Compression lente."),
        getParam('FRONTTHIRD', 'SlowBumpSetting', 'Slow bump (3rd)', "Compression lente (Heave)."),
        getParam('FRONTLEFT', 'SlowReboundSetting', 'Slow rebound', "Détente lente."),
        getParam('FRONTTHIRD', 'SlowReboundSetting', 'Slow rebound (3rd)', "Détente lente (Heave)."),
        getParam('FRONTLEFT', 'FastBumpSetting', 'Fast bump', "Compression rapide."),
        getParam('FRONTTHIRD', 'FastBumpSetting', 'Fast bump (3rd)', "Compression rapide (Heave)."),
        getParam('FRONTLEFT', 'FastReboundSetting', 'Fast rebound', "Détente rapide."),
        getParam('FRONTTHIRD', 'FastReboundSetting', 'Fast rebound (3rd)', "Détente rapide (Heave)."),
      ],
      'REAR DAMPERS': [
        getParam('REARLEFT', 'SlowBumpSetting', 'Slow bump', "Compression lente."),
        getParam('REARTHIRD', 'SlowBumpSetting', 'Slow bump (3rd)', "Compression lente (Heave)."),
        getParam('REARLEFT', 'SlowReboundSetting', 'Slow rebound', "Détente lente."),
        getParam('REARTHIRD', 'SlowReboundSetting', 'Slow rebound (3rd)', "Détente lente (Heave)."),
        getParam('REARLEFT', 'FastBumpSetting', 'Fast bump', "Compression rapide."),
        getParam('REARTHIRD', 'FastBumpSetting', 'Fast bump (3rd)', "Compression rapide (Heave)."),
        getParam('REARLEFT', 'FastReboundSetting', 'Fast rebound', "Détente rapide."),
        getParam('REARTHIRD', 'FastReboundSetting', 'Fast rebound (3rd)', "Détente rapide (Heave)."),
      ]
    },
    'CHASSIS & AERO': {
      'FRONT CHASSIS': [
        // Le Caster a une structure spéciale L/R, on le signale avec isCaster: true
        { isCaster: true, name: 'Caster', pl: getParam('FRONTLEFT', 'CasterSetting', 'Caster', "Chasse avant gauche."), pr: getParam('FRONTRIGHT', 'CasterSetting', 'Caster', "Chasse avant droite.") },
        getParam('SUSPENSION', 'FrontToeInSetting', 'Toe-in', "Parallélisme (Pincement/Ouverture)."),
        getParam('SUSPENSION', 'FrontAntiSwaySetting', 'Arb size & position', "Barre anti-roulis avant."),
        getParam('SUSPENSION', 'FrontWheelTrackSetting', 'Front wheel track', "Voie avant."),
        getParam('CONTROLS', 'SteeringWheelRangeSetting', 'Wheel range (lock)', "Angle maximum du volant."),
        getParam('BODYAERO', 'FrontSplitterSetting', 'Splitter', "Appui aérodynamique avant."),
      ],
      'REAR CHASSIS': [
        getParam('SUSPENSION', 'RearToeInSetting', 'Toe-in', "Pincement arrière."),
        getParam('SUSPENSION', 'RearAntiSwaySetting', 'Arb size & position', "Barre anti-roulis arrière."),
        getParam('SUSPENSION', 'RearWheelTrackSetting', 'Rear wheel track', "Voie arrière."),
        getParam('REARWING', 'RWSetting', 'Rear wing', "Aileron arrière."),
      ],
      'WEIGHT': [
        getParam('WEIGHT', 'VerticalSetting', 'Vertical', "Répartition verticale du poids."),
        getParam('WEIGHT', 'LateralSetting', 'Lateral', "Répartition latérale du poids."),
        getParam('WEIGHT', 'WeightDistributionSetting', 'Weight distribution', "Répartition globale des masses."),
      ],
      'ADVANCED CHASSIS': [
        getParam('SUSPENSION', 'FrontPickupSetting', 'Front pickup', "Points d'ancrage avant."),
        getParam('SUSPENSION', 'RearPickupSetting', 'Rear pickup', "Points d'ancrage arrière."),
        getParam('SUSPENSION', 'ChassisAdj2Setting', 'Chassis adjustment 2', "Réglage châssis avancé 2."),
        getParam('SUSPENSION', 'ChassisAdj3Setting', 'Chassis adjustment 3', "Réglage châssis avancé 3."),
      ]
    }
  };

  // Fonction magique pour dessiner les deltas (Ancienne valeur -> Nouvelle) sans casser le design LMU
  const renderValue = (param: any, justify = "justify-center") => {
    if (!param) return <span className="text-gray-700 text-xs">-</span>;
    return (
      <div className={`flex items-center gap-2 ${justify}`}>
        {/* L'ancienne valeur s'affiche SEULEMENT si ça a changé ET que la case "Compared Setup" est cochée */}
        {showCompared && param.status === 'changed' && (
          <div className="flex items-center gap-1 bg-[#212332] px-2 py-0.5 rounded border border-gray-700 opacity-80">
            <span className="text-gray-500 font-mono text-[10px] line-through">{param.old}</span>
            <ArrowBigRight className="text-[#2a9d5c]" size="{10}"/>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className={`font-mono text-xs bg-[#181924] px-3 py-1 rounded border ${param.status === 'changed' ? 'text-[#2a9d5c] border-[#2a9d5c]/50 shadow-[0_0_8px_rgba(42,157,92,0.2)]' : 'text-[#a0a3b5] border-gray-800'}`}>
            {param.new}
          </span>
          {param.isLocked && <Lock className="text-gray-600" size="{12}"/>}
        </div>
      </div>
    );
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
            <button 
              onClick={() => {
                fetch(`http://127.0.0.1:8000/api/setups/apply?track=${sessionInfo?.TrackName || 'Unknown'}`)
                  .then(() => alert('Setup appliqué et sauvegardé dans le dossier de Le Mans Ultimate !'))
              }}
              className="bg-[#3a86ff] text-white px-4 py-2 rounded text-xs font-bold shadow-[0_0_15px_rgba(58,134,255,0.4)] hover:bg-blue-500 transition-colors"
            >
              APPLY TO CAR
            </button>
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
          <label className="flex items-center gap-2 text-white text-xs font-bold cursor-pointer hover:text-[#3a86ff] transition-colors">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded bg-gray-900 border-gray-700 text-[#3a86ff] focus:ring-[#3a86ff] focus:ring-offset-gray-900" />
            Current setup
          </label>
          <label className={`flex items-center gap-2 text-xs font-bold cursor-pointer transition-colors ${showCompared ? 'text-white' : 'text-[#a0a3b5]'}`}>
            <input 
              type="checkbox" 
              checked={showCompared}
              onChange={(e) => setShowCompared(e.target.checked)}
              className="w-4 h-4 rounded bg-gray-900 border-gray-700 text-[#3a86ff] focus:ring-[#3a86ff] focus:ring-offset-gray-900" 
            />
            Compared setup
          </label>
        </div>

        {/* Liste des Paramètres (Style MyLMU exact) */}
        <div className="flex-1 bg-[#121318] border border-gray-800/50 rounded-lg shadow-lg overflow-hidden flex flex-col relative">
          <div className="flex-1 overflow-y-auto p-6 space-y-10 scrollbar-hide">
            
            {activeCategory === 'WHEELS & BRAKES' ? (
              <div className="flex flex-col gap-10">
                {/* --- FRONT WHEELS --- */}
                <div className="flex flex-col">
                  <div className="flex justify-between items-end mb-2 px-2">
                    <span className="w-1/4 text-gray-400 text-lg font-black tracking-widest uppercase">FRONT WHEELS</span>
                    <span className="w-1/4 text-center text-gray-500 text-[10px] font-bold tracking-widest uppercase">LEFT</span>
                    <span className="w-1/4 text-center text-gray-500 text-[10px] font-bold tracking-widest uppercase">READINGS</span>
                    <span className="w-1/4 text-center text-gray-500 text-[10px] font-bold tracking-widest uppercase">RIGHT</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {[
                      { t: 'Compound', pl: getParam('FRONTLEFT', 'TireCompoundSetting', 'Compound', "Gomme avant G."), pr: getParam('FRONTRIGHT', 'TireCompoundSetting', 'Compound', "Gomme avant D."), rl: '-- N', rr: '-- N', rLab: 'Load' },
                      { t: 'Tyre pressure', pl: getParam('FRONTLEFT', 'PressureSetting', 'Tyre pressure', "Pression (G)."), pr: getParam('FRONTRIGHT', 'PressureSetting', 'Tyre pressure', "Pression (D)."), rl: '-- kPa', rr: '-- kPa', rLab: 'Pressure' },
                      { t: 'Camber', pl: getParam('FRONTLEFT', 'CamberSetting', 'Camber', "Carrossage."), pr: getParam('FRONTRIGHT', 'CamberSetting', 'Camber', "Carrossage."), rl: 'out mid in', rr: 'in mid out', rLab: 'Temperatures' },
                      { t: 'Brake disc', pl: getParam('FRONTLEFT', 'BrakeDiscSetting', 'Brake disc', "Disque de frein."), pr: getParam('FRONTRIGHT', 'BrakeDiscSetting', 'Brake disc', "Disque de frein."), rl: '--', rr: '--', rLab: 'Brake disc' },
                    ].map((row, i) => (
                      <div key={i} className={`flex items-center justify-between py-2.5 px-2 rounded-md transition-colors cursor-pointer ${selectedParam?.name === row.pl.name ? 'bg-[#3a86ff]/10' : 'hover:bg-[#1c1e2b]'}`} onClick={() => setSelectedParam(row.pl)}>
                        <span className="w-1/4 text-gray-300 text-xs font-bold">{row.t}</span>
                        <div className="w-1/4 flex justify-center">{renderValue(row.pl, "justify-center")}</div>
                        <div className="w-1/4 flex flex-col items-center justify-center border-x border-gray-800/50 px-2 opacity-60">
                           <div className="flex justify-between w-full text-[9px] font-bold text-gray-400 mb-0.5 px-4"><span>{row.rl}</span><span>{row.rr}</span></div>
                           <span className="text-[8px] text-gray-600 tracking-widest uppercase">{row.rLab}</span>
                        </div>
                        <div className="w-1/4 flex justify-center">{renderValue(row.pr, "justify-center")}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* --- REAR WHEELS --- */}
                <div className="flex flex-col">
                  <div className="flex justify-between items-end mb-2 px-2">
                    <span className="w-1/4 text-gray-400 text-lg font-black tracking-widest uppercase">REAR WHEELS</span>
                    <span className="w-1/4 text-center text-gray-500 text-[10px] font-bold tracking-widest uppercase">LEFT</span>
                    <span className="w-1/4 text-center text-gray-500 text-[10px] font-bold tracking-widest uppercase">READINGS</span>
                    <span className="w-1/4 text-center text-gray-500 text-[10px] font-bold tracking-widest uppercase">RIGHT</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {[
                      { t: 'Compound', pl: getParam('REARLEFT', 'TireCompoundSetting', 'Compound', "Gomme arrière G."), pr: getParam('REARRIGHT', 'TireCompoundSetting', 'Compound', "Gomme arrière D."), rl: '-- N', rr: '-- N', rLab: 'Load' },
                      { t: 'Tyre pressure', pl: getParam('REARLEFT', 'PressureSetting', 'Tyre pressure', "Pression (G)."), pr: getParam('REARRIGHT', 'PressureSetting', 'Tyre pressure', "Pression (D)."), rl: '-- kPa', rr: '-- kPa', rLab: 'Pressure' },
                      { t: 'Camber', pl: getParam('REARLEFT', 'CamberSetting', 'Camber', "Carrossage."), pr: getParam('REARRIGHT', 'CamberSetting', 'Camber', "Carrossage."), rl: 'out mid in', rr: 'in mid out', rLab: 'Temperatures' },
                      { t: 'Brake disc', pl: getParam('REARLEFT', 'BrakeDiscSetting', 'Brake disc', "Disque de frein."), pr: getParam('REARRIGHT', 'BrakeDiscSetting', 'Brake disc', "Disque de frein."), rl: '--', rr: '--', rLab: 'Brake disc' },
                    ].map((row, i) => (
                      <div key={i} className={`flex items-center justify-between py-2.5 px-2 rounded-md transition-colors cursor-pointer ${selectedParam?.name === row.pl.name ? 'bg-[#3a86ff]/10' : 'hover:bg-[#1c1e2b]'}`} onClick={() => setSelectedParam(row.pl)}>
                        <span className="w-1/4 text-gray-300 text-xs font-bold">{row.t}</span>
                        <div className="w-1/4 flex justify-center">{renderValue(row.pl, "justify-center")}</div>
                        <div className="w-1/4 flex flex-col items-center justify-center border-x border-gray-800/50 px-2 opacity-60">
                           <div className="flex justify-between w-full text-[9px] font-bold text-gray-400 mb-0.5 px-4"><span>{row.rl}</span><span>{row.rr}</span></div>
                           <span className="text-[8px] text-gray-600 tracking-widest uppercase">{row.rLab}</span>
                        </div>
                        <div className="w-1/4 flex justify-center">{renderValue(row.pr, "justify-center")}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* --- BRAKES (2 Colonnes) --- */}
                <div className="flex flex-col">
                  <div className="mb-3 px-2">
                    <span className="text-gray-400 text-lg font-black tracking-widest uppercase">BRAKES</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-1">
                    {[
                      getParam('CONTROLS', 'RearBrakeSetting', 'Brake bias', "Répartition du freinage.", "", true),
                      getParam('FRONTLEFT', 'BrakeDuctSetting', 'Front brake duct blanking', "Refroidissement freins avant."),
                      getParam('CONTROLS', 'BrakeMigrationSetting', 'Brake Migration', "Déplacement dynamique du freinage.", "", true),
                      getParam('REARLEFT', 'BrakeDuctSetting', 'Rear brake duct blanking', "Refroidissement freins arrière."),
                      getParam('CONTROLS', 'BrakePressureSetting', 'Max pedal force', "Pression maximale.", "", true),
                      getParam('CONTROLS', 'ABSSetting', 'Abs', "Intervention de l'ABS.", "", true)
                    ].map((param: any, i: number) => (
                      <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-md transition-colors cursor-pointer ${selectedParam?.name === param.name ? 'bg-[#3a86ff]/10' : 'hover:bg-[#1c1e2b]'}`} onClick={() => setSelectedParam(param)}>
                        <span className="text-gray-300 text-xs font-bold">{param.name}</span>
                        {renderValue(param, "justify-end")}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            ) : activeCategory === 'SUSPENSION' ? (
              
              <div className="flex flex-col gap-10">
                {['FRONT SUSPENSION', 'REAR SUSPENSION'].map((subCat) => {
                  const prefix = subCat === 'FRONT SUSPENSION' ? 'FRONT' : 'REAR';
                  return (
                    <div key={subCat} className="flex flex-col">
                      <div className="flex justify-between items-end mb-2 px-2">
                        <span className="w-1/4 text-gray-400 text-lg font-black tracking-widest uppercase">{subCat}</span>
                        <span className="w-1/4 text-center text-gray-500 text-[10px] font-bold tracking-widest uppercase">LEFT</span>
                        <span className="w-1/4 text-center text-gray-500 text-[10px] font-bold tracking-widest uppercase">3RD SPRING</span>
                        <span className="w-1/4 text-center text-gray-500 text-[10px] font-bold tracking-widest uppercase">RIGHT</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {[
                          { t: 'Spring rate', pl: getParam(`${prefix}LEFT`, 'SpringSetting', 'Spring rate', "Ressort principal."), pm: getParam(`${prefix}THIRD`, 'SpringSetting', 'Spring rate (3rd)', "3ème ressort (Heave)."), pr: getParam(`${prefix}RIGHT`, 'SpringSetting', 'Spring rate', "Ressort principal.") },
                          { t: 'Tender spring rate', pl: getParam(`${prefix}LEFT`, 'TenderSpringSetting', 'Tender spring rate', "Ressort auxiliaire."), pm: getParam(`${prefix}THIRD`, 'TenderSpringSetting', 'Tender spring rate (3rd)', "Ressort auxiliaire."), pr: getParam(`${prefix}RIGHT`, 'TenderSpringSetting', 'Tender spring rate', "Ressort auxiliaire.") },
                          { t: 'Packers', pl: getParam(`${prefix}LEFT`, 'PackerSetting', 'Packers', "Butées mécaniques."), pm: getParam(`${prefix}THIRD`, 'PackerSetting', 'Packers (3rd)', "Butées mécaniques."), pr: getParam(`${prefix}RIGHT`, 'PackerSetting', 'Packers', "Butées mécaniques.") },
                          { t: 'Ride height', pl: getParam(`${prefix}LEFT`, 'RideHeightSetting', 'Ride height', "Hauteur de caisse."), pm: null, pr: getParam(`${prefix}RIGHT`, 'RideHeightSetting', 'Ride height', "Hauteur de caisse.") },
                          { t: 'Spring rubber', pl: getParam(`${prefix}LEFT`, 'SpringRubberSetting', 'Spring rubber', "Caoutchouc de rigidité."), pm: null, pr: getParam(`${prefix}RIGHT`, 'SpringRubberSetting', 'Spring rubber', "Caoutchouc de rigidité.") },
                        ].map((row, i) => (
                          <div key={i} className={`flex items-center justify-between py-2.5 px-2 rounded-md transition-colors cursor-pointer ${selectedParam?.name === row.pl.name ? 'bg-[#3a86ff]/10' : 'hover:bg-[#1c1e2b]'}`} onClick={() => setSelectedParam(row.pl)}>
                            <span className="w-1/4 text-gray-300 text-xs font-bold">{row.t}</span>
                            <div className="w-1/4 flex justify-center">{renderValue(row.pl, "justify-center")}</div>
                            <div className="w-1/4 flex flex-col items-center justify-center border-x border-gray-800/50 px-2">
                              {row.pm ? renderValue(row.pm, "justify-center") : <span className="text-gray-700 text-xs">-</span>}
                            </div>
                            <div className="w-1/4 flex justify-center">{renderValue(row.pr, "justify-center")}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

            ) : activeCategory === 'DAMPERS' ? (
              
              <div className="flex flex-col gap-10">
                {['FRONT DAMPERS', 'REAR DAMPERS'].map((subCat) => {
                  const prefix = subCat === 'FRONT DAMPERS' ? 'FRONT' : 'REAR';
                  // LMU affiche "FRONT SUSPENSION" en titre même dans l'onglet Dampers
                  const title = subCat === 'FRONT DAMPERS' ? 'FRONT SUSPENSION' : 'REAR SUSPENSION';
                  
                  return (
                    <div key={subCat} className="flex flex-col">
                      <div className="flex justify-between items-end mb-2 px-2">
                        <span className="w-1/4 text-gray-400 text-lg font-black tracking-widest uppercase">{title}</span>
                        <span className="w-1/4 text-center text-gray-500 text-[10px] font-bold tracking-widest uppercase">LEFT</span>
                        <span className="w-1/4 text-center text-gray-500 text-[10px] font-bold tracking-widest uppercase">3RD SPRING</span>
                        <span className="w-1/4 text-center text-gray-500 text-[10px] font-bold tracking-widest uppercase">RIGHT</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {[
                          { t: 'Slow bump', pl: getParam(`${prefix}LEFT`, 'SlowBumpSetting', 'Slow bump', "Compression lente."), pm: getParam(`${prefix}THIRD`, 'SlowBumpSetting', 'Slow bump (3rd)', "Compression lente (Heave)."), pr: getParam(`${prefix}RIGHT`, 'SlowBumpSetting', 'Slow bump', "Compression lente.") },
                          { t: 'Slow rebound', pl: getParam(`${prefix}LEFT`, 'SlowReboundSetting', 'Slow rebound', "Détente lente."), pm: getParam(`${prefix}THIRD`, 'SlowReboundSetting', 'Slow rebound (3rd)', "Détente lente (Heave)."), pr: getParam(`${prefix}RIGHT`, 'SlowReboundSetting', 'Slow rebound', "Détente lente.") },
                          { t: 'Fast bump', pl: getParam(`${prefix}LEFT`, 'FastBumpSetting', 'Fast bump', "Compression rapide."), pm: getParam(`${prefix}THIRD`, 'FastBumpSetting', 'Fast bump (3rd)', "Compression rapide (Heave)."), pr: getParam(`${prefix}RIGHT`, 'FastBumpSetting', 'Fast bump', "Compression rapide.") },
                          { t: 'Fast rebound', pl: getParam(`${prefix}LEFT`, 'FastReboundSetting', 'Fast rebound', "Détente rapide."), pm: getParam(`${prefix}THIRD`, 'FastReboundSetting', 'Fast rebound (3rd)', "Détente rapide (Heave)."), pr: getParam(`${prefix}RIGHT`, 'FastReboundSetting', 'Fast rebound', "Détente rapide.") },
                        ].map((row, i) => (
                          <div key={i} className={`flex items-center justify-between py-2.5 px-2 rounded-md transition-colors cursor-pointer ${selectedParam?.name === row.pl.name ? 'bg-[#3a86ff]/10' : 'hover:bg-[#1c1e2b]'}`} onClick={() => setSelectedParam(row.pl)}>
                            <span className="w-1/4 text-gray-300 text-xs font-bold">{row.t}</span>
                            <div className="w-1/4 flex justify-center">{renderValue(row.pl, "justify-center")}</div>
                            <div className="w-1/4 flex flex-col items-center justify-center border-x border-gray-800/50 px-2">
                              {renderValue(row.pm, "justify-center")}
                            </div>
                            <div className="w-1/4 flex justify-center">{renderValue(row.pr, "justify-center")}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

            ) : activeCategory === 'CHASSIS & AERO' ? (
              
              <div className="grid grid-cols-2 gap-x-12 gap-y-10 items-start h-full">
                {/* --- Colonne GAUCHE (CHASSIS) --- */}
                <div className="flex flex-col gap-10">
                  {/* FRONT CHASSIS */}
                  <div className="flex flex-col">
                    <div className="flex justify-between items-end mb-2 px-2">
                      <span className="w-1/3 text-gray-400 text-lg font-black tracking-widest uppercase">FRONT CHASSIS</span>
                      <span className="w-1/3 text-center text-gray-500 text-[10px] font-bold tracking-widest uppercase">LEFT</span>
                      <span className="w-1/3 text-center text-gray-500 text-[10px] font-bold tracking-widest uppercase">RIGHT</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {setupData['CHASSIS & AERO']['FRONT CHASSIS'].map((param: any, idx: number) => {
                        if (param.isCaster) {
                          return (
                            <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-md transition-colors hover:bg-[#1c1e2b]">
                              <span className="w-1/3 text-gray-300 text-xs font-bold">{param.name}</span>
                              <div className="w-1/3 flex justify-center" onClick={() => setSelectedParam(param.pl)}>{renderValue(param.pl, "justify-center")}</div>
                              <div className="w-1/3 flex justify-center" onClick={() => setSelectedParam(param.pr)}>{renderValue(param.pr, "justify-center")}</div>
                            </div>
                          );
                        }
                        return (
                          <div key={idx} onClick={() => setSelectedParam(param)} className={`flex items-center justify-between py-2 px-3 rounded-md transition-colors cursor-pointer ${selectedParam?.name === param.name ? 'bg-[#3a86ff]/10' : 'hover:bg-[#1c1e2b]'} ${param.isLocked ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                            <span className="text-gray-300 text-xs font-bold">{param.name}</span>
                            {renderValue(param, "justify-end")}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* REAR CHASSIS */}
                  <div className="flex flex-col">
                    <h3 className="text-gray-400 text-lg font-black tracking-widest uppercase mb-3 px-2">REAR CHASSIS</h3>
                    <div className="flex flex-col gap-1">
                      {setupData['CHASSIS & AERO']['REAR CHASSIS'].map((param: any, idx: number) => (
                        <div key={idx} onClick={() => setSelectedParam(param)} className={`flex items-center justify-between py-2 px-3 rounded-md transition-colors cursor-pointer ${selectedParam?.name === param.name ? 'bg-[#3a86ff]/10' : 'hover:bg-[#1c1e2b]'} ${param.isLocked ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                          <span className="text-gray-300 text-xs font-bold">{param.name}</span>
                          {renderValue(param, "justify-end")}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* --- Colonne DROITE (CHASSIS) --- */}
                <div className="flex flex-col gap-10">
                  {/* WEIGHT */}
                  <div className="flex flex-col">
                    <h3 className="text-gray-400 text-lg font-black tracking-widest uppercase mb-3 px-2">WEIGHT</h3>
                    <div className="flex flex-col gap-1">
                      {setupData['CHASSIS & AERO']['WEIGHT'].map((param: any, idx: number) => (
                        <div key={idx} onClick={() => setSelectedParam(param)} className={`flex items-center justify-between py-2 px-3 rounded-md transition-colors cursor-pointer ${selectedParam?.name === param.name ? 'bg-[#3a86ff]/10' : 'hover:bg-[#1c1e2b]'} ${param.isLocked ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                          <span className="text-gray-300 text-xs font-bold">{param.name}</span>
                          {renderValue(param, "justify-end")}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ADVANCED CHASSIS */}
                  <div className="flex flex-col">
                    <h3 className="text-gray-400 text-lg font-black tracking-widest uppercase mb-3 px-2">ADVANCED CHASSIS</h3>
                    <div className="flex flex-col gap-1">
                      {setupData['CHASSIS & AERO']['ADVANCED CHASSIS'].map((param: any, idx: number) => (
                        <div key={idx} onClick={() => setSelectedParam(param)} className={`flex items-center justify-between py-2 px-3 rounded-md transition-colors cursor-pointer ${selectedParam?.name === param.name ? 'bg-[#3a86ff]/10' : 'hover:bg-[#1c1e2b]'} ${param.isLocked ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                          <span className="text-gray-300 text-xs font-bold">{param.name}</span>
                          {renderValue(param, "justify-end")}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            ) : (
              
              <div className="grid grid-cols-2 gap-x-12 gap-y-10 items-start h-full">
                {/* --- LAYOUT À 2 COLONNES POUR POWERTRAIN --- */}
                <div className="flex flex-col gap-10">
                  {['ENGINE', 'ELECTRONICS'].map((subCat) => {
                    const params = setupData['POWERTRAIN']?.[subCat];
                    if (!params) return null;
                    return (
                      <div key={subCat} className="flex flex-col">
                        <h3 className="text-gray-400 text-lg font-black tracking-widest uppercase mb-3 px-2">{subCat}</h3>
                        <div className="flex flex-col gap-1">
                          {params.map((param: any, idx: number) => (
                            <div key={idx} onClick={() => setSelectedParam(param)} className={`flex items-center justify-between py-2 px-3 rounded-md transition-colors cursor-pointer ${selectedParam?.name === param.name ? 'bg-[#3a86ff]/10' : 'hover:bg-[#1c1e2b]'} ${param.isLocked ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                              <span className="text-gray-300 text-xs font-bold">{param.name}</span>
                              {renderValue(param, "justify-end")}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* --- Colonne DROITE (POWERTRAIN UNIQUEMENT) --- */}
                <div className="flex flex-col gap-10">
                  {['DIFFERENTIAL', 'GEARING'].map((subCat) => {
                    const params = setupData['POWERTRAIN']?.[subCat];
                    if (!params) return null;
                    return (
                      <div key={subCat} className="flex flex-col">
                        <h3 className="text-gray-400 text-lg font-black tracking-widest uppercase mb-3 px-2">{subCat}</h3>
                        <div className="flex flex-col gap-1">
                          {params.map((param: any, idx: number) => {
                            const isFrontDiff = subCat === 'DIFFERENTIAL' && (sessionInfo?.VehicleClass?.includes('GT') || sessionInfo?.VehicleClass?.includes('LMP2'));
                            if (isFrontDiff && param.name.includes('Front')) return null;
                            return (
                              <div key={idx} onClick={() => setSelectedParam(param)} className={`flex items-center justify-between py-2 px-3 rounded-md transition-colors cursor-pointer ${selectedParam?.name === param.name ? 'bg-[#3a86ff]/10' : 'hover:bg-[#1c1e2b]'} ${param.isLocked ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                <span className="text-gray-300 text-xs font-bold">{param.name}</span>
                                {renderValue(param, "justify-end")}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
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

          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-6 relative z-10 scrollbar-hide">
            
            {/* EN-TÊTE CONTEXTE SESSION */}
            <div className="bg-[#0a0a0f] border border-gray-800 p-4 rounded-lg flex flex-col gap-2 shadow-inner">
               <div className="flex items-center gap-3">
                 <MapPin size={14} className="text-gray-500" />
                 <span className="text-white text-xs font-bold">{sessionInfo ? sessionInfo.TrackName : 'Awaiting Track Data'}</span>
               </div>
               <div className="flex items-center gap-3">
                 <CarFront size={14} className="text-gray-500" />
                 <span className="text-white text-xs font-bold">{sessionInfo ? `${sessionInfo.VehicleName} (${sessionInfo.VehicleClass})` : 'Awaiting Car Data'}</span>
                 {isFixed ? (
                   <span className="ml-auto px-2 py-0.5 bg-red-900/20 border border-red-800 text-red-500 text-[9px] font-black tracking-widest uppercase rounded">Fixed Setup</span>
                 ) : (
                   <span className="ml-auto px-2 py-0.5 bg-green-900/20 border border-green-800 text-green-500 text-[9px] font-black tracking-widest uppercase rounded">Open Setup</span>
                 )}
               </div>
            </div>

            {/* BLOC : RAPPORT DE L'IA */}
            {aiReport && aiReport.length > 0 ? (
              <div className="flex flex-col gap-3 animate-in fade-in duration-300 pb-10">
                <h4 className="text-gray-500 font-bold text-[10px] uppercase tracking-widest border-b border-gray-800/60 pb-2 mb-2">Live AI Analysis</h4>
                {aiReport.map((msg: string, i: number) => {
                  const cleanMsg = msg.replace('[ENGINEER/RADIO] ', '');
                  
                  let Icon = Info;
                  let colorClass = "text-[#3a86ff]";
                  let bgClass = "bg-[#212332] border-gray-800";
                  
                  if (cleanMsg.includes('Diagnostic')) {
                    Icon = Activity;
                    colorClass = "text-[#e9c46a]";
                  } else if (cleanMsg.includes('Action') || cleanMsg.includes('Optimisation') || cleanMsg.includes('Adaptation')) {
                    Icon = Wrench;
                    colorClass = "text-[#2a9d5c]";
                    bgClass = "bg-[#12221b] border-[#10b981]/30";
                  } else if (cleanMsg.includes('ALERTE') || cleanMsg.includes('DANGER') || cleanMsg.includes('⚠️') || cleanMsg.includes('🚨')) {
                    Icon = AlertTriangle;
                    colorClass = "text-[#ef4444]";
                    bgClass = "bg-[#2a1518] border-[#ef4444]/30";
                  }

                  return (
                    <div key={i} className={`p-4 rounded-lg border flex items-start gap-3 shadow-md ${bgClass}`}>
                      <Icon size={16} className={`${colorClass} shrink-0 mt-0.5`} />
                      <p className="text-gray-200 text-xs leading-relaxed font-medium">{cleanMsg}</p>
                    </div>
                  )
                })}
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

export default SetupView;