'use client';
import { useEffect, useState } from 'react';
import { loaders } from './.generated/loaders';
import type { FactoryPaper } from './factory-papers';
import type { ResearchReview } from './research-reviews';
type Detail = { paper: FactoryPaper; review?: ResearchReview };
const cache = new Map<string, Detail>();
const pending = new Map<string, Promise<Detail>>();
export function preparePaper(id: string) {
  if (cache.has(id)) return Promise.resolve(cache.get(id)!);
  if (pending.has(id)) return pending.get(id)!;
  const load = loaders[id];
  if (!load) return Promise.reject(new Error('Unknown paper'));
  const request = load().then(
    (value) => {
      const detail = value as Detail;
      cache.set(id, detail);
      pending.delete(id);
      return detail;
    },
    (error: unknown) => {
      pending.delete(id);
      throw error;
    },
  );
  pending.set(id, request);
  return request;
}
export function usePaperDetail(id?: string) {
  const [state, setState] = useState<{ id?: string; detail?: Detail; error?: boolean }>({});
  useEffect(() => {
    if (!id || !loaders[id]) return;
    let current = true;
    void preparePaper(id).then(
      (detail) => {
        if (current) setState({ id, detail });
      },
      () => {
        if (current) setState({ id, error: true });
      },
    );
    return () => {
      current = false;
    };
  }, [id]);
  return {
    detail: id ? (cache.get(id) ?? (state.id === id ? state.detail : undefined)) : undefined,
    error: state.id === id && !!state.error,
  };
}
