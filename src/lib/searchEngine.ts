/**
 * LunaTV 智慧搜尋與繁簡容錯核心引擎 - v1.6.3
 *
 * isFuzzyMatch 使用 LCS（最長公共子字串）嚴格比對：
 *   - 兩個字串必須互包含（substring），或
 *   - LCS 長度 >= 4，且覆蓋較短字串的 50% 以上
 * 以上均不滿足則視為不匹配，根治「點 A 搜出 B」問題。
 */
import { convertT2S } from './s2t';

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
 * 解析中文數字轉阿拉伯數字（僅處理 1-99）
 */
function parseChineseNumber(ch: string): number {
  const map: Record<string, number> = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  };
  if (ch === '十') return 10;
  if (ch.length === 2) {
    if (ch[0] === '十') return 10 + (map[ch[1]] || 0);
    if (ch[1] === '十') return (map[ch[0]] || 1) * 10;
  }
  if (ch.length === 3 && ch[1] === '十') {
    return (map[ch[0]] || 0) * 10 + (map[ch[2]] || 0);
  }
  return map[ch] || 0;
}

/**
 * 從文字中提取季數，只在有明確季數標記時才回傳數字。
 * 支援格式：第一季/第1季、Season 1、S1、Part 1
 * 如果沒有季數標記則回傳 null，避免誤抓標題中的數字。
 */
export function extractSeasonNumber(text: string): number | null {
  if (!text) return null;

  // 1. 中文季數：第X季、第X期、第X部、第X話
  const cnMatch = text.match(/第([一二三四五六七八九十\d]+)[季期部話]/);
  if (cnMatch) {
    const num = cnMatch[1];
    if (/^\d+$/.test(num)) return parseInt(num, 10);
    return parseChineseNumber(num) || null;
  }

  // 2. 英文 Season 數字
  const seasonMatch = text.match(/Season\s*(\d+)/i);
  if (seasonMatch) return parseInt(seasonMatch[1], 10);

  // 3. S數字（需單詞邊界）
  const sMatch = text.match(/\bS(\d{1,2})\b/i);
  if (sMatch) return parseInt(sMatch[1], 10);

  // 4. Part 數字
  const partMatch = text.match(/Part\s*(\d+)/i);
  if (partMatch) return parseInt(partMatch[1], 10);

  return null;
}

/**
 * 標準化文字：去空格、轉小寫、繁轉簡、日文助詞轉中文（用於比較）
 */
function normalize(text: string): string {
  return convertT2S(
    text
      .replaceAll(' ', '')
      .toLowerCase()
      // 日文助詞標準化：讓含日文 の 的標題能匹配中文 的
      .replace(/の/g, '的')
      .replace(/は/g, '')
      .replace(/を/g, '')
      .replace(/と/g, '和')
  );
}

/**
 * 判斷 vodName 是否與 query 匹配。
 *
 * 匹配規則（優先順序）：
 * 1. 互相包含（精確包含）
 * 2. LCS >= 4 且 LCS / min(len(vodName), len(query)) >= 0.5
 *    （且兩個字串長度都必須 >= 4 才啟用 LCS 比對，防止短字串誤觸）
 */
import { generateSearchVariants } from '@/lib/chinese';

export function isFuzzyMatch(vodName: string, query: string): boolean {
  if (!vodName || !query) return false;

  // 季數感知：如果 query 和 vodName 都有季數標記且不同，直接拒絕
  const querySeason = extractSeasonNumber(query);
  const nameSeason = extractSeasonNumber(vodName);
  if (
    querySeason !== null &&
    nameSeason !== null &&
    querySeason !== nameSeason
  ) {
    return false;
  }

  const normName = normalize(vodName);

  // 清理常見干擾後綴（不含季數，季數已在上面處理）
  const cleanSuffixes =
    /(的故事|動畫版|动画版|真人版|劇場版|剧场版|Part\s*\d+|\d+期)/gi;
  const cleanQuery = query.replace(cleanSuffixes, '').trim() || query;

  // 生成變體：有季數時只用原始 query 的變體，避免去掉季數後匹配到其他季
  const variants = new Set([...generateSearchVariants(query)]);
  if (querySeason === null) {
    generateSearchVariants(cleanQuery).forEach((v) => variants.add(v));
  }

  // 查詢有季數但結果無季數時，使用更嚴格的匹配方向
  const strictDirection = querySeason !== null && nameSeason === null;

  for (const variant of Array.from(variants)) {
    const normQuery = normalize(variant);
    if (!normQuery) continue;

    // 精確包含（繁簡統一後）
    if (strictDirection) {
      // 查詢有季數但結果無：只允許結果包含查詢的方向
      if (normName.includes(normQuery)) return true;
    } else {
      if (normName.includes(normQuery) || normQuery.includes(normName))
        return true;
    }

    // LCS 模糊比對：查詢有季數時以查詢長度為分母，要求更高覆蓋
    if (normName.length >= 4 && normQuery.length >= 4) {
      const lcsLen = getLCS(normName, normQuery);
      const minLen = Math.min(normName.length, normQuery.length);
      const denominator = strictDirection ? normQuery.length : minLen;
      if (lcsLen >= 4 && denominator > 0 && lcsLen / denominator >= 0.5) {
        return true;
      }
    }
  }

  return false;
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

export const VERSION = 'v1.6.3';
export const UPDATE_DATE = '2026-05-22';
