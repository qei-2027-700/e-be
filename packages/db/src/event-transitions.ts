export type StoredStatus =
  | 'draft'
  | 'pending'
  | 'published'
  | 'cancelled'
  | 'rejected';

export type DisplayStatus = StoredStatus | 'ongoing' | 'completed';

export type UserRole = 'user' | 'org:owner' | 'org:member' | 'platform:admin';

interface EventData {
  status: StoredStatus;
  startAt: Date | null;
  endAt: Date | null;
}

/**
 * DBの保存ステータスと現在時刻から表示用ステータスを導出する
 */
export function resolveStatus(event: EventData, now: Date = new Date()): DisplayStatus {
  if (event.status !== 'published') return event.status;
  if (!event.startAt || !event.endAt) return 'published';

  if (now >= event.endAt) return 'completed';
  if (now >= event.startAt) return 'ongoing';
  return 'published';
}

/**
 * ステータス遷移が可能か判定する
 * @param from 現在のステータス
 * @param to 遷移先のステータス
 * @param role 操作者のロール
 * @param hasPermission バーからの事前許可があるか (イベンターの場合)
 */
export function canTransition(
  from: StoredStatus,
  to: StoredStatus,
  role: UserRole,
  hasPermission: boolean = false
): boolean {
  if (from === to) return true;

  // 管理者は常に可能（要件によるが一旦シンプルに）
  if (role === 'platform:admin') return true;

  switch (from) {
    case 'draft':
      if (to === 'pending') return true; // 全ユーザー可能
      if (to === 'published') {
        // 主催者許可がある場合、または店舗関係者の場合は直接公開可能
        return hasPermission || role === 'org:owner' || role === 'org:member';
      }
      return false;

    case 'pending':
      // 店舗関係者のみ承認・却下が可能
      if (role === 'org:owner' || role === 'org:member') {
        return to === 'published' || to === 'rejected';
      }
      return false;

    case 'published':
      // 開始前なら主催者・店舗関係者ともにキャンセル可能
      // ongoing 中は店舗関係者のみキャンセル可能（要件: decisions.md #3）
      return to === 'cancelled';

    case 'rejected':
      // 却下されたものは再度 pending (修正して再申請) または draft へ
      return to === 'pending' || to === 'draft';

    case 'cancelled':
      // キャンセル済みからの遷移は不可
      return false;

    default:
      return false;
  }
}
