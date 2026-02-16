# Vercel デプロイ手順

## 前提条件
- GitHubアカウント
- Vercelアカウント（[vercel.com](https://vercel.com) で無料登録）
- このプロジェクトがGitHubリポジトリにプッシュされていること

---

## Step 1: GitHubにリポジトリをプッシュ

### 初回の場合
```bash
# GitHubで新しいリポジトリを作成（Webブラウザで）
# その後ターミナルで：
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/qa_doterra.git
git push -u origin main
```

### 既にリポジトリがある場合
```bash
git add .
git commit -m "Add password protection and pop-art header"
git push
```

> ⚠️ `.env.local` は `.gitignore` に含まれているため、GitHubにはプッシュされません（これは正常です）。

---

## Step 2: Vercelにインポート

1. [vercel.com](https://vercel.com) にログイン
2. 画面右上の **「Add New...」** → **「Project」** をクリック
3. **「Import Git Repository」** で GitHubアカウントを連携
4. 対象のリポジトリ（`qa_doterra`）の **「Import」** をクリック

---

## Step 3: 環境変数を設定

**「Environment Variables」** セクションで以下の2つを追加：

| Name | Value |
|------|-------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | `AIzaSy...（あなたのAPIキー）` |
| `SITE_PASSWORD` | `eligo2025`（または任意のパスワード） |

> 💡 各変数を入力したら **「Add」** ボタンを押してください。

---

## Step 4: デプロイ

1. **「Deploy」** ボタンをクリック
2. ビルドが自動的に開始されます（1〜2分）
3. 完了すると `https://qa-doterra-xxxx.vercel.app` のようなURLが発行されます

---

## Step 5: 動作確認

1. 発行されたURLにアクセス
2. パスワード入力画面が表示されることを確認
3. パスワード（`eligo2025`）を入力してチャット画面に遷移
4. チャットが正常に動作することを確認

---

## （オプション）カスタムドメイン設定

1. Vercelダッシュボードで対象プロジェクトを選択
2. **「Settings」** → **「Domains」**
3. 使いたいドメインを入力して **「Add」**
4. 表示されるDNS設定をドメインの管理画面で設定

---

## 更新のデプロイ

Vercelは **GitHubへのプッシュで自動デプロイ** されます：

```bash
git add .
git commit -m "変更内容の説明"
git push
```

プッシュから約1分でURLが自動更新されます。
