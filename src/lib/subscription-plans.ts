export const FOUNDER_CUSTOMER_LIMIT = 30;

export type PricingPhase = "founder" | "standard";
export type BillingPeriod = "monthly" | "quarterly" | "semiannual" | "annual";

type SubscriptionPlanDefinition = {
  id: BillingPeriod;
  label: string;
  shortLabel: string;
  months: number;
  founderPrice: number;
  standardPrice: number;
  featured?: boolean;
};

const definitions: SubscriptionPlanDefinition[] = [
  {
    id: "monthly",
    label: "Mensual",
    shortLabel: "1 mes",
    months: 1,
    founderPrice: 9900,
    standardPrice: 14900,
  },
  {
    id: "quarterly",
    label: "Trimestral",
    shortLabel: "3 meses",
    months: 3,
    founderPrice: 26900,
    standardPrice: 39900,
  },
  {
    id: "semiannual",
    label: "Semestral",
    shortLabel: "6 meses",
    months: 6,
    founderPrice: 49900,
    standardPrice: 74900,
  },
  {
    id: "annual",
    label: "Anual",
    shortLabel: "12 meses",
    months: 12,
    founderPrice: 89900,
    standardPrice: 134900,
    featured: true,
  },
];

export function isBillingPeriod(value: unknown): value is BillingPeriod {
  return definitions.some((plan) => plan.id === value);
}

export function getSubscriptionPlans(phase: PricingPhase) {
  const monthlyPrice =
    phase === "founder"
      ? definitions[0].founderPrice
      : definitions[0].standardPrice;

  return definitions.map((plan) => {
    const price =
      phase === "founder" ? plan.founderPrice : plan.standardPrice;
    const fullPrice = monthlyPrice * plan.months;
    const discount =
      plan.months === 1 ? 0 : Math.round((1 - price / fullPrice) * 100);

    return {
      id: plan.id,
      label: plan.label,
      shortLabel: plan.shortLabel,
      months: plan.months,
      price,
      monthlyEquivalent: Math.round(price / plan.months),
      discount,
      featured: Boolean(plan.featured),
    };
  });
}

export function getSubscriptionPlan(
  period: BillingPeriod,
  phase: PricingPhase
) {
  return getSubscriptionPlans(phase).find((plan) => plan.id === period)!;
}
