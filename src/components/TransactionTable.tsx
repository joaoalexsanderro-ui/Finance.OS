import React from 'react';
import { Trash2, Pencil, Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { Transaction, Bank, CreditCard } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionTableProps {
  transactions: Transaction[];
  banks: Bank[];
  cards: CreditCard[];
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

export default function TransactionTable({ 
  transactions, 
  banks, 
  cards,
  onToggleStatus,
  onDelete,
  onEdit
}: TransactionTableProps) {
  
  const getBankName = (id?: string) => banks.find(b => b.id === id)?.name || '-';
  const getCardName = (id?: string) => cards.find(c => c.id === id)?.name || '-';

  return (
    <div className="bg-white overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#141414] text-[10px] uppercase font-bold tracking-widest bg-[#E4E3E0]/50">
            <th className="p-3 border-r border-[#141414] w-12 text-center select-none cursor-default">OK</th>
            <th className="p-3 border-r border-[#141414] min-w-[200px]">Descrição</th>
            <th className="p-3 border-r border-[#141414]">Categoria</th>
            <th className="p-3 border-r border-[#141414]">Data</th>
            <th className="p-3 border-r border-[#141414]">Origem/Conta</th>
            <th className="p-3 text-right">Valor (R$)</th>
          </tr>
        </thead>
        <tbody className="text-xs font-mono">
          <AnimatePresence mode="popLayout">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] opacity-40 uppercase font-bold tracking-[0.3em]">Nenhum lançamento encontrado</span>
                    <span className="text-[9px] opacity-30 max-w-[200px] mx-auto">
                      Não há registros para este período. Tente mudar o mês ou clique em "Exibir Tudo" no topo.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t) => (
                <motion.tr 
                  key={t.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`border-b border-[#141414]/10 group transition-colors ${
                    t.status === 'pending' ? 'bg-[#DCDAD7]/10' : ''
                  } ${t.type === 'receivable' ? 'bg-green-50/30' : t.type === 'payable' ? 'bg-red-50/10' : 'bg-blue-50/20'}`}
                >
                  <td className="p-3 border-r border-[#141414]/10 text-center">
                    <button 
                      onClick={() => onToggleStatus(t.id)}
                      className={`w-4 h-4 border border-[#141414] transition-colors flex items-center justify-center ${
                        t.status === 'paid' ? 'bg-[#141414] text-white' : 'bg-white hover:bg-[#141414]/10'
                      }`}
                    >
                      {t.status === 'paid' && <span className="text-[8px]">X</span>}
                    </button>
                  </td>
                  <td className="p-3 border-r border-[#141414]/10 font-sans font-bold text-sm">
                    <div className="flex items-center justify-between">
                       <span>{t.description}</span>
                       <div className="flex gap-2">
                          <button onClick={() => onEdit(t)} className="opacity-40 hover:opacity-100 text-blue-600 transition-opacity">
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => onDelete(t.id)} className="opacity-40 hover:opacity-100 text-red-600 transition-opacity">
                            <Trash2 size={12} />
                          </button>
                       </div>
                    </div>
                  </td>
                  <td className="p-3 border-r border-[#141414]/10">
                    <span className="text-[9px] font-sans font-bold uppercase py-0.5 px-1.5 border border-[#141414]/20 bg-white">
                      {t.category}
                    </span>
                  </td>
                  <td className="p-3 border-r border-[#141414]/10 italic">
                    {formatDate(t.date)}
                  </td>
                  <td className="p-3 border-r border-[#141414]/10 font-sans text-[11px]">
                    {t.cardId ? (
                      <span className="opacity-70 font-bold uppercase tracking-tighter italic">{getCardName(t.cardId)}</span>
                    ) : t.type === 'transfer' ? (
                      <span className="opacity-70 italic tracking-tighter font-bold">{getBankName(t.bankId)} → {getBankName(t.toBankId)}</span>
                    ) : (
                      <span className="opacity-70 font-bold uppercase tracking-tighter italic">{getBankName(t.bankId)}</span>
                    )}
                  </td>
                  <td className={`p-3 font-bold text-right text-sm ${
                    t.type === 'receivable' ? 'text-green-700' : 
                    t.type === 'payable' ? 'text-red-700' : 'text-blue-700'
                  }`}>
                    {t.type === 'receivable' ? '+' : '-'}{formatCurrency(t.amount).replace('R$', '')}
                  </td>
                </motion.tr>
              ))
            )}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
