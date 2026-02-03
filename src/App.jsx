import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import StorytellerInterface from './components/StorytellerInterface';
import { extractTextFromPDF } from './utils/pdfParser';
import { speechEngine } from './utils/speechEngine';
import './index.css';

function App() {
  const [view, setView] = useState('upload'); // 'upload' | 'reader'
  const [pdfText, setPdfText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileProcess = async (file) => {
    setIsProcessing(true);
    try {
      const text = await extractTextFromPDF(file);
      setPdfText(text);
      if (text.trim().length > 0) {
        setView('reader');
      } else {
        alert("Couldn't extract text from this PDF. It might be an image-only PDF.");
      }
    } catch (err) {
      alert('Failed to parse PDF.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    setPdfText('');
    setView('upload');
  };

  return (
    <div className="app-wrapper">
      <div className="background-effects">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {view === 'upload' ? (
        <FileUpload onFileProcess={handleFileProcess} isProcessing={isProcessing} />
      ) : (
        <StorytellerInterface
          text={pdfText}
          onBack={handleBack}
          speech={speechEngine}
        />
      )}

      <style>{`
         .app-wrapper {
            position: relative;
            width: 100%;
            min-height: 100vh;
            display: flex;
            overflow: hidden;
         }

         .background-effects {
             position: absolute;
             top: 0;
             left: 0;
             width: 100%;
             height: 100%;
             z-index: -1;
             overflow: hidden;
         }

         .blob {
             position: absolute;
             border-radius: 50%;
             filter: blur(80px);
             opacity: 0.3;
         }

         .blob-1 {
             width: 400px;
             height: 400px;
             background: var(--accent-primary);
             top: -100px;
             left: -100px;
             animation: float 10s infinite alternate;
         }

         .blob-2 {
             width: 500px;
             height: 500px;
             background: #7928ca;
             bottom: -150px;
             right: -100px;
             animation: float 12s infinite alternate-reverse;
         }

         @keyframes float {
             0% { transform: translate(0, 0); }
             100% { transform: translate(50px, 50px); }
         }
       `}</style>
    </div>
  );
}

export default App;
