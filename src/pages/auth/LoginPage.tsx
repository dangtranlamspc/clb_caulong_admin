import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api';
import { useAuthStore } from '../../stores/auth.store';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      const { data } = await authApi.login({ ...values, rememberMe: values.rememberMe });
      setAuth(data.user, data.access_token, data.refresh_token);
      toast.success(`Chào mừng, ${data.user.full_name}!`);
      navigate('/');
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 mb-4">
            <img
              src="https://res.cloudinary.com/ds6mtnyyk/image/upload/v1783494767/LOGO_TEAM_BNB_WHITE_hs59vg.png"
              alt="Team BNB"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">BNB BADMINTON CLUB</h1>
          <p className="text-slate-400 mt-1 text-sm">Hệ thống quản lý thành viên</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Đăng nhập</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email hoặc số điện thoại
              </label>
              <input
                {...register('identifier', { required: 'Vui lòng nhập email hoặc số điện thoại' })}
                className="input-field"
                placeholder="admin@example.com"
                autoComplete="username"
              />
              {errors.identifier && <p className="text-red-500 text-xs mt-1">{errors.identifier.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <input
                  {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
                  type={showPw ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input {...register('rememberMe')} type="checkbox" className="rounded" />
              <span className="text-sm text-gray-600">Ghi nhớ đăng nhập (7 ngày)</span>
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Đăng nhập
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}