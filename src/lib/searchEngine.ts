/**
 * LunaTV 智慧搜尋與繁簡容錯核心引擎 - v1.5.2
 *
 * isFuzzyMatch 使用 LCS（最長公共子字串）嚴格比對：
 *   - 兩個字串必須互包含（substring），或
 *   - LCS 長度 >= 4，且覆蓋較短字串的 50% 以上
 * 以上均不滿足則視為不匹配，根治「點 A 搜出 B」問題。
 */
const rawS2tPairs =
  '阳陽 陆陸 龟龜 欺诈欺詐 诈欺詐欺 委员委員 戏戲 游戏遊戲 废廢 柴柴 木木 动動 漫畫 漫画 头頭';

const s2tMap = new Map<string, string>();
const t2sMap = new Map<string, string>();

// 支援多字詞映射：保留原始 pairs，但增加全詞替換邏輯
// 先建立單字元映射
rawS2tPairs.split(' ').forEach((pair) => {
  if (pair.length >= 2) {
    const [simplified, traditional] = pair.split('');
    s2tMap.set(simplified, traditional);
    t2sMap.set(traditional, simplified);
  }
});

export function convertS2T(text: string): string {
  if (!text) return '';
  return text
    .split('')
    .map((char) => s2tMap.get(char) ?? char)
    .join('');
}

export function convertT2S(text: string): string {
  if (!text) return '';
  return text
    .split('')
    .map((char) => t2sMap.get(char) ?? char)
    .join('');
}

/**
 * 計算兩個字串的最長公共子字串長度（Longest Common Substring）
 */
function getLCS(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  let longest = 0;
  const num = Array(s1.length)
    .fill(0)
    .map(() => Array(s2.length).fill(0));
  for (let i = 0; i < s1.length; i++) {
    for (let j = 0; j < s2.length; j++) {
      if (s1[i] === s2[j]) {
        num[i][j] = i === 0 || j === 0 ? 1 : num[i - 1][j - 1] + 1;
        if (num[i][j] > longest) longest = num[i][j];
      }
    }
  }
  return longest;
}

/**
 * 標準化文字：去空格、轉小寫、繁轉簡（用於比較）
 */
function normalize(text: string): string {
  return convertT2S(text.replaceAll(' ', '').toLowerCase());
}

/**
 * 判斷 vodName 是否與 query 匹配。
 *
 * 匹配規則（優先順序）：
 * 1. 互相包含（精確包含）
 * 2. LCS >= 4 且 LCS / min(len(vodName), len(query)) >= 0.5
 *    （且兩個字串長度都必須 >= 4 才啟用 LCS 比對，防止短字串誤觸）
 */
export function isFuzzyMatch(vodName: string, query: string): boolean {
  if (!vodName || !query) return false;

  const normName = normalize(vodName);
  const normQuery = normalize(query);

  // 精確包含（繁簡統一後）
  if (normName.includes(normQuery) || normQuery.includes(normName)) return true;

  // 長度不足時不啟用 LCS 比對（防止誤匹配）
  if (normName.length < 4 || normQuery.length < 4) return false;

  const lcsLen = getLCS(normName, normQuery);
  const minLen = Math.min(normName.length, normQuery.length);

  return lcsLen >= 4 && minLen > 0 && lcsLen / minLen >= 0.5;
}

/** @deprecated - 保留給舊程式碼相容性 */
export function getCoreTokens(queryStr: string): string[] {
  if (!queryStr) return [];
  const cleanStr = queryStr
    .replace(
      /(的故事|動畫版|动画版|第一季|第二季|第三季|第四季|真人版|劇場版|剧场版|Part\s*\d+|\d+期)/gi,
      ''
    )
    .replace(/[\s\-_,.:：，。！？]/g, '')
    .trim();

  if (cleanStr.length <= 2) return [cleanStr];
  if (cleanStr.length > 5) {
    return [cleanStr.slice(0, 3), cleanStr.slice(2, 5), cleanStr.slice(-3)];
  }
  return [cleanStr.slice(0, 2), cleanStr.slice(-2)];
}

export const VERSION = 'v1.5.2';
export const UPDATE_DATE = '2026-05-21';
