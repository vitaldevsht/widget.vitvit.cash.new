import { NextResponse } from "next/server";

export interface VaultRate {
  label: string;
  HTGV_USDC?: number;
  USDC_HTGV?: number;
}

export interface VaultResponse {
  id: string;
  name: string;
  wallet_address: string;
  rates: VaultRate[];
}

export async function GET() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASEURL}/vaults/55db64ff-3922-4b7c-8385-66f67fb2e919`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PARTNER_SECRET}`,
        },
        next: { revalidate: 60 }, // Cache for 60 seconds
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Upstream error: ${response.status}`, details: errorText },
        { status: response.status },
      );
    }

    const data: VaultResponse = await response.json();

    // Extract rates for easier consumption
    const buyRate = data.rates.find((r) => r.label === "BUY USDC")?.HTGV_USDC;
    const sellRate = data.rates.find((r) => r.label === "SELL USDC")?.USDC_HTGV;

    return NextResponse.json({
      vaultId: data.id,
      name: data.name,
      walletAddress: data.wallet_address,
      rates: {
        buyUsdc: buyRate, // HTG per USDC when buying
        sellUsdc: sellRate, // HTG per USDC when selling
      },
      raw: data.rates,
    });
  } catch (error: any) {
    console.error("Quote API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
