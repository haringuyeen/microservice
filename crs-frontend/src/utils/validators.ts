/**
 * Tiện ích kiểm tra tính hợp lệ dữ liệu nhập liệu (Validation) ở Frontend.
 */

// Regex kiểm tra định dạng email chuẩn
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Regex mã định danh (chỉ chứa chữ cái, số, gạch ngang, gạch dưới)
const CODE_REGEX = /^[A-Za-z0-9_-]+$/;

// Regex tên đăng nhập
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]+$/;

export function validateRequired(value: unknown, fieldName: string): string | null {
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
        return `${fieldName} không được để trống.`;
    }
    return null;
}

export function validateCode(code: string, fieldName = 'Mã'): string | null {
    const requiredErr = validateRequired(code, fieldName);
    if (requiredErr) return requiredErr;

    const trimmed = code.trim();
    if (trimmed.length < 2) {
        return `${fieldName} phải có ít nhất 2 ký tự.`;
    }
    if (trimmed.length > 50) {
        return `${fieldName} không được vượt quá 50 ký tự.`;
    }
    if (!CODE_REGEX.test(trimmed)) {
        return `${fieldName} chỉ được chứa chữ cái, chữ số, dấu gạch nối (-) hoặc gạch dưới (_).`;
    }
    return null;
}

export function validateEmail(email: string | undefined | null, required = false): string | null {
    if (!email || email.trim() === '') {
        if (required) return 'Email không được để trống.';
        return null;
    }
    const trimmed = email.trim();
    if (!EMAIL_REGEX.test(trimmed)) {
        return 'Email không đúng định dạng (ví dụ: contact@example.com).';
    }
    return null;
}

export function validatePhone(phone: string | undefined | null, required = false): string | null {
    if (!phone || phone.trim() === '') {
        if (required) return 'Số điện thoại không được để trống.';
        return null;
    }
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    // Cho phép từ 10 - 11 số nếu người dùng gõ linh hoạt, hoặc đúng đầu số viễn thông
    if (!/^[0-9+]{9,12}$/.test(cleanPhone)) {
        return 'Số điện thoại chỉ được chứa các chữ số (9 - 11 chữ số).';
    }
    return null;
}

export function validateNumber(
    value: unknown,
    fieldName: string,
    min = 0,
    allowZero = true
): string | null {
    if (value === null || value === undefined || value === '') {
        return `${fieldName} không được để trống.`;
    }
    const num = Number(value);
    if (isNaN(num)) {
        return `${fieldName} phải là một số hợp lệ.`;
    }
    if (allowZero && num < min) {
        return `${fieldName} không thể nhỏ hơn ${min}.`;
    }
    if (!allowZero && num <= min) {
        return `${fieldName} phải lớn hơn ${min}.`;
    }
    return null;
}

export function validateUsername(username: string): string | null {
    const req = validateRequired(username, 'Tên đăng nhập');
    if (req) return req;

    const trimmed = username.trim();
    if (trimmed.length < 3) {
        return 'Tên đăng nhập phải có ít nhất 3 ký tự.';
    }
    if (trimmed.length > 50) {
        return 'Tên đăng nhập không được vượt quá 50 ký tự.';
    }
    if (!USERNAME_REGEX.test(trimmed)) {
        return 'Tên đăng nhập chỉ được chứa chữ cái không dấu, số, dấu chấm, gạch nối hoặc gạch dưới.';
    }
    return null;
}

export function validatePassword(password: string, required = true): string | null {
    if (!password || password.trim() === '') {
        if (required) return 'Mật khẩu không được để trống.';
        return null;
    }
    if (password.length < 6) {
        return 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.';
    }
    return null;
}
