import { Link } from "react-router-dom";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { hasDiscount, isSoldOut, type Product } from "../../data/products";
import { Price } from "./Price";
import { cn } from "../../lib/cn";

// Misma grilla en Tienda y en Destacados del Home.
export const productGrid = "grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4";

export function ProductCard({ product }: { product: Product }) {
  const soldOut = isSoldOut(product);
  return (
    <Link to={`/producto/${product.slug}`} className="group block h-full rounded-card">
      <Card className="flex h-full flex-col overflow-hidden p-0 transition-colors group-hover:bg-alt">
        <div className="relative">
          <img
            src={product.image}
            alt={product.imageAlt}
            loading="lazy"
            width={800}
            height={600}
            className={cn("aspect-4/3 w-full object-cover", soldOut && "grayscale")}
          />
          {soldOut && (
            <span className="absolute left-2 top-2">
              <Badge>Sin stock</Badge>
            </span>
          )}
          {hasDiscount(product) && (
            <span aria-hidden className="absolute right-2 top-2">
              <Badge tone="warning">{product.discount}% OFF</Badge>
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-4">
          {product.brand && <p className="text-sm text-muted">{product.brand}</p>}
          <p className="font-medium leading-snug">{product.name}</p>
          <Price product={product} className="mt-auto pt-1" />
        </div>
      </Card>
    </Link>
  );
}
