// src/components/groups/CreateGroupModal.jsx
import React, { useState } from 'react';
import api from '../../api/api';
import groupService from '../../api/groupApi';

function CreateGroupModal({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        privacy: 'public'
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleImageChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            alert('Ảnh không được vượt quá 5MB');
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file ảnh');
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
        formData.append('file', file); // Chú ý: 'file' không phải 'files'
        
        try {
            const response = await api.post('/api/v1/upload/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data.image_url;
        } catch (error) {
            console.error('Upload error:', error);
            return null;
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            alert('Vui lòng nhập tên nhóm');
            return;
        }
        
        if (formData.name.length > 100) {
            alert('Tên nhóm không được vượt quá 100 ký tự');
            return;
        }
        
        setLoading(true);
        
        try {
            // Upload ảnh nếu có (bỏ qua lỗi upload)
            let avatarUrl = null;
            let coverUrl = null;
            
            if (avatarFile) {
                avatarUrl = await uploadImage(avatarFile);
            }
            if (coverFile) {
                coverUrl = await uploadImage(coverFile);
            }
            
            const groupData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                privacy: formData.privacy,
                avatar_url: avatarUrl,
                cover_url: coverUrl
            };
            
            const response = await groupService.createGroup(groupData);
            onSuccess?.(response);
            onClose();
        } catch (error) {
            console.error('Error creating group:', error);
            const errorMsg = error.response?.data?.detail || 'Không thể tạo nhóm. Vui lòng thử lại!';
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    width: '550px',
                    maxWidth: '90%',
                    borderRadius: '16px',
                    overflow: 'hidden'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #e4e6eb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#fff'
                    }}
                >
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Tạo nhóm mới</h3>
                    <button
                        onClick={onClose}
                        style={{
                            backgroundColor: '#e4e6eb',
                            border: 'none',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            fontSize: '18px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ✕
                    </button>
                </div>
                
                {/* Content */}
                <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                    {/* Ảnh bìa */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                            Ảnh bìa <span style={{ color: '#888', fontWeight: 'normal' }}>(không bắt buộc)</span>
                        </label>
                        <div
                            onClick={() => document.getElementById('cover-input').click()}
                            style={{
                                height: '160px',
                                backgroundColor: coverPreview ? 'transparent' : '#f0f2f5',
                                backgroundImage: coverPreview ? `url(${coverPreview})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                border: '2px dashed #ddd',
                                position: 'relative'
                            }}
                        >
                            {!coverPreview && (
                                <div style={{ textAlign: 'center', color: '#65676B' }}>
                                    <span style={{ fontSize: '32px' }}>📷</span>
                                    <div style={{ fontSize: '13px', marginTop: '8px' }}>Thêm ảnh bìa</div>
                                </div>
                            )}
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
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                        border: 'none',
                                        color: 'white',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
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
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                            Ảnh đại diện <span style={{ color: '#888', fontWeight: 'normal' }}>(không bắt buộc)</span>
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div
                                onClick={() => document.getElementById('avatar-input').click()}
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    backgroundColor: avatarPreview ? 'transparent' : '#f0f2f5',
                                    backgroundImage: avatarPreview ? `url(${avatarPreview})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
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
                                            backgroundColor: 'rgba(0,0,0,0.6)',
                                            border: 'none',
                                            color: 'white',
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '12px'
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
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                            Tên nhóm <span style={{ color: '#dc3545' }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="VD: Yêu Nha Trang, Cộng đồng IT..."
                            maxLength="100"
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                            autoFocus
                        />
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                            {formData.name.length}/100 ký tự
                        </div>
                    </div>
                    
                    {/* Mô tả */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                            Mô tả <span style={{ color: '#888', fontWeight: 'normal' }}>(không bắt buộc)</span>
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Mô tả về nhóm, mục đích, quy định..."
                            rows="4"
                            maxLength="500"
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '14px',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box'
                            }}
                        />
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                            {formData.description.length}/500 ký tự
                        </div>
                    </div>
                    
                    {/* Quyền riêng tư */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                            Quyền riêng tư
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    border: formData.privacy === 'public' ? '2px solid #2e7d32' : '1px solid #ddd',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    backgroundColor: formData.privacy === 'public' ? '#f1f8e9' : 'white'
                                }}
                            >
                                <input
                                    type="radio"
                                    name="privacy"
                                    value="public"
                                    checked={formData.privacy === 'public'}
                                    onChange={(e) => setFormData({ ...formData, privacy: e.target.value })}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>🌍 Công khai</div>
                                    <div style={{ fontSize: '13px', color: '#65676B' }}>
                                        Ai cũng có thể nhìn thấy nhóm và bài viết. Mọi người có thể tham gia mà không cần duyệt.
                                    </div>
                                </div>
                            </label>
                            
                            <label
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    border: formData.privacy === 'private' ? '2px solid #2e7d32' : '1px solid #ddd',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    backgroundColor: formData.privacy === 'private' ? '#f1f8e9' : 'white'
                                }}
                            >
                                <input
                                    type="radio"
                                    name="privacy"
                                    value="private"
                                    checked={formData.privacy === 'private'}
                                    onChange={(e) => setFormData({ ...formData, privacy: e.target.value })}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>🔒 Riêng tư</div>
                                    <div style={{ fontSize: '13px', color: '#65676B' }}>
                                        Chỉ thành viên mới nhìn thấy nhóm và bài viết. Cần được phê duyệt khi tham gia.
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                {/* Footer */}
                <div
                    style={{
                        padding: '16px 20px',
                        borderTop: '1px solid #e4e6eb',
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end',
                        backgroundColor: '#fff'
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !formData.name.trim()}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: (loading || !formData.name.trim()) ? '#ccc' : '#2e7d32',
                            color: 'white',
                            cursor: (loading || !formData.name.trim()) ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        {loading ? 'Đang tạo...' : 'Tạo nhóm'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateGroupModal;