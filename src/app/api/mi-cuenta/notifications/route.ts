import { NextResponse } from "next/server";
import { requireOwnedBoda } from "@/lib/account/auth-boda";
import { getBodaNotifications } from "@/lib/notifications/queries";

export async function GET() {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return NextResponse.json(
      { error: error ?? "No encontramos tu boda." },
      { status: 401 },
    );
  }

  const data = await getBodaNotifications(boda.id);
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
