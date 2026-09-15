package @@JAVA_PACKAGE_ROOT@@.biz.domain;

import java.util.List;
import java.util.Date;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import @@JAVA_PACKAGE_ROOT@@.common.annotation.Excel;
import @@JAVA_PACKAGE_ROOT@@.common.annotation.RuleField;
import @@JAVA_PACKAGE_ROOT@@.common.annotation.RuleValidated;
import @@JAVA_PACKAGE_ROOT@@.common.core.domain.BaseEntity;

/**
 * 演示生产计划对象 biz_demo_plan
 * 
 * @date 2026-09-14
 */
@RuleValidated(table = "biz_demo_plan")
public class BizDemoPlan extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 计划ID */
    @RuleField(column = "plan_id", label = "计划ID")
    private Long planId;

    /** 计划编号 */
    @Excel(name = "计划编号")
    @RuleField(column = "plan_no", label = "计划编号")
    private String planNo;

    /** 计划名称 */
    @Excel(name = "计划名称")
    @RuleField(column = "plan_name", label = "计划名称")
    private String planName;

    /** 计划状态 */
    @Excel(name = "计划状态")
    @RuleField(column = "plan_status", label = "计划状态")
    private String planStatus;

    /** 计划开始时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Excel(name = "计划开始时间", width = 30, dateFormat = "yyyy-MM-dd HH:mm:ss")
    @RuleField(column = "plan_start", label = "计划开始时间")
    private Date planStart;

    /** 删除标志（0存在 2删除） */
    @RuleField(column = "del_flag", label = "删除标志")
    private String delFlag;

    /** 计划明细信息 */
    private List<BizDemoPlanItem> bizDemoPlanItemList;

    public void setPlanId(Long planId) 
    {
        this.planId = planId;
    }

    public Long getPlanId() 
    {
        return planId;
    }

    public void setPlanNo(String planNo) 
    {
        this.planNo = planNo;
    }

    public String getPlanNo() 
    {
        return planNo;
    }

    public void setPlanName(String planName) 
    {
        this.planName = planName;
    }

    public String getPlanName() 
    {
        return planName;
    }

    public void setPlanStatus(String planStatus) 
    {
        this.planStatus = planStatus;
    }

    public String getPlanStatus() 
    {
        return planStatus;
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

    public List<BizDemoPlanItem> getBizDemoPlanItemList()
    {
        return bizDemoPlanItemList;
    }

    public void setBizDemoPlanItemList(List<BizDemoPlanItem> bizDemoPlanItemList)
    {
        this.bizDemoPlanItemList = bizDemoPlanItemList;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("planId", getPlanId())
            .append("planNo", getPlanNo())
            .append("planName", getPlanName())
            .append("planStatus", getPlanStatus())
            .append("planStart", getPlanStart())
            .append("delFlag", getDelFlag())
            .append("createBy", getCreateBy())
            .append("createTime", getCreateTime())
            .append("updateBy", getUpdateBy())
            .append("updateTime", getUpdateTime())
            .append("remark", getRemark())
            .append("bizDemoPlanItemList", getBizDemoPlanItemList())
            .toString();
    }
}
