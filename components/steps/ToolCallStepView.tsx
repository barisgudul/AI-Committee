// components/steps/ToolCallStepView.tsx

import React from 'react';
import { ToolCallPayload } from '../../types/ProcessTypes';
import styles from '../../styles/Home.module.css';

interface ToolCallStepViewProps {
  payload: ToolCallPayload;
}

// React.memo ile gereksiz re-render'ları önle
export const ToolCallStepView: React.FC<ToolCallStepViewProps> = React.memo(({ payload }) => {
  const getToolIcon = (functionName: string) => {
    switch (functionName) {
      case 'performSearch':
        return '🔍';
      case 'searchCodeExamples':
        return '💻';
      default:
        return '🔧';
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
          {getToolName(payload.functionName)} çalıştırılıyor...
        </span>
      </div>
      {payload.message && (
        <div className={styles.timelineDetails}>
          {payload.message}
        </div>
      )}
      {Object.keys(payload.args).length > 0 && (
        <div className={styles.timelineCode}>
          <pre>{JSON.stringify(payload.args, null, 2)}</pre>
        </div>
      )}
    </div>
  );
});

ToolCallStepView.displayName = 'ToolCallStepView';
