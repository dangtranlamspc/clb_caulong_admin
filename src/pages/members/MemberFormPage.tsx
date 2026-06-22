import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Loader2, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../../api';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export default function MemberFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [showResetPw, setShowResetPw] = useState(false);
  const [newPw, setNewPw] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (isEdit) {
      usersApi.get(id!)
        .then(({ data }) => reset({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          date_of_birth: data.date_of_birth?.split('T')[0] ?? '',
          gender: data.gender ?? '',
          shirt_size: data.shirt_size ?? '',
          role: data.role,
          member_type: data.member_type ?? 'vang_lai',
          is_active: data.is_active,
        }))
        .finally(() => setFetching(false));
    }
  }, [id]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (isEdit) {
        const payload = {
          full_name: values.full_name,
          email: values.email,
          phone: values.phone,
          date_of_birth: values.date_of_birth || undefined,
          gender: values.gender || undefined,
          shirt_size: values.shirt_size || undefined,
          role: values.role,
          member_type: values.member_type || undefined,
          is_active: values.is_active,
        };
        await usersApi.update(id!, payload);
        toast.success('Cập nhật thành công!');
        navigate('/members');
      } else {
        const payload = {
          full_name: values.full_name,
          email: values.email,
          phone: values.phone,
          password: values.password,
          date_of_birth: values.date_of_birth || undefined,
          gender: values.gender || undefined,
          shirt_size: values.shirt_size || undefined,
          member_type: values.member_type || 'vang_lai',
          role: values.role || 'member',
        };
        await usersApi.create(payload);
        toast.success('Tạo tài khoản thành công!');
        navigate('/members');
      }
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPw || newPw.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }
    try {
      await usersApi.updatePassword(id!, { new_password: newPw });
      toast.success('Đổi mật khẩu thành công!');
      setShowResetPw(false);
      setNewPw('');
    } catch { }
  };

  if (fetching) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
        <div className="card space-y-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/members')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full name */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
            <input
              {...register('full_name', { required: 'Bắt buộc' })}
              className="input-field"
              placeholder="Nguyễn Văn A"
            />
            {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message as string}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              {...register('email', { required: 'Bắt buộc' })}
              type="email"
              className="input-field"
              placeholder="user@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
            <input
              {...register('phone', { required: 'Bắt buộc' })}
              className="input-field"
              placeholder="0901234567"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message as string}</p>}
          </div>

          {/* Password (create only) */}
          {!isEdit && (
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu *</label>
              <input
                {...register('password', { required: 'Bắt buộc', minLength: { value: 8, message: 'Tối thiểu 8 ký tự' } })}
                type="password"
                className="input-field"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
            </div>
          )}

          {/* DOB */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
            <input
              {...register('date_of_birth')}
              type="date"
              className="input-field"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
            <select {...register('gender')} className="input-field">
              <option value="">Chọn giới tính</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>

          {/* Shirt size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Size áo</label>
            <select {...register('shirt_size')} className="input-field">
              <option value="">Chọn size</option>
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại thành viên</label>
            <select {...register('member_type')} className="input-field">
              <option value="vang_lai">Vãng lai</option>
              <option value="co_dinh">Cố định</option>
            </select>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
            <select {...register('role')} className="input-field">
              <option value="member">Thành viên</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" onClick={() => navigate('/members')} className="btn-secondary text-sm">
            Hủy
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 text-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}
          </button>
        </div>
      </form>

      {/* Reset password section (edit mode) */}
      {isEdit && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800 flex items-center gap-2">
                <Key className="w-4 h-4" /> Đặt lại mật khẩu
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">Thay đổi mật khẩu cho tài khoản này</p>
            </div>
            <button onClick={() => setShowResetPw(!showResetPw)} className="btn-secondary text-sm">
              {showResetPw ? 'Hủy' : 'Đặt lại'}
            </button>
          </div>
          {showResetPw && (
            <div className="flex gap-3 mt-4">
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                className="input-field flex-1"
                placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
              />
              <button onClick={handleResetPassword} className="btn-primary text-sm whitespace-nowrap">
                Xác nhận
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}