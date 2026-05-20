/* eslint-disable no-console */

import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { getConfig } from '@/lib/config';
import { db } from '@/lib/db';
import { SkipConfig } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return NextResponse.json({ error: '未登錄' }, { status: 401 });
    }

    const config = await getConfig();
    if (authInfo.username !== process.env.USERNAME) {
      // 非站长，检查用户存在或被封禁
      const user = config.UserConfig.Users.find(
        (u) => u.username === authInfo.username
      );
      if (!user) {
        return NextResponse.json({ error: '用戶不存在' }, { status: 401 });
      }
      if (user.banned) {
        return NextResponse.json({ error: '用戶已被封禁' }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const id = searchParams.get('id');

    if (source && id) {
      // 獲取單個配置
      const config = await db.getSkipConfig(authInfo.username, source, id);
      return NextResponse.json(config);
    } else {
      // 獲取所有配置
      const configs = await db.getAllSkipConfigs(authInfo.username);
      return NextResponse.json(configs);
    }
  } catch (error) {
    console.error('获取跳过片头片尾配置失败:', error);
    return NextResponse.json(
      { error: '獲取跳過片頭片尾配置失敗' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return NextResponse.json({ error: '未登錄' }, { status: 401 });
    }

    const adminConfig = await getConfig();
    if (authInfo.username !== process.env.USERNAME) {
      // 非站长，检查用户存在或被封禁
      const user = adminConfig.UserConfig.Users.find(
        (u) => u.username === authInfo.username
      );
      if (!user) {
        return NextResponse.json({ error: '用戶不存在' }, { status: 401 });
      }
      if (user.banned) {
        return NextResponse.json({ error: '用戶已被封禁' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { key, config } = body;

    if (!key || !config) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    // 解析key为source和id
    const [source, id] = key.split('+');
    if (!source || !id) {
      return NextResponse.json({ error: '無效的key格式' }, { status: 400 });
    }

    // 验证配置格式
    const skipConfig: SkipConfig = {
      enable: Boolean(config.enable),
      intro_time: Number(config.intro_time) || 0,
      outro_time: Number(config.outro_time) || 0,
    };

    await db.setSkipConfig(authInfo.username, source, id, skipConfig);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('保存跳過片頭片尾配置失敗:', error);
    return NextResponse.json(
      { error: '保存跳過片頭片尾配置失敗' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return NextResponse.json({ error: '未登錄' }, { status: 401 });
    }

    const adminConfig = await getConfig();
    if (authInfo.username !== process.env.USERNAME) {
      // 非站长，检查用户存在或被封禁
      const user = adminConfig.UserConfig.Users.find(
        (u) => u.username === authInfo.username
      );
      if (!user) {
        return NextResponse.json({ error: '用戶不存在' }, { status: 401 });
      }
      if (user.banned) {
        return NextResponse.json({ error: '用戶已被封禁' }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    // 解析key为source和id
    const [source, id] = key.split('+');
    if (!source || !id) {
      return NextResponse.json({ error: '無效的key格式' }, { status: 400 });
    }

    await db.deleteSkipConfig(authInfo.username, source, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('刪除跳過片頭片尾配置失敗:', error);
    return NextResponse.json(
      { error: '刪除跳過片頭片尾配置失敗' },
      { status: 500 }
    );
  }
}
