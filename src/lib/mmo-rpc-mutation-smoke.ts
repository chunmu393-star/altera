import type { SupabaseClient } from '@supabase/supabase-js';

export type MutationStepResult = {
  step: string;
  ok: boolean;
  data: unknown;
  error: unknown;
};

async function rpc(
  supabase: SupabaseClient,
  step: string,
  fn: string,
  args: Record<string, unknown> = {}
): Promise<MutationStepResult> {
  const { data, error } = await supabase.rpc(fn as never, args);
  return { step, ok: !error, data, error };
}

/**
 * Mutation smoke test
 *
 * 注意:
 * - 実際に状態を変更します
 * - テスト前提:
 *   - 対象ユーザーが novice_training_sword を所持 or 装備可能
 *   - cloth_tunic を所持 or 装備可能
 *   - acolyte が解放済み
 */
export async function runMmoMutationSmokeTests(supabase: SupabaseClient) {
  const steps: MutationStepResult[] = [];

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError || !sessionData.session) {
    return {
      ok: false,
      error: sessionError ?? '未ログインです',
      steps,
      summary: [],
    };
  }

  steps.push(
    await rpc(supabase, 'baseline_effective_stats', 'mmo_rpc_me_effective_stats'),
    await rpc(
      supabase,
      'baseline_equipped_summary',
      'mmo_rpc_me_equipped_summary'
    ),
    await rpc(
      supabase,
      'baseline_skill_preview',
      'mmo_rpc_me_skill_combat_preview',
      { p_skill_id: 'basic_slash' }
    )
  );

  steps.push(
    await rpc(supabase, 'weapon_can_equip', 'mmo_rpc_me_can_equip_item', {
      p_item_id: 'novice_training_sword',
    }),
    await rpc(supabase, 'weapon_equip', 'mmo_rpc_me_equip_item', {
      p_item_id: 'novice_training_sword',
      p_target_slot: 'weapon',
      p_force_clear_conflicts: true,
    }),
    await rpc(supabase, 'weapon_after_stats', 'mmo_rpc_me_effective_stats'),
    await rpc(
      supabase,
      'weapon_after_skill_preview',
      'mmo_rpc_me_skill_combat_preview',
      { p_skill_id: 'basic_slash' }
    ),
    await rpc(supabase, 'weapon_unequip', 'mmo_rpc_me_unequip_item_by_id', {
      p_item_id: 'novice_training_sword',
    })
  );

  steps.push(
    await rpc(supabase, 'body_can_equip', 'mmo_rpc_me_can_equip_item', {
      p_item_id: 'cloth_tunic',
    }),
    await rpc(supabase, 'body_equip', 'mmo_rpc_me_equip_item', {
      p_item_id: 'cloth_tunic',
      p_target_slot: 'body',
      p_force_clear_conflicts: true,
    }),
    await rpc(supabase, 'body_after_stats', 'mmo_rpc_me_effective_stats'),
    await rpc(supabase, 'body_validate', 'mmo_rpc_me_validate_equipment'),
    await rpc(supabase, 'body_unequip', 'mmo_rpc_me_unequip_item', {
      p_slot: 'body',
    })
  );

  steps.push(
    await rpc(supabase, 'job_switch_to_acolyte', 'mmo_rpc_me_switch_job', {
      p_to_job_id: 'acolyte',
      p_reset_buttons: false,
      p_auto_learn: true,
    }),
    await rpc(supabase, 'job_after_stats', 'mmo_rpc_me_effective_stats'),
    await rpc(supabase, 'job_validate', 'mmo_rpc_me_validate_equipment')
  );

  steps.push(
    await rpc(supabase, 'job_switch_back_beginner', 'mmo_rpc_me_switch_job', {
      p_to_job_id: 'beginner',
      p_reset_buttons: false,
      p_auto_learn: true,
    }),
    await rpc(
      supabase,
      'final_equipped_summary',
      'mmo_rpc_me_equipped_summary'
    ),
    await rpc(supabase, 'final_effective_stats', 'mmo_rpc_me_effective_stats')
  );

  const summary = steps.map((s) => {
    const status =
      s.ok && typeof s.data === 'object' && s.data && 'status' in (s.data as any)
        ? (s.data as any).status
        : null;

    return {
      step: s.step,
      ok: s.ok,
      status,
      error: s.error,
    };
  });

  return {
    ok: steps.every((s) => s.ok),
    userId: sessionData.session.user.id,
    summary,
    steps,
  };
}
