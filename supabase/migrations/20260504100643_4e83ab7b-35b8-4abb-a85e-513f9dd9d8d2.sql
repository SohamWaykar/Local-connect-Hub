ALTER TABLE public.providers
  ADD CONSTRAINT providers_profile_fk FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_customer_profile_fk FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
