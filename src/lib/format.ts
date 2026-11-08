const ars = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export const formatPrice = (amount: number) => ars.format(amount);
