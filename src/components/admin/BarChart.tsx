interface BarChartProps {
  data: { label: string; value: number }[];
  /** Texto para lectores de pantalla: qué muestra el gráfico y su total. */
  label: string;
  format: (n: number) => string;
}

// Barras con CSS puro (sin librería). Cada barra tiene su valor en el tooltip y el resumen va en aria-label.
export function BarChart({ data, label, format }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 0);
  return (
    <figure className="space-y-2">
      <div role="img" aria-label={label} className="flex h-40 items-end gap-px border-b border-line">
        {data.map((d) => (
          <div
            key={d.label}
            title={`${d.label}: ${format(d.value)}`}
            className="flex-1 rounded-t-sm bg-primary hover:bg-accent"
            style={{ height: d.value > 0 ? `${Math.max((d.value / max) * 100, 3)}%` : 0 }}
          />
        ))}
      </div>
      <figcaption className="flex justify-between text-xs text-muted">
        <span>{data[0]?.label}</span>
        <span>Máximo diario: {format(max)}</span>
        <span>{data[data.length - 1]?.label}</span>
      </figcaption>
    </figure>
  );
}
