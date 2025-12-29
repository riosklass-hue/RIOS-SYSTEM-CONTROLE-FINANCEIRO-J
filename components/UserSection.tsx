
import React, { useState } from 'react';
// Added 'Users' to imports to fix the reference error on line 223
import { UserPlus, Trash2, Edit2, X, ShieldCheck, Mail, Lock, UserCircle, Loader2, Users } from 'lucide-react';
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
    try {
      return crypto.randomUUID();
    } catch (e) {
      return Math.random().toString(36).substring(2, 9) + '-' + Date.now();
    }
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
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ username: '', password: '', displayName: '', email: '' });
  };

  const inputClasses = "w-full px-4 py-2.5 bg-[#1e293b] border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 focus:outline-none transition-all placeholder-slate-500 disabled:opacity-50 shadow-inner";
  const labelClasses = "block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-[0.15em]";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Formulário de Operadores */}
      <div className={`bg-[#0f172a] p-6 rounded-3xl shadow-2xl border transition-all duration-300 ${editingId ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-800'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${editingId ? 'bg-amber-500/20' : 'bg-purple-500/20'}`}>
              {editingId ? <Edit2 className="w-5 h-5 text-amber-500" /> : <UserPlus className="w-5 h-5 text-purple-500" />}
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">
                {editingId ? 'Modificar Registro' : 'Novo Operador de Sistema'}
              </h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Gestão de acessos administrativos</p>
            </div>
          </div>
          {editingId && (
            <button onClick={cancelEdit} className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
              <X className="w-3 h-3" /> Cancelar
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* ORDEM: NOME, USUÁRIO, SENHA, EMAIL */}
          <div className="md:col-span-3">
            <label className={labelClasses}>Nome de Exibição</label>
            <input 
              type="text" 
              placeholder="Ex: João Silva" 
              className={inputClasses} 
              value={formData.displayName} 
              onChange={e => setFormData({ ...formData, displayName: e.target.value })} 
              disabled={isSyncing}
              required 
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClasses}>Usuário (Login)</label>
            <input 
              type="text" 
              placeholder="joao.rios" 
              className={inputClasses} 
              value={formData.username} 
              onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })} 
              disabled={isSyncing}
              required 
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClasses}>Senha</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className={inputClasses} 
              value={formData.password} 
              onChange={e => setFormData({ ...formData, password: e.target.value })} 
              disabled={isSyncing}
              required 
            />
          </div>
          <div className="md:col-span-3">
            <label className={labelClasses}>E-mail (Recuperação)</label>
            <input 
              type="email" 
              placeholder="email@rios.com.br" 
              className={inputClasses} 
              value={formData.email} 
              onChange={e => setFormData({ ...formData, email: e.target.value })} 
              disabled={isSyncing}
              required 
            />
          </div>
          <div className="md:col-span-2 flex items-end">
            <button 
              type="submit" 
              disabled={isSyncing}
              className={`w-full text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95 ${editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-purple-600 hover:bg-purple-500 shadow-[0_8px_25px_rgba(147,51,234,0.3)]'} disabled:opacity-50 disabled:pointer-events-none`}
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                editingId ? 'Atualizar' : 'Cadastrar'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Operadores */}
      <div className="bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 bg-slate-900/40 flex items-center gap-3">
          <div className="p-1.5 bg-emerald-500/20 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Quadro de Operadores</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950 text-slate-500 text-[9px] font-black uppercase border-b border-slate-800 tracking-widest">
                <th className="px-6 py-4">Operador</th>
                <th className="px-6 py-4">ID / Usuário</th>
                <th className="px-6 py-4">Segurança</th>
                <th className="px-6 py-4">Recuperação</th>
                <th className="px-6 py-4 text-right">Controle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/20 transition-all duration-200 group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <UserCircle className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="font-black text-white text-[11px] uppercase tracking-tighter">{user.displayName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-purple-400 text-[10px] bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{user.username}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Lock className="w-3.5 h-3.5 opacity-50" />
                      <span className="font-mono text-[10px] tracking-widest">••••••••</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 group-hover:text-blue-400 transition-colors">
                       <Mail className="w-3.5 h-3.5 text-slate-600" />
                       <span className="font-medium">{user.email || 'Não informado'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-30 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 translate-x-4">
                      <button 
                        onClick={() => handleEdit(user)} 
                        disabled={isSyncing}
                        className="p-2.5 text-slate-400 hover:text-amber-400 bg-slate-800/50 rounded-xl hover:bg-amber-400/10 transition-all shadow-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(user.id)} 
                        disabled={isSyncing || user.username === 'admin'}
                        className="p-2.5 text-slate-400 hover:text-rose-500 bg-slate-800/50 rounded-xl hover:bg-rose-500/10 transition-all shadow-sm disabled:opacity-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <Users className="w-8 h-8" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Base de usuários vazia</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
