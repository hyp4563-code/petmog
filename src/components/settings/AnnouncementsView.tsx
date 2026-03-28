import { ArrowLeft } from 'lucide-react';

export default function AnnouncementsView({ onBack }: { onBack: () => void }) {
  const announcements = [
    { id: 1, title: '【重要】システムメンテナンスのお知らせ', date: '2026.03.25' },
    { id: 2, title: '春のキャンペーン開催中！', date: '2026.03.20' },
    { id: 3, title: '新機能追加のお知らせ', date: '2026.03.15' },
  ];

  return (
    <div className="bg-brand-peach-50 min-h-screen">
      <header className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-50 border-b border-brand-peach-50">
        <button onClick={onBack} className="text-brand-peach-800"><ArrowLeft size={24} /></button>
        <h2 className="text-lg font-black text-brand-peach-800">お知らせ</h2>
      </header>
      <div className="p-4 space-y-4">
        {announcements.map(announcement => (
          <div key={announcement.id} className="bg-white p-6 rounded-2xl shadow-sm border border-brand-peach-50">
            <p className="text-xs text-brand-peach-200 font-bold mb-1">{announcement.date}</p>
            <p className="text-sm font-black text-brand-peach-800">{announcement.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
