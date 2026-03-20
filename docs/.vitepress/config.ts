import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'イーベ (E-be)',
  ignoreDeadLinks: true,
  description: '店舗と主催者をつなぐイベントバー運営プラットフォーム',
  base: '/e-be/',
  lang: 'ja',
  themeConfig: {
    nav: [
      { text: 'はじめに', link: '/getting-started' },
      { text: 'アーキテクチャ', link: '/architecture/overview' },
    ],
    sidebar: [
      {
        text: 'ガイド',
        items: [{ text: 'はじめに', link: '/getting-started' }],
      },
      {
        text: 'アーキテクチャ',
        items: [
          { text: '全体設計', link: '/architecture/overview' },
          { text: 'データベース', link: '/architecture/database' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/qei-2027-700/e-be' },
    ],
  },
})
