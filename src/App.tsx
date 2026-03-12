import React, { useState, useEffect, useRef, Component, ReactNode } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate,
  useLocation,
  useParams
} from 'react-router-dom';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  addDoc,
  serverTimestamp,
  limit,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  ShoppingBag, 
  Truck, 
  Store, 
  Package, 
  MessageCircle, 
  Wallet, 
  User as UserIcon,
  LogOut,
  Plus,
  Search,
  MapPin,
  Send,
  Image as ImageIcon,
  ChevronLeft,
  Star,
  Play,
  Camera,
  Bell,
  Filter,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Edit3,
  X,
  ChevronRight,
  Clock,
  History,
  Heart,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, UserRole, Shop, Product, Order, ChatMessage, Post, StatusUpdate } from './types';
import { AlertTriangle } from 'lucide-react';

// --- Utility for tailwind classes ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Reusable Components ---

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  isDanger = true
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void, 
  title: string, 
  message: string,
  confirmText?: string,
  cancelText?: string,
  isDanger?: boolean
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-[40px] w-full max-w-sm p-8 space-y-6 shadow-2xl"
        >
          <div className="space-y-2 text-center">
            <h3 className="text-2xl font-black tracking-tighter text-black">{title}</h3>
            <p className="text-gray-500 font-bold leading-relaxed">{message}</p>
          </div>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => { onConfirm(); onClose(); }}
              className={cn(
                "w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95",
                isDanger ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-[#00B14F] text-white shadow-lg shadow-[#00B14F]/20"
              )}
            >
              {confirmText}
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all"
            >
              {cancelText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// --- Error Boundary ---
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let message = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) message = `Database Error: ${parsed.error}`;
      } catch (e) {
        message = this.state.error.message || message;
      }

      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-[40px] shadow-xl max-w-md space-y-4">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={40} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Oops!</h2>
            <p className="text-gray-500 font-bold">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-[#00B14F] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#00B14F]/20"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Custom Logo Component (Home with D) ---
const Logo = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={cn("w-10 h-10", className)}
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Home Shape (mimicking Shopify's bag structure but as a house) */}
    <path 
      d="M50 15L15 45V85H85V45L50 15Z" 
      fill="currentColor" 
    />
    {/* Geometric 'D' (Century Gothic style) */}
    <text 
      x="50" 
      y="65" 
      textAnchor="middle" 
      fill="white" 
      style={{ 
        fontFamily: "'Century Gothic', 'Questrial', sans-serif", 
        fontWeight: 'bold', 
        fontSize: '32px' 
      }}
    >
      D
    </text>
  </svg>
);

// --- Components ---

const BackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  if (location.pathname === '/marketplace' || location.pathname === '/') return null;

  return (
    <button 
      onClick={() => navigate(-1)}
      className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors"
    >
      <ChevronLeft size={24} />
    </button>
  );
};

