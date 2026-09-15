import type { PageDomain, BaseEntity } from "../common";

/** 演示产品配置分页查询参数 */
export interface DemoProductQueryParams extends PageDomain {
  /** 产品编码 */
  productCode?: string;
  /** 产品名称 */
  productName?: string;
  /** 规格型号 */
  specModel?: string;
  /** 条形码 */
  barcode?: string;
  /** 供应商 */
  supplier?: string;
  /** 单价 */
  price?: string;
  /** 库存数量 */
  stock?: number;
  /** 产品类型 */
  productType?: string;
  /** 产品等级 */
  grade?: string;
  /** 计量单位 */
  unit?: string;
  /** 产地 */
  origin?: string;
  /** 产品状态 */
  productStatus?: string;
  /** 是否危险品 */
  isHazardous?: string;
  /** 产品标签 */
  tags?: string;
  /** 适用场景 */
  scenes?: string;
  /** 生产日期 */
  produceDate?: string;
  /** 上市日期 */
  launchDate?: string;
  /** 每日盘点时间 */
  stocktakeTime?: string;
  /** 入库时间 */
  inboundTime?: string;
  /** 过期时间 */
  expireTime?: string;
  /** 产品主图 */
  coverImage?: string;
  /** 产品图册 */
  galleryImages?: string;
  /** 规格书 */
  specFile?: string;
  /** 质检报告 */
  reportFile?: string;
  /** 相关附件 */
  manualFiles?: string;
  /** 产品描述 */
  detailContent?: string;
  /** 适用年龄 */
  suitableAge?: number;
  /** 含税单价 */
  unitPrice?: string;
  /** 调整金额 */
  adjustAmount?: string;
  /** 折扣率 */
  discountRate?: string;
  /** 是否推荐 */
  isRecommend?: number;
  /** 上市年月 */
  launchMonth?: string;
  /** 上市年份 */
  launchYear?: string;
  /** 产品评分 */
  starLevel?: number;
  /** 联系电话 */
  contactPhone?: string;
  /** 联系邮箱 */
  contactEmail?: string;
  /** 使用说明 */
  instruction?: string;
  /** 请求参数 */
  params?: Record<string, any>;
}

/** 演示产品配置信息 */
export interface BizDemoProduct extends BaseEntity {
  /** 产品ID */
  productId?: number;
  /** 产品编码 */
  productCode?: string;
  /** 产品名称 */
  productName?: string;
  /** 所属分类 */
  categoryId?: number;
  /** 规格型号 */
  specModel?: string;
  /** 条形码 */
  barcode?: string;
  /** 供应商 */
  supplier?: string;
  /** 单价 */
  price?: string;
  /** 库存数量 */
  stock?: number;
  /** 产品类型 */
  productType?: string;
  /** 产品等级 */
  grade?: string;
  /** 计量单位 */
  unit?: string;
  /** 产地 */
  origin?: string;
  /** 产品状态 */
  productStatus?: string;
  /** 是否危险品 */
  isHazardous?: string;
  /** 产品标签 */
  tags?: string;
  /** 适用场景 */
  scenes?: string;
  /** 生产日期 */
  produceDate?: string;
  /** 上市日期 */
  launchDate?: string;
  /** 每日盘点时间 */
  stocktakeTime?: string;
  /** 入库时间 */
  inboundTime?: string;
  /** 过期时间 */
  expireTime?: string;
  /** 产品主图 */
  coverImage?: string;
  /** 产品图册 */
  galleryImages?: string;
  /** 规格书 */
  specFile?: string;
  /** 质检报告 */
  reportFile?: string;
  /** 相关附件 */
  manualFiles?: string;
  /** 产品描述 */
  detailContent?: string;
  /** 适用年龄 */
  suitableAge?: number;
  /** 含税单价 */
  unitPrice?: string;
  /** 调整金额 */
  adjustAmount?: string;
  /** 折扣率 */
  discountRate?: string;
  /** 是否推荐 */
  isRecommend?: number;
  /** 上市年月 */
  launchMonth?: string;
  /** 上市年份 */
  launchYear?: string;
  /** 产品评分 */
  starLevel?: number;
  /** 联系电话 */
  contactPhone?: string;
  /** 联系邮箱 */
  contactEmail?: string;
  /** 使用说明 */
  instruction?: string;
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
