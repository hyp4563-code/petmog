import { ArrowLeft } from 'lucide-react';

export default function TermsOfServiceView({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-brand-peach-50 min-h-screen pb-8">
      <header className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-50 border-b border-brand-peach-50">
        <button onClick={onBack} className="text-brand-peach-800"><ArrowLeft size={24} /></button>
        <h2 className="text-lg font-black text-brand-peach-800">利用規約</h2>
      </header>
      <div className="p-6 bg-white rounded-2xl m-4 text-sm text-brand-peach-800 leading-relaxed space-y-4">
        <p className="text-xs text-brand-peach-400 font-bold">施行日：2025年1月1日</p>
        <p>NXTRADE株式会社（以下「当社」といいます）が提供するペット用品・フード・おやつのECサイトおよびアプリ「PetMog」（以下「本サービス」といいます）の利用規約を以下の通り定めます。</p>
        
        <h3 className="font-bold text-brand-peach-800">第1条（目的・適用）</h3>
        <p>本規約は、本サービスの利用条件を定めるものです。利用者は本サービスを利用することにより、本規約に同意したものとみなされます。</p>

        <h3 className="font-bold text-brand-peach-800">第2条（定義）</h3>
        <p>「会員」とは、本サービスに会員登録を行い、当社がこれを承認した個人をいいます。</p>

        <h3 className="font-bold text-brand-peach-800">第3条（会員登録）</h3>
        <p>会員登録を希望する者は、当社の定める方法により登録申請を行うものとします。</p>

        <h3 className="font-bold text-brand-peach-800">第4条（会員情報の管理）</h3>
        <p>会員は、自己のIDおよびパスワードを適切に管理する責任を負うものとします。</p>

        <h3 className="font-bold text-brand-peach-800">第5条（サービスの利用）</h3>
        <p>会員は、本規約および当社が別途定めるルールに従い、本サービスを利用するものとします。</p>

        <h3 className="font-bold text-brand-peach-800">第6条（商品の購入・注文）</h3>
        <p>会員は、本サービスを通じて商品を購入することができます。注文確定をもって売買契約が成立するものとします。</p>

        <h3 className="font-bold text-brand-peach-800">第7条（料金・支払い）</h3>
        <p>商品代金、送料、手数料の支払いは、当社の指定する決済方法によるものとします。</p>

        <h3 className="font-bold text-brand-peach-800">第8条（返品・キャンセル）</h3>
        <p>商品の返品・キャンセルについては、当社が別途定める「特定商取引法に基づく表記」に従うものとします。</p>

        <h3 className="font-bold text-brand-peach-800">第9条（禁止事項）</h3>
        <p>会員は、本サービスの利用にあたり、法令に違反する行為や、他者の権利を侵害する行為を行ってはなりません。</p>

        <h3 className="font-bold text-brand-peach-800">第10条（知的財産権）</h3>
        <p>本サービスに関する知的財産権は、すべて当社または当社にライセンスを許諾している者に帰属します。</p>

        <h3 className="font-bold text-brand-peach-800">第11条（免責事項）</h3>
        <p>当社は、本サービスの利用により会員に生じた損害について、当社の故意または重大な過失がある場合を除き、責任を負いません。</p>

        <h3 className="font-bold text-brand-peach-800">第12条（個人情報の取り扱い）</h3>
        <p>当社は、会員の個人情報を別途定める「プライバシーポリシー」に従い適切に取り扱います。</p>

        <h3 className="font-bold text-brand-peach-800">第13条（サービスの変更・終了）</h3>
        <p>当社は、会員に通知することなく、本サービスの内容を変更または終了することができるものとします。</p>

        <h3 className="font-bold text-brand-peach-800">第14条（準拠法・管轄裁判所）</h3>
        <p>本規約は日本法に準拠し、紛争については東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
      </div>
    </div>
  );
}
