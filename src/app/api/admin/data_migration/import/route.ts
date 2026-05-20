/* eslint-disable @typescript-eslint/no-explicit-any,no-console */

import { NextRequest, NextResponse } from 'next/server';
import { promisify } from 'util';
import { gunzip } from 'zlib';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { configSelfCheck, setCachedConfig } from '@/lib/config';
import { SimpleCrypto } from '@/lib/crypto';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const gunzipAsync = promisify(gunzip);

export async function POST(req: NextRequest) {
  try {
    // 檢查存儲類型
    const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage';
    if (storageType === 'localstorage') {
      return NextResponse.json(
        { error: '不支持本地存儲進行數據遷移' },
        { status: 400 }
      );
    }

    // 验证身份和权限
    const authInfo = getAuthInfoFromCookie(req);
    if (!authInfo || !authInfo.username) {
      return NextResponse.json({ error: '未登錄' }, { status: 401 });
    }

    // 检查用户权限（只有站长可以导入数据）
    if (authInfo.username !== process.env.USERNAME) {
      return NextResponse.json({ error: '權限不足，只有站長可以導入數據' }, { status: 401 });
    }

    // 解析表单数据
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const password = formData.get('password') as string;

    if (!file) {
      return NextResponse.json({ error: '請選擇備份文件' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: '請提供解密密碼' }, { status: 400 });
    }

    // 读取文件内容
    const encryptedData = await file.text();

    // 解密数据
    let decryptedData: string;
    try {
      decryptedData = SimpleCrypto.decrypt(encryptedData, password);
    } catch (error) {
      return NextResponse.json({ error: '解密失敗，請檢查密碼是否正確' }, { status: 400 });
    }

    // 解压缩数据
    const compressedBuffer = Buffer.from(decryptedData, 'base64');
    const decompressedBuffer = await gunzipAsync(compressedBuffer);
    const decompressedData = decompressedBuffer.toString();

    // 解析JSON數據
    let importData: any;
    try {
      importData = JSON.parse(decompressedData);
    } catch (error) {
      return NextResponse.json({ error: '备份文件格式错误' }, { status: 400 });
    }

    // 驗證數據格式
    if (!importData.data || !importData.data.adminConfig || !importData.data.userData) {
      return NextResponse.json({ error: '备份文件格式无效' }, { status: 400 });
    }

    // 開始導入數據 - 先清空現有數據
    await db.clearAllData();

    // 導入管理員配置
    importData.data.adminConfig = configSelfCheck(importData.data.adminConfig);
    await db.saveAdminConfig(importData.data.adminConfig);
    await setCachedConfig(importData.data.adminConfig);

    // 導入用戶數據
    const userData = importData.data.userData;
    for (const username in userData) {
      const user = userData[username];

      // 重新註冊用戶（包含密碼）
      if (user.password) {
        await db.registerUser(username, user.password);
      }

      // 導入播放記錄
      if (user.playRecords) {
        for (const [key, record] of Object.entries(user.playRecords)) {
          await (db as any).storage.setPlayRecord(username, key, record);
        }
      }

      // 導入收藏夾
      if (user.favorites) {
        for (const [key, favorite] of Object.entries(user.favorites)) {
          await (db as any).storage.setFavorite(username, key, favorite);
        }
      }

      // 導入搜索歷史
      if (user.searchHistory && Array.isArray(user.searchHistory)) {
        for (const keyword of user.searchHistory.reverse()) { // 反轉以保持順序
          await db.addSearchHistory(username, keyword);
        }
      }

      // 導入跳過片頭片尾配置
      if (user.skipConfigs) {
        for (const [key, skipConfig] of Object.entries(user.skipConfigs)) {
          const [source, id] = key.split('+');
          if (source && id) {
            await db.setSkipConfig(username, source, id, skipConfig as any);
          }
        }
      }
    }

    return NextResponse.json({
      message: '數據導入成功',
      importedUsers: Object.keys(userData).length,
      timestamp: importData.timestamp,
      serverVersion: typeof importData.serverVersion === 'string' ? importData.serverVersion : '未知版本'
    });

  } catch (error) {
    console.error('數據導入失敗:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '導入失敗' },
      { status: 500 }
    );
  }
}
