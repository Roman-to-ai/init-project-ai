-- ============================================================================
-- 演示业务表（第二组）—— 展示生成器的能力范围，可整份删除
--
-- 与 biz_demo.sql 的分工：
--   biz_demo.sql           基础单表 CRUD（工单）+ is_common 折叠
--   biz_demo_showcase.sql  字段类型大全 + 树表 + 主子表（本文件）
--
-- 导入：
--   docker exec -i @@PROJECT_SLUG@@-mysql mysql -uroot -p@@DB_PASSWORD@@ --default-character-set=utf8mb4 @@DB_NAME@@ < biz_demo_showcase.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 先清掉本文件涉及的全部字典。
-- ⚠️ 必须在**最前面**：本文件给字典指定了固定主键（110+），若旧版本的字典占着
--    同一个 id，后面的 insert 会撞主键报 1062 并**中断整个导入**（MySQL 命令行
--    默认遇错即停），后半段的建表和数据都跑不到。清理放前面才能重复执行。
-- ----------------------------------------------------------------------------
delete from sys_dict_data where dict_type in
  ('biz_product_type','biz_product_status','biz_product_grade','biz_product_tags',
   'biz_product_unit','biz_product_origin','biz_product_hazard','biz_product_scenes',
   'biz_category_status','biz_plan_status');
delete from sys_dict_type where dict_type in
  ('biz_product_type','biz_product_status','biz_product_grade','biz_product_tags',
   'biz_product_unit','biz_product_origin','biz_product_hazard','biz_product_scenes',
   'biz_category_status','biz_plan_status');


-- ============================================================================
-- 一、字段类型大全 —— biz_demo_product
--
--     生成器支持 **11 种控件**，本表每一种都用上，按类型分组排列：
--       input        产品编码 / 产品名称 / 规格型号 / 条形码 / 供应商 / 单价 / 库存数量
--       select       产品类型 / 产品等级 / 计量单位 / 产地
--       radio        产品状态 / 是否危险品
--       checkbox     产品标签 / 适用场景
--       date         生产日期 / 上市日期
--       time         每日盘点时间
--       datetime     入库时间 / 过期时间
--       imageUpload  产品主图
--       fileUpload   规格书 / 质检报告
--       editor       产品描述
--       textarea     使用说明 / 备注
--
--     ⚠️ 表结构只决定 javaType；htmlType 由 gen_table_column 决定。
--        本表在导入生成器后由脚本逐列配置 htmlType（见 @@MAVEN_ARTIFACT_PREFIX@@-biz/README.md）。
-- ============================================================================
drop table if exists biz_demo_product;
create table biz_demo_product (
  product_id     bigint(20)    not null auto_increment comment '产品ID',

  -- ── 文本框 ──
  product_code   varchar(64)   not null                comment '产品编码',
  product_name   varchar(128)                          comment '产品名称',
  category_id    bigint(20)                            comment '所属分类',
  spec_model     varchar(128)                          comment '规格型号',
  barcode        varchar(64)                           comment '条形码',
  supplier       varchar(128)                          comment '供应商',
  price          decimal(10,2) default 0.00            comment '单价',
  stock          int(11)       default 0               comment '库存数量',

  -- ── 下拉框 ──
  product_type   char(1)       default '1'             comment '产品类型',
  grade          char(1)       default '1'             comment '产品等级',
  unit           char(1)       default '1'             comment '计量单位',
  origin         char(1)       default '1'             comment '产地',

  -- ── 单选框 ──
  product_status char(1)       default '0'             comment '产品状态',
  is_hazardous   char(1)       default '0'             comment '是否危险品',

  -- ── 复选框（多选）──
  tags           varchar(128)                          comment '产品标签',
  scenes         varchar(128)                          comment '适用场景',
  related_category_ids   varchar(255)                  comment '关联分类ID集合（多选，一对多）',
  related_category_names varchar(255)                  comment '关联分类名称',

  -- ── 日期选择 ──
  produce_date   date                                  comment '生产日期',
  launch_date    date                                  comment '上市日期',

  -- ── 时间选择 ──
  stocktake_time time                                  comment '每日盘点时间',

  -- ── 日期时间选择 ──
  inbound_time   datetime                              comment '入库时间',
  expire_time    datetime                              comment '过期时间',

  -- ── 上传与富文本 ──
  cover_image    varchar(255)                          comment '产品主图',
  gallery_images varchar(1000)                         comment '产品图册',
  spec_file      varchar(255)                          comment '规格书',
  report_file    varchar(255)                          comment '质检报告',
  manual_files   varchar(2000)                         comment '相关附件',
  detail_content varchar(2000)                         comment '产品描述',

  -- ── 语义类型：数值（htmlType=number，约束来自 validation_rule）──
  suitable_age   int(11)       default 0               comment '适用年龄',
  unit_price     decimal(10,2) default 0.00            comment '含税单价',
  adjust_amount  decimal(10,2) default 0.00            comment '调整金额',
  discount_rate  decimal(5,2)  default 0.00            comment '折扣率',
  is_recommend   tinyint(1)    default 0               comment '是否推荐',
  launch_month   char(7)                               comment '上市年月',
  launch_year    char(4)                               comment '上市年份',
  star_level     tinyint(1)    default 5               comment '产品评分',

  -- ── 语义类型：格式（htmlType=input + 正则约束）──
  contact_phone  varchar(20)                           comment '联系电话',
  contact_email  varchar(100)                          comment '联系邮箱',

  -- ── 文本域 ──
  instruction    varchar(1000)                         comment '使用说明',

  -- ── 审计字段（不进表单）──
  del_flag       char(1)       default '0'             comment '删除标志（0存在 2删除）',
  create_by      varchar(64)   default ''              comment '创建者',
  create_time    datetime                              comment '创建时间',
  update_by      varchar(64)   default ''              comment '更新者',
  update_time    datetime                              comment '更新时间',
  remark         varchar(500)                          comment '备注',
  primary key (product_id)
) engine=innodb auto_increment=1 comment = '演示产品表（字段类型大全）';

