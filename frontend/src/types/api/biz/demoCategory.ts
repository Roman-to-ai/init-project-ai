import type { PageDomain, BaseEntity } from "../common";

/** 演示产品分类配置分页查询参数 */
export interface DemoCategoryQueryParams extends PageDomain {
  /** 分类名称 */
  categoryName?: string;
  /** 状态 */
  status?: string;
}

/** 演示产品分类配置信息 */
export interface BizDemoCategory extends BaseEntity {
  /** 分类ID */
  categoryId?: number;
  /** 分类名称 */
  categoryName?: string;
  /** 父分类ID */
  parentId?: number;
  /** 祖级列表 */
  ancestors?: string;
  /** 显示顺序 */
  orderNum?: number;
  /** 状态 */
  status?: string;
  /** 备注 */
  remark?: string;
  /** 删除标志（0存在 2删除） */
  delFlag?: string;
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
}
