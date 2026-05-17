import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, AlertCircle, Hand, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ARViewerModalProps {
  open: boolean;
  onClose: () => void;
  modelUrl: string;
  itemName: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        ar?: boolean;
        'ar-placement'?: string;
        'ar-modes'?: string;
        'ar-scale'?: string;
        'ios-src'?: string;
        'camera-controls'?: boolean;
        'auto-rotate'?: boolean;
        'rotation-per-second'?: string;
        'shadow-intensity'?: string;
        'environment-image'?: string;
        exposure?: string;
        style?: React.CSSProperties;
      }, HTMLElement>;
    }
  }
}

const ARViewerModal: React.FC<ARViewerModalProps> = ({ open, onClose, modelUrl, itemName }) => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const viewerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!document.querySelector('script[src*="model-viewer"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, []);

  // Reset state when opening a new model
  useEffect(() => {
    if (open) {
      setLoading(true);
      setProgress(0);
      setError(false);
      setInteracted(false);
    }
  }, [open, modelUrl]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const handleProgress = (e: any) => {
      setProgress(Math.round(e.detail.totalProgress * 100));
    };

    const handleLoad = () => {
      setLoading(false);
    };

    const handleError = () => {
      setError(true);
      setLoading(false);
    };

    const handleInteraction = () => {
      setInteracted(true);
    };

    viewer.addEventListener('progress', handleProgress);
    viewer.addEventListener('load', handleLoad);
    viewer.addEventListener('error', handleError);
    viewer.addEventListener('camera-change', handleInteraction);

    return () => {
      viewer.removeEventListener('progress', handleProgress);
      viewer.removeEventListener('load', handleLoad);
      viewer.removeEventListener('error', handleError);
      viewer.removeEventListener('camera-change', handleInteraction);
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden bg-background/95 backdrop-blur-md border-border/50">
        <DialogHeader className="p-4 pb-2 border-b border-border/30 bg-secondary/30">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <span className="bg-primary/20 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-inner shadow-primary/20">🧊</span>
            {itemName}
          </DialogTitle>
        </DialogHeader>

        <div className="w-full aspect-square relative bg-gradient-to-b from-secondary/40 to-background flex flex-col items-center justify-center">
          
          {/* Error State */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 z-20 text-center p-6 bg-background/80 backdrop-blur-sm">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-2">
                <AlertCircle className="w-8 h-8" />
              </div>
              <p className="font-semibold text-lg text-foreground">Failed to load 3D Model</p>
              <p className="text-sm text-muted-foreground">The model file might be corrupted or your connection dropped. Please try again later.</p>
            </div>
          )}

          {/* 3D Model Viewer */}
          {open && !error && (
            <model-viewer
              ref={viewerRef as any}
              src={modelUrl}
              alt={`3D model of ${itemName}`}
              ar
              ar-placement="floor"
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="auto"
              camera-controls
              auto-rotate
              rotation-per-second="30deg"
              shadow-intensity="1.5"
              environment-image="neutral"
              exposure="1.2"
              style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 10, opacity: loading ? 0 : 1, transition: 'opacity 0.5s ease' }}
            >
              {/* Premium AR Button */}
              <button
                slot="ar-button"
                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-black/90 backdrop-blur-md text-foreground border border-border/50 font-bold px-6 py-3.5 rounded-full shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)] flex items-center gap-2.5 hover:scale-105 active:scale-95 transition-all outline-none animate-pulse focus:animate-none"
              >
                <div className="bg-primary/20 text-primary rounded-full p-1 border border-primary/20">
                  <Maximize className="w-4 h-4" />
                </div>
                View in your space
              </button>
            </model-viewer>
          )}

          {/* Loading State Overlay */}
          <AnimatePresence>
            {loading && !error && (
              <motion.div 
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
              >
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-primary/30 animate-spin" />
                  <Loader2 className="w-12 h-12 text-primary animate-spin absolute inset-0" style={{ clipPath: `inset(${100 - progress}% 0 0 0)` }} />
                </div>
                <p className="mt-4 font-semibold text-primary animate-pulse">Warming up the kitchen...</p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">{progress}% loaded</p>
                
                <div className="w-48 h-1.5 bg-secondary rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive Gestures Hint */}
          <AnimatePresence>
            {!loading && !error && !interacted && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute bottom-24 z-15 pointer-events-none flex flex-col items-center"
              >
                <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm shadow-xl border border-white/10">
                  <Hand className="w-4 h-4 animate-bounce" />
                  <span>Drag to rotate & pinch to zoom</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ARViewerModal;
