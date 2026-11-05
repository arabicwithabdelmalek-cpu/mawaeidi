# تطبيق مواعيدي على Android

تطبيق Android الرسمي موجود في [فرع `android-app`](https://github.com/arabicwithabdelmalek-cpu/mawaeidi/tree/android-app)، وهو نسخة أصلية مبنية بـ Capacitor وتحتوي على منبّه Android الحقيقي.

- معرّف التطبيق الثابت: `com.abdelmalek.mawaeidi`.
- آخر نسخة Android موقّعة عند توحيد الفروع: [2.0.0-beta.3](https://github.com/arabicwithabdelmalek-cpu/mawaeidi/releases/tag/v2.0.0-beta.3).
- تطوير التطبيق واختبار APK ونشر الإصدار الموقّع يتم من `android-app` فقط.
- يُحدَّث `release/android-version.json` داخل `android-app` عند اعتماد إصدار جديد، مع استخدام مفتاح التوقيع السابق نفسه حتى يتم تثبيت التحديث فوق التطبيق الحالي.
- `main` مخصص للموقع المنشور و`development` لمراجعة الموقع.
- الفرعان `mobile-app` و`feature/native-mobile-alarm-v1` محفوظان كتاريخ فقط ولا يُنشَر منهما تطبيق جديد.

لخطوات إعداد وتحديث التطبيق واختبارات المنبّه والتوقيع، راجع [وثيقة تطبيق Android](https://github.com/arabicwithabdelmalek-cpu/mawaeidi/blob/android-app/MOBILE_APP.md) في الفرع الرسمي.
