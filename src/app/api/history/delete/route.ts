import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage"; 
import { convertS2T } from "@/lib/searchEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vod_name, userId } = body;
    const mockUserId = userId || "default_user";
    if (!vod_name) return NextResponse.json({ success: false, error: "缺少劇名" }, { status: 400 });

    const userHistory = await storage.hgetall(`user:history:${mockUserId}`);
    const targetTitle = convertS2T(vod_name).replace(/[\s\-_,.:：，。！？]/g, "").trim();

    for (const fieldKey of Object.keys(userHistory)) {
      const cleanFieldKey = convertS2T(fieldKey).replace(/[\s\-_,.:：，。！？]/g, "").trim();
      if (cleanFieldKey.includes(targetTitle)) {
        await storage.hdel(`user:history:${mockUserId}`, fieldKey);
      }
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
