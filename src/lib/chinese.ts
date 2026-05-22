/* eslint-disable @typescript-eslint/no-explicit-any */

import { convertT2S } from './s2t';

// This module provides Traditional Chinese conversion utilities for search

const CHINESE_TO_ARABIC: { [key: string]: string } = {
  一: '1',
  二: '2',
  三: '3',
  四: '4',
  五: '5',
  六: '6',
  七: '7',
  八: '8',
  九: '9',
  十: '10',
};

const ARABIC_TO_CHINESE = [
  '',
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '七',
  '八',
  '九',
  '十',
];

export function generateNumberVariant(query: string): string | null {
  const chinesePattern = /第([一二三四五六七八九十])(季|部|集|期)/;
  const chineseMatch = chinesePattern.exec(query);
  if (chineseMatch) {
    const chineseNum = chineseMatch[1];
    const arabicNum = CHINESE_TO_ARABIC[chineseNum];
    if (arabicNum) {
      const base = query.replace(chineseMatch[0], '').trim();
      if (base) {
        return `${base}${arabicNum}`;
      }
    }
  }

  const arabicPattern = /第(\d+)(季|部|集|期)/;
  const arabicMatch = arabicPattern.exec(query);
  if (arabicMatch) {
    const num = parseInt(arabicMatch[1]);
    const suffix = arabicMatch[2];
    if (num >= 1 && num <= 10) {
      const chineseNum = ARABIC_TO_CHINESE[num];
      return query.replace(arabicMatch[0], `第${chineseNum}${suffix}`);
    }
  }

  const endNumberMatch = query.match(/^(.+?)(\d+)$/);
  if (endNumberMatch) {
    const base = endNumberMatch[1].trim();
    const num = parseInt(endNumberMatch[2]);
    if (num >= 1 && num <= 10 && base) {
      const chineseNum = ARABIC_TO_CHINESE[num];
      return `${base}第${chineseNum}季`;
    }
  }

  return null;
}

function generatePunctuationVariant(query: string): string | null {
  if (query.includes('：')) {
    return query.replace(/：/g, ' ');
  }
  if (query.includes(':')) {
    return query.replace(/:/g, ' ');
  }
  if (query.includes('《') || query.includes('》')) {
    return query.replace(/[《》]/g, '');
  }
  return null;
}

