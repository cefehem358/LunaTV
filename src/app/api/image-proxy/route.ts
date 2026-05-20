import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// OrionTV 兼容接口
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
  }

  try {
    const reqHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    };

    if (imageUrl.includes('doubanio.com')) {
      reqHeaders['Referer'] = 'https://movie.douban.com/';
    } else if (
      imageUrl.includes('iqiyipic.com') ||
      imageUrl.includes('iqiyi.com')
    ) {
      reqHeaders['Referer'] = 'https://www.iqiyi.com/';
    } else if (imageUrl.includes('qpic.cn') || imageUrl.includes('qq.com')) {
      reqHeaders['Referer'] = 'https://v.qq.com/';
    } else if (
      imageUrl.includes('ykimg.com') ||
      imageUrl.includes('youku.com')
    ) {
      reqHeaders['Referer'] = 'https://www.youku.com/';
    } else {
      try {
        const urlObj = new URL(imageUrl);
        reqHeaders['Referer'] = urlObj.origin;
      } catch (e) {
        // ignore
      }
    }

    const imageResponse = await fetch(imageUrl, { headers: reqHeaders });

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: imageResponse.statusText },
        { status: imageResponse.status }
      );
    }

    const contentType = imageResponse.headers.get('content-type');

    if (!imageResponse.body) {
      return NextResponse.json(
        { error: 'Image response has no body' },
        { status: 500 }
      );
    }

    // 創建響應頭
    const headers = new Headers();
    if (contentType) {
      headers.set('Content-Type', contentType);
    }

    // 設置緩存頭（可選）
    headers.set('Cache-Control', 'public, max-age=15720000, s-maxage=15720000'); // 緩存半年
    headers.set('CDN-Cache-Control', 'public, s-maxage=15720000');
    headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=15720000');
    headers.set('Netlify-Vary', 'query');

    // 直接返回圖片流
    return new Response(imageResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching image' },
      { status: 500 }
    );
  }
}
