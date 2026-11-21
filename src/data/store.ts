// Datos del negocio. El pie y los textos legales leen de acá.
// Redes y contacto: completá lo que tengas y aparece solo en el pie. Lo vacío no se muestra.
export const store = {
  name: "Domus Deco",
  tagline: "Blanquería para tu casa.",
  contact: {
    whatsapp: "5491126758365", // solo dígitos con código de país, ej. 5491112345678
    instagram: "domusdeco", // usuario sin @
    facebook: "", // nombre de la página, el que aparece en facebook.com/…
    email: "domusdecostore@gmail.com",
  },
  // Comprar sin crear cuenta. APAGADO a propósito: encenderlo abre una sesión anónima de Firebase en el checkout, y eso
  // pide activar «Anónimo» en Authentication y «Hacer cumplir» de App Check (ver SEGURIDAD.md). Apagado, el checkout pide ingresar.
  guestCheckout: false,
  // Navidad en la portada. La sección aparece sola cuando existe la categoría «Navidad» (creala en /admin/categorias)
  // y tiene productos visibles; desaparece pasada la fecha «showUntil».
  christmas: {
    slug: "navidad", // la dirección de la categoría: se genera del nombre «Navidad»
    lastOrderDate: "", // AAAA-MM-DD: último día para pedir y recibir a tiempo. Vacío = no se muestra el aviso
    showUntil: "2026-12-25", // AAAA-MM-DD: hasta este día (inclusive) se ve la sección
  },
} as const;
