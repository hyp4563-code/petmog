import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Truck, 
  CreditCard, 
  CheckCircle, 
  Plus, 
  Minus, 
  Trash2, 
  ChevronRight, 
  Search,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Product, CartItem as GlobalCartItem } from '../types';

type Step = 'cart' | 'shipping' | 'payment' | 'success';

export default function CheckoutFlow({ 
  onBack, 
  cart, 
  setCart, 
  products 
}: { 
  onBack: () => void;
  cart: GlobalCartItem[];
  setCart: React.Dispatch<React.SetStateAction<GlobalCartItem[]>>;
  products: Product[];
}) {
  const [step, setStep] = useState<Step>('cart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  // Derived cart items with full product details
  const cartItems = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      id: item.productId,
      name: product?.name || '不明な商品',
      price: product?.price || 0,
      quantity: item.quantity,
      image: product?.image || '📦',
      selectedOption: item.selectedOption
    };
  });

  // Shipping Form State
  const [shippingForm, setShippingForm] = useState({
    name: '',
    phone: '',
    zip: '',
    address: '',
    detail: '',
    memo: '指定なし'
  });
  const [shippingErrors, setShippingErrors] = useState<Record<string, string>>({});

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });
  const [isFlipped, setIsFlipped] = useState(false);

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingFee = subtotal >= 5000 || cartItems.length === 0 ? 0 : 500;
  const total = subtotal + shippingFee;

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => 
      item.productId === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.productId !== id));
  };

  const validateShipping = () => {
    const errors: Record<string, string> = {};
    if (!shippingForm.name) errors.name = '氏名を入力してください';
    if (!shippingForm.phone) errors.phone = '電話番号を入力してください';
    if (!shippingForm.zip) errors.zip = '郵便番号を入力してください';
    if (!shippingForm.address) errors.address = '住所を入力してください';
    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePaymentSubmit = async () => {
    setIsProcessing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setOrderNumber(Math.random().toString(36).substring(2, 10).toUpperCase());
    setIsProcessing(false);
    setStep('success');
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div className="min-h-screen bg-brand-peach-50 pb-20">
      {/* Header */}
      <header className="bg-white px-4 py-4 sticky top-0 z-50 flex items-center gap-4 border-b border-brand-peach-100/20">
        <button onClick={onBack} className="p-2 hover:bg-brand-peach-50 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-brand-peach-800" />
        </button>
        <h1 className="text-lg font-black text-brand-peach-800">
          {step === 'cart' && 'ショッピングカート'}
          {step === 'shipping' && '配送先入力'}
          {step === 'payment' && 'お支払い'}
          {step === 'success' && '注文完了'}
        </h1>
      </header>

      {/* Progress Bar */}
      {step !== 'success' && (
        <div className="bg-white px-8 py-6 mb-4">
          <div className="relative flex justify-between items-center max-w-xs mx-auto">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-brand-peach-100/20 -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-brand-peach-100 -translate-y-1/2 z-0 transition-all duration-500" 
              style={{ width: step === 'cart' ? '0%' : step === 'shipping' ? '50%' : '100%' }}
            />
            
            {[
              { id: 'cart', icon: ShoppingCart },
              { id: 'shipping', icon: Truck },
              { id: 'payment', icon: CreditCard }
            ].map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isCompleted = (step === 'shipping' && i === 0) || (step === 'payment' && i <= 1);
              
              return (
                <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive ? 'bg-brand-peach-100 text-white scale-110 shadow-lg shadow-brand-peach-100/30' : 
                    isCompleted ? 'bg-brand-peach-100 text-white' : 'bg-white border-2 border-brand-peach-100/20 text-brand-peach-200'
                  }`}>
                    <Icon size={20} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <main className="max-w-md mx-auto px-4">
        <AnimatePresence mode="wait">
          {step === 'cart' && (
            <motion.div 
              key="cart"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {cartItems.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {cartItems.map(item => (
                      <div key={item.id} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-brand-peach-100/10">
                        <div className="w-16 h-16 bg-brand-peach-50 rounded-2xl flex items-center justify-center text-3xl">
                          {item.image}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-black text-brand-peach-800 text-sm">{item.name}</h3>
                          <p className="text-brand-peach-100 font-black">¥{item.price.toLocaleString()}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center bg-brand-peach-50 rounded-xl px-2 py-1">
                              <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-brand-peach-400 hover:text-brand-peach-800">
                                <Minus size={16} />
                              </button>
                              <span className="w-8 text-center font-black text-brand-peach-800 text-sm">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-brand-peach-400 hover:text-brand-peach-800">
                                <Plus size={16} />
                              </button>
                            </div>
                            <button onClick={() => removeItem(item.id)} className="text-brand-peach-200 hover:text-red-500 transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-brand-peach-100/10 space-y-3">
                    <div className="flex justify-between text-sm font-bold text-brand-peach-400">
                      <span>小計</span>
                      <span>¥{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-brand-peach-400">
                      <span>送料</span>
                      <span>{shippingFee === 0 ? '無料' : `¥${shippingFee.toLocaleString()}`}</span>
                    </div>
                    {shippingFee > 0 && (
                      <p className="text-[10px] text-brand-peach-200 font-bold text-right">
                        あと¥{(5000 - subtotal).toLocaleString()}で送料無料
                      </p>
                    )}
                    <div className="pt-3 border-t border-brand-peach-50 flex justify-between items-center">
                      <span className="font-black text-brand-peach-800">合計</span>
                      <span className="text-2xl font-black text-brand-peach-100">¥{total.toLocaleString()}</span>
                    </div>
                    <button 
                      onClick={() => setStep('shipping')}
                      className="w-full bg-brand-peach-100 text-white font-black py-4 rounded-2xl shadow-lg shadow-brand-peach-100/20 mt-4 flex items-center justify-center gap-2"
                    >
                      注文する
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-white p-12 rounded-[2.5rem] text-center space-y-4">
                  <div className="text-6xl">🛒</div>
                  <p className="font-black text-brand-peach-800">カートは空です</p>
                  <button onClick={onBack} className="text-brand-peach-100 font-bold text-sm underline">
                    買い物を続ける
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {step === 'shipping' && (
            <motion.div 
              key="shipping"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-brand-peach-100/10 space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-black text-brand-peach-800 ml-1">受取人氏名</label>
                  <input 
                    type="text" 
                    placeholder="山田 太郎"
                    value={shippingForm.name}
                    onChange={e => setShippingForm({...shippingForm, name: e.target.value})}
                    className={`w-full bg-brand-peach-50 border-2 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-peach-100 transition-colors ${shippingErrors.name ? 'border-red-400' : 'border-transparent'}`}
                  />
                  {shippingErrors.name && <p className="text-[10px] text-red-500 font-bold ml-1">{shippingErrors.name}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-brand-peach-800 ml-1">電話番号</label>
                  <input 
                    type="tel" 
                    placeholder="09012345678"
                    value={shippingForm.phone}
                    onChange={e => setShippingForm({...shippingForm, phone: e.target.value})}
                    className={`w-full bg-brand-peach-50 border-2 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-peach-100 transition-colors ${shippingErrors.phone ? 'border-red-400' : 'border-transparent'}`}
                  />
                  {shippingErrors.phone && <p className="text-[10px] text-red-500 font-bold ml-1">{shippingErrors.phone}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-brand-peach-800 ml-1">郵便番号</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="123-4567"
                      value={shippingForm.zip}
                      onChange={e => setShippingForm({...shippingForm, zip: e.target.value})}
                      className={`flex-1 bg-brand-peach-50 border-2 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-peach-100 transition-colors ${shippingErrors.zip ? 'border-red-400' : 'border-transparent'}`}
                    />
                    <button className="bg-brand-peach-50 text-brand-peach-800 font-black px-4 rounded-2xl text-xs flex items-center gap-1 border border-brand-peach-100/20">
                      <Search size={14} />
                      検索
                    </button>
                  </div>
                  {shippingErrors.zip && <p className="text-[10px] text-red-500 font-bold ml-1">{shippingErrors.zip}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-brand-peach-800 ml-1">住所</label>
                  <input 
                    type="text" 
                    placeholder="東京都渋谷区..."
                    value={shippingForm.address}
                    onChange={e => setShippingForm({...shippingForm, address: e.target.value})}
                    className={`w-full bg-brand-peach-50 border-2 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-peach-100 transition-colors ${shippingErrors.address ? 'border-red-400' : 'border-transparent'}`}
                  />
                  {shippingErrors.address && <p className="text-[10px] text-red-500 font-bold ml-1">{shippingErrors.address}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-brand-peach-800 ml-1">詳細住所（建物名・部屋番号）</label>
                  <input 
                    type="text" 
                    placeholder="ペットマンション 101"
                    value={shippingForm.detail}
                    onChange={e => setShippingForm({...shippingForm, detail: e.target.value})}
                    className="w-full bg-brand-peach-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-peach-100 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-brand-peach-800 ml-1">配送メモ</label>
                  <select 
                    value={shippingForm.memo}
                    onChange={e => setShippingForm({...shippingForm, memo: e.target.value})}
                    className="w-full bg-brand-peach-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-peach-100 transition-colors appearance-none"
                  >
                    <option>指定なし</option>
                    <option>置き配希望</option>
                    <option>インターホンを押してください</option>
                    <option>不在時は宅配ボックスへ</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setStep('cart')}
                    className="flex-1 bg-white border border-brand-peach-100 text-brand-peach-800 font-black py-4 rounded-2xl"
                  >
                    戻る
                  </button>
                  <button 
                    onClick={() => validateShipping() && setStep('payment')}
                    className="flex-2 bg-brand-peach-100 text-white font-black py-4 rounded-2xl shadow-lg shadow-brand-peach-100/20"
                  >
                    支払いへ進む
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div 
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Card Preview */}
              <div className="perspective-1000 w-full h-48">
                <motion.div 
                  className="relative w-full h-full transition-all duration-500 preserve-3d"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                >
                  {/* Front */}
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-peach-100 to-brand-rose rounded-3xl p-6 text-white backface-hidden shadow-xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-10 h-8 bg-yellow-400/80 rounded-md" />
                      <div className="text-xl font-black italic">VISA</div>
                    </div>
                    <div className="text-xl font-mono tracking-widest mb-4">
                      {paymentForm.number || '•••• •••• •••• ••••'}
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[8px] uppercase opacity-70">Card Holder</p>
                        <p className="text-xs font-black uppercase tracking-wider truncate w-32">
                          {paymentForm.name || 'YOUR NAME'}
                        </p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-[8px] uppercase opacity-70">Expires</p>
                        <p className="text-xs font-black">{paymentForm.expiry || 'MM/YY'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Back */}
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-peach-100 to-brand-rose rounded-3xl text-white backface-hidden shadow-xl overflow-hidden rotate-y-180">
                    <div className="mt-6 h-10 bg-black/80 w-full" />
                    <div className="mt-4 px-6">
                      <div className="bg-white/20 h-8 rounded flex items-center justify-end px-3">
                        <span className="text-sm font-mono font-black italic">{paymentForm.cvc || '•••'}</span>
                      </div>
                      <p className="text-[8px] mt-4 opacity-70 leading-relaxed">
                        This card is property of PetMog Bank. If found, please return to any PetMog branch. 
                        Authorized signature required.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-brand-peach-100/10 space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-black text-brand-peach-800 ml-1">カード番号</label>
                  <input 
                    type="text" 
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    value={paymentForm.number}
                    onChange={e => setPaymentForm({...paymentForm, number: formatCardNumber(e.target.value)})}
                    onFocus={() => setIsFlipped(false)}
                    className="w-full bg-brand-peach-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-peach-100 transition-colors"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-black text-brand-peach-800 ml-1">有効期限</label>
                    <input 
                      type="text" 
                      placeholder="MM/YY"
                      maxLength={5}
                      value={paymentForm.expiry}
                      onChange={e => setPaymentForm({...paymentForm, expiry: formatExpiry(e.target.value)})}
                      onFocus={() => setIsFlipped(false)}
                      className="w-full bg-brand-peach-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-peach-100 transition-colors"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-black text-brand-peach-800 ml-1">CVC</label>
                    <input 
                      type="text" 
                      placeholder="123"
                      maxLength={3}
                      value={paymentForm.cvc}
                      onChange={e => setPaymentForm({...paymentForm, cvc: e.target.value.replace(/[^0-9]/g, '')})}
                      onFocus={() => setIsFlipped(true)}
                      onBlur={() => setIsFlipped(false)}
                      className="w-full bg-brand-peach-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-peach-100 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-brand-peach-800 ml-1">カード名義人</label>
                  <input 
                    type="text" 
                    placeholder="TARO YAMADA"
                    value={paymentForm.name}
                    onChange={e => setPaymentForm({...paymentForm, name: e.target.value.toUpperCase()})}
                    onFocus={() => setIsFlipped(false)}
                    className="w-full bg-brand-peach-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-peach-100 transition-colors"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setStep('shipping')}
                    className="flex-1 bg-white border border-brand-peach-100 text-brand-peach-800 font-black py-4 rounded-2xl"
                  >
                    戻る
                  </button>
                  <button 
                    onClick={handlePaymentSubmit}
                    disabled={isProcessing}
                    className="flex-2 bg-brand-peach-100 text-white font-black py-4 rounded-2xl shadow-lg shadow-brand-peach-100/20 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        決済中...
                      </>
                    ) : (
                      `¥${total.toLocaleString()}を支払う`
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-xl text-center space-y-6 mt-10"
            >
              <div className="w-20 h-20 bg-brand-mint/10 text-brand-mint rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={48} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-brand-peach-800">ご注文ありがとうございます！</h2>
                <p className="text-sm text-brand-peach-400 font-bold">
                  注文を承りました。発送までしばらくお待ちください。
                </p>
              </div>

              <div className="bg-brand-peach-50 p-4 rounded-2xl border border-brand-peach-100/20">
                <p className="text-[10px] text-brand-peach-400 font-bold uppercase mb-1">注文番号</p>
                <p className="text-lg font-black text-brand-peach-800 tracking-widest">#{orderNumber}</p>
              </div>

              <div className="space-y-3 pt-4">
                <button 
                  onClick={onBack}
                  className="w-full bg-brand-peach-100 text-white font-black py-4 rounded-2xl shadow-lg shadow-brand-peach-100/20"
                >
                  トップページへ戻る
                </button>
                <button 
                  onClick={() => toast('注文履歴へ遷移します')}
                  className="w-full bg-white border border-brand-peach-100 text-brand-peach-100 font-black py-4 rounded-2xl"
                >
                  注文履歴を確認する
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .flex-2 {
          flex: 2;
        }
      `}</style>
    </div>
  );
}
