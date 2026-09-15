package @@JAVA_PACKAGE_ROOT@@.biz.domain;

import java.math.BigDecimal;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import @@JAVA_PACKAGE_ROOT@@.common.annotation.Excel;
import @@JAVA_PACKAGE_ROOT@@.common.annotation.RuleField;
import @@JAVA_PACKAGE_ROOT@@.common.annotation.RuleValidated;
import @@JAVA_PACKAGE_ROOT@@.common.core.domain.BaseEntity;

/**
 * 计划明细对象 biz_demo_plan_item
 *
 * @date 2026-09-14
 */
@RuleValidated(table = "biz_demo_plan_item")
public class BizDemoPlanItem extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 明细ID */
    @RuleField(column = "item_id", label = "明细ID")
    private Long itemId;

    /** 所属计划ID */
    @RuleField(column = "plan_id", label = "所属计划ID")
    private Long planId;

    /** 行号 */
    @Excel(name = "行号")
    @RuleField(column = "seq_no", label = "行号")
    private Long seqNo;

    /** 物料名称 */
    @Excel(name = "物料名称")
    @RuleField(column = "material_name", label = "物料名称")
    private String materialName;

    /** 数量 */
    @Excel(name = "数量")
    @RuleField(column = "quantity", label = "数量")
    private BigDecimal quantity;

    /** 单位 */
    @Excel(name = "单位")
    @RuleField(column = "unit", label = "单位")
    private String unit;

    public void setItemId(Long itemId) 
    {
        this.itemId = itemId;
    }

    public Long getItemId() 
    {
        return itemId;
    }
    public void setPlanId(Long planId) 
    {
        this.planId = planId;
    }

    public Long getPlanId() 
    {
        return planId;
    }
    public void setSeqNo(Long seqNo) 
    {
        this.seqNo = seqNo;
    }

    public Long getSeqNo() 
    {
        return seqNo;
    }
    public void setMaterialName(String materialName) 
    {
        this.materialName = materialName;
    }

    public String getMaterialName() 
    {
        return materialName;
    }
    public void setQuantity(BigDecimal quantity) 
    {
        this.quantity = quantity;
    }

    public BigDecimal getQuantity() 
    {
        return quantity;
    }
    public void setUnit(String unit) 
    {
        this.unit = unit;
    }

    public String getUnit() 
    {
        return unit;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("itemId", getItemId())
            .append("planId", getPlanId())
            .append("seqNo", getSeqNo())
            .append("materialName", getMaterialName())
            .append("quantity", getQuantity())
            .append("unit", getUnit())
            .append("createBy", getCreateBy())
            .append("createTime", getCreateTime())
            .append("updateBy", getUpdateBy())
            .append("updateTime", getUpdateTime())
            .append("remark", getRemark())
            .toString();
    }
}
