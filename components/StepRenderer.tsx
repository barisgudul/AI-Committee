// components/StepRenderer.tsx

import React from 'react';
import { ProcessStep } from '../types/ProcessTypes';
import { ThoughtStepView } from './steps/ThoughtStepView';
import { ToolCallStepView } from './steps/ToolCallStepView';
import { ToolResultStepView } from './steps/ToolResultStepView';
import { FinalAnswerStepView } from './steps/FinalAnswerStepView';
import { FinalPlanStepView } from './steps/FinalPlanStepView';

interface StepRendererProps {
  step: ProcessStep;
}

// React.memo ile gereksiz re-render'ları önle
export const StepRenderer: React.FC<StepRendererProps> = React.memo(({ step }) => {
  switch (step.type) {
    case 'THOUGHT':
      return <ThoughtStepView payload={step.payload} />;
    case 'TOOL_CALL':
      return <ToolCallStepView payload={step.payload} />;
    case 'TOOL_RESULT':
      return <ToolResultStepView payload={step.payload} />;
    case 'FINAL_ANSWER':
      return <FinalAnswerStepView payload={step.payload} />;
    case 'FINAL_PLAN':
      return <FinalPlanStepView payload={step.payload} />;
    default:
      return null;
  }
});

StepRenderer.displayName = 'StepRenderer';
