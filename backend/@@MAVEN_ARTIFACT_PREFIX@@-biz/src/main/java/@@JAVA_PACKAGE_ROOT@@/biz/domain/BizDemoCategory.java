package @@JAVA_PACKAGE_ROOT@@.biz.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import @@JAVA_PACKAGE_ROOT@@.common.annotation.Excel;
import @@JAVA_PACKAGE_ROOT@@.common.annotation.RuleField;
import @@JAVA_PACKAGE_ROOT@@.common.annotation.RuleValidated;
import @@JAVA_PACKAGE_ROOT@@.common.core.domain.TreeEntity;

/**
 * 演示产品分类对象 biz_demo_category
 * 
 * @date 2026-09-14
 */
@RuleValidated(table = "biz_demo_category")
public class BizDemoCategory extends TreeEntity
{
    private static final long serialVersionUID = 1L;

    /** 分类ID */
    @RuleField(column = "category_id", label = "分类ID")
    private Long categoryId;

    /** 分类名称 */
    @Excel(name = "分类名称")
    @RuleField(column = "category_name", label = "分类名称")
    private String categoryName;

    /** 状态 */
    @Excel(name = "状态")
    @RuleField(column = "status", label = "状态")
    private String status;

    /** 删除标志（0存在 2删除） */
    @RuleField(column = "del_flag", label = "删除标志")
    private String delFlag;

    public void setCategoryId(Long categoryId) 
    {
        this.categoryId = categoryId;
    }

    public Long getCategoryId() 
    {
        return categoryId;
    }

    public void setCategoryName(String categoryName) 
    {
        this.categoryName = categoryName;
    }

    public String getCategoryName() 
    {
        return categoryName;
    }

    public void setStatus(String status) 
    {
        this.status = status;
    }

    public String getStatus() 
    {
        return status;
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
            .append("categoryId", getCategoryId())
            .append("categoryName", getCategoryName())
            .append("parentId", getParentId())
            .append("ancestors", getAncestors())
            .append("orderNum", getOrderNum())
            .append("status", getStatus())
            .append("remark", getRemark())
            .append("delFlag", getDelFlag())
            .append("createBy", getCreateBy())
            .append("createTime", getCreateTime())
            .append("updateBy", getUpdateBy())
            .append("updateTime", getUpdateTime())
            .toString();
    }
}
