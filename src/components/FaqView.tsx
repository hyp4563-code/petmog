import { useState } from 'react';
import { ArrowLeft, Search, ChevronDown, ChevronUp } from 'lucide-react';

type FaqItem = { question: string; answer: string };
type FaqCategory = { title: string; items: FaqItem[] };

const faqData: FaqCategory[] = [
  {
    title: '注文・購入について',
    items: [
      { question: '注文方法を教えてください', answer: '商品詳細ページから「カートに入れる」を選択し、カート画面から「購入手続きへ進む」をタップしてください。' },
      { question: '注文後にキャンセルや変更はできますか？', answer: '発送準備前であれば可能です。マイページの注文履歴からお手続きください。' },
      { question: '領収書・明細書は発行できますか？', answer: 'マイページの注文履歴からPDF形式でダウンロード可能です。' },
      { question: 'まとめ買い割引はありますか？', answer: '対象商品には商品ページに「まとめ買い割引」のアイコンが表示されています。' },
      { question: '定期便（サブスクリプション）はありますか？', answer: 'はい、対象商品で「定期便」を選択いただくと、毎回5%OFFでお届けします。' },
    ]
  },
  {
    title: '配送について',
    items: [
      { question: '配送にはどのくらいかかりますか？', answer: '通常、ご注文から2〜4営業日でお届けします。' },
      { question: '送料はいくらですか？', answer: '全国一律500円です。5,000円以上のお買い上げで送料無料となります。' },
      { question: '配送日時を指定できますか？', answer: 'はい、購入手続き画面でご指定いただけます。' },
      { question: '置き配・宅配ボックスに対応していますか？', answer: 'はい、配送業者指定の置き配・宅配ボックスに対応しています。' },
      { question: '追跡番号の確認方法を教えてください', answer: '発送完了メール、またはマイページの注文履歴からご確認いただけます。' },
    ]
  },
  {
    title: '返品・交換について',
    items: [
      { question: '商品の返品・交換はできますか？', answer: '商品到着後8日以内で、未開封・未使用の場合に限り可能です。' },
      { question: '返品・交換の手順を教えてください', answer: 'マイページの注文履歴から「返品・交換申請」を行ってください。' },
      { question: '開封済みの商品は返品できますか？', answer: '申し訳ございませんが、開封済みの商品は返品をお受けできません。' },
      { question: 'ペットが食べなかった場合、返品できますか？', answer: '食品の場合、衛生上の理由から返品をお受けできません。' },
    ]
  },
  {
    title: '支払い・ポイントについて',
    items: [
      { question: '使える支払い方法を教えてください', answer: 'クレジットカード、PayPay、コンビニ払い、代金引換がご利用いただけます。' },
      { question: 'ポイントはどのように貯まりますか？', answer: 'お買い上げ金額100円につき1ポイント貯まります。' },
      { question: 'ポイントの有効期限はありますか？', answer: '最終購入日から1年間です。' },
      { question: 'クーポンの使い方を教えてください', answer: 'カート画面の「クーポンコード入力欄」にご入力ください。' },
      { question: '領収書のあて名は変更できますか？', answer: 'マイページの領収書発行画面で変更可能です。' },
    ]
  },
  {
    title: 'アカウント・会員について',
    items: [
      { question: '会員登録は無料ですか？', answer: 'はい、完全無料です。' },
      { question: 'ゴールド会員などのランクについて教えてください', answer: '年間購入金額に応じてランクが上がり、ポイント還元率がアップします。' },
      { question: 'パスワードを忘れた場合はどうすればいいですか？', answer: 'ログイン画面の「パスワードをお忘れの方」から再設定してください。' },
      { question: 'メールが届かない場合はどうすればいいですか？', answer: '迷惑メールフォルダをご確認いただくか、ドメイン指定受信の設定をご確認ください。' },
      { question: '退会後に再登録はできますか？', answer: 'はい、可能です。ただし、過去のポイントや履歴は引き継がれません。' },
    ]
  },
  {
    title: 'ペット・商品について',
    items: [
      { question: '年齢・体重に合った商品の選び方を教えてください', answer: '商品詳細ページの「おすすめ対象」をご確認ください。' },
      { question: 'アレルギー対応商品はありますか？', answer: 'はい、商品検索で「アレルギー対応」フィルターをご利用ください。' },
      { question: '獣医師に相談できますか？', answer: 'はい、コミュニティ機能の「獣医師Q&A」からご相談いただけます。' },
      { question: '賞味期限・消費期限はどこで確認できますか？', answer: '商品パッケージの裏面をご確認ください。' },
      { question: '輸入品の安全性は確認されていますか？', answer: 'はい、全て国内の安全基準をクリアしたもののみを取り扱っています。' },
    ]
  },
];

export default function FaqView({ onBack }: { onBack: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (question: string) => {
    setOpenItems(prev => prev.includes(question) ? prev.filter(q => q !== question) : [...prev, question]);
  };

  const filteredData = faqData.map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.question.includes(searchTerm) || item.answer.includes(searchTerm)
    )
  })).filter(category => category.items.length > 0);

  return (
    <div className="bg-brand-peach-50 min-h-screen">
      <header className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-50 border-b border-brand-peach-50">
        <button onClick={onBack} className="text-brand-peach-800"><ArrowLeft size={24} /></button>
        <h2 className="text-lg font-black text-brand-peach-800">よくある質問</h2>
      </header>

      <div className="p-4">
        <div className="bg-white rounded-2xl p-2 flex items-center gap-2 border border-brand-peach-50 mb-6">
          <Search className="text-brand-peach-200 ml-2" size={20} />
          <input 
            type="text" 
            placeholder="キーワードで検索" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full p-2 text-sm font-bold text-brand-peach-800 focus:outline-none"
          />
        </div>

        <div className="space-y-6">
          {filteredData.map(category => (
            <div key={category.title}>
              <h3 className="text-xs font-black text-brand-peach-200 uppercase tracking-widest mb-3 px-2">{category.title}</h3>
              <div className="bg-white rounded-2xl border border-brand-peach-50 overflow-hidden">
                {category.items.map((item, i) => (
                  <div key={item.question} className={i !== category.items.length - 1 ? 'border-b border-brand-peach-50' : ''}>
                    <button 
                      onClick={() => toggleItem(item.question)}
                      className="w-full px-4 py-4 flex items-center justify-between text-left"
                    >
                      <span className="text-sm font-bold text-brand-peach-800">{item.question}</span>
                      {openItems.includes(item.question) ? <ChevronUp size={18} className="text-brand-peach-200" /> : <ChevronDown size={18} className="text-brand-peach-200" />}
                    </button>
                    {openItems.includes(item.question) && (
                      <div className="px-4 pb-4 text-xs text-brand-peach-600 leading-relaxed">
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
