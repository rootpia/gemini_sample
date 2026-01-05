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
    [Google AI Studio](https://aistudio.google.com/)にアクセスし、自身のアカウントでサインインする。  
    左上のハンバーガーメニューの下部の「Get API key」を押下。  
    遷移したページで「APIキーを作成」を押下し、「プロジェクトを作成」を選択。キー名の設定は任意（空白でもよい）。
* model_name : 利用するモデル。時期によって恐らく変わるため注意。  
    gemini-3-flash-preview or gemini-3-pro-preview  
    詳細：https://ai.google.dev/gemini-api/docs/models?hl=ja

実行用のDockerイメージをビルド  
```
$ docker build -t gemini-sample .
```

## 使い方

### 1回のみ返答(run1.sh)  
```shell
$ sudo docker run --rm -v ${PWD}/config.json:/app/config.json gemini-sample "ここにプロンプト"
```

### 対話(run2.sh)  
```shell
$ sudo docker run --rm -v ${PWD}/config.json:/app/config.json gemini-sample
```

### WebAPI(run3.sh)  
```
$ sudo docker run --rm -v ${PWD}/config.json:/app/config.json -p 8888:8888 --entrypoint python gemini-sample /app/main.py
```
別のターミナルから以下実行で動作確認する  
```shell
$ curl http://127.0.0.1:8888/chat --json '{"message": "こんにちは"}'
```
curlバージョンが古いとjsonオプションがない。その場合は以下。  
```shell
$ curl -X POST http://127.0.0.1:8888/chat \
       -H "Content-Type: application/json" \
       -d '{"message": "こんにちは"}'
```
Powershellの場合は以下。  
```shell
$ $body = @{ message = "こんにちは" } | ConvertTo-Json
$ Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8888/chat" -Body $body -ContentType "application/json"
```

## ライセンス

MIT License
