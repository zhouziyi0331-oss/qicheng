-- Migration: 045_add_startup_report_type
-- Description: 扩展报告类型枚举，新增 R6（创业综合报告）
-- Date: 2024-01-XX

-- 扩展 report_type 枚举，新增 R6
ALTER TYPE report_type ADD VALUE IF NOT EXISTS 'R6';

-- 更新枚举注释
COMMENT ON TYPE report_type IS 'R1:能力全景图, R2:执行力档案, R3:学习成长曲线, R4:简历包装方案, R5:OPC方向报告, R6:创业综合报告, full:完整版';
