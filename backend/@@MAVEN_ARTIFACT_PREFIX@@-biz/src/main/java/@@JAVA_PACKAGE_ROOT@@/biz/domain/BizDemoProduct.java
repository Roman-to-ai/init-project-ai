package @@JAVA_PACKAGE_ROOT@@.biz.domain;

import java.math.BigDecimal;
import java.util.Date;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import @@JAVA_PACKAGE_ROOT@@.common.annotation.Excel;
import @@JAVA_PACKAGE_ROOT@@.common.annotation.RuleField;
import @@JAVA_PACKAGE_ROOT@@.common.annotation.RuleValidated;
import @@JAVA_PACKAGE_ROOT@@.common.core.domain.BaseEntity;

/**
 * 演示产品对象 biz_demo_product
 * 
 * @date 2026-09-14
 */
@RuleValidated(table = "biz_demo_product")
public class BizDemoProduct extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 产品ID */
    @RuleField(column = "product_id", label = "产品ID")
    private Long productId;

    /** 产品编码 */
    @Excel(name = "产品编码")
    @RuleField(column = "product_code", label = "产品编码")
    private String productCode;

    /** 产品名称 */
    @Excel(name = "产品名称")
    @RuleField(column = "product_name", label = "产品名称")
    private String productName;

    /** 所属分类 */
    @Excel(name = "所属分类")
    @RuleField(column = "category_id", label = "所属分类")
    private Long categoryId;

    /** 规格型号 */
    @Excel(name = "规格型号")
    @RuleField(column = "spec_model", label = "规格型号")
    private String specModel;

    /** 条形码 */
    @Excel(name = "条形码")
    @RuleField(column = "barcode", label = "条形码")
    private String barcode;

    /** 供应商 */
    @Excel(name = "供应商")
    @RuleField(column = "supplier", label = "供应商")
    private String supplier;

    /** 单价 */
    @Excel(name = "单价")
    @RuleField(column = "price", label = "单价")
    private BigDecimal price;

    /** 库存数量 */
    @Excel(name = "库存数量")
    @RuleField(column = "stock", label = "库存数量")
    private Long stock;

    /** 产品类型 */
    @Excel(name = "产品类型")
    @RuleField(column = "product_type", label = "产品类型")
    private String productType;

    /** 产品等级 */
    @Excel(name = "产品等级")
    @RuleField(column = "grade", label = "产品等级")
    private String grade;

    /** 计量单位 */
    @Excel(name = "计量单位")
    @RuleField(column = "unit", label = "计量单位")
    private String unit;

    /** 产地 */
    @Excel(name = "产地")
    @RuleField(column = "origin", label = "产地")
    private String origin;

    /** 产品状态 */
    @Excel(name = "产品状态")
    @RuleField(column = "product_status", label = "产品状态")
    private String productStatus;

    /** 是否危险品 */
    @Excel(name = "是否危险品")
    @RuleField(column = "is_hazardous", label = "是否危险品")
    private String isHazardous;

    /** 产品标签 */
    @Excel(name = "产品标签")
    @RuleField(column = "tags", label = "产品标签")
    private String tags;

    /** 适用场景 */
    @Excel(name = "适用场景")
    @RuleField(column = "scenes", label = "适用场景")
    private String scenes;

    /** 生产日期 */
    @JsonFormat(pattern = "yyyy-MM-dd")
    @Excel(name = "生产日期", width = 30, dateFormat = "yyyy-MM-dd")
    @RuleField(column = "produce_date", label = "生产日期")
    private Date produceDate;

    /** 上市日期 */
    @JsonFormat(pattern = "yyyy-MM-dd")
    @Excel(name = "上市日期", width = 30, dateFormat = "yyyy-MM-dd")
    @RuleField(column = "launch_date", label = "上市日期")
    private Date launchDate;

    /** 每日盘点时间 */
    @JsonFormat(pattern = "HH:mm:ss")
    @Excel(name = "每日盘点时间", width = 30, dateFormat = "HH:mm:ss")
    @RuleField(column = "stocktake_time", label = "每日盘点时间")
    private Date stocktakeTime;

    /** 入库时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Excel(name = "入库时间", width = 30, dateFormat = "yyyy-MM-dd HH:mm:ss")
    @RuleField(column = "inbound_time", label = "入库时间")
    private Date inboundTime;

    /** 过期时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Excel(name = "过期时间", width = 30, dateFormat = "yyyy-MM-dd HH:mm:ss")
    @RuleField(column = "expire_time", label = "过期时间")
    private Date expireTime;

    /** 产品主图 */
    @Excel(name = "产品主图")
    @RuleField(column = "cover_image", label = "产品主图")
    private String coverImage;

    /** 产品图册 */
    @Excel(name = "产品图册")
    @RuleField(column = "gallery_images", label = "产品图册")
    private String galleryImages;

    /** 规格书 */
    @Excel(name = "规格书")
    @RuleField(column = "spec_file", label = "规格书")
    private String specFile;

    /** 质检报告 */
    @Excel(name = "质检报告")
    @RuleField(column = "report_file", label = "质检报告")
    private String reportFile;

    /** 相关附件 */
    @Excel(name = "相关附件")
    @RuleField(column = "manual_files", label = "相关附件")
    private String manualFiles;

    /** 产品描述 */
    @Excel(name = "产品描述")
    @RuleField(column = "detail_content", label = "产品描述")
    private String detailContent;

    /** 适用年龄 */
    @Excel(name = "适用年龄")
    @RuleField(column = "suitable_age", label = "适用年龄")
    private Long suitableAge;

    /** 含税单价 */
    @Excel(name = "含税单价")
    @RuleField(column = "unit_price", label = "含税单价")
    private BigDecimal unitPrice;

    /** 调整金额 */
    @Excel(name = "调整金额")
    @RuleField(column = "adjust_amount", label = "调整金额")
    private BigDecimal adjustAmount;

    /** 折扣率 */
    @Excel(name = "折扣率")
    @RuleField(column = "discount_rate", label = "折扣率")
    private BigDecimal discountRate;

    /** 是否推荐 */
    @Excel(name = "是否推荐")
    @RuleField(column = "is_recommend", label = "是否推荐")
    private Integer isRecommend;

    /** 上市年月 */
    @Excel(name = "上市年月")
    @RuleField(column = "launch_month", label = "上市年月")
    private String launchMonth;

    /** 上市年份 */
    @Excel(name = "上市年份")
    @RuleField(column = "launch_year", label = "上市年份")
    private String launchYear;

    /** 产品评分 */
    @Excel(name = "产品评分")
    @RuleField(column = "star_level", label = "产品评分")
    private Integer starLevel;

    /** 联系电话 */
    @Excel(name = "联系电话")
    @RuleField(column = "contact_phone", label = "联系电话")
    private String contactPhone;

    /** 联系邮箱 */
    @Excel(name = "联系邮箱")
    @RuleField(column = "contact_email", label = "联系邮箱")
    private String contactEmail;

    /** 使用说明 */
    @Excel(name = "使用说明")
    @RuleField(column = "instruction", label = "使用说明")
    private String instruction;

    /** 删除标志（0存在 2删除） */
    @RuleField(column = "del_flag", label = "删除标志")
    private String delFlag;

    public void setProductId(Long productId) 
    {
        this.productId = productId;
    }

    public Long getProductId() 
    {
        return productId;
    }

    public void setProductCode(String productCode) 
    {
        this.productCode = productCode;
    }

    public String getProductCode() 
    {
        return productCode;
    }

    public void setProductName(String productName) 
    {
        this.productName = productName;
    }

    public String getProductName() 
    {
        return productName;
    }

    public void setCategoryId(Long categoryId) 
    {
        this.categoryId = categoryId;
    }

    public Long getCategoryId() 
    {
        return categoryId;
    }

    public void setSpecModel(String specModel) 
    {
        this.specModel = specModel;
    }

    public String getSpecModel() 
    {
        return specModel;
    }

    public void setBarcode(String barcode) 
    {
        this.barcode = barcode;
    }

    public String getBarcode() 
    {
        return barcode;
    }

    public void setSupplier(String supplier) 
    {
        this.supplier = supplier;
    }

    public String getSupplier() 
    {
        return supplier;
    }

    public void setPrice(BigDecimal price) 
    {
        this.price = price;
    }

    public BigDecimal getPrice() 
    {
        return price;
    }

    public void setStock(Long stock) 
    {
        this.stock = stock;
    }

    public Long getStock() 
    {
        return stock;
    }

    public void setProductType(String productType) 
    {
        this.productType = productType;
    }

    public String getProductType() 
    {
        return productType;
    }

    public void setGrade(String grade) 
    {
        this.grade = grade;
    }

    public String getGrade() 
    {
        return grade;
    }

    public void setUnit(String unit) 
    {
        this.unit = unit;
    }

    public String getUnit() 
    {
        return unit;
    }

    public void setOrigin(String origin) 
    {
        this.origin = origin;
    }

    public String getOrigin() 
    {
        return origin;
    }

    public void setProductStatus(String productStatus) 
    {
        this.productStatus = productStatus;
    }

    public String getProductStatus() 
    {
        return productStatus;
    }

    public void setIsHazardous(String isHazardous) 
    {
        this.isHazardous = isHazardous;
    }

    public String getIsHazardous() 
    {
        return isHazardous;
    }

    public void setTags(String tags) 
    {
        this.tags = tags;
    }

    public String getTags() 
    {
        return tags;
    }

    public void setScenes(String scenes) 
    {
        this.scenes = scenes;
    }

    public String getScenes() 
    {
        return scenes;
    }

    public void setProduceDate(Date produceDate) 
    {
        this.produceDate = produceDate;
    }

    public Date getProduceDate() 
    {
        return produceDate;
    }

    public void setLaunchDate(Date launchDate) 
    {
        this.launchDate = launchDate;
    }

    public Date getLaunchDate() 
    {
        return launchDate;
    }

    public void setStocktakeTime(Date stocktakeTime) 
    {
        this.stocktakeTime = stocktakeTime;
    }

    public Date getStocktakeTime() 
    {
        return stocktakeTime;
    }

    public void setInboundTime(Date inboundTime) 
    {
        this.inboundTime = inboundTime;
    }

    public Date getInboundTime() 
    {
        return inboundTime;
    }

    public void setExpireTime(Date expireTime) 
    {
        this.expireTime = expireTime;
    }

    public Date getExpireTime() 
    {
        return expireTime;
    }

    public void setCoverImage(String coverImage) 
    {
        this.coverImage = coverImage;
    }

    public String getCoverImage() 
    {
        return coverImage;
    }

    public void setGalleryImages(String galleryImages) 
    {
        this.galleryImages = galleryImages;
    }

    public String getGalleryImages() 
    {
        return galleryImages;
    }

    public void setSpecFile(String specFile) 
    {
        this.specFile = specFile;
    }

    public String getSpecFile() 
    {
        return specFile;
    }

    public void setReportFile(String reportFile) 
    {
        this.reportFile = reportFile;
    }

    public String getReportFile() 
    {
        return reportFile;
    }

    public void setManualFiles(String manualFiles) 
    {
        this.manualFiles = manualFiles;
    }

    public String getManualFiles() 
    {
        return manualFiles;
    }

    public void setDetailContent(String detailContent) 
    {
        this.detailContent = detailContent;
    }

    public String getDetailContent() 
    {
        return detailContent;
    }

    public void setSuitableAge(Long suitableAge) 
    {
        this.suitableAge = suitableAge;
    }

    public Long getSuitableAge() 
    {
        return suitableAge;
    }

    public void setUnitPrice(BigDecimal unitPrice) 
    {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getUnitPrice() 
    {
        return unitPrice;
    }

    public void setAdjustAmount(BigDecimal adjustAmount) 
    {
        this.adjustAmount = adjustAmount;
    }

    public BigDecimal getAdjustAmount() 
    {
        return adjustAmount;
    }

    public void setDiscountRate(BigDecimal discountRate) 
    {
        this.discountRate = discountRate;
    }

    public BigDecimal getDiscountRate() 
    {
        return discountRate;
    }

    public void setIsRecommend(Integer isRecommend) 
    {
        this.isRecommend = isRecommend;
    }

    public Integer getIsRecommend() 
    {
        return isRecommend;
    }

    public void setLaunchMonth(String launchMonth) 
    {
        this.launchMonth = launchMonth;
    }

    public String getLaunchMonth() 
    {
        return launchMonth;
    }

    public void setLaunchYear(String launchYear) 
    {
        this.launchYear = launchYear;
    }

    public String getLaunchYear() 
    {
        return launchYear;
    }

    public void setStarLevel(Integer starLevel) 
    {
        this.starLevel = starLevel;
    }

    public Integer getStarLevel() 
    {
        return starLevel;
    }

    public void setContactPhone(String contactPhone) 
    {
        this.contactPhone = contactPhone;
    }

    public String getContactPhone() 
    {
        return contactPhone;
    }

    public void setContactEmail(String contactEmail) 
    {
        this.contactEmail = contactEmail;
    }

    public String getContactEmail() 
    {
        return contactEmail;
    }

    public void setInstruction(String instruction) 
    {
        this.instruction = instruction;
    }

    public String getInstruction() 
    {
        return instruction;
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
            .append("productId", getProductId())
            .append("productCode", getProductCode())
            .append("productName", getProductName())
            .append("categoryId", getCategoryId())
            .append("specModel", getSpecModel())
            .append("barcode", getBarcode())
            .append("supplier", getSupplier())
            .append("price", getPrice())
            .append("stock", getStock())
            .append("productType", getProductType())
            .append("grade", getGrade())
            .append("unit", getUnit())
            .append("origin", getOrigin())
            .append("productStatus", getProductStatus())
            .append("isHazardous", getIsHazardous())
            .append("tags", getTags())
            .append("scenes", getScenes())
            .append("produceDate", getProduceDate())
            .append("launchDate", getLaunchDate())
            .append("stocktakeTime", getStocktakeTime())
            .append("inboundTime", getInboundTime())
            .append("expireTime", getExpireTime())
            .append("coverImage", getCoverImage())
            .append("galleryImages", getGalleryImages())
            .append("specFile", getSpecFile())
            .append("reportFile", getReportFile())
            .append("manualFiles", getManualFiles())
            .append("detailContent", getDetailContent())
            .append("suitableAge", getSuitableAge())
            .append("unitPrice", getUnitPrice())
            .append("adjustAmount", getAdjustAmount())
            .append("discountRate", getDiscountRate())
            .append("isRecommend", getIsRecommend())
            .append("launchMonth", getLaunchMonth())
            .append("launchYear", getLaunchYear())
            .append("starLevel", getStarLevel())
            .append("contactPhone", getContactPhone())
            .append("contactEmail", getContactEmail())
            .append("instruction", getInstruction())
            .append("delFlag", getDelFlag())
            .append("createBy", getCreateBy())
            .append("createTime", getCreateTime())
            .append("updateBy", getUpdateBy())
            .append("updateTime", getUpdateTime())
            .append("remark", getRemark())
            .toString();
    }
}
