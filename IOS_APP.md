# مواعيدي على iPhone وiPad — نسخة iOS التجريبية

هذا الفرع `ios-app` مشتق من تصميم مواعيدي في `android-app`، ويستخدم حسابات Supabase نفسها وجدول الحصص والطلاب والساعة العالمية وخط Cairo وأيقونة الكولاج المعتمدة.

## ما أُنجز

- إعداد توليد مشروع iOS أصلي عبر Capacitor 8.5.2 وSwift Package Manager، بحد أدنى iOS 15.
- إضافة جسر Swift باسم `MawaeidiAlarm` متوافق مع واجهة JavaScript الحالية.
- جدولة حتى 55 إشعارًا محليًا قادمًا، بحسب الحصص الفعلية والحالات والتأجيلات؛ تحفظها iOS حتى إن لم يكن التطبيق مفتوحًا.
- طلب إذن الإشعارات واختبار إشعار بعد 3 ثوانٍ، مع إمكانية الإيقاف وحذف التنبيهات المحفوظة عند تبديل الحساب أو إلغاء التفعيل.
- تنسيق iPhone بنفس البطاقات وخط Cairo وشريط الأقسام وأيقونة التطبيق، مع شاشة إعدادات iOS صريحة لا تعرض خيارات Android غير المتاحة.

## القيود المهمة

إشعارات iOS المحلية **ليست منبّهًا متكرر الرنين** مثل منبّه Android الأصلي، وقد يمنع صوتها الوضع الصامت أو «التركيز». يمكن إضافة AlarmKit في iOS 26+ في مرحلة منفصلة بعد اختبار الجهاز وسياسات الإذن، من غير الادعاء أن الإشعار العادي يفعل ذلك.

عدد التنبيهات محدود، وتُجدَّد القائمة عند فتح التطبيق ومزامنة الحصص. لا توجد حالياً نسخة IPA موقّعة للتثبيت عبر TestFlight؛ يلزم حساب Apple Developer مع إعداد شهادة التوزيع وملف التزويد ثم تجربة جهاز iPhone حقيقي.

## البناء والاختبار

لبناء المصدر على Mac يحتوي Xcode 26+ وNode.js 22+ وRuby:

```bash
npm ci
gem install xcodeproj --no-document
npm run ios:project
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath build/ios CODE_SIGNING_ALLOWED=NO build
```

قدّم المشروع إلى Xcode باستخدام `open ios/App/App.xcodeproj`. للتجربة على iPhone فعلي، اختر Apple Team الخاص بك في Signing & Capabilities، واستخدم Bundle ID `com.abdelmalek.mawaeidi` أو معرّفًا آخر تملكه. لا تحاول تثبيت ملف محاكي iOS بصيغة ZIP مباشرة على الهاتف.

## تنظيم العمل

- `main`: موقع الويب الحالي.
- `android-app`: التطبيق الأصلي لـAndroid وإصدارات APK الموقّعة.
- **`ios-app`**: المصدر الرسمي لتطوير إصدار iOS، وإجراء اختبار البناء على GitHub Actions.
- الأصول المولَّدة في `ios/` تُبنى آليًا؛ مصدر كود Swift في `ios-native/`، وسكربتات إعداد Xcode في `scripts/`.

يجب مراجعة أي تغييرات مشتركة في واجهة التطبيق بين `android-app` و`ios-app` عند التطوير اللاحق، وليس دمج الفروع كلها دون فحص كود المنبّه الخاص بكل منصة.
