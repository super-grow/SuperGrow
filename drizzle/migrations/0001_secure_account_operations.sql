REVOKE UPDATE ON public.accounts FROM authenticated;

CREATE OR REPLACE FUNCTION public.update_my_display_name(_display_name text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF char_length(trim(_display_name)) < 2 OR char_length(trim(_display_name)) > 80 THEN RAISE EXCEPTION 'Invalid display name'; END IF;
  INSERT INTO public.accounts (user_id, display_name) VALUES (auth.uid(), trim(_display_name))
  ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, updated_at = now();
END;
$$;
REVOKE ALL ON FUNCTION public.update_my_display_name(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_display_name(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.place_order(_pair text, _allocation_percent integer, _reference_price numeric)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _balance numeric;
  _amount numeric;
  _order_id uuid;
  _status public.account_status;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF _pair !~ '^[A-Z0-9]{2,10}/USD$' THEN RAISE EXCEPTION 'Invalid pair'; END IF;
  IF _allocation_percent NOT IN (10,25,50,75,100) THEN RAISE EXCEPTION 'Invalid allocation'; END IF;
  IF _reference_price <= 0 THEN RAISE EXCEPTION 'Invalid reference price'; END IF;
  SELECT status INTO _status FROM public.accounts WHERE user_id = auth.uid() FOR UPDATE;
  IF _status IS DISTINCT FROM 'active' THEN RAISE EXCEPTION 'Account is not active'; END IF;
  SELECT COALESCE(SUM(amount_usd), 0) INTO _balance FROM public.balance_ledger WHERE user_id = auth.uid();
  IF _balance <= 0 THEN RAISE EXCEPTION 'Insufficient available balance'; END IF;
  _amount := round(_balance * _allocation_percent / 100.0, 2);
  INSERT INTO public.orders (user_id,pair,allocation_percent,amount_usd,reference_price,status)
  VALUES (auth.uid(),_pair,_allocation_percent,_amount,_reference_price,'pending_provider') RETURNING id INTO _order_id;
  INSERT INTO public.balance_ledger (user_id,amount_usd,entry_type,reference_id,note,created_by)
  VALUES (auth.uid(),-_amount,'order_reserve',_order_id,'Reserved for order ' || _pair,auth.uid());
  RETURN _order_id;
END;
$$;
REVOKE ALL ON FUNCTION public.place_order(text,integer,numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(text,integer,numeric) TO authenticated;