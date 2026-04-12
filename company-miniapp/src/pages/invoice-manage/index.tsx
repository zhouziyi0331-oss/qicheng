import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

interface Invoice {
  id: number;
  invoice_type: string;
  invoice_title: string;
  tax_number: string;
  amount: number;
  status: string;
  invoice_number?: string;
  invoice_url?: string;
  created_at: string;
  issued_at?: string;
}

export default function InvoiceManage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const token = Taro.getStorageSync('token');

      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/company/invoices',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.statusCode === 200) {
        setInvoices(res.data.data || []);
      }
    } catch (error) {
      console.error('加载发票列表失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyInvoice = () => {
    Taro.navigateTo({
      url: '/pages/apply-invoice/index'
    });
  };

  const handleDownload = (invoice: Invoice) => {
    if (!invoice.invoice_url) {
      Taro.showToast({
        title: '发票尚未开具',
        icon: 'none'
      });
      return;
    }

    Taro.downloadFile({
      url: invoice.invoice_url,
      success: (res) => {
        if (res.statusCode === 200) {
          Taro.openDocument({
            filePath: res.tempFilePath,
            showMenu: true
          });
        }
      },
      fail: () => {
        Taro.showToast({
          title: '下载失败',
          icon: 'none'
        });
      }
    });
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '待开具',
      'processing': '开具中',
      'issued': '已开具',
      'rejected': '已拒绝'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status: string) => {
    const classMap: Record<string, string> = {
      'pending': 'pending',
      'processing': 'processing',
      'issued': 'issued',
      'rejected': 'rejected'
    };
    return classMap[status] || '';
  };

  const getTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      'personal': '个人',
      'company': '企业'
    };
    return typeMap[type] || type;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View className="invoice-manage-page">
        <View className="loading">
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="invoice-manage-page">
      <View className="header">
        <View className="header-info">
          <Text className="title">发票管理</Text>
          <Text className="subtitle">{invoices.length}张发票</Text>
        </View>
        <View className="apply-btn" onClick={handleApplyInvoice}>
          <Text className="apply-text">申请开票</Text>
        </View>
      </View>

      {invoices.length === 0 ? (
        <View className="empty">
          <Text className="empty-icon">📄</Text>
          <Text className="empty-text">暂无发票记录</Text>
          <Text className="empty-hint">完成支付后可申请开具发票</Text>
        </View>
      ) : (
        <ScrollView className="invoice-list" scrollY>
          {invoices.map((invoice) => (
            <View key={invoice.id} className="invoice-card">
              <View className="card-header">
                <View className="invoice-info">
                  <Text className="invoice-title">{invoice.invoice_title}</Text>
                  <Text className="invoice-type">{getTypeText(invoice.invoice_type)}</Text>
                </View>
                <View className={`status-badge ${getStatusClass(invoice.status)}`}>
                  <Text className="status-text">{getStatusText(invoice.status)}</Text>
                </View>
              </View>

              <View className="card-body">
                <View className="info-row">
                  <Text className="info-label">税号</Text>
                  <Text className="info-value">{invoice.tax_number}</Text>
                </View>
                <View className="info-row">
                  <Text className="info-label">金额</Text>
                  <Text className="info-value amount">¥{invoice.amount.toFixed(2)}</Text>
                </View>
                {invoice.invoice_number && (
                  <View className="info-row">
                    <Text className="info-label">发票号</Text>
                    <Text className="info-value">{invoice.invoice_number}</Text>
                  </View>
                )}
                <View className="info-row">
                  <Text className="info-label">申请时间</Text>
                  <Text className="info-value">{formatDate(invoice.created_at)}</Text>
                </View>
                {invoice.issued_at && (
                  <View className="info-row">
                    <Text className="info-label">开具时间</Text>
                    <Text className="info-value">{formatDate(invoice.issued_at)}</Text>
                  </View>
                )}
              </View>

              {invoice.status === 'issued' && (
                <View className="card-footer">
                  <View
                    className="download-btn"
                    onClick={() => handleDownload(invoice)}
                  >
                    <Text className="download-text">下载发票</Text>
                  </View>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
