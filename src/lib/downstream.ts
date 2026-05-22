/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_CONFIG, ApiSite, getConfig } from '@/lib/config';
import { getCachedSearchPage, setCachedSearchPage } from '@/lib/search-cache';
import { SearchResult } from '@/lib/types';
import { cleanHtmlTags } from '@/lib/utils';

import { generateSearchVariants, toDisplayLanguage } from './chinese';
import { deduplicateRequest } from './request-dedupe';
import { convertS2T, convertT2S } from './s2t';

interface ApiSearchItem {
  vod_id: string;
  vod_name: string;
  vod_pic: string;
  vod_remarks?: string;
  vod_play_url?: string;
  vod_class?: string;
  vod_year?: string;
  vod_content?: string;
  vod_douban_id?: number;
  type_name?: string;
}

export function cleanQueryForApi(rawQuery: string): string {
  if (!rawQuery) return rawQuery;

  let k = rawQuery.trim();

  // 1. 移除括號及括號內的修飾詞（如「(第一季)」「（僅限）」）
  k = k.replace(/\s*[（(][^）)]*[）)]\s*/g, '').trim();

  // 2. 日文助詞轉換：將常見日文助詞轉為中文（讓「進擊の巨人」可搜到「進擊的巨人」）
  k = k
    .replace(/の/g, '的')
    .replace(/は/g, '')
    .replace(/を/g, '')
    .replace(/と/g, '和');

  // 3. 移除結尾的常見干擾後綴（季、期、部、版等）
  k = k
    .replace(
      /([\s\u3000]*(?:第[一二三四五六七八九十\d]+[季期部話话集]|Season\s*\d+|Part\s*\d+|S\d+|動畫版|动画版|真人版|劇場版|剧场版|的故事))+$/gi,
      ''
    )
    .trim();

  // 4. 清除頭尾的標點符號和多餘空格
  k = k.replace(/^[\s\-_,.：，。！？]+|[\s\-_,.：，。！？]+$/g, '').trim();

  return k || rawQuery.trim();
}

async function searchWithCache(
  apiSite: ApiSite,
  query: string,
  page: number,
  url: string,
  timeoutMs = 8000
): Promise<{ results: SearchResult[]; pageCount?: number }> {
  const cached = getCachedSearchPage(apiSite.key, query, page);
  if (cached && cached.status === 'ok') {
    return { results: cached.data, pageCount: cached.pageCount };
  }

  const cacheKey = `${apiSite.key}::${query}::${page}`;
  return deduplicateRequest(cacheKey, async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        headers: API_CONFIG.search.headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        if (response.status === 403)
          setCachedSearchPage(apiSite.key, query, page, 'forbidden', []);
        return { results: [] };
      }
      const data = await response.json();
      if (
        !data ||
        !data.list ||
        !Array.isArray(data.list) ||
        data.list.length === 0
      ) {
        return { results: [] };
      }
      const allResults = data.list.map((item: ApiSearchItem) => {
        let episodes: string[] = [];
        let titles: string[] = [];
        if (item.vod_play_url) {
          item.vod_play_url.split('$$$').forEach((url: string) => {
            const matchEpisodes: string[] = [];
            const matchTitles: string[] = [];
            url.split('#').forEach((title_url: string) => {
              const episode_title_url = title_url.split('$');
              if (
                episode_title_url.length === 2 &&
                episode_title_url[1].endsWith('.m3u8')
              ) {
                matchTitles.push(episode_title_url[0]);
                matchEpisodes.push(episode_title_url[1]);
              }
            });
            if (matchEpisodes.length > episodes.length) {
              episodes = matchEpisodes;
              titles = matchTitles;
            }
          });
        }
        return {
          id: item.vod_id.toString(),
          title: item.vod_name.trim().replace(/\s+/g, ' '),
          poster: item.vod_pic,
          episodes,
          episodes_titles: titles,
          source: apiSite.key,
          source_name: apiSite.name,
          class: item.vod_class,
          year: item.vod_year
            ? item.vod_year.match(/\d{4}/)?.[0] || ''
            : 'unknown',
          desc: cleanHtmlTags(item.vod_content || ''),
          type_name: item.type_name,
          douban_id: item.vod_douban_id,
        };
      });
      const results = allResults.filter(
        (r: SearchResult) => r.episodes.length > 0
      );
      const pageCount = page === 1 ? data.pagecount || 1 : undefined;
      setCachedSearchPage(apiSite.key, query, page, 'ok', results, pageCount);
      return { results, pageCount };
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error?.name === 'AbortError' || error?.code === 20) {
        setCachedSearchPage(apiSite.key, query, page, 'timeout', []);
      }
      return { results: [] };
    }
  });
}

