export type Plan = 'free' | 'premium';

export type Feature =
  | 'fc_request' // FCリクエスト送信
  | 'ai_export' // AI分析テキストエクスポート
  | 'analytics' // 詳細分析ダッシュボード
  | 'multi_store'; // 複数店舗管理（N店舗以上）

const PREMIUM_ONLY: Feature[] = ['fc_request', 'ai_export', 'analytics'];

/**
 * 指定されたプランで機能が利用可能か判定する
 */
export function canUseFeature(plan: Plan, feature: Feature): boolean {
  if (plan === 'premium') return true;
  return !PREMIUM_ONLY.includes(feature);
}
