import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import MenuHeader from '@/components/menu/MenuHeader';
import SearchBar from '@/components/menu/SearchBar';
import CategoryFilter from '@/components/menu/CategoryFilter';
import ProductCard from '@/components/menu/ProductCard';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';
import { Loader2 } from 'lucide-react';

type DBProduct  = Tables<'products'>;
type DBCategory = Tables<'categories'>;

const RESTAURANT_ID = '00000000-0000-0000-0000-000000000001';

const Index = () => {
  const [products,   setProducts]   = useState<DBProduct[]>([]);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('restaurant_id', RESTAURANT_ID)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', RESTAURANT_ID)
          .order('sort_order'),
      ]);
      setProducts(prods ?? []);
      setCategories(cats ?? []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        category === 'all' ||
        categories.find((c) => c.id === p.category_id)?.name
          ?.toLowerCase()
          .replace(/\s/g, '') ===
          category.toLowerCase().replace(/\s/g, '');
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description ?? '').toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [search, category, products, categories]);

  // Monta lista de categorias no formato que o CategoryFilter espera
  const categoryItems = [
    { id: 'all', name: 'Todos', icon: '🍽️' },
    ...categories.map((c) => ({ id: c.name, name: c.name, icon: c.icon ?? '🍽️' })),
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-8">
        <MenuHeader />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 mt-2"
        >
          <SearchBar value={search} onChange={setSearch} />
          <CategoryFilter
            categories={categoryItems}
            selected={category}
            onSelect={setCategory}
          />
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>

            {filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <p className="text-muted-foreground text-lg">Nenhum prato encontrado</p>
                <p className="text-muted-foreground/60 text-sm mt-1">Tente outra busca</p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
