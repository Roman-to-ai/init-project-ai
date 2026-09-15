package @@JAVA_PACKAGE_ROOT@@.biz.service.impl;

import java.util.List;
import @@JAVA_PACKAGE_ROOT@@.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import @@JAVA_PACKAGE_ROOT@@.biz.mapper.BizDemoCategoryMapper;
import @@JAVA_PACKAGE_ROOT@@.biz.domain.BizDemoCategory;
import @@JAVA_PACKAGE_ROOT@@.biz.service.IBizDemoCategoryService;

/**
 * 演示产品分类Service业务层处理
 * 
 * @date 2026-09-14
 */
@Service
public class BizDemoCategoryServiceImpl implements IBizDemoCategoryService 
{
    @Autowired
    private BizDemoCategoryMapper bizDemoCategoryMapper;

    /**
     * 查询演示产品分类
     * 
     * @param categoryId 演示产品分类主键
     * @return 演示产品分类
     */
    @Override
    public BizDemoCategory selectBizDemoCategoryByCategoryId(Long categoryId)
    {
        return bizDemoCategoryMapper.selectBizDemoCategoryByCategoryId(categoryId);
    }

    /**
     * 查询演示产品分类列表
     * 
     * @param bizDemoCategory 演示产品分类
     * @return 演示产品分类
     */
    @Override
    public List<BizDemoCategory> selectBizDemoCategoryList(BizDemoCategory bizDemoCategory)
    {
        return bizDemoCategoryMapper.selectBizDemoCategoryList(bizDemoCategory);
    }

    /**
     * 新增演示产品分类
     * 
     * @param bizDemoCategory 演示产品分类
     * @return 结果
     */
    @Override
    public int insertBizDemoCategory(BizDemoCategory bizDemoCategory)
    {
        bizDemoCategory.setCreateTime(DateUtils.getNowDate());
        return bizDemoCategoryMapper.insertBizDemoCategory(bizDemoCategory);
    }

    /**
     * 修改演示产品分类
     * 
     * @param bizDemoCategory 演示产品分类
     * @return 结果
     */
    @Override
    public int updateBizDemoCategory(BizDemoCategory bizDemoCategory)
    {
        bizDemoCategory.setUpdateTime(DateUtils.getNowDate());
        return bizDemoCategoryMapper.updateBizDemoCategory(bizDemoCategory);
    }

    /**
     * 批量删除演示产品分类
     * 
     * @param categoryIds 需要删除的演示产品分类主键
     * @return 结果
     */
    @Override
    public int deleteBizDemoCategoryByCategoryIds(Long[] categoryIds)
    {
        return bizDemoCategoryMapper.deleteBizDemoCategoryByCategoryIds(categoryIds);
    }

    /**
     * 删除演示产品分类信息
     * 
     * @param categoryId 演示产品分类主键
     * @return 结果
     */
    @Override
    public int deleteBizDemoCategoryByCategoryId(Long categoryId)
    {
        return bizDemoCategoryMapper.deleteBizDemoCategoryByCategoryId(categoryId);
    }
}
