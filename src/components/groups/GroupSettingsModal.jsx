import React, { useState } from 'react';
import api from '../../api/api';
import groupService from '../../api/groupApi';
import Toast from '../common/Toast';
import ConfirmDialog from '../common/ConfirmDialog';

function GroupSettingsModal({ group, onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        name: group.name,
        description: group.description || '',
        privacy: group.privacy
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(group.avatar_url);
    const [coverPreview, setCoverPreview] = useState(group.cover_url);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        // Không tự động tắt toast ở đây, để component Toast tự xử lý
    };

    const hideToast = () => {
        setToast({ show: false, message: '', type: 'success' });
    };

    const showConfirm = (title, message, onConfirm, type = 'warning') => {
        setConfirmDialog({
            isOpen: true,
            title,
            message,
            type,
            onConfirm: onConfirm
        });
    };

    const handleCloseConfirm = () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null });
    };

    const handleConfirmAction = () => {
        if (confirmDialog.onConfirm) {
            confirmDialog.onConfirm();
        }
        handleCloseConfirm();
    };

    const handleImageChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            showToast('Ảnh không được vượt quá 5MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'avatar') {
                setAvatarPreview(reader.result);
                setAvatarFile(file);
            } else {
                setCoverPreview(reader.result);
                setCoverFile(file);
            }
        };
        reader.readAsDataURL(file);
    };

    const uploadImage = async (file) => {
        if (!file) return null;
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/api/v1/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data.image_url;
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            showToast('Vui lòng nhập tên nhóm', 'error');
            return;
        }
        
        if (formData.description.trim().length > 2000) {
            showToast('Mô tả không được vượt quá 2000 ký tự', 'error');
            return;
        }
        
        setLoading(true);
        
        try {
            let avatarUrl = null;
            let coverUrl = null;
            
            if (avatarFile) {
                try {
                    avatarUrl = await uploadImage(avatarFile);
                } catch (err) {
                    console.error('Avatar upload failed:', err);
                    showToast('Không thể upload ảnh đại diện, vui lòng thử lại', 'error');
                    setLoading(false);
                    return;
                }
            }
            
            if (coverFile) {
                try {
                    coverUrl = await uploadImage(coverFile);
                } catch (err) {
                    console.error('Cover upload failed:', err);
                    showToast('Không thể upload ảnh bìa, vui lòng thử lại', 'error');
                    setLoading(false);
                    return;
                }
            }
            
            const updateData = {};
            
            if (formData.name.trim() !== group.name) {
                updateData.name = formData.name.trim();
            }
            
            if (formData.description.trim() !== (group.description || '')) {
                updateData.description = formData.description.trim();
            }
            
            if (formData.privacy !== group.privacy) {
                updateData.privacy = formData.privacy;
            }
            
            if (avatarUrl) {
                updateData.avatar_url = avatarUrl;
            }
            
            if (coverUrl) {
                updateData.cover_url = coverUrl;
            }
            
            if (Object.keys(updateData).length === 0) {
                showToast('Không có thay đổi nào để cập nhật', 'error');
                setLoading(false);
                return;
            }
            
            await groupService.updateGroup(group._id, updateData);
            
            // Hiển thị toast thành công
            showToast('Cập nhật nhóm thành công!', 'success');

            setLoading(false);
            
            // Đợi 2 giây để toast hiển thị rồi mới đóng modal
            setTimeout(() => {
                onClose();
            }, 2000);
            
        } catch (error) {
            console.error('Error updating group:', error);
            
            let errorMessage = 'Không thể cập nhật nhóm. Vui lòng thử lại!';
            if (error.response?.data?.detail) {
                if (Array.isArray(error.response.data.detail)) {
                    errorMessage = error.response.data.detail[0]?.msg || errorMessage;
                } else {
                    errorMessage = error.response.data.detail;
                }
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            showToast(errorMessage, 'error');
            setLoading(false);
        }
    };

    const handleDeleteGroup = async () => {
        setLoading(true);
        try {
            await groupService.deleteGroup(group._id);
            showToast('Đã xóa nhóm thành công', 'success');
            
            // Đợi toast hiển thị xong rồi mới chuyển trang
            setTimeout(() => {
                window.location.href = '/groups';
            }, 2000);
        } catch (error) {
            console.error('Error deleting group:', error);
            showToast('Không thể xóa nhóm. Vui lòng thử lại!', 'error');
            setLoading(false);
        }
    };

    const confirmDelete = () => {
        showConfirm(
            'Xóa nhóm',
            `Bạn có chắc chắn muốn xóa nhóm "${group.name}" không? Hành động này không thể hoàn tác!`,
            handleDeleteGroup,
            'warning'
        );
    };

    return (
        <>
            {/* Modal Overlay */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }} onClick={onClose}>
                <div style={{
                    background: 'white',
                    width: '550px',
                    maxWidth: '90%',
                    borderRadius: '16px',
                    overflow: 'hidden'
                }} onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #e4e6eb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '20px' }}>Cài đặt nhóm</h3>
                        <button onClick={onClose} style={{
                            background: '#e4e6eb',
                            border: 'none',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            fontSize: '18px',
                            cursor: 'pointer'
                        }}>✕</button>
                    </div>
                    
                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid #e4e6eb' }}>
                        <button
                            onClick={() => setActiveTab('info')}
                            style={{
                                flex: 1,
                                padding: '14px',
                                border: 'none',
                                background: activeTab === 'info' ? '#f0f2f5' : 'transparent',
                                cursor: 'pointer',
                                fontWeight: activeTab === 'info' ? '600' : '400',
                                color: activeTab === 'info' ? '#2e7d32' : '#65676B',
                                fontSize: '14px'
                            }}
                        >
                            Thông tin chung
                        </button>
                        <button
                            onClick={() => setActiveTab('danger')}
                            style={{
                                flex: 1,
                                padding: '14px',
                                border: 'none',
                                background: activeTab === 'danger' ? '#f0f2f5' : 'transparent',
                                cursor: 'pointer',
                                fontWeight: activeTab === 'danger' ? '600' : '400',
                                color: activeTab === 'danger' ? '#dc3545' : '#65676B',
                                fontSize: '14px'
                            }}
                        >
                            Nguy hiểm
                        </button>
                    </div>
                    
                    {/* Content */}
                    <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
                        {activeTab === 'info' && (
                            <>
                                {/* Ảnh bìa */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Ảnh bìa</label>
                                    <div
                                        onClick={() => document.getElementById('cover-input').click()}
                                        style={{
                                            height: '160px',
                                            background: coverPreview ? `url(${coverPreview})` : '#f0f2f5',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            border: '2px dashed #ddd',
                                            position: 'relative'
                                        }}
                                    >
                                        {!coverPreview && <span style={{ color: '#65676B' }}>📷 Thêm ảnh bìa</span>}
                                        {coverPreview && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCoverPreview(null);
                                                    setCoverFile(null);
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    top: '8px',
                                                    right: '8px',
                                                    background: 'rgba(0,0,0,0.6)',
                                                    border: 'none',
                                                    color: 'white',
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '50%',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        id="cover-input"
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => handleImageChange(e, 'cover')}
                                    />
                                </div>
                                
                                {/* Ảnh đại diện */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Ảnh đại diện</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div
                                            onClick={() => document.getElementById('avatar-input').click()}
                                            style={{
                                                width: '80px',
                                                height: '80px',
                                                borderRadius: '50%',
                                                background: avatarPreview ? `url(${avatarPreview})` : '#f0f2f5',
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                border: '2px dashed #ddd',
                                                position: 'relative'
                                            }}
                                        >
                                            {!avatarPreview && <span style={{ fontSize: '32px' }}>👥</span>}
                                            {avatarPreview && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setAvatarPreview(null);
                                                        setAvatarFile(null);
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '-4px',
                                                        right: '-4px',
                                                        background: 'rgba(0,0,0,0.6)',
                                                        border: 'none',
                                                        color: 'white',
                                                        width: '24px',
                                                        height: '24px',
                                                        borderRadius: '50%',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#65676B' }}>
                                            <div>• Kích thước tối đa: 5MB</div>
                                            <div>• Định dạng: JPG, PNG, GIF</div>
                                        </div>
                                    </div>
                                    <input
                                        id="avatar-input"
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => handleImageChange(e, 'avatar')}
                                    />
                                </div>
                                
                                {/* Tên nhóm */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Tên nhóm</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        maxLength="100"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            fontSize: '14px'
                                        }}
                                    />
                                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                                        {formData.name.length}/100 ký tự
                                    </div>
                                </div>
                                
                                {/* Mô tả */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Mô tả</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => {
                                            const text = e.target.value;
                                            if (text.length <= 2000) {
                                                setFormData({ ...formData, description: text });
                                            } else {
                                                showToast('Mô tả không được vượt quá 2000 ký tự', 'error');
                                            }
                                        }}
                                        rows="4"
                                        maxLength="2000"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            resize: 'vertical'
                                        }}
                                    />
                                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                                        {formData.description.length}/2000 ký tự
                                    </div>
                                </div>
                                
                                {/* Quyền riêng tư */}
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Quyền riêng tư</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px',
                                            border: formData.privacy === 'public' ? '2px solid #2e7d32' : '1px solid #ddd',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            background: formData.privacy === 'public' ? '#f1f8e9' : 'white'
                                        }}>
                                            <input
                                                type="radio"
                                                name="privacy"
                                                value="public"
                                                checked={formData.privacy === 'public'}
                                                onChange={(e) => setFormData({ ...formData, privacy: e.target.value })}
                                            />
                                            <div>
                                                <div style={{ fontWeight: '600' }}>🌍 Công khai</div>
                                                <div style={{ fontSize: '13px', color: '#65676B' }}>Ai cũng có thể nhìn thấy nhóm</div>
                                            </div>
                                        </label>
                                        
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px',
                                            border: formData.privacy === 'private' ? '2px solid #2e7d32' : '1px solid #ddd',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            background: formData.privacy === 'private' ? '#f1f8e9' : 'white'
                                        }}>
                                            <input
                                                type="radio"
                                                name="privacy"
                                                value="private"
                                                checked={formData.privacy === 'private'}
                                                onChange={(e) => setFormData({ ...formData, privacy: e.target.value })}
                                            />
                                            <div>
                                                <div style={{ fontWeight: '600' }}>🔒 Riêng tư</div>
                                                <div style={{ fontSize: '13px', color: '#65676B' }}>Chỉ thành viên mới nhìn thấy nhóm</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}
                        
                        {activeTab === 'danger' && (
                            <div>
                                <div style={{
                                    background: '#fff3f3',
                                    border: '1px solid #ffcdd2',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    marginBottom: '16px'
                                }}>
                                    <h4 style={{ color: '#dc3545', margin: '0 0 12px 0', fontSize: '18px' }}>⚠️ Xóa nhóm</h4>
                                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px', lineHeight: '1.5' }}>
                                        Hành động này không thể hoàn tác. Tất cả bài viết, ảnh và dữ liệu trong nhóm sẽ bị xóa vĩnh viễn.
                                    </p>
                                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                                        <strong>Lưu ý:</strong> Bạn chỉ có thể xóa nhóm nếu bạn là chủ nhóm.
                                    </p>
                                    <button
                                        onClick={confirmDelete}
                                        disabled={loading}
                                        style={{
                                            padding: '12px 24px',
                                            background: loading ? '#ccc' : '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            fontWeight: '500',
                                            fontSize: '14px'
                                        }}
                                    >
                                        {loading ? 'Đang xóa...' : 'Xóa nhóm vĩnh viễn'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Footer */}
                    {activeTab === 'info' && (
                        <div style={{
                            padding: '16px 20px',
                            borderTop: '1px solid #e4e6eb',
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'flex-end'
                        }}>
                            <button onClick={onClose} style={{
                                padding: '10px 24px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                background: 'white',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}>
                                Hủy
                            </button>
                            <button onClick={handleSubmit} disabled={loading || !formData.name.trim()} style={{
                                padding: '10px 24px',
                                borderRadius: '8px',
                                border: 'none',
                                background: (loading || !formData.name.trim()) ? '#ccc' : '#2e7d32',
                                color: 'white',
                                cursor: (loading || !formData.name.trim()) ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Toast - đặt ở ngoài modal overlay với zIndex cao hơn */}
            {toast.show && (
                <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 2000 }}>
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={hideToast}
                        duration={3000}
                    />
                </div>
            )}
            
            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={handleCloseConfirm}
                onConfirm={handleConfirmAction}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type}
            />
        </>
    );
}

export default GroupSettingsModal;