# gemini_sample

Geminiへ投げる最小サンプル。  

## 概要

プログラムからGeminiに投げるためのサンプルです。  

## セットアップ

config_sample.jsonをコピーしてconfig.jsonを作成  
```
$ cp config_sample.json config.json
```
config.jsonを書き換える。  
* google_api_key : APIキーを設定  
* model_name : 任意文字列(gemini flash など)  
実行用のDockerイメージをビルド  
```
$ docker build -t gemini-sample .
```

## 使い方

```
$ docker run --rm -v ${PWD}/config.json:/app/config.json gemini-sample "ここにプロンプト"
```

## ライセンス

MIT License
