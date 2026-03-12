export type UserRole = 'consumer' | 'merchant' | 'parker' | 'driver' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  city: string;
  phoneNumber?: string;
  walletBalance: number;
  createdAt: string;
}

export interface Shop {
  id: string;
  merchantId: string;
  name: string;
  description: string;
  city: string;
  category: string;
  logoUrl: string;
  createdAt: string;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
}

export type OrderStatus = 'ordered' | 'parker_assigned' | 'items_packed' | 'driver_dispatched' | 'delivered';

export interface Order {
  id: string;
  consumerId: string;
  merchantId: string;
  parkerId?: string;
  driverId?: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  deliveryAddress: string;
  city: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  createdAt: string;
  reactions?: Record<string, string[]>;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  likes: string[];
  dislikes: string[];
  comments: Comment[];
  createdAt: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface StatusUpdate {
  id: string;
  authorId: string;
  authorName: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: string;
  expiresAt: string;
}
