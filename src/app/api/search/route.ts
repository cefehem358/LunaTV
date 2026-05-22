/* eslint-disable @typescript-eslint/no-explicit-any,no-console */

import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { generateSearchVariants } from '@/lib/chinese';
import { getAvailableApiSites, getCacheTime, getConfig } from '@/lib/config';
import { cleanQueryForApi, searchFromApi } from '@/lib/downstream';
import { convertS2T, convertT2S } from '@/lib/s2t';
import { yellowWords } from '@/lib/yellow';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const authInfo = getAuthInfoFromCookie(request);
  if (!authInfo || !authInfo.username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    const cacheTime = await getCacheTime();
    return NextResponse.json(
      { results: [] },
      {
        headers: {
          'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}`,
          'CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Netlify-Vary': 'query',
        },
      }
    );
  }

  const config = await getConfig();
  const apiSites = await getAvailableApiSites(authInfo.username);

  const cleanedOriginal = cleanQueryForApi(query);
  const simplifiedCleaned = convertT2S(cleanedOriginal);

  const searchVariantsSet = new Set<string>();

  // 1. 原始清理後的名字與原始輸入名字
  searchVariantsSet.add(cleanedOriginal);
  searchVariantsSet.add(query);

  // 2. 基於原始/清理/簡化名字提取變體
  generateSearchVariants(query).forEach((v) => searchVariantsSet.add(v));
  generateSearchVariants(cleanedOriginal).forEach((v) =>
    searchVariantsSet.add(v)
  );
  generateSearchVariants(simplifiedCleaned).forEach((v) =>
    searchVariantsSet.add(v)
  );

  // 3. 為目前所有變體擴充繁簡版本，保證 CMS 能精確對應
  const allCurrentVariants = Array.from(searchVariantsSet);
  allCurrentVariants.forEach((v) => {
    searchVariantsSet.add(convertS2T(v));
    searchVariantsSet.add(convertT2S(v));
  });

  // 4. 日文助詞替換展間（如「の」->「的」）
  const checkJapaneseStr = cleanedOriginal + ' ' + query;
  if (
    checkJapaneseStr.includes('の') ||
    checkJapaneseStr.includes('を') ||
    checkJapaneseStr.includes('と') ||
    checkJapaneseStr.includes('は')
  ) {
    const processJapanese = (str: string) => {
      return str
        .replace(/の/g, '的')
        .replace(/は/g, '')
        .replace(/を/g, '')
        .replace(/と/g, '和');
    };

    const jCleaned = processJapanese(cleanedOriginal);
    const jOriginal = processJapanese(query);

    [jCleaned, jOriginal].forEach((jv) => {
      if (jv && jv !== cleanedOriginal && jv !== query) {
        searchVariantsSet.add(jv);
        searchVariantsSet.add(convertS2T(jv));
        searchVariantsSet.add(convertT2S(jv));
        generateSearchVariants(jv).forEach((v) => {
          searchVariantsSet.add(v);
          searchVariantsSet.add(convertS2T(v));
          searchVariantsSet.add(convertT2S(v));
        });
      }
    });
  }

  const searchVariants = Array.from(searchVariantsSet);

  const searchPromises = apiSites.map((site) =>
    Promise.race([
      searchFromApi(site, cleanedOriginal, searchVariants),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${site.name} timeout`)), 20000)
      ),
    ]).catch((err) => {
      console.warn(`搜索失敗 ${site.name}:`, err.message);
      return [];
    })
  );

  try {
    const results = await Promise.allSettled(searchPromises);
    const successResults = results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => (result as PromiseFulfilledResult<any>).value);
    let flattenedResults = successResults.flat();
    if (!config.SiteConfig.DisableYellowFilter) {
      flattenedResults = flattenedResults.filter((result) => {
        const typeName = result.type_name || '';
        return !yellowWords.some((word: string) => typeName.includes(word));
      });
    }
    const cacheTime = await getCacheTime();

    if (flattenedResults.length === 0) {
      // no cache if empty
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    return NextResponse.json(
      { results: flattenedResults },
      {
        headers: {
          'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}`,
          'CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Netlify-Vary': 'query',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error: '搜索失敗' }, { status: 500 });
  }
}
