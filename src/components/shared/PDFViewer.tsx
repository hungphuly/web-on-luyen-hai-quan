'use client'

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Fix worker for Next.js App Router
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PDFViewer({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState(1.0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  }

  const previousPage = () => {
    if (pageNumber > 1) changePage(-1);
  }

  const nextPage = () => {
    if (numPages && pageNumber < numPages) changePage(1);
  }
  
  const zoomIn = () => setScale(prev => Math.min(prev + 0.3, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.3, 0.5));

  return (
    <div className="flex flex-col h-full w-full bg-gray-100 overflow-hidden relative" onContextMenu={(e) => e.preventDefault()}>
      {/* Toolbar */}
      <div className="bg-slate-800 text-white p-2 flex items-center justify-between z-10 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <button 
            onClick={previousPage} 
            disabled={pageNumber <= 1}
            className="p-2 hover:bg-slate-700 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium w-28 text-center bg-slate-700 py-1 px-2 rounded">
            Trang {pageNumber} / {numPages || '--'}
          </span>
          <button 
            onClick={nextPage} 
            disabled={!numPages || pageNumber >= numPages}
            className="p-2 hover:bg-slate-700 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={zoomOut} className="p-2 hover:bg-slate-700 rounded-md transition-colors" title="Thu nhỏ">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="p-2 hover:bg-slate-700 rounded-md transition-colors" title="Phóng to">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* PDF Document Container */}
      <div className="flex-1 overflow-auto bg-gray-200 relative flex justify-center custom-scrollbar pb-10">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          }
          error={
            <div className="absolute inset-0 flex items-center justify-center text-red-500 font-medium bg-white p-4 rounded-xl m-10 text-center shadow">
              Lỗi tải tài liệu. Có thể do kết nối mạng hoặc file không hợp lệ.
            </div>
          }
          className="mt-4 shadow-xl select-none"
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale} 
            renderTextLayer={false} 
            renderAnnotationLayer={false}
            loading={
              <div className="w-[600px] h-[800px] flex items-center justify-center bg-white shadow-xl max-w-full max-h-full">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            }
          />
        </Document>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #e2e8f0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
        
        /* Prevent PDF selection and save */
        .react-pdf__Page__canvas {
          margin: 0 auto;
          pointer-events: none; /* This prevents long press to save image on some mobile browsers */
        }
      `}} />
    </div>
  );
}
