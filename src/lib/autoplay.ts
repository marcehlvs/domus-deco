/** Qué puede frenar el movimiento automático de un carrusel. */
export interface AutoPlayState {
  /** El carrusel pidió moverse solo. */
  enabled: boolean;
  /** La persona tiene activado «reducir movimiento» en su equipo. */
  reducedMotion: boolean;
  /** Tocó «Pausar». */
  pausedByUser: boolean;
  /** El mouse está encima, el foco está adentro o lo está tocando con el dedo. */
  interacting: boolean;
  /** La pestaña está en segundo plano. */
  tabHidden: boolean;
  /** Hay más tarjetas de las que entran: si todo se ve, no hay nada que mover. */
  hasOverflow: boolean;
}

/** El carrusel avanza solo únicamente si nada de lo anterior lo impide. */
export const shouldAutoPlay = (s: AutoPlayState) => s.enabled && s.hasOverflow && !s.reducedMotion && !s.pausedByUser && !s.interacting && !s.tabHidden;

/** Cuánto hay que desplazar para llegar a la siguiente tarjeta, o `null` si ya se está al final (entonces se vuelve al principio). */
export const nextStep = (scrollLeft: number, clientWidth: number, scrollWidth: number) => (scrollLeft + clientWidth >= scrollWidth - 2 ? null : clientWidth * 0.85);
