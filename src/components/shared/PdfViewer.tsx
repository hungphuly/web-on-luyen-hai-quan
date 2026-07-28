'use client'

import { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { layTamThoiLinkXemFile } from '@/lib/shared/actions/file-actions';

interface PdfViewerProps {
  fileKey: string;
  onClose?: () => void;
  isModal?: boolean;
}

export function PdfViewer({ fileKey, onClose, isModal = false }: PdfViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    // Check if it's already a full URL (legacy compatibility for old supabase URLs)
    if (fileKey.startsWith('http://') || fileKey.startsWith('https://')) {
      setSignedUrl(fileKey);
      setIsLoading(false);
      return;
    }

    const fetchUrl = async () => {
      try {
        const url = await layTamThoiLinkXemFile(fileKey);
        if (isMounted) {
          setSignedUrl(url);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Không thể tải tài liệu');
          setIsLoading(false);
        }
      }
    };

    fetchUrl();

    // Auto refresh presigned URL every 9 minutes (540000 ms) because it expires in 10 minutes
    const interval = setInterval(fetchUrl, 540000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fileKey]);

  const content = (
    <div className="relative w-full h-full min-h-[500px] flex flex-col bg-gray-100 rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-gray-500">Đang tải tài liệu bảo mật...</p>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 z-10 text-red-600 p-4 text-center">
          <p className="font-bold mb-2">Lỗi tải tài liệu</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {signedUrl && (
        <iframe
          src={`${signedUrl}#toolbar=0&navpanes=0&scrollbar=1`}
          className="w-full h-full flex-1 border-0"
          title="Trình xem tài liệu PDF"
          onLoad={() => setIsLoading(false)}
        />
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 md:p-6">
        <div className="bg-white w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <h3 className="font-bold text-gray-800">Tài liệu đính kèm</h3>
            {onClose && (
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
          <div className="flex-1 p-0 md:p-4 bg-gray-200">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return content;
}
