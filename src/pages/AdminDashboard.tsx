import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Pencil, Trash2, Sparkles, Eye,
  BarChart3, Package, X, Upload, Box, ChevronDown,
  Loader2, AlertCircle, RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

// ─── Types ───────────────────────────────────────────────────────────────────
type DBProduct  = Tables<'products'>;
type DBCategory = Tables<'categories'>;

const RESTAURANT_ID = '00000000-0000-0000-0000-000000000001';

type FormState = {
  name: string;
  description: string;
  price: string;
  category_id: string;
  ingredients: string;
  ar_enabled: boolean;
  image_url: string;
  model3d_url: string;
  objFileName: string;
};

const emptyForm = (defaultCategoryId = ''): FormState => ({
  name: '',
  description: '',
  price: '',
  category_id: defaultCategoryId,
  ingredients: '',
  ar_enabled: false,
  image_url: '',
  model3d_url: '',
  objFileName: '',
});

const productToForm = (p: DBProduct): FormState => ({
  name: p.name,
  description: p.description ?? '',
  price: p.price.toFixed(2),
  category_id: p.category_id ?? '',
  ingredients: (p.ingredients ?? []).join(', '),
  ar_enabled: p.ar_enabled ?? false,
  image_url: p.image_url ?? '',
  model3d_url: p.model3d_url ?? '',
  objFileName: p.model3d_url ? (p.model3d_url.split('/').pop() ?? '') : '',
});

