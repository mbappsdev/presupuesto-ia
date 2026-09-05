import type { BillingPeriod, PricingPhase } from "@/lib/subscription-plans";

export type PublicSubscriptionPlan = {
  id: BillingPeriod;
  label: string;
  shortLabel: string;
  months: number;
  price: number;
  monthlyEquivalent: number;
  discount: number;
  featured: boolean;
};

export type SubscriptionPricing = {
  ok: true;
  currency: "ARS";
  phase: PricingPhase;
  founderRemaining: number;
  plans: PublicSubscriptionPlan[];
};

export async function fetchSubscriptionPricing() {
  const response = await fetch("/api/mercadopago/pricing", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("No se pudieron cargar los precios");
  }

  return (await response.json()) as SubscriptionPricing;
}

export function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}
