/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Plus, Box } from 'lucide-react';
import { MenuItem } from '@/types/order';

export function UserMenuViewer({ categories, activeCategory, setActiveCategory, availableMenu, getCartQty, addToCart, setArModel }: any) {
  if (availableMenu.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-4xl">🍽️</p>
        <p className="text-muted-foreground font-medium">No items available right now</p>
        <p className="text-xs text-muted-foreground">Check back soon — we're updating the menu!</p>
      </div>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat: string) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
            activeCategory === cat
              ? 'gradient-warm text-primary-foreground shadow-lg shadow-primary/20 scale-105'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
          }`}>
            {cat}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={activeCategory} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="grid grid-cols-2 gap-4">
          {availableMenu.filter((i: MenuItem) => i.category === activeCategory).map((item: MenuItem, idx: number) => {
            const qty = getCartQty(item.id);
            const hasAR = true;
            const finalArUrl = (item as unknown as { ar_model_url?: string }).ar_model_url || 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb';
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="overflow-hidden rounded-2xl hover:food-card-shadow transition-all duration-300 group cursor-pointer border-border/50 hover:border-primary/30 hover:-translate-y-1 active:scale-[0.98]" onClick={() => addToCart(item)}>
                  <div className="relative h-36 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-secondary text-5xl">${item.emoji}</div>`;
                      }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary text-5xl">{item.emoji}</div>
                    )}
                    <AnimatePresence>
                      {qty > 0 && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute top-2 right-2 gradient-warm text-primary-foreground text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg">
                          {qty}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-3">
                      <p className="text-white font-bold text-sm drop-shadow-lg">{item.name}</p>
                    </div>
                    {hasAR && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setArModel({ url: finalArUrl, name: item.name }); }}
                        className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg hover:scale-105 transition-transform"
                      >
                        <Box className="h-3 w-3" /> View in AR 🧊
                      </button>
                    )}
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <p className="text-primary font-extrabold text-lg">₹{item.price}</p>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      qty > 0 ? 'gradient-warm text-primary-foreground shadow-md' : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                    }`}>
                      <Plus className="h-4 w-4" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
