import { Badge } from "../ui/Badge";
import { statusLabels, type OrderStatus } from "../../data/orders";

const tones = { pendiente: "warning", pagado: "success", enviado: "neutral", cancelado: "danger" } as const;

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => <Badge tone={tones[status]}>{statusLabels[status]}</Badge>;
