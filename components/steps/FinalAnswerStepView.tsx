// components/steps/FinalAnswerStepView.tsx

import React from 'react';
import { FinalAnswerPayload } from '../../types/ProcessTypes';
import styles from '../../styles/Home.module.css';

interface FinalAnswerStepViewProps {
  payload: FinalAnswerPayload;
}

// React.memo ile gereksiz re-render'ları önle
export const FinalAnswerStepView: React.FC<FinalAnswerStepViewProps> = React.memo(({ payload }) => {
  return (
    <div className={styles.timelineContent}>
      <div className={styles.timelineHeader}>
        <span className={styles.timelineIcon}>📝</span>
        <span className={styles.timelineTitle}>
          Nihai Cevap {payload.isComplete ? '(Tamamlandı)' : '(Yazılıyor...)'}
        </span>
      </div>
      <div className={styles.timelineAnswer}>
        {payload.content}
      </div>
    </div>
  );
});

FinalAnswerStepView.displayName = 'FinalAnswerStepView';
