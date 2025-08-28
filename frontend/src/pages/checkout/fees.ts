export type PayMethod =
  | "paypal" | "klarna" | "sofort" | "daopay" | "applepay" | "card";

export const METHOD_LABEL: Record<PayMethod,string> = {
  paypal:   "PayPal",
  klarna:   "Pay by Bank (Klarna)",
  sofort:   "Sofort-banking",
  daopay:   "Phone Payment (Daopay Call)",
  applepay: "Apple Pay",
  card:     "VISA / Mastercard / AMEX",
};

// fee у відсотках (0…100)
export const METHOD_FEE: Record<PayMethod, number> = {
  paypal:   2.0,
  klarna:   2.5,
  sofort:   2.9,
  daopay:   0.0,
  applepay: 5.0,
  card:     2.9,
};
