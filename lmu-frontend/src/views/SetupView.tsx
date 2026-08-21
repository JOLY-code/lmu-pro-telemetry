import React, { useState } from 'react';
import { 
  Settings, 
  ArrowBigRight, 
  Info, 
  AlertTriangle, 
  Activity, 
  CheckCircle2,
  Zap 
} from 'lucide-react';

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

export default SetupView;