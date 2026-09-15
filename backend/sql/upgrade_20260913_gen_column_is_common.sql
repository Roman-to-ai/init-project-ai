-- ----------------------------------------------------------------------------
-- 升级脚本：给代码生成器的列配置加「常用查询条件」标记
-- 日期：2026-09-13
--
-- 背景：生成的 CRUD 页面顶部搜索区原先平铺所有查询条件。加这个字段后，
-- 生成的页面可以把「常用」条件直接显示、「非常用」条件折叠起来
-- （见 vm/vue/v3ts/index.vue.vm）。
--
-- ⚠️ 不要重跑 ry_20260417.sql 来更新表结构 —— 那个脚本是 drop table if exists，
--    会把已经导入的生成配置（gen_table / gen_table_column 里的数据）全部清掉。
--    表结构变更一律用本目录下的升级脚本。
--
-- 执行方式：
--   docker exec -i @@PROJECT_SLUG@@-mysql mysql -uroot -p@@DB_PASSWORD@@ --default-character-set=utf8mb4 @@DB_NAME@@ < 本文件
--
-- 注意：MySQL 8.x 不支持 ADD COLUMN IF NOT EXISTS，重复执行会报
--       ERROR 1060 (42S21): Duplicate column name 'is_common'
--       看到这个错误说明已经升级过了，忽略即可。
-- ----------------------------------------------------------------------------

ALTER TABLE `gen_table_column`
  ADD COLUMN `is_common` char(1) DEFAULT NULL COMMENT '是否常用查询条件（1是）' AFTER `is_query`;

-- 存量数据：把已经勾了查询的列全部标为「常用」，与导入新表时的默认值保持一致，
-- 这样升级后已导入的表生成的页面不会突然多出一堆折叠项。
UPDATE `gen_table_column` SET `is_common` = '1' WHERE `is_query` = '1' AND `is_common` IS NULL;
