import axios from 'axios';
import Cookies from 'js-cookie';

// أضفنا كلمة export هنا لكي يتم استيراده في الملفات الأخرى
export const axiosInstance = axios.create({
  baseURL: '/api', 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});
 const token = Cookies.get('token');

axiosInstance.interceptors.request.use(
  (config) => {
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const getUserById = async (userId: string) => {
    

    console.log('🔍 التوكين والمعرف من الكوكيز:', { userID: userId, token });

  if (!userId) {
    console.error('❌ لم يتم العثور على userID في الكوكيز');
    throw new Error('لم يتم العثور على المعرف userID');
  }
    

    const response = await axios.get(`/api/v1/admin/users/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    console.log(' تم جلب بيانات المستخدم بنجاح:', response.data);
    console.log('🔍 بيانات المستخدم:', token);  

    return response.data;
};
export interface ChangePasswordPayload {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export const changePassword = async (payload: ChangePasswordPayload) => {
    
  const response = await axiosInstance.post('/Auth/ChangePassword', payload);
  return response.data;
};

export const getUsers = async () => {
  const response = await axiosInstance.get('/v1/admin/users');
  
  return response.data;
};