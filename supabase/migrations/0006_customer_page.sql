-- The customer's page, /after/:token: the recording and the feedback form, with no sign-in.
-- The token is the member's random after_token; a wrong one gets nothing back.

/**
 * What the page needs, in the member's language: their first name, the recording, until when
 * the link is open, whether it has closed or they already rated, and the page's wording (texts
 * that start with "after_"). A token that isn't a sent recording link gets found = false and the
 * wording in English, so the page can still say so; a closed link no longer gives the recording.
 * `p_lang` ("en" or "ar") is the customer's own pick on the page's switch.
 */
create function public.after_get(p_token text, p_lang text default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  m public.members;
  s public.settings := private.settings();
  closed boolean;
  lang text;
begin
  if p_token ~* '^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$' then
    select * into m from public.members where after_token = p_token::uuid and recording_sent_at is not null;
  end if;
  closed := m.outcome is not null or m.link_expires_at <= private.app_now();
  lang := coalesce(case when p_lang in ('en', 'ar') then p_lang end, m.language, 'en');
  return jsonb_build_object(
    'found', m.id is not null,
    'language', lang,
    'name', m.first_name,
    'recording_link', case when not closed then m.recording_link end,
    'expires_at', m.link_expires_at,
    'closed', closed,
    'rated', m.rating is not null,
    'company', coalesce(case when lang = 'ar' then nullif(s.company ->> 'name_ar', '') end, s.company ->> 'name', ''),
    'support_phone', coalesce(s.company ->> 'support_phone', ''),
    -- An Arabic text the Admin left empty falls back to the English one.
    'texts', coalesce((select jsonb_object_agg(t.key, case when lang = 'ar' then coalesce(nullif(t.ar, ''), t.en) else t.en end)
              from public.texts t where t.key like 'after\_%'), '{}'));
end $$;

/**
 * Saves the customer's 1 to 5 stars and comment, once, while the link is open. A low rating tells
 * the Admin. The feedback closes the member at once; the recording stays open until the link ends.
 */
create function public.after_rate(p_token uuid, p_stars int, p_comment text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members;
  low int := (private.settings()).low_rating_max;
begin
  select * into m from public.members where after_token = p_token and recording_sent_at is not null for update;
  if not found then raise exception 'This link isn’t valid.' using hint = 'link_invalid'; end if;
  if m.outcome is not null or m.link_expires_at <= private.app_now() then raise exception 'This link has closed.' using hint = 'link_closed'; end if;
  if m.rating is not null then raise exception 'Thank you, your rating is already in.' using hint = 'already_rated'; end if;
  if p_stars not between 1 and 5 then raise exception 'Pick from 1 to 5 stars.' using hint = 'pick_stars'; end if;

  update public.members set rating = p_stars, rating_comment = nullif(trim(left(p_comment, 2000)), ''), rated_at = private.app_now()
  where id = m.id;
  perform private.log(m.id, 'rating', case when nullif(trim(left(p_comment, 2000)), '') is null then 'log_rated' else 'log_rated_comment' end,
    jsonb_build_object('stars', p_stars, 'comment', nullif(trim(left(p_comment, 2000)), '')));
  if m.stage = 'recording' then
    update public.members set stage = 'closed', holder_since = private.app_now() where id = m.id;
    perform private.log(m.id, 'closed', 'log_closed_feedback');
  end if;
  if p_stars <= low then
    perform private.alert_admins(m.id, 'low_rating', 'alert_low_rating', jsonb_build_object('name', private.full_name(m), 'stars', p_stars), 'low_rating:' || m.id);
    perform private.alert(m.onboarding_id, m.id, 'low_rating', 'alert_low_rating', jsonb_build_object('name', private.full_name(m), 'stars', p_stars), 'low_rating:' || m.id);
  end if;
end $$;

/** The brand words the sign-in pages show before anyone signs in (Settings → Company). Nothing else. */
create function public.brand() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('app_name', company ->> 'app_name', 'product_name', company ->> 'product_name',
    'legal_name', company ->> 'legal_name', 'legal_name_ar', company ->> 'legal_name_ar')
  from public.settings
$$;

-- New functions start callable by everyone; then only these three are opened to visitors.
revoke execute on function public.after_get(text, text), public.after_rate(uuid, int, text), public.brand() from public;
grant execute on function public.after_get(text, text), public.after_rate(uuid, int, text), public.brand() to anon, authenticated;
