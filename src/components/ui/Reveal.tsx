import type { ReactNode } from "react";
import { motion } from "motion/react";

/**
 * Aparición suave (fundido + un leve ascenso) la primera vez que el elemento entra en pantalla.
 * `index` escalona de a poco las tarjetas de una misma fila; con «reducir movimiento» solo queda el fundido (MotionConfig en main.tsx).
 * Para grillas que se recorren hacia abajo: no usarlo dentro de carruseles horizontales, donde las tarjetas aparecerían en blanco al deslizar.
 */
export function Reveal({ children, index = 0, className }: { children: ReactNode; index?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.3, ease: "easeOut", delay: (index % 4) * 0.05 }}
    >
      {children}
    </motion.div>
  );
}
