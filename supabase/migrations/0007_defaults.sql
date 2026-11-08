-- The starting settings, lists and wording every project needs, so a fresh `db push` works
-- before anyone opens Settings. The Admin changes all of it in the app afterwards.
-- Sample people and members live in seed.sql, which never goes to the real project.

-- ── Settings ───────────────────────────────────────────────────────────────

insert into public.settings (
  buffer_days, integration_due_days, setup_due_days, session_minutes, gap_minutes, slot_step_minutes,
  book_ahead_days, link_hours, reminder_hours, recording_alert_hours, feedback_reminder_hours,
  low_rating_max, extend_hours, alerts_keep_days, session_hours, office_hours, company
) values (
  3, 2, 1, 30, 10, 30,
  30, 48, '{24,1}', 3, 24,
  3, '{24,48}', 30, 12,
  '[{"on":true,"from":"09:00","to":"17:00"},{"on":true,"from":"09:00","to":"17:00"},
    {"on":true,"from":"09:00","to":"17:00"},{"on":true,"from":"09:00","to":"17:00"},
    {"on":true,"from":"09:00","to":"14:00"},{"on":false,"from":"09:00","to":"17:00"},
    {"on":false,"from":"09:00","to":"17:00"}]',
  '{"name":"CODEIT","name_ar":"CODEIT","app_name":"Lead Codeit","product_name":"CODEIT",
    "legal_name":"Code Communications & Information Technology","legal_name_ar":"",
    "vat_number":"","website":"","sender_email":"","support_phone":"","address":"","app_url":""}'
);

-- ── Lists (Settings → Lists) ───────────────────────────────────────────────
-- `meta` per list: business_type {site}, document {short, short_ar, plans[] (the customer types that send it; none listed:
-- every type, empty: none), integrations[] (the integrations that need it, shown on their Integration tab), type (pdf,
-- image, excel, any), optional},
-- feature {plans[]}, due_choice {days}, role {portal, portal_ar}.

