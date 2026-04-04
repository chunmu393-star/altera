import { MmoRpcSmokePanel } from '../../components/MmoRpcSmokePanel';
import { supabase } from '../../lib/supabase-browser';

export default function AdminPage() {
  return (
    <main className="pageWrap">
      <h1>MMO RPC Admin Smoke Test</h1>
      <p className="lead">
        App Router 版の admin ページです。mutation smoke を実行して、
        装備・解除・ジョブ変更まで確認できます。
      </p>

      <MmoRpcSmokePanel
        supabase={supabase}
        title="Admin: MMO RPC Smoke Test"
        description="運用前の最終確認向け。mutation smoke は実際に状態を変更するため、テスト用ユーザーで実行してください。"
        defaultMode="mutation"
      />
    </main>
  );
}
