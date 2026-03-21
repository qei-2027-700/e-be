export const NOTIFICATION_TYPES = {
  EVENT_PENDING: 'event_pending', // 店舗向け：新規開催申請
  EVENT_APPROVED: 'event_approved', // 主催者向け：承認
  EVENT_REJECTED: 'event_rejected', // 主催者向け：却下
  EVENT_CANCELLED: 'event_cancelled', // 関係者向け：キャンセル
  NEW_COUPON: 'new_coupon', // ユーザー向け：新規クーポン配布
  OWNERSHIP_TRANSFERRED: 'ownership_transferred', // メンバー向け：権限移譲
  PARTICIPATION_RECEIVED: 'participation_received', // 主催者向け：参加表明受領
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export interface NotificationPayload {
  eventId?: string;
  orgId?: string;
  couponId?: string;
  url?: string;
}
