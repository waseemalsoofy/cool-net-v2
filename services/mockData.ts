
import { User, UserRole, UserStatus, Card, CardStatus, WalletTransaction, TransactionStatus, Package } from '../types';
import { PACKAGES } from '../constants';

// Initial Mock Users
const INITIAL_USERS: User[] = [
  { id: '1', name: 'المدير العام', phone: '777000000', role: UserRole.ADMIN, status: UserStatus.ACTIVE, walletBalance: 0 },
  { id: '2', name: 'أحمد التاجر', phone: '777111111', role: UserRole.WHOLESALER, status: UserStatus.ACTIVE, walletBalance: 5000 },
  { id: '3', name: 'صالح العميل', phone: '777222222', role: UserRole.CUSTOMER, status: UserStatus.ACTIVE, walletBalance: 150 },
];

// Initial Mock Cards
const INITIAL_CARDS: Card[] = [];
PACKAGES.forEach(pkg => {
  for (let i = 0; i < 20; i++) {
    INITIAL_CARDS.push({
      id: `card-${pkg.id}-${i}`,
      packageId: pkg.id,
      cardNumber: `${pkg.id}${Math.floor(10000000 + Math.random() * 90000000)}`,
      status: CardStatus.AVAILABLE
    });
  }
});

class MockDB {
  users: User[] = INITIAL_USERS;
  cards: Card[] = INITIAL_CARDS;
  transactions: WalletTransaction[] = [];
  orders: any[] = [];

  constructor() {
    const sUsers = localStorage.getItem('db_users');
    const sCards = localStorage.getItem('db_cards');
    const sTrans = localStorage.getItem('db_transactions');
    if (sUsers) this.users = JSON.parse(sUsers);
    if (sCards) this.cards = JSON.parse(sCards);
    if (sTrans) this.transactions = JSON.parse(sTrans);
  }

  save() {
    localStorage.setItem('db_users', JSON.stringify(this.users));
    localStorage.setItem('db_cards', JSON.stringify(this.cards));
    localStorage.setItem('db_transactions', JSON.stringify(this.transactions));
  }

  login(phone: string, pass: string): User | null {
    // In mock, any password works except for simulating error cases
    return this.users.find(u => u.phone === phone) || null;
  }

  register(user: Partial<User>): User {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: user.name || '',
      phone: user.phone || '',
      role: user.role || UserRole.CUSTOMER,
      status: user.role === UserRole.WHOLESALER ? UserStatus.PENDING : UserStatus.ACTIVE,
      walletBalance: 0,
      ...user
    };
    this.users.push(newUser);
    this.save();
    return newUser;
  }

  requestDeposit(userId: string, amount: number, method: string, reference: string) {
    const trans: WalletTransaction = {
      id: `trans-${Date.now()}`,
      userId,
      amount,
      paymentMethod: method,
      reference,
      status: TransactionStatus.PENDING,
      timestamp: Date.now()
    };
    this.transactions.push(trans);
    this.save();
    return trans;
  }

  approveDeposit(transId: string) {
    const trans = this.transactions.find(t => t.id === transId);
    if (trans && trans.status === TransactionStatus.PENDING) {
      trans.status = TransactionStatus.APPROVED;
      const user = this.users.find(u => u.id === trans.userId);
      if (user) user.walletBalance += trans.amount;
      this.save();
    }
  }

  approveWholesaler(userId: string) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.status = UserStatus.ACTIVE;
      this.save();
    }
  }

  purchaseCard(userId: string, packageId: string, isWallet: boolean, customerPhone?: string) {
    const user = this.users.find(u => u.id === userId);
    const pkg = PACKAGES.find(p => p.id === packageId);
    if (!user || !pkg) throw new Error("بيانات غير صالحة");

    const price = user.role === UserRole.WHOLESALER ? pkg.wholesalePrice : pkg.basePrice;
    const finalPrice = isWallet ? price * 0.95 : price;

    if (isWallet && user.walletBalance < finalPrice) {
      throw new Error("رصيد غير كافي");
    }

    const card = this.cards.find(c => c.packageId === packageId && c.status === CardStatus.AVAILABLE);
    if (!card) throw new Error("لا توجد كروت متاحة حالياً لهذه الباقة");

    // Process Purchase
    if (isWallet) {
      user.walletBalance -= finalPrice;
    }
    card.status = CardStatus.SOLD;
    card.soldToUserId = userId;

    const order = {
      id: `order-${Date.now()}`,
      userId,
      packageId,
      cardId: card.id,
      cardNumber: card.cardNumber, // For customer record
      totalPrice: finalPrice,
      paymentMethod: isWallet ? 'WALLET' : 'DIRECT',
      customerPhone,
      timestamp: Date.now()
    };
    this.orders.push(order);
    this.save();
    return order;
  }
}

export const mockAuth = new MockDB();