export async function searchFromApi(
  apiSite: ApiSite,
  query: string,
  precomputedVariants?: string[]
): Promise<SearchResult[]> {
  try {
    const apiBaseUrl = apiSite.api;
    let searchVariants = precomputedVariants;
    if (!searchVariants) {
      const stcasc = (await import('switch-chinese')).default;
      const converter = stcasc();
      const cleanedOriginal = cleanQueryForApi(query);
      const simplifiedQuery = converter.simplized(cleanedOriginal);
      const queryTraditional = convertS2T(cleanedOriginal);
      const querySimplified = convertT2S(cleanedOriginal);
      const searchVariantsSet = new Set<string>();

      // 添加原始清理後的 query，保證原名也能被搜尋到
      searchVariantsSet.add(cleanedOriginal);
      // 再從未清理的 query 提取變體（防止有些特殊別名需要完整 query）
      generateSearchVariants(query).forEach((v) => searchVariantsSet.add(v));

      generateSearchVariants(simplifiedQuery).forEach((v) =>
        searchVariantsSet.add(v)
      );
      generateSearchVariants(cleanedOriginal).forEach((v) =>
        searchVariantsSet.add(v)
      );
      if (queryTraditional !== cleanedOriginal)
        searchVariantsSet.add(queryTraditional);
      if (
        querySimplified !== cleanedOriginal &&
        querySimplified !== simplifiedQuery
      ) {
        searchVariantsSet.add(querySimplified);
      }
      // 日文展間：將日文助詞 の 轉為「的」，讓「進擊の巨人」能搜到「進擊的巨人」
      if (
        cleanedOriginal.includes('の') ||
        cleanedOriginal.includes('を') ||
        cleanedOriginal.includes('と')
      ) {
        const japaneseCleaned = cleanedOriginal
          .replace(/の/g, '的')
          .replace(/は/g, '')
          .replace(/を/g, '')
          .replace(/と/g, '和');
        if (japaneseCleaned !== cleanedOriginal) {
          searchVariantsSet.add(japaneseCleaned);
        }
      }
      searchVariants = Array.from(searchVariantsSet);
    }
    const variantPromises = searchVariants.map(async (variant, index) => {
      const apiUrl =
        apiBaseUrl + API_CONFIG.search.path + encodeURIComponent(variant);
      try {
        const result = await searchWithCache(apiSite, variant, 1, apiUrl, 8000);
        return {
          variant,
          index,
          results: result.results,
          pageCount: result.pageCount,
        };
      } catch {
        return { variant, index, results: [], pageCount: undefined };
      }
    });
    const variantResults = await Promise.all(variantPromises);
    const seenIds = new Set<string>();
    const results: SearchResult[] = [];
    let pageCountToFetch = 0;
    let successfulVariant = query;
    variantResults.sort((a, b) => a.index - b.index);
    for (const { results: variantData, pageCount, variant } of variantResults) {
      if (variantData.length > 0) {
        if (!pageCountToFetch && pageCount) {
          pageCountToFetch = pageCount;
          successfulVariant = variant;
        }
        variantData.forEach((result) => {
          const uniqueKey = `${result.source}_${result.id}`;
          if (!seenIds.has(uniqueKey)) {
            seenIds.add(uniqueKey);
            result.title = toDisplayLanguage(result.title);
            results.push(result);
          }
        });
      }
    }
    if (results.length === 0) return [];
    const config = await getConfig();
    const MAX_SEARCH_PAGES: number = config.SiteConfig.SearchDownstreamMaxPage;
    const pageCount = pageCountToFetch || 1;
    const pagesToFetch = Math.min(pageCount - 1, MAX_SEARCH_PAGES - 1);
    if (pagesToFetch > 0) {
      const additionalPagePromises = [];
      for (let page = 2; page <= pagesToFetch + 1; page++) {
        const pageUrl =
          apiBaseUrl +
          API_CONFIG.search.pagePath
            .replace('{query}', encodeURIComponent(successfulVariant))
            .replace('{page}', page.toString());
        const pagePromise = (async () => {
          const pageResult = await searchWithCache(
            apiSite,
            successfulVariant,
            page,
            pageUrl,
            8000
          );
          return pageResult.results;
        })();
        additionalPagePromises.push(pagePromise);
      }
      const additionalResults = await Promise.all(additionalPagePromises);
      additionalResults.forEach((pageResults) => {
        if (pageResults.length > 0) {
          pageResults.forEach((result) => {
            const uniqueKey = `${result.source}_${result.id}`;
            if (!seenIds.has(uniqueKey)) {
              seenIds.add(uniqueKey);
              result.title = toDisplayLanguage(result.title);
              results.push(result);
            }
          });
        }
      });
    }
    return results;
  } catch (error) {
    return [];
  }
}

