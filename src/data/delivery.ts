// Formas de entrega que ofrece el checkout. Se cambian acá, sin tocar el resto del código.
//
// Hoy: el envío se coordina por WhatsApp después de confirmar el pedido (sin costo calculado en la tienda).
// Retiro en el local: ponelo en `enabled: true` y cargá la dirección cuando tengas un punto de retiro.
export type DeliveryMethod = "whatsapp" | "retiro";

export const delivery = {
  whatsapp: {
    enabled: true,
    label: "Envío a coordinar por WhatsApp",
    text: "Cuando confirmes el pedido te escribimos para acordar el costo y la entrega.",
  },
  retiro: {
    enabled: false,
    label: "Retiro en el local",
    address: "", // ej.: "Calle 123, Localidad"
    text: "Te avisamos por WhatsApp cuando esté listo para retirar.",
  },
} as const;

export const deliveryLabels: Record<DeliveryMethod, string> = {
  whatsapp: delivery.whatsapp.label,
  retiro: delivery.retiro.label,
};

/** Las formas de entrega activas, en el orden en que se muestran. */
export const enabledMethods = (): DeliveryMethod[] => (["whatsapp", "retiro"] as const).filter((m) => delivery[m].enabled);
