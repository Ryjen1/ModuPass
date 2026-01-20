'use client';

import { useKRNL, useNodeConfig, WorkflowStatusCode } from '@krnl-dev/sdk-react-7702';
import { useCallback } from 'react';
import { toast } from 'sonner';

export type WorkflowValue = string | number | boolean | null | Record<string, unknown>;

export interface WorkflowDSL extends Record<string, unknown> {
  action: string;
  params: Record<string, WorkflowValue>;
}

export interface WorkflowTemplate extends Record<string, unknown> {
  action: string;
  params: Record<string, string>;
}

export type WorkflowParams = Record<string, string | number | boolean>;

/**
 * Hook for executing KRNL Workflows
 * 
 * Provides utilities to execute workflows directly or from templates
 * with automatic node configuration management.
 */
export function useKRNLWorkflow() {
  const {
    executeWorkflow,
    executeWorkflowFromTemplate,
    resetSteps,
    isAuthorized,
    statusCode,
    error,
    steps,
    currentStep,
  } = useKRNL();

  const { getConfig } = useNodeConfig();

  /**
   * Execute a basic workflow
   */
  const runWorkflow = useCallback(
    async (workflowDSL: WorkflowDSL) => {


      try {
        resetSteps(); // Clear previous workflow state

        const result = await executeWorkflow(workflowDSL as any);

        // Handle result based on statusCode
        if (statusCode === WorkflowStatusCode.SUCCESS) {
          console.log('✅ Workflow completed successfully');
        } else if (error) {
          console.error('❌ Workflow failed:', error);
          throw new Error(error);
        }

        return result;
      } catch (err) {
        console.error('Failed to execute workflow:', err);
        throw err;
      }
    },
    [isAuthorized, resetSteps, executeWorkflow, statusCode, error]
  );

  /**
   * Execute workflow from template with node config
   * 
   * @param workflowId - The workflow ID from KRNL Studio
   * @param params - Parameters to inject into the workflow template
   */
  const runTemplateWorkflow = useCallback(
    async (workflowId: string, params: WorkflowParams) => {
      if (!isAuthorized) {
        toast.error('Account not authorized. Please authorize first.', { id: 'workflow-auth-error' });
        throw new Error('Account is not authorized. Please authorize first.');
      }

      try {
        resetSteps(); // Clear previous workflow state

        const result = await executeWorkflowFromTemplate(workflowId as any, params as any);

        // Handle result based on statusCode
        if (statusCode === WorkflowStatusCode.SUCCESS) {
          console.log('✅ Template workflow completed successfully');
        } else if (error) {
          console.error('❌ Template workflow failed:', error);
          throw new Error(error);
        }

        return result;
      } catch (err) {
        console.error('Failed to execute template workflow:', err);
        throw err;
      }
    },
    [isAuthorized, resetSteps, executeWorkflowFromTemplate, statusCode, error]
  );

  /**
   * Get the current node configuration
   */
  const fetchNodeConfig = useCallback(async () => {
    try {
      const nodeConfig = await getConfig();
      return nodeConfig;
    } catch (err) {
      console.error('Failed to fetch node configuration:', err);
      throw err;
    }
  }, [getConfig]);

  return {
    runWorkflow,
    runTemplateWorkflow,
    fetchNodeConfig,
    isAuthorized,
    statusCode,
    error,
    steps,
    currentStep,
    resetSteps,
  };
}

export default useKRNLWorkflow;
