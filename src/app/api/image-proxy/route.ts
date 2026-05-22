import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// SSRF 防護：私有/內部 IP 地址段
const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fd00:/,
  /^fe80:/,
];

function isValidImageUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);

    // 只允许 http 和 https 协议
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    // SSRF 防護：阻擋私有/內部 IP
    const hostname = url.hostname;
    if (PRIVATE_IP_RANGES.some((r) => r.test(hostname))) {
      return false;
    }

    // 阻擋 localhost
    if (hostname === 'localhost' || hostname === '0.0.0.0') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
  }

  // SSRF 防護：驗證 URL 合法性
  if (!isValidImageUrl(imageUrl)) {
    return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
  }

  try {
    const reqHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    };

    // 針對常見圖片域名設定對應 Referer
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
      } catch {
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

    const headers = new Headers();
    if (contentType) {
      headers.set('Content-Type', contentType);
    }

    // 緩存半年
    headers.set('Cache-Control', 'public, max-age=15720000, s-maxage=15720000');
    headers.set('CDN-Cache-Control', 'public, s-maxage=15720000');
    headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=15720000');
    headers.set('Netlify-Vary', 'query');

    return new Response(imageResponse.body, {
      status: 200,
      headers,
    });
  } catch {
    return NextResponse.json(
      { error: 'Error fetching image' },
      { status: 500 }
    );
  }
}
