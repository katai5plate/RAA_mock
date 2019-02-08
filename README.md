# RAA_mock
**R**PG **A**tsumaru **A**PI **M**ock-up **E**ngine / RPGアツマールAPIのモックプラグイン

## ダウンロード
https://github.com/katai5plate/RAA_mock/tree/master/dist

## 使い方
1. プラグイン設定画面で、`H2A_RAA_core.js`の下に他の`H2A_RAA_**.js`が来るように設定し、`ON`にします
2. テストプレイ時に`F8`キーを押してデバッグコンソールを開き、`console.log(!!RAA&&!!RPGAtsumaru);`を入力し`true`が表示されたら導入成功です。

## リファレンス
### RAA.check() => { result, ?error }
- 疑似サーバーに空のリクエストを送信します。

|返り値|型|説明|
|-|-|-|
|result|boolean|正常なレスポンスか|
|(error)|RAA.errors|(result が false のとき)エラー内容|

### RAA.request({?waitTime, ?post, ?checkValid, ?succeeded, ?feiled, ?noCheck}) => Promise\<any\>
- 疑似サーバーにリクエストを送信します。
- 時間・成功時処理・失敗時処理のあるPromiseを生成します。

|引数|型|初期値|説明|
|-|-|-|-|
|(waitTime)|number|RAA.responseTime.normal|レスポンスが返ってくる時間|
|(post)|any|{}|送信するデータ|
|(checkValid)|post => boolean|arg => !!arg|第一引数をpostとして、成否を返す|
|(succeeded)|any|{}|成功時のレスポンス内容|
|(feiled)|any|RAA.errors.BAD_REQUEST|失敗時のレスポンス内容|
|(noCheck)|boolean|false|(未実装)RAA.check()を行わない|

|返り値|型|説明|
|-|-|-|
||Promise\<any\>|処理状態|

### RAA.modal({ message, ?decorate, ?checkValid }) => void
- 疑似サーバーにモーダルを開くリクエストを送信します。
- `message`が疑似サーバーにPOSTされ、`checkValid`が`true`の時、`decorate`の出力結果が適用されます。

|引数|型|初期値|説明|
|-|-|-|-|
|message|number||送信する文字列|
|(decorate)|message => string|arg => arg|第一引数をmesaageとして、<br>リクエスト成功時に適用する文字列を返す|
|(checkValid)|message => boolean|arg => !!arg|第一引数をmesaageとして、成否を返す|

