# نسخة Android من مواعيدي

> **أرشيف فقط:** هذا الفرع `mobile-app` محفوظ للرجوع التاريخي، وليس مصدرًا لنشر تطبيق Android. مصدر التطوير والبناء والإصدارات الموقّعة الوحيد هو [`android-app`](https://github.com/arabicwithabdelmalek-cpu/mawaeidi/tree/android-app).

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
