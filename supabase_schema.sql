
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'WHOLESALER', 'CUSTOMER')),
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  wallet_balance DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Access policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create packages table (Admin managed)
CREATE TABLE public.packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  wholesale_price DECIMAL(10, 2) NOT NULL,
  duration TEXT NOT NULL,
  speed TEXT NOT NULL,
  quota TEXT NOT NULL
);

-- Enable RLS for packages
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Packages are viewable by everyone" ON public.packages FOR SELECT USING (true);

-- Create cards table
CREATE TABLE public.cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id TEXT REFERENCES public.packages(id),
  card_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('AVAILABLE', 'SOLD', 'USED', 'EXPIRED')),
  sold_to_user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all cards" ON public.cards FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));
CREATE POLICY "Users can view purchased cards" ON public.cards FOR SELECT USING (sold_to_user_id = auth.uid());

-- Transactions table
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT NOT NULL, -- DEPOSIT, PURCHASE
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED')),
  payment_method TEXT,
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert transactions" ON public.transactions FOR INSERT WITH CHECK (user_id = auth.uid());

-- Orders table
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  package_id TEXT REFERENCES public.packages(id),
  card_id UUID REFERENCES public.cards(id),
  total_price DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  customer_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert orders" ON public.orders FOR INSERT WITH CHECK (user_id = auth.uid());

-- Seeding Packages
INSERT INTO public.packages (id, name, base_price, wholesale_price, duration, speed, quota) VALUES
('pkg_100', 'فئة 100ريال', 100, 90, '5 ساعات', '1Mbps', '400MB'),
('pkg_250', ' فئة 250 ريال', 250, 230, '12 ساعة', '2Mbps', '1200MB'),
('pkg_500', 'فئة 500 ريال', 500, 450, '30 ساعة', '4Mbps', '2500MB'),
('pkg_1000', 'فئة 1000 ريال', 1000, 900, '70 ساعة', '6Mbps', '5000MB'),
('pkg_m', 'اشتراك شهري', 4000, 3500, '30 يوم', '8Mbps', '20GB');
