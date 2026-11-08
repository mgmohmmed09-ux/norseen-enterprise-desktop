<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/1fd8b7fd-0258-433f-9d97-404f43949974

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## إنشاء ملف تثبيت Windows

1. ضع أيقونة Windows بصيغة `.ico` داخل `assets/ICO.ico`.
2. ثبّت الحزم: `npm install`.
3. أنشئ ملف التثبيت: `npm run dist`.

سيتم إنشاء ملف Setup بصيغة `.exe` داخل مجلد `release`. يمكن نقل هذا الملف إلى جهاز Windows آخر وتثبيته، كما سيتم إنشاء اختصار باسم `Norseen` على سطح المكتب.
