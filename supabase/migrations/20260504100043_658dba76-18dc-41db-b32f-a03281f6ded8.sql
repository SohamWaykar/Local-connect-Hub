-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('customer', 'provider', 'admin');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE public.provider_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.price_type AS ENUM ('hourly', 'fixed');

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- USER ROLES (separate table — never on profiles)
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer role checker (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- =========================================================
-- PROVIDERS
-- =========================================================
CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  category TEXT NOT NULL,
  hourly_rate NUMERIC(10,2),
  location TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  status public.provider_status NOT NULL DEFAULT 'pending',
  avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_providers_status ON public.providers(status);
CREATE INDEX idx_providers_category ON public.providers(category);

-- =========================================================
-- SERVICES
-- =========================================================
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  price_type public.price_type NOT NULL DEFAULT 'hourly',
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_services_provider ON public.services(provider_id);
CREATE INDEX idx_services_category ON public.services(category);

-- =========================================================
-- AVAILABILITY SLOTS
-- =========================================================
CREATE TABLE public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_slots_provider_time ON public.availability_slots(provider_id, starts_at);

-- Validation trigger (no CHECK with now())
CREATE OR REPLACE FUNCTION public.validate_slot()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.ends_at <= NEW.starts_at THEN
    RAISE EXCEPTION 'Slot end must be after start';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_slot
BEFORE INSERT OR UPDATE ON public.availability_slots
FOR EACH ROW EXECUTE FUNCTION public.validate_slot();

-- =========================================================
-- BOOKINGS
-- =========================================================
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL UNIQUE REFERENCES public.availability_slots(id) ON DELETE RESTRICT,
  status public.booking_status NOT NULL DEFAULT 'pending',
  total_price NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX idx_bookings_provider ON public.bookings(provider_id);

-- When a booking is created, mark slot booked
CREATE OR REPLACE FUNCTION public.mark_slot_booked()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.availability_slots SET is_booked = true WHERE id = NEW.slot_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE public.availability_slots SET is_booked = false WHERE id = NEW.slot_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_mark_slot_booked
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.mark_slot_booked();

-- =========================================================
-- updated_at trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_providers_touch BEFORE UPDATE ON public.providers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_services_touch BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_bookings_touch BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- Auto-create profile + default customer role on signup
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- profiles
CREATE POLICY "Profiles public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins update any profile" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- providers
CREATE POLICY "Approved providers public read" ON public.providers FOR SELECT USING (status = 'approved' OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own provider" ON public.providers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update provider" ON public.providers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin update provider" ON public.providers FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete provider" ON public.providers FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- services
CREATE POLICY "Active services public read" ON public.services FOR SELECT USING (
  active = true OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Provider manage own services" ON public.services FOR ALL USING (
  EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
);

-- availability_slots
CREATE POLICY "Slots public read" ON public.availability_slots FOR SELECT USING (true);
CREATE POLICY "Provider manage own slots" ON public.availability_slots FOR ALL USING (
  EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
);

-- bookings
CREATE POLICY "Booking parties read" ON public.bookings FOR SELECT USING (
  auth.uid() = customer_id
  OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Customer create booking" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Booking parties update" ON public.bookings FOR UPDATE USING (
  auth.uid() = customer_id
  OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