// ─── Component ───────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();

  const [products,   setProducts]   = useState<DBProduct[]>([]);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [activeTab,  setActiveTab]  = useState<'products' | 'analytics'>('products');

  // Modal
  const [modalOpen,       setModalOpen]       = useState(false);
  const [editingProduct,  setEditingProduct]  = useState<DBProduct | null>(null);
  const [form,            setForm]            = useState<FormState>(emptyForm());
  const [ingredientInput, setIngredientInput] = useState('');
  const [glbFile,         setGlbFile]         = useState<File | null>(null);
  const objInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch ───────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: prods, error: prodErr }, { data: cats, error: catErr }] =
        await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('restaurant_id', RESTAURANT_ID)
            .order('created_at', { ascending: false }),
          supabase
            .from('categories')
            .select('*')
            .eq('restaurant_id', RESTAURANT_ID)
            .order('sort_order'),
        ]);

      if (prodErr) throw new Error(prodErr.message);
      if (catErr)  throw new Error(catErr.message);

      setProducts(prods ?? []);
      setCategories(cats ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  // ── Computed ────────────────────────────────────────────────────────────
  const totalViews = products.reduce((sum, p) => sum + (p.views ?? 0), 0);
  const arProducts = products.filter((p) => p.ar_enabled).length;

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? '—';

  // ── Modal helpers ───────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingProduct(null);
    const f = emptyForm(categories[0]?.id ?? '');
    setForm(f);
    setIngredientInput('');
    setGlbFile(null);
    setModalOpen(true);
  };

  const openEdit = (p: DBProduct) => {
    setEditingProduct(p);
    const f = productToForm(p);
    setForm(f);
    setIngredientInput(f.ingredients);
    setGlbFile(null);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingProduct(null); setGlbFile(null); };

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleObjFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGlbFile(file);
    setForm((prev) => ({ ...prev, objFileName: file.name, model3d_url: '' }));
  };

  // ── Save ────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!form.name.trim() || !form.price) return;
    setSaving(true);
    setError(null);

    try {
      // 1. Upload .glb se houver arquivo novo selecionado
      let model3dUrl = form.model3d_url.trim() || null;
      if (glbFile) {
        const fileName = `${Date.now()}_${glbFile.name}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('models')
          .upload(fileName, glbFile, { upsert: false, contentType: 'model/gltf-binary' });
        if (uploadErr) throw new Error(`Upload do modelo: ${uploadErr.message}`);
        const { data: { publicUrl } } = supabase.storage
          .from('models')
          .getPublicUrl(uploadData.path);
        model3dUrl = publicUrl;
      }

      const ingArr = ingredientInput
        .split(',').map((s) => s.trim()).filter(Boolean);

      const payload = {
        restaurant_id: RESTAURANT_ID,
        name:          form.name.trim(),
        description:   form.description.trim() || null,
        price:         parseFloat(form.price) || 0,
        category_id:   form.category_id || null,
        ingredients:   ingArr.length ? ingArr : null,
        ar_enabled:    form.ar_enabled,
        image_url:     form.image_url.trim() || null,
        model3d_url:   model3dUrl,
        is_active:     true,
      };

      if (editingProduct) {
        const { error: err } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);
        if (err) throw new Error(err.message);
      } else {
        const { error: err } = await supabase
          .from('products')
          .insert({ ...payload, views: 0 });
        if (err) throw new Error(err.message);
      }

      closeModal();
      await fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  }, [form, glbFile, ingredientInput, editingProduct, fetchData]);

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    const { error: err } = await supabase.from('products').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // ── Render ──────────────────────────────────────────────────────────────
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
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold text-foreground">Painel Admin</h1>
            <p className="text-xs text-muted-foreground">Gerencie seu cardápio</p>
          </div>
          <button
            onClick={fetchData}
            className="p-2.5 glass rounded-xl hover:bg-surface-hover transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm mb-4"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-2">
          {[
            { label: 'Produtos',       value: products.length, icon: Package  },
            { label: 'Visualizações',  value: totalViews,      icon: Eye      },
            { label: 'Com AR',         value: arProducts,      icon: Sparkles },
          ].map(({ label, value, icon: Icon }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-4 text-center"
            >
              <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">
                {loading ? '—' : value}
              </p>
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

        {/* ── Product List ── */}
        {activeTab === 'products' && (
          <div className="mt-4 space-y-3">
            <button
              onClick={openAdd}
              disabled={loading}
              className="w-full py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Adicionar Produto
            </button>

            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border animate-pulse">
                    <div className="w-16 h-16 rounded-lg bg-secondary flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-secondary rounded w-1/2" />
                      <div className="h-2 bg-secondary rounded w-1/3" />
                      <div className="h-3 bg-secondary rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <AnimatePresence>
              {!loading && products.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border hover:border-primary/20 transition-all"
                >
                  <img
                    src={product.image_url ?? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=60'}
                    alt={product.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-secondary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {product.name}
                      </h3>
                      {product.ar_enabled && (
                        <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {categoryName(product.category_id)} · {product.views ?? 0} views
                    </p>
                    <p className="text-sm font-bold gold-text mt-0.5">
                      R$ {product.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openEdit(product)}
                      className="p-2 glass rounded-lg hover:bg-surface-hover transition-colors"
                      title="Editar produto"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 glass rounded-lg hover:bg-destructive/20 transition-colors"
                      title="Excluir produto"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {!loading && products.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Nenhum produto cadastrado ainda.
              </div>
            )}
          </div>
        )}

        {/* ── Analytics ── */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-3">
            <div className="glass rounded-xl p-6">
              <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Top Pratos
              </h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {[...products]
                    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
                    .slice(0, 5)
                    .map((p, i) => {
                      const maxViews = products.reduce((m, x) => Math.max(m, x.views ?? 0), 1);
                      return (
                        <div key={p.id} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-primary w-5">#{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-foreground truncate max-w-[180px]">{p.name}</span>
                              <span className="text-xs text-muted-foreground">{p.views ?? 0}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${((p.views ?? 0) / maxViews) * 100}%` }}
                                transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                                className="h-full rounded-full gold-gradient"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  {products.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">Sem dados ainda</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-2xl bg-card border-t border-border shadow-2xl"
            >
              <div className="sticky top-0 bg-card border-b border-border flex items-center justify-between px-5 py-4 z-10">
                <h2 className="text-base font-display font-bold text-foreground">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <button onClick={closeModal} className="p-2 glass rounded-lg hover:bg-surface-hover transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="px-5 py-5 space-y-5 pb-10">

                {/* Nome */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome *</label>
                  <input
                    type="text"
                    placeholder="Ex: Filé Mignon ao Molho de Vinho"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Descrição */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Descrição</label>
                  <textarea
                    placeholder="Descreva o prato, temperos, modo de preparo..."
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    rows={3}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>

                {/* Preço + Categoria */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preço (R$) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                      <input
                        type="number" min="0" step="0.01" placeholder="0,00"
                        value={form.price}
                        onChange={(e) => set('price', e.target.value)}
                        className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Categoria</label>
                    <div className="relative">
                      <select
                        value={form.category_id}
                        onChange={(e) => set('category_id', e.target.value)}
                        className="w-full appearance-none bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors pr-9"
                      >
                        <option value="">Sem categoria</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Ingredientes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ingredientes</label>
                  <input
                    type="text"
                    placeholder="Separados por vírgula: Filé, Vinho Tinto, Batata..."
                    value={ingredientInput}
                    onChange={(e) => setIngredientInput(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                  />
                  {ingredientInput.trim() && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {ingredientInput.split(',').map((s) => s.trim()).filter(Boolean).map((ing) => (
                        <span key={ing} className="glass px-2.5 py-1 rounded-full text-xs text-secondary-foreground">{ing}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* URL da imagem */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">URL da imagem</label>
                  <input
                    type="url" placeholder="https://..."
                    value={form.image_url}
                    onChange={(e) => set('image_url', e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Modelo 3D .glb */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Modelo 3D (.glb)</label>
                  <button
                    type="button"
                    onClick={() => objInputRef.current?.click()}
                    className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all flex items-center gap-3 text-sm"
                  >
                    <Box className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{form.objFileName || 'Selecionar arquivo .glb'}</span>
                    <Upload className="w-4 h-4 ml-auto flex-shrink-0" />
                  </button>
                  <input ref={objInputRef} type="file" accept=".glb" className="hidden" onChange={handleObjFile} />
                  {form.model3d_url && (
                    <p className="text-xs text-primary/70 flex items-center gap-1">
                      <Box className="w-3 h-3" />{form.model3d_url}
                    </p>
                  )}
                </div>

                {/* AR Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg gold-gradient">
                      <Sparkles className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Habilitar AR</p>
                      <p className="text-xs text-muted-foreground">Ver produto em realidade aumentada</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => set('ar_enabled', !form.ar_enabled)}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${form.ar_enabled ? 'gold-gradient' : 'bg-secondary'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${form.ar_enabled ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                {/* Erro inline */}
                {error && (
                  <p className="text-xs text-destructive flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />{error}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={closeModal}
                    disabled={saving}
                    className="flex-1 py-3.5 rounded-xl glass text-muted-foreground text-sm font-medium hover:bg-surface-hover transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSave}
                    disabled={!form.name.trim() || !form.price || saving}
                    className="flex-1 py-3.5 rounded-xl gold-gradient text-primary-foreground text-sm font-semibold gold-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                      : editingProduct ? 'Salvar Alterações' : 'Adicionar Produto'
                    }
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
