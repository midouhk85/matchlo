// Packs affichés sur la page facturation (le serveur reste l'autorité sur les prix).
export type Pack = {
  id: string;
  label: string;
  quota_type: "urgent" | "direct_message";
  quota_amount: number;
  amount_dzd: number;
};

export const PACKS: Pack[] = [
  { id: "urgent_5", label: "5 annonces urgentes", quota_type: "urgent", quota_amount: 5, amount_dzd: 2500 },
  { id: "urgent_20", label: "20 annonces urgentes", quota_type: "urgent", quota_amount: 20, amount_dzd: 8000 },
  { id: "dm_10", label: "10 contacts directs", quota_type: "direct_message", quota_amount: 10, amount_dzd: 1500 },
  { id: "dm_50", label: "50 contacts directs", quota_type: "direct_message", quota_amount: 50, amount_dzd: 6000 },
];
