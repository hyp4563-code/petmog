import { motion } from 'motion/react';
import { ShoppingCart, PawPrint, Users, Gift, Tag, Award } from 'lucide-react';

export default function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="bg-brand-peach-50 min-h-screen pb-12">
      {/* Hero */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="px-6 py-16"
      >
        <div className="bg-white rounded-3xl shadow-md p-8 text-center">
          <div className="text-4xl mb-4">🐾</div>
          <h1 className="text-3xl font-black text-brand-peach-800 mb-4">ペットとの毎日を、もっと楽しく</h1>
          <p className="text-brand-peach-600 mb-8 leading-relaxed">PetMogは、フード・おやつ・グッズが揃うペット専用ショッピングアプリ。あなたの子に最適なアイテムを見つけよう。</p>
          <button 
            onClick={onStart} 
            className="w-full bg-[#E8845A] text-white font-bold text-lg py-4 px-8 rounded-2xl hover:opacity-90 transition-opacity"
          >
            今すぐ始める
          </button>
          <div className="mt-12 text-6xl flex justify-center gap-6 opacity-80">
            <span>🐕</span><span>🐈</span><span>🐇</span>
          </div>
        </div>
      </motion.section>

      {/* Features */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="px-6 py-12"
      >
        <h2 className="text-xl font-black text-brand-peach-800 mb-8 text-center">PetMogの特徴</h2>
        <div className="space-y-4">
          {[
            { icon: <ShoppingCart className="text-brand-peach-500" />, title: '豊富な品揃え', desc: 'フード・おやつ・グッズ・ケア用品まで幅広く取り揃え' },
            { icon: <PawPrint className="text-brand-peach-500" />, title: 'ペット別おすすめ', desc: 'あなたの子のサイズ・年齢・体型に合わせた商品提案' },
            { icon: <Users className="text-brand-peach-500" />, title: 'コミュニティ', desc: '飼い主さん同士で情報交換・交流できるコミュニティ機能' },
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-brand-peach-100/20"
            >
              <div className="mb-3">{feature.icon}</div>
              <h3 className="font-black text-brand-peach-800 mb-1">{feature.title}</h3>
              <p className="text-sm text-brand-peach-600">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Services */}
      <section className="px-6 py-12">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-peach-100/20 space-y-6">
          {[
            { icon: <Tag className="text-brand-peach-400" />, title: '今日の特売' },
            { icon: <Gift className="text-brand-peach-400" />, title: '友達招待500円クーポン' },
            { icon: <Award className="text-brand-peach-400" />, title: 'ポイントプログラム' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="p-3 bg-brand-peach-50 rounded-xl">{item.icon}</div>
              <span className="font-bold text-brand-peach-800">{item.title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="mx-6 p-8 rounded-2xl text-center"
        style={{ backgroundColor: '#E8845A' }}
      >
        <h2 className="text-white font-bold text-2xl mb-4">ペットとの生活をもっと豊かに</h2>
        <button 
          onClick={onStart} 
          className="bg-white text-orange-600 font-bold py-4 px-8 rounded-2xl w-full"
        >
          今すぐ無料で始める
        </button>
      </motion.section>
    </div>
  );
}
