// src/components/shop/PaymentManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaTrash, FaEdit, FaSave, FaTimes, 
  FaUniversity, FaQrcode, FaUpload, FaCheck,
  FaSpinner, FaEye, FaEyeSlash, FaCopy
} from 'react-icons/fa';
import { shopApi } from '../../api/api';

const PaymentManagement = ({ settings, updateSettings, showToast }) => {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    bank_name: '',
    bank_code: '',
    account_number: '',
    account_name: '',
    branch: '',
    is_active: true
  });
  const [uploadingQR, setUploadingQR] = useState(false);
  const [showQRPreview, setShowQRPreview] = useState(null);

  // Danh sách ngân hàng Việt Nam
  const bankList = [
    { code: 'VCB', name: 'Vietcombank' },
    { code: 'BIDV', name: 'BIDV' },
    { code: 'CTG', name: 'VietinBank' },
    { code: 'AGB', name: 'Agribank' },
    { code: 'MB', name: 'MBBank' },
    { code: 'TCB', name: 'Techcombank' },
    { code: 'ACB', name: 'ACB' },
    { code: 'VPB', name: 'VPBank' },
    { code: 'STB', name: 'Sacombank' },
    { code: 'HDB', name: 'HDBank' },
    { code: 'VIB', name: 'VIB' },
    { code: 'SHB', name: 'SHB' },
    { code: 'TPB', name: 'TPBank' },
    { code: 'MSB', name: 'MSB' },
    { code: 'OCB', name: 'OCB' },
    { code: 'BVB', name: 'BaoViet Bank' },
    { code: 'KBank', name: 'KienLong Bank' },
    { code: 'LPB', name: 'LienVietPostBank' },
    { code: 'NAB', name: 'NamABank' },
    { code: 'PGB', name: 'PGBank' },
    { code: 'SCB', name: 'SCB' },
    { code: 'SGB', name: 'SaigonBank' },
    { code: 'VAB', name: 'VietABank' },
    { code: 'VBB', name: 'VietBank' }
  ];

  useEffect(() => {
    if (settings?.payment?.bank_accounts) {
      setBankAccounts(settings.payment.bank_accounts);
    }
  }, [settings]);

  const handleOpenModal = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        bank_name: account.bank_name,
        bank_code: account.bank_code,
        account_number: account.account_number,
        account_name: account.account_name,
        branch: account.branch || '',
        is_active: account.is_active !== false
      });
    } else {
      setEditingAccount(null);
      setFormData({
        bank_name: '',
        bank_code: '',
        account_number: '',
        account_name: '',
        branch: '',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleSaveAccount = async () => {
    if (!formData.bank_name || !formData.account_number || !formData.account_name) {
      showToast('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (editingAccount) {
        // Cập nhật
        response = await shopApi.put(
          `/api/v1/shop/settings/payment/bank-accounts/${editingAccount.id}`,
          formData
        );
        showToast('Cập nhật tài khoản thành công', 'success');
      } else {
        // Thêm mới
        response = await shopApi.post('/api/v1/shop/settings/payment/bank-accounts', formData);
        showToast('Thêm tài khoản thành công', 'success');
      }

      // Refresh settings
      const settingsResponse = await shopApi.get('/api/v1/shop/settings');
      if (settingsResponse.data?.payment?.bank_accounts) {
        setBankAccounts(settingsResponse.data.payment.bank_accounts);
        updateSettings('payment', settingsResponse.data.payment);
      }

      setShowModal(false);
    } catch (error) {
      console.error('Error saving bank account:', error);
      showToast(error.response?.data?.detail || 'Có lỗi xảy ra', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      return;
    }

    setLoading(true);
    try {
      await shopApi.delete(`/api/v1/shop/settings/payment/bank-accounts/${accountId}`);
      showToast('Xóa tài khoản thành công', 'success');

      // Refresh settings
      const settingsResponse = await shopApi.get('/api/v1/shop/settings');
      if (settingsResponse.data?.payment?.bank_accounts) {
        setBankAccounts(settingsResponse.data.payment.bank_accounts);
        updateSettings('payment', settingsResponse.data.payment);
      }
    } catch (error) {
      console.error('Error deleting bank account:', error);
      showToast(error.response?.data?.detail || 'Có lỗi xảy ra', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadQR = async (accountId, file) => {
    if (!file) return;

    setUploadingQR(true);
    try {
      const formData = new FormData();
      formData.append('account_id', accountId);
      formData.append('file', file);

      const response = await shopApi.post('/api/v1/shop/settings/payment/upload-qr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast('Upload QR code thành công', 'success');

      // Refresh settings
      const settingsResponse = await shopApi.get('/api/v1/shop/settings');
      if (settingsResponse.data?.payment?.bank_accounts) {
        setBankAccounts(settingsResponse.data.payment.bank_accounts);
        updateSettings('payment', settingsResponse.data.payment);
      }
    } catch (error) {
      console.error('Error uploading QR code:', error);
      showToast(error.response?.data?.detail || 'Có lỗi xảy ra', 'error');
    } finally {
      setUploadingQR(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Đã sao chép', 'success');
  };

  return (
    <div className="payment-management">
      {/* Header với nút thêm */}
      <div className="payment-header">
        <h3>Quản lý tài khoản ngân hàng</h3>
        <button className="btn-add" onClick={() => handleOpenModal()}>
          <FaPlus /> Thêm tài khoản
        </button>
      </div>

      {/* Danh sách tài khoản */}
      {bankAccounts.length === 0 ? (
        <div className="empty-state">
          <FaUniversity size={48} color="#ccc" />
          <p>Chưa có tài khoản ngân hàng nào</p>
          <button onClick={() => handleOpenModal()}>Thêm tài khoản đầu tiên</button>
        </div>
      ) : (
        <div className="bank-accounts-list">
          {bankAccounts.map(account => (
            <div key={account.id} className={`bank-account-card ${!account.is_active ? 'inactive' : ''}`}>
              <div className="bank-account-header">
                <div className="bank-info">
                  <FaUniversity className="bank-icon" />
                  <div>
                    <h4>{account.bank_name}</h4>
                    <span className="bank-code">{account.bank_code}</span>
                  </div>
                </div>
                <div className="bank-actions">
                  <button 
                    className="action-btn edit" 
                    onClick={() => handleOpenModal(account)}
                    title="Sửa"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="action-btn delete" 
                    onClick={() => handleDeleteAccount(account.id)}
                    title="Xóa"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="bank-account-details">
                <div className="detail-row">
                  <span className="label">Số tài khoản:</span>
                  <div className="value-with-copy">
                    <strong>{account.account_number}</strong>
                    <button onClick={() => copyToClipboard(account.account_number)} className="copy-btn">
                      <FaCopy size={12} />
                    </button>
                  </div>
                </div>
                <div className="detail-row">
                  <span className="label">Chủ tài khoản:</span>
                  <span>{account.account_name}</span>
                </div>
                {account.branch && (
                  <div className="detail-row">
                    <span className="label">Chi nhánh:</span>
                    <span>{account.branch}</span>
                  </div>
                )}
              </div>

              {/* QR Code Section */}
              <div className="qr-code-section">
                <div className="qr-header">
                  <FaQrcode /> Mã QR thanh toán
                </div>
                {account.qr_code_url ? (
                  <div className="qr-preview">
                    <img 
                      src={account.qr_code_url} 
                      alt="QR Code" 
                      onClick={() => setShowQRPreview(account.qr_code_url)}
                    />
                    <label className="upload-qr-btn">
                      <FaUpload />
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleUploadQR(account.id, e.target.files[0])}
                        disabled={uploadingQR}
                      />
                      {uploadingQR ? <FaSpinner className="spinning" /> : 'Đổi QR'}
                    </label>
                  </div>
                ) : (
                  <label className="upload-qr-placeholder">
                    <FaUpload />
                    <span>Tải lên mã QR</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleUploadQR(account.id, e.target.files[0])}
                      disabled={uploadingQR}
                    />
                    {uploadingQR && <FaSpinner className="spinning" />}
                  </label>
                )}
              </div>

              {/* Trạng thái */}
              <div className="bank-status">
                <span className={`status-badge ${account.is_active ? 'active' : 'inactive'}`}>
                  {account.is_active ? 'Đang sử dụng' : 'Tạm dừng'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm/Sửa tài khoản */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content bank-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingAccount ? 'Sửa tài khoản' : 'Thêm tài khoản ngân hàng'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Ngân hàng *</label>
                <select
                  value={formData.bank_name}
                  onChange={(e) => {
                    const selectedBank = bankList.find(b => b.name === e.target.value);
                    setFormData({
                      ...formData,
                      bank_name: e.target.value,
                      bank_code: selectedBank?.code || ''
                    });
                  }}
                >
                  <option value="">Chọn ngân hàng</option>
                  {bankList.map(bank => (
                    <option key={bank.code} value={bank.name}>{bank.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Mã ngân hàng</label>
                  <input
                    type="text"
                    value={formData.bank_code}
                    readOnly
                    className="readonly"
                  />
                </div>
                <div className="form-group">
                  <label>Số tài khoản *</label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    placeholder="VD: 123456789"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Chủ tài khoản *</label>
                <input
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="Tên chủ tài khoản"
                />
              </div>

              <div className="form-group">
                <label>Chi nhánh</label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="VD: Chi nhánh Hà Nội"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>Kích hoạt tài khoản</span>
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Hủy
              </button>
              <button className="btn-save" onClick={handleSaveAccount} disabled={loading}>
                {loading ? <FaSpinner className="spinning" /> : <FaSave />}
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview QR Code */}
      {showQRPreview && (
        <div className="modal-overlay" onClick={() => setShowQRPreview(null)}>
          <div className="modal-content qr-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Mã QR thanh toán</h3>
              <button className="close-btn" onClick={() => setShowQRPreview(null)}>
                <FaTimes />
              </button>
            </div>
            <div className="qr-preview-full">
              <img src={showQRPreview} alt="QR Code Full" />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .payment-management {
          padding: 20px 0;
        }

        .payment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .payment-header h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .btn-add {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #2e7d32;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-add:hover {
          background: #1b5e20;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: #f8f9fa;
          border-radius: 12px;
        }

        .empty-state p {
          margin: 16px 0;
          color: #666;
        }

        .empty-state button {
          padding: 10px 20px;
          background: #2e7d32;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .bank-accounts-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 20px;
        }

        .bank-account-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 16px;
          transition: box-shadow 0.2s;
        }

        .bank-account-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .bank-account-card.inactive {
          opacity: 0.7;
          background: #fafafa;
        }

        .bank-account-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #eee;
        }

        .bank-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bank-icon {
          font-size: 32px;
          color: #2e7d32;
        }

        .bank-info h4 {
          margin: 0;
          font-size: 16px;
        }

        .bank-code {
          font-size: 12px;
          color: #999;
        }

        .bank-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .action-btn.edit {
          color: #ff9800;
        }

        .action-btn.edit:hover {
          background: #fff3e0;
        }

        .action-btn.delete {
          color: #f44336;
        }

        .action-btn.delete:hover {
          background: #ffebee;
        }

        .bank-account-details {
          margin-bottom: 16px;
        }

        .detail-row {
          display: flex;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .detail-row .label {
          width: 100px;
          color: #666;
        }

        .value-with-copy {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .copy-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #2e7d32;
          padding: 2px 4px;
        }

        .qr-code-section {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #eee;
        }

        .qr-header {
          font-size: 13px;
          color: #666;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .qr-preview {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .qr-preview img {
          width: 60px;
          height: 60px;
          border: 1px solid #ddd;
          border-radius: 8px;
          cursor: pointer;
        }

        .upload-qr-btn, .upload-qr-placeholder {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          position: relative;
        }

        .upload-qr-btn input, .upload-qr-placeholder input {
          position: absolute;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }

        .upload-qr-placeholder {
          justify-content: center;
          width: 120px;
          color: #999;
        }

        .bank-status {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #eee;
          text-align: right;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
        }

        .status-badge.active {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .status-badge.inactive {
          background: #ffebee;
          color: #f44336;
        }

        /* Modal styles */
        .bank-modal {
          max-width: 500px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #555;
        }

        .form-group input, .form-group select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .form-group input:focus, .form-group select:focus {
          outline: none;
          border-color: #2e7d32;
        }

        .form-group input.readonly {
          background: #f5f5f5;
          color: #666;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .checkbox-label input {
          width: auto;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid #eee;
        }

        .btn-cancel, .btn-save {
          padding: 8px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-cancel {
          background: #f5f5f5;
          border: 1px solid #ddd;
          color: #666;
        }

        .btn-save {
          background: #2e7d32;
          border: none;
          color: white;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-save:hover:not(:disabled) {
          background: #1b5e20;
        }

        .btn-save:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .qr-preview-modal {
          max-width: 400px;
          text-align: center;
        }

        .qr-preview-full img {
          width: 100%;
          max-width: 300px;
          margin: 0 auto;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default PaymentManagement;