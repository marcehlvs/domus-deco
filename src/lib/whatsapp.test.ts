import { describe, expect, it } from "vitest";
import { customerWhatsappLink, phoneToWhatsapp } from "./whatsapp";

describe("phoneToWhatsapp", () => {
  it("arma el número de WhatsApp de Argentina", () => {
    expect(phoneToWhatsapp("11 2345-6789")).toBe("5491123456789");
    expect(phoneToWhatsapp("011 2345 6789")).toBe("5491123456789"); // sin el 0
    expect(phoneToWhatsapp("9 11 2345 6789")).toBe("5491123456789"); // sin duplicar el 9
  });

  it("respeta un número que ya trae el código de país", () => {
    expect(phoneToWhatsapp("+54 9 11 2345 6789")).toBe("5491123456789");
  });

  it("un teléfono demasiado corto no sirve", () => {
    expect(phoneToWhatsapp("1234")).toBeNull();
    expect(customerWhatsappLink("abc", "hola")).toBeNull();
  });

  it("el link lleva el mensaje codificado", () => {
    expect(customerWhatsappLink("11 2345 6789", "Hola, pedido #1")).toBe("https://wa.me/5491123456789?text=Hola%2C%20pedido%20%231");
  });
});