const M3U8_PATTERN = /(https?:\/\/[^"'\s]+?\.m3u8)/g;

export async function getDetailFromApi(
  apiSite: ApiSite,
  id: string
): Promise<SearchResult> {
  if (apiSite.detail) {
    return handleSpecialSourceDetail(id, apiSite);
  }
  const detailUrl = `${apiSite.api}${API_CONFIG.detail.path}${id}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const response = await fetch(detailUrl, {
    headers: API_CONFIG.detail.headers,
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  if (!response.ok) throw new Error(`詳情請求失敗: ${response.status}`);
  const data = await response.json();
  if (
    !data ||
    !data.list ||
    !Array.isArray(data.list) ||
    data.list.length === 0
  ) {
    throw new Error('獲取到的詳情內容無效');
  }
  const videoDetail = data.list[0];
  let episodes: string[] = [];
  let titles: string[] = [];
  if (videoDetail.vod_play_url) {
    const vod_play_url_array = videoDetail.vod_play_url.split('$$$');
    vod_play_url_array.forEach((url: string) => {
      const matchEpisodes: string[] = [];
      const matchTitles: string[] = [];
      const title_url_array = url.split('#');
      title_url_array.forEach((title_url: string) => {
        const episode_title_url = title_url.split('$');
        if (
          episode_title_url.length === 2 &&
          episode_title_url[1].endsWith('.m3u8')
        ) {
          matchTitles.push(episode_title_url[0]);
          matchEpisodes.push(episode_title_url[1]);
        }
      });
      if (matchEpisodes.length > episodes.length) {
        episodes = matchEpisodes;
        titles = matchTitles;
      }
    });
  }
  if (episodes.length === 0 && videoDetail.vod_content) {
    const matches = videoDetail.vod_content.match(M3U8_PATTERN) || [];
    episodes = matches.map((link: string) => link.replace(/^\$/, ''));
  }
  return {
    id: id.toString(),
    title: videoDetail.vod_name,
    poster: videoDetail.vod_pic,
    episodes,
    episodes_titles: titles,
    source: apiSite.key,
    source_name: apiSite.name,
    class: videoDetail.vod_class,
    year: videoDetail.vod_year
      ? videoDetail.vod_year.match(/\d{4}/)?.[0] || ''
      : 'unknown',
    desc: cleanHtmlTags(videoDetail.vod_content),
    type_name: videoDetail.type_name,
    douban_id: videoDetail.vod_douban_id,
  };
}

async function handleSpecialSourceDetail(
  id: string,
  apiSite: ApiSite
): Promise<SearchResult> {
  const detailUrl = `${apiSite.detail}/index.php/vod/detail/id/${id}.html`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const response = await fetch(detailUrl, {
    headers: API_CONFIG.detail.headers,
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  if (!response.ok) throw new Error(`詳情頁請求失敗: ${response.status}`);
  const html = await response.text();
  let matches: string[] = [];
  if (apiSite.key === 'ffzy') {
    const ffzyPattern =
      /\$(https?:\/\/[^"'\s]+?\/\d{8}\/\d+_[a-f0-9]+\/index\.m3u8)/g;
    matches = html.match(ffzyPattern) || [];
  }
  if (matches.length === 0) {
    const generalPattern = /\$(https?:\/\/[^"'\s]+?\.m3u8)/g;
    matches = html.match(generalPattern) || [];
  }
  matches = Array.from(new Set(matches)).map((link: string) => {
    link = link.substring(1);
    const parenIndex = link.indexOf('(');
    return parenIndex > 0 ? link.substring(0, parenIndex) : link;
  });
  const episodes_titles = Array.from({ length: matches.length }, (_, i) =>
    (i + 1).toString()
  );
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const titleText = titleMatch ? titleMatch[1].trim() : '';
  const descMatch = html.match(
    /<div[^>]*class=["']sketch["'][^>]*>([\s\S]*?)<\/div>/
  );
  const descText = descMatch ? cleanHtmlTags(descMatch[1]) : '';
  const coverMatch = html.match(/(https?:\/\/[^"'\s]+?\.jpg)/g);
  const coverUrl = coverMatch ? coverMatch[0].trim() : '';
  const yearMatch =
    html.match(/>(\d{4})<\//)?.[1] ??
    html.match(/>(\d{4})</g)?.[0]?.match(/\d{4}/)?.[0];
  const yearText = yearMatch || 'unknown';
  return {
    id,
    title: titleText,
    poster: coverUrl,
    episodes: matches,
    episodes_titles,
    source: apiSite.key,
    source_name: apiSite.name,
    class: '',
    year: yearText,
    desc: descText,
    type_name: '',
    douban_id: 0,
  };
}
