package @@JAVA_PACKAGE_ROOT@@.biz.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import @@JAVA_PACKAGE_ROOT@@.common.annotation.Excel;
import @@JAVA_PACKAGE_ROOT@@.common.annotation.RuleField;
import @@JAVA_PACKAGE_ROOT@@.common.annotation.RuleValidated;

import @@JAVA_PACKAGE_ROOT@@.common.core.domain.BaseEntity;

/**
 * æ¼”ç¤ºæ ‡ç­¾对象 biz_demo_tag
 * 
 * @date 2026-09-15
 */
@RuleValidated(table = "biz_demo_tag")
public class BizDemoTag extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 标签ID */
    @RuleField(column = "tag_id", label = "标签ID")
    private Long tagId;

    /** 标签名称 */
    @Excel(name = "标签名称")
    @RuleField(column = "tag_name", label = "标签名称")
    private String tagName;

    /** 标签颜色（仅演示，不参与生成逻辑） */
    @Excel(name = "标签颜色", readConverterExp = "仅=演示，不参与生成逻辑")
    @RuleField(column = "tag_color", label = "标签颜色")
    private String tagColor;

    /** 状态（0正常 1停用） */
    @Excel(name = "状态", readConverterExp = "0=正常,1=停用")
    @RuleField(column = "status", label = "状态")
    private String status;

    /** 删除标志（0存在 2删除） */
    @RuleField(column = "del_flag", label = "删除标志")
    private String delFlag;

    public void setTagId(Long tagId) 
    {
        this.tagId = tagId;
    }

    public Long getTagId() 
    {
        return tagId;
    }

    public void setTagName(String tagName) 
    {
        this.tagName = tagName;
    }

    public String getTagName() 
    {
        return tagName;
    }

    public void setTagColor(String tagColor) 
    {
        this.tagColor = tagColor;
    }

    public String getTagColor() 
    {
        return tagColor;
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
            .append("tagId", getTagId())
            .append("tagName", getTagName())
            .append("tagColor", getTagColor())
            .append("status", getStatus())
            .append("delFlag", getDelFlag())
            .append("createBy", getCreateBy())
            .append("createTime", getCreateTime())
            .append("updateBy", getUpdateBy())
            .append("updateTime", getUpdateTime())
            .append("remark", getRemark())
            .toString();
    }
}
