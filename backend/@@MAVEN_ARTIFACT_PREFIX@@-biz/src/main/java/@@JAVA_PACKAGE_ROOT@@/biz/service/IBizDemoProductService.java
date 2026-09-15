package @@JAVA_PACKAGE_ROOT@@.biz.service;

import java.util.List;
import @@JAVA_PACKAGE_ROOT@@.biz.domain.BizDemoProduct;

/**
 * 演示产品Service接口
 * 
 * @date 2026-09-14
 */
public interface IBizDemoProductService 
{
    /**
     * 查询演示产品
     * 
     * @param productId 演示产品主键
     * @return 演示产品
     */
    public BizDemoProduct selectBizDemoProductByProductId(Long productId);

    /**
     * 查询演示产品列表
     * 
     * @param bizDemoProduct 演示产品
     * @return 演示产品集合
     */
    public List<BizDemoProduct> selectBizDemoProductList(BizDemoProduct bizDemoProduct);

    /**
     * 新增演示产品
     * 
     * @param bizDemoProduct 演示产品
     * @return 结果
     */
    public int insertBizDemoProduct(BizDemoProduct bizDemoProduct);

    /**
     * 修改演示产品
     * 
     * @param bizDemoProduct 演示产品
     * @return 结果
     */
    public int updateBizDemoProduct(BizDemoProduct bizDemoProduct);

    /**
     * 批量删除演示产品
     * 
     * @param productIds 需要删除的演示产品主键集合
     * @return 结果
     */
    public int deleteBizDemoProductByProductIds(Long[] productIds);

    /**
     * 删除演示产品信息
     * 
     * @param productId 演示产品主键
     * @return 结果
     */
    public int deleteBizDemoProductByProductId(Long productId);
}
