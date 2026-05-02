-- Display bonuses for homepage carousel / offers tab (admin-editable labels like "5X", "3X")
CREATE TABLE IF NOT EXISTS public.offer_promotions (
  id text PRIMARY KEY CHECK (id IN ('offer1', 'offer2', 'offer3', 'offer4', 'offer5')),
  bonus_label text NOT NULL DEFAULT '5X',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.offer_promotions (id, bonus_label)
VALUES
  ('offer5', '5X'),
  ('offer1', '5X'),
  ('offer2', '5X'),
  ('offer3', '5X'),
  ('offer4', '5X')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.offer_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read offer_promotions"
  ON public.offer_promotions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins update offer_promotions"
  ON public.offer_promotions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.offer_promotions;

CREATE TRIGGER touch_offer_promotions BEFORE UPDATE ON public.offer_promotions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
