-- Create avatars storage bucket with public read access
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for all objects in the avatars bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'avatars_public_read' AND tablename = 'objects'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "avatars_public_read"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'avatars')
    $policy$;
  END IF;
END $$;

-- Users can upload/overwrite only their own folder (avatars/{user_id}/...)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'avatars_user_insert' AND tablename = 'objects'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "avatars_user_insert"
        ON storage.objects FOR INSERT
        WITH CHECK (
          bucket_id = 'avatars'
          AND auth.uid()::text = (storage.foldername(name))[1]
        )
    $policy$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'avatars_user_update' AND tablename = 'objects'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "avatars_user_update"
        ON storage.objects FOR UPDATE
        USING (
          bucket_id = 'avatars'
          AND auth.uid()::text = (storage.foldername(name))[1]
        )
    $policy$;
  END IF;
END $$;
