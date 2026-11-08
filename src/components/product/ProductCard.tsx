import { Link } from "react-router-dom";
import { Card } from "../ui/Card";
import { formatPrice } from "../../lib/format";
import type { Product } from "../../data/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link to={`/producto/${product.slug}`} className="group block rounded-card">
      <Card className="h-full overflow-hidden p-0 transition-colors group-hover:bg-alt">
        <img
          src={product.image}
          alt={product.imageAlt}
          loading="lazy"
          width={800}
          height={600}
          className="aspect-4/3 w-full object-cover"
        />
        <div className="space-y-1 p-4">
          <p className="text-sm text-muted">{product.brand}</p>
          <p className="font-medium leading-snug">{product.name}</p>
          <p className="pt-1 text-lg font-bold">{formatPrice(product.price)}</p>
        </div>
      </Card>
    </Link>
  );
}