export function generateSearchVariants(originalQuery: string): string[] {
  const trimmed = originalQuery.trim();
  const variants = new Set<string>();
  variants.add(trimmed);
  const simplifiedTrimmed = convertT2S(trimmed);
  const aliasMatchCandidates = new Set([trimmed, simplifiedTrimmed]);

  const numberVariant = generateNumberVariant(trimmed);
  if (numberVariant) {
    variants.add(numberVariant);
  }

  const punctuationVariant = generatePunctuationVariant(trimmed);
  if (punctuationVariant) {
    variants.add(punctuationVariant);
  }

  if (trimmed.includes(' ')) {
    const keywords = trimmed.split(/\s+/);
    if (keywords.length >= 2) {
      const lastKeyword = keywords[keywords.length - 1];
      if (/第|季|集|部|篇|章/.test(lastKeyword)) {
        const combined = keywords[0] + lastKeyword;
        variants.add(combined);
      }
      const noSpaces = trimmed.replace(/\s+/g, '');
      variants.add(noSpaces);
    }
  }

  // 處理全形轉半形
  const halfWidth = trimmed
    .replace(/[\uff01-\uff5e]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    )
    .replace(/\u3000/g, ' ');
  if (halfWidth !== trimmed) {
    variants.add(halfWidth);
    variants.add(halfWidth.toLowerCase());
    variants.add(halfWidth.toUpperCase());
  }

  // 處理英文大小寫
  const lower = trimmed.toLowerCase();
  const upper = trimmed.toUpperCase();
  if (lower !== upper) {
    variants.add(lower);
    variants.add(upper);
  }

  // 自定義動漫/影集名稱別名映射
  const ALIAS_MAP: Record<string, string[]> = {
    木头风纪委员和迷你裙JK: [
      '废柴风纪委员与裙子长度不合规的JK',
      '废柴风纪委员',
    ],
    木頭風紀委員和迷你裙JK: [
      '废柴风纪委员与裙子长度不合规的JK',
      '废柴风纪委员',
    ],
    木头风纪委员和迷你裙JK的故事: [
      '废柴风纪委员与裙子长度不合规的JK的故事',
      '废柴风纪委员',
    ],
    木頭風紀委員和迷你裙JK的故事: [
      '废柴风纪委员与裙子长度不合规的JK的故事',
      '废柴风纪委员',
    ],
    废柴风纪委员与裙子长度不合规的JK的故事: [
      '木头风纪委员和迷你裙JK的故事',
      '木头风纪委员',
    ],
    // 可以在此新增其他常見的翻譯差異別名
  };

  // 嘗試匹配別名
  for (const [key, aliases] of Object.entries(ALIAS_MAP)) {
    if (
      Array.from(aliasMatchCandidates).some((candidate) =>
        candidate.includes(key)
      )
    ) {
      aliases.forEach((alias) => variants.add(alias));
    }
  }

  // 提取核心關鍵字（對於太長的標題，API 容易找不到，可以嘗試提取核心名詞）
  if (
    Array.from(aliasMatchCandidates).some(
      (candidate) => candidate.includes('风纪委员') && candidate.includes('JK')
    )
  ) {
    variants.add('风纪委员');
  }

  return Array.from(variants);
}
function buildConversionMap(): Record<string, string> {
  return {
    电: '電',
    剧: '劇',
    结: '結',
    无: '無',
    场: '場',
    学: '學',
    会: '會',
    开: '開',
    关: '關',
    听: '聽',
    说: '說',
    读: '讀',
    写: '寫',
    设: '設',
    计: '計',
    认: '認',
    识: '識',
    问: '問',
    时: '時',
    间: '間',
    东: '東',
    南: '南',
    北: '北',
    里: '裡',
    历: '歷',
    现: '現',
    在: '在',
    这: '這',
    那: '那',
    为: '為',
    什: '什',
    么: '麼',
    没: '沒',
    有: '有',
    来: '來',
    去: '去',
    好: '好',
    看: '看',
    做: '做',
    对: '對',
    于: '於',
    上: '上',
    下: '下',
    中: '中',
    大: '大',
    小: '小',
    多: '多',
    少: '少',
    年: '年',
    月: '月',
    日: '日',
    分: '分',
    秒: '秒',
    号: '號',
    表: '表',
    示: '示',
    显: '顯',
    器: '器',
    音: '音',
    乐: '樂',
    视: '視',
    频: '頻',
    播: '播',
    放: '放',
    影: '影',
    片: '片',
    内: '內',
    容: '容',
    搜: '搜',
    索: '索',
    引: '引',
    擎: '擎',
    页: '頁',
    面: '面',
    网: '網',
    络: '絡',
    连: '連',
    接: '接',
    错: '錯',
    误: '誤',
    请: '請',
    求: '求',
    需: '需',
    要: '要',
    新: '新',
    旧: '舊',
    快: '快',
    慢: '慢',
    高: '高',
    低: '低',
    长: '長',
    短: '短',
    宽: '寬',
    窄: '窄',
    远: '遠',
    近: '近',
    难: '難',
    易: '易',
    继续: '繼續',
    发: '發',
    布: '布',
    收: '收',
    藏: '藏',
    夹: '夾',
    消息: '消息',
    通知: '通知',
    朋友: '朋友',
    资料: '資料',
    登录: '登入',
    注册: '註冊',
    密码: '密碼',
    用户: '用戶',
    名称: '名稱',
    功能: '功能',
    设置: '設定',
    选项: '選項',
    帮助: '說明',
    关于: '關於',
    版本: '版本',
    更新: '更新',
    检查: '檢查',
    失败: '失敗',
    成功: '成功',
    完成: '完成',
    加载: '載入',
    保存: '儲存',
    删除: '刪除',
    编辑: '編輯',
    取消: '取消',
    确认: '確認',
    返回: '返回',
    关闭: '關閉',
    打开: '開啟',
    启动: '啟動',
    停止: '停止',
    运行: '運行',
    测试: '測試',
    调试: '調試',
    错误: '錯誤',
    警告: '警告',
    信息: '資訊',
    记录: '記錄',
    日志: '日誌',
    数据: '數據',
    文件: '檔案',
    图片: '圖片',
    视频: '影片',
    文档: '文檔',
    管理: '管理',
    系统: '系統',
    服务器: '伺服器',
    客户端: '用戶端',
    网络: '網路',
    地址: '位址',
    端口: '連接埠',
    协议: '協定',
    服务: '服務',
    进程: '進程',
    线程: '執行緒',
    内存: '記憶體',
    磁盘: '磁碟',
    空间: '空間',
    速度: '速度',
    性能: '效能',
    优化: '優化',
    处理: '處理',
    操作: '操作',
    方式: '方式',
    类型: '類型',
    格式: '格式',
    状态: '狀態',
    结果: '結果',
    原因: '原因',
    方法: '方法',
    内容: '內容',
    标题: '標題',
    简介: '簡介',
    描述: '描述',
    分类: '分類',
    标签: '標籤',
    排序: '排序',
    筛选: '篩選',
    查询: '查詢',
    浏览: '瀏覽',
    观看: '觀看',
    下载: '下載',
    上传: '上傳',
    同步: '同步',
    导入: '匯入',
    导出: '匯出',
    备份: '備份',
    恢复: '恢復',
    迁移: '移轉',
    转换: '轉換',
    编码: '編碼',
    解码: '解碼',
    加密: '加密',
    解密: '解密',
    验证: '驗證',
    授权: '授權',
    权限: '權限',
    角色: '角色',
    组: '群組',
    组织: '組織',
    认证: '認證',
    登出: '登出',
    激活: '啟用',
    停用: '停用',
    访问: '存取',
    控制: '控制',
    监控: '監控',
    报告: '報告',
    统计: '統計',
    分析: '分析',
    计划: '計劃',
    调度: '調度',
    任务: '任務',
    队列: '佇列',
    缓存: '快取',
    代理: '代理',
    路由: '路由',
    转发: '轉發',
    负载: '負載',
    均衡: '均衡',
    集群: '叢集',
    节点: '節點',
    主: '主',
    从: '從',
    备: '備',
    故障: '故障',
    转移: '轉移',
    升级: '升級',
    降级: '降級',
    回滚: '復原',
    部署: '部署',
    回退: '回退',
  };
}

const SIMPLIFIED_TO_TRADITIONAL = buildConversionMap();

export function toDisplayLanguage(text: string): string {
  let result = text;
  for (const [simp, trad] of Object.entries(SIMPLIFIED_TO_TRADITIONAL)) {
    result = result.split(simp).join(trad);
  }
  return result;
}
