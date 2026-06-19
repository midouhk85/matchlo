/**
 * MATCHLO — données de référence (wilayas, langues, types d'événements…).
 * Utilisées par l'onboarding et les filtres. DZD = devise.
 */

// 48 wilayas d'Algérie (liste abrégée des plus courantes en tête)
export const WILAYAS = [
  'Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Sétif', 'Tizi Ouzou',
  'Béjaïa', 'Tlemcen', 'Batna', 'Djelfa', 'Boumerdès', 'Skikda', 'Tipaza',
  'Mostaganem', 'Ouargla', 'Béchar', 'Ghardaïa', 'Adrar', 'Tamanrasset',
  'Biskra', 'Chlef', 'Médéa', 'Mascara', 'Sidi Bel Abbès', 'Guelma',
  'Jijel', 'Bouira', 'Relizane', 'Tiaret', 'Khenchela', 'El Oued',
] as const;

export const LANGUAGES = ['Français', 'Arabe', 'Anglais', 'Tamazight', 'Espagnol'] as const;

export const EVENT_TYPES = [
  'Salon', 'Conférence', 'Concert', 'Soirée', 'Corporate', 'Sport',
  'Mariage', 'Lancement produit', 'Foire',
] as const;

export const GENDERS = ['F', 'M', 'Autre'] as const;

export const AVAILABILITY = ['Semaine', 'Week-end', 'Soirée', 'Flexible'] as const;

export const SECTORS = [
  'Événementiel', 'Marketing', 'Salons & Foires', 'Mode', 'Automobile',
  'Télécom', 'Banque', 'Agroalimentaire', 'Cosmétique', 'Autre',
] as const;

// Rayons proposés pour le filtre géographique (en km)
export const RADIUS_OPTIONS = [10, 25, 50, 100] as const;

// Dégradés repérés sur les maquettes (avatars/cartes/écran match)
export const GRADIENTS: [string, string][] = [
  ['#5B8DEF', '#3FD0C9'], // bleu-teal
  ['#FF9A6B', '#FFC371'], // pêche
  ['#E96FE3', '#F3A6E8'], // rose-magenta
  ['#34D399', '#3FD0C9'], // vert-teal
  ['#7C5CFF', '#E96FE3'], // violet-rose (fond swipe immersif)
];

// Choisit un dégradé déterministe à partir d'un identifiant (avatar sans photo)
export function gradientFor(id: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

// Formatage DZD
export function formatDZD(amount?: number | null): string {
  if (amount == null) return '—';
  return `${amount.toLocaleString('fr-DZ')} DA`;
}
