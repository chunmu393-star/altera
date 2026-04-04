'use client';

import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { runMmoReadOnlySmokeTests } from '../lib/mmo-rpc-smoke';
import { runMmoMutationSmokeTests } from '../lib/mmo-rpc-mutation-smoke';
import {
  formatMmoSmokeResult,
  formatMmoMutationStrict,
} from '../lib/format-mmo-smoke-result';

type Props = {
  supabase: SupabaseClient;
  defenderId?: string;
  title?: string;
  description?: string;
  defaultMode?: 'readonly' | 'mutation';
};

export function MmoRpcSmokePanel({
  supabase,
  defenderId = '6a75740a-fdad-4f56-8a23-ca67a9d80955',
  title = 'MMO RPC Smoke Test',
  description = 'Read-only / mutation の両方を手元で確認できます。',
  defaultMode = 'readonly',
}: Props) {
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [lastMode, setLastMode] = useState<'readonly' | 'mutation'>(defaultMode);

  const handleReadOnly = async () => {
    setLoading(true);
    setLastMode('readonly');
    try {
      const result = await runMmoReadOnlySmokeTests(supabase, defenderId);
      setRaw(result);
      setReport(formatMmoSmokeResult(result));
    } finally {
      setLoading(false);
    }
  };

  const handleMutation = async () => {
    setLoading(true);
    setLastMode('mutation');
    try {
      const result = await runMmoMutationSmokeTests(supabase);
      setRaw(result);
      setReport(formatMmoMutationStrict(result));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <h2>{title}</h2>
      <p className="description">{description}</p>

      <div className="actions">
        <button data-testid="run-readonly" onClick={handleReadOnly} disabled={loading}>
          Read-only smoke
        </button>
        <button data-testid="run-mutation" onClick={handleMutation} disabled={loading}>
          Mutation smoke
        </button>
      </div>

      {report && (
        <div className="report">
          <h3 data-testid="overall-status">
            総合判定: {report.overall} ({lastMode})
          </h3>
          <p>
            PASS: {report.counts.pass} / 未確認: {report.counts.unverified} /
            要修正: {report.counts.needsFix}
          </p>

          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>key</th>
                  <th>label</th>
                  <th>category</th>
                  <th>detail</th>
                </tr>
              </thead>
              <tbody>
                {report.checks.map((c: any) => (
                  <tr key={c.key} data-testid={`row-${c.key}`}>
                    <td>{c.key}</td>
                    <td>{c.label}</td>
                    <td>{c.category}</td>
                    <td>{c.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <details>
        <summary>raw result</summary>
        <pre className="raw">{JSON.stringify(raw, null, 2)}</pre>
      </details>
    </div>
  );
}
