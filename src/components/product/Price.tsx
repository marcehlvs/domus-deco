import { finalPrice, hasDiscount, type Product } from "../../data/products";
import { formatPrice } from "../../lib/format";
import { cn } from "../../lib/cn";

const sizes = { md: "text-lg", lg: "text-xl", xl: "text-2xl" } as const;

/** Precio de un producto: con descuento muestra el nuevo, el de lista tachado y el porcentaje. */
export function Price({ product, size = "md", className }: { product: Pick<Product, "price" | "discount">; size?: keyof typeof sizes; className?: string }) {
  if (!hasDiscount(product)) return <p className={cn("font-bold", sizes[size], className)}>{formatPrice(product.price)}</p>;
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span className="sr-only">Precio con {product.discount}% de descuento: </span>
      <span className={cn("font-bold", sizes[size])}>{formatPrice(finalPrice(product))}</span>
      <span className="sr-only"> (antes {formatPrice(product.price)})</span>
      <del aria-hidden className="text-sm text-muted">
        {formatPrice(product.price)}
      </del>
      <span aria-hidden className="text-sm font-semibold text-success">
        {product.discount}% OFF
      </span>
    </p>
  );
}
