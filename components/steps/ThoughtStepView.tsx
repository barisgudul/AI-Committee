// components/steps/ThoughtStepView.tsx

import React from 'react';
import { ThoughtPayload } from '../../types/ProcessTypes';
import styles from '../../styles/Home.module.css';

interface ThoughtStepViewProps {
  payload: ThoughtPayload;
}

// React.memo ile gereksiz re-render'ları önle
export const ThoughtStepView: React.FC<ThoughtStepViewProps> = React.memo(({ payload }) => {
  const getPhaseIcon = (phase?: string) => {
    switch (phase) {
      case 'analysis':
        return '🔍';
      case 'critique':
        return '🤔';
      case 'synthesis':
        return '💡';
      default:
        return '💭';
    }
  };

  const getPhaseText = (phase?: string) => {
    switch (phase) {
      case 'analysis':
        return 'Analiz';
      case 'critique':
        return 'Eleştiri';
      case 'synthesis':
        return 'Sentez';
      default:
        return 'Düşünüyor';
    }
  };

  return (
    <div className={styles.timelineContent}>
      <div className={styles.timelineHeader}>
        <span className={styles.timelineIcon}>
          {getPhaseIcon(payload.phase)}
        </span>
        <span className={styles.timelineTitle}>
          [{payload.source}] {getPhaseText(payload.phase)}
        </span>
      </div>
      <div className={styles.timelineDetails}>
        {payload.message}
      </div>
    </div>
  );
});

ThoughtStepView.displayName = 'ThoughtStepView';
