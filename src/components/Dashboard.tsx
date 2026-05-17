import React from 'react';
import { formatCurrency } from '../lib/utils';
import { Bank, CreditCard as CardType, Transaction } from '../types';
import { motion } from 'motion/react';

interface DashboardProps {
  banks: Bank[];
  cards: CardType[];
  transactions: Transaction[];
  filterDate: string;
}

export default function Dashboard({ banks, cards, transactions, filterDate }: DashboardProps) {
  const totalBalance = banks.reduce((acc, bank) => acc + bank.balance, 0);
  
  // Stats for the specific month
  const monthlyTransactions = filterDate 
    ? transactions.filter(t => t.date.startsWith(filterDate))
    : transactions;
  
  // Projection logic: Current physical balance + ALL pending transactions up to the end of the selected month
  let projectedBalance = totalBalance;
  if (filterDate) {
    const [y, m] = filterDate.split('-').map(Number);
    if (y && m) {
      const lastDayOfMonth = new Date(y, m, 0).toISOString().split('T')[0];
      projectedBalance = transactions.reduce((acc, t) => {
        if (t.status === 'pending' && t.date <= lastDayOfMonth) {
          if (t.type === 'receivable') return acc + t.amount;
          if (t.type === 'payable' || (t.type === 'transfer' && t.toGoalId)) return acc - t.amount;
        }
        return acc;
      }, totalBalance);
    }
  }

  const pendingPayables = monthlyTransactions
    .filter(t => t.type === 'payable' && t.status === 'pending')
    .reduce((acc, t) => acc + t.amount, 0);
    
  const pendingReceivables = monthlyTransactions
    .filter(t => t.type === 'receivable' && t.status === 'pending')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalPaidPayables = monthlyTransactions
    .filter(t => t.type === 'payable' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalReceivedReceivables = monthlyTransactions
    .filter(t => t.type === 'receivable' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalMonthExpenses = pendingPayables + totalPaidPayables;

  const totalCreditUsed = monthlyTransactions
    .filter(t => t.cardId && t.type === 'payable')
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-b border-[#141414]">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 border-r border-[#141414] flex flex-col gap-1 bg-white"
      >
        <span className="text-[10px] uppercase font-bold opacity-50 tracking-widest">Saldo Projetado</span>
        <span className={`text-2xl font-mono font-bold ${projectedBalance >= 0 ? 'text-[#141414]' : 'text-red-600'}`}>
          {formatCurrency(projectedBalance)}
        </span>
        <span className="text-[9px] opacity-40 uppercase tracking-tighter">
          {filterDate ? `Previsão acum. após pendências` : 'Considerando todos os lançamentos'}
        </span>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="p-6 border-r border-[#141414] flex flex-col gap-1 bg-white"
      >
        <span className="text-[10px] uppercase font-bold opacity-50 tracking-widest">Despesas do Mês</span>
        <div className="flex flex-col">
          <span className="text-2xl font-mono text-red-600 font-bold">-{formatCurrency(totalMonthExpenses)}</span>
          <div className="flex justify-between text-[9px] uppercase font-bold tracking-tighter mt-1">
             <span className="text-red-500/60">Pendente: {formatCurrency(pendingPayables)}</span>
             <span className="text-gray-400">Pago: {formatCurrency(totalPaidPayables)}</span>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="p-6 border-r border-[#141414] flex flex-col gap-1 bg-white"
      >
        <span className="text-[10px] uppercase font-bold opacity-50 tracking-widest">Receitas do Mês</span>
        <div className="flex flex-col">
          <span className="text-2xl font-mono text-green-700 font-bold">+{formatCurrency(pendingReceivables + totalReceivedReceivables)}</span>
          <div className="flex justify-between text-[9px] uppercase font-bold tracking-tighter mt-1">
             <span className="text-green-600/60">A Receber: {formatCurrency(pendingReceivables)}</span>
             <span className="text-gray-400">Recebido: {formatCurrency(totalReceivedReceivables)}</span>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-6 flex flex-col gap-1 bg-black text-white"
      >
        <span className="text-[10px] uppercase font-bold opacity-70 tracking-widest">Saldo Fisico (Hoje)</span>
        <span className="text-2xl font-mono font-bold">{formatCurrency(totalBalance)}</span>
        <div className="w-full h-1 bg-white/20 mt-2">
          <div 
            className="h-full bg-white transition-all duration-500" 
            style={{ width: `${Math.min((totalBalance / (projectedBalance || 1)) * 100, 100)}%` }}
          ></div>
        </div>
        <span className="text-[9px] opacity-40 uppercase tracking-tighter">Dinheiro real em conta</span>
      </motion.div>
    </div>
  );
}
