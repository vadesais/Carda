import { motion } from 'framer-motion';
import { QrCode, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MenuHeader = () => {
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between py-4"
    >
      <div>
        <h1 className="text-2xl font-display font-bold gold-text">MenuAR</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Cardápio Digital Interativo</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2.5 glass rounded-xl hover:bg-surface-hover transition-colors">
          <QrCode className="w-5 h-5 text-muted-foreground" />
        </button>
        <button
          onClick={() => navigate('/admin')}
          className="p-2.5 glass rounded-xl hover:bg-surface-hover transition-colors"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </motion.header>
  );
};

export default MenuHeader;
