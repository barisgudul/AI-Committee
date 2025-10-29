// components/CodeViewer.tsx

import React, { useState } from 'react';
import styles from '../styles/CodeViewer.module.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { UploadedFile, formatFileSize } from '../types/FileTypes';

interface CodeViewerProps {
  file: UploadedFile;
  content: string;
  onClose: () => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ file, content, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Kopyalama hatası:', err);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Line count
  const lineCount = content.split('\n').length;

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.fileInfo}>
            <h3 className={styles.fileName}>{file.name}</h3>
            <div className={styles.fileMeta}>
              {file.path !== file.name && (
                <span className={styles.filePath}>{file.path}</span>
              )}
              <span className={styles.separator}>•</span>
              <span>{formatFileSize(file.size)}</span>
              <span className={styles.separator}>•</span>
              <span>{lineCount} satır</span>
              {file.language && (
                <>
                  <span className={styles.separator}>•</span>
                  <span className={styles.language}>{file.language}</span>
                </>
              )}
            </div>
          </div>
          <div className={styles.actions}>
            <button 
              className={styles.copyButton}
              onClick={handleCopy}
              title="Kopyala"
            >
              {copied ? '✓ Kopyalandı' : '📋 Kopyala'}
            </button>
            <button 
              className={styles.closeButton}
              onClick={onClose}
              title="Kapat"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className={styles.content}>
          <SyntaxHighlighter
            language={file.language || 'text'}
            style={vscDarkPlus}
            showLineNumbers={true}
            wrapLines={true}
            lineNumberStyle={{ 
              minWidth: '3em',
              paddingRight: '1em',
              color: '#666',
              userSelect: 'none'
            }}
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '0.9rem',
              lineHeight: '1.5',
              maxHeight: 'calc(80vh - 120px)',
              overflow: 'auto',
              background: '#1e1e1e'
            }}
          >
            {content}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
};

