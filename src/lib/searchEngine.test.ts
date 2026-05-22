import {
  extractSeasonNumber,
  getTitleMatchScore,
  isFuzzyMatch,
} from './searchEngine';

describe('searchEngine fuzzy match tests', () => {
  it('should not match different seasons or spin-offs', () => {
    // This is the bug reported by the user:
    const res1 = isFuzzyMatch(
      '關於我轉生變成史萊姆這檔事 蒼海之淚篇',
      '關於我轉生變成史萊姆這檔事 第四季'
    );
    expect(res1).toBe(false);
    expect(
      isFuzzyMatch(
        '關於我轉生變成史萊姆這檔事 第四季',
        '關於我轉生變成史萊姆這檔事 蒼海之淚篇'
      )
    ).toBe(false);
    expect(
      isFuzzyMatch(
        '關於我轉生變成史萊姆這檔事 蒼海之淚篇',
        '転生したらスライムだった件 第4期'
      )
    ).toBe(false);
    expect(
      isFuzzyMatch(
        '關於我轉生變成史萊姆這檔事 蒼海之淚篇',
        '転生したらスライムだった件 第四期'
      )
    ).toBe(false);

    // Cross season matches
    expect(
      isFuzzyMatch(
        '關於我轉生變成史萊姆這檔事 第二季',
        '關於我轉生變成史萊姆這檔事 第三季'
      )
    ).toBe(false);

    // General query (no season) matches specific season, but specific season query does not match unlabelled base title
    expect(
      isFuzzyMatch(
        '關於我轉生變成史萊姆這檔事 第二季',
        '關於我轉生變成史萊姆這檔事'
      )
    ).toBe(true); // general query matches specific season result
    expect(
      isFuzzyMatch(
        '關於我轉生變成史萊姆這檔事',
        '關於我轉生變成史萊姆這檔事 第二季'
      )
    ).toBe(false); // specific season query does not match base series

    // Spin-offs and different sub-chapters
    expect(
      isFuzzyMatch(
        '關於我轉生變成史萊姆這檔事 轉生史萊姆日記',
        '關於我轉生變成史萊姆這檔事'
      )
    ).toBe(true); // general search matches spin-off
    expect(
      isFuzzyMatch(
        '關於我轉生變成史萊姆這檔事',
        '關於我轉生變成史萊姆這檔事 轉生史萊姆日記'
      )
    ).toBe(false); // spin-off search should not match base series
    expect(
      isFuzzyMatch(
        '關於我轉生變成史萊姆這檔事 蒼海之淚篇',
        '關於我轉生變成史萊姆這檔事 紅蓮之絆篇'
      )
    ).toBe(false); // different spin-offs/movies
  });

  it('should match same season with spelling / simplification differences', () => {
    expect(
      isFuzzyMatch(
        '關於我轉生變成史萊姆這檔事 第四季',
        '关于我转生变成史莱姆这档事 第四季'
      )
    ).toBe(true);
    expect(
      isFuzzyMatch(
        '關於我轉生變成史萊姆這檔事 第四季 Part 2',
        '關於我轉生變成史萊姆這檔事 第四季'
      )
    ).toBe(true);
  });

  it('should match anime aliases when Bangumi provides traditional Chinese titles', () => {
    expect(
      isFuzzyMatch(
        '废柴风纪委员与裙子长度不合规的JK的故事',
        '木頭風紀委員和迷你裙JK的故事'
      )
    ).toBe(true);

    expect(
      getTitleMatchScore(
        '废柴风纪委员与裙子长度不合规的JK的故事',
        '木頭風紀委員和迷你裙JK的故事'
      )
    ).toBeGreaterThan(0);
  });

  it('should rank exact season sources above side-story movie sources', () => {
    const query = '關於我轉生變成史萊姆這檔事 第四季';

    expect(
      getTitleMatchScore('關於我轉生變成史萊姆這檔事 第四季', query)
    ).toBeGreaterThan(
      getTitleMatchScore('關於我轉生變成史萊姆這檔事 蒼海之淚篇', query)
    );
    expect(isFuzzyMatch('關於我轉生變成史萊姆這檔事 蒼海之淚篇', query)).toBe(
      false
    );
  });

  it('should extract season numbers correctly', () => {
    expect(extractSeasonNumber('關於我轉生變成史萊姆這檔事 第四季')).toBe(4);
    expect(extractSeasonNumber('關於我轉生變成史萊姆這檔事 Season 3')).toBe(3);
    expect(extractSeasonNumber('關於我轉生變成史萊姆這檔事 S2')).toBe(2);
    expect(extractSeasonNumber('關於我轉生變成史萊姆這檔事 Part 1')).toBe(1);
    expect(extractSeasonNumber('關於我轉生變成史萊姆這檔事 IV')).toBe(4);
    expect(extractSeasonNumber('關於我轉生變成史萊姆這檔事 II')).toBe(2);
    expect(extractSeasonNumber('關於我轉生變成史萊姆這檔事 5')).toBe(5);
    expect(extractSeasonNumber('關於我轉生變成史萊姆這檔事-3')).toBe(3);
    expect(extractSeasonNumber('關於我轉生變成史萊姆這檔事')).toBeNull();
  });
});
