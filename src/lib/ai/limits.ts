// チャット入力の上限。クライアント(入力欄の maxLength)とサーバー(リクエスト検証)で共有するため
// zod を含めないこと。値の変更は環境変数ではなくコード変更(レビュー対象)で行う。

/** リクエストボディの最大サイズ(バイト)。超えると 413 */
export const MAX_REQUEST_BYTES = 512 * 1024;

/** 1 リクエストに含められる会話履歴の最大メッセージ数 */
export const MAX_MESSAGES = 50;

/** 1 メッセージあたりの最大パート数(ツール呼び出しを含むアシスタント応答を見込んだ値) */
export const MAX_PARTS_PER_MESSAGE = 32;

/** ユーザーが送る 1 テキストパートの最大文字数 */
export const MAX_USER_TEXT_CHARS = 8000;
