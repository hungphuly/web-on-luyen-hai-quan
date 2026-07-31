'use client'

import { useState, useEffect, useRef } from 'react';
import { Loader2, X, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { layTamThoiLinkXemFile } from '@/lib/shared/actions/file-actions';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfViewerProps {
  fileKey: string;
  onClose?: () => void;
  isModal?: boolean;
}

export function PdfViewer({ fileKey, onClose, isModal = false }: PdfViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale] = useState<number>(1.2);
  const [windowWidth, setWindowWidth] = useState<number | undefined>(undefined);

  // Anti-fast-forward state
  const [countdown, setCountdown] = useState<number>(0);
  const [maxUnlockedPage, setMaxUnlockedPage] = useState<number>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    
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

    // Auto refresh presigned URL every 9 minutes
    const interval = setInterval(fetchUrl, 540000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fileKey]);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle countdown when page changes
  useEffect(() => {
    // Chỉ đếm ngược khi đang ở trang lớn nhất chưa được unlock trang tiếp theo
    if (pageNumber === maxUnlockedPage) {
      setCountdown(15);
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setMaxUnlockedPage(current => Math.max(current, pageNumber + 1));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pageNumber, maxUnlockedPage]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
    setMaxUnlockedPage(1);
  }

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    if (pageNumber < maxUnlockedPage) {
      setPageNumber((prev) => Math.min(prev + 1, numPages));
    }
  };

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
        <div className="flex-1 overflow-auto flex flex-col items-center bg-gray-200/50 p-4 relative select-none">
           <Document
              file={signedUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<Loader2 className="w-8 h-8 animate-spin text-primary mx-auto my-12" />}
              error={<div className="text-red-500 mt-4">Lỗi khi đọc file PDF</div>}
              className="flex flex-col items-center w-full"
            >
              {numPages > 0 && (
                <div className="bg-white shadow-lg border border-gray-200 rounded-sm mb-4 inline-block w-auto mx-auto pointer-events-none">
                  <Page 
                    pageNumber={pageNumber} 
                    scale={scale} 
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="max-w-full"
                    width={windowWidth && windowWidth < 768 ? windowWidth - 64 : undefined}
                  />
                </div>
              )}
            </Document>

            {/* Chống Download/In bằng CSS overlay block right-click */}
            <div className="absolute inset-0 z-10 bg-transparent" onContextMenu={(e) => e.preventDefault()}></div>
        </div>
      )}

      {/* Controller Bottom Bar */}
      {numPages > 0 && (
        <div className="bg-white border-t p-4 flex items-center justify-between gap-4 z-20 shrink-0">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-medium rounded-lg flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Trang trước</span>
          </button>

          <div className="text-sm font-medium text-gray-600">
            Trang {pageNumber} / {numPages}
          </div>

          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages || pageNumber >= maxUnlockedPage}
            className={`px-4 py-2 font-medium rounded-lg flex items-center gap-2 transition-colors
              ${pageNumber >= maxUnlockedPage 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }
              ${pageNumber >= numPages ? 'opacity-0 pointer-events-none' : ''}
            `}
          >
            {pageNumber >= maxUnlockedPage ? (
              <>
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Sang trang sau: </span>{countdown}s
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Trang tiếp</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
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
          <div className="flex-1 p-0 md:p-4 bg-gray-200 relative">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return content;
}
