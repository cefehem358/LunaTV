/* eslint-disable @typescript-eslint/no-explicit-any,no-console,@typescript-eslint/no-non-null-assertion */

import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { getConfig } from '@/lib/config';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

// 支持的操作類型
const ACTIONS = [
  'add',
  'ban',
  'unban',
  'setAdmin',
  'cancelAdmin',
  'changePassword',
  'deleteUser',
  'updateUserApis',
  'userGroup',
  'updateUserGroups',
  'batchUpdateUserGroups',
] as const;

export async function POST(request: NextRequest) {
  const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage';
  if (storageType === 'localstorage') {
    return NextResponse.json(
      {
        error: '不支持本地存儲進行管理員配置',
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const username = authInfo.username;

    const {
      targetUsername, // 目標用戶名
      targetPassword, // 目標用戶密碼（僅在添加用戶時需要）
      action,
    } = body as {
      targetUsername?: string;
      targetPassword?: string;
      action?: (typeof ACTIONS)[number];
    };

    if (!action || !ACTIONS.includes(action)) {
      return NextResponse.json({ error: '参数格式错误' }, { status: 400 });
    }

    // 用戶組操作和批量操作不需要targetUsername
    if (!targetUsername && !['userGroup', 'batchUpdateUserGroups'].includes(action)) {
      return NextResponse.json({ error: '缺少目標用戶名' }, { status: 400 });
    }

    if (
      action !== 'changePassword' &&
      action !== 'deleteUser' &&
      action !== 'updateUserApis' &&
      action !== 'userGroup' &&
      action !== 'updateUserGroups' &&
      action !== 'batchUpdateUserGroups' &&
      username === targetUsername
    ) {
      return NextResponse.json(
        { error: '無法對自己進行此操作' },
        { status: 400 }
      );
    }

    // 获取配置与存储
    const adminConfig = await getConfig();

    // 判定操作者角色
    let operatorRole: 'owner' | 'admin';
    if (username === process.env.USERNAME) {
      operatorRole = 'owner';
    } else {
      const userEntry = adminConfig.UserConfig.Users.find(
        (u) => u.username === username
      );
      if (!userEntry || userEntry.role !== 'admin' || userEntry.banned) {
        return NextResponse.json({ error: '權限不足' }, { status: 401 });
      }
      operatorRole = 'admin';
    }

    // 查找目標用戶條目（用戶組操作和批量操作不需要）
    let targetEntry: any = null;
    let isTargetAdmin = false;

    if (!['userGroup', 'batchUpdateUserGroups'].includes(action) && targetUsername) {
      targetEntry = adminConfig.UserConfig.Users.find(
        (u) => u.username === targetUsername
      );

      if (
        targetEntry &&
        targetEntry.role === 'owner' &&
        !['changePassword', 'updateUserApis', 'updateUserGroups'].includes(action)
      ) {
        return NextResponse.json({ error: '無法操作站長' }, { status: 400 });
      }

      // 权限校验逻辑
      isTargetAdmin = targetEntry?.role === 'admin';
    }

    switch (action) {
      case 'add': {
        if (targetEntry) {
          return NextResponse.json({ error: '用戶已存在' }, { status: 400 });
        }
        if (!targetPassword) {
          return NextResponse.json(
            { error: '缺少目標用戶密碼' },
            { status: 400 }
          );
        }
        await db.registerUser(targetUsername!, targetPassword);

        // 获取用户组信息
        const { userGroup } = body as { userGroup?: string };

        // 更新配置
        const newUser: any = {
          username: targetUsername!,
          role: 'user',
        };

        // 如果指定了用戶組，添加到tags中
        if (userGroup && userGroup.trim()) {
          newUser.tags = [userGroup];
        }

        adminConfig.UserConfig.Users.push(newUser);
        targetEntry =
          adminConfig.UserConfig.Users[
          adminConfig.UserConfig.Users.length - 1
          ];
        break;
      }
      case 'ban': {
        if (!targetEntry) {
          return NextResponse.json(
            { error: '目標用戶不存在' },
            { status: 404 }
          );
        }
        if (isTargetAdmin) {
          // 目标是管理员
          if (operatorRole !== 'owner') {
            return NextResponse.json(
              { error: '僅站長可封禁管理員' },
              { status: 401 }
            );
          }
        }
        targetEntry.banned = true;
        break;
      }
      case 'unban': {
        if (!targetEntry) {
          return NextResponse.json(
            { error: '目標用戶不存在' },
            { status: 404 }
          );
        }
        if (isTargetAdmin) {
          if (operatorRole !== 'owner') {
            return NextResponse.json(
              { error: '僅站長可操作管理員' },
              { status: 401 }
            );
          }
        }
        targetEntry.banned = false;
        break;
      }
      case 'setAdmin': {
        if (!targetEntry) {
          return NextResponse.json(
            { error: '目標用戶不存在' },
            { status: 404 }
          );
        }
        if (targetEntry.role === 'admin') {
          return NextResponse.json(
            { error: '該用戶已是管理員' },
            { status: 400 }
          );
        }
        if (operatorRole !== 'owner') {
          return NextResponse.json(
            { error: '僅站長可設置管理員' },
            { status: 401 }
          );
        }
        targetEntry.role = 'admin';
        break;
      }
      case 'cancelAdmin': {
        if (!targetEntry) {
          return NextResponse.json(
            { error: '目標用戶不存在' },
            { status: 404 }
          );
        }
        if (targetEntry.role !== 'admin') {
          return NextResponse.json(
            { error: '目標用戶不是管理員' },
            { status: 400 }
          );
        }
        if (operatorRole !== 'owner') {
          return NextResponse.json(
            { error: '僅站長可取消管理員' },
            { status: 401 }
          );
        }
        targetEntry.role = 'user';
        break;
      }
      case 'changePassword': {
        if (!targetEntry) {
          return NextResponse.json(
            { error: '目標用戶不存在' },
            { status: 404 }
          );
        }
        if (!targetPassword) {
          return NextResponse.json({ error: '缺少新密碼' }, { status: 400 });
        }

        // 权限检查：不允许修改站长密码
        if (targetEntry.role === 'owner') {
          return NextResponse.json(
            { error: '無法修改站長密碼' },
            { status: 401 }
          );
        }

        if (
          isTargetAdmin &&
          operatorRole !== 'owner' &&
          username !== targetUsername
        ) {
          return NextResponse.json(
            { error: '僅站長可修改其他管理員密碼' },
            { status: 401 }
          );
        }

        await db.changePassword(targetUsername!, targetPassword);
        break;
      }
      case 'deleteUser': {
        if (!targetEntry) {
          return NextResponse.json(
            { error: '目標用戶不存在' },
            { status: 404 }
          );
        }

        // 权限检查：站长可删除所有用户（除了自己），管理员可删除普通用户
        if (username === targetUsername) {
          return NextResponse.json(
            { error: '不能刪除自己' },
            { status: 400 }
          );
        }

        if (isTargetAdmin && operatorRole !== 'owner') {
          return NextResponse.json(
            { error: '僅站長可刪除管理員' },
            { status: 401 }
          );
        }

        await db.deleteUser(targetUsername!);

        // 从配置中移除用户
        const userIndex = adminConfig.UserConfig.Users.findIndex(
          (u) => u.username === targetUsername
        );
        if (userIndex > -1) {
          adminConfig.UserConfig.Users.splice(userIndex, 1);
        }

        break;
      }
      case 'updateUserApis': {
        if (!targetEntry) {
          return NextResponse.json(
            { error: '目標用戶不存在' },
            { status: 404 }
          );
        }

        const { enabledApis } = body as { enabledApis?: string[] };

        // 权限检查：站长可配置所有人的采集源，管理员可配置普通用户和自己的采集源
        if (
          isTargetAdmin &&
          operatorRole !== 'owner' &&
          username !== targetUsername
        ) {
          return NextResponse.json(
            { error: '僅站長可配置其他管理員的採集源' },
            { status: 401 }
          );
        }

        // 更新用户的采集源权限
        if (enabledApis && enabledApis.length > 0) {
          targetEntry.enabledApis = enabledApis;
        } else {
          // 如果为空数组或未提供，则删除该字段，表示无限制
          delete targetEntry.enabledApis;
        }

        break;
      }
      case 'userGroup': {
        // 用戶組管理操作
        const { groupAction, groupName, enabledApis } = body as {
          groupAction: 'add' | 'edit' | 'delete';
          groupName: string;
          enabledApis?: string[];
        };

        if (!adminConfig.UserConfig.Tags) {
          adminConfig.UserConfig.Tags = [];
        }

        switch (groupAction) {
          case 'add': {
            // 檢查用戶組是否已存在
            if (adminConfig.UserConfig.Tags.find(t => t.name === groupName)) {
              return NextResponse.json({ error: '用户组已存在' }, { status: 400 });
            }
            adminConfig.UserConfig.Tags.push({
              name: groupName,
              enabledApis: enabledApis || [],
            });
            break;
          }
          case 'edit': {
            const groupIndex = adminConfig.UserConfig.Tags.findIndex(t => t.name === groupName);
            if (groupIndex === -1) {
              return NextResponse.json({ error: '用戶組不存在' }, { status: 404 });
            }
            adminConfig.UserConfig.Tags[groupIndex].enabledApis = enabledApis || [];
            break;
          }
          case 'delete': {
            const groupIndex = adminConfig.UserConfig.Tags.findIndex(t => t.name === groupName);
            if (groupIndex === -1) {
              return NextResponse.json({ error: '用戶組不存在' }, { status: 404 });
            }

            // 查找使用该用户组的所有用户
            const affectedUsers: string[] = [];
            adminConfig.UserConfig.Users.forEach(user => {
              if (user.tags && user.tags.includes(groupName)) {
                affectedUsers.push(user.username);
                // 从用户的tags中移除该用户组
                user.tags = user.tags.filter(tag => tag !== groupName);
                // 如果用户没有其他标签了，删除tags字段
                if (user.tags.length === 0) {
                  delete user.tags;
                }
              }
            });

            // 删除用户组
            adminConfig.UserConfig.Tags.splice(groupIndex, 1);

            // 记录删除操作的影响
            console.log(`刪除用戶組 "${groupName}"，影響用戶: ${affectedUsers.length > 0 ? affectedUsers.join(', ') : '無'}`);

            break;
          }
          default:
            return NextResponse.json({ error: '未知的用戶組操作' }, { status: 400 });
        }
        break;
      }
      case 'updateUserGroups': {
        if (!targetEntry) {
          return NextResponse.json({ error: '目標用戶不存在' }, { status: 404 });
        }

        const { userGroups } = body as { userGroups: string[] };

        // 权限检查：站长可配置所有人的用户组，管理员可配置普通用户和自己的用户组
        if (
          isTargetAdmin &&
          operatorRole !== 'owner' &&
          username !== targetUsername
        ) {
          return NextResponse.json({ error: '僅站長可配置其他管理員的用戶組' }, { status: 400 });
        }

        // 更新用户的用户组
        if (userGroups && userGroups.length > 0) {
          targetEntry.tags = userGroups;
        } else {
          // 如果为空数组或未提供，则删除该字段，表示无用户组
          delete targetEntry.tags;
        }

        break;
      }
      case 'batchUpdateUserGroups': {
        const { usernames, userGroups } = body as { usernames: string[]; userGroups: string[] };

        if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
          return NextResponse.json({ error: '缺少用戶名列表' }, { status: 400 });
        }

        // 权限检查：站长可批量配置所有人的用户组，管理员只能批量配置普通用户
        if (operatorRole !== 'owner') {
          for (const targetUsername of usernames) {
            const targetUser = adminConfig.UserConfig.Users.find(u => u.username === targetUsername);
            if (targetUser && targetUser.role === 'admin' && targetUsername !== username) {
              return NextResponse.json({ error: `管理員無法操作其他管理員 ${targetUsername}` }, { status: 400 });
            }
          }
        }

        // 批量更新用戶組
        for (const targetUsername of usernames) {
          const targetUser = adminConfig.UserConfig.Users.find(u => u.username === targetUsername);
          if (targetUser) {
            if (userGroups && userGroups.length > 0) {
              targetUser.tags = userGroups;
            } else {
              // 如果為空數組或未提供，則刪除該字段，表示無用戶組
              delete targetUser.tags;
            }
          }
        }

        break;
      }
      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }

    // 將更新後的配置寫入數據庫
    await db.saveAdminConfig(adminConfig);

    return NextResponse.json(
      { ok: true },
      {
        headers: {
          'Cache-Control': 'no-store', // 管理員配置不緩存
        },
      }
    );
  } catch (error) {
    console.error('用户管理操作失败:', error);
    return NextResponse.json(
      {
        error: '用戶管理操作失敗',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
