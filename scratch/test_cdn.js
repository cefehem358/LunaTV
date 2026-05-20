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
      data.items.slice(0, 5).forEach((item, idx) => {
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
  // Test 1: movie/recommend on cmliussss.net
  await test(
    'https://m.douban.cmliussss.net/rexxar/api/v2/movie/recommend?refresh=0&start=0&count=10&selected_categories=%7B%22%E7%B1%BB%E5%9E%8B%22%3A%22%E5%8A%A8%E7%94%BB%22%7D&uncollect=false&score_range=0,10&tags=%E5%8A%A8%E7%94%BB'
  );

  // Test 2: movie/recommend on cmliussss.com
  await test(
    'https://m.douban.cmliussss.com/rexxar/api/v2/movie/recommend?refresh=0&start=0&count=10&selected_categories=%7B%22%E7%B1%BB%E5%9E%8B%22%3A%22%E5%8A%A8%E7%94%BB%22%7D&uncollect=false&score_range=0,10&tags=%E5%8A%A8%E7%94%BB'
  );

  // Test 3: tv/recommend on cmliussss.net (Anime TV)
  await test(
    'https://m.douban.cmliussss.net/rexxar/api/v2/tv/recommend?refresh=0&start=0&count=10&selected_categories=%7B%22%E7%B1%BB%E5%9E%8B%22%3A%22%E5%8A%A8%E7%94%BB%22%2C%22%E5%BD%A2%E5%BC%8F%22%3A%22%E7%94%B5%E8%A7%8F%E5%89%A7%22%7D&uncollect=false&score_range=0,10&tags=%E5%8A%A8%E7%94%BB'
  );
}

run();
