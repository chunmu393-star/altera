import type { SupabaseClient } from '@supabase/supabase-js';

export type RpcResult = {
  name: string;
  ok: boolean;
  data: unknown;
  error: unknown;
};

async function callRpc(
  supabase: SupabaseClient,
  name: string,
  args: Record<string, unknown> = {}
): Promise<RpcResult> {
  const { data, error } = await supabase.rpc(name as never, args);
  return {
    name,
    ok: !error,
    data,
    error,
  };
}

/**
 * Read-only RPC smoke test
 *
 * 注意:
 * - auth.uid() 前提RPCを想定しているため、ログイン済みユーザーで実行してください
 * - mmo_rpc_me_equippable_items は (p_slot, p_only_equippable) の2引数です
 */
export async function runMmoReadOnlySmokeTests(
  supabase: SupabaseClient,
  defenderId?: string
) {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    return {
      ok: false,
      stage: 'session',
      error: sessionError,
      summary: [],
      results: [],
    };
  }

  if (!sessionData.session) {
    return {
      ok: false,
      stage: 'session',
      error: '未ログインです。auth.uid() 前提RPCのためログインしてください。',
      summary: [],
      results: [],
    };
  }

  const tests: Array<[string, Record<string, unknown>]> = [
    ['mmo_rpc_me_effective_stats', {}],
    ['mmo_rpc_me_equipped_summary', {}],
    ['mmo_rpc_me_equipment_bonuses', {}],
    ['mmo_rpc_me_validate_equipment', {}],
    ['mmo_rpc_me_refresh_equipment_state', {}],
    ['mmo_rpc_me_equippable_items', { p_slot: null, p_only_equippable: true }],
    ['mmo_rpc_me_combat_profile', {}],
    ['mmo_rpc_me_skill_combat_preview', { p_skill_id: 'basic_slash' }],
  ];

  if (defenderId) {
    tests.push([
      'mmo_rpc_me_vs_player_damage_preview',
      {
        p_defender_id: defenderId,
        p_skill_id: 'basic_slash',
      },
    ]);
  }

  const results: RpcResult[] = [];
  for (const [name, args] of tests) {
    results.push(await callRpc(supabase, name, args));
  }

  const summary = results.map((r) => ({
    name: r.name,
    ok: r.ok,
    status:
      r.ok && typeof r.data === 'object' && r.data && 'status' in (r.data as any)
        ? (r.data as any).status
        : null,
    error: r.error,
  }));

  return {
    ok: results.every((r) => r.ok),
    userId: sessionData.session.user.id,
    summary,
    results,
  };
}
