import React from 'react';

// 1. DÉCLARATION DES TYPES POUR RASSURER TYPESCRIPT
export interface TrackNation { code: string; name: string; }
export interface TrackConfig { name: string; flag: string; }
export interface LmuCar { category: string; brand: string; layout: string; trait: string; weakness: string; }

// 2. LES CONSTANTES TYPÉES
export const TRACK_NATIONS: TrackNation[] = [
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

export const LMU_CARS: Record<string, LmuCar> = {
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

export const LMU_ALL_TRACKS: TrackConfig[] = [
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

export const BRAND_LOGOS: Record<string, string> = {
  'Alpine': '/Logo_constructeur/Alpine.png',
  'BMW': '/Logo_constructeur/BMW.png',
  'Cadillac': '/Logo_constructeur/Cadilac.png',
  'Ferrari': '/Logo_constructeur/Ferrari.png',
  'Isotta Fraschini': '/Logo_constructeur/Isotta Fraschini.png',
  'Lexus': '/Logo_constructeur/Lexus.png',
  'McLaren': '/Logo_constructeur/Mclaren.png',
  'Porsche': '/Logo_constructeur/Porsche.png',
  'Toyota': '/Logo_constructeur/Toyota.png',
  'Genesis': '/Logo_constructeur/Genesis.png',
  'Aston Martin': '/Logo_constructeur/Aston Martin.svg',
  'Chevrolet': '/Logo_constructeur/Corvette.svg',
  'Ford': '/Logo_constructeur/Ford.svg',
  'Ginetta': '/Logo_constructeur/Ginetta.svg',
  'Glickenhaus': '/Logo_constructeur/Glickenhaus.svg',
  'Lamborghini': '/Logo_constructeur/Lamborghini.svg',
  'Ligier': '/Logo_constructeur/LIGIER.svg',
  'Oreca': '/Logo_constructeur/Oreca.svg',
  'Peugeot': '/Logo_constructeur/Peugeot.svg',
  'Vanwall': '/Logo_constructeur/Vanwall.svg',
  'Mercedes-AMG': 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg',
  'Duqueine': 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Duqueine_Engineering_logo.png',
  'Adess': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/ADESS_AG_Logo.png/320px-ADESS_AG_Logo.png'
};

export const getTrackDetails = (trackStr: string) => {
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

export const getTrackCountryCode = (trackName: string) => {
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

export const getClassColor = (cls: string) => {
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

export const isTrackMatch = (sessionTrack: string, targetTrack: string) => {
  if (!sessionTrack || !targetTrack || targetTrack === 'Select track' || targetTrack === 'All') return true;
  const sT = sessionTrack.toLowerCase();
  const tT = targetTrack.toLowerCase();
  return sT.includes(tT) || tT.includes(sT);
};

// Ancienne fonction conservée temporairement en fallback
export const isCarMatch = (sessionCar: string, sessionCarType: string, targetCar: string) => {
  if (!targetCar || targetCar === 'Select car' || targetCar === 'All Categories' || targetCar === 'All') return true;
  const sC = (sessionCar || '').toLowerCase();
  const sT = (sessionCarType || '').toLowerCase(); // Ex: "bmw m4 lmgt3" (du XML)
  const tC = targetCar.toLowerCase();              // Ex: "bmw m4 lmgt3 evo" (du Menu React)
  
  // 1. Le match parfait : On compare directement la balise XML avec ton menu !
  if (sT && (tC.includes(sT) || sT.includes(tC))) return true;
  
  // 2. Sécurité : On vérifie quand même le nom de l'équipe au cas où
  if (sC && (tC.includes(sC) || sC.includes(tC))) return true;

  // 3. Fallbacks de sécurité pour les vieux fichiers XML
  if (tC.includes('499p') && (sC.includes('ferrari') || sC.includes('af corse'))) return true;
  if (tC.includes('963') && (sC.includes('porsche') || sC.includes('penske'))) return true;
  if (tC.includes('rsr') && sC.includes('porsche')) return true;

  return false;
};

export const CountryFlag = ({ code }: { code: string }) => {
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