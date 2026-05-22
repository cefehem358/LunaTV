import '@testing-library/jest-dom/extend-expect';

// Allow router mocks.
// eslint-disable-next-line no-undef
jest.mock('next/router', () => require('next-router-mock'));

jest.mock('switch-chinese', () => {
  return jest.fn().mockImplementation(() => {
    return {
      traditionalized: (text) => {
        return text
          .replace(/關於我轉生變成史萊姆這檔事/g, '关于我转生变成史莱姆这档事')
          .replace(/第四季/g, '第四季')
          .replace(/蒼海之淚篇/g, '苍海之泪篇');
      },
      simplized: (text) => {
        return text
          .replace(/關於我轉生變成史萊姆這檔事/g, '关于我转生变成史莱姆这档事')
          .replace(/第四季/g, '第四季')
          .replace(/蒼海之淚篇/g, '苍海之泪篇');
      },
    };
  });
});
