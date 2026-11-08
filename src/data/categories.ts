export const categories = [
  { slug: "sabanas", name: "Sábanas", text: "Percal y algodón" },
  { slug: "toallas", name: "Toallas", text: "Baño y playa" },
  { slug: "acolchados", name: "Acolchados", text: "Para cada estación" },
  { slug: "almohadas", name: "Almohadas", text: "Firmes y suaves" },
] as const;

export type CategorySlug = (typeof categories)[number]["slug"];
