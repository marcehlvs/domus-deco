import { store } from "./store";

export interface LegalSection {
  heading: string;
  body: string[];
}
export interface LegalPageData {
  slug: string;
  title: string;
  sections: LegalSection[];
}

const contact = [store.contact.email && `por email a ${store.contact.email}`, store.contact.whatsapp && "por WhatsApp"].filter(Boolean).join(" o ");

// BORRADOR. Completá todo lo que dice [completar] y mostráselo a tu contador o a un abogado.
// Mientras `reviewed` sea false, estas páginas y sus links NO se muestran en la tienda publicada (solo en desarrollo).
export const legal = {
  reviewed: false,
  pages: [
    {
      slug: "cambios-y-devoluciones",
      title: "Cambios y devoluciones",
      sections: [
        {
          heading: "Fallas o errores en el pedido",
          body: [
            `Si recibiste un producto con una falla o distinto al que pediste, escribinos ${contact} con tu número de pedido y una foto. Lo resolvemos con un cambio o con la devolución de tu dinero.`,
          ],
        },
        {
          heading: "Cambios de medida o color",
          body: ["Aceptamos cambios dentro de los [completar] días de recibido el producto, sin uso y en su empaque original."],
        },
        {
          heading: "Botón de arrepentimiento",
          body: [
            "En las compras a distancia podés arrepentirte dentro de los 10 días corridos de recibido el producto, sin costo para vos. [Confirmá el plazo y el procedimiento con tu contador o un abogado.]",
          ],
        },
        {
          heading: "Costo del envío",
          body: ["[Completar: quién paga el envío en cada caso: falla, cambio y arrepentimiento.]"],
        },
      ],
    },
    {
      slug: "terminos",
      title: "Términos y condiciones",
      sections: [
        {
          heading: "Quiénes somos",
          body: [`${store.name} es una tienda de blanquería. Razón social: [completar]. CUIT: [completar]. Domicilio: [completar].`],
        },
        {
          heading: "Precios y stock",
          body: [
            "Los precios están en pesos argentinos e incluyen [completar: impuestos]. El stock es limitado: si un producto que pediste ya no está disponible, te avisamos y te devolvemos el dinero.",
          ],
        },
        {
          heading: "Medios de pago",
          body: ["Los pagos se procesan con Mercado Pago. No guardamos los datos de tu tarjeta."],
        },
        {
          heading: "Envíos",
          body: ["[Completar: zonas, plazos y costos de envío, y si hay retiro por el local.]"],
        },
        {
          heading: "Tus datos",
          body: [
            "Usamos tus datos solo para gestionar tus pedidos y contactarte por ellos. No los compartimos con terceros, salvo los necesarios para cobrar y enviar tu compra.",
          ],
        },
        {
          heading: "Contacto",
          body: [`Escribinos ${contact}.`],
        },
      ],
    },
  ] satisfies LegalPageData[],
};

// Se muestran si ya están revisadas o mientras desarrollás.
export const legalVisible = legal.reviewed || import.meta.env.DEV;
