/**
 * LunaTV 智慧搜尋與繁簡容錯核心引擎 - v1.4.0
 */
const rawS2tPairs =
  '阳陽 陆陸 龟龜 欺诈欺詐 诈欺詐欺 委员委員 裙裙 戏戲 游戏遊戲 废废 柴柴 木木 头頭 与與 和和 漫漫 画畫 动動 漫漫';

const s2tMap = new Map<string, string>();
const t2sMap = new Map<string, string>();

rawS2tPairs.split(' ').forEach((pair) => {
  if (pair.length >= 2) {
    const [simplified, traditional] = pair.split('');
    s2tMap.set(simplified, traditional);
    t2sMap.set(traditional, simplified);
  }
});

export function convertS2T(text: string): string {
  if (!text) return '';
  return text.split('').map((char) => s2tMap.get(char) ?? char).join('');
}

export function convertT2S(text: string): string {
  if (!text) return '';
  return text.split('').map((char) => t2sMap.get(char) ?? char).join('');
}

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

export function isFuzzyMatch(vodName: string, query: string): boolean {
  if (!vodName || !query) return false;
  const nameT = convertS2T(vodName);
  const nameS = convertT2S(vodName);
  const queryT = convertS2T(query);
  const queryS = convertT2S(query);

  if (nameT.includes(queryT) || queryT.includes(nameT)) return true;
  if (nameS.includes(queryS) || queryS.includes(nameS)) return true;

  const queryTokens = getCoreTokens(query);
  const nameTokens = getCoreTokens(vodName);

  const anyTokenMatch = queryTokens.some((token) =>
    nameT.includes(convertS2T(token)) || nameS.includes(convertT2S(token))
  );
  if (anyTokenMatch) return true;

  return nameTokens.some(
    (token) =>
      queryT.includes(convertS2T(token)) || queryS.includes(convertT2S(token))
  );
}

export const VERSION = 'v1.4.0';
export const UPDATE_DATE = '2026-05-21';