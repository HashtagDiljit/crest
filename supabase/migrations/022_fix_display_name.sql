-- Fix profiles.username for accounts where it was never set to a real
-- display name and is currently null or holds the email's local-part
-- (e.g. "diljitsingh2003"), which renders as a raw handle in the UI
-- instead of a friendly name like "Diljit Singh".
update public.profiles p
set username = 'Diljit Singh'
from auth.users u
where p.id = u.id
  and u.email = 'diljitsingh2003@gmail.com'
  and (p.username is null or p.username ilike 'diljitsingh2003%');
