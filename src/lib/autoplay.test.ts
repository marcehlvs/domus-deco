import { describe, expect, it } from "vitest";
import { nextStep, shouldAutoPlay, type AutoPlayState } from "./autoplay";

const base: AutoPlayState = { enabled: true, reducedMotion: false, pausedByUser: false, interacting: false, tabHidden: false, hasOverflow: true };

describe("shouldAutoPlay", () => {
  it("avanza solo cuando nada lo frena", () => expect(shouldAutoPlay(base)).toBe(true));
  it("no se mueve si no lo pidió", () => expect(shouldAutoPlay({ ...base, enabled: false })).toBe(false));
  it("respeta «reducir movimiento»", () => expect(shouldAutoPlay({ ...base, reducedMotion: true })).toBe(false));
  it("se frena si la persona lo pausó", () => expect(shouldAutoPlay({ ...base, pausedByUser: true })).toBe(false));
  it("se frena mientras la persona interactúa (mouse, foco, dedo)", () => expect(shouldAutoPlay({ ...base, interacting: true })).toBe(false));
  it("se frena con la pestaña en segundo plano", () => expect(shouldAutoPlay({ ...base, tabHidden: true })).toBe(false));
  it("no hace nada si todas las tarjetas ya se ven", () => expect(shouldAutoPlay({ ...base, hasOverflow: false })).toBe(false));
});

describe("nextStep", () => {
  it("avanza casi un ancho de pantalla", () => expect(nextStep(0, 1000, 3000)).toBe(850));
  it("al llegar al final devuelve null para volver al principio", () => {
    expect(nextStep(2000, 1000, 3000)).toBeNull();
    expect(nextStep(1999, 1000, 3000)).toBeNull(); // el margen de 2 px evita quedarse trabado por decimales
  });
});
