-- 菜单 SQL
insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('演示生产计划', '0', '9', 'demoPlan', 'biz/demoPlan/index', 1, 0, 'C', '0', '0', 'biz:demoPlan:list', '#', 'admin', sysdate(), '', null, '演示生产计划菜单');

-- 按钮父菜单ID
SELECT @parentId := LAST_INSERT_ID();

-- 按钮 SQL
insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('演示生产计划查询', @parentId, '1',  '#', '', 1, 0, 'F', '0', '0', 'biz:demoPlan:query',        '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('演示生产计划新增', @parentId, '2',  '#', '', 1, 0, 'F', '0', '0', 'biz:demoPlan:add',          '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('演示生产计划修改', @parentId, '3',  '#', '', 1, 0, 'F', '0', '0', 'biz:demoPlan:edit',         '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('演示生产计划删除', @parentId, '4',  '#', '', 1, 0, 'F', '0', '0', 'biz:demoPlan:remove',       '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('演示生产计划导出', @parentId, '5',  '#', '', 1, 0, 'F', '0', '0', 'biz:demoPlan:export',       '#', 'admin', sysdate(), '', null, '');