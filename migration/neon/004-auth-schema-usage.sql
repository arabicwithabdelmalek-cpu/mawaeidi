-- Required by SECURITY INVOKER RPCs that explicitly call auth.uid().
-- Expose only public through Data API; do not expose auth or neon_auth schemas.
GRANT USAGE ON SCHEMA auth TO authenticated;