const Layout = ({ children, user, role, setRole }: { children: React.ReactNode, user: UserProfile | null, role: UserRole, setRole: (r: UserRole) => void }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'home', label: 'Home', icon: ShoppingBag, roles: ['consumer', 'merchant', 'parker', 'driver'] },
    { id: 'chat', label: 'Chat', icon: MessageCircle, roles: ['consumer', 'merchant', 'parker', 'driver'] },
    { id: 'orders', label: 'Orders', icon: Truck, roles: ['consumer', 'merchant', 'parker', 'driver'] },
    { id: 'profile', label: 'Profile', icon: UserIcon, roles: ['consumer', 'merchant', 'parker', 'driver'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(role));

  return (
    <div className="min-h-screen flex flex-col bg-[#00B14F] text-white selection:bg-white selection:text-[#00B14F]">
      {/* Header */}
      <header className="px-4 py-3 flex justify-between items-center sticky top-0 bg-[#00B14F] z-50">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="flex items-center gap-2">
            <Logo className="text-white w-8 h-8" />
            <h1 className="text-xl font-black tracking-tighter">DoorStep</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-2 bg-white/20 rounded-full">
            <Bell size={20} />
          </button>
          <button 
            onClick={() => navigate('/profile')}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center overflow-hidden"
          >
            <UserIcon size={22} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 text-black rounded-t-[32px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-gray-100 z-50">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          {filteredNav.map((item) => {
            const isActive = location.pathname.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/${item.id}`)}
                className="flex flex-col items-center gap-1"
              >
                <div className={cn(
                  "p-2 rounded-full transition-all duration-300",
                  isActive ? "bg-[#00B14F]/10 text-[#00B14F]" : "text-gray-400"
                )}>
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  isActive ? "text-[#00B14F]" : "text-gray-400"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

// --- Views ---

const LoginView = () => {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[#00B14F]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-10 max-w-sm"
      >
        <Logo className="text-white w-32 h-32 mx-auto" />
        
        <div className="space-y-3">
          <h1 className="text-5xl font-black tracking-tighter">DoorStep</h1>
          <p className="text-white/80 font-bold text-lg">Everyday everything, delivered.</p>
        </div>

        <button 
          onClick={handleLogin}
          className="w-full bg-white text-[#00B14F] font-black py-5 px-8 rounded-full flex items-center justify-center gap-4 text-lg shadow-2xl shadow-black/20 active:scale-95 transition-all"
        >
          <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
          Continue with Google
        </button>

        <div className="flex justify-center gap-8 opacity-40">
          <div className="flex flex-col items-center gap-1">
            <ShoppingBag size={20} />
            <span className="text-[8px] font-black uppercase">Shop</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Truck size={20} />
            <span className="text-[8px] font-black uppercase">Deliver</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Wallet size={20} />
            <span className="text-[8px] font-black uppercase">Pay</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Marketplace = ({ user }: { user: UserProfile }) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const navigate = useNavigate();

  const categories = [
    { name: 'All', icon: ShoppingBag },
    { name: 'Food', icon: ShoppingBag },
    { name: 'Grocery', icon: Store },
    { name: 'Pharma', icon: Package },
    { name: 'Gifts', icon: Heart },
    { name: 'Electronics', icon: Package },
  ];

  useEffect(() => {
    const q = query(collection(db, 'shops'), where('city', '==', user.city || 'Lilongwe'));
    const unsubscribeShops = onSnapshot(q, (snapshot) => {
      setShops(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shop)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'shops');
    });
    return () => unsubscribeShops();
  }, [user.city]);

  return (
    <div className="pb-24">
      {/* Hero / Search Section */}
      <div className="bg-[#00B14F] px-5 pb-10 pt-4 space-y-6">
        <div className="flex items-center gap-2 text-white/90">
          <MapPin size={18} />
          <span className="font-black text-lg">{user.city || 'Lilongwe'}</span>
          <ChevronRight size={18} />
        </div>

        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
          <input 
            type="text"
            placeholder="Search for shops or items..."
            className="w-full bg-white text-black rounded-full py-5 pl-14 pr-6 focus:outline-none shadow-xl font-bold text-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-5 -mt-6">
        <div className="bg-white rounded-3xl shadow-sm p-6 flex gap-6 overflow-x-auto hide-scrollbar">
          {categories.map((cat) => (
            <button 
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className="category-pill"
            >
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
                activeCategory === cat.name ? "bg-[#00B14F] text-white" : "bg-gray-100 text-gray-400"
              )}>
                <cat.icon size={28} />
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                activeCategory === cat.name ? "text-[#00B14F]" : "text-gray-400"
              )}>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Featured / Discounts */}
      <div className="mt-8 px-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight">Promotions</h2>
          <button className="text-[#00B14F] font-black text-sm">See all</button>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-shrink-0 w-72 h-40 bg-gray-200 rounded-3xl overflow-hidden relative group">
              <img 
                src={`https://picsum.photos/seed/promo${i}/600/400`} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                alt="Promo" 
                referrerPolicy="no-referrer" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-5">
                <p className="text-white font-black text-xl leading-tight">Up to 50% Off at Sana</p>
                <p className="text-white/80 text-xs font-bold">Limited time only</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shop List */}
      <div className="mt-10 px-5 space-y-6">
        <h2 className="text-xl font-black tracking-tight">All Stores</h2>
        <div className="space-y-6">
          {shops.map((shop) => (
            <motion.div 
              key={shop.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/shop/${shop.id}`)}
              className="space-y-3 cursor-pointer"
            >
              <div className="aspect-video bg-gray-100 rounded-3xl overflow-hidden relative">
                <img src={shop.logoUrl || `https://picsum.photos/seed/${shop.id}/800/400`} className="w-full h-full object-cover" alt={shop.name} referrerPolicy="no-referrer" />
                <div className="absolute top-4 right-4 bg-white px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-black">4.8</span>
                </div>
              </div>
              <div className="flex justify-between items-start px-1">
                <div>
                  <h3 className="text-lg font-black">{shop.name}</h3>
                  <p className="text-sm text-gray-500 font-bold flex items-center gap-1">
                    <Clock size={14} /> 20-30 mins • MK 1,500 delivery
                  </p>
                </div>
                <div className="bg-[#00B14F]/10 text-[#00B14F] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {shop.category || 'General'}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ShopDetailView = ({ user }: { user: UserProfile }) => {
  const { id } = useParams<{ id: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ product: Product, quantity: number }[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchShop = async () => {
      try {
        const docRef = doc(db, 'shops', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setShop({ id: docSnap.id, ...docSnap.data() } as Shop);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `shops/${id}`);
      }
    };
    fetchShop();

    const q = query(collection(db, 'products'), where('shopId', '==', id));
    const unsub = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });
    return () => unsub();
  }, [id]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const total = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
    }
  };

  if (!shop) return <div className="p-10 text-center font-black">Loading shop...</div>;

  return (
    <div className="pb-32">
      <div className="h-64 relative">
        <img src={shop.logoUrl || `https://picsum.photos/seed/${shop.id}/800/400`} className="w-full h-full object-cover" alt={shop.name} referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6 text-white">
          <h2 className="text-3xl font-black tracking-tighter">{shop.name}</h2>
          <p className="font-bold opacity-80">{shop.category} • {shop.city}</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar">
          {['Popular', 'Deals', 'New', 'Essentials'].map(tab => (
            <button key={tab} className="px-6 py-2.5 bg-white rounded-full border border-gray-100 text-[10px] font-black uppercase tracking-widest shadow-sm">
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-[32px] p-4 shadow-sm border border-gray-100 space-y-3">
              <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden relative">
                <img src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`} className="w-full h-full object-cover" alt={product.name} referrerPolicy="no-referrer" />
                <div className="absolute bottom-2 right-2 flex flex-col gap-2">
                  {shop.merchantId === user.uid && (
                    <button 
                      onClick={() => setProductToDelete(product.id)}
                      className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => addToCart(product)}
                    className="w-10 h-10 bg-[#00B14F] text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              <div className="px-1">
                <h4 className="font-black text-sm truncate">{product.name}</h4>
                <p className="text-[#00B14F] font-black text-xs">MK {product.price.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-24 left-6 right-6 bg-white rounded-[32px] p-4 shadow-2xl border border-gray-100 z-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#00B14F]/10 text-[#00B14F] rounded-2xl flex items-center justify-center font-black">
              {cart.reduce((acc, i) => acc + i.quantity, 0)}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total MK</p>
              <p className="text-lg font-black">{total.toLocaleString()}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowPayment(true)}
            className="bg-[#00B14F] text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-[#00B14F]/20 active:scale-95 transition-all flex items-center gap-2"
          >
            Checkout <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Airtel Money Modal */}
      <AnimatePresence>
        {showPayment && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-md rounded-[40px] p-8 space-y-8"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">A</div>
                  <h3 className="text-2xl font-black tracking-tighter">Airtel Money</h3>
                </div>
                <button onClick={() => setShowPayment(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
              </div>

              <div className="bg-gray-50 p-6 rounded-[32px] space-y-4">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-400">Subtotal</span>
                  <span>MK {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-400">Delivery Fee</span>
                  <span>MK 1,500</span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex justify-between text-xl font-black">
                  <span>Total</span>
                  <span className="text-[#00B14F]">MK {(total + 1500).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 text-center">Enter Airtel Money Number</p>
                <input 
                  type="tel" 
                  placeholder="099X XXX XXX" 
                  className="w-full bg-gray-100 border-none rounded-2xl py-5 px-6 text-center text-2xl font-black tracking-widest focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <button 
                onClick={() => {
                  setPaymentSuccess(true);
                  setShowPayment(false);
                  setCart([]);
                  setTimeout(() => setPaymentSuccess(false), 5000);
                }}
                className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-red-600/20 active:scale-95 transition-all"
              >
                Pay Now
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {paymentSuccess && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-24 left-6 right-6 bg-[#00B14F] text-white p-6 rounded-[32px] shadow-2xl z-[100] flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Bell size={24} />
          </div>
          <div>
            <p className="font-black">Payment Requested!</p>
            <p className="text-sm font-bold opacity-90">Check your phone to enter your PIN.</p>
          </div>
        </motion.div>
      )}

      <ConfirmModal 
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={() => productToDelete && handleDeleteProduct(productToDelete)}
        title="Delete Product"
        message="Are you sure you want to delete this product? This will remove it from your shop."
      />
    </div>
  );
};



const CommunityView = ({ user }: { user: UserProfile }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'feed'>('chat');
  
  // Chat States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeGroup, setActiveGroup] = useState('Global Feed');
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  // Feed States
  const [posts, setPosts] = useState<Post[]>([]);
  const [statuses, setStatuses] = useState<StatusUpdate[]>([]);
  const [newPostText, setNewPostText] = useState('');
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  const groups = ['Global Feed', 'Lilongwe Deals', 'Zomba Health', 'Merchant Hub'];

  useEffect(() => {
    if (activeTab === 'chat') {
      const q = query(collection(db, 'chats', activeGroup, 'messages'), orderBy('createdAt', 'desc'), limit(50));
      return onSnapshot(q, (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `chats/${activeGroup}/messages`);
      });
    } else {
      const qPosts = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20));
      const unsubPosts = onSnapshot(qPosts, (snapshot) => {
        setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'posts');
      });

      const qStatus = query(collection(db, 'status'), where('expiresAt', '>', new Date().toISOString()), limit(10));
      const unsubStatus = onSnapshot(qStatus, (snapshot) => {
        setStatuses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StatusUpdate)));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'status');
      });

      return () => { unsubPosts(); unsubStatus(); };
    }
  }, [activeGroup, activeTab]);

  // Chat Functions
  const sendMessage = async (mediaType?: 'image' | 'video') => {
    if (!inputText.trim() && !mediaType) return;
    
    try {
      if (editingMessage) {
        await updateDoc(doc(db, 'chats', activeGroup, 'messages', editingMessage.id), {
          text: inputText,
          updatedAt: serverTimestamp()
        });
        setEditingMessage(null);
      } else {
        await addDoc(collection(db, 'chats', activeGroup, 'messages'), {
          senderId: user.uid,
          senderName: user.displayName,
          text: inputText,
          mediaType: mediaType || null,
          mediaUrl: mediaType ? `https://picsum.photos/seed/${Date.now()}/800` : null,
          createdAt: serverTimestamp(),
          reactions: { "👍": [], "👎": [] }
        });
      }
      setInputText('');
    } catch (error) {
      handleFirestoreError(error, editingMessage ? OperationType.UPDATE : OperationType.CREATE, `chats/${activeGroup}/messages`);
    }
  };

  const deleteMessage = async (msgId: string) => {
    try {
      await deleteDoc(doc(db, 'chats', activeGroup, 'messages', msgId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `chats/${activeGroup}/messages/${msgId}`);
    }
  };

  const toggleReaction = async (msg: ChatMessage, emoji: "👍" | "👎") => {
    const reactions = { 
      "👍": msg.reactions?.["👍"] || [], 
      "👎": msg.reactions?.["👎"] || [] 
    };
    const currentList = reactions[emoji];
    const newList = currentList.includes(user.uid) 
      ? currentList.filter(id => id !== user.uid) 
      : [...currentList, user.uid];
    
    reactions[emoji] = newList;
    try {
      await updateDoc(doc(db, 'chats', activeGroup, 'messages', msg.id), { reactions });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chats/${activeGroup}/messages/${msg.id}`);
    }
  };

  // Feed Functions
  const handleCreatePost = async () => {
    if (!newPostText.trim()) return;
    try {
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: user.displayName,
        text: newPostText,
        likes: [],
        dislikes: [],
        comments: [],
        createdAt: new Date().toISOString()
      });
      setNewPostText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'posts');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
    }
  };

  const handleToggleLike = async (post: Post) => {
    const likes = post.likes || [];
    const newLikes = likes.includes(user.uid) 
      ? likes.filter(id => id !== user.uid) 
      : [...likes, user.uid];
    try {
      await updateDoc(doc(db, 'posts', post.id), { likes: newLikes });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${post.id}`);
    }
  };

  const handleToggleDislike = async (post: Post) => {
    const dislikes = post.dislikes || [];
    const newDislikes = dislikes.includes(user.uid) 
      ? dislikes.filter(id => id !== user.uid) 
      : [...dislikes, user.uid];
    try {
      await updateDoc(doc(db, 'posts', post.id), { dislikes: newDislikes });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${post.id}`);
    }
  };

  const handleUpdateStatus = async () => {
    const mediaUrl = prompt("Enter image URL for your status:");
    if (!mediaUrl) return;
    try {
      await addDoc(collection(db, 'status'), {
        authorId: user.uid,
        authorName: user.displayName,
        mediaUrl,
        mediaType: 'image',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'status');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-gray-50">
      {/* Tab Switcher */}
      <div className="bg-white border-b border-gray-100 flex p-1 m-4 rounded-2xl shadow-sm">
        <button 
          onClick={() => setActiveTab('chat')}
          className={cn(
            "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
            activeTab === 'chat' ? "bg-[#00B14F] text-white shadow-lg shadow-[#00B14F]/20" : "text-gray-400"
          )}
        >
          <MessageCircle size={16} />
          Messages
        </button>
        <button 
          onClick={() => setActiveTab('feed')}
          className={cn(
            "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
            activeTab === 'feed' ? "bg-[#00B14F] text-white shadow-lg shadow-[#00B14F]/20" : "text-gray-400"
          )}
        >
          <Users size={16} />
          Feed
        </button>
      </div>

      {activeTab === 'chat' ? (
        <>
          {/* Group Selector */}
          <div className="px-4 py-2 flex gap-3 overflow-x-auto hide-scrollbar">
            {groups.map(g => (
              <button 
                key={g}
                onClick={() => setActiveGroup(g)}
                className={cn(
                  "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                  activeGroup === g ? "bg-[#00B14F]/10 text-[#00B14F]" : "bg-white text-gray-400 border border-gray-100"
                )}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 flex flex-col-reverse hide-scrollbar">
            {messages.map((msg) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={msg.id} 
                className={cn("flex flex-col gap-1.5", msg.senderId === user.uid ? "items-end" : "items-start")}
              >
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{msg.senderName}</span>
                </div>
                
                <div className={cn(
                  "max-w-[85%] p-4 rounded-2xl text-sm font-bold shadow-sm relative group",
                  msg.senderId === user.uid ? "bg-[#00B14F] text-white rounded-tr-none" : "bg-white text-black rounded-tl-none"
                )}>
                  {msg.mediaUrl && (
                    <div className="mb-3 rounded-xl overflow-hidden relative aspect-video bg-black/5">
                      <img src={msg.mediaUrl} className="w-full h-full object-cover" alt="Media" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <div className="break-words leading-relaxed">{msg.text}</div>
                  
                  {msg.senderId === user.uid && (
                    <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingMessage(msg); setInputText(msg.text); }}
                        className="p-2 bg-white text-gray-600 rounded-full shadow-lg border border-gray-100"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => setMessageToDelete(msg.id)}
                        className="p-2 bg-red-500 text-white rounded-full shadow-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                  
                  <div className="mt-3 flex gap-2">
                    <button 
                      onClick={() => toggleReaction(msg, "👍")}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] transition-all",
                        msg.reactions?.["👍"]?.includes(user.uid) ? "bg-white/20 text-white" : "bg-gray-50 text-gray-400"
                      )}
                    >
                      <ThumbsUp size={12} />
                      <span className="font-black">{msg.reactions?.["👍"]?.length || 0}</span>
                    </button>
                    <button 
                      onClick={() => toggleReaction(msg, "👎")}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] transition-all",
                        msg.reactions?.["👎"]?.includes(user.uid) ? "bg-red-500 text-white" : "bg-gray-50 text-gray-400"
                      )}
                    >
                      <ThumbsDown size={12} />
                      <span className="font-black">{msg.reactions?.["👎"]?.length || 0}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-100 pb-24">
            {editingMessage && (
              <div className="mb-3 flex items-center justify-between bg-gray-50 p-3 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00B14F]">Editing Message</span>
                <button onClick={() => { setEditingMessage(null); setInputText(''); }} className="p-1 text-gray-400"><X size={16} /></button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input 
                  type="text"
                  placeholder={editingMessage ? "Update your message..." : "Type a message..."}
                  className="w-full bg-gray-100 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#00B14F]/20 font-bold text-sm"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
              </div>
              <button 
                onClick={() => sendMessage()}
                className="w-14 h-14 bg-[#00B14F] text-white rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all"
              >
                <Send size={24} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto hide-scrollbar pb-24">
          {/* Status Bar */}
          <div className="bg-white p-4 flex gap-4 overflow-x-auto hide-scrollbar border-b border-gray-100">
            <button onClick={handleUpdateStatus} className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#00B14F] flex items-center justify-center bg-gray-50">
                <Plus size={24} className="text-[#00B14F]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</span>
            </button>
            {statuses.map(s => (
              <div key={s.id} className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-16 h-16 rounded-full border-2 border-[#00B14F] p-0.5">
                  <img src={s.mediaUrl} className="w-full h-full rounded-full object-cover" alt="Status" referrerPolicy="no-referrer" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 truncate w-16 text-center">{s.authorName}</span>
              </div>
            ))}
          </div>

          {/* Create Post */}
          <div className="p-4 bg-white border-b border-gray-100">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <UserIcon size={20} className="text-gray-400" />
              </div>
              <div className="flex-1 space-y-3">
                <textarea 
                  placeholder="Share something with the community..."
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#00B14F]/20 resize-none"
                  rows={2}
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                />
                <div className="flex justify-end">
                  <button onClick={handleCreatePost} className="bg-[#00B14F] text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#00B14F]/20">
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feed */}
          <div className="p-4 space-y-6">
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <UserIcon size={20} className="text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm">{post.authorName}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Just now</p>
                    </div>
                  </div>
                  {post.authorId === user.uid && (
                    <button onClick={() => setPostToDelete(post.id)} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-full transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="px-5 pb-4">
                  <p className="text-sm font-bold leading-relaxed">{post.text}</p>
                </div>
                <div className="p-5 flex items-center gap-6 border-t border-gray-50">
                  <button onClick={() => handleToggleLike(post)} className={cn("flex items-center gap-2 transition-colors", post.likes?.includes(user.uid) ? "text-[#00B14F]" : "text-gray-400")}>
                    <ThumbsUp size={18} className={post.likes?.includes(user.uid) ? "fill-[#00B14F]" : ""} />
                    <span className="text-xs font-black">{post.likes?.length || 0}</span>
                  </button>
                  <button onClick={() => handleToggleDislike(post)} className={cn("flex items-center gap-2 transition-colors", post.dislikes?.includes(user.uid) ? "text-red-500" : "text-gray-400")}>
                    <ThumbsDown size={18} className={post.dislikes?.includes(user.uid) ? "fill-red-500" : ""} />
                    <span className="text-xs font-black">{post.dislikes?.length || 0}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!messageToDelete}
        onClose={() => setMessageToDelete(null)}
        onConfirm={() => messageToDelete && deleteMessage(messageToDelete)}
        title="Delete Message"
        message="Are you sure you want to delete this message?"
      />

      <ConfirmModal 
        isOpen={!!postToDelete}
        onClose={() => setPostToDelete(null)}
        onConfirm={() => postToDelete && handleDeletePost(postToDelete)}
        title="Delete Post"
        message="Are you sure you want to delete this post?"
      />
    </div>
  );
};

const LogisticsHub = ({ user, role }: { user: UserProfile, role: UserRole }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [onlineParkers, setOnlineParkers] = useState<UserProfile[]>([]);

  useEffect(() => {
    let q;
    if (role === 'consumer') {
      q = query(collection(db, 'orders'), where('consumerId', '==', user.uid), orderBy('createdAt', 'desc'));
    } else if (role === 'merchant') {
      q = query(collection(db, 'orders'), where('merchantId', '==', user.uid), orderBy('createdAt', 'desc'));
    } else if (role === 'parker') {
      q = query(collection(db, 'orders'), where('status', 'in', ['ordered', 'parker_assigned']), orderBy('createdAt', 'desc'));
    } else {
      q = query(collection(db, 'orders'), where('status', 'in', ['items_packed', 'driver_dispatched']), orderBy('createdAt', 'desc'));
    }

    const unsub = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });
    return () => unsub();
  }, [user.uid, role]);

  useEffect(() => {
    // Mock online parkers for now
    setOnlineParkers([
      { uid: 'p1', displayName: 'John Phiri', role: 'parker', city: 'Lilongwe', walletBalance: 0, createdAt: '', email: '' },
      { uid: 'p2', displayName: 'Mary Banda', role: 'parker', city: 'Lilongwe', walletBalance: 0, createdAt: '', email: '' },
    ]);
  }, []);

  return (
    <div className="p-6 space-y-10 pb-24">
      <div className="space-y-6">
        <h2 className="text-2xl font-black tracking-tight">
          {role === 'consumer' && 'My Orders'}
          {role === 'merchant' && 'Shop Orders'}
          {role === 'parker' && 'Parker Tasks'}
          {role === 'driver' && 'Deliveries'}
        </h2>
        
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="bg-white p-10 rounded-[32px] text-center space-y-4 border border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <Package size={32} className="text-gray-300" />
              </div>
              <p className="text-gray-400 font-bold">No active orders found</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order #{order.id.slice(-6)}</p>
                    <h3 className="text-xl font-black">Malawi Marketplace</h3>
                  </div>
                  <div className="bg-[#00B14F]/10 text-[#00B14F] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {order.status.replace('_', ' ')}
                  </div>
                </div>

                <div className="flex items-center gap-4 py-4 border-y border-gray-50">
                  <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center"><UserIcon size={18} /></div>
                    <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center"><Truck size={18} /></div>
                  </div>
                  <div>
                    <p className="text-xs font-black">Status: {order.status}</p>
                    <p className="text-[10px] text-gray-400 font-bold">Total: MK {order.totalAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 bg-gray-100 text-black font-black py-4 rounded-2xl text-sm">Track</button>
                  <button className="flex-1 bg-[#00B14F] text-white font-black py-4 rounded-2xl text-sm">Details</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {role === 'consumer' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight">Available Parkers</h2>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar">
            {onlineParkers.map(p => (
              <div key={p.uid} className="flex-shrink-0 bg-white p-6 w-40 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center relative">
                  <UserIcon size={32} className="text-gray-400" />
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-[#00B14F] rounded-full border-4 border-white" />
                </div>
                <div>
                  <p className="font-black text-sm leading-tight">{p.displayName}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-[10px] font-black">4.9</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const WalletView = ({ user }: { user: UserProfile }) => {
  return (
    <div className="p-6 space-y-10 pb-24">
      <div className="bg-[#00B14F] p-8 rounded-[40px] text-white space-y-8 shadow-2xl shadow-[#00B14F]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Total Balance</p>
          <h2 className="text-5xl font-black tracking-tighter">MK {user.walletBalance.toLocaleString()}</h2>
        </div>
        <div className="flex gap-4">
          <button className="flex-1 bg-white text-[#00B14F] font-black py-4 rounded-2xl text-sm shadow-lg">Top Up</button>
          <button className="flex-1 bg-white/20 text-white font-black py-4 rounded-2xl text-sm backdrop-blur-md">Transfer</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
            <Wallet size={24} className="text-red-600" />
          </div>
          <div>
            <h4 className="font-black text-sm">Airtel Money</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Linked</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
            <Wallet size={24} className="text-green-600" />
          </div>
          <div>
            <h4 className="font-black text-sm">TNM Mpamba</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Linked</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-black tracking-tight">Transaction History</h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between p-5 bg-white rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                  <History size={20} className="text-gray-400" />
                </div>
                <div>
                  <p className="font-black text-sm">Order #DS-928{i}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">12 Mar • 09:45</p>
                </div>
              </div>
              <span className="font-black text-sm text-red-500">-MK 4,500</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProfileView = ({ user, setRole }: { user: UserProfile, setRole: (r: UserRole) => void }) => {
  const roles: UserRole[] = ['consumer', 'merchant', 'parker', 'driver'];
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.displayName);
  const [editCity, setEditCity] = useState(user.city);

  const handleUpdateProfile = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: editName,
        city: editCity
      });
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <div className="p-8 space-y-12 pb-24">
      <div className="flex flex-col items-center gap-6">
        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-4 border-white shadow-xl relative">
          <UserIcon size={64} className="text-gray-300" />
          <button className="absolute bottom-0 right-0 p-3 bg-[#00B14F] text-white rounded-full shadow-xl border-4 border-white">
            <Camera size={18} />
          </button>
        </div>
        
        {isEditing ? (
          <div className="w-full space-y-4">
            <input 
              type="text" 
              value={editName} 
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-2xl py-4 px-6 font-black text-center text-xl focus:ring-2 focus:ring-[#00B14F]/20"
              placeholder="Your Name"
            />
            <input 
              type="text" 
              value={editCity} 
              onChange={(e) => setEditCity(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-2xl py-4 px-6 font-black text-center text-sm focus:ring-2 focus:ring-[#00B14F]/20"
              placeholder="Your City"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-100 text-black font-black py-4 rounded-2xl text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateProfile}
                className="flex-1 bg-[#00B14F] text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-[#00B14F]/20"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tight">{user.displayName}</h2>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{user.city}</p>
            </div>
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 mx-auto text-[#00B14F] font-black text-sm bg-[#00B14F]/10 px-6 py-2 rounded-full"
            >
              <Edit3 size={16} /> Edit Profile
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Account Type</h3>
        <div className="grid grid-cols-2 gap-4">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={cn(
                "p-6 rounded-[32px] border-2 transition-all font-black capitalize text-sm flex flex-col items-center gap-3",
                user.role === r ? "bg-[#00B14F] text-white border-[#00B14F] shadow-xl" : "bg-white border-gray-100 text-gray-400"
              )}
            >
              {r === 'consumer' && <ShoppingBag size={24} />}
              {r === 'merchant' && <Store size={24} />}
              {r === 'parker' && <Package size={24} />}
              {r === 'driver' && <Truck size={24} />}
              {r}
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={() => signOut(auth)}
        className="w-full bg-red-50 text-red-500 font-black py-5 rounded-[32px] flex items-center justify-center gap-3 text-sm active:scale-95 transition-all"
      >
        <LogOut size={20} />
        Sign Out
      </button>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<UserRole>('consumer');

  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            setUser(userData);
            setActiveRole(userData.role);
          } else {
            const newUser: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || 'User',
              role: 'consumer',
              city: 'Lilongwe',
              walletBalance: 0,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', fbUser.uid), newUser);
            setUser(newUser);
            setActiveRole('consumer');
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${fbUser.uid}`);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#00B14F] flex items-center justify-center">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0]
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-16 h-16 bg-white rounded-3xl"
        />
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Layout user={user} role={activeRole} setRole={setActiveRole}>
          <Routes>
            <Route path="/home" element={<Marketplace user={user} />} />
            <Route path="/shop/:id" element={<ShopDetailView user={user} />} />
            <Route path="/chat" element={<CommunityView user={user} />} />
            <Route path="/orders" element={<LogisticsHub user={user} role={activeRole} />} />
            <Route path="/profile" element={<ProfileView user={user} setRole={setActiveRole} />} />
            
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}
