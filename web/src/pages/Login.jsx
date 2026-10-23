import AuthForm from '../components/AuthForm.jsx'
import AuthLayout from '../components/AuthLayout.jsx'

export default function Login() {
  return <AuthLayout><AuthForm mode="login" /></AuthLayout>
}