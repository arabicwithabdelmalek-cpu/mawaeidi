# مواعيدي

تطبيق شخصي عربي لإدارة الحصص الأسبوعية، مع تسجيل دخول وحفظ سحابي عبر Supabase.

## النشر على GitHub Pages

1. ارفع محتويات هذا المجلد إلى مستودع باسم `mawaeidi`.
2. افتح **Settings → Pages**.
3. اختر **Deploy from a branch**، ثم فرع `main` والمجلد `/ (root)`.
4. بعد ظهور الرابط، أضفه في Supabase ضمن **Authentication → URL Configuration** بوصفه Site URL وRedirect URL.

المفتاح الموجود داخل `index.html` هو مفتاح Supabase قابل للنشر، وتظل البيانات محمية بسياسات Row Level Security. لا تضف أي مفتاح Secret أو Service Role إلى المستودع.
