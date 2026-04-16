import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Pencil, Trash2, Sparkles, Eye, BarChart3, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { products as initialProducts, categories, Product } from '@/data/mockData';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [productList] = useState<Product[]>(initialProducts);
  const [activeTab, setActiveTab] = useState<'products' | 'analytics'>('products');

  const totalViews = productList.reduce((sum, p) => sum + p.views, 0);
  const arProducts = productList.filter((p) => p.arEnabled).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 pb-8">
        {/* Header */}
        <div className="flex items-center gap-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="p-2.5 glass rounded-xl hover:bg-surface-hover transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Painel Admin</h1>
            <p className="text-xs text-muted-foreground">Gerencie seu cardápio</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-2">
          {[
            { label: 'Produtos', value: productList.length, icon: Package },
            { label: 'Visualizações', value: totalViews, icon: Eye },
            { label: 'Com AR', value: arProducts, icon: Sparkles },
          ].map(({ label, value, icon: Icon }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-4 text-center"
            >
              <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6">
          {(['products', 'analytics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'products' ? 'Produtos' : 'Analytics'}
            </button>
          ))}
        </div>

        {/* Product List */}
        {activeTab === 'products' && (
          <div className="mt-4 space-y-3">
            <button className="w-full py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              Adicionar Produto
            </button>

            <AnimatePresence>
              {productList.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border hover:border-primary/20 transition-all"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {product.name}
                      </h3>
                      {product.arEnabled && (
                        <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {categories.find((c) => c.id === product.category)?.name} · {product.views} views
                    </p>
                    <p className="text-sm font-bold gold-text mt-0.5">
                      R$ {product.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button className="p-2 glass rounded-lg hover:bg-surface-hover transition-colors">
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="p-2 glass rounded-lg hover:bg-destructive/20 transition-colors">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 space-y-3"
          >
            <div className="glass rounded-xl p-6">
              <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Top Pratos
              </h3>
              <div className="space-y-3">
                {[...productList]
                  .sort((a, b) => b.views - a.views)
                  .slice(0, 5)
                  .map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-primary w-5">#{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-foreground">{p.name}</span>
                          <span className="text-xs text-muted-foreground">{p.views}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(p.views / productList[0].views) * 100}%` }}
                            transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                            className="h-full rounded-full gold-gradient"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
