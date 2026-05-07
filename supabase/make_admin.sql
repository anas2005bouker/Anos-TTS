-- After you sign up in the website, replace the email below and run this once.
update public.profiles
set role = 'admin', status = 'active', updated_at = now()
where lower(email) = lower('YOUR_EMAIL_HERE@example.com');

select id, email, role, status from public.profiles where lower(email) = lower('YOUR_EMAIL_HERE@example.com');
