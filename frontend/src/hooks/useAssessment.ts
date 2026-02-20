"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  Assessment,
  AssessmentTemplate,
  AssessmentResponse,
} from "@/lib/types";

interface UseAssessmentResult {
  assessment: Assessment | undefined;
  template: AssessmentTemplate | undefined;
  responses: AssessmentResponse[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook using React Query to fetch assessment data, its template, and responses.
 */
export function useAssessment(assessmentId: string): UseAssessmentResult {
  const {
    data: assessment,
    isLoading: loadingAssessment,
    error: assessmentError,
  } = useQuery({
    queryKey: ["assessment", assessmentId],
    queryFn: () => apiClient.get<Assessment>(`/assessments/${assessmentId}`),
    enabled: !!assessmentId,
  });

  const {
    data: template,
    isLoading: loadingTemplate,
    error: templateError,
  } = useQuery({
    queryKey: ["template", assessment?.template_id],
    queryFn: () =>
      apiClient.get<AssessmentTemplate>(
        `/assessments/templates/${assessment!.template_id}`
      ),
    enabled: !!assessment?.template_id,
  });

  const {
    data: responses,
    isLoading: loadingResponses,
    error: responsesError,
    refetch: refetchResponses,
  } = useQuery({
    queryKey: ["responses", assessmentId],
    queryFn: () =>
      apiClient.get<AssessmentResponse[]>(
        `/assessments/${assessmentId}/responses`
      ),
    enabled: !!assessmentId,
  });

  const isLoading = loadingAssessment || loadingTemplate || loadingResponses;
  const error = assessmentError || templateError || responsesError;

  return {
    assessment,
    template,
    responses,
    isLoading,
    error: error as Error | null,
    refetch: refetchResponses,
  };
}
