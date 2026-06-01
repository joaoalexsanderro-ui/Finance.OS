import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CATEGORIES, COLORS } from '../constants';
import { Bank, CreditCard, TransactionType, TransactionStatus, Transaction, Goal } from '../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/60 backdrop-blur-sm">
      <div className="bg-white border-2 border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-[#141414] flex justify-between items-center bg-[#E4E3E0]">
          <h3 className="font-bold uppercase tracking-widest text-[11px]">{title}</h3>
          <button onClick={onClose} className="text-[#141414] hover:bg-[#141414] hover:text-white transition-colors w-6 h-6 flex items-center justify-center border border-[#141414]">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

interface TransactionFormProps {
  banks: Bank[];
  cards: CreditCard[];
  goals: Goal[];
  onSubmit: (data: any) => void;
  initialData?: Transaction;
}

export function TransactionForm({ banks, cards, goals, onSubmit, initialData }: TransactionFormProps) {
  const getLocalDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const [type, setType] = useState<TransactionType>(initialData?.type || 'payable');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(initialData?.date ? initialData.date.split('T')[0] : getLocalDate());
  const [category, setCategory] = useState(initialData?.category || CATEGORIES[0]);
  const [bankId, setBankId] = useState(initialData?.bankId || banks[0]?.id || '');
  const [cardId, setCardId] = useState(initialData?.cardId || '');
  const [toBankId, setToBankId] = useState(initialData?.toBankId || '');
  const [toGoalId, setToGoalId] = useState(initialData?.toGoalId || '');
  const [status, setStatus] = useState<TransactionStatus>(initialData?.status || 'pending');

  const [isCardBillPayment, setIsCardBillPayment] = useState(initialData?.isCardBillPayment || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      amount: parseFloat(amount),
      description,
      date,
      category,
      bankId: type === 'receivable' || type === 'transfer' || !cardId || isCardBillPayment ? bankId : undefined,
      cardId: (type === 'payable' && !isCardBillPayment) ? cardId : (isCardBillPayment ? cardId : undefined),
      toBankId: (type === 'transfer' && toBankId) ? toBankId : undefined,
      toGoalId: (type === 'transfer' && toGoalId) ? toGoalId : undefined,
      status: type === 'transfer' || initialData ? 'paid' : status,
      isCardBillPayment
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2 p-1 bg-[#E4E3E0] border border-[#141414] mb-4">
        {(['payable', 'receivable', 'transfer'] as TransactionType[]).map((t) => (
          <button
            key={t}
            type="button"
            disabled={!!initialData}
            onClick={() => {
              setType(t);
              setIsCardBillPayment(false);
            }}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
              type === t 
                ? 'bg-[#141414] text-white shadow-sm' 
                : 'text-[#141414]/60 hover:text-[#141414]'
            } ${initialData ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {t === 'payable' ? 'Saída' : t === 'receivable' ? 'Entrada' : 'Transf.'}
          </button>
        ))}
      </div>

      {type === 'payable' && (
        <div className="flex items-center gap-2 mb-4">
          <input 
            type="checkbox" 
            id="isCardBill" 
            checked={isCardBillPayment} 
            onChange={e => setIsCardBillPayment(e.target.checked)}
            className="w-4 h-4 border-[#141414] rounded-none accent-[#141414]"
          />
          <label htmlFor="isCardBill" className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Pagamento de fatura?</label>
        </div>
      )}

      <div>
        <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Valor</label>
        <input
          required
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          className="w-full px-4 py-2 border border-[#141414] bg-white text-sm font-mono focus:outline-none focus:ring-0 focus:bg-[#E4E3E0]/20"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Descrição</label>
        <input
          required
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="DESCRIÇÃO"
          className="w-full px-4 py-2 border border-[#141414] bg-white text-sm focus:outline-none focus:ring-0 focus:bg-[#E4E3E0]/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Data</label>
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-[#141414] bg-white text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border border-[#141414] bg-white text-sm uppercase font-bold tracking-tighter"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {type === 'transfer' ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">De (Banco)</label>
            <select
              required
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              className="w-full px-4 py-2 border border-[#141414] bg-white text-sm"
            >
              <option value="">Selecione...</option>
              {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Para (Destino)</label>
            <select
              required
              value={toGoalId ? `goal-${toGoalId}` : toBankId}
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith('goal-')) {
                  setToGoalId(val.replace('goal-', ''));
                  setToBankId('');
                } else {
                  setToBankId(val);
                  setToGoalId('');
                }
              }}
              className="w-full px-4 py-2 border border-[#141414] bg-white text-sm"
            >
              <option value="">Selecione...</option>
              <optgroup label="Bancos">
                {banks.filter(b => b.id !== bankId).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </optgroup>
              <optgroup label="Metas">
                {goals.map(g => <option key={g.id} value={`goal-${g.id}`}>{g.name}</option>)}
              </optgroup>
            </select>
          </div>
        </div>
      ) : isCardBillPayment ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Origem</label>
            <select
              required
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              className="w-full px-4 py-2 border border-[#141414] bg-white text-sm"
            >
              <option value="">Selecione Banco...</option>
              {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Destino</label>
            <select
              required
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              className="w-full px-4 py-2 border border-[#141414] bg-white text-sm"
            >
              <option value="">Selecione Cartão...</option>
              {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">
              {type === 'payable' ? 'Método' : 'Conta de Destino'}
            </label>
            <select
              required
              value={type === 'payable' && cardId ? `card-${cardId}` : bankId}
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith('card-')) {
                  setCardId(val.replace('card-', ''));
                  setBankId('');
                } else {
                  setBankId(val);
                  setCardId('');
                }
              }}
              className="w-full px-4 py-2 border border-[#141414] bg-white text-sm"
            >
              <option value="">Selecione...</option>
              <optgroup label="Bancos">
                {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </optgroup>
              {type === 'payable' && (
                <optgroup label="Cartões">
                  {cards.map(c => <option key={c.id} value={`card-${c.id}`}>{c.name}</option>)}
                </optgroup>
              )}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TransactionStatus)}
              className="w-full px-4 py-2 border border-[#141414] bg-white text-sm uppercase font-bold tracking-tighter"
            >
              <option value="pending">Pendente</option>
              <option value="paid">Confirmado/Pago</option>
            </select>
          </div>
        </div>
      )}

      <button
        type="submit"
        className="w-full py-3 bg-[#141414] text-white font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-colors mt-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      >
        {initialData ? 'Atualizar Transação' : 'Executar Transação'}
      </button>
    </form>
  );
}

