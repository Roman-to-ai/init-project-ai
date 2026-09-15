import type { PageDomain, BaseEntity } from "../common";

/** 演示工单配置分页查询参数 */
export interface DemoOrderQueryParams extends PageDomain {
  /** 工单编号 */
  orderNo?: string;
  /** 产品名称 */
  productName?: string;
  /** 工单状态 */
  orderStatus?: string;
  /** 计划数量 */
  planQty?: number;
  /** 计划开工时间 */
  planStart?: string;
  /** 请求参数 */
  params?: Record<string, any>;
}

/** 演示工单配置信息 */
export interface BizDemoOrder extends BaseEntity {
  /** 工单ID */
  orderId?: number;
  /** 工单编号 */
  orderNo?: string;
  /** 产品名称 */
  productName?: string;
  /** 工单状态 */
  orderStatus?: string;
  /** 计划数量 */
  planQty?: number;
  /** 计划开工时间 */
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
}
