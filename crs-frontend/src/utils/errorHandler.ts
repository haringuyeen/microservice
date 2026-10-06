import axios from 'axios';
import type { ApiErrorResponse } from '../types/apiError';

/**
 * Trích xuất thông báo lỗi thân thiện với người dùng từ mọi đối tượng lỗi (AxiosError, Error thông thường, chuỗi lỗi, v.v.).
 */
export function getErrorMessage(err: unknown, defaultMessage = 'Có lỗi xảy ra, vui lòng thử lại sau.'): string {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
        // 1. Nếu có response từ server với message
        if (err.response?.data?.message) {
            return err.response.data.message;
        }

        // 2. Nếu có danh sách lỗi theo từng field trong errors map
        if (err.response?.data?.errors && typeof err.response.data.errors === 'object') {
            const fieldErrorMessages = Object.values(err.response.data.errors).filter(Boolean);
            if (fieldErrorMessages.length > 0) {
                return fieldErrorMessages.join('; ');
            }
        }

        // 3. Xử lý các mã HTTP đặc thù nếu server không trả body
        if (err.response?.status === 401) {
            return 'Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập.';
        }
        if (err.response?.status === 403) {
            return 'Bạn không có quyền thực hiện thao tác này.';
        }
        if (err.response?.status === 404) {
            return 'Không tìm thấy dữ liệu yêu cầu.';
        }
        if (err.response?.status === 409) {
            return 'Dữ liệu đã tồn tại hoặc đang bị ràng buộc liên kết.';
        }
        if (err.response?.status === 502 || err.response?.status === 503) {
            return 'Dịch vụ hệ thống tạm thời không khả dụng. Vui lòng thử lại sau giây lát.';
        }
        if (err.response?.status === 504) {
            return 'Yêu cầu bị quá thời gian chờ xử lý (Gateway Timeout).';
        }

        // 4. Lỗi kết nối mạng (Network Error / Service down)
        if (err.code === 'ERR_NETWORK') {
            return 'Không thể kết nối đến máy chủ API Gateway. Vui lòng kiểm tra lại mạng hoặc dịch vụ backend.';
        }
    }

    if (err instanceof Error && err.message) {
        return err.message;
    }

    return defaultMessage;
}

/**
 * Trích xuất map các lỗi theo trường (field errors) nếu có từ response validation.
 */
export function getFieldErrors(err: unknown): Record<string, string> | undefined {
    if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data?.errors) {
        return err.response.data.errors;
    }
    return undefined;
}
