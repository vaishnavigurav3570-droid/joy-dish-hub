import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ARViewerModalProps {
  open: boolean;
  onClose: () => void;
  modelUrl: string;
  itemName: string;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        ar?: boolean;
        'ar-placement'?: string;
        'ar-modes'?: string;
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
              camera-controls
              auto-rotate
              shadow-intensity="1"
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ARViewerModal;
