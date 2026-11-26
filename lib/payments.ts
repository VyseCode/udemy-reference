/**
 * Payment adapter (simulation boundary).
 *
 * Enrollment "payments" are simulated locally: no card data is collected and
 * no external processor is contacted. The adapter validates the amount that
 * crosses the boundary and records a local receipt id.
 *
 * Swap path: implement `PaymentAdapter` with Stripe (or another PSP), keeping
 * the `charge` signature. The enrollment route then stores the returned
 * reference as `pricePaid`/receipt metadata without any other changes.
 */
export interface PaymentReceipt {
  reference: string;
  amount: number;
  simulated: true;
}

export interface PaymentAdapter {
  charge(amount: number, description: string): Promise<PaymentReceipt>;
  readonly label: string;
}

export const localSimulatedPayments: PaymentAdapter = {
  label: "Local simulated payments",
  async charge(amount: number, description: string): Promise<PaymentReceipt> {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error("Invalid payment amount");
    }
    const suffix = description.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase();
    return {
      reference: `SIM-${Date.now().toString(36).toUpperCase()}-${suffix}`,
      amount,
      simulated: true,
    };
  },
};

export const payments: PaymentAdapter = localSimulatedPayments;
