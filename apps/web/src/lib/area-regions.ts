export type AreaKey =
  | "metropolitan"
  | "shizuoka"
  | "chubu"
  | "kyushu"
  | "hokkaido"
  | "miyagi"
  | "osaka"
  | "kansai"
  | "chugoku";

export const AREA_REGIONS: Record<AreaKey, { label: string; prefectures: string[] }> = {
  metropolitan: {
    label: "首都圏",
    prefectures: ["東京都", "神奈川県", "埼玉県", "千葉県", "茨城県", "栃木県", "群馬県", "山梨県"],
  },
  shizuoka: {
    label: "静岡",
    prefectures: ["静岡県"],
  },
  chubu: {
    label: "愛知（中部）",
    prefectures: ["愛知県", "岐阜県", "三重県"],
  },
  kyushu: {
    label: "九州",
    prefectures: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"],
  },
  hokkaido: {
    label: "北海道",
    prefectures: ["北海道"],
  },
  miyagi: {
    label: "宮城",
    prefectures: ["宮城県"],
  },
  osaka: {
    label: "大阪",
    prefectures: ["大阪府"],
  },
  kansai: {
    label: "その他関西",
    prefectures: ["京都府", "兵庫県", "奈良県", "和歌山県", "滋賀県"],
  },
  chugoku: {
    label: "中国地方",
    prefectures: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
  },
};

export const AREA_KEYS = Object.keys(AREA_REGIONS) as AreaKey[];

export function areaKeyToPrefectures(areaKey: string): string[] {
  return AREA_REGIONS[areaKey as AreaKey]?.prefectures ?? [];
}
