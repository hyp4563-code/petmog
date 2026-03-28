/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { 
  Home as HomeIcon, 
  Menu, 
  PawPrint, 
  Search as SearchIcon, 
  User as UserIcon,
  Bell,
  ShoppingCart,
  ChevronRight,
  Star,
  Plus,
  Heart,
  ArrowLeft,
  X,
  Camera,
  MessageCircle,
  Settings,
  Gift,
  CreditCard,
  HelpCircle,
  Filter,
  Check,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Tab, Page, Product, CartItem, CommunityPost, PostComment, User, Pet, AnimalType, Address } from './types';
import { PRODUCTS } from './data/dummy';
import { db, auth, signInWithGoogle, logout, OperationType, handleFirestoreError } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query as firestoreQuery, orderBy, addDoc, updateDoc, doc, arrayUnion, arrayRemove, increment, limit, setDoc, serverTimestamp, where, getDoc } from 'firebase/firestore';
import { Trash2, Copy, Share2, LogOut, Shield, FileText, Info, Loader2 } from 'lucide-react';
import AdminPage from './components/AdminPage';
import ProfileEditView from './components/settings/ProfileEditView';
import PasswordChangeView from './components/settings/PasswordChangeView';
import EmailChangeView from './components/settings/EmailChangeView';
import AnnouncementsView from './components/settings/AnnouncementsView';
import TermsOfServiceView from './components/settings/TermsOfServiceView';
import PrivacyPolicyView from './components/settings/PrivacyPolicyView';
import FaqView from './components/FaqView';
import PetRegistrationFlow from './components/PetRegistrationFlow';
import ConfirmationDialog from './components/ConfirmationDialog';
import LandingPage from './components/LandingPage';
import CheckoutFlow from './components/CheckoutFlow';

// Sub-components will be defined here or imported
// For brevity in this large rebuild, I'll define some main views within App or as local components

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  if (currentPath === '/admin') {
    return <AdminPage />;
  }

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });
  
  // const [toast, setToast] = useState<string | null>(null);
  
  const [showPetRegistration, setShowPetRegistration] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | undefined>(undefined);
  
  const [user, setUser] = useState<User | null>(null);
  const [petType, setPetType] = useState<'dog' | 'cat'>('dog');

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user data from Firestore or use default
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        } else {
          // Create initial user data
          const newUser: User = {
            uid: firebaseUser.uid,
            username: firebaseUser.displayName || 'ユーザー',
            email: firebaseUser.email || '',
            avatar: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
            level: 'ブロンズ',
            points: 0,
            coupons: 0,
            pets: [],
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddPet = (pet: Pet) => {
    if (!user) return;
    setUser(prev => prev ? ({ ...prev, pets: [...prev.pets, pet] }) : null);
    setShowPetRegistration(false);
    // In a real app, also sync to Firestore here
    updateDoc(doc(db, 'users', user.uid), {
      pets: arrayUnion(pet)
    });
  };

  const handleDeletePet = (petId: string) => {
    if (!petId || !user) return;
    const petToDelete = (user.pets || []).find(p => p.id === petId);
    setUser(prev => prev ? ({ ...prev, pets: (prev.pets || []).filter(p => p.id !== petId) }) : null);
    if (petToDelete) {
      updateDoc(doc(db, 'users', user.uid), {
        pets: arrayRemove(petToDelete)
      });
    }
  };

  const handleUpdatePetPhoto = (petId: string, photoUrl: string) => {
    if (!user) return;
    const updatedPets = (user.pets || []).map(p => p.id === petId ? { ...p, image: photoUrl } : p);
    setUser(prev => prev ? ({
      ...prev,
      pets: updatedPets
    }) : null);
    updateDoc(doc(db, 'users', user.uid), {
      pets: updatedPets
    });
  };

  // Real-time Firestore sync
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    
    // Sync Products
    const productsQuery = firestoreQuery(collection(db, 'products'), orderBy('name', 'asc'));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          brand: data.brand || '',
          name: data.name || '',
          image: data.image || data.imageUrl || 'https://picsum.photos/seed/pet/400/400',
          originalPrice: Number(data.originalPrice) || 0,
          discountRate: Number(data.discountRate) || 0,
          price: typeof data.price === 'number' ? data.price : Number(String(data.price).replace(/,/g, '')) || 0,
          rating: Number(data.rating) || 0,
          reviewCount: Number(data.reviewCount) || 0,
          isDawnDelivery: !!data.isDawnDelivery,
          isTodayDelivery: !!data.isTodayDelivery,
          category: data.category || '',
          subCategory: data.subCategory || '',
          description: data.description || '',
          images: data.images || [],
          options: data.options || [],
          hidden: !!data.hidden
        };
      }).filter(p => !p.hidden) as Product[];
      setProducts(productsData);
      setIsLoading(false);
    }, (error) => {
      setIsLoading(false);
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    // Sync Posts
    const postsQuery = firestoreQuery(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          content: data.content || data.caption || '',
          images: data.images || (data.image ? [data.image] : []),
          comments: Array.isArray(data.comments) ? data.comments.length : (data.comments || 0),
          commentsList: Array.isArray(data.comments) ? data.comments : (data.commentsList || []),
          petInfo: data.petInfo || (data.animalType ? `${data.animalType}` : ''),
          category: data.category || 'daily',
          isLiked: user ? data.likedBy?.includes(user.uid) : false,
        };
      }) as CommunityPost[];
      setPosts(postsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'posts');
    });

    return () => {
      unsubscribeProducts();
      unsubscribePosts();
    };
  }, [user?.uid]);

  const addToCart = (product: Product, option?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id && item.selectedOption === option);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id && item.selectedOption === option 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { productId: product.id, quantity: 1, selectedOption: option }];
    });
    toast.success('カートに追加しました！ 🛒');
  };

  const navigateToProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage('productDetail');
  };

  const navigateToCategory = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage('productList');
  };

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-brand-peach-200">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="font-bold">データを読み込んでいます...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'home': 
        return (
          <HomeView 
            products={products.filter(p => !p.animalType || p.animalType === petType)} 
            onProductClick={navigateToProduct} 
            onCategoryClick={navigateToCategory} 
            onCartClick={() => setCurrentPage('cart')} 
            petType={petType}
            setPetType={setPetType}
          />
        );
      case 'category': 
        return (
          <CategoryView 
            products={products.filter(p => !p.animalType || p.animalType === petType)} 
            onProductClick={navigateToProduct} 
            petType={petType}
            setPetType={setPetType}
          />
        );
      case 'community': 
        return (
          <CommunityView 
            user={user!}
            posts={posts.filter(p => (p.animalType || p.petInfo || '').toLowerCase().includes(petType))} 
            setPosts={setPosts} 
            onNavigate={(page) => setCurrentPage(page)} 
            onPostClick={(post) => { setSelectedPost(post); setCurrentPage('postDetail'); }}
          />
        );
      case 'search': return <SearchView products={products} onProductClick={navigateToProduct} recentSearches={recentSearches} setRecentSearches={setRecentSearches} />;
      case 'mypage': return <MyPageView user={user!} onNavigate={(page) => setCurrentPage(page)} showPetRegistration={showPetRegistration} setShowPetRegistration={setShowPetRegistration} handleAddPet={handleAddPet} />;
      default: 
        return (
          <HomeView 
            products={products.filter(p => !p.animalType || p.animalType === petType)} 
            onProductClick={navigateToProduct} 
            onCategoryClick={navigateToCategory} 
            onCartClick={() => setCurrentPage('cart')} 
            petType={petType}
            setPetType={setPetType}
          />
        );
    }
  };

  const renderPage = () => {
    if (currentPage === 'landing') return <LandingPage onStart={() => setCurrentPage('home')} />;

    if (!user) {
      return <LoginView onLogin={signInWithGoogle} />;
    }

    if (currentPage === 'productList' && selectedCategory) {
      return <ProductListView products={products} category={selectedCategory} onBack={() => setCurrentPage(activeTab)} onProductClick={navigateToProduct} />;
    }
    if (currentPage === 'productDetail' && selectedProduct) {
      return (
        <ProductDetailView 
          product={selectedProduct} 
          onBack={() => {
            if (selectedCategory) {
              setCurrentPage('productList');
            } else {
              setCurrentPage(activeTab);
            }
          }} 
          onAddToCart={addToCart} 
          onBuy={() => setCurrentPage('checkoutFlow')}
          onCartClick={() => setCurrentPage('cart')}
          onSearchClick={() => setCurrentPage('home')}
        />
      );
    }
    if (currentPage === 'cart') {
      return <CartView products={products} cart={cart} setCart={setCart} onBack={() => setCurrentPage(activeTab)} onCheckout={() => setCurrentPage('checkoutFlow')} />;
    }
    if (currentPage === 'postWrite') {
      return (
        <PostWriteView 
          user={user!}
          onBack={() => setCurrentPage('community')} 
          onPost={async (newPost) => {
            if (!user) return;
            try {
              const postData = {
                uid: user.uid,
                username: user.username,
                userAvatar: user.avatar,
                caption: newPost.content,
                animalType: newPost.animalType || 'dog',
                category: newPost.category || 'daily',
                image: newPost.images?.[0] || '',
                likes: 0,
                likedBy: [],
                comments: [],
                tags: [],
                createdAt: new Date().toISOString()
              };
              await addDoc(collection(db, 'posts'), postData);
              setCurrentPage('community');
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, 'posts');
            }
          }} 
        />
      );
    }
    if (currentPage === 'postDetail' && selectedPost) {
      return (
        <PostDetailView 
          user={user!}
          post={selectedPost} 
          onBack={() => setCurrentPage('community')} 
          onLike={async (id) => {
            if (!user) return;
            try {
              const post = posts.find(p => p.id === id);
              if (!post) return;

              const isLiked = post.likedBy?.includes(user.uid);
              const postRef = doc(db, 'posts', id);

              await updateDoc(postRef, {
                likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
                likes: increment(isLiked ? -1 : 1)
              });
              
              // Local update for immediate feedback
              setSelectedPost(prev => prev && prev.id === id ? {
                ...prev,
                isLiked: !isLiked,
                likes: prev.likes + (isLiked ? -1 : 1),
                likedBy: isLiked ? prev.likedBy?.filter(uid => uid !== user.uid) : [...(prev.likedBy || []), user.uid]
              } : prev);
            } catch (error) {
              handleFirestoreError(error, OperationType.UPDATE, `posts/${id}`);
            }
          }}
          onComment={async (id, comment: PostComment) => {
            try {
              const postRef = doc(db, 'posts', id);
              await updateDoc(postRef, {
                comments: arrayUnion({
                  id: comment.id,
                  uid: user!.uid,
                  username: user!.username,
                  userAvatar: user!.avatar,
                  content: comment.content,
                  createdAt: comment.createdAt
                })
              });
              
              // Local update for immediate feedback
              setSelectedPost(prev => prev && prev.id === id ? {
                ...prev,
                comments: (typeof prev.comments === 'number' ? prev.comments : prev.comments.length) + 1,
                commentsList: [comment, ...(prev.commentsList || [])]
              } : prev);
            } catch (error) {
              handleFirestoreError(error, OperationType.UPDATE, `posts/${id}`);
            }
          }}
        />
      );
    }
    
    // MyPage Sub-screens
    if (currentPage === 'paymentMethods') return <PaymentMethodsView onBack={() => setCurrentPage('mypage')} />;
    if (currentPage === 'friendInvite') return <FriendInviteView onBack={() => setCurrentPage('mypage')} />;
    if (currentPage === 'myReviews') return <MyReviewsView products={products} onBack={() => setCurrentPage('mypage')} />;
    if (currentPage === 'orderHistory') return <OrderHistoryView products={products} onBack={() => setCurrentPage('mypage')} />;
    if (currentPage === 'shippingAddress') return <ShippingAddressView onBack={() => setCurrentPage('mypage')} />;
    if (currentPage === 'notificationSettings') return <NotificationSettingsView onBack={() => setCurrentPage('mypage')} />;
    if (currentPage === 'petProfile') return <PetProfileView user={user!} onBack={() => setCurrentPage('mypage')} showPetRegistration={showPetRegistration} setShowPetRegistration={setShowPetRegistration} handleAddPet={handleAddPet} handleDeletePet={handleDeletePet} handleUpdatePetPhoto={handleUpdatePetPhoto} setEditingPet={setEditingPet} editingPet={editingPet} />;
    if (currentPage === 'points') return <PointsView user={user!} onBack={() => setCurrentPage('mypage')} />;
    if (currentPage === 'coupons') return <CouponsView user={user!} onBack={() => setCurrentPage('mypage')} />;
    if (currentPage === 'checkoutFlow') return (
      <CheckoutFlow 
        cart={cart} 
        setCart={setCart} 
        products={products} 
        onBack={() => setCurrentPage('mypage')} 
      />
    );
    if (currentPage === 'settings') return <SettingsView onBack={() => setCurrentPage('mypage')} onNavigate={(page) => setCurrentPage(page)} />;
    if (currentPage === 'profileEdit') return <ProfileEditView user={user!} onBack={() => setCurrentPage('settings')} />;
    if (currentPage === 'passwordChange') return <PasswordChangeView onBack={() => setCurrentPage('settings')} />;
    if (currentPage === 'emailChange') return <EmailChangeView onBack={() => setCurrentPage('settings')} />;
    if (currentPage === 'announcements') return <AnnouncementsView onBack={() => setCurrentPage('settings')} />;
    if (currentPage === 'termsOfService') return <TermsOfServiceView onBack={() => setCurrentPage('settings')} />;
    if (currentPage === 'privacyPolicy') return <PrivacyPolicyView onBack={() => setCurrentPage('settings')} />;
    if (currentPage === 'faq') return <FaqView onBack={() => setCurrentPage('mypage')} />;

    return (
      <div className="pb-20">
        {renderTabContent()}
        {currentPage !== 'landing' && <BottomTab activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setCurrentPage(tab); }} />}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-brand-peach-50 max-w-md mx-auto relative shadow-2xl overflow-y-auto overflow-x-hidden">
      <Toaster position="top-center" richColors />
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage + activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// --- Sub-Views ---

