export interface MockProduct {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  badge?: string;
  category: string;
  gradient: string;
}

export const gradients = [
  "from-stone-100 via-stone-200 to-stone-300",
  "from-amber-50 via-amber-100 to-amber-200",
  "from-yellow-50 via-amber-50 to-yellow-100",
  "from-stone-200 via-stone-300 to-stone-400",
];

export const MOCK_FEATURED_PRODUCTS: MockProduct[] = [
  {
    id: "f1",
    name: "Anillo Solitario Diamante",
    price: 8500,
    imageUrl: "",
    rating: 4.8,
    reviewCount: 124,
    category: "Anillos",
    gradient: "from-stone-100 to-stone-200",
  },
  {
    id: "f2",
    name: "Collar de Perlas Naturales",
    price: 3200,
    imageUrl: "",
    rating: 4.9,
    reviewCount: 87,
    category: "Collares",
    gradient: "from-stone-50 to-stone-100",
  },
  {
    id: "f3",
    name: "Aretes de Zafiro Azul",
    price: 4800,
    discountPrice: 6000,
    imageUrl: "",
    rating: 4.7,
    reviewCount: 63,
    badge: "-20%",
    category: "Aretes",
    gradient: "from-blue-50 to-indigo-100",
  },
  {
    id: "f4",
    name: "Pulsera de Oro 14k",
    price: 5500,
    imageUrl: "",
    rating: 5.0,
    reviewCount: 42,
    category: "Pulseras",
    gradient: "from-amber-50 to-amber-100",
  },
];

export const MOCK_NEW_ARRIVALS: MockProduct[] = [
  {
    id: "n1",
    name: "Anillo de Compromiso Rose Gold",
    price: 12000,
    imageUrl: "",
    rating: 5.0,
    reviewCount: 8,
    badge: "Nuevo",
    category: "Anillos",
    gradient: "from-rose-50 to-amber-100",
  },
  {
    id: "n2",
    name: "Collar Corazón de Rubí",
    price: 2800,
    imageUrl: "",
    rating: 4.6,
    reviewCount: 12,
    badge: "Nuevo",
    category: "Collares",
    gradient: "from-red-50 to-rose-100",
  },
  {
    id: "n3",
    name: "Aretes Perla Barroca",
    price: 1500,
    imageUrl: "",
    rating: 4.8,
    reviewCount: 5,
    badge: "Nuevo",
    category: "Aretes",
    gradient: "from-stone-50 to-amber-50",
  },
  {
    id: "n4",
    name: "Pulsera Esclava Plata 925",
    price: 1200,
    imageUrl: "",
    rating: 4.9,
    reviewCount: 19,
    badge: "Nuevo",
    category: "Pulseras",
    gradient: "from-zinc-100 to-zinc-200",
  },
];

export const MOCK_BESTSELLERS: MockProduct[] = [
  {
    id: "b1",
    name: "Anillo de Bodas Clásico",
    price: 7200,
    imageUrl: "",
    rating: 4.9,
    reviewCount: 231,
    category: "Anillos",
    gradient: "from-amber-50 to-stone-100",
  },
  {
    id: "b2",
    name: "Collar Cruz de Plata",
    price: 980,
    imageUrl: "",
    rating: 4.7,
    reviewCount: 189,
    category: "Collares",
    gradient: "from-zinc-50 to-stone-100",
  },
  {
    id: "b3",
    name: "Aretes Argolla de Oro",
    price: 2400,
    imageUrl: "",
    rating: 4.8,
    reviewCount: 156,
    category: "Aretes",
    gradient: "from-amber-50 to-yellow-100",
  },
  {
    id: "b4",
    name: "Pulsera de Charm",
    price: 1800,
    discountPrice: 2200,
    imageUrl: "",
    rating: 4.6,
    reviewCount: 143,
    badge: "-18%",
    category: "Pulseras",
    gradient: "from-stone-100 to-amber-50",
  },
];
