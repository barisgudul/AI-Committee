// components/steps/ToolResultStepView.tsx

import React from 'react';
import { ToolResultPayload } from '../../types/ProcessTypes';
import styles from '../../styles/Home.module.css';

interface ToolResultStepViewProps {
  payload: ToolResultPayload;
}

// React.memo ile gereksiz re-render'ları önle
export const ToolResultStepView: React.FC<ToolResultStepViewProps> = React.memo(({ payload }) => {
  const getToolIcon = (functionName: string) => {
    switch (functionName) {
      case 'performSearch':
        return '✅';
      case 'searchCodeExamples':
        return '✅';
      default:
        return '✅';
    }
  };

  const getToolName = (functionName: string) => {
    switch (functionName) {
      case 'performSearch':
        return 'Web Arama';
      case 'searchCodeExamples':
        return 'Kod Örnekleri';
      default:
        return functionName;
    }
  };

  return (
    <div className={styles.timelineContent}>
      <div className={styles.timelineHeader}>
        <span className={styles.timelineIcon}>
          {getToolIcon(payload.functionName)}
        </span>
        <span className={styles.timelineTitle}>
          {getToolName(payload.functionName)} tamamlandı
        </span>
      </div>
      {payload.message && (
        <div className={styles.timelineDetails}>
          {payload.message}
        </div>
      )}
      <div className={styles.timelineCode}>
        <pre>{payload.result}</pre>
      </div>
    </div>
  );
});

ToolResultStepView.displayName = 'ToolResultStepView';
