// Datos del negocio en un solo lugar. Footer y Home leen de acá.
// Contacto: completá lo que tengas y aparece solo en el pie. Lo vacío no se muestra.
export const store = {
  name: "Domus Deco",
  tagline: "Blanquería para tu casa.",
  contact: {
    whatsapp: "", // solo dígitos con código de país, ej. 5491112345678
    instagram: "", // usuario sin @
    email: "",
  },
  // Textos de ejemplo: confirmá que reflejan tus condiciones reales.
  perks: [
    { icon: "shipping", title: "Envíos", text: "Coordinamos el envío al finalizar la compra." },
    { icon: "exchange", title: "Cambios", text: "Si algo no es lo que esperabas, escribinos." },
    { icon: "payment", title: "Pagos", text: "Pagá online con Mercado Pago." },
  ],
} as const;
