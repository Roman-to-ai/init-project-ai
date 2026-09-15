import type { PageDomain, BaseEntity } from "../common";

/** æ¼”ç¤ºæ ‡ç­¾配置分页查询参数 */
export interface DemoTagQueryParams extends PageDomain {
  /** 标签名称 */
  tagName?: string;
  /** 标签颜色（仅演示，不参与生成逻辑） */
  tagColor?: string;
  /** 状态（0正常 1停用） */
  status?: string;
  /** 请求参数（日期区间等，由 index.vue 的 getList 写入 beginXxx/endXxx） */
  params?: Record<string, any>;
}

/** æ¼”ç¤ºæ ‡ç­¾配置信息 */
export interface BizDemoTag extends BaseEntity {
  /** 标签ID */
  tagId?: number;
  /** 标签名称 */
  tagName?: string;
  /** 标签颜色（仅演示，不参与生成逻辑） */
  tagColor?: string;
  /** 状态（0正常 1停用） */
  status?: string;
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
