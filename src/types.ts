export type AnimalType = 'dog' | 'cat' | 'small' | 'other';

export interface Product {
  id: string;
  brand: string;
  name: string;
  image: string;
  originalPrice: number;
  discountRate: number;
  price: number;
  rating: number;
  reviewCount: number;
  isDawnDelivery: boolean;
  isTodayDelivery: boolean;
  category: string;
  subCategory: string;
  animalType?: AnimalType;
  description?: string;
  images?: string[];
  options?: string[];
}

export interface CartItem {
  productId: string;
  quantity: number;
  selectedOption?: string;
}

export interface PostComment {
  id: string;
  username: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  uid: string;
  username: string;
  userAvatar: string;
  petInfo?: string;
  animalType?: string;
  category?: 'daily' | 'concern' | 'vet' | 'tip';
  content?: string;
  caption?: string;
  images?: string[];
  image?: string;
  likes: number;
  comments: number | any[];
  likedBy?: string[];
  tags?: string[];
  hasVetAnswer?: boolean;
  createdAt: string;
  isLiked?: boolean;
  commentsList?: PostComment[];
}

export interface User {
  uid: string;
  username: string;
  email: string;
  avatar?: string;
  level: string;
  points: number;
  coupons: number;
  pets: Pet[];
  createdAt: string;
}

export interface Pet {
  id: string;
  name: string;
  type: AnimalType;
  breed: string;
  birthDate: string; // YYYY-MM-DD
  weight: number;
  gender: 'male' | 'female';
  bodyType: 'thin' | 'normal' | 'chubby';
  healthConcerns: string[];
  hasAllergy: boolean;
  image?: string;
}

export interface Address {
  id: string;
  name: string;
  recipient: string;
  phone: string;
  zip: string;
  prefecture: string;
  city: string;
  address: string;
  isDefault: boolean;
}

export type Tab = 'home' | 'category' | 'community' | 'search' | 'mypage';
export type Page = Tab | 'productList' | 'productDetail' | 'cart' | 'postWrite' | 'postDetail' | 'paymentMethods' | 'friendInvite' | 'myReviews' | 'orderHistory' | 'shippingAddress' | 'notificationSettings' | 'petProfile' | 'settings' | 'profileEdit' | 'passwordChange' | 'emailChange' | 'announcements' | 'termsOfService' | 'privacyPolicy' | 'faq' | 'landing' | 'points' | 'coupons' | 'checkoutFlow';
