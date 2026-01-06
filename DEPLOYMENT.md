# دليل رفع المشروع وتشغيله (Deployment Guide)

لقد تم تجهيز المشروع للرفع على، منصة **Vercel** (لأنها تدعم Next.js وقواعد البيانات)، بدلاً من GitHub Pages التي تدعم الملفات الثابتة فقط.

## الخطوة 1: رفع الكود على GitHub (Push to GitHub)

1. اذهب إلى [GitHub.com](https://github.com) وسجل الدخول.
2. أنشئ مستودعاً جديداً (New Repository):
   - الاسم: `quran-platform`
   - النوع: **Public** (أو Private حسب رغبتك).
   - **لا** تقم بإضافة README أو .gitignore (لدينا هذه الملفات بالفعل).
3. بعد الإنشاء، ستظهر لك صفحة بها أوامر. انسخ رابط المستودع (مثال: `https://github.com/username/quran-platform.git`).
4. ارجع إلى البرنامج هنا وأرسل الأمر التالي (استبدل الرابط برابط مستودعك):

```bash
git remote add origin https://github.com/YOUR_USERNAME/quran-platform.git
git push -u origin main
```

**ملاحظة:** لا نحتاج لفرع `gh-pages`. العمل كله سيكون على فرع `main`.

---

## الخطوة 2: إعداد قاعدة البيانات السحابية (Cloud Database)
بما أن Vercel لا يدعم ملفات SQLite المحلية (`dev.db`)، يجب استخدام قاعدة بيانات PostgreSQL سحابية.

1. انشئ حساباً مجانياً على [Neon.tech](https://neon.tech) أو استخدم خدمة Vercel Postgres.
2. أنشئ مشروعاً جديداً واحصل على **Connection String** (رابط الاتصال).
   - يبدو الرابط هكذا: `postgresql://user:password@endpoint.neon.tech/dbname...`

---

## الخطوة 3: تعديل المشروع ليدعم PostgreSQL
قبل الرفع لـ Vercel، يجب تعديل إعدادات `prisma` في الكود:

1. افتح ملف `prisma/schema.prisma`.
2. غير السطر:
   ```prisma
   provider = "sqlite"
   ```
   إلى:
   ```prisma
   provider = "postgresql"
   ```
3. احفظ التغييرات وارفعها لـ GitHub:
   ```bash
   git add .
   git commit -m "Switch to Postgres"
   git push
   ```

---

## الخطوة 4: الربط مع Vercel
1. اذهب إلى [Vercel.com](https://vercel.com) وسجل الدخول (يفضل بحساب GitHub).
2. اضغط **Add New Project**.
3. اختر المستودع `quran-platform` واضغط **Import**.
4. في قسم **Environment Variables** (المتغيرات البيئية)، أضف:
   - الاسم: `DATABASE_URL`
   - القيمة: (رابط قاعدة البيانات الذي حصلت عليه في الخطوة 2).
5. اضغط **Deploy**.

---

## ملاحظة للمطور
عند العمل محلياً (Localhost) بعد التغيير لـ Postgres، ستحتاج لإضافة رابط قاعدة البيانات في ملف `.env` أيضاً لتتمكن من تشغيل الموقع على جهازك.
