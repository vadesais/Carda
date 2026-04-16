import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import MenuHeader from '@/components/menu/MenuHeader';
import SearchBar from '@/components/menu/SearchBar';
import CategoryFilter from '@/components/menu/CategoryFilter';
import ProductCard from '@/components/menu/ProductCard';
import { products } from '@/data/mockData';

const Index = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = category === 'all' || p.category === category;
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [search, category]);

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
          <CategoryFilter selected={category} onSelect={setCategory} />
        </motion.div>

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
      </div>
    </div>
  );
};

export default Index;
