package @@JAVA_PACKAGE_ROOT@@.biz.service.impl;

import java.util.List;
import @@JAVA_PACKAGE_ROOT@@.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import @@JAVA_PACKAGE_ROOT@@.biz.mapper.BizDemoProductMapper;
import @@JAVA_PACKAGE_ROOT@@.biz.domain.BizDemoProduct;
import @@JAVA_PACKAGE_ROOT@@.biz.service.IBizDemoProductService;

/**
 * 演示产品Service业务层处理
 * 
 * @date 2026-09-14
 */
@Service
public class BizDemoProductServiceImpl implements IBizDemoProductService 
{
    @Autowired
    private BizDemoProductMapper bizDemoProductMapper;

    /**
     * 查询演示产品
     * 
     * @param productId 演示产品主键
     * @return 演示产品
     */
    @Override
    public BizDemoProduct selectBizDemoProductByProductId(Long productId)
    {
        return bizDemoProductMapper.selectBizDemoProductByProductId(productId);
    }

    /**
     * 查询演示产品列表
     * 
     * @param bizDemoProduct 演示产品
     * @return 演示产品
     */
    @Override
    public List<BizDemoProduct> selectBizDemoProductList(BizDemoProduct bizDemoProduct)
    {
        return bizDemoProductMapper.selectBizDemoProductList(bizDemoProduct);
    }

    /**
     * 新增演示产品
     * 
     * @param bizDemoProduct 演示产品
     * @return 结果
     */
    @Override
    public int insertBizDemoProduct(BizDemoProduct bizDemoProduct)
    {
        bizDemoProduct.setCreateTime(DateUtils.getNowDate());
        return bizDemoProductMapper.insertBizDemoProduct(bizDemoProduct);
    }

    /**
     * 修改演示产品
     * 
     * @param bizDemoProduct 演示产品
     * @return 结果
     */
    @Override
    public int updateBizDemoProduct(BizDemoProduct bizDemoProduct)
    {
        bizDemoProduct.setUpdateTime(DateUtils.getNowDate());
        return bizDemoProductMapper.updateBizDemoProduct(bizDemoProduct);
    }

    /**
     * 批量删除演示产品
     * 
     * @param productIds 需要删除的演示产品主键
     * @return 结果
     */
    @Override
    public int deleteBizDemoProductByProductIds(Long[] productIds)
    {
        return bizDemoProductMapper.deleteBizDemoProductByProductIds(productIds);
    }

    /**
     * 删除演示产品信息
     * 
     * @param productId 演示产品主键
     * @return 结果
     */
    @Override
    public int deleteBizDemoProductByProductId(Long productId)
    {
        return bizDemoProductMapper.deleteBizDemoProductByProductId(productId);
    }
}
