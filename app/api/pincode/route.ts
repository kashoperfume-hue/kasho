import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const pincode = request.nextUrl.searchParams.get("pincode");
  if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode)) {
    return NextResponse.json({ error: "Invalid pincode" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    const post = data?.[0];

    if (post?.Status !== "Success" || !post.PostOffice?.length) {
      return NextResponse.json({ error: "Pincode not found" }, { status: 404 });
    }

    const office = post.PostOffice[0];
    return NextResponse.json({
      city: office.District,
      state: office.State,
      district: office.District,
      post_offices: post.PostOffice.map((o: { Name: string }) => o.Name),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch pincode data" }, { status: 500 });
  }
}
