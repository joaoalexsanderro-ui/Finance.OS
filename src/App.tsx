/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, LayoutDashboard, Search, Bell, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { FinancialState, Bank, CreditCard, Transaction, TransactionStatus, Goal } from './types';
import Dashboard from './components/Dashboard';
import BankAndCardSection from './components/BankAndCardSection';
import GoalsSection from './components/GoalsSection';
import TransactionTable from './components/TransactionTable';
import { Modal, TransactionForm, BankForm, CardForm, GoalForm } from './components/Modals';
import { auth, loginWithGoogle, logout } from './lib/firebase';
import { 
  subscribeToData, 
  saveBank, 
  deleteBankDoc, 
  saveCard, 
  deleteCardDoc, 
  saveGoal, 
  deleteGoalDoc, 
  saveTransaction, 
  deleteTransactionDoc 
} from './services/firebaseService';
import { onAuthStateChanged, User } from 'firebase/auth';

const INITIAL_STATE: FinancialState = {
  banks: [],
  cards: [],
  goals: [],
  transactions: []
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [state, setState] = useState<FinancialState>(INITIAL_STATE);

  const [activeModal, setActiveModal] = useState<'none' | 'bank' | 'card' | 'transaction' | 'goal'>('none');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions'>('dashboard');
  const [filterDate, setFilterDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
      if (!user) {
        setState(INITIAL_STATE);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToData((data) => {
      setState(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleCloseModal = () => {
    setActiveModal('none');
    setEditingTransaction(null);
    setEditingGoal(null);
    setEditingBank(null);
    setEditingCard(null);
  };

  const addBank = async (data: Partial<Bank>) => {
    const newBank: Bank = {
      id: editingBank ? editingBank.id : Math.random().toString(36).substring(7),
      name: data.name || '',
      balance: data.balance || 0,
      color: data.color || 'bg-blue-500'
    };
    await saveBank(newBank);
    handleCloseModal();
  };

  const deleteBank = async (id: string) => {
    await deleteBankDoc(id);
  };

  const startEditingBank = (bank: Bank) => {
    setEditingBank(bank);
    setActiveModal('bank');
  };

  const addCard = async (data: Partial<CreditCard>) => {
    const newCard: CreditCard = {
      id: editingCard ? editingCard.id : Math.random().toString(36).substring(7),
      name: data.name || '',
      limit: data.limit || 0,
      used: data.used || 0,
      closingDay: data.closingDay || 10,
      dueDate: data.dueDate || 20,
      color: data.color || 'bg-slate-700'
    };
    await saveCard(newCard);
    handleCloseModal();
  };

  const deleteCard = async (id: string) => {
    await deleteCardDoc(id);
  };

  const startEditingCard = (card: CreditCard) => {
    setEditingCard(card);
    setActiveModal('card');
  };

  const filteredTransactions = filterDate 
    ? state.transactions.filter(t => t.date.startsWith(filterDate))
    : state.transactions;

  const addGoal = async (data: Partial<Goal>) => {
    const newGoal: Goal = {
      id: editingGoal ? editingGoal.id : Math.random().toString(36).substring(7),
      name: data.name || '',
      targetAmount: data.targetAmount || 0,
      currentAmount: data.currentAmount || 0,
      color: data.color || 'bg-emerald-500'
    };
    await saveGoal(newGoal);
    handleCloseModal();
  };

  const deleteGoal = async (id: string) => {
    await deleteGoalDoc(id);
  };

  const startEditingGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setActiveModal('goal');
  };

  const addTransaction = async (data: Partial<Transaction>) => {
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const original = editingTransaction ? state.transactions.find(t => t.id === editingTransaction.id) : null;
    
    const finalTransaction: Transaction = {
      id: editingTransaction ? editingTransaction.id : Math.random().toString(36).substring(7),
      date: data.date || localDate,
      description: data.description || '',
      amount: data.amount || 0,
      type: data.type || 'payable',
      status: data.status || 'pending',
      category: data.category || 'Outros',
      bankId: data.bankId,
      cardId: data.cardId,
      toBankId: data.toBankId,
      toGoalId: data.toGoalId,
      isCardBillPayment: data.isCardBillPayment
    };

    // Calculate side effects
    let nextBanks = [...state.banks];
    let nextCards = [...state.cards];
    let nextGoals = [...state.goals];

    // 1. REVERT ORIGINAL EFFECT IF EDITING
    if (original && original.status === 'paid') {
      if (original.type === 'receivable' && original.bankId) {
        nextBanks = nextBanks.map(b => b.id === original.bankId ? { ...b, balance: b.balance - original.amount } : b);
      } else if (original.type === 'payable') {
        if (original.isCardBillPayment && original.bankId && original.cardId) {
          nextBanks = nextBanks.map(b => b.id === original.bankId ? { ...b, balance: b.balance + original.amount } : b);
          nextCards = nextCards.map(c => c.id === original.cardId ? { ...c, used: c.used + original.amount } : c);
        } else if (original.cardId) {
          nextCards = nextCards.map(c => c.id === original.cardId ? { ...c, used: c.used - original.amount } : c);
        } else if (original.bankId) {
          nextBanks = nextBanks.map(b => b.id === original.bankId ? { ...b, balance: b.balance + original.amount } : b);
        }
      } else if (original.type === 'transfer' && original.bankId) {
        if (original.toBankId) {
          nextBanks = nextBanks.map(b => {
             if (b.id === original.bankId) return { ...b, balance: b.balance + original.amount };
             if (b.id === original.toBankId) return { ...b, balance: b.balance - original.amount };
             return b;
          });
        } else if (original.toGoalId) {
          nextBanks = nextBanks.map(b => b.id === original.bankId ? { ...b, balance: b.balance + original.amount } : b);
          nextGoals = nextGoals.map(g => g.id === original.toGoalId ? { ...g, currentAmount: g.currentAmount - original.amount } : g);
        }
      }
    }

    // 2. APPLY NEW EFFECT
    if (finalTransaction.status === 'paid') {
      if (finalTransaction.type === 'receivable' && finalTransaction.bankId) {
        nextBanks = nextBanks.map(b => b.id === finalTransaction.bankId ? { ...b, balance: b.balance + finalTransaction.amount } : b);
      } else if (finalTransaction.type === 'payable') {
        if (finalTransaction.isCardBillPayment && finalTransaction.bankId && finalTransaction.cardId) {
          nextBanks = nextBanks.map(b => b.id === finalTransaction.bankId ? { ...b, balance: b.balance - finalTransaction.amount } : b);
          nextCards = nextCards.map(c => c.id === finalTransaction.cardId ? { ...c, used: c.used - finalTransaction.amount } : c);
        } else if (finalTransaction.cardId) {
          nextCards = nextCards.map(c => c.id === finalTransaction.cardId ? { ...c, used: c.used + finalTransaction.amount } : c);
        } else if (finalTransaction.bankId) {
          nextBanks = nextBanks.map(b => b.id === finalTransaction.bankId ? { ...b, balance: b.balance - finalTransaction.amount } : b);
        }
      } else if (finalTransaction.type === 'transfer' && finalTransaction.bankId) {
        if (finalTransaction.toBankId) {
          nextBanks = nextBanks.map(b => {
             if (b.id === finalTransaction.bankId) return { ...b, balance: b.balance - finalTransaction.amount };
             if (b.id === finalTransaction.toBankId) return { ...b, balance: b.balance + finalTransaction.amount };
             return b;
          });
        } else if (finalTransaction.toGoalId) {
          nextBanks = nextBanks.map(b => b.id === finalTransaction.bankId ? { ...b, balance: b.balance - finalTransaction.amount } : b);
          nextGoals = nextGoals.map(g => g.id === finalTransaction.toGoalId ? { ...g, currentAmount: g.currentAmount + finalTransaction.amount } : g);
        }
      }
    }

    // Save all changes
    await saveTransaction(finalTransaction);
    for (const b of nextBanks) await saveBank(b);
    for (const c of nextCards) await saveCard(c);
    for (const g of nextGoals) await saveGoal(g);

    handleCloseModal();
  };

  const startEditing = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setActiveModal('transaction');
  };

  const toggleTransactionStatus = async (id: string) => {
    const t = state.transactions.find(item => item.id === id);
    if (!t) return;

    const newStatus: TransactionStatus = t.status === 'paid' ? 'pending' : 'paid';
    const isMarkingAsPaid = newStatus === 'paid';
    
    let nextBanks = [...state.banks];
    let nextCards = [...state.cards];
    let nextGoals = [...state.goals];

    const adjustAmount = isMarkingAsPaid ? t.amount : -t.amount;

    if (t.type === 'receivable' && t.bankId) {
      nextBanks = nextBanks.map(b => b.id === t.bankId ? { ...b, balance: b.balance + adjustAmount } : b);
    } else if (t.type === 'payable') {
      if (t.isCardBillPayment && t.bankId && t.cardId) {
        nextBanks = nextBanks.map(b => b.id === t.bankId ? { ...b, balance: b.balance - adjustAmount } : b);
        nextCards = nextCards.map(c => c.id === t.cardId ? { ...c, used: c.used - adjustAmount } : c);
      } else if (t.cardId) {
        nextCards = nextCards.map(c => c.id === t.cardId ? { ...c, used: c.used + adjustAmount } : c);
      } else if (t.bankId) {
        nextBanks = nextBanks.map(b => b.id === t.bankId ? { ...b, balance: b.balance - adjustAmount } : b);
      }
    } else if (t.type === 'transfer' && t.bankId) {
      if (t.toBankId) {
        nextBanks = nextBanks.map(b => {
           if (b.id === t.bankId) return { ...b, balance: b.balance - adjustAmount };
           if (b.id === t.toBankId) return { ...b, balance: b.balance + adjustAmount };
           return b;
        });
      } else if (t.toGoalId) {
        nextBanks = nextBanks.map(b => b.id === t.bankId ? { ...b, balance: b.balance - adjustAmount } : b);
        nextGoals = nextGoals.map(g => g.id === t.toGoalId ? { ...g, currentAmount: g.currentAmount + adjustAmount } : g);
      }
    }

    await saveTransaction({ ...t, status: newStatus });
    for (const b of nextBanks) await saveBank(b);
    for (const c of nextCards) await saveCard(c);
    for (const g of nextGoals) await saveGoal(g);
  };

  const deleteTransaction = async (id: string) => {
    const t = state.transactions.find(item => item.id === id);
    if (!t) return;

    let nextBanks = [...state.banks];
    let nextCards = [...state.cards];
    let nextGoals = [...state.goals];

    if (t.status === 'paid') {
      if (t.type === 'receivable' && t.bankId) {
        nextBanks = nextBanks.map(b => b.id === t.bankId ? { ...b, balance: b.balance - t.amount } : b);
      } else if (t.type === 'payable') {
        if (t.isCardBillPayment && t.bankId && t.cardId) {
          nextBanks = nextBanks.map(b => b.id === t.bankId ? { ...b, balance: b.balance + t.amount } : b);
          nextCards = nextCards.map(c => c.id === t.cardId ? { ...c, used: c.used + t.amount } : c);
        } else if (t.cardId) {
          nextCards = nextCards.map(c => c.id === t.cardId ? { ...c, used: c.used - t.amount } : c);
        } else if (t.bankId) {
          nextBanks = nextBanks.map(b => b.id === t.bankId ? { ...b, balance: b.balance + t.amount } : b);
        }
      } else if (t.type === 'transfer' && t.bankId) {
        if (t.toBankId) {
          nextBanks = nextBanks.map(b => {
             if (b.id === t.bankId) return { ...b, balance: b.balance + t.amount };
             if (b.id === t.toBankId) return { ...b, balance: b.balance - t.amount };
             return b;
          });
        } else if (t.toGoalId) {
          nextBanks = nextBanks.map(b => b.id === t.bankId ? { ...b, balance: b.balance + t.amount } : b);
          nextGoals = nextGoals.map(g => g.id === t.toGoalId ? { ...g, currentAmount: g.currentAmount - t.amount } : g);
        }
      }
    }

    await deleteTransactionDoc(id);
    for (const b of nextBanks) await saveBank(b);
    for (const c of nextCards) await saveCard(c);
    for (const g of nextGoals) await saveGoal(g);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#141414] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Finance.OS Carregando...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white border border-[#141414] p-12 flex flex-col gap-8 shadow-[12px_12px_0px_0px_#141414]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-[#141414] flex items-center justify-center">
                 <div className="w-3 h-3 bg-white rotate-45"></div>
              </div>
              <h1 className="text-3xl font-bold tracking-tighter uppercase">FINANCE.OS</h1>
            </div>
            <p className="text-xs opacity-50 uppercase font-bold tracking-widest leading-relaxed">
              Pronto para transformar sua gestão financeira em uma experiência de alta performance?
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={loginWithGoogle}
              className="group flex items-center justify-center gap-3 bg-[#141414] text-white py-4 px-6 hover:bg-zinc-800 transition-all font-bold uppercase text-[11px] tracking-[0.2em] relative overflow-hidden"
            >
              <LogIn size={18} />
              Acessar Sistema
              <div className="absolute inset-x-0 bottom-0 h-1 bg-white opacity-20 transform translate-y-full group-hover:translate-y-0 transition-transform"></div>
            </button>

            <button 
              onClick={loginWithGoogle}
              className="flex items-center justify-center gap-3 bg-white text-[#141414] border-2 border-[#141414] py-4 px-6 hover:bg-[#F2F1EF] transition-all font-bold uppercase text-[11px] tracking-[0.2em]"
            >
              <UserIcon size={18} />
              Criar minha conta
            </button>
          </div>

          <div className="pt-8 border-t border-[#141414]/10 flex flex-col gap-4">
            <span className="text-[9px] opacity-40 uppercase font-bold tracking-widest leading-tight">
              Segurança via Google Cloud Authority. Seus dados são criptografados e armazenados em infraestrutura de alta disponibilidade.
            </span>
            <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest text-green-600">
               <div className="w-1.5 h-1.5 bg-green-500 animate-pulse rounded-full"></div>
               Cloud Storage Encrypted & Verified
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex flex-col font-sans select-none overflow-x-hidden">
      {/* Header */}
      <header className="h-16 border-b border-[#141414] bg-white flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-12">
          <h1 className="text-xl font-bold tracking-tighter uppercase">FINANCE.OS</h1>
          <nav className="hidden lg:flex gap-8 text-[11px] font-bold uppercase tracking-[0.2em]">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`pb-1 transition-all ${activeTab === 'dashboard' ? 'border-b-2 border-[#141414]' : 'opacity-40 hover:opacity-100'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('transactions')}
              className={`pb-1 transition-all ${activeTab === 'transactions' ? 'border-b-2 border-[#141414]' : 'opacity-40 hover:opacity-100'}`}
            >
              Extrato
            </button>
          </nav>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 bg-[#E4E3E0] px-4 py-1.5 border border-[#141414] rounded-sm">
             <div className="flex flex-col">
               <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Mês de Referência</span>
               <div className="flex items-center gap-2">
                 <input 
                   type="month" 
                   value={filterDate} 
                   onChange={(e) => setFilterDate(e.target.value)}
                   className="bg-transparent border-none font-mono text-xs focus:ring-0 cursor-pointer p-0 h-4"
                 />
                 {filterDate && (
                   <button 
                     onClick={() => setFilterDate('')}
                     className="text-[9px] font-bold uppercase text-blue-600 hover:underline border-l border-[#141414]/20 pl-2 ml-1"
                   >
                     Exibir Tudo
                   </button>
                 )}
               </div>
             </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 border-l border-[#141414]/10 pl-6 h-10">
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase font-bold text-[#141414] leading-none mb-1">{user.displayName}</span>
              <button 
                onClick={logout}
                className="text-[8px] uppercase font-bold text-red-600 hover:underline tracking-widest"
              >
                Sair do Sistema
              </button>
            </div>
            {user.photoURL ? (
              <img src={user.photoURL} className="w-8 h-8 rounded-full border border-[#141414]" alt="Avatar" />
            ) : (
              <div className="w-8 h-8 rounded-full border border-[#141414] flex items-center justify-center bg-[#DCDAD7]">
                <UserIcon size={14} />
              </div>
            )}
          </div>

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[9px] uppercase font-bold opacity-50 leading-none">Saldo Consolidado</span>
            <span className="font-mono font-bold text-lg">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(state.banks.reduce((acc, b) => acc + b.balance, 0))}
            </span>
          </div>
          <button 
            onClick={() => setActiveModal('transaction')}
            className="w-10 h-10 border border-[#141414] flex items-center justify-center bg-[#141414] text-white hover:bg-white hover:text-[#141414] transition-colors"
            title="Novo Lançamento"
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar - Always Visible */}
        <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[#141414] bg-[#DCDAD7] overflow-auto flex flex-col shrink-0">
          <BankAndCardSection 
            banks={state.banks} 
            cards={state.cards} 
            onAddBank={() => setActiveModal('bank')} 
            onAddCard={() => setActiveModal('card')} 
            onEditBank={startEditingBank}
            onDeleteBank={deleteBank}
            onEditCard={startEditingCard}
            onDeleteCard={deleteCard}
          />
          <GoalsSection 
            goals={state.goals}
            onAddGoal={() => setActiveModal('goal')}
            onDeleteGoal={deleteGoal}
            onEditGoal={startEditingGoal}
          />
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {activeTab === 'dashboard' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <Dashboard 
                banks={state.banks} 
                cards={state.cards} 
                transactions={state.transactions} 
                filterDate={filterDate} 
              />
              
              <div className="flex-1 flex flex-col">
                <div className="h-10 border-y border-[#141414] flex items-center px-4 gap-4 bg-[#E4E3E0] shrink-0">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#141414]/60">Lançamentos Recentes</span>
                </div>
                <div className="flex-1 overflow-auto">
                  <TransactionTable 
                    transactions={filteredTransactions.slice(0, 15)}
                    banks={state.banks}
                    cards={state.cards}
                    onToggleStatus={toggleTransactionStatus}
                    onDelete={deleteTransaction}
                    onEdit={startEditing}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="h-10 border-b border-[#141414] flex items-center px-4 gap-4 bg-[#E4E3E0] shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#141414]/60">Fluxo de Caixa / Extrato Geral</span>
              </div>
              <div className="flex-1 overflow-auto">
                <TransactionTable 
                  transactions={filteredTransactions}
                  banks={state.banks}
                  cards={state.cards}
                  onToggleStatus={toggleTransactionStatus}
                  onDelete={deleteTransaction}
                  onEdit={startEditing}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="h-8 bg-[#141414] text-white flex items-center px-6 justify-between text-[9px] uppercase tracking-[0.2em] font-medium hidden md:flex shrink-0">
        <div className="flex gap-8">
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> SYSTEM: ACTIVE</span>
          <span>DATABASE: SYNCED</span>
        </div>
        <div>
          FINANCE.OS — ALPHA BUILD V1.0
        </div>
      </footer>

      {/* Modals */}
      <Modal isOpen={activeModal === 'transaction'} onClose={handleCloseModal} title={editingTransaction ? "Editar Lançamento" : "Novo Lançamento Financeiro"}>
        <TransactionForm 
          banks={state.banks} 
          cards={state.cards} 
          goals={state.goals}
          onSubmit={addTransaction} 
          initialData={editingTransaction || undefined} 
        />
      </Modal>

      <Modal isOpen={activeModal === 'goal'} onClose={handleCloseModal} title={editingGoal ? "Editar Meta" : "Configurar Nova Meta"}>
        <GoalForm onSubmit={addGoal} initialData={editingGoal || undefined} />
      </Modal>

      <Modal isOpen={activeModal === 'bank'} onClose={handleCloseModal} title={editingBank ? "Editar Banco" : "Adicionar Banco ou Conta"}>
        <BankForm onSubmit={addBank} initialData={editingBank || undefined} />
      </Modal>

      <Modal isOpen={activeModal === 'card'} onClose={handleCloseModal} title={editingCard ? "Editar Cartão" : "Adicionar Cartão de Crédito"}>
        <CardForm onSubmit={addCard} initialData={editingCard || undefined} />
      </Modal>
    </div>
  );
}

