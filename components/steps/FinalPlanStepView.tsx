// components/steps/FinalPlanStepView.tsx

import React from 'react';
import { FinalPlanPayload } from '../../types/ProcessTypes';
import styles from '../../styles/Home.module.css';

interface FinalPlanStepViewProps {
  payload: FinalPlanPayload;
}

// React.memo ile gereksiz re-render'ları önle
export const FinalPlanStepView: React.FC<FinalPlanStepViewProps> = React.memo(({ payload }) => {
  const { plan } = payload;

  return (
    <div className={styles.timelineContent}>
      <div className={styles.timelineHeader}>
        <span className={styles.timelineIcon}>📋</span>
        <span className={styles.timelineTitle}>
          Nihai Plan (Tamamlandı)
        </span>
      </div>
      
      <div className={styles.planContainer}>
        <div className={styles.planSection}>
          <h4 className={styles.planSectionTitle}>Nihai Karar</h4>
          <p className={styles.planText}>{plan.finalDecision}</p>
        </div>

        <div className={styles.planSection}>
          <h4 className={styles.planSectionTitle}>Gerekçe</h4>
          <p className={styles.planText}>{plan.justification}</p>
        </div>

        <div className={styles.planSection}>
          <h4 className={styles.planSectionTitle}>Uygulama Planı</h4>
          <div className={styles.implementationSteps}>
            {plan.implementationPlan.map((step, index) => (
              <div key={index} className={styles.implementationStep}>
                <div className={styles.stepNumber}>{step.step}</div>
                <div className={styles.stepContent}>
                  <h5 className={styles.stepTitle}>{step.title}</h5>
                  <p className={styles.stepDetails}>{step.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

FinalPlanStepView.displayName = 'FinalPlanStepView';
