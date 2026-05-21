import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { db } from '@/lib/db';
import { convertS2T } from '@/lib/s2t';

export async function DELETE(request: NextRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vodName = searchParams.get('vod_name');
    const source = searchParams.get('source');

    if (!vodName || !source) {
      return NextResponse.json({ error: 'Missing vod_name or source' }, { status: 400 });
    }

    // 對齊 v1.4.6/v1.4.7 的儲存金鑰邏輯：繁體劇名 + 純淨片源
    const traditionalName = convertS2T(vodName);
    const cleanSource = source.replace(/(資源|片源)/g, '');
    const historyStorageKey = `${traditionalName}_${cleanSource}`;

    // 直接調用 db 刪除該唯一金鑰紀錄
    await db.deletePlayRecord(authInfo.username, historyStorageKey);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('刪除播放記錄失敗:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}