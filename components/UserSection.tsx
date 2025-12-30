
import React, { useState } from 'react';
import { UserPlus, Trash2, Edit2, X, ShieldCheck, Mail, Lock, UserCircle, Loader2, Users, Crown } from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  users: UserProfile[];
  isSyncing?: boolean;
  onAdd: (user: UserProfile) => void;
  onUpdate: (user: UserProfile) => void;
  onDelete: (id: string) => void;
}

export const UserSection: React.FC<Props> = ({ users, isSyncing = false, onAdd, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    username: '',
    password: '',
    displayName: '',
    email: ''
  });

  const generateId = () => {
    return crypto.randomUUID();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.username && formData.password && formData.displayName && formData.email) {
      if (editingId) {
        onUpdate({ ...formData, id: editingId } as UserProfile);
        setEditingId(null);
      } else {
        onAdd({ ...formData, id: generateId() } as UserProfile);
      }
      setFormData({ username: '', password: '', displayName: '', email: '' });
    }
  };

  const handleEdit = (user: UserProfile) => {
    setEditingId(user.id);
    setFormData({
      username: user.username,
      password: user.password,
      displayName: user.displayName,
      email: user.email || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ username: '', password: '', displayName: '', email: '' });
  };

  const inputClasses = "w-full px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-2xl text-xs text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder-slate-500 shadow-inner";
  const labelClasses = "block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Formulário de Gestão de Equipe */}
      <div className={`bg-[#0f172a] p-8 rounded-[3rem] shadow-2xl border transition-all duration-300 ${editingId ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-800'}`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${editingId ? 'bg-amber-500/10' : 'bg-purple-600/10'}`}>
              {editingId ? <Edit2 className="w-6 h-6 text-amber-500" /> : <UserPlus className="w-6 h-6 text-purple-500" />}
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">
                {editingId ? 'Editar Operador' : 'Adicionar Novo Operador'}
              </h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Configuração de credenciais de acesso</p>
            </div>
          </div>
          {editingId && (
            <button onClick={cancelEdit} className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <label className={labelClasses}>Nome Completo</label>
            <input type="text" placeholder="Ex: Lucas Rios" className={inputClasses} value={formData.displayName} onChange={e => setFormData({ ...formData, displayName: e.target.value })} required />
          </div>
          <div className="md:col-span-1">
            <label className={labelClasses}>ID de Usuário</label>
            <input type="text" placeholder="lucas.admin" className={inputClasses} value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })} required />
          </div>
          <div className="md:col-span-1">
            <label className={labelClasses}>Senha</label>
            <input type="password" placeholder="••••••••" className={inputClasses} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
          </div>
          <div className="md:col-span-1">
            <label className={labelClasses}>E-mail de Contato</label>
            <input type="email" placeholder="lucas@rios.com.br" className={inputClasses} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
          </div>
          <div className="lg:col-span-4 flex justify-end">
            <button 
              type="submit" 
              className={`px-8 py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3 active:scale-95 shadow-xl ${editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-purple-600 hover:bg-purple-500'}`}
            >
              {editingId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabela de Usuários Master */}
      <div className="bg-[#0f172a] rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <ShieldCheck className="w-5 h-5 text-emerald-500" />
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Quadro Administrativo</h3>
          </div>
          <p className="text-[9px] font-black text-slate-600 uppercase">Total: {users.length} membros</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950 text-slate-500 text-[9px] font-black uppercase border-b border-slate-800 tracking-[0.2em]">
                <th className="px-8 py-5">Perfil</th>
                <th className="px-8 py-5">Credencial</th>
                <th className="px-8 py-5">E-mail / Contato</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/20 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${user.username === 'admin' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                        {user.username === 'admin' ? <Crown className="w-5 h-5" /> : <UserCircle className="w-6 h-6" />}
                      </div>
                      <div>
                        <span className="font-black text-white text-xs uppercase tracking-tight block">{user.displayName}</span>
                        {user.username === 'admin' && <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest mt-0.5">Nível Master</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="font-mono text-purple-400 text-[10px] bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20 font-bold">{user.username}</span>
                  </td>
                  <td className="px-8 py-5 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    {user.email || '---'}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-30 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleEdit(user)} className="p-3 text-slate-400 hover:text-amber-400 bg-slate-800 rounded-xl transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {user.username !== 'admin' && (
                        <button onClick={() => onDelete(user.id)} className="p-3 text-slate-400 hover:text-rose-500 bg-slate-800 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