insert into public.options (list, key, label, label_ar, sort, meta) values
  ('business_type', 'basic', 'Basic', 'أساسي', 1, '{"site":"https://live.codeit.sa"}'),
  ('business_type', 'retail', 'Retail', 'تجزئة', 2, '{"site":"https://adv.codeit.sa"}'),
  ('business_type', 'restaurant', 'Restaurant', 'مطعم', 3, '{"site":"https://live.codeit.sa"}'),

  ('document', 'logo', 'Company logo', 'شعار الشركة', 1, '{"type":"image","short":"Logo","short_ar":"الشعار"}'),
  ('document', 'cr', 'Commercial registration (CR) certificate', 'شهادة السجل التجاري', 2, '{"type":"pdf","short":"CR","short_ar":"السجل التجاري","integrations":["surepay"]}'),
  ('document', 'vat', 'VAT registration certificate', 'شهادة التسجيل في ضريبة القيمة المضافة', 3, '{"type":"pdf","short":"VAT","short_ar":"الضريبة"}'),
  ('document', 'basicItems', 'Basic product items list', 'قائمة المنتجات الأساسية', 4, '{"type":"excel","short":"Basic items","short_ar":"المنتجات الأساسية","plans":["basic"]}'),
  ('document', 'menu', 'Menu items list', 'قائمة أصناف المنيو', 5, '{"type":"excel","short":"Menu","short_ar":"المنيو","plans":["restaurant"]}'),
  ('document', 'products', 'Product items list', 'قائمة المنتجات', 6, '{"type":"excel","short":"Products","short_ar":"المنتجات","plans":["retail","restaurant"]}'),
  ('document', 'surepay', 'Surepay form', 'نموذج Surepay', 7, '{"type":"pdf","short":"Surepay","short_ar":"Surepay","plans":[],"integrations":["surepay"]}'),
  ('document', 'hala', 'Hala form', 'نموذج هلا', 8, '{"type":"pdf","short":"Hala","short_ar":"هلا","plans":[],"integrations":["hala"]}'),
  -- What the bank needs to activate SurePay (with the CR above).
  ('document', 'surepay_iban', 'Commercial registration bank account IBAN', 'شهادة الآيبان للحساب البنكي للسجل التجاري', 9, '{"type":"pdf","short":"IBAN","short_ar":"الآيبان","plans":[],"integrations":["surepay"]}'),
  ('document', 'surepay_owner_id', 'Owner''s national ID', 'الهوية الوطنية للمالك', 10, '{"type":"any","short":"Owner ID","short_ar":"هوية المالك","plans":[],"integrations":["surepay"]}'),
  ('document', 'surepay_address', 'Business national address', 'العنوان الوطني للمنشأة', 11, '{"type":"pdf","short":"National address","short_ar":"العنوان الوطني","plans":[],"integrations":["surepay"]}'),
  ('document', 'surepay_articles', 'Articles of association (if applicable)', 'عقد التأسيس (إن وُجد)', 12, '{"type":"pdf","short":"Articles","short_ar":"عقد التأسيس","plans":[],"integrations":["surepay"],"optional":true}'),
  ('document', 'surepay_license', 'Municipal license', 'رخصة البلدية', 13, '{"type":"pdf","short":"Municipal license","short_ar":"رخصة البلدية","plans":[],"integrations":["surepay"]}'),

  ('feature', 'loyalty', 'Loyalty program', 'برنامج الولاء', 1, '{"plans":["retail","restaurant"]}'),
  ('feature', 'selfService', 'Self-service app', 'تطبيق الخدمة الذاتية', 2, '{"plans":["retail","restaurant"]}'),
  ('feature', 'waiter', 'Waiter app', 'تطبيق النادل', 3, '{"plans":["restaurant"]}'),
  ('feature', 'kds', 'Kitchen display system (KDS)', 'شاشة عرض المطبخ (KDS)', 4, '{"plans":["restaurant"]}'),
  ('feature', 'manufacturing', 'Manufacturing feature', 'خاصية التصنيع', 5, '{"plans":["restaurant"]}'),
  ('feature', 'gl', 'General ledger (GL) accounting', 'محاسبة دفتر الأستاذ العام (GL)', 6, '{"plans":["retail","restaurant"]}'),

  ('integration', 'surepay', 'Surepay', 'Surepay', 1, '{}'),
  ('integration', 'hala', 'Hala', 'هلا', 2, '{}'),
  ('integration', 'deliverect', 'Deliverect', 'Deliverect', 3, '{}'),

  ('industry', 'technology', 'Technology', 'التقنية', 1, '{}'),
  ('industry', 'finance', 'Finance', 'المالية', 2, '{}'),
  ('industry', 'healthcare', 'Healthcare', 'الرعاية الصحية', 3, '{}'),
  ('industry', 'government', 'Government', 'القطاع الحكومي', 4, '{}'),
  ('industry', 'education', 'Education', 'التعليم', 5, '{}'),
  ('industry', 'retail', 'Retail', 'التجزئة', 6, '{}'),
  ('industry', 'other', 'Other', 'أخرى', 7, '{}'),

  ('size', '1-10', '1–10', '1–10', 1, '{}'),
  ('size', '11-50', '11–50', '11–50', 2, '{}'),
  ('size', '51-200', '51–200', '51–200', 3, '{}'),
  ('size', '201-1000', '201–1000', '201–1000', 4, '{}'),
  ('size', '1000+', '1000+', '1000+', 5, '{}'),

  ('due_choice', 'd1', '1 day', 'يوم واحد', 1, '{"days":1}'),
  ('due_choice', 'd3', '3 days', '3 أيام', 2, '{"days":3}'),
  ('due_choice', 'd7', '1 week', 'أسبوع', 3, '{"days":7}'),
  ('due_choice', 'd14', '2 weeks', 'أسبوعان', 4, '{"days":14}'),

  ('setup_check', 'branches', 'Branches and settings', 'الفروع والإعدادات', 1, '{}'),
  ('setup_check', 'products', 'Products or menu imported', 'استيراد المنتجات أو المنيو', 2, '{}'),
  ('setup_check', 'staff', 'Staff users created', 'إنشاء مستخدمي الموظفين', 3, '{}'),
  ('setup_check', 'attendees', 'Customer knows who attends', 'العميل يعرف من سيحضر', 4, '{}'),

  -- The parts of making the customer's CODEIT account, ticked on the Setup tab.
  ('account_part', 'login', 'Login ID', 'معرّف الدخول', 1, '{}'),
  ('account_part', 'password', 'Password', 'كلمة المرور', 2, '{}'),
  ('account_part', 'language', 'Language', 'اللغة', 3, '{}'),

  -- Where the customer's hardware is, in order.
  ('hardware_step', 'ordered', 'Ordered', 'تم الطلب', 1, '{}'),
  ('hardware_step', 'arriving', 'Arriving', 'في الطريق', 2, '{}'),
  ('hardware_step', 'delivered', 'Delivered', 'تم التسليم', 3, '{}'),

  ('lost_reason', 'price', 'Price', 'السعر', 1, '{}'),
  ('lost_reason', 'no_interest', 'No interest', 'لا يوجد اهتمام', 2, '{}'),
  ('lost_reason', 'competitor', 'Chose a competitor', 'اختار منافساً', 3, '{}'),
  ('lost_reason', 'unreachable', 'Unreachable', 'تعذّر التواصل', 4, '{}'),
  ('lost_reason', 'duplicate', 'Duplicate', 'مكرر', 5, '{}'),
  ('lost_reason', 'other', 'Other', 'أخرى', 6, '{}'),

  -- The words for the fixed roles and steps (the code keys them; the Admin can rename them).
  -- meta.portal: the panel's name on the sidebar pill; meta.team: the team's short name (Members › By team).
  ('role', 'admin', 'Admin', 'المسؤول', 1, '{"portal":"Admin portal","portal_ar":"بوابة المسؤول","team":"Admin","team_ar":"الإدارة"}'),
  ('role', 'sales', 'Sales Member', 'عضو المبيعات', 2, '{"portal":"Sales portal","portal_ar":"بوابة المبيعات","team":"Sales","team_ar":"المبيعات"}'),
  ('role', 'account', 'Account Member', 'عضو الحسابات', 3, '{"portal":"Account portal","portal_ar":"بوابة الحسابات","team":"Account","team_ar":"الحسابات"}'),
  ('role', 'integration', 'Integration Person', 'مسؤول الربط', 4, '{"portal":"Integration portal","portal_ar":"بوابة الربط","team":"Integration","team_ar":"الربط"}'),
  ('role', 'onboarding', 'Onboarding Member', 'عضو التهيئة', 5, '{"portal":"Onboarding portal","portal_ar":"بوابة التهيئة","team":"Onboarding","team_ar":"التهيئة"}'),

  -- The steps every screen shows (the server's finer stages stay in the code), then the two ways off the path.
  ('step', 'sales', 'Sales', 'المبيعات', 1, '{}'),
  ('step', 'setup', 'Setup', 'الإعداد', 2, '{}'),
  ('step', 'integration', 'Integration', 'الربط', 3, '{}'),
  ('step', 'onboarding', 'Onboarding', 'التهيئة', 4, '{}'),
  ('step', 'closed', 'Closed', 'مغلق', 5, '{}'),
  ('step', 'lost', 'Lost', 'خسارة', 6, '{}'),
  ('step', 'cancelled', 'Cancelled', 'ملغى', 7, '{}');

-- ── Wording (Settings → Emails & texts) ────────────────────────────────────
-- {placeholders} are filled in when sent; {app}, {product} and {company} are the names in Settings →
-- Company. Team emails follow the person's language; customer emails and the customer page follow
-- the member's.

insert into public.texts (key, en, ar) values
  ('team_welcome_subject', 'Welcome to {app}', 'مرحباً بك في {app}'),
  ('team_welcome_body',
   E'Hello {name},\n\nYour {app} account is ready. Open {link} and press "Sign in with Google" with your {email} Google account.\n\nNo Google account? Sign in there with:\n\nEmail: {email}\nTemporary password: {password}\n\nYou will then choose your own password.',
   E'مرحباً {name}،\n\nحسابك في {app} جاهز. افتح {link} واضغط «تسجيل الدخول عبر Google» بحساب Google الخاص بـ {email}.\n\nليس لديك حساب Google؟ سجّل الدخول هناك باستخدام:\n\nالبريد الإلكتروني: {email}\nكلمة المرور المؤقتة: {password}\n\nثم اختر كلمة المرور الخاصة بك.'),
  ('team_reset_subject', 'Your new {app} password', 'كلمة مرور جديدة لحسابك في {app}'),
  ('team_reset_body',
   E'Hello {name},\n\nYour Admin set a new temporary password for {app}. Sign in at {link} with:\n\nEmail: {email}\nTemporary password: {password}\n\nYou will choose your own password straight after.',
   E'مرحباً {name}،\n\nعيّن المسؤول كلمة مرور مؤقتة جديدة لحسابك في {app}. سجّل الدخول عبر {link} باستخدام:\n\nالبريد الإلكتروني: {email}\nكلمة المرور المؤقتة: {password}\n\nستختار كلمة المرور الخاصة بك مباشرة بعد ذلك.'),
  ('team_email_changed_subject', 'Your {app} sign-in email changed', 'تم تغيير بريد تسجيل الدخول إلى {app}'),
  ('team_email_changed_body',
   E'Hello {name},\n\nYour Admin changed the email you sign in to {app} with, from {old_email} to {new_email}. Your password stays the same.\n\nIf you didn’t expect this, tell your Admin.\n\n{link}',
   E'مرحباً {name}،\n\nقام المسؤول بتغيير البريد الإلكتروني الذي تسجّل به الدخول إلى {app} من {old_email} إلى {new_email}. كلمة المرور كما هي.\n\nإذا لم تكن تتوقع ذلك، أخبر المسؤول.\n\n{link}'),
  ('alert_subject', '{app}: {text}', '{app}: {text}'),
  ('alert_body',
   E'Hello {name},\n\n{text}\n\nOpen {app}: {link}\n\nYou can turn these emails off in Settings → My profile.',
   E'مرحباً {name}،\n\n{text}\n\nافتح {app}: {link}\n\nيمكنك إيقاف هذه الرسائل من الإعدادات ← ملفي الشخصي.');

-- The customer's emails. Placeholders: {name} {company} {product} {date} {time} {meet_link}
-- {after_link} {expires} {support_phone} {hours}.
insert into public.texts (key, en, ar) values
  ('session_booked_subject', 'Your {product} training session is booked', 'تم حجز جلسة التدريب الخاصة بك في {product}'),
  ('session_booked_body',
   E'Hello {name},\n\nYour {product} training session is booked for {date} at {time} (Riyadh time).\n\nJoin on Google Meet: {meet_link}\n\nIf the time doesn’t suit you, reply to this email or call {support_phone}.\n\n{company}',
   E'مرحباً {name}،\n\nتم حجز جلسة التدريب الخاصة بك في {product} يوم {date} الساعة {time} (بتوقيت الرياض).\n\nللانضمام عبر Google Meet: {meet_link}\n\nإذا لم يناسبك الموعد، يرجى الرد على هذا البريد أو الاتصال على {support_phone}.\n\n{company}'),
  ('session_moved_subject', 'Your training session has a new time', 'تم تغيير موعد جلسة التدريب'),
  ('session_moved_body',
   E'Hello {name},\n\nYour {product} training session has moved to {date} at {time} (Riyadh time).\n\nJoin on Google Meet: {meet_link}\n\n{company}',
   E'مرحباً {name}،\n\nتم نقل جلسة التدريب الخاصة بك في {product} إلى يوم {date} الساعة {time} (بتوقيت الرياض).\n\nللانضمام عبر Google Meet: {meet_link}\n\n{company}'),
  ('session_cancelled_subject', 'Your training session is cancelled', 'تم إلغاء جلسة التدريب'),
  ('session_cancelled_body',
   E'Hello {name},\n\nYour {product} training session on {date} is cancelled. We will be in touch about a new time.\n\nQuestions? Call {support_phone}.\n\n{company}',
   E'مرحباً {name}،\n\nتم إلغاء جلسة التدريب الخاصة بك في {product} يوم {date}. سنتواصل معك لتحديد موعد جديد.\n\nللاستفسار يرجى الاتصال على {support_phone}.\n\n{company}'),
  ('session_reminder_subject', 'Reminder: your training session is coming up', 'تذكير: موعد جلسة التدريب يقترب'),
  ('session_reminder_body',
   E'Hello {name},\n\nA reminder that your {product} training session starts in {hours} h: {date} at {time} (Riyadh time).\n\nJoin on Google Meet: {meet_link}\n\n{company}',
   E'مرحباً {name}،\n\nنذكّرك بأن جلسة التدريب الخاصة بك في {product} تبدأ بعد {hours} ساعة: يوم {date} الساعة {time} (بتوقيت الرياض).\n\nللانضمام عبر Google Meet: {meet_link}\n\n{company}'),
  ('session_missed_subject', 'We missed you today', 'افتقدناك اليوم'),
  ('session_missed_body',
   E'Hello {name},\n\nWe missed you at your {product} training session on {date} at {time}. That’s fine: we will be in touch to book a new time.\n\nQuestions? Reply to this email or call {support_phone}.\n\n{company}',
   E'مرحباً {name}،\n\nافتقدناك في جلسة التدريب على {product} يوم {date} الساعة {time}. لا بأس، سنتواصل معك لحجز موعد جديد.\n\nللاستفسار يرجى الرد على هذا البريد أو الاتصال على {support_phone}.\n\n{company}'),
  ('follow_up_subject', 'Your training recording, and a quick question', 'تسجيل جلسة التدريب وسؤال سريع'),
  ('follow_up_body',
   E'Hello {name},\n\nThank you for joining your {product} training. Watch the recording and tell us how it went:\n\n{after_link}\n\nThe link works until {expires}.\n\n{company}',
   E'مرحباً {name}،\n\nشكراً لحضورك جلسة التدريب في {product}. يمكنك مشاهدة التسجيل وإخبارنا برأيك عبر الرابط:\n\n{after_link}\n\nيعمل الرابط حتى {expires}.\n\n{company}'),
  ('link_extended_subject', 'More time to watch your training', 'وقت إضافي لمشاهدة تدريبك'),
  ('link_extended_body',
   E'Hello {name},\n\nWe have given you more time. Watch the recording and tell us how it went until {expires}:\n\n{after_link}\n\n{company}',
   E'مرحباً {name}،\n\nمنحناك وقتاً إضافياً. يمكنك مشاهدة التسجيل وإخبارنا برأيك حتى {expires}:\n\n{after_link}\n\n{company}'),
  ('feedback_reminder_subject', 'How was your training?', 'ما رأيك في جلسة التدريب؟'),
  ('feedback_reminder_body',
   E'Hello {name},\n\nWe would love to hear how your {product} training went. It takes a minute:\n\n{after_link}\n\nThe link works until {expires}.\n\n{company}',
   E'مرحباً {name}،\n\nيسعدنا معرفة رأيك في جلسة التدريب في {product}، ولن يستغرق ذلك سوى دقيقة:\n\n{after_link}\n\nيعمل الرابط حتى {expires}.\n\n{company}');

-- The customer's page (/after/…).
insert into public.texts (key, en, ar) values
  ('after_title', 'Thank you for your training, {name}', 'شكراً لحضورك التدريب يا {name}'),
  ('after_intro', 'Here is the recording of your session, and a quick question about how it went.', 'إليك تسجيل جلستك، وسؤال سريع عن رأيك فيها.'),
  ('after_open_until', 'This page is open until {expires}.', 'هذه الصفحة متاحة حتى {expires}.'),
  ('after_recording', 'The recording', 'التسجيل'),
  ('after_open_recording', 'Open the recording', 'فتح التسجيل'),
  ('after_no_recording', 'There is no recording of this session.', 'لا يوجد تسجيل لهذه الجلسة.'),
  ('after_rate', 'How was your training?', 'ما رأيك في التدريب؟'),
  ('after_comment', 'Anything you’d like to tell us? (optional)', 'هل لديك أي ملاحظات؟ (اختياري)'),
  ('after_send', 'Send', 'إرسال'),
  ('after_thanks', 'Thank you for your feedback.', 'شكراً لملاحظاتك.'),
  ('after_closed_title', 'This link has closed', 'انتهت صلاحية هذا الرابط'),
  ('after_closed_body', 'The recording and the feedback form were open for a limited time. Questions? Call {support_phone}.', 'كان التسجيل ونموذج الملاحظات متاحين لفترة محدودة. للاستفسار يرجى الاتصال على {support_phone}.'),
  ('after_not_found_title', 'This link isn’t valid', 'هذا الرابط غير صالح'),
  ('after_not_found', 'Please check the link in your email.', 'يرجى التحقق من الرابط في بريدك الإلكتروني.');

-- The title of the session's event on the team's Google Calendar ({customer} is their company).
insert into public.texts (key, en, ar) values
  ('calendar_title', '{product} training · {customer}', 'تدريب {product} · {customer}');

-- Activity lines and alerts (Settings → Emails & texts → Alerts & activity), filled in both
-- languages when they happen; field_* name the member's fields in "Changed …".
insert into public.texts (key, en, ar) values
  ('log_person_auto', '{role} picked automatically: {person}', 'اختير {person} تلقائياً بصفة {role}'),
  ('log_person_changed', '{role} changed to {person}', 'تغيّر {role} إلى {person}'),
  ('log_nobody_free', 'No {role} is free at that time. The Admin will pick one.', 'لا يوجد {role} متاح في ذلك الوقت. سيختار المسؤول أحداً.'),
  ('log_session_booked', 'Session booked for {at}', 'حُجزت الجلسة في {at}'),
  ('log_session_moved', 'Session moved from {from} to {to}', 'نُقلت الجلسة من {from} إلى {to}'),
  ('log_created', 'Added by {by}', 'أضافه {by}'),
  ('log_created_for', 'Added by {by} for {sales}', 'أضافه {by} لصالح {sales}'),
  ('log_edited', 'Changed {fields}', 'تم تعديل: {fields}'),
  ('log_account_created', 'Account created · {product} account {id}', 'أُنشئ الحساب · حساب {product} رقم {id}'),
  ('log_account_part_on', '{part} set up on {product}', 'تم إعداد {part} على {product}'),
  ('log_account_part_off', '{part} unticked', 'أُلغي تحديد {part}'),
  ('log_signed_in', 'Customer signed in for the first time', 'سجّل العميل الدخول لأول مرة'),
  ('log_signed_in_off', 'Customer signed in unticked', 'أُلغي تحديد تسجيل دخول العميل'),
  ('log_account_unticked', 'Account created unticked by the Admin', 'ألغى المسؤول علامة «تم إنشاء الحساب»'),
  ('log_hardware_none', 'Hardware: none needed', 'الأجهزة: لا حاجة لها'),
  ('log_hardware_delivered', 'Hardware delivered', 'سُلّمت الأجهزة'),
  ('log_hardware_arriving', 'Hardware arriving {date}', 'تصل الأجهزة {date}'),
  ('log_hardware_updated', 'Hardware updated', 'تم تحديث الأجهزة'),
  ('log_document_uploaded', '{document} uploaded: {file}', 'رُفع {document}: {file}'),
  ('log_document_removed', '{document} removed', 'أُزيل {document}'),
  ('log_transferred', 'Transferred to {step}', 'حُوّل إلى {step}'),
  ('log_lost', 'Marked Lost: {why}', 'حُدّد كخسارة: {why}'),
  ('log_reopened', 'Reopened by the Admin. Book a new time.', 'أعاد المسؤول فتحه. احجز موعداً جديداً.'),
  ('log_int_connected', '{integration} connected', 'تم ربط {integration}'),
  ('log_int_unconnected', '{integration} no longer connected', 'لم يعد {integration} مربوطاً'),
  ('log_int_tested', '{integration} tested', 'تم اختبار {integration}'),
  ('log_int_untested', '{integration} no longer tested', 'أُلغي اختبار {integration}'),
  ('log_int_waiting', '{integration} waiting on provider', '{integration} بانتظار المزوّد'),
  ('log_int_unwaiting', '{integration} no longer waiting on provider', 'لم يعد {integration} بانتظار المزوّد'),
  ('log_int_notes', '{integration} notes updated', 'حُدّثت ملاحظات {integration}'),
  ('log_handed_over', 'Handed to {step}', 'سُلّم إلى {step}'),
  ('log_sent_back', 'Sent back to {step}: {reason}', 'أُعيد إلى {step}: {reason}'),
  ('log_setup_done', 'Setup checklist done', 'اكتملت قائمة الإعداد'),
  ('log_setup_reopened', 'Setup checklist reopened: {item}', 'أُعيد فتح قائمة الإعداد: {item}'),
  ('log_completed', 'Session completed', 'اكتملت الجلسة'),
  ('log_no_show', 'No-show. Back to {step} for a new time.', 'لم يحضر العميل. عاد إلى {step} لحجز موعد جديد.'),
  ('log_no_show_note', 'No-show: {note}. Back to {step} for a new time.', 'لم يحضر العميل: {note}. عاد إلى {step} لحجز موعد جديد.'),
  ('log_recording_sent', 'Recording sent. The link works for {hours} hours', 'أُرسل التسجيل. يعمل الرابط لمدة {hours} ساعة'),
  ('log_feedback_only', 'Feedback form sent without a recording: {reason}', 'أُرسل نموذج الملاحظات دون تسجيل: {reason}'),
  ('log_link_extended', 'Link extended by {hours} hours', 'مُدّد الرابط {hours} ساعة'),
  ('log_cancelled', 'Cancelled: {reason}', 'أُلغي: {reason}'),
  ('log_new_password', 'New {product} password made', 'أُنشئت كلمة مرور جديدة لحساب {product}'),
  ('log_feedback_saved', 'Onboarding feedback saved', 'حُفظت ملاحظات التهيئة'),
  ('log_missed_before_transfer', 'The session time passed before Transfer. Book a new time.', 'مضى موعد الجلسة قبل التحويل. احجز موعداً جديداً.'),
  ('log_closed_link', 'The customer’s link closed. Closed.', 'انتهى رابط العميل. أُغلق.'),
  ('log_closed_feedback', 'The customer gave feedback. Closed.', 'أرسل العميل ملاحظاته. أُغلق.'),
  ('log_rated', 'The customer rated the session {stars} of 5', 'قيّم العميل الجلسة {stars} من 5'),
  ('log_rated_comment', 'The customer rated the session {stars} of 5: “{comment}”', 'قيّم العميل الجلسة {stars} من 5: «{comment}»'),
  ('log_email_sent', 'Email to the customer: “{subject}”', 'رسالة إلى العميل: «{subject}»'),
  ('log_email_not_sent', 'Email to the customer: “{subject}” (not sent: no email service set up yet)', 'رسالة إلى العميل: «{subject}» (لم تُرسل: لم تُضبط خدمة البريد بعد)'),
  ('log_email_off', 'Email to the customer not sent: “{email}” is turned off in Settings', 'لم تُرسل رسالة إلى العميل: «{email}» متوقفة في الإعدادات'),
  ('alert_given', '{name} is now yours ({role})', 'أصبح {name} مسؤوليتك ({role})'),
  ('alert_taken_off', '{name}’s session moved to a time you are busy, so it was given to someone else', 'نُقلت جلسة {name} إلى وقت أنت مشغول فيه، فأُسندت إلى شخص آخر'),
  ('alert_nobody_session', 'Nobody is free to run {name}’s session. Pick the {role}', 'لا يوجد من يتاح لتقديم جلسة {name}. اختر {role}'),
  ('alert_nobody_account', 'Nobody can take {name}’s {product} account. Pick the {role}', 'لا يوجد من يتولى حساب {product} الخاص بـ{name}. اختر {role}'),
  ('alert_nobody_integration', 'Nobody can take {name}’s integrations. Pick the {role}', 'لا يوجد من يتولى ربطات {name}. اختر {role}'),
  ('alert_nobody_move', 'Nobody could take {name} from {from}. Pick someone', 'لم يتمكن أحد من استلام {name} من {from}. اختر شخصاً'),
  ('alert_account_created', 'The {product} account for {name} is ready', 'حساب {product} الخاص بـ{name} جاهز'),
  ('alert_account_reopened', 'The {product} account for {name} needs another look', 'حساب {product} الخاص بـ{name} يحتاج إلى مراجعة'),
  ('alert_back', '{name} is back with you', 'عاد {name} إليك'),
  ('alert_lost_account', '{name} was lost. Close their {product} account if needed', 'خسرنا {name}. أغلق حساب {product} الخاص به إن لزم'),
  ('alert_lost_admin', '{name} was marked Lost: {why}', 'حُدّد {name} كخسارة: {why}'),
  ('alert_reopened', '{name} was reopened and is back with you', 'أُعيد فتح {name} وعاد إليك'),
  ('alert_reopened_admin', '{name} was reopened by {by}', 'أعاد {by} فتح {name}'),
  ('alert_sent_back', '{name} was sent back to you: {reason}', 'أُعيد {name} إليك: {reason}'),
  ('alert_no_show', '{name} missed the session. Book a new time', 'لم يحضر {name} الجلسة. احجز موعداً جديداً'),
  ('alert_no_show_admin', '{name} has missed {n} sessions', 'تغيّب {name} عن {n} من الجلسات'),
  ('alert_cancelled', '{name} was cancelled: {reason}', 'أُلغي {name}: {reason}'),
  ('alert_note', '{by} added a note on {name}', 'أضاف {by} ملاحظة على {name}'),
  ('alert_locked', '{name} typed a wrong password {n} times and can''t sign in until {time}', 'أدخل {name} كلمة مرور خاطئة {n} مرات ولا يمكنه تسجيل الدخول حتى {time}'),
  ('alert_leave_sessions', '{who} is on leave on a day with {sessions}. Move them on the Team page', 'إجازة {who} في يوم فيه {n} من الجلسات. انقلها من صفحة الفريق'),
  ('alert_leave_open', '{who} is on leave from {date} and has {members}', 'إجازة {who} تبدأ {date} ولديه {n} من الأعضاء المفتوحين'),
  ('alert_holiday', '{sessions} on {holiday} ({date}). Move them', 'يوجد {n} من الجلسات في {holiday} ({date}). انقلها'),
  ('alert_late_integration', '{name}’s integration was due {date}', 'كان موعد ربطات {name} {date}'),
  ('alert_late_setup', '{name}’s setup checklist was due {date}', 'كان موعد قائمة إعداد {name} {date}'),
  ('alert_late_transfer', 'Too late to transfer {name} for that session. Move the session', 'فات موعد تحويل {name} لتلك الجلسة. انقل الجلسة'),
  ('alert_late_transfer_admin', 'Too late to transfer {name} for that session', 'فات موعد تحويل {name} لتلك الجلسة'),
  ('alert_missed', '{name}’s session time passed before Transfer. Book again', 'مضى موعد جلسة {name} قبل التحويل. احجز من جديد'),
  ('alert_missed_admin', '{name}’s session time passed before Transfer', 'مضى موعد جلسة {name} قبل التحويل'),
  ('alert_late_recording', 'Send {name}’s recording', 'أرسل تسجيل {name}'),
  ('alert_doc_late', '{name}’s {document} was due {date}', 'كان موعد {document} الخاص بـ{name} {date}'),
  ('alert_job_failed_email', 'An email keeps failing: {error}', 'تتعثر رسالة بريد: {error}'),
  ('alert_job_failed_calendar', 'A calendar update keeps failing: {error}', 'يتعثر تحديث التقويم: {error}'),
  ('alert_low_rating', '{name} rated the session {stars} of 5', 'قيّم {name} الجلسة {stars} من 5'),
  ('field_first_name', 'first name', 'الاسم الأول'),
  ('field_last_name', 'last name', 'اسم العائلة'),
  ('field_email', 'email', 'البريد الإلكتروني'),
  ('field_phone', 'phone', 'رقم الجوال'),
  ('field_language', 'language', 'اللغة'),
  ('field_company', 'company', 'الشركة'),
  ('field_cr', 'cr', 'السجل التجاري'),
  ('field_vat', 'vat', 'الرقم الضريبي'),
  ('field_city', 'city', 'المدينة'),
  ('field_website', 'website', 'الموقع الإلكتروني'),
  ('field_industry', 'industry', 'القطاع'),
  ('field_size', 'size', 'حجم الشركة'),
  ('field_plan', 'plan', 'نوع النشاط'),
  ('field_branches', 'branches', 'الفروع'),
  ('field_users', 'users', 'المستخدمون'),
  ('field_features', 'features', 'الخصائص'),
  ('field_integrations', 'integrations', 'الربطات'),
  ('field_hardware', 'hardware', 'الأجهزة'),
  ('field_doc_due', 'doc due', 'مواعيد المستندات');
