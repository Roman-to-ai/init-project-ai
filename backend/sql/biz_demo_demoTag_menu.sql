-- 菜单 SQL
insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('æ¼”ç¤ºæ ‡ç­¾', '0', '1', 'demoTag', 'biz/demoTag/index', 1, 0, 'C', '0', '0', 'biz:demoTag:list', '#', 'admin', sysdate(), '', null, 'æ¼”ç¤ºæ ‡ç­¾菜单');

-- 按钮父菜单ID
SELECT @parentId := LAST_INSERT_ID();

-- 按钮 SQL
insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('æ¼”ç¤ºæ ‡ç­¾查询', @parentId, '1',  '#', '', 1, 0, 'F', '0', '0', 'biz:demoTag:query',        '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('æ¼”ç¤ºæ ‡ç­¾新增', @parentId, '2',  '#', '', 1, 0, 'F', '0', '0', 'biz:demoTag:add',          '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('æ¼”ç¤ºæ ‡ç­¾修改', @parentId, '3',  '#', '', 1, 0, 'F', '0', '0', 'biz:demoTag:edit',         '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('æ¼”ç¤ºæ ‡ç­¾删除', @parentId, '4',  '#', '', 1, 0, 'F', '0', '0', 'biz:demoTag:remove',       '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('æ¼”ç¤ºæ ‡ç­¾导出', @parentId, '5',  '#', '', 1, 0, 'F', '0', '0', 'biz:demoTag:export',       '#', 'admin', sysdate(), '', null, '');