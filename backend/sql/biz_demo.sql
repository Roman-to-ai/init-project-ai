-- ============================================================================
-- 演示业务表 —— 可整份删除
--
-- 用途（三合一）：
--   1. 证明「代码生成器 → @@MAVEN_ARTIFACT_PREFIX@@-biz 模块 → 前端」这条链是通的
--   2. 作为 is_common（查询条件常用/非常用）的集成测试：
--      4 个查询条件，其中 plan_start 标为「非常用」，用来逼出「展开查看更多」
--   3. 新模块的抄写样板
--
-- 删除步骤见 backend/@@MAVEN_ARTIFACT_PREFIX@@-biz/README.md
--
-- 单独放一个文件、**不混进 ry_20260417.sql**，是为了让删除示例不需要动基线种子，
-- 基线也才能继续和上游保持可 diff。
--
-- 导入：
--   docker exec -i @@PROJECT_SLUG@@-mysql mysql -uroot -p@@DB_PASSWORD@@ --default-character-set=utf8mb4 @@DB_NAME@@ < biz_demo.sql
-- ============================================================================

drop table if exists biz_demo_order;
create table biz_demo_order (
  order_id      bigint(20)   not null auto_increment  comment '工单ID',
  order_no      varchar(64)  not null                 comment '工单编号',
  product_name  varchar(128)                          comment '产品名称',
  order_status  char(1)      default '0'              comment '工单状态',
  plan_qty      int(11)      default 0                comment '计划数量',
  plan_start    datetime                              comment '计划开工时间',
  del_flag      char(1)      default '0'              comment '删除标志（0存在 2删除）',
  create_by     varchar(64)  default ''               comment '创建者',
  create_time   datetime                              comment '创建时间',
  update_by     varchar(64)  default ''               comment '更新者',
  update_time   datetime                              comment '更新时间',
  remark        varchar(500)                          comment '备注',
  primary key (order_id)
) engine=innodb auto_increment=1 comment = '演示工单表';

-- ----------------------------------------------------------------------------
-- 工单状态字典
--
-- ⚠️ 必须配：GenUtils 对**列名以 status 结尾**的字段会自动把控件设成 radio，
--    而模板里 radio/select 分支依赖 dictType —— dictType 为空时生成的
--    el-form-item **整个消失**，一个查询条件就这么静默丢了。
--    （这是上游模板的既有 bug，已知坑里记着。）
-- ----------------------------------------------------------------------------
delete from sys_dict_type where dict_type = 'biz_order_status';
insert into sys_dict_type values(100, '工单状态', 'biz_order_status', '0', 'admin', sysdate(), '', null, '演示工单状态列表');

delete from sys_dict_data where dict_type = 'biz_order_status';
insert into sys_dict_data values(100, 1, '待生产', '0', 'biz_order_status', '', 'primary', 'N', '0', 'admin', sysdate(), '', null, '待生产');
insert into sys_dict_data values(101, 2, '生产中', '1', 'biz_order_status', '', 'warning', 'N', '0', 'admin', sysdate(), '', null, '生产中');
insert into sys_dict_data values(102, 3, '已完成', '2', 'biz_order_status', '', 'success', 'N', '0', 'admin', sysdate(), '', null, '已完成');

-- ----------------------------------------------------------------------------
-- 演示数据（可选，代码不依赖它）
-- ----------------------------------------------------------------------------
delete from biz_demo_order;
insert into biz_demo_order values(1, 'WO-2026-0001', '示例产品 A', '0', 100, '2026-09-20 08:00:00', '0', 'admin', sysdate(), '', null, '这是一条演示数据');
insert into biz_demo_order values(2, 'WO-2026-0002', '示例产品 B', '1', 250, '2026-09-21 08:00:00', '0', 'admin', sysdate(), '', null, null);
insert into biz_demo_order values(3, 'WO-2026-0003', '示例产品 C', '2', 80,  '2026-09-15 08:00:00', '0', 'admin', sysdate(), '', null, null);
