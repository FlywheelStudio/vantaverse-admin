import { Suspense } from 'react';
import { ToastHandler } from '../toast-handler';
import { LoginPanel } from './login-panel';
import { LoginForm } from './login-form';

export default function LoginPage(): React.ReactElement {
  return (
    <div className="login">
      <LoginPanel />
      <div className="login-r">
        <Suspense fallback={null}>
          <ToastHandler />
        </Suspense>
        <LoginForm />
      </div>
    </div>
  );
}
