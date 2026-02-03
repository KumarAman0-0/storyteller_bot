import React, { useCallback, useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';

const FileUpload = ({ onFileProcess, isProcessing }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
            onFileProcess(files[0]);
        } else {
            alert('Please upload a valid PDF file.');
        }
    }, [onFileProcess]);

    const handleFileInput = useCallback((e) => {
        const files = e.target.files;
        if (files.length > 0) {
            onFileProcess(files[0]);
        }
    }, [onFileProcess]);

    return (
        <div className="upload-container">
            <div
                className={`upload-zone glass-panel ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="icon-wrapper">
                    {isProcessing ? (
                        <Loader2 className="animate-spin" size={48} color="var(--accent-primary)" />
                    ) : (
                        <Upload size={48} color="var(--accent-primary)" />
                    )}
                </div>

                <h2 className="glow-text">
                    {isProcessing ? 'Reading your story...' : 'Share a story with me'}
                </h2>

                <p className="upload-hint">
                    Drag & drop a PDF file here, or click to browse
                </p>

                <input
                    type="file"
                    id="file-input"
                    accept=".pdf"
                    onChange={handleFileInput}
                    disabled={isProcessing}
                    hidden
                />

                <label htmlFor="file-input" className="upload-button">
                    Select File
                </label>
            </div>

            <style>{`
        .upload-container {
          display: flex;
          justify-content: center;
          align-items: center;
          flex: 1;
          padding: 2rem;
        }

        .upload-zone {
          width: 100%;
          max-width: 500px;
          height: 350px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          transition: all 0.3s ease;
          padding: 2rem;
        }

        .upload-zone.drag-over {
          border-color: var(--accent-primary);
          background: rgba(88, 166, 255, 0.1);
          transform: scale(1.02);
        }

        .icon-wrapper {
          margin-bottom: 1.5rem;
          filter: drop-shadow(0 0 10px var(--accent-glow));
        }

        .upload-hint {
          color: var(--text-secondary);
          margin: 1rem 0 2rem;
        }

        .upload-button {
          background: var(--accent-primary);
          color: #fff;
          padding: 0.8rem 2rem;
          border-radius: 99px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .upload-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--accent-glow);
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default FileUpload;
