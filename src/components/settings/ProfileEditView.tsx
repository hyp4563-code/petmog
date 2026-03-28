import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { User } from '../../types';

export default function ProfileEditView({ user, onBack }: { user: User, onBack: () => void }) {
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState('こんにちは！ペットと暮らす毎日を楽しんでいます。');

  return (
    <div className="bg-brand-peach-50 min-h-screen">
      <header className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-50 border-b border-brand-peach-50">
        <button onClick={onBack} className="text-brand-peach-800"><ArrowLeft size={24} /></button>
        <h2 className="text-lg font-black text-brand-peach-800">プロフィール編集</h2>
      </header>
      <div className="p-6 space-y-6">
        <div className="text-center">
          <img src={user.avatar} alt={user.username} className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-brand-peach-100" />
          <button className="text-sm font-bold text-brand-peach-100">アバターを変更</button>
        </div>
        <div>
          <label className="block text-xs font-black text-brand-peach-200 mb-2">ユーザー名</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-white p-4 rounded-2xl text-sm font-bold text-brand-peach-800" />
        </div>
        <div>
          <label className="block text-xs font-black text-brand-peach-200 mb-2">自己紹介</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-white p-4 rounded-2xl text-sm font-bold text-brand-peach-800 h-32" />
        </div>
        <button className="w-full peach-gradient text-white font-black py-4 rounded-2xl">保存する</button>
      </div>
    </div>
  );
}
