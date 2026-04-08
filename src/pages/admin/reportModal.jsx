// src/components/report/ReportModal.jsx
import React, { useState } from 'react';
import api from '../../api/api';

const REPORT_TYPES = [
    { value: 'spam', label: 'Spam', icon: '📧', description: 'Nội dung quảng cáo, spam' },
    { value: 'harassment', label: 'Quấy rối', icon: '😡', description: 'Quấy rối, đe dọa' },
    { value: 'hate_speech', label: 'Ngôn ngữ thù địch', icon: '💢', description: 'Kích động thù địch, phân biệt' },
    { value: 'violence', label: 'Bạo lực', icon: '🔫', description: 'Nội dung bạo lực' },
    { value: 'adult_content', label: 'Nội dung người lớn', icon: '🔞', description: 'Nội dung không phù hợp' },
    { value: 'misinformation', label: 'Thông tin sai lệch', icon: '❌', description: 'Tin giả, thông tin sai sự thật' },
    { value: 'copyright', label: 'Vi phạm bản quyền', icon: '©️', description: 'Sao chép trái phép' },
    { value: 'other', label: 'Khác', icon: '📝', description: 'Lý do khác' }
];

function ReportModal({ post, onClose, onReportSuccess }) {
    const [selectedType, setSelectedType] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        if (!selectedType) {
            setError('Vui lòng chọn lý do báo cáo');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await api.post('/api/v1/reports/', {
                target_type: 'post',
                target_id: post._id,
                report_type: selectedType,
                reason: REPORT_TYPES.find(t => t.value === selectedType)?.label || selectedType,
                description: description || null
            });
            
            onReportSuccess();
            onClose();
        } catch (err) {
            console.error('Error reporting post:', err);
            if (err.response?.status === 400) {
                setError(err.response.data.detail || 'Không thể báo cáo bài viết này');
            } else {
                setError('Có lỗi xảy ra, vui lòng thử lại sau');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000
        }} onClick={onClose}>
            <div style={{
                background: "white",
                width: "500px",
                maxWidth: "90%",
                borderRadius: "16px",
                overflow: "hidden"
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{
                    padding: "16px",
                    borderBottom: "1px solid #e4e6eb",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <h3 style={{ margin: 0, fontSize: "18px" }}>
                        ⚠️ Báo cáo vi phạm
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: "transparent",
                            border: "none",
                            fontSize: "24px",
                            cursor: "pointer"
                        }}
                    >✕</button>
                </div>

                <div style={{ padding: "16px" }}>
                    <p style={{ marginBottom: "12px", color: "#65676B", fontSize: "14px" }}>
                        Bài viết của <strong>{post.author_name}</strong> vi phạm điều gì?
                    </p>

                    <div style={{ marginBottom: "20px" }}>
                        {REPORT_TYPES.map(type => (
                            <label
                                key={type.value}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    padding: "12px",
                                    marginBottom: "8px",
                                    background: selectedType === type.value ? "#e8f5e9" : "#f0f2f5",
                                    borderRadius: "12px",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                            >
                                <input
                                    type="radio"
                                    name="report_type"
                                    value={type.value}
                                    checked={selectedType === type.value}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    style={{ marginRight: "12px", marginTop: "2px" }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                                        <span style={{ marginRight: "8px" }}>{type.icon}</span>
                                        {type.label}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#65676B" }}>
                                        {type.description}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>

                    <textarea
                        placeholder="Mô tả thêm (không bắt buộc)..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="3"
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #ddd",
                            borderRadius: "12px",
                            fontSize: "14px",
                            resize: "vertical",
                            fontFamily: "inherit"
                        }}
                    />

                    {error && (
                        <div style={{
                            marginTop: "12px",
                            padding: "10px",
                            background: "#fee2e2",
                            borderRadius: "8px",
                            color: "#dc2626",
                            fontSize: "14px"
                        }}>
                            {error}
                        </div>
                    )}
                </div>

                <div style={{
                    padding: "16px",
                    borderTop: "1px solid #e4e6eb",
                    display: "flex",
                    gap: "12px",
                    justifyContent: "flex-end"
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: "8px 20px",
                            border: "1px solid #ddd",
                            background: "white",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px"
                        }}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedType || isSubmitting}
                        style={{
                            padding: "8px 20px",
                            border: "none",
                            background: (!selectedType || isSubmitting) ? "#ccc" : "#dc2626",
                            color: "white",
                            borderRadius: "8px",
                            cursor: (!selectedType || isSubmitting) ? "not-allowed" : "pointer",
                            fontSize: "14px",
                            fontWeight: "500"
                        }}
                    >
                        {isSubmitting ? "Đang gửi..." : "Gửi báo cáo"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ReportModal;