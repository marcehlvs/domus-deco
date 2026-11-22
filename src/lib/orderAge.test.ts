import { describe, expect, it } from "vitest";
import { ageLabel, isStale } from "./orderAge";

const now = new Date("2026-12-10T12:00:00Z");
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("ageLabel", () => {
  it("dice «recién» durante el primer minuto (y si la hora del servidor se adelanta)", () => {
    expect(ageLabel(ago(30_000), now)).toBe("recién");
    expect(ageLabel(ago(-5 * MIN), now)).toBe("recién");
  });
  it("usa minutos, horas y días", () => {
    expect(ageLabel(ago(5 * MIN), now)).toBe("hace 5 min");
    expect(ageLabel(ago(3 * HOUR + 20 * MIN), now)).toBe("hace 3 h");
    expect(ageLabel(ago(DAY), now)).toBe("hace 1 día");
    expect(ageLabel(ago(2 * DAY + HOUR), now)).toBe("hace 2 días");
  });
});

describe("isStale", () => {
  it("resalta recién a partir de 24 horas", () => {
    expect(isStale(ago(23 * HOUR), now)).toBe(false);
    expect(isStale(ago(DAY), now)).toBe(true);
  });
});
