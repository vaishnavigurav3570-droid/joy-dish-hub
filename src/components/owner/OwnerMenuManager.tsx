import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { MenuItem } from '@/types/order';

interface OwnerMenuManagerProps {
  menu: MenuItem[];
  arFileRef: React.RefObject<HTMLInputElement>;
  handleARUpload: (menuItemId: string, file: File) => void;
  uploadingAR: string | null;
  toggleMenuAvailability: (id: string) => void;
}

export default function OwnerMenuManager({
  menu, arFileRef, handleARUpload, uploadingAR, toggleMenuAvailability
}: OwnerMenuManagerProps) {
  return (
    <div className="space-y-2 mt-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground font-medium">Toggle availability & upload 3D models</p>
        <Badge className="bg-secondary text-muted-foreground rounded-full text-xs">{menu.length} items</Badge>
      </div>
      <input ref={arFileRef} type="file" accept=".glb" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        const itemId = arFileRef.current?.dataset.itemId;
        if (file && itemId) handleARUpload(itemId, file);
        e.target.value = '';
      }} />
      <Card className="rounded-2xl overflow-hidden divide-y divide-border/30">
        {menu.map((item: MenuItem, idx: number) => (
          <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }}
            className="flex items-center justify-between py-3.5 px-4 hover:bg-secondary/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`text-2xl w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center ${!item.available ? 'opacity-40 grayscale' : ''}`}>
                {item.emoji}
              </div>
              <div>
                <p className={`font-semibold text-sm ${item.available ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{item.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{item.category}</span>
                  <span className="text-xs font-bold text-primary">₹{item.price}</span>
                  {(item as unknown as { ar_model_url?: string }).ar_model_url && (
                    <Badge className="bg-accent/15 text-accent text-[9px] rounded-full px-1.5 py-0 font-semibold">🧊 3D</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm" variant="ghost"
                className="h-8 w-8 p-0 rounded-lg hover:bg-secondary"
                disabled={uploadingAR === item.id}
                onClick={() => {
                  if (arFileRef.current) {
                    arFileRef.current.dataset.itemId = item.id;
                    arFileRef.current.click();
                  }
                }}
              >
                {uploadingAR === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              </Button>
              <Switch checked={item.available} onCheckedChange={() => toggleMenuAvailability(item.id)} />
            </div>
          </motion.div>
        ))}
      </Card>
    </div>
  );
}
