// components/StatusIcon.tsx

import React from 'react';
import { StepStatus } from '../types/ProcessTypes';
import styles from '../styles/Home.module.css';

interface StatusIconProps {
  status: StepStatus;
}

// React.memo ile gereksiz re-render'ları önle
export const StatusIcon: React.FC<StatusIconProps> = React.memo(({ status }) => {
  const getIcon = () => {
    switch (status) {
      case 'running':
        return '⏳';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getClassName = () => {
    switch (status) {
      case 'running':
        return styles.statusRunning;
      case 'completed':
        return styles.statusCompleted;
      case 'error':
        return styles.statusError;
      default:
        return styles.statusRunning;
    }
  };

  return (
    <span className={`${styles.statusIcon} ${getClassName()}`}>
      {getIcon()}
    </span>
  );
});

StatusIcon.displayName = 'StatusIcon';
