import React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Bank, CreditCard as CardType } from '../types';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';

interface BankAndCardSectionProps {
  banks: Bank[];
  cards: CardType[];
  onAddBank: () => void;
  onAddCard: () => void;
  onEditBank: (bank: Bank) => void;
  onDeleteBank: (id: string) => void;
  onEditCard: (card: CardType) => void;
  onDeleteCard: (id: string) => void;
}

export default function BankAndCardSection({ 
  banks, 
  cards, 
  onAddBank, 
  onAddCard,
  onEditBank,
  onDeleteBank,
  onEditCard,
  onDeleteCard
}: BankAndCardSectionProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Bancos */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 border-b border-[#141414] flex justify-between items-center bg-[#E4E3E0]">
          <h2 className="text-[11px] font-bold uppercase tracking-widest">Bancos & Contas</h2>
          <button 
            onClick={onAddBank}
            className="text-lg leading-none hover:bg-black hover:text-white w-6 h-6 border border-[#141414] flex items-center justify-center transition-colors"
          >
            +
          </button>
        </div>
        
        <div className="divide-y divide-[#141414]/10">
          {banks.map((bank) => (
            <motion.div 
              key={bank.id}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.4)' }}
              className="p-4 flex flex-col gap-1 cursor-pointer transition-colors group"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-bold text-sm tracking-tight">{bank.name}</span>
                  <div className={`w-3 h-1 mt-1 ${bank.color} border border-black/20`}></div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); onEditBank(bank); }} className="text-blue-600 hover:scale-110 transition-transform">
                    <Pencil size={12} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteBank(bank.id); }} className="text-red-600 hover:scale-110 transition-transform">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <span className="text-xl font-mono">{formatCurrency(bank.balance)}</span>
            </motion.div>
          ))}
          {banks.length === 0 && (
            <div className="p-8 text-center text-[10px] opacity-40 uppercase font-bold tracking-widest">
              Nenhuma conta
            </div>
          )}
        </div>
      </div>

      {/* Cartões */}
      <div className="shrink-0">
        <div className="p-4 border-y border-[#141414] flex justify-between items-center bg-[#E4E3E0]">
          <h2 className="text-[11px] font-bold uppercase tracking-widest">Cartões de Crédito</h2>
          <button 
            onClick={onAddCard}
            className="text-lg leading-none hover:bg-black hover:text-white w-6 h-6 border border-[#141414] flex items-center justify-center transition-colors"
          >
            +
          </button>
        </div>
        
        <div className="bg-[#141414] text-white overflow-hidden">
          {cards.map((card) => {
            const usagePercent = Math.min((card.used / card.limit) * 100, 100);
            return (
              <motion.div 
                key={card.id}
                className="p-4 border-b border-white/10 last:border-b-0 group"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest">{card.name}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEditCard(card)} className="text-blue-400 hover:text-blue-300">
                      <Pencil size={11} />
                    </button>
                    <button onClick={() => onDeleteCard(card.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between items-end mb-3">
                  <p className="text-xl font-mono underline underline-offset-8 decoration-white/20">{formatCurrency(card.used)}</p>
                  <span className="text-[9px] opacity-50 mb-1">Vence dia {card.dueDate}</span>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-[8px] uppercase font-bold tracking-tighter mb-1 opacity-50">
                    <span>Limite: {formatCurrency(card.limit)}</span>
                    <span>{usagePercent.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-0.5 mt-1">
                    <div 
                      className="bg-white h-full" 
                      style={{ width: `${usagePercent}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {cards.length === 0 && (
            <div className="p-8 text-center text-[10px] opacity-40 uppercase font-bold tracking-widest">
              Nenhum cartão
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
