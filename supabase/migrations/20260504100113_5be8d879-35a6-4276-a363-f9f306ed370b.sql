-- Set search_path on remaining functions (touch_updated_at, validate_slot)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.validate_slot()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.ends_at <= NEW.starts_at THEN
    RAISE EXCEPTION 'Slot end must be after start';
  END IF;
  RETURN NEW;
END;
$$;

-- Restrict direct execution of internal SECURITY DEFINER functions.
-- has_role stays callable (used in RLS policies — needs to be invokable by API roles).
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_slot_booked() FROM PUBLIC, anon, authenticated;
