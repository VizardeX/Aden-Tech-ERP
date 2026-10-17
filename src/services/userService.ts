import { authenticatedFetch } from './authService'


export const getUserById = async (userId: number | string) => {

    if (!userId) {
        throw new Error('لم يتم العثور على المعرف userID');
    }

    const response = await authenticatedFetch(`/api/v1/admin/users/${userId}`, {

    });

    console.log(' تم جلب بيانات المستخدم بنجاح:', response);

    const result = await response.json();
    return result;;
};
export interface ChangePasswordPayload {
    email: string;
    newPassword: string;
    confirmPassword: string;
}

export const changePassword = async (payload: ChangePasswordPayload) => {

    const response = await authenticatedFetch('/Auth/ChangePassword',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    const result = await response.json();
    return result;;
};

export const getUsers = async () => {
    const response = await authenticatedFetch('/v1/admin/users');

    return response.body;
};