function HomeView({ products, onProductClick, onCategoryClick, onCartClick, petType, setPetType }: { products: Product[], onProductClick: (p: Product) => void, onCategoryClick: (c: string) => void, onCartClick: () => void, petType: 'dog' | 'cat', setPetType: (type: 'dog' | 'cat') => void }) {
  const [bannerIndex, setBannerIndex] = useState(0);
  const banners = [
    { title: '初回購入100円セール! 🎁', sub: '今すぐ登録して人気フードを100円でゲット', color: 'peach-gradient' },
    { title: '週末限定 50% OFF! 🦴', sub: '人気のおやつが半額', color: 'bg-gradient-to-br from-brand-peach-200 to-brand-peach-400' },
    { title: '春のお散歩フェア 🎾', sub: 'ハーネス、リード最大30%OFF', color: 'bg-gradient-to-br from-brand-mint to-brand-mint/80' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between sticky top-0 bg-white z-50 border-b border-brand-peach-50">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-brand-peach-100 tracking-tighter italic">PetMog</h1>
          
          {/* Pet Type Toggle */}
          <div className="flex bg-brand-peach-50 p-1 rounded-full border border-brand-peach-100/20">
            <button 
              onClick={() => setPetType('dog')}
              className={`px-4 py-1 rounded-full text-[10px] font-black transition-all ${petType === 'dog' ? 'bg-brand-peach-100 text-white shadow-sm' : 'text-brand-peach-200'}`}
            >
              わんちゃん
            </button>
            <button 
              onClick={() => setPetType('cat')}
              className={`px-4 py-1 rounded-full text-[10px] font-black transition-all ${petType === 'cat' ? 'bg-brand-peach-100 text-white shadow-sm' : 'text-brand-peach-200'}`}
            >
              ねこ
            </button>
          </div>
        </div>
        
        <div className="flex gap-4 text-brand-peach-800">
          <Bell size={24} />
          <ShoppingCart size={24} className="cursor-pointer" onClick={onCartClick} />
        </div>
      </header>

      {/* Banner */}
      <div className="px-4 py-4">
        <div className={`${banners[bannerIndex].color} rounded-3xl p-6 text-white relative overflow-hidden h-44 flex flex-col justify-center transition-all duration-500`}>
          <motion.div
            key={bannerIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-black mb-1">{banners[bannerIndex].title}</h2>
            <p className="text-sm opacity-90">{banners[bannerIndex].sub}</p>
          </motion.div>
          <div className="absolute right-[-20px] bottom-[-20px] text-8xl opacity-20 rotate-12">🐶</div>
          
          <div className="absolute bottom-4 left-6 flex gap-1.5">
            {banners.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i === bannerIndex ? 'w-4 bg-white' : 'w-1 bg-white/40'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Category Icons */}
      <div className="px-4 grid grid-cols-3 gap-4 mb-8">
        {['フード', 'おやつ', '用品'].map(cat => (
          <div key={cat} className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => onCategoryClick(cat)}>
            <div className="w-16 h-16 bg-brand-peach-100/10 rounded-2xl flex items-center justify-center text-2xl hover:scale-110 transition-transform">
              {cat === 'フード' ? '🍚' : cat === 'おやつ' ? '🦴' : '🎾'}
            </div>
            <span className="text-sm font-bold text-brand-peach-800">{cat}</span>
          </div>
        ))}
      </div>

      {/* Today's Deal */}
      <section className="px-4 mb-8">
        <div className="bg-brand-peach-100/10 rounded-[2.5rem] p-6 border border-brand-peach-100/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-brand-peach-100">今日の特売 ⏰</h2>
            <span className="text-xs font-bold text-brand-peach-100 bg-white px-3 py-1.5 rounded-full shadow-sm">残り 08:24:12</span>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {products.slice(4, 8).map(product => (
              <div key={product.id} className="min-w-[150px] bg-white rounded-3xl p-3 shadow-sm hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => onProductClick(product)}>
                <div className="relative mb-2">
                  <img src={product.image} alt={product.name} className="w-full aspect-square object-cover rounded-2xl" />
                  <span className="absolute top-2 left-2 bg-brand-peach-100 text-white text-[8px] font-black px-2 py-0.5 rounded-full">特売</span>
                </div>
                <p className="text-xs font-bold text-brand-peach-100">{product.discountRate}% OFF</p>
                <p className="text-sm font-black">{(product.price ?? 0).toLocaleString()}円</p>
                <p className="text-[10px] text-brand-peach-200 line-through">{(product.originalPrice ?? 0).toLocaleString()}円</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Section */}
      <section className="px-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-brand-peach-800">人気急上昇アイテム 🔥</h2>
          <ChevronRight size={20} className="text-brand-peach-200" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {products.slice(0, 4).map(product => (
            <ProductCard key={product.id} product={product} onClick={() => onProductClick(product)} />
          ))}
        </div>
      </section>
    </div>
  );
}

function CategoryView({ products, onProductClick, petType, setPetType }: { products: Product[], onProductClick: (p: Product) => void, petType: 'dog' | 'cat', setPetType: (type: 'dog' | 'cat') => void }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('フード');
  const categories = ['フード', 'おやつ', '用品', '医薬品', '砂/パッド', 'おもちゃ'];

  return (
    <div className="bg-white min-h-screen">
      <header className="px-4 py-4 border-b border-brand-peach-50 sticky top-0 bg-white z-50">
        <div className="flex gap-4">
          {(['dog', 'cat'] as const).map(type => (
            <button 
              key={type}
              onClick={() => setPetType(type)}
              className={`text-lg font-black pb-2 px-2 transition-all ${petType === type ? 'text-brand-peach-100 border-b-4 border-brand-peach-100' : 'text-brand-peach-200'}`}
            >
              {type === 'dog' ? 'ワンちゃん' : 'ネコちゃん'}
            </button>
          ))}
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-24 bg-brand-peach-50 min-h-screen">
          {categories.map(cat => (
            <div 
              key={cat} 
              className={`py-4 px-2 text-center text-sm font-bold border-b border-brand-peach-100/20 bg-white cursor-pointer hover:bg-brand-peach-50 ${selectedCategory === cat ? 'text-brand-peach-100' : 'text-brand-peach-600'}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </div>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 p-4 grid grid-cols-1 gap-4">
          {products.filter(p => p.category === selectedCategory).map(product => (
            <div key={product.id} className="flex gap-4 items-center bg-white p-2 rounded-xl border border-brand-peach-50 cursor-pointer shadow-sm" onClick={() => onProductClick(product)}>
              <img src={product.image} alt={product.name} className="w-20 h-20 object-cover rounded-lg" />
              <div>
                <p className="text-[10px] text-brand-peach-400 font-bold">{product.brand}</p>
                <p className="text-sm font-bold text-brand-peach-800 line-clamp-1">{product.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-brand-peach-100 font-black">{product.discountRate}%</span>
                  <span className="text-sm font-black text-brand-peach-800">{(product.price ?? 0).toLocaleString()}円</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductListView({ products, category, onBack, onProductClick }: { products: Product[], category: string, onBack: () => void, onProductClick: (p: Product) => void }) {
  const filteredProducts = products.filter(p => p.category === category || p.category === 'フード');

  return (
    <div className="bg-white min-h-screen">
      <header className="px-4 py-4 flex items-center gap-4 sticky top-0 bg-white z-50 border-b border-brand-peach-50">
        <button onClick={onBack} className="text-brand-peach-800"><ArrowLeft size={24} /></button>
        <h2 className="text-lg font-black text-brand-peach-800">{category}</h2>
        <div className="flex-1" />
        <Filter size={20} className="text-brand-peach-200" />
      </header>

      <div className="p-4 grid grid-cols-2 gap-4">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} onClick={() => onProductClick(product)} />
        ))}
      </div>
    </div>
  );
}

function CommunityView({ user, posts, setPosts, onNavigate, onPostClick }: { user: User, posts: CommunityPost[], setPosts: any, onNavigate: (page: Page) => void, onPostClick: (post: CommunityPost) => void }) {
  const categories = ['日常', '悩み相談', '獣医師相談', '飼育のコツ'];
  const [activeCat, setActiveCat] = useState('日常');
  const [activePostIdForComments, setActivePostIdForComments] = useState<string | null>(null);

  const activePostForComments = posts.find(p => p.id === activePostIdForComments) || null;

  const filteredPosts = posts.filter(post => {
    const cat = post.category || 'daily';
    return (
      (activeCat === '日常' && cat === 'daily') || 
      (activeCat === '悩み相談' && cat === 'concern') || 
      (activeCat === '獣医師相談' && cat === 'vet') || 
      (activeCat === '飼育のコツ' && cat === 'tip') ||
      cat === activeCat
    );
  });

  const handleLike = async (id: string) => {
    try {
      const post = posts.find(p => p.id === id);
      if (!post) return;

      const isLiked = post.likedBy?.includes(user.uid);
      const postRef = doc(db, 'posts', id);

      await updateDoc(postRef, {
        likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
        likes: increment(isLiked ? -1 : 1)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${id}`);
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    try {
      const commentId = Math.random().toString(36).substr(2, 9);
      const postRef = doc(db, 'posts', postId);
      
      await updateDoc(postRef, {
        comments: arrayUnion({
          id: commentId,
          uid: user.uid,
          username: user.username,
          userAvatar: user.avatar,
          content,
          createdAt: new Date().toISOString()
        })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    }
  };

  return (
    <div className="bg-brand-peach-50 min-h-screen pb-24">
      <header className="bg-white px-4 py-4 sticky top-0 z-50 border-b border-brand-peach-50">
        <h2 className="text-xl font-black mb-4 text-brand-peach-800">コミュニティ 🐾</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${activeCat === cat ? 'bg-brand-peach-100 text-white shadow-lg shadow-brand-peach-100/20' : 'bg-brand-peach-50 text-brand-peach-400'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <div key={post.id} className="bg-white rounded-3xl p-5 card-shadow border border-brand-peach-100/10">
              <div onClick={() => onPostClick(post)} className="cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img src={post.userAvatar} alt={post.username} className="w-10 h-10 rounded-full border border-brand-peach-50" />
                    <div>
                      <p className="text-sm font-black text-brand-peach-800">{post.username}</p>
                      <p className="text-[10px] text-brand-peach-400 font-bold">{post.petInfo}</p>
                    </div>
                  </div>
                  {post.hasVetAnswer && (
                    <span className="bg-brand-mint/10 text-brand-mint text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1">
                      <Check size={10} /> 獣医師の回答あり
                    </span>
                  )}
                </div>
                <p className="text-sm text-brand-peach-800 mb-4 leading-relaxed font-medium">{post.content || post.caption}</p>
                {((post.images && post.images.length > 0) || post.image) && (
                  <div className="relative mb-4">
                    <img src={post.images?.[0] || post.image} alt="Post" className="w-full aspect-video object-cover rounded-2xl" />
                    {post.images && post.images.length > 1 && (
                      <span className="absolute bottom-3 right-3 bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm">
                        +{post.images.length - 1}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-brand-peach-200 pt-2 border-t border-brand-peach-50">
                <button 
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1 transition-colors ${post.isLiked ? 'text-brand-rose' : 'text-brand-peach-200'}`}
                >
                  <Heart size={18} fill={post.isLiked ? 'currentColor' : 'none'} />
                  <span className="text-xs font-bold">{post.likes}</span>
                </button>
                <button 
                  onClick={() => setActivePostIdForComments(post.id)}
                  className="flex items-center gap-1 hover:text-brand-peach-100 transition-colors"
                >
                  <MessageCircle size={18} />
                  <span className="text-xs font-bold">{post.comments}</span>
                </button>
                <div className="flex-1" />
                <span className="text-[10px] font-bold text-brand-peach-200">
                  {new Date(post.createdAt).toLocaleDateString() === new Date().toLocaleDateString() ? '今日' : '以前'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl">
            <p className="text-brand-peach-200 font-bold">まだ投稿がありません</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => onNavigate('postWrite')}
        className="fixed bottom-24 right-6 w-14 h-14 peach-gradient text-white rounded-full flex items-center justify-center shadow-xl shadow-brand-peach-100/30 z-40 hover:scale-110 transition-transform"
      >
        <Plus size={28} />
      </button>

      <AnimatePresence>
        {activePostIdForComments && activePostForComments && (
          <CommentDrawer 
            post={activePostForComments} 
            onClose={() => setActivePostIdForComments(null)} 
            onAddComment={(content) => handleAddComment(activePostIdForComments, content)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CommentDrawer({ post, onClose, onAddComment }: { post: CommunityPost, onClose: () => void, onAddComment: (content: string) => void }) {
  const [newComment, setNewComment] = useState('');

  const handleSend = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-[100] flex items-end justify-center max-w-md mx-auto"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-white w-full rounded-t-[2.5rem] max-h-[80vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-brand-peach-50 flex items-center justify-between">
          <div className="w-12 h-1 bg-brand-peach-100/20 rounded-full absolute top-2 left-1/2 -translate-x-1/2" />
          <h3 className="text-lg font-black text-brand-peach-800 mt-2">コメント ({post.comments})</h3>
          <button onClick={onClose} className="text-brand-peach-200"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
          {post.commentsList && post.commentsList.length > 0 ? (
            post.commentsList.map((comment: PostComment) => (
              <div key={comment.id} className="flex gap-3">
                <img src={comment.userAvatar} alt={comment.username} className="w-8 h-8 rounded-full border border-brand-peach-50" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-brand-peach-800">{comment.username}</span>
                    <span className="text-[10px] text-brand-peach-200 font-bold">2時間前</span>
                  </div>
                  <p className="text-sm text-brand-peach-600 leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-sm text-brand-peach-200 font-bold">最初のコメントを書いてみましょう！</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-brand-peach-50 bg-white pb-8">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="コメントを入力..." 
              className="flex-1 bg-brand-peach-50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-peach-100 text-brand-peach-800"
            />
            <button 
              onClick={handleSend}
              disabled={!newComment.trim()}
              className={`px-6 rounded-2xl font-black text-sm transition-all ${newComment.trim() ? 'bg-brand-peach-100 text-white' : 'bg-brand-peach-100/20 text-white'}`}
            >
              送信
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PostWriteView({ user, onBack, onPost }: { user: User, onBack: () => void, onPost: (post: CommunityPost) => void }) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'daily' | 'concern' | 'vet' | 'tip'>('daily');
  const categories = [
    { id: 'daily', label: '日常' },
    { id: 'concern', label: '悩み相談' },
    { id: 'vet', label: '獣医師相談' },
    { id: 'tip', label: '飼育のコツ' }
  ];

  const handlePost = () => {
    if (!content.trim()) return;

    const newPost: CommunityPost = {
      id: Math.random().toString(36).substr(2, 9),
      uid: user.uid,
      username: user.username,
      userAvatar: user.avatar || 'https://i.pravatar.cc/150?u=u1',
      petInfo: user.pets && user.pets.length > 0 ? `${user.pets[0].name} (${user.pets[0].breed}, ${new Date().getFullYear() - parseInt(user.pets[0].birthDate.split('-')[0])}歳)` : 'ペット未登録',
      category,
      content,
      images: ['https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=800'], // Dummy image
      likes: 0,
      comments: 0,
      hasVetAnswer: false,
      createdAt: new Date().toISOString(),
      isLiked: false,
      commentsList: []
    };

    onPost(newPost);
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <header className="px-4 py-4 flex items-center justify-between border-b border-brand-peach-50 sticky top-0 bg-white z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-brand-peach-800"><ArrowLeft size={24} /></button>
          <h2 className="text-lg font-black text-brand-peach-800">新規投稿</h2>
        </div>
        <button 
          onClick={handlePost}
          disabled={!content.trim()}
          className={`px-4 py-2 rounded-full text-sm font-black transition-all ${content.trim() ? 'bg-brand-peach-100 text-white' : 'bg-brand-peach-100/20 text-white'}`}
        >
          投稿する
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setCategory(cat.id as any)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${category === cat.id ? 'bg-brand-peach-100 text-white' : 'bg-brand-peach-50 text-brand-peach-400'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <textarea 
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="今日のペットの様子をシェアしよう..."
          className="w-full min-h-[200px] text-lg font-medium text-brand-peach-800 placeholder-brand-peach-200 focus:outline-none resize-none"
        />

        <div className="border-t border-brand-peach-50 pt-6">
          <button className="flex items-center gap-3 text-brand-peach-400 font-black hover:text-brand-peach-100 transition-colors">
            <div className="w-12 h-12 bg-brand-peach-50 rounded-2xl flex items-center justify-center">
              <Camera size={24} />
            </div>
            <span>写真を追加</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function PostDetailView({ user, post, onBack, onLike, onComment }: { user: User, post: CommunityPost, onBack: () => void, onLike: (id: string) => void, onComment: (id: string, comment: PostComment) => void }) {
  const [newComment, setNewComment] = useState('');

  const handleSendComment = () => {
    if (newComment.trim()) {
      const comment: PostComment = {
        id: Math.random().toString(36).substr(2, 9),
        username: user.username,
        userAvatar: user.avatar || 'https://i.pravatar.cc/150?u=u1',
        content: newComment,
        createdAt: new Date().toISOString()
      };
      onComment(post.id, comment);
      setNewComment('');
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col pb-24">
      <header className="px-4 py-4 flex items-center gap-4 border-b border-brand-peach-50 sticky top-0 bg-white z-50">
        <button onClick={onBack} className="text-brand-peach-800"><ArrowLeft size={24} /></button>
        <h2 className="text-lg font-black text-brand-peach-800">投稿</h2>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={post.userAvatar} alt={post.username} className="w-12 h-12 rounded-full border border-brand-peach-50" />
              <div>
                <p className="text-base font-black text-brand-peach-800">{post.username}</p>
                <p className="text-xs text-brand-peach-400 font-bold">{post.petInfo}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-brand-peach-200">2時間前</span>
          </div>

          <p className="text-base text-brand-peach-800 mb-6 leading-relaxed font-medium whitespace-pre-wrap">{post.content || post.caption}</p>

          {post.images && post.images.length > 0 ? (
            post.images.map((img, idx) => (
              <img key={idx} src={img} alt="Post" className="w-full rounded-3xl mb-4 shadow-sm" />
            ))
          ) : post.image ? (
            <img src={post.image} alt="Post" className="w-full rounded-3xl mb-4 shadow-sm" />
          ) : null}

          <div className="flex items-center gap-6 text-brand-peach-200 py-4 border-y border-brand-peach-50 mt-4">
            <button 
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-2 transition-colors ${post.isLiked ? 'text-brand-rose' : 'text-brand-peach-200'}`}
            >
              <Heart size={22} fill={post.isLiked ? 'currentColor' : 'none'} />
              <span className="text-sm font-black">{post.likes}</span>
            </button>
            <div className="flex items-center gap-2">
              <MessageCircle size={22} />
              <span className="text-sm font-black">{post.comments}</span>
            </div>
          </div>

          <div className="mt-8 space-y-8">
            <h3 className="font-black text-brand-peach-800">コメント ({post.comments})</h3>
            {post.commentsList && post.commentsList.length > 0 ? (
              post.commentsList.map(comment => (
                <div key={comment.id} className="flex gap-4">
                  <img src={comment.userAvatar} alt={comment.username} className="w-10 h-10 rounded-full border border-brand-peach-50" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-black text-brand-peach-800">{comment.username}</span>
                      <span className="text-[10px] text-brand-peach-200 font-bold">2時間前</span>
                    </div>
                    <p className="text-sm text-brand-peach-600 leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-sm text-brand-peach-200 font-bold">最初のコメントを書いてみましょう！</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-brand-peach-50 flex gap-2 max-w-md mx-auto z-50 pb-8">
        <input 
          type="text" 
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="コメントを入力..." 
          className="flex-1 bg-brand-peach-50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-peach-100 text-brand-peach-800"
        />
        <button 
          onClick={handleSendComment}
          disabled={!newComment.trim()}
          className={`px-6 rounded-2xl font-black text-sm transition-all ${newComment.trim() ? 'bg-brand-peach-100 text-white' : 'bg-brand-peach-100/20 text-white'}`}
        >
          送信
        </button>
      </div>
    </div>
  );
}

function SearchView({ products, onProductClick, recentSearches, setRecentSearches }: { products: Product[], onProductClick: (p: Product) => void, recentSearches: string[], setRecentSearches: (s: string[] | ((prev: string[]) => string[])) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [popularKeywords, setPopularKeywords] = useState<{keyword: string, count: number}[]>([]);
  const [searchResults, setSearchResults] = useState<Product[] | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isSearching, setIsSearching] = useState(false);

  const categories = [
    { id: 'all', label: 'すべて' },
    { id: 'フード', label: 'フード' },
    { id: 'おやつ', label: 'おやつ' },
    { id: 'おもちゃ', label: 'おもちゃ' },
    { id: '用品', label: '用品' },
  ];

  // Fetch popular keywords from Firestore
  useEffect(() => {
    const q = firestoreQuery(collection(db, 'searchKeywords'), orderBy('count', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const keywords = snapshot.docs.map(doc => ({
        keyword: doc.id,
        ...doc.data()
      })) as {keyword: string, count: number}[];
      setPopularKeywords(keywords);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'searchKeywords');
    });
    return () => unsubscribe();
  }, []);

  // Autocomplete logic
  useEffect(() => {
    if (searchTerm.length > 0 && !isSearching) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.brand.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm, products, isSearching]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchTerm(searchQuery);
    setSuggestions([]);

    // 1. Save to recent searches (localStorage)
    setRecentSearches(prev => {
      const updated = [searchQuery, ...prev.filter(s => s !== searchQuery)].slice(0, 10);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });

    // 2. Increment popular keyword in Firestore
    try {
      const keywordRef = doc(db, 'searchKeywords', searchQuery);
      await setDoc(keywordRef, {
        keyword: searchQuery,
        count: increment(1),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `searchKeywords/${searchQuery}`);
    }

    // 3. Filter products for results
    const results = products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(results);
  };

  const removeRecent = (s: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(item => item !== s);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const filteredResults = searchResults?.filter(p => 
    activeCategory === 'all' || p.category === activeCategory
  );

  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} 基準`;

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="p-4 border-b border-gray-100 sticky top-0 bg-white z-50">
        <div className="relative">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsSearching(false);
              if (e.target.value === '') setSearchResults(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
            placeholder="商品を検索してみてください" 
            className="w-full bg-brand-peach-50 rounded-full py-3 px-12 text-sm focus:outline-none focus:ring-2 focus:ring-brand-peach-100 transition-all text-brand-peach-800"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          {searchTerm && (
            <button onClick={() => { setSearchTerm(''); setSearchResults(null); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <X size={18} />
            </button>
          )}
        </div>
        
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 right-0 top-full bg-white shadow-2xl rounded-b-3xl p-4 z-50 border-t border-gray-50"
            >
              {suggestions.map(p => (
                <button 
                  key={p.id}
                  onClick={() => onProductClick(p)}
                  className="w-full flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="text-left">
                    <p className="text-xs text-gray-400 font-bold">{p.brand}</p>
                    <p className="text-sm font-bold text-gray-700 line-clamp-1">{p.name}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {searchResults ? (
        <div className="p-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${activeCategory === cat.id ? 'bg-brand-peach-100 text-white shadow-lg shadow-brand-peach-100/20' : 'bg-brand-peach-50 text-brand-peach-400'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-brand-peach-800">検索結果 <span className="text-brand-peach-100">{filteredResults?.length || 0}</span>件</p>
            <Filter size={18} className="text-brand-peach-200" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {filteredResults && filteredResults.length > 0 ? (
              filteredResults.map(product => (
                <div key={product.id} className="bg-white rounded-3xl overflow-hidden border border-brand-peach-50 shadow-sm group cursor-pointer" onClick={() => onProductClick(product)}>
                  <div className="relative aspect-square overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    {product.discountRate > 0 && (
                      <span className="absolute top-3 left-3 bg-brand-rose text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">
                        {product.discountRate}% OFF
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] text-brand-peach-400 font-bold mb-1">{product.brand}</p>
                    <p className="text-xs font-bold text-brand-peach-800 line-clamp-2 mb-2 h-8">{product.name}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-brand-peach-800">{(product.price ?? 0).toLocaleString()}円</p>
                      <div className="flex items-center gap-0.5">
                        <Star size={10} className="text-brand-peach-100 fill-brand-peach-100" />
                        <span className="text-[10px] font-bold text-brand-peach-200">{product.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-20">
                <p className="text-brand-peach-200 font-bold">検索結果がありません</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6">
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-brand-peach-800">最近の検索</h3>
              <button onClick={clearAllRecent} className="text-xs text-brand-peach-200 font-bold">すべて削除</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.length > 0 ? (
                recentSearches.map(s => (
                  <span key={s} className="bg-white text-brand-peach-600 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border border-brand-peach-100/20 shadow-sm">
                    <span className="cursor-pointer" onClick={() => handleSearch(s)}>{s}</span>
                    <button onClick={() => removeRecent(s)}><X size={12} className="text-brand-peach-200" /></button>
                  </span>
                ))
              ) : (
                <p className="text-xs text-brand-peach-200 font-bold">最近の検索はありません</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-6">
              <h3 className="font-black text-brand-peach-800">人気の検索ワード</h3>
              <span className="text-[10px] text-brand-peach-200 font-bold">{dateStr}</span>
            </div>
            <div className="grid grid-cols-1 gap-5">
              {popularKeywords.length > 0 ? (
                popularKeywords.map((item, i) => (
                  <div key={item.keyword} className="flex items-center justify-between group cursor-pointer" onClick={() => handleSearch(item.keyword)}>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-black w-5 ${i < 3 ? 'text-brand-peach-100' : 'text-brand-peach-200'}`}>{i + 1}</span>
                      <span className="text-sm font-bold text-brand-peach-600 group-hover:text-brand-peach-100 transition-colors">{item.keyword}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ChevronUp size={14} className="text-brand-rose" />
                      <span className="text-[10px] text-brand-peach-200 font-bold">{item.count}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-brand-peach-200 font-bold">データ収集中...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PointsView({ user, onBack }: { user: User, onBack: () => void }) {
  const pointsHistory = [
    { id: '1', title: '商品購入ポイント', amount: 320, type: 'earn', date: '2026.03.25' },
    { id: '2', title: 'コミュニティ初投稿', amount: 100, type: 'earn', date: '2026.03.20' },
    { id: '3', title: 'ポイント使用', amount: -500, type: 'use', date: '2026.03.15' },
    { id: '4', title: 'ログインボーナス', amount: 10, type: 'earn', date: '2026.03.10' },
  ];

  return (
    <div className="bg-white min-h-screen">
      <header className="px-4 py-4 flex items-center gap-4 sticky top-0 bg-white z-50 border-b border-brand-peach-50">
        <button onClick={onBack} className="text-brand-peach-800"><ArrowLeft size={24} /></button>
        <h2 className="text-lg font-black text-brand-peach-800">ポイント</h2>
      </header>

      <div className="p-6 bg-brand-peach-50/30 text-center border-b border-brand-peach-50">
        <p className="text-sm font-bold text-brand-peach-400 mb-1">現在のポイント</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-4xl font-black text-brand-peach-100">{user.points || 655}</span>
          <span className="text-lg font-bold text-brand-peach-800">P</span>
        </div>
        <button className="mt-6 w-full bg-brand-peach-100 text-white font-black py-4 rounded-2xl shadow-lg shadow-brand-peach-100/20">
          ポイントを使う
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-black text-brand-peach-800 mb-4">ポイント履歴</h3>
        <div className="space-y-4">
          {pointsHistory.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-brand-peach-50">
              <div>
                <p className="text-sm font-bold text-brand-peach-800">{item.title}</p>
                <p className="text-[10px] text-brand-peach-200 font-bold">{item.date}</p>
              </div>
              <p className={`font-black ${item.type === 'earn' ? 'text-brand-mint' : 'text-brand-rose'}`}>
                {item.type === 'earn' ? '+' : ''}{item.amount}P
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CouponsView({ user, onBack }: { user: User, onBack: () => void }) {
  const coupons = [
    { id: '1', title: '新規会員登録クーポン', discount: '500円割引', expiry: '2026.12.31', used: false },
    { id: '2', title: 'お誕生日おめでとう！', discount: '10%割引', expiry: '2026.04.30', used: false },
    { id: '3', title: 'お友達紹介特典', discount: '300円割引', expiry: '2026.06.15', used: false },
    { id: '4', title: 'ウェルカムバック', discount: '5%割引', expiry: '2026.01.01', used: true },
  ];

  return (
    <div className="bg-white min-h-screen">
      <header className="px-4 py-4 flex items-center gap-4 sticky top-0 bg-white z-50 border-b border-brand-peach-50">
        <button onClick={onBack} className="text-brand-peach-800"><ArrowLeft size={24} /></button>
        <h2 className="text-lg font-black text-brand-peach-800">クーポン</h2>
      </header>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between px-2 mb-2">
          <p className="text-sm font-bold text-brand-peach-400">保有クーポン <span className="text-brand-peach-100">{coupons.filter(c => !c.used).length}</span>枚</p>
        </div>

        {coupons.map(coupon => (
          <div key={coupon.id} className={`relative overflow-hidden rounded-3xl border ${coupon.used ? 'bg-gray-50 border-gray-200 grayscale' : 'bg-white border-brand-peach-100/20 shadow-sm'}`}>
            <div className="p-5 flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${coupon.used ? 'bg-gray-200 text-gray-500' : 'bg-brand-peach-100/10 text-brand-peach-100'}`}>
                    {coupon.used ? '使用済み' : '使用可能'}
                  </span>
                  <p className="text-[10px] text-brand-peach-200 font-bold">有効期限: {coupon.expiry}</p>
                </div>
                <h3 className="font-black text-brand-peach-800">{coupon.title}</h3>
                <p className="text-xl font-black text-brand-peach-100 mt-1">{coupon.discount}</p>
              </div>
              {!coupon.used && (
                <button className="bg-brand-peach-100 text-white text-xs font-black px-4 py-2 rounded-xl shadow-md shadow-brand-peach-100/20">
                  使用する
                </button>
              )}
            </div>
            {/* Decorative holes for coupon look */}
            <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-brand-peach-50 border-r border-brand-peach-100/20" />
            <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-brand-peach-50 border-l border-brand-peach-100/20" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MyPageView({ user, onNavigate, showPetRegistration, setShowPetRegistration, handleAddPet }: { user: User, onNavigate: (page: Page) => void, showPetRegistration: boolean, setShowPetRegistration: (show: boolean) => void, handleAddPet: (pet: Pet) => void }) {
  return (
    <div className="bg-brand-peach-50 min-h-screen">
      <header className="bg-white p-6 rounded-b-[3rem] card-shadow mb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <img src={user.avatar} alt={user.username} className="w-16 h-16 rounded-full border-2 border-brand-peach-100" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-brand-peach-800">{user.username}</h2>
                <span className="bg-brand-peach-100 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{user.level}</span>
              </div>
              <p className="text-sm text-brand-peach-400 font-bold">こんにちは、{user.username}さん！</p>
            </div>
          </div>
          <Settings size={24} className="text-brand-peach-200 cursor-pointer" onClick={() => onNavigate('settings')} />
        </div>

        <div className="grid grid-cols-4 gap-2 py-4 border-t border-brand-peach-50">
          <div className="text-center cursor-pointer" onClick={() => onNavigate('orderHistory')}>
            <p className="text-lg font-black text-brand-peach-100">0</p>
            <p className="text-[10px] text-brand-peach-400 font-bold uppercase">注文履歴</p>
          </div>
          <div className="text-center border-x border-brand-peach-50 cursor-pointer" onClick={() => onNavigate('myReviews')}>
            <p className="text-lg font-black text-brand-peach-100">0</p>
            <p className="text-[10px] text-brand-peach-400 font-bold uppercase">レビュー</p>
          </div>
          <div className="text-center border-r border-brand-peach-50 cursor-pointer" onClick={() => onNavigate('points')}>
            <p className="text-lg font-black text-brand-peach-100">{user.points || 655}</p>
            <p className="text-[10px] text-brand-peach-400 font-bold uppercase">ポイント</p>
          </div>
          <div className="text-center cursor-pointer" onClick={() => onNavigate('coupons')}>
            <p className="text-lg font-black text-brand-peach-100">{user.coupons || 3}</p>
            <p className="text-[10px] text-brand-peach-400 font-bold uppercase">クーポン</p>
          </div>
        </div>
      </header>

      {/* Pet Card */}
      <div className="px-4 mb-4">
        <div 
          className="bg-white rounded-3xl p-6 card-shadow border border-brand-peach-100/10 relative overflow-hidden cursor-pointer"
          onClick={() => onNavigate('petProfile')}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-brand-peach-800">うちの子情報 🐾</h3>
              <button onClick={() => setShowPetRegistration(true)}><Plus size={20} className="text-brand-peach-100" /></button>
            </div>
            {(user.pets || []).map(pet => (
              <div key={pet.id} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-peach-100/10 rounded-full flex items-center justify-center text-2xl">🐶</div>
                <div>
                  <p className="text-sm font-black text-brand-peach-800">{pet.name} ({pet.breed})</p>
                  <p className="text-xs text-brand-peach-400 font-bold">{new Date().getFullYear() - parseInt(pet.birthDate.split('-')[0])}歳 · {pet.weight}kg · {pet.gender === 'male' ? '男の子' : '女の子'}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute right-[-10px] bottom-[-10px] text-6xl opacity-5 rotate-12">🦴</div>
        </div>
      </div>

      {/* Community Prompt */}
      <div className="px-4 mb-4">
        <div 
          className="bg-brand-peach-100 text-white rounded-3xl p-5 flex items-center justify-between shadow-lg shadow-brand-peach-100/20 cursor-pointer"
          onClick={() => toast('準備中')}
        >
          <div>
            <p className="font-black text-sm">コミュニティに初投稿してみよう！</p>
            <p className="text-[10px] opacity-80">他の飼い主さんと交流してポイントをゲット</p>
          </div>
          <ChevronRight size={20} />
        </div>
      </div>

      {showPetRegistration && <PetRegistrationFlow onComplete={handleAddPet} onCancel={() => setShowPetRegistration(false)} />}

      {/* Menu List */}
      <div className="px-4 space-y-3 pb-8">
        {[
          { icon: <CreditCard size={20} />, label: '支払い方法管理', page: 'paymentMethods' as Page },
          { icon: <ShoppingCart size={20} />, label: '購入フロー (デモ)', page: 'checkoutFlow' as Page },
          { icon: <Gift size={20} />, label: '友達招待 500円クーポン', page: 'friendInvite' as Page },
          { icon: <Star size={20} />, label: 'レビューを書く', page: 'myReviews' as Page },
          { icon: <ShoppingCart size={20} />, label: '配送先管理', page: 'shippingAddress' as Page },
          { icon: <Bell size={20} />, label: '通知設定', page: 'notificationSettings' as Page },
          { icon: <Shield size={20} />, label: '管理者ページ (Admin)', onClick: () => window.location.href = '/admin' },
          { icon: <HelpCircle size={20} />, label: 'よくある質問 / カスタマーセンター', page: 'faq' as Page }
        ].map(menu => (
          <button 
            key={menu.label} 
            onClick={() => 'page' in menu ? onNavigate(menu.page as Page) : menu.onClick?.()}
            className="w-full bg-white p-5 rounded-2xl flex items-center justify-between card-shadow border border-brand-peach-100/5"
          >
            <div className="flex items-center gap-4">
              <div className="text-brand-peach-100">{menu.icon}</div>
              <span className="text-sm font-bold text-brand-peach-600">{menu.label}</span>
            </div>
            <ChevronRight size={18} className="text-brand-peach-200" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductDetailView({ product, onBack, onAddToCart, onBuy, onCartClick, onSearchClick }: { product: Product, onBack: () => void, onAddToCart: (p: Product, opt?: string) => void, onBuy: () => void, onCartClick: () => void, onSearchClick: () => void }) {
  const [selectedOpt, setSelectedOpt] = useState(product.options?.[0] || '');
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="bg-white min-h-screen pb-32">
      <header className="fixed top-0 left-0 right-0 p-4 z-50 flex justify-between items-center max-w-md mx-auto">
        <button onClick={onBack} className="w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-lg text-brand-peach-800">
          <ArrowLeft size={24} />
        </button>
        <div className="flex gap-2">
          <button 
            onClick={onSearchClick}
            className="w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-lg text-brand-peach-800"
          >
            <SearchIcon size={20} />
          </button>
          <button 
            onClick={onCartClick}
            className="w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-lg text-brand-peach-800"
          >
            <ShoppingCart size={20} />
          </button>
        </div>
      </header>
      
      <img src={product.image} alt={product.name} className="w-full aspect-square object-cover" />
      
      <div className="p-6">
        <p className="text-brand-peach-100 font-black mb-1">{product.brand}</p>
        <h2 className="text-xl font-black mb-4 leading-tight text-brand-peach-800">{product.name}</h2>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center text-yellow-400">
            <Star size={16} fill="currentColor" />
            <span className="text-sm font-black ml-1">{product.rating}</span>
          </div>
          <span className="text-xs text-brand-peach-200 font-bold">レビュー {(product.reviewCount ?? 0).toLocaleString()}件</span>
        </div>

        <div className="flex items-end gap-2 mb-6">
          <span className="text-2xl font-black text-brand-peach-100">{product.discountRate}%</span>
          <span className="text-2xl font-black text-brand-peach-800">{(product.price ?? 0).toLocaleString()}円</span>
          <span className="text-sm text-brand-peach-200 line-through mb-1">{(product.originalPrice ?? 0).toLocaleString()}円</span>
        </div>

        <div className="bg-brand-peach-100/10 rounded-2xl p-4 mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-brand-peach-100">クーポン適用価格</span>
            <span className="text-lg font-black text-brand-peach-100">{((product.price ?? 0) - 300).toLocaleString()}円</span>
          </div>
          <p className="text-[10px] text-brand-peach-100 font-bold">* 初回購入300円割引クーポン適用時</p>
        </div>

        {product.options && (
          <div className="mb-8">
            <h3 className="font-black mb-3 text-sm text-brand-peach-800">オプション選択</h3>
            <div className="flex flex-wrap gap-2">
              {product.options.map(opt => (
                <button 
                  key={opt}
                  onClick={() => setSelectedOpt(opt)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedOpt === opt ? 'bg-brand-peach-100 text-white border-brand-peach-100' : 'bg-white text-brand-peach-400 border-brand-peach-100/20'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-brand-peach-50 pb-2">
            <h3 className="font-black text-brand-peach-800">商品詳細情報</h3>
            <ChevronRight size={20} className="text-brand-peach-200" />
          </div>
          <p className="text-sm text-brand-peach-600 leading-relaxed">{product.description}</p>
          
          <div className="pt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-brand-peach-800">レビュー ({(product.reviewCount ?? 0).toLocaleString()})</h3>
              <span className="text-sm font-black text-brand-peach-100">すべて見る</span>
            </div>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="border-b border-brand-peach-50 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, j) => <Star key={j} size={10} fill={j < 4 ? "currentColor" : "none"} />)}
                    </div>
                    <span className="text-[10px] text-brand-peach-200 font-bold">飼い主*** · 2024.03.20</span>
                  </div>
                  <p className="text-xs text-brand-peach-600 leading-relaxed">うちの子がとても喜んで食べています！配送も早くて梱包も丁寧でした。また購入します。</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-brand-peach-50 flex gap-3 max-w-md mx-auto z-50">
        <button 
          onClick={() => setIsLiked(!isLiked)}
          className={`w-14 h-14 border rounded-2xl flex items-center justify-center transition-all ${isLiked ? 'border-brand-peach-100 text-brand-rose' : 'border-brand-peach-100/20 text-brand-peach-200'}`}
        >
          <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
        </button>
        <button 
          onClick={() => onAddToCart(product, selectedOpt)}
          className="flex-1 bg-white border-2 border-brand-peach-100 text-brand-peach-100 font-black rounded-2xl py-4"
        >
          カート
        </button>
        <button 
          onClick={onBuy}
          className="flex-1 bg-brand-peach-100 text-white font-black rounded-2xl py-4 shadow-lg shadow-brand-peach-100/20"
        >
          購入する
        </button>
      </div>
    </div>
  );
}

function CartView({ products, cart, setCart, onBack, onCheckout }: { products: Product[], cart: CartItem[], setCart: any, onBack: () => void, onCheckout: () => void }) {
  const cartProducts = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return null;
    return {
      ...product,
      quantity: item.quantity,
      selectedOption: item.selectedOption
    };
  }).filter(p => p !== null) as (Product & { quantity: number, selectedOption?: string })[];

  const totalAmount = cartProducts.reduce((acc, p) => acc + (p.price * p.quantity), 0);
  const deliveryFee = totalAmount > 3000 ? 0 : 300;

  const updateQuantity = (productId: string, option: string | undefined, delta: number) => {
    setCart((prev: CartItem[]) => prev.map(item => {
      if (item.productId === productId && item.selectedOption === option) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  return (
    <div className="bg-brand-peach-50 min-h-screen pb-32">
      <header className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-brand-peach-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-brand-peach-800"><ArrowLeft size={24} /></button>
          <h2 className="text-lg font-black text-brand-peach-800">ショッピングカート</h2>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {cartProducts.length > 0 ? (
          cartProducts.map(product => (
            <div key={`${product.id}-${product.selectedOption}`} className="bg-white rounded-3xl p-4 flex gap-4 card-shadow border border-brand-peach-100/5">
              <img src={product.image} alt={product.name} className="w-24 h-24 object-cover rounded-2xl" />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[10px] text-brand-peach-400 font-bold">{product.brand}</p>
                  <button onClick={() => setCart(cart.filter(c => !(c.productId === product.id && c.selectedOption === product.selectedOption)))}><X size={16} className="text-brand-peach-200" /></button>
                </div>
                <p className="text-sm font-bold mb-1 line-clamp-1 text-brand-peach-800">{product.name}</p>
                {product.selectedOption && <p className="text-[10px] text-brand-peach-400 mb-2">オプション: {product.selectedOption}</p>}
                <p className="text-sm font-black mb-3 text-brand-peach-800">{(product.price ?? 0).toLocaleString()}円</p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => updateQuantity(product.id, product.selectedOption, -1)}
                    className="w-8 h-8 border border-brand-peach-100/20 rounded-lg flex items-center justify-center text-brand-peach-400"
                  >-</button>
                  <span className="text-sm font-bold text-brand-peach-800">{product.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(product.id, product.selectedOption, 1)}
                    className="w-8 h-8 border border-brand-peach-100/20 rounded-lg flex items-center justify-center text-brand-peach-400"
                  >+</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl">
            <p className="text-brand-peach-200 font-bold">カートは空です</p>
          </div>
        )}
      </div>

      {cartProducts.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white p-6 rounded-t-[3rem] card-shadow max-w-md mx-auto z-50 border-t border-brand-peach-50">
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-brand-peach-400 font-bold">合計金額</span>
              <span className="font-black text-brand-peach-800">{(totalAmount ?? 0).toLocaleString()}円</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brand-peach-400 font-bold">送料</span>
              <span className="font-black text-brand-peach-800">{(deliveryFee ?? 0).toLocaleString()}円</span>
            </div>
            <div className="flex justify-between text-lg pt-2 border-t border-brand-peach-50">
              <span className="font-black text-brand-peach-800">お支払い予定金額</span>
              <span className="font-black text-brand-peach-100">{((totalAmount ?? 0) + (deliveryFee ?? 0)).toLocaleString()}円</span>
            </div>
          </div>
          <button 
            onClick={onCheckout}
            className="w-full bg-brand-peach-100 text-white font-black py-5 rounded-2xl shadow-xl shadow-brand-peach-100/20"
          >
            注文する
          </button>
        </div>
      )}
    </div>
  );
}

// --- MyPage Sub-Views ---

function PaymentMethodsView({ onBack }: { onBack: () => void }) {
  const cards = [
    { id: '1', type: 'Visa', last4: '4242', expiry: '12/26', isDefault: true },
    { id: '2', type: 'Mastercard', last4: '8888', expiry: '08/25', isDefault: false }
  ];

  return (
    <div className="bg-brand-peach-50 min-h-screen">
      <header className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-50 border-b border-brand-peach-50">
        <button onClick={onBack} className="text-brand-peach-800"><ArrowLeft size={24} /></button>
        <h2 className="text-lg font-black text-brand-peach-800">支払い方法管理</h2>
      </header>

      <div className="p-4 space-y-4">
        {cards.map(card => (
          <div key={card.id} className="bg-white rounded-3xl p-6 card-shadow border border-brand-peach-100/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-[10px] font-bold text-gray-400">
                {card.type}
              </div>
              <div>
                <p className="text-sm font-black text-brand-peach-800">**** **** **** {card.last4}</p>
                <p className="text-xs text-brand-peach-400 font-bold">有効期限 {card.expiry}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {card.isDefault && <span className="bg-brand-peach-100/10 text-brand-peach-100 text-[10px] font-black px-2 py-1 rounded-full">基本</span>}
              <Trash2 size={18} className="text-brand-peach-200" />
            </div>
          </div>
        ))}

        <button className="w-full bg-white border-2 border-dashed border-brand-peach-100 text-brand-peach-100 font-black py-4 rounded-3xl flex items-center justify-center gap-2">
          <Plus size={20} /> カードを追加
        </button>
      </div>
    </div>
  );
}

function FriendInviteView({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-brand-peach-50 min-h-screen">
      <header className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-50 border-b border-brand-peach-50">
        <button onClick={onBack} className="text-brand-peach-800"><ArrowLeft size={24} /></button>
        <h2 className="text-lg font-black text-brand-peach-800">友達招待</h2>
      </header>

      <div className="p-6 text-center">
        <div className="w-32 h-32 bg-brand-peach-100/10 rounded-full flex items-center justify-center text-6xl mx-auto mb-6">🎁</div>
        <h3 className="text-xl font-black text-brand-peach-800 mb-2">友達を招待して<br />500円クーポンをゲット！</h3>
        <p className="text-sm text-brand-peach-400 font-bold mb-8">友達が会員登録すると、あなたと友達の両方に<br />500円割引クーポンをプレゼントします。</p>

        <div className="bg-white rounded-3xl p-6 card-shadow border border-brand-peach-100/10 mb-8">
          <p className="text-xs text-brand-peach-200 font-bold mb-2 uppercase">あなたの招待コード</p>
          <div className="flex items-center justify-center gap-4">
            <span className="text-2xl font-black text-brand-peach-100 tracking-widest">PETMOG500</span>
            <button className="p-2 bg-brand-peach-50 rounded-full text-brand-peach-100"><Copy size={18} /></button>
          </div>
        </div>

        <div className="space-y-4">
          <button className="w-full peach-gradient text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-brand-peach-100/20">
            <Share2 size={20} /> 招待リンクをシェア
          </button>
        </div>

        <div className="mt-12 text-left space-y-6">
          <h4 className="font-black text-brand-peach-800 border-b border-brand-peach-50 pb-2">参加方法</h4>
          <div className="flex gap-4">
            <div className="w-6 h-6 bg-brand-peach-100 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">1</div>
            <p className="text-sm text-brand-peach-600 font-bold">招待リンクまたはコードを友達に送る</p>
          </div>
          <div className="flex gap-4">
            <div className="w-6 h-6 bg-brand-peach-100 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">2</div>
            <p className="text-sm text-brand-peach-600 font-bold">友達が招待コードを入力して会員登録</p>
          </div>
          <div className="flex gap-4">
            <div className="w-6 h-6 bg-brand-peach-100 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">3</div>
            <p className="text-sm text-brand-peach-600 font-bold">二人とも500円クーポンを即時獲得！</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyReviewsView({ products, onBack }: { products: Product[], onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'pending' | 'written'>('pending');
  
  const pendingReviews = products.slice(0, 2);
  const writtenReviews = products.slice(2, 4);

  return (
    <div className="bg-brand-peach-50 min-h-screen">
      <header className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-50 border-b border-brand-peach-50">
        <button onClick={onBack} className="text-brand-peach-800"><ArrowLeft size={24} /></button>
        <h2 className="text-lg font-black text-brand-peach-800">マイレビュー</h2>
      </header>

      <div className="bg-white flex border-b border-brand-peach-50">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-4 text-sm font-black transition-all ${activeTab === 'pending' ? 'text-brand-peach-100 border-b-2 border-brand-peach-100' : 'text-brand-peach-200'}`}
        >
          レビュー待ち ({pendingReviews.length})
        </button>
        <button 
          onClick={() => setActiveTab('written')}
          className={`flex-1 py-4 text-sm font-black transition-all ${activeTab === 'written' ? 'text-brand-peach-100 border-b-2 border-brand-peach-100' : 'text-brand-peach-200'}`}
        >
          作成済み ({writtenReviews.length})
        </button>
      </div>

      <div className="p-4 space-y-4">
        {(activeTab === 'pending' ? pendingReviews : writtenReviews).map(product => (
          <div key={product.id} className="bg-white rounded-3xl p-4 card-shadow border border-brand-peach-100/5">
            <div className="flex gap-4 mb-4">
              <img src={product.image} alt={product.name} className="w-20 h-20 object-cover rounded-2xl" />
              <div className="flex-1">
                <p className="text-[10px] text-brand-peach-400 font-bold">{product.brand}</p>
                <p className="text-sm font-bold text-brand-peach-800 line-clamp-2 mb-2">{product.name}</p>
                <p className="text-xs text-brand-peach-200 font-bold">購入日: 2024.03.15</p>
              </div>
            </div>
            
            {activeTab === 'pending' ? (
              <div className="pt-4 border-t border-brand-peach-50">
                <p className="text-xs font-black text-brand-peach-800 mb-3 text-center">商品の満足度を教えてください</p>
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} size={28} className="text-brand-peach-50 fill-brand-peach-50" />
                  ))}
                </div>
                <button className="w-full bg-brand-peach-100 text-white font-black py-3 rounded-xl text-sm">
                  レビューを書く
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-brand-peach-50">
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} size={14} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-xs text-brand-peach-600 leading-relaxed">とても満足しています！うちの子も喜んで食べています。またリピートしたいです。</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderHistoryView({ products, onBack }: { products: Product[], onBack: () => void }) {
  const orders = [
    { id: 'ORD-20240324-001', date: '2024.03.24', status: '配送中', products: products.length > 0 ? [products[0]] : [], totalPrice: 29750 },
    { id: 'ORD-20240310-042', date: '2024.03.10', status: '配送完了', products: products.length > 4 ? [products[4], products[5]] : [], totalPrice: 38140 }
  ];

  return (
    <div className="bg-brand-peach-50 min-h-screen">
      <header className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-50 border-b border-brand-peach-50">
        <button onClick={onBack} className="text-brand-peach-800"><ArrowLeft size={24} /></button>
        <h2 className="text-lg font-black text-brand-peach-800">注文履歴</h2>
      </header>

      <div className="p-4 space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-3xl p-5 card-shadow border border-brand-peach-100/5">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-brand-peach-50">
              <span className="text-xs font-black text-brand-peach-800">{order.date}</span>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full ${order.status === '配送中' ? 'bg-brand-mint/10 text-brand-mint' : 'bg-brand-peach-100/10 text-brand-peach-100'}`}>
                {order.status}
              </span>
            </div>
            
            <div className="space-y-4 mb-4">
              {order.products.map(product => (
                <div key={product.id} className="flex gap-4">
                  <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-xl" />
                  <div className="flex-1">
                    <p className="text-[10px] text-brand-peach-400 font-bold">{product.brand}</p>
                    <p className="text-sm font-bold text-brand-peach-800 line-clamp-1">{product.name}</p>
                    <p className="text-xs font-black text-brand-peach-800 mt-1">{(product.price ?? 0).toLocaleString()}円</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-brand-peach-50">
              <span className="text-xs text-brand-peach-400 font-bold">合計金額</span>
              <span className="text-lg font-black text-brand-peach-100">{(order.totalPrice ?? 0).toLocaleString()}円</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button onClick={() => toast('準備中')} className="bg-brand-peach-50 text-brand-peach-800 font-bold py-3 rounded-xl text-xs">配送追跡</button>
              <button onClick={() => toast('準備中')} className="bg-white border border-brand-peach-100 text-brand-peach-100 font-bold py-3 rounded-xl text-xs">注文詳細</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShippingAddressView({ onBack }: { onBack: () => void }) {
  const [addresses, setAddresses] = useState<Address[]>([
    { id: '1', name: '自宅', recipient: 'ペットラバー', phone: '090-1234-5678', zip: '150-0041', prefecture: '東京都', city: '渋谷区神南', address: '1-1-1 ペットマンション 101号', isDefault: true },
    { id: '2', name: '実家', recipient: '実家の母', phone: '080-8765-4321', zip: '530-0001', prefecture: '大阪府', city: '大阪市北区梅田', address: '2-2-2 実家 1F', isDefault: false }
  ]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSave = (address: Address) => {
    if (address.isDefault) {
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === address.id })));
    }
    if (editingAddress) {
      setAddresses(prev => prev.map(a => a.id === address.id ? address : a));
    } else {
      setAddresses(prev => [...prev, { ...address, id: Date.now().toString() }]);
    }
    setIsFormOpen(false);
    setEditingAddress(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const addr = addresses.find(a => a.id === deleteId);
    if (addr?.isDefault) {
      toast.error('基本の住所は削除できません。別の住所を基本に設定してから削除してください。');
    } else {
      setAddresses(prev => prev.filter(a => a.id !== deleteId));
    }
    setDeleteId(null);
  };

  const handleSetDefault = (id: string) => {
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
  };

  return (
    <div className="bg-brand-peach-50 min-h-screen">
      <header className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-50 border-b border-brand-peach-50">
        <button onClick={onBack} className="text-brand-peach-800"><ArrowLeft size={24} /></button>
        <h2 className="text-lg font-black text-brand-peach-800">配送先管理</h2>
      </header>

      <div className="p-4 space-y-4">
        {addresses.map(addr => (
          <div key={addr.id} className="bg-white rounded-3xl p-6 card-shadow border border-brand-peach-100/10">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="font-black text-brand-peach-800">{addr.name}</span>
                {addr.isDefault && <span className="bg-brand-peach-100/10 text-brand-peach-100 text-[10px] font-black px-2 py-0.5 rounded-full">基本</span>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setEditingAddress(addr); setIsFormOpen(true); }} className="text-brand-peach-200 text-xs font-bold">修正</button>
                <button onClick={() => setDeleteId(addr.id)}><Trash2 size={16} className="text-brand-peach-200" /></button>
              </div>
            </div>
            <p className="text-sm font-bold text-brand-peach-600 mb-1">{addr.recipient} · {addr.phone}</p>
            <p className="text-xs text-brand-peach-400 font-bold leading-relaxed">{addr.zip} {addr.prefecture}{addr.city}<br />{addr.address}</p>
            {!addr.isDefault && (
              <button onClick={() => handleSetDefault(addr.id)} className="mt-4 text-xs font-black text-brand-peach-100">基本に設定</button>
            )}
          </div>
        ))}

        <button onClick={() => { setEditingAddress(null); setIsFormOpen(true); }} className="w-full bg-white border-2 border-dashed border-brand-peach-100 text-brand-peach-100 font-black py-4 rounded-3xl flex items-center justify-center gap-2">
          <Plus size={20} /> 住所を追加
        </button>
      </div>

      {(isFormOpen || deleteId) && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
          {isFormOpen && (
            <AddressForm 
              address={editingAddress || undefined} 
              onSave={handleSave} 
              onCancel={() => { setIsFormOpen(false); setEditingAddress(null); }} 
            />
          )}
          {deleteId && (
            <ConfirmationDialog 
              title="住所の削除" 
              message="この住所を削除しますか？" 
              onConfirm={handleDelete} 
              onCancel={() => setDeleteId(null)} 
            />
          )}
        </div>
      )}
    </div>
  );
}

function AddressForm({ address, onSave, onCancel }: { address?: Address, onSave: (a: Address) => void, onCancel: () => void }) {
  const [form, setForm] = useState<Address>(address || { id: '', name: '', recipient: '', phone: '', zip: '', prefecture: '', city: '', address: '', isDefault: false });

  const handleZipChange = (zip: string) => {
    setForm(prev => ({ ...prev, zip, prefecture: '東京都', city: '渋谷区' })); // Dummy auto-complete
  };

  return (
    <div className="bg-white w-full rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
      <h3 className="text-lg font-black text-brand-peach-800 mb-6">{address ? '住所を修正' : '住所を追加'}</h3>
      <div className="space-y-4">
        {[
          { key: 'name', label: 'ラベル名' },
          { key: 'recipient', label: '受取人名' },
          { key: 'phone', label: '電話番号' },
          { key: 'zip', label: '郵便番号' },
          { key: 'prefecture', label: '都道府県' },
          { key: 'city', label: '市区町村' },
          { key: 'address', label: '番地・建物名' }
        ].map(field => (
          <div key={field.key}>
            <label className="block text-xs font-black text-brand-peach-200 mb-1">{field.label}</label>
            <input 
              type="text" 
              value={form[field.key as keyof Address]} 
              onChange={e => {
                if (field.key === 'zip') handleZipChange(e.target.value);
                else setForm(prev => ({ ...prev, [field.key]: e.target.value }));
              }}
              className="w-full bg-brand-peach-50 p-3 rounded-xl text-sm font-bold text-brand-peach-800"
            />
          </div>
        ))}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.isDefault} onChange={e => setForm(prev => ({ ...prev, isDefault: e.target.checked }))} />
          <span className="text-sm font-bold text-brand-peach-800">基本の住所に設定する</span>
        </label>
        <div className="flex gap-4 pt-4">
          <button onClick={onCancel} className="flex-1 bg-brand-peach-50 text-brand-peach-800 font-bold py-3 rounded-xl">キャンセル</button>
          <button onClick={() => onSave(form)} className="flex-1 bg-brand-peach-100 text-white font-black py-3 rounded-xl">保存する</button>
        </div>
      </div>
    </div>
  );
}

function NotificationSettingsView({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState({
    marketing: true,
    order: true,
    community: true,
    benefit: false
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-brand-peach-50 min-h-screen">
      <header className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-50 border-b border-brand-peach-50">
        <button onClick={onBack} className="text-brand-peach-800"><ArrowLeft size={24} /></button>
        <h2 className="text-lg font-black text-brand-peach-800">通知設定</h2>
      </header>

      <div className="p-4 space-y-4">
        {[
          { id: 'marketing', label: 'マーケティング通知', sub: 'イベント、セール、おすすめ情報の通知' },
          { id: 'order', label: '注文/配送通知', sub: '注文完了、配送状況、決済情報の通知' },
          { id: 'community', label: 'コミュニティ通知', sub: 'いいね、コメント、返信の通知' },
          { id: 'benefit', label: '特典/クーポン通知', sub: '有効期限が近いクーポンの通知' }
        ].map(item => (
          <div key={item.id} className="bg-white rounded-3xl p-6 flex items-center justify-between card-shadow border border-brand-peach-100/5">
            <div>
              <p className="text-sm font-black text-brand-peach-800 mb-1">{item.label}</p>
              <p className="text-[10px] text-brand-peach-400 font-bold">{item.sub}</p>
            </div>
            <button 
              onClick={() => toggle(item.id as keyof typeof settings)}
              className={`w-12 h-6 rounded-full relative transition-all ${settings[item.id as keyof typeof settings] ? 'bg-brand-peach-100' : 'bg-brand-peach-100/20'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings[item.id as keyof typeof settings] ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PetProfileView({ user, onBack, showPetRegistration, setShowPetRegistration, handleAddPet, handleDeletePet, handleUpdatePetPhoto, setEditingPet, editingPet }: { user: User, onBack: () => void, showPetRegistration: boolean, setShowPetRegistration: (show: boolean) => void, handleAddPet: (pet: Pet) => void, handleDeletePet: (petId: string) => void, handleUpdatePetPhoto: (petId: string, photoUrl: string) => void, setEditingPet: (pet: Pet | undefined) => void, editingPet: Pet | undefined }) {
  const [deletePetId, setDeletePetId] = useState<string | null>(null);

  return (
    <div className="bg-brand-peach-50 min-h-screen">
      <header className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-50 border-b border-brand-peach-50">
        <button onClick={onBack} className="text-brand-peach-800"><ArrowLeft size={24} /></button>
        <h2 className="text-lg font-black text-brand-peach-800">うちの子プロフィール</h2>
      </header>

      <div className="p-4 space-y-4">
        {(user.pets || []).map(pet => (
          <div key={pet.id} className="bg-white rounded-[2.5rem] p-8 card-shadow border border-brand-peach-100/10 text-center relative overflow-hidden">
            <div className="relative z-10">
              <div className="relative w-24 h-24 bg-brand-peach-50 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 border-4 border-white shadow-inner cursor-pointer" onClick={() => document.getElementById(`file-${pet.id}`)?.click()}>
                {pet.image ? (
                  <img src={pet.image} alt={pet.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  pet.type === 'dog' ? '🐶' : '🐱'
                )}
                <div className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow-md">
                  <Camera size={16} className="text-brand-peach-100" />
                </div>
                <input type="file" id={`file-${pet.id}`} accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      handleUpdatePetPhoto(pet.id, reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }} />
              </div>
              <h3 className="text-xl font-black text-brand-peach-800 mb-1">{pet.name}</h3>
              <p className="text-sm text-brand-peach-400 font-bold mb-8">{pet.breed}</p>
              
              <div className="grid grid-cols-3 gap-4 border-t border-brand-peach-50 pt-6">
                <div>
                  <p className="text-[10px] text-brand-peach-200 font-black uppercase mb-1">年齢</p>
                  <p className="text-sm font-black text-brand-peach-800">{new Date().getFullYear() - parseInt(pet.birthDate.split('-')[0])}歳</p>
                </div>
                <div className="border-x border-brand-peach-50">
                  <p className="text-[10px] text-brand-peach-200 font-black uppercase mb-1">体重</p>
                  <p className="text-sm font-black text-brand-peach-800">{pet.weight}kg</p>
                </div>
                <div>
                  <p className="text-[10px] text-brand-peach-200 font-black uppercase mb-1">性別</p>
                  <p className="text-sm font-black text-brand-peach-800">{pet.gender === 'male' ? '男の子' : '女の子'}</p>
                </div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <button onClick={() => { setEditingPet(pet); setShowPetRegistration(true); }} className="flex-1 bg-brand-peach-50 text-brand-peach-800 font-black py-4 rounded-2xl text-sm">
                  プロフィールを編集
                </button>
                <button onClick={() => setDeletePetId(pet.id)} className="flex-1 bg-white text-red-500 border border-red-300 font-black py-4 rounded-2xl text-sm">
                  削除
                </button>
              </div>
            </div>
            <div className="absolute right-[-20px] top-[-20px] text-8xl opacity-5 rotate-12">🦴</div>
          </div>
        ))}

        <button onClick={() => { setEditingPet(undefined); setShowPetRegistration(true); }} className="w-full bg-white border-2 border-dashed border-brand-peach-100 text-brand-peach-100 font-black py-6 rounded-[2.5rem] flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 bg-brand-peach-50 rounded-full flex items-center justify-center">
            <Plus size={24} />
          </div>
          <span className="text-sm">新しいペットを追加</span>
        </button>
      </div>

      {showPetRegistration && <PetRegistrationFlow initialData={editingPet} onComplete={(pet) => { handleAddPet(pet); setShowPetRegistration(false); setEditingPet(undefined); }} onCancel={() => { setShowPetRegistration(false); setEditingPet(undefined); }} />}
      
      <AnimatePresence>
        {deletePetId && (
          <ConfirmationDialog 
            title="ペットを削除" 
            message="本当に削除しますか？" 
            onConfirm={() => { 
              if (deletePetId) { 
                handleDeletePet(deletePetId); 
              }
              setDeletePetId(null); 
            }} 
            onCancel={() => setDeletePetId(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function LoginView({ onLogin }: { onLogin: () => Promise<any> }) {
  const handleLogin = async () => {
    try {
      await onLogin();
    } catch (error: any) {
      console.error('Login error in LoginView:', error.code || error);
      // Errors during login initiation
      if (error.code === 'auth/unauthorized-domain') {
        toast.error('このドメインはFirebase Consoleの承認済みドメインに登録が必要です。');
      } else if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
        toast.error('ログインに失敗しました。しばらくしてから再度お試しください。');
      }
    }
  };

  return (
    <div className="min-h-screen bg-brand-peach-50 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-[2.5rem] shadow-xl w-full max-w-sm text-center"
      >
        <div className="text-6xl mb-6">🐾</div>
        <h1 className="text-2xl font-black text-brand-peach-800 mb-2">PetMogへようこそ</h1>
        <p className="text-brand-peach-400 text-sm font-bold mb-8">ペットとの毎日をもっと楽しく、もっと豊かに。</p>
        
        <button 
          onClick={handleLogin}
          className="w-full bg-white border-2 border-brand-peach-100 text-brand-peach-800 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-peach-50 transition-colors mb-4"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Googleでログイン
        </button>

        <p className="text-[10px] text-brand-peach-200 font-bold mt-6">
          ログインすることで、<span className="underline">利用規約</span>および<span className="underline">プライバシーポリシー</span>に同意したものとみなされます。
        </p>
      </motion.div>
    </div>
  );
}

function SettingsView({ onBack, onNavigate }: { onBack: () => void, onNavigate: (page: Page) => void }) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);

  const sections = [
    {
      title: 'アカウント設定',
      items: [
        { icon: <UserIcon size={18} />, label: 'プロフィール編集', page: 'profileEdit' as Page },
        { icon: <Shield size={18} />, label: 'パスワード変更', page: 'passwordChange' as Page },
        { icon: <Bell size={18} />, label: 'メールアドレス変更', page: 'emailChange' as Page }
      ]
    },
    {
      title: 'サービス情報',
      items: [
        { icon: <Bell size={18} />, label: 'お知らせ', page: 'announcements' as Page },
        { icon: <FileText size={18} />, label: '利用規約', page: 'termsOfService' as Page },
        { icon: <Shield size={18} />, label: 'プライバシーポリシー', page: 'privacyPolicy' as Page },
        { icon: <Info size={18} />, label: 'アプリバージョン', extra: 'v1.2.4' }
      ]
    },
    {
      title: 'アカウント管理',
      items: [
        { icon: <LogOut size={18} />, label: 'ログアウト', color: 'text-brand-peach-400', onClick: () => setShowLogoutDialog(true) },
        { icon: <Trash2 size={18} />, label: '退会する', color: 'text-brand-rose', onClick: () => setShowWithdrawalDialog(true) }
      ]
    }
  ];

  return (
    <div className="bg-brand-peach-50 min-h-screen">
      <header className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-50 border-b border-brand-peach-50">
        <button onClick={onBack} className="text-brand-peach-800"><ArrowLeft size={24} /></button>
        <h2 className="text-lg font-black text-brand-peach-800">設定</h2>
      </header>

      <div className="pb-12">
        {sections.map((section, idx) => (
          <div key={section.title} className={idx !== 0 ? 'mt-6' : ''}>
            <h3 className="px-6 py-3 text-[10px] font-black text-brand-peach-200 uppercase tracking-widest">{section.title}</h3>
            <div className="bg-white border-y border-brand-peach-50">
              {section.items.map((item, i) => (
                <button 
                  key={item.label}
                  onClick={() => {
                    if ('page' in item) onNavigate(item.page as Page);
                    else if (item.onClick) item.onClick();
                    else toast('準備中');
                  }}
                  className={`w-full px-6 py-4 flex items-center justify-between ${i !== section.items.length - 1 ? 'border-b border-brand-peach-50' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={item.color || 'text-brand-peach-100'}>{item.icon}</div>
                    <span className={`text-sm font-bold ${item.color || 'text-brand-peach-800'}`}>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.extra && <span className="text-xs text-brand-peach-200 font-bold">{item.extra}</span>}
                    <ChevronRight size={16} className="text-brand-peach-200" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <AnimatePresence>
        {showLogoutDialog && (
          <ConfirmationDialog 
            title="ログアウト" 
            message="本当にログアウトしますか？" 
            onConfirm={async () => { 
              setShowLogoutDialog(false); 
              try {
                await logout();
                toast.success('ログアウトしました'); 
              } catch (error) {
                toast.error('ログアウトに失敗しました');
              }
            }} 
            onCancel={() => setShowLogoutDialog(false)} 
          />
        )}
        {showWithdrawalDialog && (
          <ConfirmationDialog 
            title="退会" 
            message="本当に退会しますか？この操作は取り消せません。" 
            onConfirm={() => { setShowWithdrawalDialog(false); toast.success('退会しました'); }} 
            onCancel={() => setShowWithdrawalDialog(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Common Components ---

function ProductCard({ product, onClick }: { product: Product, onClick: () => void, key?: string | number }) {
  return (
    <div className="bg-white rounded-[2rem] overflow-hidden card-shadow border border-brand-peach-100/5 cursor-pointer hover:scale-[1.02] transition-transform" onClick={onClick}>
      <div className="relative">
        <img src={product.image} alt={product.name} className="w-full aspect-square object-cover" />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isDawnDelivery && (
            <span className="bg-brand-peach-100 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm">早朝配送</span>
          )}
          {product.isTodayDelivery && (
            <span className="bg-brand-mint text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm">当日配送</span>
          )}
        </div>
      </div>
      <div className="p-4">
        <p className="text-[10px] text-brand-peach-400 font-bold mb-1">{product.brand}</p>
        <p className="text-xs font-bold text-brand-peach-800 line-clamp-2 mb-2 h-8 leading-relaxed">{product.name}</p>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-sm font-black text-brand-peach-100">{product.discountRate}%</span>
          <span className="text-sm font-black text-brand-peach-800">{(product.price ?? 0).toLocaleString()}円</span>
        </div>
        <div className="flex items-center gap-1">
          <Star size={10} className="text-yellow-400" fill="currentColor" />
          <span className="text-[10px] font-bold text-brand-peach-400">{product.rating}</span>
          <span className="text-[10px] text-brand-peach-200 font-bold">レビュー {(product.reviewCount ?? 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function BottomTab({ activeTab, onTabChange }: { activeTab: Tab, onTabChange: (tab: Tab) => void }) {
  const tabs: { id: Tab, icon: any, label: string }[] = [
    { id: 'home', icon: <HomeIcon size={24} />, label: 'ホーム' },
    { id: 'category', icon: <Menu size={24} />, label: 'カテゴリー' },
    { id: 'community', icon: <PawPrint size={24} />, label: 'コミュニティ' },
    { id: 'search', icon: <SearchIcon size={24} />, label: '検索' },
    { id: 'mypage', icon: <UserIcon size={24} />, label: 'マイページ' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-peach-50 px-6 py-3 flex justify-between items-center z-50 max-w-md mx-auto">
      {tabs.map(tab => (
        <button 
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-brand-peach-100 scale-110' : 'text-brand-peach-200'}`}
        >
          {tab.icon}
          <span className="text-[10px] font-black">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
