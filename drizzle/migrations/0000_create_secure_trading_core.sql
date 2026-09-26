CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.account_status AS ENUM ('active', 'suspended', 'closed');
CREATE TYPE public.order_status AS ENUM ('pending_provider', 'submitted', 'filled', 'cancelled', 'rejected');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text CHECK (char_length(display_name) <= 80),
  status public.account_status NOT NULL DEFAULT 'active',
  currency text NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own account" ON public.accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own account" ON public.accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own display name" ON public.accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND status = (SELECT a.status FROM public.accounts a WHERE a.user_id = auth.uid()));

CREATE TABLE public.balance_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount_usd numeric(20,2) NOT NULL CHECK (amount_usd <> 0),
  entry_type text NOT NULL CHECK (entry_type IN ('admin_credit','admin_debit','order_reserve','order_release','settlement')),
  reference_id uuid,
  note text CHECK (char_length(note) <= 280),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.balance_ledger TO authenticated;
GRANT ALL ON public.balance_ledger TO service_role;
ALTER TABLE public.balance_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own ledger" ON public.balance_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX balance_ledger_user_created_idx ON public.balance_ledger (user_id, created_at DESC);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pair text NOT NULL CHECK (pair ~ '^[A-Z0-9]{2,10}/USD$'),
  allocation_percent integer NOT NULL CHECK (allocation_percent IN (10, 25, 50, 75, 100)),
  amount_usd numeric(20,2) NOT NULL CHECK (amount_usd > 0),
  reference_price numeric(24,8) NOT NULL CHECK (reference_price > 0),
  status public.order_status NOT NULL DEFAULT 'pending_provider',
  provider_order_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX orders_user_created_idx ON public.orders (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

CREATE POLICY "Users read own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.current_balance(_user_id uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(amount_usd), 0)::numeric FROM public.balance_ledger WHERE user_id = _user_id
$$;
REVOKE ALL ON FUNCTION public.current_balance(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_balance(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.initialize_my_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.accounts (user_id) VALUES (auth.uid()) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'user') ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.initialize_my_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.initialize_my_account() TO authenticated;