interface BankFormProps {
  onSubmit: (data: any) => void;
  initialData?: Bank;
}

export function BankForm({ onSubmit, initialData }: BankFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [initialBalance, setInitialBalance] = useState(
    initialData ? (initialData.initialBalance !== undefined ? initialData.initialBalance.toString() : initialData.balance.toString()) : ''
  );
  const [color, setColor] = useState(initialData?.color || COLORS[0]);

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit({ name, initialBalance: parseFloat(initialBalance), color });
    }} className="space-y-4">
      <div>
        <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Nome do Banco</label>
        <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border border-[#141414] bg-white text-sm" />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Saldo Inicial</label>
        <input required type="number" step="0.01" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} className="w-full px-4 py-2 border border-[#141414] bg-white text-sm font-mono" />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Cor de Identificação</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)} className={`w-6 h-6 border border-[#141414] ${c} ${color === c ? 'ring-2 ring-black ring-offset-2' : ''}`} />
          ))}
        </div>
      </div>
      <button type="submit" className="w-full py-3 bg-[#141414] text-white font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-colors shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)]">
        {initialData ? 'Atualizar Banco' : 'Adicionar Banco'}
      </button>
    </form>
  );
}

interface CardFormProps {
  onSubmit: (data: any) => void;
  initialData?: CreditCard;
}

export function CardForm({ onSubmit, initialData }: CardFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [limit, setLimit] = useState(initialData?.limit?.toString() || '');
  const [closingDay, setClosingDay] = useState(initialData?.closingDay?.toString() || '10');
  const [dueDate, setDueDate] = useState(initialData?.dueDate?.toString() || '20');
  const [color, setColor] = useState(initialData?.color || COLORS[0]);

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit({ 
        name, 
        limit: parseFloat(limit), 
        used: initialData?.used || 0, 
        closingDay: parseInt(closingDay), 
        dueDate: parseInt(dueDate), 
        color 
      });
    }} className="space-y-4">
      <div>
        <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Nome do Cartão</label>
        <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border border-[#141414] bg-white text-sm" />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Limite Total</label>
        <input required type="number" step="0.01" value={limit} onChange={e => setLimit(e.target.value)} className="w-full px-4 py-2 border border-[#141414] bg-white text-sm font-mono" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Dia Fechamento</label>
          <input required type="number" min="1" max="31" value={closingDay} onChange={e => setClosingDay(e.target.value)} className="w-full px-4 py-2 border border-[#141414] bg-white text-sm" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Dia Vencimento</label>
          <input required type="number" min="1" max="31" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-4 py-2 border border-[#141414] bg-white text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Cor</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)} className={`w-6 h-6 border border-[#141414] ${c} ${color === c ? 'ring-2 ring-black ring-offset-2' : ''}`} />
          ))}
        </div>
      </div>
      <button type="submit" className="w-full py-3 bg-[#141414] text-white font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-colors shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)]">
        {initialData ? 'Atualizar Cartão' : 'Adicionar Cartão'}
      </button>
    </form>
  );
}

interface GoalFormProps {
  onSubmit: (data: any) => void;
  initialData?: Goal;
}

export function GoalForm({ onSubmit, initialData }: GoalFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [targetAmount, setTargetAmount] = useState(initialData?.targetAmount?.toString() || '');
  const [currentAmount, setCurrentAmount] = useState(initialData?.currentAmount?.toString() || '0');
  const [color, setColor] = useState(initialData?.color || COLORS[0]);

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit({ name, targetAmount: parseFloat(targetAmount), currentAmount: parseFloat(currentAmount), color });
    }} className="space-y-4">
      <div>
        <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Nome da Meta</label>
        <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Viagem, Carro Novo..." className="w-full px-4 py-2 border border-[#141414] bg-white text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Alvo (R$)</label>
          <input required type="number" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className="w-full px-4 py-2 border border-[#141414] bg-white text-sm font-mono" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Valor Atual (R$)</label>
          <input required type="number" step="0.01" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} className="w-full px-4 py-2 border border-[#141414] bg-white text-sm font-mono" />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Cor</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)} className={`w-6 h-6 border border-[#141414] ${c} ${color === c ? 'ring-2 ring-black ring-offset-2' : ''}`} />
          ))}
        </div>
      </div>
      <button type="submit" className="w-full py-3 bg-[#141414] text-white font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-colors shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)]">
        {initialData ? 'Atualizar Meta' : 'Salvar Meta'}
      </button>
    </form>
  );
}
