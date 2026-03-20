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
        text: '機能仕様',
        collapsed: true,
        items: [
          { text: '機能一覧', link: '/features/' },
          { text: 'バー一覧・検索・詳細', link: '/features/bar-search' },
          { text: '店舗作成・プロフィール設定', link: '/features/store-creation' },
          { text: '自店舗カレンダー', link: '/features/store-calendar' },
          { text: 'イベント作成・下書き保存', link: '/features/event-creation' },
          { text: '公開リクエスト承認・自動許可設定', link: '/features/event-approval' },
          { text: 'イベント一覧・検索', link: '/features/event-search' },
          { text: 'イベント参加表明', link: '/features/event-participation' },
          { text: '主催履歴・公開設定', link: '/features/organizer-history' },
          { text: 'イベンターへの支払い履歴', link: '/features/eventer-payment' },
          { text: 'クーポン発行機能', link: '/features/coupon' },
          { text: '通知', link: '/features/notifications' },
          { text: 'フードガイド', link: '/features/food-guide' },
          { text: 'イベント分析（Premium）', link: '/features/event-analytics' },
        ],
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
