const ars = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export const formatPrice = (amount: number) => ars.format(amount);

const day = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" });
export const formatDay = (date: Date | string) => day.format(new Date(date));
