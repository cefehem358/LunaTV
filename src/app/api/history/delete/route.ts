import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage"; // 請確保與你專案的資料庫儲存實例名稱一致
import { convertS2T } from "@/lib/s2t";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vod_name, source, userId } = body;
    const mockUserId = userId || "default_user";

    if (!vod_name) {
      return NextResponse.json({ success: false, error: "缺少關鍵欄位" }, { status: 400 });
    }

    // 1. 撈出 Redis / Kvrocks 中該用戶所有的觀看雜湊表
    const userHistory = await storage.hgetall(`user:history:${mockUserId}`);
    
    // 2. 將目標劇名進行標準化清洗（繁體化、去標點、去空格）
    const targetTitle = convertS2T(vod_name).replace(/[\s\-_,.:：，。！？]/g, "").trim();

    // 3. 遍歷所有鍵值，只要劇名匹配，立刻執行 HDEL 徹底抹除，絕不留活口
    for (const fieldKey of Object.keys(userHistory)) {
      const cleanFieldKey = convertS2T(fieldKey).replace(/[\s\-_,.:：，。！？]/g, "").trim();
      if (cleanFieldKey.includes(targetTitle)) {
        await storage.hdel(`user:history:${mockUserId}`, fieldKey);
      }
    }

    return NextResponse.json({ success: true, message: "資料庫實體髒數據已完全清洗" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
