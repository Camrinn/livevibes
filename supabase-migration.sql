-- ============================================================
-- Live Vibes: Venue Submissions + Admin Migration
-- Run this in your Supabase SQL editor
-- ============================================================

-- 1. Add status/submission tracking to venues
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'
    CHECK (status IN ('active', 'pending', 'rejected')),
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz DEFAULT now();

-- Backfill: all existing venues are already active
UPDATE venues SET status = 'active' WHERE status IS NULL;

-- 2. Add admin flag to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 3. Auto-approve a pending venue when 3 unique users check in
CREATE OR REPLACE FUNCTION maybe_auto_approve_venue()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_status text;
  v_unique integer;
BEGIN
  SELECT status INTO v_status FROM venues WHERE id = NEW.venue_id;
  IF v_status IS DISTINCT FROM 'pending' THEN RETURN NEW; END IF;

  SELECT COUNT(DISTINCT user_id) INTO v_unique
  FROM checkins WHERE venue_id = NEW.venue_id;

  IF v_unique >= 3 THEN
    UPDATE venues SET status = 'active' WHERE id = NEW.venue_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_approve_venue_on_checkin ON checkins;
CREATE TRIGGER auto_approve_venue_on_checkin
  AFTER INSERT ON checkins
  FOR EACH ROW EXECUTE FUNCTION maybe_auto_approve_venue();

-- 4. RLS: allow any authenticated user to insert a pending venue
-- (adjust if your venues table has different policies)
CREATE POLICY IF NOT EXISTS "Users can submit venues"
  ON venues FOR INSERT
  TO authenticated
  WITH CHECK (status = 'pending' AND submitted_by = auth.uid());

-- 5. Grant admin to yourself (replace with your user id from auth.users)
-- UPDATE users SET is_admin = true WHERE id = 'your-user-uuid-here';