-- 产品相关字典
delete from sys_dict_data where dict_type in
  ('biz_product_type','biz_product_status','biz_product_grade','biz_product_tags',
   'biz_product_unit','biz_product_origin','biz_product_hazard','biz_product_scenes');
delete from sys_dict_type where dict_type in
  ('biz_product_type','biz_product_status','biz_product_grade','biz_product_tags',
   'biz_product_unit','biz_product_origin','biz_product_hazard','biz_product_scenes');

insert into sys_dict_type values(110, '产品类型', 'biz_product_type',   '0', 'admin', sysdate(), '', null, '演示：下拉框');
insert into sys_dict_type values(111, '产品状态', 'biz_product_status', '0', 'admin', sysdate(), '', null, '演示：单选框');
insert into sys_dict_type values(112, '产品等级', 'biz_product_grade',  '0', 'admin', sysdate(), '', null, '演示：下拉框');
insert into sys_dict_type values(113, '产品标签', 'biz_product_tags',   '0', 'admin', sysdate(), '', null, '演示：复选框');
insert into sys_dict_type values(114, '计量单位', 'biz_product_unit',   '0', 'admin', sysdate(), '', null, '演示：下拉框');
insert into sys_dict_type values(115, '产地',     'biz_product_origin', '0', 'admin', sysdate(), '', null, '演示：下拉框');
insert into sys_dict_type values(116, '是否危险品','biz_product_hazard','0', 'admin', sysdate(), '', null, '演示：单选框');
insert into sys_dict_type values(117, '适用场景', 'biz_product_scenes', '0', 'admin', sysdate(), '', null, '演示：复选框');

insert into sys_dict_data values(110, 1, '原材料', '1', 'biz_product_type', '', 'info',    'N', '0', 'admin', sysdate(), '', null, '');
insert into sys_dict_data values(111, 2, '半成品', '2', 'biz_product_type', '', 'warning', 'N', '0', 'admin', sysdate(), '', null, '');
insert into sys_dict_data values(112, 3, '成品',   '3', 'biz_product_type', '', 'success', 'N', '0', 'admin', sysdate(), '', null, '');

insert into sys_dict_data values(113, 1, '停用', '0', 'biz_product_status', '', 'danger', 'N', '0', 'admin', sysdate(), '', null, '');
insert into sys_dict_data values(114, 2, '在售', '1', 'biz_product_status', '', 'success','N', '0', 'admin', sysdate(), '', null, '');

