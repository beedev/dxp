import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';

export function useProjectTemplates() {
  return useQuery({
    queryKey: ['projects', 'templates'],
    queryFn: () => apiFetch('/projects'),
  });
}

export function useProjectTemplate(id: string) {
  return useQuery({
    queryKey: ['projects', 'templates', id],
    queryFn: () => apiFetch(`/projects/${id}`),
    enabled: !!id,
  });
}

export function useMaterialsList(id: string) {
  return useQuery({
    queryKey: ['projects', 'materials', id],
    queryFn: () => apiFetch(`/projects/${id}/materials`),
    enabled: !!id,
  });
}
