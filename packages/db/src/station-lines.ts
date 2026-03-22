/**
 * 駅名 → 路線名のマッピングマスタ
 * バー・イベント検索で利用する路線フィルターのデータソース
 */

export type StationLineEntry = {
  station: string;
  lines: string[];
};

export const STATION_LINES: StationLineEntry[] = [
  // 東京都心
  { station: "渋谷", lines: ["JR山手線", "東急東横線", "東急田園都市線", "東京メトロ銀座線", "東京メトロ半蔵門線", "東京メトロ副都心線", "京王井の頭線"] },
  { station: "新宿", lines: ["JR山手線", "JR中央線", "JR埼京線", "東京メトロ丸ノ内線", "都営新宿線", "都営大江戸線", "小田急線", "京王線"] },
  { station: "池袋", lines: ["JR山手線", "JR埼京線", "東京メトロ丸ノ内線", "東京メトロ有楽町線", "東京メトロ副都心線", "西武池袋線", "東武東上線"] },
  { station: "品川", lines: ["JR山手線", "JR京浜東北線", "JR東海道線", "JR横須賀線", "京急本線"] },
  { station: "上野", lines: ["JR山手線", "JR京浜東北線", "JR上野東京ライン", "東京メトロ銀座線", "東京メトロ日比谷線"] },
  { station: "秋葉原", lines: ["JR山手線", "JR中央線", "JR総武線", "東京メトロ日比谷線", "つくばエクスプレス"] },
  { station: "東京", lines: ["JR山手線", "JR中央線", "JR京浜東北線", "JR東海道線", "JR横須賀線", "東京メトロ丸ノ内線", "東海道新幹線"] },
  { station: "有楽町", lines: ["JR山手線", "JR京浜東北線", "東京メトロ有楽町線"] },
  { station: "新橋", lines: ["JR山手線", "JR京浜東北線", "JR東海道線", "東京メトロ銀座線", "都営浅草線", "ゆりかもめ"] },
  { station: "浜松町", lines: ["JR山手線", "JR京浜東北線", "東京モノレール"] },
  { station: "大崎", lines: ["JR山手線", "JR埼京線", "りんかい線"] },
  { station: "五反田", lines: ["JR山手線", "東急池上線", "都営浅草線"] },
  { station: "目黒", lines: ["JR山手線", "東急目黒線", "東京メトロ南北線", "都営三田線"] },
  { station: "恵比寿", lines: ["JR山手線", "JR埼京線", "東京メトロ日比谷線"] },
  { station: "代官山", lines: ["東急東横線"] },
  { station: "中目黒", lines: ["東急東横線", "東京メトロ日比谷線"] },
  { station: "自由が丘", lines: ["東急東横線", "東急大井町線"] },
  { station: "二子玉川", lines: ["東急田園都市線", "東急大井町線"] },
  { station: "溝の口", lines: ["東急田園都市線", "東急大井町線", "JR南武線"] },
  { station: "たまプラーザ", lines: ["東急田園都市線"] },
  { station: "あざみ野", lines: ["東急田園都市線", "横浜市営地下鉄ブルーライン"] },
  { station: "表参道", lines: ["東京メトロ銀座線", "東京メトロ千代田線", "東京メトロ半蔵門線"] },
  { station: "青山一丁目", lines: ["東京メトロ銀座線", "東京メトロ半蔵門線", "都営大江戸線"] },
  { station: "六本木", lines: ["東京メトロ日比谷線", "都営大江戸線"] },
  { station: "六本木一丁目", lines: ["東京メトロ南北線"] },
  { station: "麻布十番", lines: ["東京メトロ南北線", "都営大江戸線"] },
  { station: "赤坂見附", lines: ["東京メトロ銀座線", "東京メトロ丸ノ内線"] },
  { station: "赤坂", lines: ["東京メトロ千代田線"] },
  { station: "乃木坂", lines: ["東京メトロ千代田線"] },
  { station: "明治神宮前", lines: ["東京メトロ千代田線", "東京メトロ副都心線"] },
  { station: "北参道", lines: ["東京メトロ副都心線"] },
  { station: "代々木上原", lines: ["東京メトロ千代田線", "小田急線"] },
  { station: "下北沢", lines: ["小田急線", "京王井の頭線"] },
  { station: "三軒茶屋", lines: ["東急田園都市線", "東急世田谷線"] },
  { station: "吉祥寺", lines: ["JR中央線", "JR総武線", "京王井の頭線"] },
  { station: "荻窪", lines: ["JR中央線", "JR総武線", "東京メトロ丸ノ内線"] },
  { station: "高円寺", lines: ["JR中央線", "JR総武線"] },
  { station: "中野", lines: ["JR中央線", "JR総武線", "東京メトロ東西線"] },
  { station: "新宿三丁目", lines: ["東京メトロ丸ノ内線", "東京メトロ副都心線", "都営新宿線"] },
  { station: "西新宿", lines: ["都営大江戸線"] },
  { station: "神楽坂", lines: ["東京メトロ東西線"] },
  { station: "飯田橋", lines: ["JR中央線", "JR総武線", "東京メトロ東西線", "東京メトロ有楽町線", "東京メトロ南北線", "都営大江戸線"] },
  { station: "市ヶ谷", lines: ["JR中央線", "JR総武線", "東京メトロ有楽町線", "東京メトロ南北線", "都営新宿線"] },
  { station: "四ツ谷", lines: ["JR中央線", "JR総武線", "東京メトロ丸ノ内線", "東京メトロ南北線"] },
  { station: "御茶ノ水", lines: ["JR中央線", "JR総武線", "JR中央本線", "東京メトロ丸ノ内線"] },
  { station: "神保町", lines: ["東京メトロ半蔵門線", "都営三田線", "都営新宿線"] },
  { station: "日比谷", lines: ["東京メトロ日比谷線", "東京メトロ千代田線", "都営三田線"] },
  { station: "銀座", lines: ["東京メトロ銀座線", "東京メトロ丸ノ内線", "東京メトロ日比谷線"] },
  { station: "築地", lines: ["東京メトロ日比谷線"] },
  { station: "月島", lines: ["東京メトロ有楽町線", "都営大江戸線"] },
  { station: "豊洲", lines: ["東京メトロ有楽町線", "ゆりかもめ"] },
  { station: "お台場海浜公園", lines: ["ゆりかもめ"] },
  { station: "国際展示場", lines: ["りんかい線"] },
  { station: "浅草", lines: ["東京メトロ銀座線", "都営浅草線", "東武スカイツリーライン", "つくばエクスプレス"] },
  { station: "押上", lines: ["東京メトロ半蔵門線", "都営浅草線", "東武スカイツリーライン", "京成押上線"] },
  { station: "北千住", lines: ["JR常磐線", "東京メトロ日比谷線", "東京メトロ千代田線", "東武スカイツリーライン", "つくばエクスプレス"] },
  { station: "錦糸町", lines: ["JR中央線", "JR総武線", "東京メトロ半蔵門線"] },
  { station: "亀戸", lines: ["JR中央線", "JR総武線", "東武亀戸線"] },
  // 横浜・神奈川
  { station: "横浜", lines: ["JR京浜東北線", "JR東海道線", "JR横須賀線", "JR横浜線", "東急東横線", "横浜市営地下鉄ブルーライン", "横浜市営地下鉄グリーンライン", "相鉄線", "京急本線", "みなとみらい線"] },
  { station: "みなとみらい", lines: ["みなとみらい線"] },
  { station: "元町・中華街", lines: ["みなとみらい線"] },
  { station: "川崎", lines: ["JR京浜東北線", "JR東海道線", "JR南武線", "京急本線"] },
  { station: "武蔵小杉", lines: ["JR横須賀線", "JR南武線", "東急東横線", "東急目黒線"] },
  // 大阪
  { station: "梅田", lines: ["阪急神戸線", "阪急京都線", "阪急宝塚線", "大阪メトロ御堂筋線"] },
  { station: "大阪梅田", lines: ["阪急神戸線", "阪急京都線", "阪急宝塚線"] },
  { station: "大阪", lines: ["JR大阪環状線", "JR東海道線", "JR東西線", "大阪メトロ御堂筋線"] },
  { station: "難波", lines: ["大阪メトロ御堂筋線", "大阪メトロ千日前線", "大阪メトロ四つ橋線", "近鉄難波線", "南海本線"] },
  { station: "心斎橋", lines: ["大阪メトロ御堂筋線", "大阪メトロ長堀鶴見緑地線"] },
  { station: "天王寺", lines: ["JR大阪環状線", "JR阪和線", "大阪メトロ御堂筋線", "大阪メトロ谷町線", "近鉄南大阪線"] },
  { station: "北浜", lines: ["大阪メトロ堺筋線", "京阪本線"] },
  { station: "本町", lines: ["大阪メトロ御堂筋線", "大阪メトロ中央線", "大阪メトロ四つ橋線"] },
  // 名古屋
  { station: "名古屋", lines: ["JR東海道線", "JR中央線", "名鉄名古屋本線", "近鉄名古屋線", "地下鉄東山線", "地下鉄桜通線", "あおなみ線"] },
  { station: "栄", lines: ["地下鉄東山線", "地下鉄名城線"] },
  // 福岡
  { station: "博多", lines: ["JR山陽新幹線", "JR鹿児島本線", "福岡市営地下鉄空港線"] },
  { station: "天神", lines: ["福岡市営地下鉄空港線", "福岡市営地下鉄七隈線", "西鉄大牟田線"] },
];

/**
 * 駅名から路線一覧を返す
 */
export function getLinesByStation(station: string): string[] {
  return STATION_LINES.find((s) => s.station === station)?.lines ?? [];
}

/**
 * 路線名から駅名一覧を返す
 */
export function getStationsByLine(line: string): string[] {
  return STATION_LINES.filter((s) => s.lines.includes(line)).map((s) => s.station);
}

/**
 * マスタ内の全路線名一覧を返す（重複なし・ソート済み）
 */
export function getAllLines(): string[] {
  const lineSet = new Set<string>();
  for (const entry of STATION_LINES) {
    for (const line of entry.lines) {
      lineSet.add(line);
    }
  }
  return Array.from(lineSet).sort();
}
