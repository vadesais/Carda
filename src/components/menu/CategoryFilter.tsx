import { motion } from 'framer-motion';
import { categories } from '@/data/mockData';

interface CategoryFilterProps {
  selected: string;
  onSelect: (id: string) => void;
}

const CategoryFilter = ({ selected, onSelect }: CategoryFilterProps) => {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => (
        <motion.button
          key={cat.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(cat.id)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-300 ${
            selected === cat.id
              ? 'bg-primary text-primary-foreground gold-glow'
              : 'glass hover:bg-surface-hover text-muted-foreground'
          }`}
        >
          <span>{cat.icon}</span>
          <span>{cat.name}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default CategoryFilter;
