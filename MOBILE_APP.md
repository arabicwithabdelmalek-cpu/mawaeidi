# نسخة Android من مواعيدي

هذه النسخة تغلف الموقع الحي داخل تطبيق Android باستخدام Capacitor، مع الحفاظ على نفس Supabase ونفس البيانات.

## هوية التطبيق
- الاسم: مواعيدي
- Package ID: `com.abdelmalek.mawaeidi`
- المصدر الحي: `https://arabicwithabdelmalek-cpu.github.io/mawaeidi/`

## البناء
يبني GitHub Actions ملف APK تلقائيًا على فرع `mobile-app`.
الملف الناتج: `Mawaeidi-Android-debug.zip` ويحتوي على `app-debug.apk`.

## ملاحظة
هذه نسخة أولى قابلة للتثبيت والاختبار. النشر على Google Play يحتاج توقيع Release دائم (keystore) بدل توقيع Debug.
