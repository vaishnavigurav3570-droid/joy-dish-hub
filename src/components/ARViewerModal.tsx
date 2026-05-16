import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
        'shadow-intensity'?: string;
        style?: React.CSSProperties;
      }, HTMLElement>;
    }
  }
}

const ARViewerModal: React.FC<ARViewerModalProps> = ({ open, onClose, modelUrl, itemName }) => {
  useEffect(() => {
    if (!document.querySelector('script[src*="model-viewer"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            🧊 {itemName} — 3D View
          </DialogTitle>
        </DialogHeader>
        <div className="w-full aspect-square bg-secondary/30">
          {open && (
            <model-viewer
              src={modelUrl}
              alt={`3D model of ${itemName}`}
              ar
              ar-placement="floor"
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="auto"
              camera-controls
              auto-rotate
              shadow-intensity="1"
              style={{ width: '100%', height: '100%', position: 'relative' }}
            >
              <button
                slot="ar-button"
                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-extrabold px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
              >
                📸 Place on Table (Open Camera)
              </button>
            </model-viewer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ARViewerModal;
