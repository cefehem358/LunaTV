/**
 * LunaTV 智慧搜尋與繁簡容錯核心引擎 - v1.6.4
 *
 * isFuzzyMatch 使用 LCS（最長公共子字串）嚴格比對：
 *   - 兩個字串必須互包含（substring），或
 *   - LCS 長度 >= 4，且覆蓋較短字串的 50% 以上
 * 以上均不滿足則視為不匹配，根治「點 A 搜出 B」問題。
 */
import { generateSearchVariants } from '@/lib/chinese';

import { convertT2S } from './s2t';

const SPECIAL_TITLE_KEYWORDS = [
  '特別篇',
  '特别篇',
  '外傳',
  '外传',
  '番外篇',
  '番外',
  '劇場版',
  '剧场版',
  '電影',
  '电影',
  '總集篇',
  '总集篇',
  '日記',
  '日记',
  '紅蓮之絆',
  '红莲之绊',
  '蒼海之淚',
  '苍海之泪',
  'ova',
  'oad',
];

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
  const cnMatch = text.match(/第([一二三四五六七八九十\d]+)[季期部話话集]/);
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

  // 5. 羅馬數字季數：II, III, IV, V, VI, VII, VIII, IX, X
  const romanMatch = text.match(/\s+(II|III|IV|V|VI|VII|VIII|IX|X)\b/i);
  if (romanMatch) {
    const r = romanMatch[1].toUpperCase();
    const map: Record<string, number> = {
      II: 2,
      III: 3,
      IV: 4,
      V: 5,
      VI: 6,
      VII: 7,
      VIII: 8,
      IX: 9,
      X: 10,
    };
    return map[r] || null;
  }

  // 6. 尾部空格/橫線 + 數字 (例如: "關於我轉生變成史萊姆這檔事 4" 或 "關於我轉生變成史萊姆這檔事-4")
  const trailingNumMatch = text.match(/[\s\-_](\d+)(?:$|[\s\-_【（(])/);
  if (trailingNumMatch) {
    const num = parseInt(trailingNumMatch[1], 10);
    if (num > 1 && num < 20) return num;
  }

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

function stripSeasonMarkers(text: string): string {
  return text
    .replace(/第[一二三四五六七八九十\d]+[季期部話话集]/g, '')
    .replace(/Season\s*\d+/gi, '')
    .replace(/\bS\d{1,2}\b/gi, '')
    .replace(/\s+Part\s*\d+/gi, '')
    .replace(/\s+(II|III|IV|V|VI|VII|VIII|IX|X)\b/gi, '')
    .replace(/[\s\-_](\d+)(?:$|[\s\-_【（(])/g, '')
    .trim();
}

function cleanComparableTitle(text: string): string {
  return normalize(stripSeasonMarkers(text))
    .replace(/(的故事|動畫版|动画版|真人版|劇場版|剧场版|電影版|电影版)/gi, '')
    .replace(
      /(雙語|双语|國語|国语|日語|日语|中字|字幕|無修|无修|修復|修复|未刪減|未删减|1080p|720p|4k|hevc|x264|x265|aac|uncut|bdrip|webrip|櫻花動漫|樱花动漫|藍光|蓝光|bd)/gi,
      ''
    )
    .replace(/[\s\-_,.:：，。！？【】[\]（）()《》]/g, '')
    .trim();
}

function getSpecialKeywords(text: string): string[] {
  const normalized = normalize(text);
  return SPECIAL_TITLE_KEYWORDS.filter((keyword) =>
    normalized.includes(normalize(keyword))
  );
}

export function getTitleMatchScore(vodName: string, query: string): number {
  if (!vodName || !query || !isFuzzyMatch(vodName, query)) return 0;

  const normName = normalize(vodName);
  const normQuery = normalize(query);
  const cName = cleanComparableTitle(vodName);
  const cQuery = cleanComparableTitle(query);
  const querySeason = extractSeasonNumber(query);
  const nameSeason = extractSeasonNumber(vodName);

  let score = 100;

  if (normName === normQuery) score += 500;
  if (cName && cQuery && cName === cQuery) score += 350;
  if (normName.includes(normQuery)) score += 160;
  if (normQuery.includes(normName)) score += 120;
  if (cName.includes(cQuery)) score += 120;
  if (cQuery.includes(cName)) score += 80;

  if (querySeason !== null && nameSeason === querySeason) score += 260;
  if (querySeason === null && nameSeason === null) score += 30;

  const candidateSpecials = getSpecialKeywords(vodName);
  const querySpecials = getSpecialKeywords(query);
  const hasUnexpectedSpecial = candidateSpecials.some(
    (keyword) => !querySpecials.includes(keyword)
  );
  if (hasUnexpectedSpecial) score -= querySeason !== null ? 240 : 120;

  const lcsLen = getLCS(cName, cQuery);
  const maxLen = Math.max(cName.length, cQuery.length);
  if (maxLen > 0) score += Math.round((lcsLen / maxLen) * 100);

  score -= Math.abs(cName.length - cQuery.length) * 6;

  return Math.max(1, score);
}

export function getBestTitleMatchScore(
  vodName: string,
  queries: Array<string | undefined | null>
): number {
  return queries.reduce((best, query) => {
    if (!query) return best;
    return Math.max(best, getTitleMatchScore(vodName, query));
  }, 0);
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

  // 建立乾淨的比較用標題（去除所有季數標記與常見中繼資料、繁簡轉換、去除空白）
  const cQuery = cleanComparableTitle(query);
  const cName = cleanComparableTitle(vodName);

  // 1. 如果查詢有明確季數，但結果沒有季數
  if (querySeason !== null && nameSeason === null) {
    // 如果是第二季（含）以上，但結果完全無季數標記，直接拒絕
    if (querySeason > 1) {
      return false;
    }
    // 如果是第一季，且結果沒有季數標記：為防誤配「外傳/特別篇」，結果乾淨標題長度不能比查詢長度多出 2 個字元以上
    if (cName.length > cQuery.length + 2) {
      return false;
    }
  }

  // 2. 如果結果有明確季數，但查詢沒有季數（例如查詢是特定外傳，但結果是正片某一季）
  if (querySeason === null && nameSeason !== null) {
    if (cQuery.length > cName.length + 2) {
      return false;
    }
  }

  // 3. 如果兩者都無季數標記：
  if (querySeason === null && nameSeason === null) {
    // 避免外傳/正片誤配（例如「蒼海之淚篇」與「紅蓮之絆篇」）
    if (cQuery.length > cName.length + 2) {
      return false;
    }
    // 如果不互為子字串，且不匹配字元數過多（unmatched > 3），直接拒絕
    if (!cName.includes(cQuery) && !cQuery.includes(cName)) {
      const lcsLen = getLCS(cName, cQuery);
      const maxLen = Math.max(cName.length, cQuery.length);
      if (maxLen - lcsLen > 3) {
        return false;
      }
    }
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

export const VERSION = 'v1.6.4';
export const UPDATE_DATE = '2026-05-22';
