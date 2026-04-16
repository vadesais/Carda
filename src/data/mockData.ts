export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  arEnabled: boolean;
  model3dUrl?: string;
  ingredients?: string[];
  views: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export const categories: Category[] = [
  { id: 'all', name: 'Todos', icon: '🍽️' },
  { id: 'starters', name: 'Entradas', icon: '🥗' },
  { id: 'mains', name: 'Principais', icon: '🥩' },
  { id: 'pasta', name: 'Massas', icon: '🍝' },
  { id: 'desserts', name: 'Sobremesas', icon: '🍰' },
  { id: 'drinks', name: 'Bebidas', icon: '🍷' },
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Bruschetta Clássica',
    description: 'Pão italiano tostado com tomate fresco, manjericão, alho e azeite extra virgem. Uma entrada perfeita para compartilhar.',
    price: 32.90,
    category: 'starters',
    image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600&q=80',
    arEnabled: true,
    ingredients: ['Pão Italiano', 'Tomate', 'Manjericão', 'Alho', 'Azeite'],
    views: 245,
  },
  {
    id: '2',
    name: 'Carpaccio de Wagyu',
    description: 'Finas fatias de carne Wagyu A5 com rúcula, lascas de parmesão e redução de balsâmico trufado.',
    price: 78.90,
    category: 'starters',
    image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=600&q=80',
    arEnabled: true,
    ingredients: ['Wagyu A5', 'Rúcula', 'Parmesão', 'Balsâmico', 'Trufa'],
    views: 189,
  },
  {
    id: '3',
    name: 'Filé Mignon ao Molho de Vinho',
    description: 'Filé mignon grelhado ao ponto, acompanhado de molho de vinho tinto, purê de batatas trufado e legumes grelhados.',
    price: 89.90,
    category: 'mains',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80',
    arEnabled: true,
    ingredients: ['Filé Mignon', 'Vinho Tinto', 'Batata', 'Trufa', 'Legumes'],
    views: 412,
  },
  {
    id: '4',
    name: 'Salmão Grelhado',
    description: 'Salmão norueguês grelhado com crosta de ervas, risoto de limão siciliano e aspargos frescos.',
    price: 79.90,
    category: 'mains',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80',
    arEnabled: true,
    ingredients: ['Salmão', 'Ervas', 'Risoto', 'Limão', 'Aspargos'],
    views: 356,
  },
  {
    id: '5',
    name: 'Tagliatelle al Tartufo',
    description: 'Massa fresca artesanal com molho cremoso de trufa negra, parmesão envelhecido 36 meses e azeite trufado.',
    price: 68.90,
    category: 'pasta',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80',
    arEnabled: true,
    ingredients: ['Tagliatelle', 'Trufa Negra', 'Parmesão', 'Creme', 'Azeite Trufado'],
    views: 298,
  },
  {
    id: '6',
    name: 'Risotto de Cogumelos',
    description: 'Risoto cremoso com mix de cogumelos nobres, finalizado com manteiga e parmesão ralado na hora.',
    price: 58.90,
    category: 'pasta',
    image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80',
    arEnabled: false,
    ingredients: ['Arroz Arbóreo', 'Cogumelos', 'Manteiga', 'Parmesão', 'Vinho Branco'],
    views: 201,
  },
  {
    id: '7',
    name: 'Tiramisù Classico',
    description: 'Autêntico tiramisù italiano com mascarpone, café espresso, biscoitos savoiardi e cacau amargo.',
    price: 38.90,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80',
    arEnabled: true,
    ingredients: ['Mascarpone', 'Café', 'Savoiardi', 'Cacau', 'Amaretto'],
    views: 367,
  },
  {
    id: '8',
    name: 'Panna Cotta',
    description: 'Delicada panna cotta de baunilha bourbon com coulis de frutas vermelhas e folhas de hortelã.',
    price: 34.90,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80',
    arEnabled: false,
    ingredients: ['Creme', 'Baunilha', 'Frutas Vermelhas', 'Hortelã'],
    views: 178,
  },
  {
    id: '9',
    name: 'Negroni Clássico',
    description: 'Gin, Campari e Vermute Rosso, servido com gelo grande e casca de laranja.',
    price: 42.90,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&q=80',
    arEnabled: false,
    ingredients: ['Gin', 'Campari', 'Vermute', 'Laranja'],
    views: 156,
  },
  {
    id: '10',
    name: 'Vinho Barolo DOCG',
    description: 'Safra 2018 da região de Piemonte. Notas de cereja, alcatrão, rosas e especiarias.',
    price: 189.90,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80',
    arEnabled: false,
    ingredients: ['Nebbiolo', 'Piemonte', 'Safra 2018'],
    views: 98,
  },
];
