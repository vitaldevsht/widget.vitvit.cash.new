import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, token } = body;

    if (!email || !token) {
      return NextResponse.json(
        {
          valid: false,
          error: { message: "Missing email or token" },
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://dev-vital-finance-infra.vercel.app/auth/login/otp/verify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.VAULT_API_TOKEN}`,
        },
        body: JSON.stringify({ email, token }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          valid: false,
          error: data.error || { message: "Verification failed" },
        },
        { status: response.status }
      );
    }

    // Return success with user data from the response
    return NextResponse.json({
      valid: true,
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      refresh_token: data.refresh_token,
      user: data.user,
    });
  } catch (error: unknown) {
    console.error("Email OTP Verify Error:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      {
        valid: false,
        error: { message },
      },
      { status: 500 }
    );
  }
}
