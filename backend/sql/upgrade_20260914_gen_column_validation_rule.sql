-- ============================================================================
-- 给 gen_table_column 增加 validation_rule（校验规则 JSON）—— 存量库升级
--
-- 新库不用跑这个：ry_20260417.sql 里已含该列。
--
-- ⚠️ MySQL 8.x 不支持 ADD COLUMN IF NOT EXISTS，重复执行会报
--    ERROR 1060 (Duplicate column name)，**属正常，忽略即可**。
-- ⚠️ 不要为了"重新初始化"去重跑 ry_20260417.sql —— 那是 drop table 重建，
--    会把 gen_table / gen_table_column 里已导入的表配置全清掉。
--
-- 执行：
--   docker exec -i @@PROJECT_SLUG@@-mysql mysql -uroot -p@@DB_PASSWORD@@ --default-character-set=utf8mb4 @@DB_NAME@@ \
--     < backend/sql/upgrade_20260914_gen_column_validation_rule.sql
-- ============================================================================

ALTER TABLE gen_table_column
  ADD COLUMN validation_rule varchar(2000) NULL COMMENT '校验规则JSON（长度/正则/数值范围/精度/文件数量等，DDL 表达不了的约束）'
  AFTER is_common;
