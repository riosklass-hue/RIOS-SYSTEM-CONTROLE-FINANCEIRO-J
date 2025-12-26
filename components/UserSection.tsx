
import React, { useState } from 'react';
import { UserPlus, Trash2, Edit2, X, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  users: UserProfile[];
  onAdd: (user: UserProfile) => void;
  onUpdate: (user: UserProfile) => void;
  onDelete: (id: string) => void;
}

export const UserSection: React.FC<Props> = ({ users, onAdd, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    username: '',
    password: '',
    displayName: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.username && formData.password && formData.displayName) {
      if (editingId) {
        onUpdate({ ...formData, id: editingId } as UserProfile);
        setEditingId(null);
      } else {
        onAdd({ ...formData, id: crypto.randomUUID() } as UserProfile);
      }
      setFormData({ username: '', password: '', displayName: '' });
    }
  };

  const handleEdit = (user: UserProfile) => {
    setEditingId(user.id);
    setFormData({
      username: user.username,
      password: user.password,
      displayName: user.displayName
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ username: '', password: '', displayName: '' });
  };

  const inputClasses = "w-full px-3 py-2 bg-[#1e293b] border border-slate-700 rounded-lg text-xs text-white focus:ring-1 focus:ring-purple-500 focus:outline-none transition-all placeholder-slate-500";
  const labelClasses = "block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest";

  return (
    <div className="space-y-4">
      <div className={`bg-[#0f172a] p-5 rounded-2xl shadow-2xl border transition-all ${editingId ? 'border-amber-500/50' : 'border-slate-800'}`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-black flex items-center gap-2 text-white uppercase tracking-widest">
            <div className={`p-1.5 rounded-lg ${editingId ? 'bg-amber-500/10' : 'bg-purple-500/10'}`}>
              {editingId ? <Edit2 className="w-4 h-4 text-amber-500" /> : <UserPlus className="w-4 h-4 text-purple-500" />}
            </div>
            {editingId ? 'Editar Operador' : 'Novo Operador de Sistema'}
          </h2>
          {editingId && (
            <button onClick={cancelEdit} className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-bold uppercase tracking-tighter">
              <X className="w-3 h-3" /> Cancelar
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={labelClasses}>Nome de Exibição</label>
            <input 
              type="text" 
              placeholder="Ex: João Admin" 
              className={inputClasses} 
              value={formData.displayName} 
              onChange={e => setFormData({ ...formData, displayName: e.target.value })} 
              required 
            />
          </div>
          <div>
            <label className={labelClasses}>Usuário (Login)</label>
            <input 
              type="text" 
              placeholder="ex: joao.rios" 
              className={inputClasses} 
              value={formData.username} 
              onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })} 
              required 
            />
          </div>
          <div>
            <label className={labelClasses}>Senha de Acesso</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className={inputClasses} 
              value={formData.password} 
              onChange={e => setFormData({ ...formData, password: e.target.value })} 
              required 
            />
          </div>
          <div className="flex items-end">
            <button 
              type="submit" 
              className={`w-full text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-purple-600 hover:bg-purple-500 shadow-[0_5px_15px_rgba(168,85,247,0.2)]'}`}
            >
              {editingId ? 'Salvar Alterações' : 'Cadastrar Operador'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-900/30 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Operadores Autorizados</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950 text-slate-500 text-[9px] font-black uppercase border-b border-slate-800 tracking-widest">
                <th className="px-6 py-4">Nome de Exibição</th>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Senha</th>
                <th className="px-6 py-4 text-right">Controle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-purple-400 border border-slate-700">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-white text-xs">{user.displayName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-purple-400 text-[10px]">{user.username}</td>
                  <td className="px-6 py-4 font-mono text-slate-600 text-[10px]">••••••••</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(user)} 
                        className="p-2 text-slate-400 hover:text-amber-400 bg-slate-800/50 rounded-lg hover:bg-amber-400/10 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => onDelete(user.id)} 
                        className="p-2 text-slate-400 hover:text-rose-500 bg-slate-800/50 rounded-lg hover:bg-rose-500/10 transition-all"
                        disabled={user.username === 'admin'}
                      >
                        <Trash2 className={`w-3.5 h-3.5 ${user.username === 'admin' ? 'opacity-20' : ''}`} />
                      </button>
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
