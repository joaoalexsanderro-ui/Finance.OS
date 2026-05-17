export type TransactionType = 'payable' | 'receivable' | 'transfer';
export type TransactionStatus = 'paid' | 'pending';

export interface Bank {
  id: string;
  name: string;
  balance: number;
  color: string;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  used: number;
  closingDay: number;
  dueDate: number;
  color: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  bankId?: string; // Origin bank or bank where payment happened
  cardId?: string; // Card used for payment
  toBankId?: string; // For transfers to another bank
  toGoalId?: string; // For transfers to a goal
  category: string;
  isCardBillPayment?: boolean;
}

export interface FinancialState {
  banks: Bank[];
  cards: CreditCard[];
  goals: Goal[];
  transactions: Transaction[];
}
