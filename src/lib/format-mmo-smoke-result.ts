export type SmokeSummaryItem = {
  name?: string;
  step?: string;
  ok: boolean;
  status?: string | null;
  error?: unknown;
};

export type SmokeResult = {
  ok?: boolean;
  summary?: SmokeSummaryItem[];
  results?: Array<{
    name: string;
    ok: boolean;
    data: unknown;
    error: unknown;
  }>;
  steps?: Array<{
    step: string;
    ok: boolean;
    data: unknown;
    error: unknown;
  }>;
  error?: unknown;
};

export type MmoFormattedCheck = {
  key: string;
  label: string;
  category: 'PASS' | '未確認' | '要修正';
  detail: string;
};

export type MmoFormattedReport = {
  overall: 'PASS' | '未確認あり' | '要修正あり';
  counts: {
    pass: number;
    unverified: number;
    needsFix: number;
  };
  checks: MmoFormattedCheck[];
};

function stringifyError(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function normalizeItems(input: SmokeResult): SmokeSummaryItem[] {
  if (Array.isArray(input.summary)) return input.summary;

  if (Array.isArray(input.results)) {
    return input.results.map((r) => ({
      name: r.name,
      ok: r.ok,
      status:
        r.data && typeof r.data === 'object' && 'status' in (r.data as any)
          ? (r.data as any).status
          : null,
      error: r.error,
    }));
  }

  if (Array.isArray(input.steps)) {
    return input.steps.map((s) => ({
      step: s.step,
      ok: s.ok,
      status:
        s.data && typeof s.data === 'object' && 'status' in (s.data as any)
          ? (s.data as any).status
          : null,
      error: s.error,
    }));
  }

  return [];
}

function classifyItem(item: SmokeSummaryItem): {
  category: 'PASS' | '未確認' | '要修正';
  detail: string;
} {
  const errorText = stringifyError(item.error);
  const businessStatus = item.status ?? null;

  if (!item.ok) {
    return {
      category: '要修正',
      detail: errorText || 'RPC 呼び出しに失敗しました',
    };
  }

  if (businessStatus === 'ok') {
    return {
      category: 'PASS',
      detail: '正常応答',
    };
  }

  if (businessStatus === 'error') {
    return {
      category: '要修正',
      detail: errorText || 'RPC は呼べたが業務ロジック上エラーです',
    };
  }

  if (businessStatus == null) {
    return {
      category: '未確認',
      detail: 'status フィールドが無いため手動確認が必要です',
    };
  }

  return {
    category: '未確認',
    detail: `status=${businessStatus}`,
  };
}

function labelFromKey(key: string): string {
  const labels: Record<string, string> = {
    mmo_rpc_me_effective_stats: '実効ステータス取得',
    mmo_rpc_me_equipped_summary: '装備サマリー取得',
    mmo_rpc_me_equipment_bonuses: '装備ボーナス取得',
    mmo_rpc_me_validate_equipment: '装備妥当性検証',
    mmo_rpc_me_refresh_equipment_state: '装備状態リフレッシュ',
    mmo_rpc_me_equippable_items: '装備可能アイテム一覧',
    mmo_rpc_me_combat_profile: '戦闘プロファイル取得',
    mmo_rpc_me_skill_combat_preview: 'スキル戦闘プレビュー',
    mmo_rpc_me_vs_player_damage_preview: '対人ダメージプレビュー',

    baseline_effective_stats: '初期ステータス取得',
    baseline_equipped_summary: '初期装備サマリー取得',
    baseline_skill_preview: '初期スキルプレビュー取得',
    weapon_can_equip: '武器装備可否確認',
    weapon_equip: '武器装備',
    weapon_after_stats: '武器装備後ステータス',
    weapon_after_skill_preview: '武器装備後スキルプレビュー',
    weapon_unequip: '武器解除',
    body_can_equip: '防具装備可否確認',
    body_equip: '防具装備',
    body_after_stats: '防具装備後ステータス',
    body_validate: '防具装備後バリデーション',
    body_unequip: '防具解除',
    job_switch_to_acolyte: 'アコライトへジョブ変更',
    job_after_stats: 'ジョブ変更後ステータス',
    job_validate: 'ジョブ変更後バリデーション',
    job_switch_back_beginner: 'ビギナーへ戻す',
    final_equipped_summary: '最終装備サマリー',
    final_effective_stats: '最終ステータス',
  };

  return labels[key] ?? key;
}

export function formatMmoSmokeResult(input: SmokeResult): MmoFormattedReport {
  const items = normalizeItems(input);

  const checks: MmoFormattedCheck[] = items.map((item) => {
    const key = item.name ?? item.step ?? 'unknown';
    const classified = classifyItem(item);

    return {
      key,
      label: labelFromKey(key),
      category: classified.category,
      detail: classified.detail,
    };
  });

  const counts = {
    pass: checks.filter((c) => c.category === 'PASS').length,
    unverified: checks.filter((c) => c.category === '未確認').length,
    needsFix: checks.filter((c) => c.category === '要修正').length,
  };

  const overall: MmoFormattedReport['overall'] =
    counts.needsFix > 0
      ? '要修正あり'
      : counts.unverified > 0
      ? '未確認あり'
      : 'PASS';

  return {
    overall,
    counts,
    checks,
  };
}

export function formatMmoMutationStrict(result: SmokeResult) {
  const steps = result.steps ?? [];

  const findStep = (key: string) => steps.find((s) => s.step === key);

  const isOkStatus = (data: any) =>
    data && typeof data === 'object' && data.status === 'ok';

  const errText = (error: unknown) => stringifyError(error);

  const weaponEquip = findStep('weapon_equip');
  const weaponStats = findStep('weapon_after_stats');
  const weaponSkill = findStep('weapon_after_skill_preview');

  const bodyEquip = findStep('body_equip');
  const bodyStats = findStep('body_after_stats');
  const bodyValidate = findStep('body_validate');

  const jobSwitch = findStep('job_switch_to_acolyte');
  const jobValidate = findStep('job_validate');
  const jobBack = findStep('job_switch_back_beginner');

  const checks: MmoFormattedCheck[] = [
    {
      key: 'weapon_flow',
      label: '武器装備フロー',
      category:
        weaponEquip?.ok &&
        isOkStatus((weaponEquip as any).data) &&
        weaponStats?.ok &&
        isOkStatus((weaponStats as any).data) &&
        weaponSkill?.ok &&
        isOkStatus((weaponSkill as any).data)
          ? 'PASS'
          : weaponEquip || weaponStats || weaponSkill
          ? '要修正'
          : '未確認',
      detail:
        weaponEquip?.ok && weaponStats?.ok && weaponSkill?.ok
          ? '武器装備・反映・スキルプレビューまで正常'
          : errText(
              weaponEquip?.error || weaponStats?.error || weaponSkill?.error
            ) || '武器装備系ステップを確認してください',
    },
    {
      key: 'body_flow',
      label: '防具装備フロー',
      category:
        bodyEquip?.ok &&
        isOkStatus((bodyEquip as any).data) &&
        bodyStats?.ok &&
        isOkStatus((bodyStats as any).data) &&
        bodyValidate?.ok &&
        isOkStatus((bodyValidate as any).data)
          ? 'PASS'
          : bodyEquip || bodyStats || bodyValidate
          ? '要修正'
          : '未確認',
      detail:
        bodyEquip?.ok && bodyStats?.ok && bodyValidate?.ok
          ? '防具装備・反映・装備検証まで正常'
          : errText(bodyEquip?.error || bodyStats?.error || bodyValidate?.error) ||
            '防具装備系ステップを確認してください',
    },
    {
      key: 'job_switch_flow',
      label: 'ジョブ変更フロー',
      category:
        jobSwitch?.ok &&
        isOkStatus((jobSwitch as any).data) &&
        jobValidate?.ok &&
        isOkStatus((jobValidate as any).data)
          ? 'PASS'
          : jobSwitch || jobValidate
          ? '要修正'
          : '未確認',
      detail:
        jobSwitch?.ok && jobValidate?.ok
          ? 'ジョブ変更・変更後検証まで正常'
          : errText(jobSwitch?.error || jobValidate?.error) ||
            'ジョブ変更系ステップを確認してください',
    },
    {
      key: 'restore_flow',
      label: '状態戻しフロー',
      category:
        jobBack?.ok && isOkStatus((jobBack as any).data)
          ? 'PASS'
          : jobBack
          ? '要修正'
          : '未確認',
      detail:
        jobBack?.ok
          ? 'ジョブを元に戻す処理が正常'
          : errText(jobBack?.error) || '戻し処理は未実行です',
    },
  ];

  const counts = {
    pass: checks.filter((c) => c.category === 'PASS').length,
    unverified: checks.filter((c) => c.category === '未確認').length,
    needsFix: checks.filter((c) => c.category === '要修正').length,
  };

  return {
    overall:
      counts.needsFix > 0
        ? '要修正あり'
        : counts.unverified > 0
        ? '未確認あり'
        : 'PASS',
    counts,
    checks,
  };
}
