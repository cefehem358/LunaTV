'use client';

export interface BangumiCalendarData {
  weekday: {
    en: string;
    cn?: string;
    ja?: string;
    id?: number;
  };
  items: {
    id: number;
    name: string;
    name_cn?: string;
    rating?: {
      total?: number;
      count?: Record<string, number>;
      score?: number;
    };
    air_date?: string;
    air_weekday?: number;
    rank?: number;
    images?: {
      large?: string;
      common?: string;
      medium?: string;
      small?: string;
      grid?: string;
    };
    collection?: {
      doing?: number;
    };
    url?: string;
    type?: number;
    summary?: string;
  }[];
}

export async function GetBangumiCalendarData(): Promise<BangumiCalendarData[]> {
  try {
    const response = await fetch('/api/bangumi/calendar');

    if (!response.ok) {
      console.error('获取番剧日历失败: HTTP', response.status);
      return [];
    }

    const data = await response.json();

    // Safety check: ensure API returned an array
    if (!Array.isArray(data)) {
      console.error('获取番剧日历失败: API 返回了非数组数据');
      return [];
    }

    const filteredData = data
      .filter((item: unknown): item is BangumiCalendarData => {
        return (
          item !== null &&
          typeof item === 'object' &&
          'weekday' in item &&
          'items' in item
        );
      })
      .map((item: BangumiCalendarData) => ({
        ...item,
        items: Array.isArray(item.items)
          ? item.items.filter((bangumiItem) => bangumiItem?.images)
          : [],
      }));

    return filteredData;
  } catch (error) {
    console.error('获取番剧日历失败:', error);
    return [];
  }
}
