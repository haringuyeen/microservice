import React, { useState, useEffect } from 'react';
import { Plus, X, AlertCircle, Package } from 'lucide-react';
import {
    getAllCategories,
    getAllSuppliers,
    createProduct,
    updateProduct
} from '../api/warehouseApi';
import { useToast } from '../context/ToastContext';
import SearchableSelect from './SearchableSelect';
import CategoryModal from './CategoryModal';
import SupplierModal from './SupplierModal';
import type { Product, Category, Supplier } from '../types/warehouse';
import { validateCode, validateRequired, validateNumber } from '../utils/validators';
import { getErrorMessage, getFieldErrors } from '../utils/errorHandler';

export interface ProductModalProps {
    isOpen: boolean;
    product?: Product | null;
    initialSupplierId?: number;
    categories?: Category[];
    suppliers?: Supplier[];
    onClose: () => void;
    onSuccess: (product: Product) => void;
    zIndex?: number;
}

export default function ProductModal({
    isOpen,
    product,
    initialSupplierId,
    categories: propCategories,
    suppliers: propSuppliers,
    onClose,
    onSuccess,
    zIndex = 1000
}: ProductModalProps) {
    const toast = useToast();

    const [categories, setCategories] = useState<Category[]>(propCategories || []);
    const [suppliers, setSuppliers] = useState<Supplier[]>(propSuppliers || []);

    const [formCode, setFormCode] = useState('');
    const [formName, setFormName] = useState('');
    const [formCategoryId, setFormCategoryId] = useState<number | undefined>(undefined);
    const [formSupplierId, setFormSupplierId] = useState<number | undefined>(undefined);
    const [formUnit, setFormUnit] = useState('Cái');
    const [formImportPrice, setFormImportPrice] = useState<number>(0);
    const [formExportPrice, setFormExportPrice] = useState<number>(0);
    const [formMinStockLevel, setFormMinStockLevel] = useState<number>(10);
    const [formImageUrl, setFormImageUrl] = useState('');
    const [formDescription, setFormDescription] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Sub modals
    const [quickCategoryOpen, setQuickCategoryOpen] = useState(false);
    const [quickSupplierOpen, setQuickSupplierOpen] = useState(false);

    // Sync categories and suppliers when props change
    useEffect(() => {
        if (propCategories && propCategories.length > 0) {
            setCategories(propCategories);
        }
    }, [propCategories]);

    useEffect(() => {
        if (propSuppliers && propSuppliers.length > 0) {
            setSuppliers(propSuppliers);
        }
    }, [propSuppliers]);

    // Fetch dropdowns if not provided or empty
    useEffect(() => {
        if (isOpen) {
            if (!propCategories || propCategories.length === 0) {
                getAllCategories().then((res) => setCategories(res.data)).catch(console.error);
            }
            if (!propSuppliers || propSuppliers.length === 0) {
                getAllSuppliers().then((res) => setSuppliers(res.data)).catch(console.error);
            }
        }
    }, [isOpen, propCategories, propSuppliers]);

    // Reset or populate fields
    useEffect(() => {
        if (isOpen) {
            setFormError(null);
            setFieldErrors({});
            if (product) {
                setFormCode(product.code || '');
                setFormName(product.name || '');
                setFormCategoryId(product.categoryId || undefined);
                setFormSupplierId(product.supplierId ? Number(product.supplierId) : undefined);
                setFormUnit(product.unit || 'Cái');
                setFormImportPrice(product.importPrice != null ? Number(product.importPrice) : 0);
                setFormExportPrice(product.exportPrice != null ? Number(product.exportPrice) : 0);
                setFormMinStockLevel(product.minStockLevel != null ? Number(product.minStockLevel) : 10);
                setFormImageUrl(product.imageUrl || '');
                setFormDescription(product.description || '');
            } else {
                setFormCode('');
                setFormName('');
                setFormCategoryId(undefined);
                setFormSupplierId(initialSupplierId ? Number(initialSupplierId) : undefined);
                setFormUnit('Cái');
                setFormImportPrice(0);
                setFormExportPrice(0);
                setFormMinStockLevel(10);
                setFormImageUrl('');
                setFormDescription('');
            }
        }
    }, [isOpen, product, initialSupplierId]);

    if (!isOpen) return null;

    const handleQuickCategorySuccess = (newCategory: Category) => {
        setCategories((prev) => {
            if (prev.some((c) => c.id === newCategory.id)) return prev;
            return [...prev, newCategory];
        });
        setFormCategoryId(newCategory.id);
        toast.success(`Đã thêm danh mục "${newCategory.name}"`);
    };

    const handleQuickSupplierSuccess = (newSupplier: Supplier) => {
        setSuppliers((prev) => {
            if (prev.some((s) => s.id === newSupplier.id)) return prev;
            return [...prev, newSupplier];
        });
        setFormSupplierId(newSupplier.id);
        if (fieldErrors.supplierId) {
            setFieldErrors(prev => ({ ...prev, supplierId: '' }));
        }
        toast.success(`Đã thêm nhà cung cấp "${newSupplier.name}"`);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        const newErrors: Record<string, string> = {};
        const codeErr = validateCode(formCode, 'Mã sản phẩm');
        if (codeErr) newErrors.code = codeErr;

        const nameErr = validateRequired(formName, 'Tên sản phẩm');
        if (nameErr) newErrors.name = nameErr;

        if (!formCategoryId) {
            newErrors.categoryId = 'Vui lòng chọn danh mục cho sản phẩm';
        }

        if (!formSupplierId) {
            newErrors.supplierId = 'Vui lòng chọn nhà cung cấp cho sản phẩm';
        }

        const unitErr = validateRequired(formUnit, 'Đơn vị tính');
        if (unitErr) newErrors.unit = unitErr;

        const importPriceErr = validateNumber(formImportPrice, 'Giá nhập', 0, true);
        if (importPriceErr) newErrors.importPrice = importPriceErr;

        const exportPriceErr = validateNumber(formExportPrice, 'Giá bán', 0, false);
        if (exportPriceErr) newErrors.exportPrice = exportPriceErr;

        if (!importPriceErr && !exportPriceErr && Number(formExportPrice) <= Number(formImportPrice)) {
            newErrors.exportPrice = 'Giá bán phải lớn hơn giá nhập (VND)';
        }

        const minStockErr = validateNumber(formMinStockLevel, 'Định mức tồn tối thiểu', 0, true);
        if (minStockErr) newErrors.minStockLevel = minStockErr;

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            const firstMsg = Object.values(newErrors)[0];
            setFormError(firstMsg);
            toast.error(firstMsg, 'Dữ liệu không hợp lệ');
            return;
        }

        setFieldErrors({});
        setSubmitting(true);

        const payload: Partial<Product> = {
            code: formCode.trim().toUpperCase(),
            name: formName.trim(),
            categoryId: Number(formCategoryId),
            supplierId: formSupplierId ? Number(formSupplierId) : null,
            unit: formUnit.trim(),
            importPrice: Number(formImportPrice),
            exportPrice: Number(formExportPrice),
            minStockLevel: Number(formMinStockLevel),
            imageUrl: formImageUrl.trim() || undefined,
            description: formDescription.trim() || undefined
        };

        try {
            if (product) {
                const res = await updateProduct(product.id, payload);
                toast.success(`Cập nhật sản phẩm "${formName}" thành công!`);
                onSuccess(res.data);
            } else {
                const res = await createProduct(payload);
                toast.success(`Thêm mới sản phẩm "${formName}" thành công!`);
                onSuccess(res.data);
            }
            onClose();
        } catch (err: unknown) {
            const errorMsg = getErrorMessage(err, 'Lỗi khi lưu sản phẩm');
            const backendFieldErrors = getFieldErrors(err);
            if (backendFieldErrors) {
                setFieldErrors(backendFieldErrors);
            }
            setFormError(errorMsg);
            toast.error(errorMsg, 'Lưu sản phẩm thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div
                className="modal-backdrop"
                style={{ zIndex }}
                onClick={() => !submitting && onClose()}
            >
                <div
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                backgroundColor: 'var(--accent-bg)',
                                color: 'var(--accent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Package size={18} />
                            </div>
                            <h3 style={{ margin: 0 }}>{product ? 'Chỉnh sửa Sản phẩm' : 'Thêm Sản phẩm Mới'}</h3>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px' }}
                            disabled={submitting}
                        >
                            <X size={15} />
                        </button>
                    </div>

                    {formError && (
                        <div style={{ padding: '8px 12px', borderRadius: 6, backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertCircle size={15} />
                            <span>{formError}</span>
                        </div>
                    )}

                    <form onSubmit={handleFormSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Mã sản phẩm *</label>
                                <input
                                    value={formCode}
                                    onChange={(e) => {
                                        setFormCode(e.target.value.toUpperCase());
                                        if (fieldErrors.code) setFieldErrors(prev => ({ ...prev, code: '' }));
                                    }}
                                    className={fieldErrors.code ? 'is-invalid' : ''}
                                    placeholder="SP001..."
                                    style={{ width: '100%' }}
                                    autoFocus
                                    disabled={submitting}
                                />
                                {fieldErrors.code && (
                                    <span className="invalid-feedback">{fieldErrors.code}</span>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Tên sản phẩm *</label>
                                <input
                                    value={formName}
                                    onChange={(e) => {
                                        setFormName(e.target.value);
                                        if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                                    }}
                                    className={fieldErrors.name ? 'is-invalid' : ''}
                                    placeholder="Tên sản phẩm..."
                                    style={{ width: '100%' }}
                                    disabled={submitting}
                                />
                                {fieldErrors.name && (
                                    <span className="invalid-feedback">{fieldErrors.name}</span>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', gap: 14, marginBottom: 14, alignItems: 'flex-start' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Danh mục *</label>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <SearchableSelect
                                            options={categories.map((c) => ({
                                                value: c.id,
                                                label: c.name,
                                                subLabel: c.code,
                                                tag: c.description || undefined
                                            }))}
                                            value={formCategoryId || undefined}
                                            onChange={(val: any) => {
                                                setFormCategoryId(val ? Number(val) : undefined);
                                                if (fieldErrors.categoryId) setFieldErrors(prev => ({ ...prev, categoryId: '' }));
                                            }}
                                            placeholder="-- Chọn danh mục --"
                                            searchPlaceholder="Nhập tên, mã danh mục..."
                                            clearable={false}
                                            disabled={submitting}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setQuickCategoryOpen(true)}
                                        className="btn btn-outline"
                                        style={{
                                            padding: 0,
                                            width: 38,
                                            height: 38,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}
                                        title="Tạo danh mục mới"
                                        disabled={submitting}
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                {fieldErrors.categoryId && (
                                    <span className="invalid-feedback">{fieldErrors.categoryId}</span>
                                )}
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Nhà cung cấp *</label>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <SearchableSelect
                                            options={suppliers.map((s) => ({
                                                value: s.id,
                                                label: s.name,
                                                subLabel: s.code,
                                                tag: s.phone ? `SĐT: ${s.phone}` : undefined
                                            }))}
                                            value={formSupplierId || undefined}
                                            onChange={(val: any) => {
                                                setFormSupplierId(val ? Number(val) : undefined);
                                                if (fieldErrors.supplierId) setFieldErrors(prev => ({ ...prev, supplierId: '' }));
                                            }}
                                            placeholder="-- Chọn nhà cung cấp --"
                                            searchPlaceholder="Nhập tên, mã NCC..."
                                            clearable={false}
                                            disabled={submitting}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setQuickSupplierOpen(true)}
                                        className="btn btn-outline"
                                        style={{
                                            padding: 0,
                                            width: 38,
                                            height: 38,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}
                                        title="Tạo nhà cung cấp mới"
                                        disabled={submitting}
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                {fieldErrors.supplierId && (
                                    <span className="invalid-feedback">{fieldErrors.supplierId}</span>
                                )}
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Đơn vị tính *</label>
                                <input
                                    value={formUnit}
                                    onChange={(e) => {
                                        setFormUnit(e.target.value);
                                        if (fieldErrors.unit) setFieldErrors(prev => ({ ...prev, unit: '' }));
                                    }}
                                    className={fieldErrors.unit ? 'is-invalid' : ''}
                                    placeholder="Cái, Hộp, Chiếc, Kg..."
                                    style={{ width: '100%', height: 38 }}
                                    disabled={submitting}
                                />
                                {fieldErrors.unit && (
                                    <span className="invalid-feedback">{fieldErrors.unit}</span>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Giá nhập (VND) *</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={formImportPrice}
                                    onChange={(e) => {
                                        setFormImportPrice(Number(e.target.value));
                                        if (formError) setFormError(null);
                                        if (fieldErrors.importPrice) setFieldErrors(prev => ({ ...prev, importPrice: '' }));
                                    }}
                                    className={fieldErrors.importPrice ? 'is-invalid' : ''}
                                    style={{ width: '100%' }}
                                    disabled={submitting}
                                />
                                {fieldErrors.importPrice && (
                                    <span className="invalid-feedback">{fieldErrors.importPrice}</span>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Giá bán (VND) *</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={formExportPrice}
                                    onChange={(e) => {
                                        setFormExportPrice(Number(e.target.value));
                                        if (formError) setFormError(null);
                                        if (fieldErrors.exportPrice) setFieldErrors(prev => ({ ...prev, exportPrice: '' }));
                                    }}
                                    className={fieldErrors.exportPrice ? 'is-invalid' : ''}
                                    style={{ width: '100%' }}
                                    disabled={submitting}
                                />
                                {fieldErrors.exportPrice && (
                                    <span className="invalid-feedback">{fieldErrors.exportPrice}</span>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Ngưỡng tối thiểu</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={formMinStockLevel}
                                    onChange={(e) => {
                                        setFormMinStockLevel(Number(e.target.value));
                                        if (fieldErrors.minStockLevel) setFieldErrors(prev => ({ ...prev, minStockLevel: '' }));
                                    }}
                                    className={fieldErrors.minStockLevel ? 'is-invalid' : ''}
                                    style={{ width: '100%' }}
                                    disabled={submitting}
                                />
                                {fieldErrors.minStockLevel && (
                                    <span className="invalid-feedback">{fieldErrors.minStockLevel}</span>
                                )}
                            </div>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Link ảnh sản phẩm (URL)</label>
                            <input
                                value={formImageUrl}
                                onChange={(e) => setFormImageUrl(e.target.value)}
                                placeholder="https://..."
                                style={{ width: '100%' }}
                                disabled={submitting}
                            />
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Mô tả chi tiết</label>
                            <textarea
                                rows={3}
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                placeholder="Thông số kỹ thuật, quy cách đóng gói..."
                                style={{ width: '100%' }}
                                disabled={submitting}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-secondary"
                                disabled={submitting}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="btn btn-primary"
                            >
                                {submitting ? 'Đang lưu...' : (product ? 'Cập nhật' : 'Lưu sản phẩm')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Nested Modals */}
            <CategoryModal
                isOpen={quickCategoryOpen}
                onClose={() => setQuickCategoryOpen(false)}
                onSuccess={handleQuickCategorySuccess}
                zIndex={zIndex + 100}
            />

            <SupplierModal
                isOpen={quickSupplierOpen}
                onClose={() => setQuickSupplierOpen(false)}
                onSuccess={handleQuickSupplierSuccess}
                zIndex={zIndex + 100}
            />
        </>
    );
}