insert into sys_dict_data values(115, 1, 'A级', '1', 'biz_product_grade', '', 'success', 'N', '0', 'admin', sysdate(), '', null, '');
insert into sys_dict_data values(116, 2, 'B级', '2', 'biz_product_grade', '', 'primary', 'N', '0', 'admin', sysdate(), '', null, '');
insert into sys_dict_data values(117, 3, 'C级', '3', 'biz_product_grade', '', 'info',    'N', '0', 'admin', sysdate(), '', null, '');

insert into sys_dict_data values(118, 1, '热销', '1', 'biz_product_tags', '', 'danger',  'N', '0', 'admin', sysdate(), '', null, '');
insert into sys_dict_data values(119, 2, '新品', '2', 'biz_product_tags', '', 'success', 'N', '0', 'admin', sysdate(), '', null, '');
insert into sys_dict_data values(120, 3, '推荐', '3', 'biz_product_tags', '', 'warning', 'N', '0', 'admin', sysdate(), '', null, '');
insert into sys_dict_data values(121, 4, '清仓', '4', 'biz_product_tags', '', 'info',    'N', '0', 'admin', sysdate(), '', null, '');

insert into sys_dict_data values(122, 1, '个', '1', 'biz_product_unit', '', 'primary', 'N', '0', 'admin', sysdate(), '', null, '');
insert into sys_dict_data values(123, 2, '台', '2', 'biz_product_unit', '', 'primary', 'N', '0', 'admin', sysdate(), '', null, '');
insert into sys_dict_data values(124, 3, '千克', '3', 'biz_product_unit', '', 'primary', 'N', '0', 'admin', sysdate(), '', null, '');
insert into sys_dict_data values(125, 4, '米', '4', 'biz_product_unit', '', 'primary', 'N', '0', 'admin', sysdate(), '', null, '');

insert into sys_dict_data values(126, 1, '国产', '1', 'biz_product_origin', '', 'success', 'N', '0', 'admin', sysdate(), '', null, '');
insert into sys_dict_data values(127, 2, '进口', '2', 'biz_product_origin', '', 'warning', 'N', '0', 'admin', sysdate(), '', null, '');

insert into sys_dict_data values(128, 1, '否', '0', 'biz_product_hazard', '', 'info',   'N', '0', 'admin', sysdate(), '', null, '');
insert into sys_dict_data values(129, 2, '是', '1', 'biz_product_hazard', '', 'danger', 'N', '0', 'admin', sysdate(), '', null, '');

insert into sys_dict_data values(130, 1, '工业', '1', 'biz_product_scenes', '', 'primary', 'N', '0', 'admin', sysdate(), '', null, '');
insert into sys_dict_data values(131, 2, '民用', '2', 'biz_product_scenes', '', 'success', 'N', '0', 'admin', sysdate(), '', null, '');
insert into sys_dict_data values(132, 3, '医用', '3', 'biz_product_scenes', '', 'warning', 'N', '0', 'admin', sysdate(), '', null, '');

delete from biz_demo_product;
insert into biz_demo_product
  (product_code, product_name, spec_model, barcode, supplier, price, stock,
   product_type, grade, unit, origin, product_status, is_hazardous,
   tags, scenes, produce_date, launch_date, stocktake_time, inbound_time, expire_time,
   detail_content, instruction, remark)
values
  ('P-1001','示例产品 甲','XH-100','6901234567890','示例供应商 A',199.00,120,
   '3','1','1','1','1','0','1,2','1,2','2026-08-01','2026-08-10','09:00:00','2026-08-02 10:30:00','2027-08-01 00:00:00',
   '这是**富文本**字段的示例内容。',
   '本产品需在阴凉干燥处存放，避免阳光直射与高温环境。开封后请尽快使用完毕，未使用完的部分须密封保存并置于冷藏条件（2~8℃）。严禁与强酸、强碱、氧化剂等化学品混放，运输过程中应避免剧烈碰撞与倒置。如发现包装破损、内容物变色或出现异味，请立即停止使用并联系供应商。',
   '本行用于演示「长文本在列表里最多显示两行、超出部分用省略号」，鼠标悬浮可查看完整内容。'),
  ('P-1002','示例产品 乙','XH-200','6901234567891','示例供应商 B',89.50,340,
   '2','2','2','1','1','0','2','1','2026-08-15','2026-08-20','14:30:00','2026-08-16 09:00:00','2027-02-15 00:00:00',
   '半成品，用于下游装配。',null,null),
  ('P-1003','示例产品 丙','XH-300','6901234567892','示例供应商 C',12.00,1200,
   '1','3','3','2','0','1','3,4','1,3','2026-07-20','2026-07-25','08:00:00','2026-07-21 16:45:00','2026-12-20 00:00:00',
   null,'原材料，注意防潮。','易燃，需单独存放');

