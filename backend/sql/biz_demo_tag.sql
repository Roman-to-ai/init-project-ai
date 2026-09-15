-- ============================================================================
-- 演示标签表 + 产品-标签关联表 —— **多对多**的样板
--
-- 关联关系存在辅助表 biz_demo_product_tag 里（本表没有那一列），
-- 产品表上的 tag_names 是**冗余显示列**，由生成器产出的 SQL 按辅助表重算。
-- 配置见 gen_table_column 里 biz_demo_product.tag_names 的 validation_rule。
--
-- 执行：
--   docker exec -i @@PROJECT_SLUG@@-mysql mysql -uroot -p@@DB_PASSWORD@@ --default-character-set=utf8mb4 @@DB_NAME@@ \
--     < backend/sql/biz_demo_tag.sql
-- ============================================================================

drop table if exists biz_demo_tag;
create table biz_demo_tag (
  tag_id      bigint(20)   not null auto_increment comment '标签ID',
  tag_name    varchar(64)  not null                comment '标签名称',
  tag_color   varchar(16)  default ''              comment '标签颜色（仅演示，不参与生成逻辑）',
  status      char(1)      default '0'             comment '状态（0正常 1停用）',
  del_flag    char(1)      default '0'             comment '删除标志（0存在 2删除）',
  create_by   varchar(64)  default ''              comment '创建者',
  create_time datetime                             comment '创建时间',
  update_by   varchar(64)  default ''              comment '更新者',
  update_time datetime                             comment '更新时间',
  remark      varchar(500)                         comment '备注',
  primary key (tag_id)
) engine=innodb auto_increment=1 comment = '演示标签表（多对多样板）';

insert into biz_demo_tag (tag_id, tag_name, tag_color, status, del_flag, create_by, create_time) values
  (1, '热销',     '#F56C6C', '0', '0', 'admin', now()),
  (2, '新品',     '#409EFF', '0', '0', 'admin', now()),
  (3, '推荐',     '#67C23A', '0', '0', 'admin', now()),
  (4, '清仓',     '#E6A23C', '0', '0', 'admin', now()),
  (5, '出口专用', '#909399', '0', '0', 'admin', now());

-- 辅助表：只放两个外键，不放名称
drop table if exists biz_demo_product_tag;
create table biz_demo_product_tag (
  product_id bigint(20) not null comment '产品ID',
  tag_id     bigint(20) not null comment '标签ID',
  primary key (product_id, tag_id)
) engine=innodb comment = '演示产品-标签关联表（辅助表）';

-- 产品表上的冗余显示列（名称由辅助表重算，逗号分隔）
alter table biz_demo_product
  add column tag_names varchar(255) null comment '标签名称' after scenes;

-- 种几条关联，并把它算进冗余列
insert into biz_demo_product_tag (product_id, tag_id)
select product_id, 1 from biz_demo_product where product_code = 'P-1001'
union all select product_id, 2 from biz_demo_product where product_code = 'P-1001'
union all select product_id, 3 from biz_demo_product where product_code = 'P-1003';

update biz_demo_product p set p.tag_names = (
  select group_concat(t.tag_name) from biz_demo_product_tag j
  join biz_demo_tag t on t.tag_id = j.tag_id
  where j.product_id = p.product_id
);
