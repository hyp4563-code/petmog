import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyView({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-brand-peach-50 min-h-screen pb-8">
      <header className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-50 border-b border-brand-peach-50">
        <button onClick={onBack} className="text-brand-peach-800"><ArrowLeft size={24} /></button>
        <h2 className="text-lg font-black text-brand-peach-800">プライバシーポリシー</h2>
      </header>
      <div className="p-6 bg-white rounded-2xl m-4 text-sm text-brand-peach-800 leading-relaxed space-y-4">
        <p className="text-xs text-brand-peach-400 font-bold">制定日：2025年1月1日</p>
        <p>NXTRADE株式会社（以下「当社」といいます）は、ペット用品・フード・おやつのECサイトおよびアプリ「PetMog」（以下「本サービス」といいます）において、会員の個人情報を適切に保護することを重要な責務と認識し、以下の通りプライバシーポリシーを定めます。</p>
        
        <h3 className="font-bold text-brand-peach-800">1. 個人情報の取得</h3>
        <p>当社は、適正な手段により会員の個人情報を取得します。これには、会員登録時や商品購入時にご提供いただく氏名、住所、メールアドレス、ペット情報などが含まれます。</p>

        <h3 className="font-bold text-brand-peach-800">2. 利用目的</h3>
        <p>取得した個人情報は、本サービスの提供、商品配送、お問合せへの対応、および当社からのご案内等の目的で利用します。</p>

        <h3 className="font-bold text-brand-peach-800">3. 第三者への提供</h3>
        <p>当社は、法令に基づく場合を除き、会員の同意を得ることなく個人情報を第三者に提供しません。</p>

        <h3 className="font-bold text-brand-peach-800">4. 個人情報の管理・安全対策</h3>
        <p>当社は、個人情報の漏洩、滅失または毀損を防止するため、適切な安全管理措置を講じます。</p>

        <h3 className="font-bold text-brand-peach-800">5. Cookieおよびトラッキング技術の利用</h3>
        <p>本サービスでは、利便性向上のためCookieおよび類似の技術を利用することがあります。</p>

        <h3 className="font-bold text-brand-peach-800">6. 外部サービスの利用</h3>
        <p>本サービスでは、Firebase、Googleアナリティクス等の外部サービスを利用して、サービスの改善や分析を行っています。</p>

        <h3 className="font-bold text-brand-peach-800">7. 未成年者の個人情報</h3>
        <p>未成年者が本サービスを利用する場合は、保護者の同意を得た上で利用するものとします。</p>

        <h3 className="font-bold text-brand-peach-800">8. 個人情報の開示・訂正・削除の請求</h3>
        <p>会員は、当社が保有する自己の個人情報の開示、訂正、削除を請求することができます。</p>

        <h3 className="font-bold text-brand-peach-800">9. プライバシーポリシーの変更</h3>
        <p>当社は、必要に応じて本ポリシーを変更することがあります。変更後のポリシーは本サービス上に掲載した時点で効力を生じます。</p>

        <h3 className="font-bold text-brand-peach-800">10. お問い合わせ先</h3>
        <p>本ポリシーに関するお問い合わせは、下記までご連絡ください。<br/>
        NXTRADE株式会社<br/>
        お問い合わせ窓口：support@petmog.example.com</p>
      </div>
    </div>
  );
}
