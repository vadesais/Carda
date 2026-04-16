import { motion } from 'framer-motion';
import { Eye, Sparkles } from 'lucide-react';
import { Product } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  index: number;
}

const ProductCard = ({ product, index }: ProductCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/product/${product.id}`)}
      className="group cursor-pointer rounded-2xl bg-card overflow-hidden card-shadow border border-border hover:border-primary/30 transition-all duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        {product.arEnabled && (
          <div className="absolute top-3 right-3 glass-strong px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">AR</span>
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-muted-foreground">
          <Eye className="w-3.5 h-3.5" />
          <span className="text-xs">{product.views}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {product.description}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xl font-bold gold-text">
            R$ {product.price.toFixed(2)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
