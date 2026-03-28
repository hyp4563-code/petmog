import { useState, useEffect } from 'react';
import { ArrowLeft, Camera, ChevronDown, Check, Plus, Trash2 } from 'lucide-react';
import { Pet, AnimalType } from '../types';

const BREEDS = {
  cat: ['スコティッシュフォールド', 'マンチカン', 'ノルウェジアンフォレストキャット', 'ロシアンブルー', 'メインクーン', 'ペルシャ', 'アメリカンショートヘア', 'ブリティッシュショートヘア', 'ラグドール', 'アビシニアン', 'ベンガル', 'サイベリアン', 'その他'],
  dog: ['トイプードル', 'チワワ', '柴犬', 'ゴールデンレトリバー', 'ダックスフンド', 'フレンチブルドッグ', 'ポメラニアン', 'マルチーズ', 'ビーグル', 'その他']
};

const HEALTH_CONCERNS = ['飲水量', '毛質', 'ヘアボール', '便秘', '下痢', '体重', '歯', '皮膚', '腎臓', '関節', '目', '心臓'];

export default function PetRegistrationFlow({ onComplete, onCancel, initialData }: { onComplete: (pet: Pet) => void, onCancel: () => void, initialData?: Pet }) {
  const [step, setStep] = useState(1);
  const [pet, setPet] = useState<Pet>(initialData || {
    id: Date.now().toString(),
    name: '',
    type: 'cat',
    breed: '',
    birthDate: '2020-01-01',
    weight: 3.0,
    gender: 'male',
    bodyType: 'normal',
    healthConcerns: [],
    hasAllergy: false
  });

  useEffect(() => {
    if (initialData) {
      setPet({ ...initialData });
    }
  }, [initialData]);

  const nextStep = () => setStep(prev => prev + 1);

  if (step === 4) {
    return (
      <div className="fixed inset-0 bg-white z-[100] p-4 flex flex-col items-center justify-center">
        <h2 className="text-xl font-black text-brand-peach-800 mb-4">うちの子登録完了</h2>
        <p className="text-sm text-brand-peach-600 mb-8 text-center">お疲れ様でした！{pet.name}の大切な情報でカスタム商品をおすすめします</p>
        <div className="w-full bg-brand-peach-50 p-4 rounded-2xl mb-8">
          <p className="font-black text-brand-peach-800">{pet.name}</p>
          <p className="text-xs text-brand-peach-400">{pet.breed} / {pet.gender === 'male' ? '男の子' : '女の子'} / {pet.weight}kg</p>
        </div>
        <button onClick={() => onComplete(pet)} className="w-full bg-brand-peach-200 text-white font-black py-3 rounded-xl">マイページへ移動</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-y-auto p-4">
      <button onClick={onCancel} className="mb-4"><ArrowLeft /></button>
      <h2 className="text-xl font-black text-brand-peach-800 mb-6">うちの子登録</h2>
      
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm font-bold text-brand-peach-800 mb-6">一緒にいる<span className="text-brand-peach-400">{pet.name || 'ペット'}</span>はどんな子ですか？</p>
          <input type="text" placeholder="ペット名" value={pet.name} onChange={e => setPet(prev => ({ ...prev, name: e.target.value }))} className="w-full p-3 bg-brand-peach-50 rounded-xl text-sm font-bold" />
          <select value={pet.type} onChange={e => setPet(prev => ({ ...prev, type: e.target.value as AnimalType, breed: '' }))} className="w-full p-3 bg-brand-peach-50 rounded-xl text-sm font-bold">
            <option value="cat">猫</option>
            <option value="dog">犬</option>
          </select>
          <select value={pet.breed} onChange={e => setPet(prev => ({ ...prev, breed: e.target.value }))} className="w-full p-3 bg-brand-peach-50 rounded-xl text-sm font-bold">
            <option value="">種を選択してください</option>
            {BREEDS[pet.type === 'dog' ? 'dog' : 'cat'].map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <input type="date" value={pet.birthDate} onChange={e => setPet(prev => ({ ...prev, birthDate: e.target.value }))} className="w-full p-3 bg-brand-peach-50 rounded-xl text-sm font-bold" />
          <button onClick={nextStep} disabled={!pet.name || !pet.breed} className="w-full bg-brand-peach-200 text-white font-black py-3 rounded-xl disabled:bg-gray-300 disabled:text-gray-500">次へ</button>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm font-bold text-brand-peach-800 mb-6">{pet.name}は{pet.breed}なんですね！もう少し教えていただけますか？</p>
          <div className="flex gap-2">
            <button onClick={() => setPet(prev => ({ ...prev, gender: 'male' }))} className={`flex-1 p-3 rounded-xl font-bold ${pet.gender === 'male' ? 'bg-brand-peach-100 text-white' : 'bg-brand-peach-50'}`}>男の子</button>
            <button onClick={() => setPet(prev => ({ ...prev, gender: 'female' }))} className={`flex-1 p-3 rounded-xl font-bold ${pet.gender === 'female' ? 'bg-brand-peach-100 text-white' : 'bg-brand-peach-50'}`}>女の子</button>
          </div>
          <input type="number" step="0.5" placeholder="体重(kg)" value={pet.weight} onChange={e => setPet(prev => ({ ...prev, weight: parseFloat(e.target.value) }))} className="w-full p-3 bg-brand-peach-50 rounded-xl text-sm font-bold" />
          <div className="flex gap-2">
            {['thin', 'normal', 'chubby'].map(t => (
              <button key={t} onClick={() => setPet(prev => ({ ...prev, bodyType: t as any }))} className={`flex-1 p-3 rounded-xl font-bold ${pet.bodyType === t ? 'bg-brand-peach-200 text-white' : 'bg-brand-peach-50'}`}>{t === 'thin' ? '細い' : t === 'normal' ? '普通' : 'ぽっちゃり'}</button>
            ))}
          </div>
          <button onClick={nextStep} className="w-full bg-brand-peach-200 text-white font-black py-3 rounded-xl">次へ</button>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm font-bold text-brand-peach-800 mb-6">最後です！{pet.name}について詳しく教えてください！</p>
          <div className="flex flex-wrap gap-2">
            {HEALTH_CONCERNS.map(c => (
              <button key={c} onClick={() => setPet(prev => ({ ...prev, healthConcerns: prev.healthConcerns.includes(c) ? prev.healthConcerns.filter(h => h !== c) : [...prev.healthConcerns, c] }))} className={`p-2 rounded-xl text-xs font-bold ${pet.healthConcerns.includes(c) ? 'bg-brand-peach-200 text-white' : 'bg-brand-peach-50'}`}>{c}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPet(prev => ({ ...prev, hasAllergy: true }))} className={`flex-1 p-3 rounded-xl font-bold ${pet.hasAllergy ? 'bg-brand-peach-200 text-white' : 'bg-brand-peach-50'}`}>はい、あります</button>
            <button onClick={() => setPet(prev => ({ ...prev, hasAllergy: false }))} className={`flex-1 p-3 rounded-xl font-bold ${!pet.hasAllergy ? 'bg-brand-peach-200 text-white' : 'bg-brand-peach-50'}`}>いいえ、ありません</button>
          </div>
          <button onClick={nextStep} className="w-full bg-brand-peach-200 text-white font-black py-3 rounded-xl">すべて記入しました</button>
        </div>
      )}
    </div>
  );
}
