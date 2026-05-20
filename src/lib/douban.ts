interface CachedDoubanEntry {
  expiresAt: number;
  data: unknown;
}

const DOUBAN_CACHE = new Map<string, CachedDoubanEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 分鐘快取生命週期

/**
 * 通用的豆瓣数据获取函数
 * @param url 请求的URL
 * @returns Promise<T> 返回指定类型的数据
 */
export async function fetchDoubanData<T>(url: string): Promise<T> {
  const now = Date.now();
  const cached = DOUBAN_CACHE.get(url);
  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  // 添加超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

  // 设置请求选项，包括信号和头部
  const fetchOptions = {
    signal: controller.signal,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      Referer: 'https://movie.douban.com/',
      Accept: 'application/json, text/plain, */*',
      Origin: 'https://movie.douban.com',
    },
  };

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // 成功後寫入快取
    DOUBAN_CACHE.set(url, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      data,
    });

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
