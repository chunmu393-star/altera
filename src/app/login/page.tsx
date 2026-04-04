import { LoginForm } from '../../components/LoginForm';

export default function LoginPage() {
  return (
    <main className="pageWrap">
      <h1>MMO RPC Login</h1>
      <p className="lead">
        Supabase Auth でログインしてから、read-only / mutation の RPC スモークテストを実行してください。
      </p>
      <LoginForm />
    </main>
  );
}
