-- Enforce a maximum of 4 PR attach images per contract.
-- Run in Supabase SQL editor if the table already exists.

CREATE OR REPLACE FUNCTION public.enforce_contract_images_max_four()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  image_count integer;
BEGIN
  SELECT COUNT(*)
  INTO image_count
  FROM public.contract_images_sites
  WHERE contract_id = NEW.contract_id;

  IF image_count >= 4 THEN
    RAISE EXCEPTION 'Maximum of 4 images allowed per contract';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contract_images_max_four ON public.contract_images_sites;

CREATE TRIGGER trg_contract_images_max_four
BEFORE INSERT ON public.contract_images_sites
FOR EACH ROW
EXECUTE FUNCTION public.enforce_contract_images_max_four();
