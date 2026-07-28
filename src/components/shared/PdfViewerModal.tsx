'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { PdfViewer } from './PdfViewer';

export function PdfViewerModal({ fileKey, buttonText = "Xem tài liệu đính kèm" }: { fileKey: string, buttonText?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5"
      >
        <FileText className="w-4 h-4" />
        {buttonText}
      </Button>

      {isOpen && (
        <PdfViewer 
          fileKey={fileKey} 
          isModal={true} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}
