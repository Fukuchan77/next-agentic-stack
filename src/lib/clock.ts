// 現在時刻の取得を 1 か所に集約する。ツール・レート制限などは Clock を引数で受け取り、
// テストでは固定時刻を返す関数を渡して結果を決定的にする(`new Date()` を直接呼ばない)。
export type Clock = () => Date;

export const systemClock: Clock = () => new Date();
