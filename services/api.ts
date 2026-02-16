
import { supabase } from './supabase';
import { User, UserRole, UserStatus, Card, TransactionStatus } from '../types';

export const api = {
    // Auth
    async login(phone: string, password: string): Promise<{ user: User | null; error: string | null }> {
        const email = `${phone}@coolnet.com`;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) return { user: null, error: error.message };
        if (!data.user) return { user: null, error: "Login failed" };

        const user = await this.getProfile(data.user.id);
        if (!user) return { user: null, error: "Profile not found" };

        return { user, error: null };
    },

    async getProfile(userId: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !data) return null;

        return {
            id: data.id,
            name: data.name,
            phone: data.phone,
            role: data.role as UserRole,
            status: data.status as UserStatus,
            walletBalance: data.wallet_balance
        };
    },

    async register(name: string, phone: string, password: string, role: UserRole): Promise<{ user: User | null; error: string | null }> {
        const email = `${phone}@coolnet.com`;

        // 1. Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) return { user: null, error: authError.message };
        if (!authData.user) return { user: null, error: "Registration failed" };

        // 2. Create Profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: authData.user.id,
                name,
                phone,
                role,
                status: role === UserRole.WHOLESALER ? 'PENDING' : 'ACTIVE',
                wallet_balance: 0
            });

        if (profileError) {
            // Cleanup auth user if profile creation fails? Ideally yes, but tricky.
            return { user: null, error: profileError.message };
        }

        const user: User = {
            id: authData.user.id,
            name,
            phone,
            role,
            status: role === UserRole.WHOLESALER ? UserStatus.PENDING : UserStatus.ACTIVE,
            walletBalance: 0
        };

        return { user, error: null };
    },

    // Data
    async getPackages() {
        const { data, error } = await supabase.from('packages').select('*');
        return { data, error };
    },

    async buyCard(userId: string, packageId: string, isWallet: boolean, customerPhone?: string) {
        // 1. Get Package
        const { data: pkg, error: pkgError } = await supabase.from('packages').select('*').eq('id', packageId).single();
        if (pkgError || !pkg) return { error: "باقة غير موجودة" };

        const price = pkg.base_price; // TODO: Wholesaler price logic needs user role check.
        // For now let's assume base_price unless we fetch user role again.
        // Better to trust the server or fetch profile.
        const user = await this.getProfile(userId);
        if (!user) return { error: "المستخدم غير موجود" };

        const finalPrice = user.role === UserRole.WHOLESALER ? pkg.wholesale_price : pkg.base_price;
        // Wallet discount logic? 
        // In mock: const finalPrice = isWallet ? price * 0.95 : price;
        // Let's apply that.
        const payAmount = isWallet ? finalPrice * 0.95 : finalPrice;

        if (isWallet && user.walletBalance < payAmount) {
            return { error: "رصيد غير كافي" };
        }

        // 2. Find Card
        const { data: card, error: cardError } = await supabase
            .from('cards')
            .select('*')
            .eq('package_id', packageId)
            .eq('status', 'AVAILABLE')
            .limit(1)
            .single();

        if (cardError || !card) return { error: "لا توجد كروت متاحة حالياً" };

        // 3. Update Card (Optimistic locking or just hope no race condition)
        const { error: updateError } = await supabase
            .from('cards')
            .update({ status: 'SOLD', sold_to_user_id: userId })
            .eq('id', card.id)
            .eq('status', 'AVAILABLE'); // Safety check

        if (updateError) return { error: "فشل في حجز الكرت، حاول مرة أخرى" };

        // 4. Update Balance
        if (isWallet) {
            const newBalance = user.walletBalance - payAmount;
            await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', userId);
        }

        // 5. Create Order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: userId,
                package_id: packageId,
                card_id: card.id,
                total_price: payAmount,
                payment_method: isWallet ? 'WALLET' : 'DIRECT',
                customer_phone: customerPhone
            })
            .select()
            .single();

        return { order: { ...order, cardNumber: card.card_number }, error: null };
    },

    async requestDeposit(userId: string, amount: number, method: string, reference: string) {
        const { data, error } = await supabase.from('transactions').insert({
            user_id: userId,
            amount,
            type: 'DEPOSIT',
            status: 'PENDING',
            payment_method: method,
            reference
        });
        return { error };
    },

    async getTransactions(userId: string) {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        // Map to local type
        return {
            transactions: data?.map(t => ({
                id: t.id,
                userId: t.user_id,
                amount: t.amount,
                paymentMethod: t.payment_method,
                reference: t.reference,
                status: t.status as TransactionStatus,
                timestamp: new Date(t.created_at).getTime()
            })) || [],
            error
        };
    },

    // Admin
    async getAdminData() {
        const { data: users } = await supabase.from('profiles').select('*');
        const { data: cards } = await supabase.from('cards').select('*');
        const { data: transactions } = await supabase.from('transactions').select('*');

        return {
            users: users?.map(u => ({
                id: u.id,
                name: u.name,
                phone: u.phone,
                role: u.role as UserRole,
                status: u.status as UserStatus,
                walletBalance: u.wallet_balance
            })) || [],
            cards: cards?.map(c => ({
                id: c.id,
                packageId: c.package_id,
                cardNumber: c.card_number,
                status: c.status,
                soldToUserId: c.sold_to_user_id
            })) || [],
            transactions: transactions?.map(t => ({
                id: t.id,
                userId: t.user_id,
                amount: t.amount,
                paymentMethod: t.payment_method,
                reference: t.reference,
                status: t.status as TransactionStatus,
                timestamp: new Date(t.created_at).getTime()
            })) || []
        };
    },

    async approveDeposit(transId: string) {
        // 1. Get transaction
        const { data: trans } = await supabase.from('transactions').select('*').eq('id', transId).single();
        if (!trans || trans.status !== 'PENDING') return;

        // 2. Update status
        await supabase.from('transactions').update({ status: 'APPROVED' }).eq('id', transId);

        // 3. Add balance
        // We need to fetch current balance first? Or use an RPC inc function.
        // Client side read-modify-write for now.
        const { data: user } = await supabase.from('profiles').select('wallet_balance').eq('id', trans.user_id).single();
        if (user) {
            await supabase.from('profiles').update({ wallet_balance: user.wallet_balance + trans.amount }).eq('id', trans.user_id);
        }
    },

    async approveWholesaler(userId: string) {
        await supabase.from('profiles').update({ status: 'ACTIVE' }).eq('id', userId);
    }
};
