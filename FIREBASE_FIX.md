# حل مشكلة رفع الملفات (CORS Error)

هذا الخطأ يظهر لأن **Firebase Storage** يرفض استقبال الملفات من روابط Vercel الجديدة لأسباب أمنية. لحل المشكلة، يرجى اتباع الخطوات التالية:

### الخطوات:
1. ادخل على [Google Cloud Console](https://console.cloud.google.com/).
2. تأكد من اختيار المشروع الخاص بك: `alhalaqa-909b7`.
3. اضغط على أيقونة **Cloud Shell** في أعلى الشاشة (أيقونة `>_`).
4. الصق الأوامر التالية واضغط **Enter**:

```bash
echo '[{"origin": ["*"],"method": ["GET", "POST", "PUT", "DELETE", "HEAD"],"responseHeader": ["Content-Type"],"maxAgeSeconds": 3600}]' > cors.json
gsutil cors set cors.json gs://alhalaqa-909b7.firebasestorage.app
```

### ماذا سيحدث؟
سيقوم هذا الأمر بتغيير إعدادات مخزن الملفات ليسمح للموقع (Vercel) برفع الملفات مباشرة.

**بمجرد الانتهاء، ستعمل علامة الصح ✅ والرفع في الموقع فوراً.**
