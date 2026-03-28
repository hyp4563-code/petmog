import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { auth, db, signInWithGoogle, logout, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy, writeBatch, where, addDoc, serverTimestamp, collectionGroup } from 'firebase/firestore';
import { 
  Trash2, Eye, EyeOff, ShieldBan, ShieldCheck, Search, Filter, 
  ArrowLeft, AlertTriangle, Users, FileText, LayoutDashboard, LogOut, Loader2,
  ShoppingBag, Plus, Edit, X, Camera, Star
} from 'lucide-react';

// TODO: Replace with your actual admin UID
// To find your UID, log in and look at the "Access Denied" screen, it will show your UID.
const ADMIN_UIDS = ['YOUR_ADMIN_UID_HERE'];

type AdminTab = 'dashboard' | 'products' | 'posts' | 'users' | 'reports' | 'reviews';

export default function AdminPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
        <ShieldBan size={64} className="text-red-500 mb-6" />
        <h1 className="text-2xl font-bold mb-2">管理者ページ</h1>
        <p className="text-gray-400 mb-8 text-center">管理者権限が必要です。ログインしてください。</p>
        <button 
          onClick={signInWithGoogle}
          className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors"
        >
          Googleでログイン
        </button>
        <button 
          onClick={() => window.location.href = '/'}
          className="mt-4 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={16} /> アプリに戻る
        </button>
      </div>
    );
  }

  if (!ADMIN_UIDS.includes(user.uid) && user.email !== 'hyp4563@gmail.com') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
        <ShieldBan size={64} className="text-red-500 mb-6" />
        <h1 className="text-2xl font-bold mb-2">アクセス権限がありません</h1>
        <p className="text-gray-400 mb-4 text-center">このページへのアクセス権限がありません。</p>
        
        <div className="bg-gray-800 p-4 rounded-xl mb-8 w-full max-w-md text-center">
          <p className="text-sm text-gray-400 mb-2">現在ログイン中のユーザーのUID:</p>
          <code className="bg-gray-900 px-3 py-2 rounded text-brand-mint font-mono text-sm break-all select-all">
            {user.uid}
          </code>
          <p className="text-xs text-gray-500 mt-4">
            このUIDをコピーして、AdminPage.tsxのADMIN_UIDS配列に追加してください。
          </p>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-gray-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={16} /> アプリに戻る
          </button>
          <button 
            onClick={logout}
            className="bg-red-500/10 text-red-500 px-6 py-3 rounded-xl font-bold hover:bg-red-500/20 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-800 border-b md:border-b-0 md:border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="text-brand-mint" /> PetMog Admin
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 flex md:flex-col overflow-x-auto md:overflow-x-visible">
          <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="ダッシュボード" />
          <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={<ShoppingBag size={20} />} label="商品管理" />
          <TabButton active={activeTab === 'posts'} onClick={() => setActiveTab('posts')} icon={<FileText size={20} />} label="コミュニティ投稿管理" />
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={20} />} label="ユーザー管理" />
          <TabButton active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} icon={<Star size={20} />} label="レビュー管理" />
          <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<AlertTriangle size={20} />} label="通報管理" />
        </nav>
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-4 px-2">
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="Admin" className="w-8 h-8 rounded-full" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user.displayName || 'Admin'}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors mb-2"
          >
            <ArrowLeft size={16} /> アプリに戻る
          </button>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <LogOut size={16} /> ログアウト
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'products' && <ProductsManagementTab />}
          {activeTab === 'posts' && <PostsManagementTab />}
          {activeTab === 'users' && <UsersManagementTab />}
          {activeTab === 'reviews' && <ReviewsManagementTab />}
          {activeTab === 'reports' && <ReportsTab />}
        </motion.div>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${
        active 
          ? 'bg-brand-mint/20 text-brand-mint font-bold' 
          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// --- Tabs ---

function DashboardTab() {
  const [stats, setStats] = useState({ products: 0, posts: 0, postsToday: 0, users: 0, reports: 0 });

  useEffect(() => {
    // Basic stats fetching
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      setStats(prev => ({ ...prev, products: snap.size }));
    });
    const unsubPosts = onSnapshot(collection(db, 'posts'), (snap) => {
      let reports = 0;
      let postsToday = 0;
      const today = new Date().toLocaleDateString();
      
      snap.forEach(doc => {
        const data = doc.data();
        if (data.reported) reports++;
        if (data.createdAt && new Date(data.createdAt).toLocaleDateString() === today) {
          postsToday++;
        }
      });
      setStats(prev => ({ ...prev, posts: snap.size, postsToday, reports }));
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, users: snap.size }));
    });
    return () => { unsubProducts(); unsubPosts(); unsubUsers(); };
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">ダッシュボード</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <StatCard title="総商品数" value={stats.products} icon={<ShoppingBag size={24} />} color="text-orange-400" bg="bg-orange-400/10" />
        <StatCard title="総投稿数" value={stats.posts} icon={<FileText size={24} />} color="text-blue-400" bg="bg-blue-400/10" />
        <StatCard title="本日の投稿" value={stats.postsToday} icon={<FileText size={24} />} color="text-purple-400" bg="bg-purple-400/10" />
        <StatCard title="総ユーザー数" value={stats.users} icon={<Users size={24} />} color="text-green-400" bg="bg-green-400/10" />
        <StatCard title="通報投稿数" value={stats.reports} icon={<AlertTriangle size={24} />} color="text-red-400" bg="bg-red-400/10" />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, bg }: { title: string, value: number, icon: React.ReactNode, color: string, bg: string }) {
  return (
    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function PostsManagementTab() {
  const [posts, setPosts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [animalFilter, setAnimalFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(data);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'posts'));
    return () => unsub();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchSearch = (post.caption || '').toLowerCase().includes(search.toLowerCase()) || 
                        (post.username || '').toLowerCase().includes(search.toLowerCase());
    const matchAnimal = animalFilter === 'all' || post.animalType === animalFilter;
    return matchSearch && matchAnimal;
  }).sort((a, b) => {
    if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
    if (sortBy === 'comments') return (b.comments?.length || b.comments || 0) - (a.comments?.length || a.comments || 0);
    return 0; // already sorted by latest from firestore
  });

  const toggleHidden = async (id: string, currentHidden: boolean) => {
    try {
      await updateDoc(doc(db, 'posts', id), { hidden: !currentHidden });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${id}`);
    }
  };

  const deletePost = async (id: string) => {
    if (!window.confirm('本当に削除しますか？')) return;
    try {
      await deleteDoc(doc(db, 'posts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${id}`);
    }
  };

  const bulkDelete = async () => {
    if (selectedPosts.length === 0) return;
    if (!window.confirm(`選択した${selectedPosts.length}件の投稿を削除しますか？`)) return;
    
    try {
      const batch = writeBatch(db);
      selectedPosts.forEach(id => {
        batch.delete(doc(db, 'posts', id));
      });
      await batch.commit();
      setSelectedPosts([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'posts (bulk)');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedPosts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">コミュニティ投稿管理</h2>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="キーワード検索..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-brand-mint text-white w-full md:w-48"
            />
          </div>
          <select 
            value={animalFilter} 
            onChange={e => setAnimalFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-mint text-white"
          >
            <option value="all">全動物</option>
            <option value="dog">犬</option>
            <option value="cat">猫</option>
            <option value="small">小動物</option>
          </select>
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-mint text-white"
          >
            <option value="latest">最新順</option>
            <option value="likes">いいね順</option>
            <option value="comments">コメント順</option>
          </select>
        </div>
      </div>

      {selectedPosts.length > 0 && (
        <div className="bg-gray-800 p-3 rounded-lg mb-4 flex items-center justify-between border border-gray-700">
          <span className="text-sm font-bold text-brand-mint">{selectedPosts.length}件選択中</span>
          <button 
            onClick={bulkDelete}
            className="bg-red-500/10 text-red-500 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-red-500/20 flex items-center gap-2"
          >
            <Trash2 size={16} /> 選択削除
          </button>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-900/50 text-gray-400">
              <tr>
                <th className="p-4 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedPosts.length === filteredPosts.length && filteredPosts.length > 0}
                    onChange={(e) => setSelectedPosts(e.target.checked ? filteredPosts.map(p => p.id) : [])}
                    className="rounded bg-gray-700 border-gray-600 text-brand-mint focus:ring-brand-mint focus:ring-offset-gray-800"
                  />
                </th>
                <th className="p-4">プレビュー</th>
                <th className="p-4">投稿者</th>
                <th className="p-4">内容</th>
                <th className="p-4">反応</th>
                <th className="p-4">投稿日</th>
                <th className="p-4">ステータス</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredPosts.map(post => (
                <tr key={post.id} className={`hover:bg-gray-700/50 transition-colors ${post.hidden ? 'opacity-50' : ''}`}>
                  <td className="p-4">
                    <input 
                      type="checkbox" 
                      checked={selectedPosts.includes(post.id)}
                      onChange={() => toggleSelect(post.id)}
                      className="rounded bg-gray-700 border-gray-600 text-brand-mint focus:ring-brand-mint focus:ring-offset-gray-800"
                    />
                  </td>
                  <td className="p-4">
                    <img src={post.image || post.images?.[0] || 'https://via.placeholder.com/50'} alt="Post" className="w-12 h-12 rounded-lg object-cover bg-gray-700" />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <img src={post.userAvatar || `https://ui-avatars.com/api/?name=${post.username}`} className="w-6 h-6 rounded-full" />
                      <span>{post.username || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="p-4 max-w-[200px] truncate">
                    {post.caption || post.content || '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-3 text-gray-400">
                      <span className="flex items-center gap-1"><span className="text-red-400">♥</span> {post.likes || 0}</span>
                      <span className="flex items-center gap-1">💬 {post.comments?.length || post.comments || 0}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400">
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-4">
                    {post.hidden ? (
                      <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-bold">非表示</span>
                    ) : (
                      <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs font-bold">公開</span>
                    )}
                    {post.reported && (
                      <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded text-xs font-bold ml-2">通報あり</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => alert(`投稿者: ${post.username}\n内容: ${post.caption || post.content || '内容なし'}\nいいね: ${post.likes || 0}\nコメント: ${post.comments?.length || post.comments || 0}`)}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors"
                        title="詳細を見る"
                      >
                        <FileText size={16} />
                      </button>
                      <button 
                        onClick={() => toggleHidden(post.id, !!post.hidden)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        title={post.hidden ? "表示する" : "非表示"}
                      >
                        {post.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button 
                        onClick={() => deletePost(post.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="削除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPosts.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    投稿がありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReviewsManagementTab() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [reviewToDelete, setReviewToDelete] = useState<{productId: string, reviewId: string} | null>(null);

  useEffect(() => {
    // Fetch products to map names
    const productsUnsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const productMap: Record<string, string> = {};
      snapshot.docs.forEach(doc => {
        productMap[doc.id] = doc.data().name;
      });
      setProducts(productMap);
    });

    // Fetch all reviews using collectionGroup
    const reviewsQuery = query(collectionGroup(db, 'reviews'), orderBy('createdAt', 'desc'));
    const reviewsUnsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
      const reviewsList = snapshot.docs.map(doc => ({
        id: doc.id,
        productId: doc.ref.parent.parent?.id,
        ...doc.data()
      }));
      setReviews(reviewsList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reviews');
      setLoading(false);
    });

    return () => {
      productsUnsubscribe();
      reviewsUnsubscribe();
    };
  }, []);

  const handleDelete = async () => {
    if (!reviewToDelete) return;
    try {
      await deleteDoc(doc(db, `products/${reviewToDelete.productId}/reviews/${reviewToDelete.reviewId}`));
      setReviewToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${reviewToDelete.productId}/reviews/${reviewToDelete.reviewId}`);
    }
  };

  const filteredReviews = ratingFilter === 'all' 
    ? reviews 
    : reviews.filter(r => r.rating === ratingFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-mint" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">レビュー管理</h2>
          <p className="text-gray-400 text-sm">
            全商品のレビューを管理します。 (全{reviews.length}件 / 表示中{filteredReviews.length}件)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2">
            <Filter size={16} className="text-gray-400" />
            <select 
              value={ratingFilter} 
              onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-transparent text-sm text-white focus:outline-none"
            >
              <option value="all">全ての評価</option>
              <option value="5">★5のみ</option>
              <option value="4">★4のみ</option>
              <option value="3">★3のみ</option>
              <option value="2">★2のみ</option>
              <option value="1">★1のみ</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800/50">
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">商品名</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">ユーザー</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">評価</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">コメント</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">投稿日時</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredReviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="p-4">
                    <div className="text-sm font-medium text-white">
                      {products[review.productId] || '不明な商品'}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">{review.productId}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-300">{review.userName || '匿名ユーザー'}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          fill={i < (review.rating || 0) ? "currentColor" : "none"} 
                          className={i < (review.rating || 0) ? "" : "text-gray-600"}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-gray-300 max-w-xs line-clamp-2" title={review.comment}>
                      {review.comment}
                    </p>
                  </td>
                  <td className="p-4 text-sm text-gray-400">
                    {review.createdAt ? new Date(review.createdAt).toLocaleString() : '不明'}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setReviewToDelete({productId: review.productId, reviewId: review.id})}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400"
                      title="削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredReviews.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    レビューが見つかりませんでした。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {reviewToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6"
          >
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-xl font-bold">レビューの削除</h3>
            </div>
            <p className="text-gray-300 mb-6">
              このレビューを削除してもよろしいですか？この操作は取り消せません。
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setReviewToDelete(null)}
                className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                キャンセル
              </button>
              <button 
                onClick={handleDelete}
                className="bg-red-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-600 transition-colors"
              >
                削除する
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function UsersManagementTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));

    const qPosts = query(collection(db, 'posts'));
    const unsubPosts = onSnapshot(qPosts, (snap) => {
      const data = snap.docs.map(doc => ({ uid: doc.data().uid }));
      setPosts(data);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'posts'));

    return () => { unsubUsers(); unsubPosts(); };
  }, []);

  const filteredUsers = users.filter(u => {
    const matchSearch = (u.username || '').toLowerCase().includes(search.toLowerCase()) || 
                        (u.email || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const toggleBan = async (id: string, currentBanned: boolean) => {
    try {
      await updateDoc(doc(db, 'users', id), { banned: !currentBanned });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  };

  const getPostCount = (uid: string) => {
    return posts.filter(p => p.uid === uid).length;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">ユーザー管理</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="名前・メールで検索..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-brand-mint text-white w-full md:w-64"
          />
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-900/50 text-gray-400">
              <tr>
                <th className="p-4">ユーザー</th>
                <th className="p-4">メール</th>
                <th className="p-4">登録日</th>
                <th className="p-4">投稿数</th>
                <th className="p-4">ステータス</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredUsers.map(user => (
                <tr key={user.id} className={`hover:bg-gray-700/50 transition-colors ${user.banned ? 'opacity-50' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.username || user.email}`} className="w-8 h-8 rounded-full bg-gray-700" />
                      <span className="font-bold">{user.username || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-300">{user.email || '-'}</td>
                  <td className="p-4 text-gray-400">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-4 text-gray-300 font-bold">
                    {getPostCount(user.id)}
                  </td>
                  <td className="p-4">
                    {user.banned ? (
                      <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded text-xs font-bold">停止中</span>
                    ) : (
                      <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs font-bold">アクティブ</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => toggleBan(user.id, !!user.banned)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ml-auto transition-colors ${
                        user.banned 
                          ? 'bg-gray-700 text-white hover:bg-gray-600' 
                          : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      }`}
                    >
                      {user.banned ? <ShieldCheck size={14} /> : <ShieldBan size={14} />}
                      {user.banned ? '停止解除' : '停止'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    ユーザーがいません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReportsTab() {
  const [reportedPosts, setReportedPosts] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'posts'), where('reported', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReportedPosts(data);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'posts (reported)'));
    return () => unsub();
  }, []);

  const dismissReport = async (id: string) => {
    try {
      await updateDoc(doc(db, 'posts', id), { reported: false });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${id}`);
    }
  };

  const deletePost = async (id: string) => {
    if (!window.confirm('本当に削除しますか？')) return;
    try {
      await deleteDoc(doc(db, 'posts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${id}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-6">通報管理</h2>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-900/50 text-gray-400">
              <tr>
                <th className="p-4">投稿プレビュー</th>
                <th className="p-4">投稿者</th>
                <th className="p-4">内容</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {reportedPosts.map(post => (
                <tr key={post.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="p-4">
                    <img src={post.image || post.images?.[0] || 'https://via.placeholder.com/50'} alt="Post" className="w-12 h-12 rounded-lg object-cover bg-gray-700" />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <img src={post.userAvatar || `https://ui-avatars.com/api/?name=${post.username}`} className="w-6 h-6 rounded-full" />
                      <span>{post.username || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="p-4 max-w-[300px] truncate text-gray-300">
                    {post.caption || post.content || '-'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => dismissReport(post.id)}
                        className="px-3 py-1.5 bg-gray-700 text-white rounded-lg text-xs font-bold hover:bg-gray-600 transition-colors"
                      >
                        通報解除
                      </button>
                      <button 
                        onClick={() => deletePost(post.id)}
                        className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={14} /> 削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {reportedPosts.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    通報された投稿はありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProductsManagementTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('全て');
  const [sortBy, setSortBy] = useState('latest');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'products'));
    return () => unsub();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchCat = categoryFilter === '全て' || p.category === categoryFilter;
    const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
                        (p.brand || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => {
    if (sortBy === 'priceLow') return Number((a.price || '0').toString().replace(/,/g, '')) - Number((b.price || '0').toString().replace(/,/g, ''));
    if (sortBy === 'priceHigh') return Number((b.price || '0').toString().replace(/,/g, '')) - Number((a.price || '0').toString().replace(/,/g, ''));
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    return 0; // 'latest' is default from firestore
  });

  const stats = {
    total: products.length,
    food: products.filter(p => !p.hidden && p.category === 'フード').length,
    snack: products.filter(p => !p.hidden && p.category === 'おやつ').length,
    supplies: products.filter(p => !p.hidden && p.category === '用品').length,
    hidden: products.filter(p => p.hidden).length,
  };

  const toggleHidden = async (id: string, currentHidden: boolean) => {
    try {
      await updateDoc(doc(db, 'products', id), { hidden: !currentHidden });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('本当にこの商品を削除しますか？')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">商品管理</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-brand-mint text-gray-900 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-mint/90 transition-colors"
        >
          <Plus size={18} /> ＋ 商品を追加
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard title="全商品" value={stats.total} icon={<ShoppingBag size={20} />} color="text-blue-400" bg="bg-blue-400/10" />
        <StatCard title="フード" value={stats.food} icon={<ShoppingBag size={20} />} color="text-orange-400" bg="bg-orange-400/10" />
        <StatCard title="おやつ" value={stats.snack} icon={<ShoppingBag size={20} />} color="text-yellow-400" bg="bg-yellow-400/10" />
        <StatCard title="用品" value={stats.supplies} icon={<ShoppingBag size={20} />} color="text-green-400" bg="bg-green-400/10" />
        <StatCard title="非表示" value={stats.hidden} icon={<EyeOff size={20} />} color="text-gray-400" bg="bg-gray-400/10" />
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="商品名・ブランドで検索..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-brand-mint text-white w-full"
          />
        </div>
        <select 
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-mint text-white"
        >
          <option value="全て">全カテゴリー</option>
          <option value="フード">フード</option>
          <option value="おやつ">おやつ</option>
          <option value="用品">用品</option>
        </select>
        <select 
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-mint text-white"
        >
          <option value="latest">最新順</option>
          <option value="priceLow">価格が低い順</option>
          <option value="priceHigh">価格が高い順</option>
          <option value="rating">評価順</option>
        </select>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-900/50 text-gray-400">
              <tr>
                <th className="p-4">商品情報</th>
                <th className="p-4">カテゴリー</th>
                <th className="p-4">価格</th>
                <th className="p-4">配送</th>
                <th className="p-4">評価/レビュー</th>
                <th className="p-4">ステータス</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredProducts.map(product => (
                <tr key={product.id} className={`hover:bg-gray-700/50 transition-colors ${product.hidden ? 'opacity-50' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={product.image || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-lg object-cover bg-gray-700" />
                      <div>
                        <p className="text-xs text-gray-400">{product.brand}</p>
                        <p className="font-bold truncate max-w-[200px]">{product.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-300">{product.category}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-brand-mint">{product.price}円</span>
                      {product.discountRate > 0 && (
                        <span className="text-xs text-gray-500 line-through">{product.originalPrice?.toLocaleString()}円</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {product.isDawnDelivery && <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold">早朝配送</span>}
                      {product.isTodayDelivery && <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-[10px] font-bold">当日配送</span>}
                    </div>
                  </td>
                  <td className="p-4 text-gray-300">
                    <span className="text-yellow-400 mr-1">★</span>
                    {product.rating?.toFixed(1) || '0.0'} ({product.reviewCount || 0})
                  </td>
                  <td className="p-4">
                    {product.hidden ? (
                      <span className="bg-gray-700 text-gray-400 px-2 py-1 rounded text-xs font-bold">非表示</span>
                    ) : (
                      <span className="bg-brand-mint/10 text-brand-mint px-2 py-1 rounded text-xs font-bold">表示中</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => toggleHidden(product.id, !!product.hidden)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400"
                        title={product.hidden ? "表示する" : "非表示"}
                      >
                        {product.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button 
                        onClick={() => {
                          setEditingProduct(product);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-blue-400"
                        title="編集"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400"
                        title="削除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    商品がありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modals */}
      {isAddModalOpen && <ProductModal onClose={() => setIsAddModalOpen(false)} />}
      {isEditModalOpen && editingProduct && (
        <ProductModal 
          product={editingProduct} 
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProduct(null);
          }} 
        />
      )}
    </div>
  );
}

function ProductModal({ product, onClose }: { product?: any, onClose: () => void }) {
  const isEdit = !!product;
  const [formData, setFormData] = useState({
    name: product?.name || '',
    brand: product?.brand || '',
    category: product?.category || 'フード',
    subCategory: product?.subCategory || '',
    originalPrice: product?.originalPrice || 0,
    discountRate: product?.discountRate || 0,
    description: product?.description || '',
    image: product?.image || '',
    isDawnDelivery: product?.isDawnDelivery || false,
    isTodayDelivery: product?.isTodayDelivery || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPrice = Math.floor(formData.originalPrice * (1 - formData.discountRate / 100));
    const priceString = finalPrice.toLocaleString();

    const productData = {
      ...formData,
      price: priceString,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (isEdit) {
        await updateDoc(doc(db, 'products', product.id), productData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          rating: 0,
          reviewCount: 0,
          createdAt: new Date().toISOString(),
        });
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, isEdit ? OperationType.UPDATE : OperationType.CREATE, 'products');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h3 className="text-xl font-bold">{isEdit ? '商品編集' : '新しい商品を追加'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">商品名</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-brand-mint focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">ブランド</label>
                <input required type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-brand-mint focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">カテゴリー</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-brand-mint focus:outline-none">
                  <option value="フード">フード</option>
                  <option value="おやつ">おやつ</option>
                  <option value="用品">用品</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">サブカテゴリー</label>
                <input type="text" value={formData.subCategory} onChange={e => setFormData({...formData, subCategory: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-brand-mint focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">原価（数字）</label>
                <input required type="number" value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: Number(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-brand-mint focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">割引率 (%)</label>
                <input required type="number" min="0" max="100" value={formData.discountRate} onChange={e => setFormData({...formData, discountRate: Number(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-brand-mint focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1">商品画像</label>
                <div className="flex items-start gap-4">
                  {formData.image && (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-700 bg-gray-800 flex-shrink-0">
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, image: ''})}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  <div className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-4 transition-colors ${formData.image ? 'border-gray-700' : 'border-gray-700 hover:border-brand-mint'}`}>
                    <input 
                      type="file" 
                      accept="image/*"
                      id="product-image-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({...formData, image: reader.result as string});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label 
                      htmlFor="product-image-upload"
                      className="cursor-pointer flex flex-col items-center gap-2 text-gray-400 hover:text-brand-mint transition-colors"
                    >
                      <Camera size={24} />
                      <span className="text-xs font-bold">{formData.image ? '画像を切り替える' : '画像をアップロード'}</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1">説明</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-brand-mint focus:outline-none" />
              </div>
              <div className="col-span-2 flex gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={formData.isDawnDelivery} onChange={e => setFormData({...formData, isDawnDelivery: e.target.checked})} className="rounded border-gray-700 text-brand-mint focus:ring-brand-mint bg-gray-800" />
                  早朝配送可能
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={formData.isTodayDelivery} onChange={e => setFormData({...formData, isTodayDelivery: e.target.checked})} className="rounded border-gray-700 text-brand-mint focus:ring-brand-mint bg-gray-800" />
                  当日配送可能
                </label>
              </div>
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">キャンセル</button>
          <button type="submit" form="product-form" className="bg-brand-mint text-gray-900 px-6 py-2 rounded-xl font-bold hover:bg-brand-mint/90 transition-colors">
            {isEdit ? '編集完了' : '追加する'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}