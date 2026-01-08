
import React, { useMemo, useState } from 'react';
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

  // Garante que o Admin Master esteja sempre visível e outros usuários mesclados
  const displayUsers = useMemo(() => {
    const adminMaster: UserProfile = {
      id: 'admin',
      username: 'admin',
      password: 'admin',
      displayName: 'Master Administrator',
      email: 'admin@riossistem.com.br'
    };
    
    const others = users.filter(u => u.username !== 'admin');
    return [adminMaster, ...others];
  }, [users]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.username && formData.password && formData.displayName && formData.email) {
      if (editingId) {
        onUpdate({ ...formData, id: editingId } as UserProfile);
        setEditingId(null);
      } else {
        onAdd({ ...formData, id: crypto.randomUUID() } as UserProfile);
      }
      setFormData({ username: '', password: '', displayName: '', email: '' });
    }
  };

  const handleEdit = (user: UserProfile) => {
    if (user.username === 'admin') return; // Admin master não é editável aqui por segurança
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
      <div className={`bg-[#0f172a] p-8 rounded-[3rem] shadow-2xl border transition-all duration-300 ${editingId ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-800'}`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${editingId ? 'bg-amber-500/10' : 'bg-purple-600/10'}`}>
              {editingId ? <Edit2 className="w-6 h-6 text-amber-500" /> : <UserPlus className="w-6 h-6 text-purple-500" />}
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">
                {editingId ? 'Editar Operador' : 'Adicionar Operador'}
              </h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Gestão de credenciais da equipe</p>
            </div>
          </div>
          {editingId && (
            <button onClick={cancelEdit} className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              Cancelar
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className={labelClasses}>Nome de Exibição</label>
            <input type="text" placeholder="Nome Completo" className={inputClasses} value={formData.displayName} onChange={e => setFormData({ ...formData, displayName: e.target.value })} required />
          </div>
          <div>
            <label className={labelClasses}>Usuário (Login)</label>
            <input type="text" placeholder="ex: ju.rios" className={inputClasses} value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })} required />
          </div>
          <div>
            <label className={labelClasses}>Senha de Acesso</label>
            <input type="text" placeholder="Crie uma senha" className={inputClasses} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
          </div>
          <div>
            <label className={labelClasses}>E-mail Contato</label>
            <input type="email" placeholder="email@rios.com.br" className={inputClasses} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
          </div>
          <div className="lg:col-span-4 flex justify-end">
            <button 
              type="submit" 
              className={`px-8 py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3 active:scale-95 shadow-xl ${editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-purple-600 hover:bg-purple-500'}`}
            >
              {editingId ? 'Salvar Alterações' : 'Cadastrar Operador'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-[#0f172a] rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <ShieldCheck className="w-5 h-5 text-emerald-500" />
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Quadro Administrativo</h3>
          </div>
          <p className="text-[9px] font-black text-slate-600 uppercase">Membros Cadastrados: {displayUsers.length}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950 text-slate-500 text-[9px] font-black uppercase border-b border-slate-800 tracking-[0.2em]">
                <th className="px-8 py-5">Perfil</th>
                <th className="px-8 py-5">Credencial</th>
                <th className="px-8 py-5">Senha</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {displayUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/20 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${user.username === 'admin' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                        {user.username === 'admin' ? <Crown className="w-5 h-5" /> : <UserCircle className="w-6 h-6" />}
                      </div>
                      <div>
                        <span className="font-black text-white text-xs uppercase block">{user.displayName}</span>
                        <span className="text-[8px] text-slate-500 uppercase">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="font-mono text-purple-400 text-[10px] bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20 font-bold">{user.username}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-slate-600 text-[10px] font-mono">{user.username === 'admin' ? '••••' : user.password}</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-30 group-hover:opacity-100 transition-all">
                      {user.username !== 'admin' && (
                        <>
                          <button onClick={() => handleEdit(user)} className="p-3 text-slate-400 hover:text-amber-400 bg-slate-800 rounded-xl">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => onDelete(user.id)} className="p-3 text-slate-400 hover:text-rose-500 bg-slate-800 rounded-xl">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
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
