package @@JAVA_PACKAGE_ROOT@@.biz.domain;

import java.util.Date;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import @@JAVA_PACKAGE_ROOT@@.common.annotation.Excel;
import @@JAVA_PACKAGE_ROOT@@.common.annotation.RuleField;
import @@JAVA_PACKAGE_ROOT@@.common.annotation.RuleValidated;
import @@JAVA_PACKAGE_ROOT@@.common.core.domain.BaseEntity;

/**
 * 演示工单对象 biz_demo_order
 * 
 * @date 2026-09-14
 */
@RuleValidated(table = "biz_demo_order")
public class BizDemoOrder extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 工单ID */
    @RuleField(column = "order_id", label = "工单ID")
    private Long orderId;

    /** 工单编号 */
    @Excel(name = "工单编号")
    @RuleField(column = "order_no", label = "工单编号")
    private String orderNo;

    /** 产品名称 */
    @Excel(name = "产品名称")
    @RuleField(column = "product_name", label = "产品名称")
    private String productName;

    /** 工单状态 */
    @Excel(name = "工单状态")
    @RuleField(column = "order_status", label = "工单状态")
    private String orderStatus;

    /** 计划数量 */
    @Excel(name = "计划数量")
    @RuleField(column = "plan_qty", label = "计划数量")
    private Long planQty;

    /** 计划开工时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Excel(name = "计划开工时间", width = 30, dateFormat = "yyyy-MM-dd HH:mm:ss")
    @RuleField(column = "plan_start", label = "计划开工时间")
    private Date planStart;

    /** 删除标志（0存在 2删除） */
    @RuleField(column = "del_flag", label = "删除标志")
    private String delFlag;

    public void setOrderId(Long orderId) 
    {
        this.orderId = orderId;
    }

    public Long getOrderId() 
    {
        return orderId;
    }

    public void setOrderNo(String orderNo) 
    {
        this.orderNo = orderNo;
    }

    public String getOrderNo() 
    {
        return orderNo;
    }

    public void setProductName(String productName) 
    {
        this.productName = productName;
    }

    public String getProductName() 
    {
        return productName;
    }

    public void setOrderStatus(String orderStatus) 
    {
        this.orderStatus = orderStatus;
    }

    public String getOrderStatus() 
    {
        return orderStatus;
    }

    public void setPlanQty(Long planQty) 
    {
        this.planQty = planQty;
    }

    public Long getPlanQty() 
    {
        return planQty;
    }

    public void setPlanStart(Date planStart) 
    {
        this.planStart = planStart;
    }

    public Date getPlanStart() 
    {
        return planStart;
    }

    public void setDelFlag(String delFlag) 
    {
        this.delFlag = delFlag;
    }

    public String getDelFlag() 
    {
        return delFlag;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("orderId", getOrderId())
            .append("orderNo", getOrderNo())
            .append("productName", getProductName())
            .append("orderStatus", getOrderStatus())
            .append("planQty", getPlanQty())
            .append("planStart", getPlanStart())
            .append("delFlag", getDelFlag())
            .append("createBy", getCreateBy())
            .append("createTime", getCreateTime())
            .append("updateBy", getUpdateBy())
            .append("updateTime", getUpdateTime())
            .append("remark", getRemark())
            .toString();
    }
}
