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
    詳細：https://ai.google.dev/gemini-api/docs/models?hl=ja
    gemini-3-flash-preview or gemini-3-pro-preview

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
