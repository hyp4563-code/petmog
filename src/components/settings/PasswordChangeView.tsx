import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function PasswordChangeView({ onBack }: { onBack: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <div className="bg-brand-peach-50 min-h-screen">
      <header className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-50 border-b border-brand-peach-50">
        <button onClick={onBack} className="text-brand-peach-800"><ArrowLeft size={24} /></button>
        <h2 className="text-lg font-black text-brand-peach-800">パスワード変更</h2>
      </header>
      <div className="p-6 space-y-6">
        <div>
          <label className="block text-xs font-black text-brand-peach-200 mb-2">現在のパスワード</label>
          <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full bg-white p-4 rounded-2xl text-sm font-bold text-brand-peach-800" />
        </div>
        <div>
          <label className="block text-xs font-black text-brand-peach-200 mb-2">新しいパスワード</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-white p-4 rounded-2xl text-sm font-bold text-brand-peach-800" />
        </div>
        <div>
          <label className="block text-xs font-black text-brand-peach-200 mb-2">新しいパスワード（確認）</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-white p-4 rounded-2xl text-sm font-bold text-brand-peach-800" />
        </div>
        <button className="w-full peach-gradient text-white font-black py-4 rounded-2xl">パスワードを変更する</button>
      </div>
    </div>
  );
}