-- 演示图片/附件：占位文件需先放到 uploadPath/upload/2026/09/15/ 下
-- （颜色块 PNG 与最小 PDF，文件名与路径见下；否则图片会裂、附件下载 404）。
update biz_demo_product set
  cover_image     = '/profile/upload/2026/09/15/cover_image.png',
  gallery_images  = '/profile/upload/2026/09/15/gallery_a.png,/profile/upload/2026/09/15/gallery_b.png',
  spec_file       = '/profile/upload/2026/09/15/spec_sheet.pdf',
  report_file     = '/profile/upload/2026/09/15/qc_report.pdf',
  manual_files    = '/profile/upload/2026/09/15/manual_a.pdf,/profile/upload/2026/09/15/manual_b.pdf'
where product_code = 'P-1001';

update biz_demo_product set gallery_images = '/profile/upload/2026/09/15/gallery_b.png' where product_code = 'P-1002';
update biz_demo_product set cover_image = '/profile/upload/2026/09/15/cover_image.png', spec_file = '/profile/upload/2026/09/15/spec_sheet.pdf' where product_code = 'P-1003';

-- 一对多（多选）：关联分类 —— 逗号串存多个 category_id，名称由后端按分类表重算
update biz_demo_product set related_category_ids = '100,102' where product_code = 'P-1001';
update biz_demo_product set related_category_ids = '101'     where product_code = 'P-1002';


-- ============================================================================
-- 二、树表 —— biz_demo_category
-- ============================================================================
drop table if exists biz_demo_category;
create table biz_demo_category (
  category_id   bigint(20)   not null auto_increment comment '分类ID',
  parent_id     bigint(20)   default 0               comment '父分类ID',
  ancestors     varchar(255) default ''              comment '祖级列表',
  category_name varchar(64)                          comment '分类名称',
  order_num     int(4)       default 0               comment '显示顺序',
  status        char(1)      default '0'             comment '状态',
  del_flag      char(1)      default '0'             comment '删除标志（0存在 2删除）',
  create_by     varchar(64)  default ''              comment '创建者',
  create_time   datetime                             comment '创建时间',
  update_by     varchar(64)  default ''              comment '更新者',
  update_time   datetime                             comment '更新时间',
  remark        varchar(500)                         comment '备注',
  primary key (category_id)
) engine=innodb auto_increment=1 comment = '演示产品分类表（树表）';

delete from sys_dict_data where dict_type = 'biz_category_status';
delete from sys_dict_type where dict_type = 'biz_category_status';
insert into sys_dict_type values(140, '分类状态', 'biz_category_status', '0', 'admin', sysdate(), '', null, '演示：树表状态');
insert into sys_dict_data values(140, 1, '正常', '0', 'biz_category_status', '', 'success', 'N', '0', 'admin', sysdate(), '', null, '');
insert into sys_dict_data values(141, 2, '停用', '1', 'biz_category_status', '', 'danger',  'N', '0', 'admin', sysdate(), '', null, '');

delete from biz_demo_category;
insert into biz_demo_category values(100, 0,   '0',        '原材料',   1, '0', '0', 'admin', sysdate(), '', null, null);
insert into biz_demo_category values(101, 0,   '0',        '半成品',   2, '0', '0', 'admin', sysdate(), '', null, null);
insert into biz_demo_category values(102, 0,   '0',        '成品',     3, '0', '0', 'admin', sysdate(), '', null, null);
insert into biz_demo_category values(103, 100, '0,100',    '金属材料', 1, '0', '0', 'admin', sysdate(), '', null, null);
insert into biz_demo_category values(104, 100, '0,100',    '塑料材料', 2, '0', '0', 'admin', sysdate(), '', null, null);
insert into biz_demo_category values(105, 103, '0,100,103','钢材',     1, '0', '0', 'admin', sysdate(), '', null, null);
insert into biz_demo_category values(106, 103, '0,100,103','铝材',     2, '1', '0', 'admin', sysdate(), '', null, '停用示例');
insert into biz_demo_category values(107, 102, '0,102',    '家用成品', 1, '0', '0', 'admin', sysdate(), '', null, null);
insert into biz_demo_category values(108, 102, '0,102',    '工业成品', 2, '0', '0', 'admin', sysdate(), '', null, null);


