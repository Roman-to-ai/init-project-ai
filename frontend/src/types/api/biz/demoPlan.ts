import type { PageDomain, BaseEntity } from "../common";

/** 演示生产计划配置分页查询参数 */
export interface DemoPlanQueryParams extends PageDomain {
  /** 计划编号 */
  planNo?: string;
  /** 计划名称 */
  planName?: string;
  /** 计划状态 */
  planStatus?: string;
  /** 计划开始时间 */
  planStart?: string;
  /** 请求参数 */
  params?: Record<string, any>;
}

/** 演示生产计划配置信息 */
export interface BizDemoPlan extends BaseEntity {
  /** 计划ID */
  planId?: number;
  /** 计划编号 */
  planNo?: string;
  /** 计划名称 */
  planName?: string;
  /** 计划状态 */
  planStatus?: string;
  /** 计划开始时间 */
  planStart?: string;
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
  /** 备注 */
  remark?: string;
  /** 计划明细信息 */
  bizDemoPlanItemList?: BizDemoPlanItem[];
}

/** 计划明细配置信息 */
export interface BizDemoPlanItem extends BaseEntity {
  /** 明细ID */
  itemId?: number;
  /** 所属计划ID */
  planId?: number;
  /** 行号 */
  seqNo?: number;
  /** 物料名称 */
  materialName?: string;
  /** 数量 */
  quantity?: string;
  /** 单位 */
  unit?: string;
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
}
