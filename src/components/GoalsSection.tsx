import React from 'react';
import { Goal } from '../types';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';
import { Trash2, Pencil } from 'lucide-react';

interface GoalsSectionProps {
  goals: Goal[];
  onAddGoal: () => void;
  onDeleteGoal: (id: string) => void;
  onEditGoal: (goal: Goal) => void;
}

export default function GoalsSection({ goals, onAddGoal, onDeleteGoal, onEditGoal }: GoalsSectionProps) {
  return (
    <div className="shrink-0 pb-8">
      <div className="p-4 border-y border-[#141414] flex justify-between items-center bg-[#E4E3E0]">
        <h2 className="text-[11px] font-bold uppercase tracking-widest">Metas & Objetivos</h2>
        <button 
          onClick={onAddGoal}
          className="text-lg leading-none hover:bg-black hover:text-white w-6 h-6 border border-[#141414] flex items-center justify-center transition-colors"
        >
          +
        </button>
      </div>

      <div className="flex flex-col">
        {goals.map((goal) => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          return (
            <motion.div 
              key={goal.id}
              whileHover={{ backgroundColor: 'white' }}
              className="p-4 border-b border-[#141414]/10 group transition-colors"
            >
              <div className="flex justify-between items-end mb-2">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-1">
                    {goal.name}
                  </span>
                  <span className="font-mono text-sm">
                    {formatCurrency(goal.currentAmount)}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[9px] font-bold opacity-40">ALVO: {formatCurrency(goal.targetAmount)}</span>
                   <div className="flex gap-2">
                     <button 
                       onClick={() => onEditGoal(goal)}
                       className="text-blue-600 opacity-40 hover:opacity-100 transition-opacity"
                     >
                       <Pencil size={14} />
                     </button>
                     <button 
                       onClick={() => onDeleteGoal(goal.id)}
                       className="text-red-600 opacity-40 hover:opacity-100 transition-opacity"
                     >
                       <Trash2 size={14} />
                     </button>
                   </div>
                </div>
              </div>
              
              <div className="w-full bg-[#141414]/10 h-3 border border-[#141414] overflow-hidden relative">
                 <div 
                   className={`h-full ${goal.color} border-r border-[#141414] transition-all duration-1000`} 
                   style={{ width: `${progress}%` }}
                 />
                 <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold mix-blend-difference text-white">
                   {progress.toFixed(1)}%
                 </span>
              </div>
            </motion.div>
          );
        })}
        {goals.length === 0 && (
          <div className="p-8 text-center text-[10px] opacity-40 uppercase font-bold tracking-widest">
            Nenhuma meta definida
          </div>
        )}
      </div>
    </div>
  );
}