-- ============================================================================
-- 三、主子表 —— biz_demo_plan（主） + biz_demo_plan_item（子）
-- ============================================================================
drop table if exists biz_demo_plan_item;
drop table if exists biz_demo_plan;

create table biz_demo_plan (
  plan_id     bigint(20)      not null auto_increment comment '计划ID',
  plan_no     varchar(64)     not null                comment '计划编号',
  plan_name   varchar(128)                            comment '计划名称',
  plan_status char(1)         default '0'             comment '计划状态',
  plan_start  datetime                                comment '计划开始时间',
  del_flag    char(1)         default '0'             comment '删除标志（0存在 2删除）',
  create_by   varchar(64)     default ''              comment '创建者',
  create_time datetime                                comment '创建时间',
  update_by   varchar(64)     default ''              comment '更新者',
  update_time datetime                                comment '更新时间',
  remark      varchar(500)                            comment '备注',
  primary key (plan_id)
) engine=innodb auto_increment=1 comment = '演示生产计划表（主子表-主表）';

create table biz_demo_plan_item (
  item_id       bigint(20)     not null auto_increment comment '明细ID',
  plan_id       bigint(20)     not null                comment '所属计划ID',
  seq_no        int(4)         default 1               comment '行号',
  material_name varchar(128)                           comment '物料名称',
  quantity      decimal(10,2)  default 0.00            comment '数量',
  unit          varchar(16)                            comment '单位',
  create_by     varchar(64)    default ''              comment '创建者',
  create_time   datetime                               comment '创建时间',
  update_by     varchar(64)    default ''              comment '更新者',
  update_time   datetime                               comment '更新时间',
  remark        varchar(500)                           comment '备注',
  primary key (item_id)
) engine=innodb auto_increment=1 comment = '演示生产计划明细表（主子表-子表）';

delete from sys_dict_data where dict_type = 'biz_plan_status';
delete from sys_dict_type where dict_type = 'biz_plan_status';
insert into sys_dict_type values(150, '计划状态', 'biz_plan_status', '0', 'admin', sysdate(), '', null, '演示：主子表状态');
insert into sys_dict_data values(150, 1, '草稿',   '0', 'biz_plan_status', '', 'info',    'N', '0', 'admin', sysdate(), '', null, '');
insert into sys_dict_data values(151, 2, '已下达', '1', 'biz_plan_status', '', 'primary', 'N', '0', 'admin', sysdate(), '', null, '');
insert into sys_dict_data values(152, 3, '已完成', '2', 'biz_plan_status', '', 'success', 'N', '0', 'admin', sysdate(), '', null, '');

delete from biz_demo_plan_item;
delete from biz_demo_plan;
insert into biz_demo_plan values(1, 'PL-2026-001', '九月生产计划', '1', '2026-09-20 08:00:00', '0', 'admin', sysdate(), '', null, '演示数据');
insert into biz_demo_plan values(2, 'PL-2026-002', '十月生产计划', '0', '2026-10-08 08:00:00', '0', 'admin', sysdate(), '', null, null);

insert into biz_demo_plan_item values(1, 1, 1, '钢材',    500.00, 'kg',   'admin', sysdate(), '', null, null);
insert into biz_demo_plan_item values(2, 1, 2, '铝材',    200.00, 'kg',   'admin', sysdate(), '', null, null);
insert into biz_demo_plan_item values(3, 1, 3, '标准件',   80.00, '个',   'admin', sysdate(), '', null, null);
insert into biz_demo_plan_item values(4, 2, 1, '塑料粒子', 1200.00,'kg',   'admin', sysdate(), '', null, null);
