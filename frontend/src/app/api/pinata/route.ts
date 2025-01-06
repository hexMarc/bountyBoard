import { NextRequest, NextResponse } from "next/server";
import { PinataSDK } from "pinata-web3";

export async function POST(req: NextRequest) {
  try {
    const pinata = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT,
    });

    const json = await req.json();
    const pinataResponse = await pinata.upload.json(json);

    return NextResponse.json({ success: true, pinataResponse });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
