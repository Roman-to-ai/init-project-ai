-- ============================================================================
-- 删掉 gen_table.tpl_web_type（前端模板类型）—— 存量库升级
--
-- 为什么删：上游自带 6 套前端模板，本项目只用 Vue3 + Element Plus + TypeScript 那一套。
-- 于是「前端类型」这个选择本身就没有意义了 —— 2026-09-14 把另外几套模板、生成器界面上的
-- 那个下拉、以及这个列一并去掉，生成逻辑现在只认 `vm/vue/v3ts/` 那一套。
--
-- ⚠️ 列里的值会一起丢。但它早已没人读（生成器不再看它），所以无影响。
-- ⚠️ MySQL 8.x 不支持 DROP COLUMN IF EXISTS，重复执行会报
--    ERROR 1091 (Can't DROP 'tpl_web_type')，**属正常，忽略即可**。
--
-- 新库不用跑这个：ry_20260417.sql 里已经没有这一列。
--
-- 执行：
--   docker exec -i @@PROJECT_SLUG@@-mysql mysql -uroot -p@@DB_PASSWORD@@ --default-character-set=utf8mb4 @@DB_NAME@@ \
--     < backend/sql/upgrade_20260914_drop_gen_table_tpl_web_type.sql
-- ============================================================================

ALTER TABLE gen_table DROP COLUMN tpl_web_type;
