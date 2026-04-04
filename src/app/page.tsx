import { MmoRpcSmokePanel } from '../components/MmoRpcSmokePanel';
import { supabase } from '../lib/supabase-browser';

export default function HomePage() {
  return (
    <main className="pageWrap">
      <h1>MMO RPC Smoke Test</h1>
      <p className="lead">
        App Router 版の index ページです。まずは read-only smoke を実行して、
        認証・RPC・読み取り系の導線を確認してください。
      </p>

      <MmoRpcSmokePanel
        supabase={supabase}
        title="Index: MMO RPC Smoke Test"
        description="最初の導線確認向け。read-only を先に回すのがおすすめです。"
        defaultMode="readonly"
      />
    </main>
  );
}
