# band. — محلل العقود القانونية بالذكاء الاصطناعي

أداة ذكية مخصصة للسوق السعودي تحلل العقود القانونية وتكشف البنود الخطرة قبل التوقيع.

## 🔗 الرابط المباشر
[band-app-lyart.vercel.app](https://band-app-lyart.vercel.app)

## ✨ المميزات
- رفع ملف PDF أو لصق النص مباشرة
- تقسيم العقد إلى بنود تلقائياً
- ملخص لكل بند بالعربي والإنجليزي
- درجة مخاطرة لكل بند (منخفض / متوسط / مرتفع)
- تمييز البنود الخطرة مع مراجع نظام العمل السعودي
- درجة مخاطرة كلية للعقد
- خريطة مخاطر بصرية

## 🛠️ التقنيات المستخدمة
- **Frontend & Backend:** Next.js 16
- **Styling:** Tailwind CSS
- **AI:** Claude API (Anthropic)
- **PDF Processing:** pdf2json
- **Deployment:** Vercel

## 🚀 تشغيل المشروع محلياً

### المتطلبات
- Node.js 18+
- Anthropic API Key

### خطوات التشغيل

```bash
# استنساخ المشروع
git clone https://github.com/ryouf/band-app.git
cd band-app

# تثبيت المكتبات
npm install

# إنشاء ملف البيئة
cp .env.example .env.local
```

أضيفي الـ API Key في ملف `.env.local`:
```
ANTHROPIC_API_KEY=your_api_key_here
```

```bash
# تشغيل المشروع
npm run dev
```

افتحي [http://localhost:3000](http://localhost:3000)

## 📁 هيكل المشروع
