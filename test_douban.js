async function test(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        Referer: 'https://movie.douban.com/',
        Accept: 'application/json, text/plain, */*',
      },
    });
    const data = await res.json();
    console.log(`URL: ${url}`);
    console.log(`Status: ${res.status}`);
    console.log(`Items count: ${data.items ? data.items.length : 'N/A'}`);
    if (data.items && data.items.length > 0) {
      console.log(`Items:`);
      data.items.forEach((item, idx) => {
        console.log(
          `  ${idx}: ${item.title} (Type: ${item.type}, ID: ${item.id})`
        );
      });
    } else {
      console.log(`Response keys: ${Object.keys(data)}`);
      console.log(
        `Response snippet: ${JSON.stringify(data).substring(0, 200)}`
      );
    }
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error(`Error for ${url}:`, err.message);
  }
}

async function run() {
  // Test 1: kind=tv, category=动画, format=电视剧
  await test(
    'https://m.douban.com/rexxar/api/v2/tv/recommend?refresh=0&start=0&count=10&selected_categories=%7B%22%E7%B1%BB%E5%9E%8B%22%3A%22%E5%8A%A8%E7%94%BB%22%2C%22%E5%BD%A2%E5%BC%8F%22%3A%22%E7%94%B5%E8%A7%8F%E5%89%A7%22%7D&uncollect=false&score_range=0,10&tags=%E5%8A%A8%E7%94%BB'
  );

  // Test 2: kind=tv, category=动漫, format=电视剧
  await test(
    'https://m.douban.com/rexxar/api/v2/tv/recommend?refresh=0&start=0&count=10&selected_categories=%7B%22%E7%B1%BB%E5%9E%8B%22%3A%22%E5%8A%A8%E6%BC%A5%22%2C%22%E5%BD%A2%E5%BC%8F%22%3A%22%E7%94%B5%E8%A7%8F%E5%89%A7%22%7D&uncollect=false&score_range=0,10&tags=%E5%8A%A8%E6%BC%A5'
  );

  // Test 3: kind=tv, category=电视剧, tags=动画
  await test(
    'https://m.douban.com/rexxar/api/v2/tv/recommend?refresh=0&start=0&count=10&selected_categories=%7B%22%E7%B1%BB%E5%9E%8B%22%3A%22%E7%94%B5%E8%A7%8F%E5%89%A7%22%7D&uncollect=false&score_range=0,10&tags=%E5%8A%A8%E7%94%BB'
  );

  // Test 4: kind=movie, category=动画
  await test(
    'https://m.douban.com/rexxar/api/v2/movie/recommend?refresh=0&start=0&count=10&selected_categories=%7B%22%E7%B1%BB%E5%9E%8B%22%3A%22%E5%8A%A8%E7%94%BB%22%7D&uncollect=false&score_range=0,10&tags=%E5%8A%A8%E7%94%BB'
  );

  // Test 5: kind=movie, category=电影, tags=动画
  await test(
    'https://m.douban.com/rexxar/api/v2/movie/recommend?refresh=0&start=0&count=10&selected_categories=%7B%22%E7%B1%BB%E5%9E%8B%22%3A%22%E7%94%B5%E5%BD%B1%22%7D&uncollect=false&score_range=0,10&tags=%E5%8A%A8%E7%94%BB'
  );

  // Test 6: cmliussss.net kind=tv, category=动画, format=电视剧
  await test(
    'https://m.douban.cmliussss.net/rexxar/api/v2/tv/recommend?refresh=0&start=0&count=10&selected_categories=%7B%22%E7%B1%BB%E5%9E%8B%22%3A%22%E5%8A%A8%E7%94%BB%22%2C%22%E5%BD%A2%E5%BC%8F%22%3A%22%E7%94%B5%E8%A7%8F%E5%89%A7%22%7D&uncollect=false&score_range=0,10&tags=%E5%8A%A8%E7%94%BB'
  );

  // Test 7: cmliussss.com kind=tv, category=动画, format=电视剧
  await test(
    'https://m.douban.cmliussss.com/rexxar/api/v2/tv/recommend?refresh=0&start=0&count=10&selected_categories=%7B%22%E7%B1%BB%E5%9E%8B%22%3A%22%E5%8A%A8%E7%94%BB%22%2C%22%E5%BD%A2%E5%BC%8F%22%3A%22%E7%94%B5%E8%A7%8F%E5%89%A7%22%7D&uncollect=false&score_range=0,10&tags=%E5%8A%A8%E7%94%BB'
  );

  // Test 8: kind=tv, category=动画, format=电视剧, region=日本
  await test(
    'https://m.douban.com/rexxar/api/v2/tv/recommend?refresh=0&start=0&count=10&selected_categories=%7B%22%E7%B1%BB%E5%9E%8B%22%3A%22%E5%8A%A8%E7%94%BB%22%2C%22%E5%BD%A2%E5%BC%8F%22%3A%22%E7%94%B5%E8%A7%8F%E5%89%A7%22%2C%22%E5%9C%B0%E5%8C%BA%22%3A%22%E6%97%A5%E6%9C%AC%22%7D&uncollect=false&score_range=0,10&tags=%E5%8A%A8%E7%94%BB%2C%E6%97%A5%E6%9C%AC'
  );

  // Test 9: default TV recommend params
  await test(
    'https://m.douban.com/rexxar/api/v2/tv/recommend?refresh=0&start=0&count=10&selected_categories=%7B%22%E7%B1%BB%E5%9E%8B%22%3A%22tv%22%2C%22%E5%BD%A2%E5%BC%8F%22%3A%22undefined%22%7D&tags=tv'
  );
}

run();
