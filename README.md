# gemini_sample

Geminiへ投げる最小サンプル。  

## 概要

このパッケージは、YDLiDARから取得したスキャンデータをリアルタイムでAWS API（またはその他のREST API）に送信します。

## セットアップ

config_sample.jsonをコピーしてconfig.jsonを作成  
```
$ cp config_sample.json config.json
```
config.jsonを書き換える。  
* google_api_key : APIキーを設定  
* model_name : 任意文字列(gemini flash など)  


## ライセンス

MIT License
