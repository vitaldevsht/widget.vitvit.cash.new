import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://genpay.solvexalabs.xyz/api/cashcash/check-payment?orderId=${orderId}`, {
        headers: {
            'Authorization': `Bearer ${process.env.MONCASH_API_KEY}`,
            'Business-X-Id': process.env.MONCASH_BUSINESS_ID!
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json({ error: `Upstream error: ${response.status}`, details: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Server Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
