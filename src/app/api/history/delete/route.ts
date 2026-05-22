/* eslint-disable simple-import-sort/imports */
import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage'; // 請確保與你專案的資料庫儲存實例名稱一致
import { convertS2T } from '@/lib/s2t';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vod_name, userId } = body;
    const mockUserId = userId || 'default_user';

    if (!vod_name) {
      return NextResponse.json(
        { success: false, error: '缺少關鍵欄位' },
        { status: 400 }
      );
    }

    // 1. 撈出 Redis / Kvrocks 中該用戶所有的觀看雜湊表
    const userHistory =
      (await storage.hgetall(`user:history:${mockUserId}`)) || {};

    // 允許前端傳入 source 做精確比對，避免抹除不同來源的同名記錄
    const sourceForMatch = body.source
      ? body.source.replace(/(資源|片源)/g, '').trim()
      : '';

    // 2. 將目標劇名進行標準化清洗（繁體化、去標點、去空格）
    const targetTitle = convertS2T(vod_name)
      .replace(/[\s\-_,.:：，。！？]/g, '')
      .trim();

    // 3. 遍歷所有鍵值，只要劇名匹配，立刻執行 HDEL 徹底抹除，絕不留活口
    for (const [fieldKey, rawValue] of Object.entries(userHistory)) {
      if (!rawValue) continue;
      try {
        const recordData = JSON.parse(rawValue);
        const recordTitle = recordData.title || recordData.vod_name || '';
        const cleanRecordTitle = convertS2T(recordTitle)
          .replace(/[\s\-_,.:：，。！？]/g, '')
          .trim();

        const sourceInRecord = (
          recordData.source ||
          recordData.source_name ||
          ''
        )
          .replace(/(資源|片源)/g, '')
          .trim();

        // 如果資料裡的標題包含目標標題 (或互相包含)，則視為匹配
        if (
          cleanRecordTitle &&
          (cleanRecordTitle.includes(targetTitle) ||
            targetTitle.includes(cleanRecordTitle))
        ) {
          if (
            sourceForMatch &&
            sourceInRecord &&
            sourceInRecord !== sourceForMatch
          )
            continue;
          await storage.hdel(`user:history:${mockUserId}`, fieldKey);
        }
      } catch (e) {
        // 舊的或損壞的 JSON 忽略
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      message: '資料庫實體髒數據已完全清洗',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
