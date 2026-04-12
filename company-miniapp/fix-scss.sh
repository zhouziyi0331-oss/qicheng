#!/bin/bash

# Fix payments/index.scss
cat > src/pages/payments/index.scss << 'EOF'
.payments-page {
  min-height: 100vh;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
}

.tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.tab.active {
  background: #6366f1;
  color: #ffffff;
  font-weight: 500;
}

.payment-list {
  flex: 1;
  padding: 15px;
  padding-bottom: 100px;
}

.payment-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.task-title {
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
  flex: 1;
  margin-right: 10px;
}

.payment-status {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  white-space: nowrap;
}

.status-daifukuan {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.status-daiqueren {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.status-yiwancheng {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.payment-info {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.info-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.info-value {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.info-value.amount {
  color: #fbbf24;
  font-weight: 500;
  font-size: 16px;
}

.payment-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.action-btn {
  flex: 1;
  text-align: center;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.action-btn.primary {
  background: #6366f1;
  color: #ffffff;
  border: none;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
}

.stats-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: rgba(26, 26, 46, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 6px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #ffffff;
}
EOF

echo "Fixed payments/index.scss"
