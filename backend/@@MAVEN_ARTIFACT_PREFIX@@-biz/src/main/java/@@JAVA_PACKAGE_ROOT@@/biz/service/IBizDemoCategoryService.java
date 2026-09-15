package @@JAVA_PACKAGE_ROOT@@.biz.service;

import java.util.List;
import @@JAVA_PACKAGE_ROOT@@.biz.domain.BizDemoCategory;

/**
 * 演示产品分类Service接口
 * 
 * @date 2026-09-14
 */
public interface IBizDemoCategoryService 
{
    /**
     * 查询演示产品分类
     * 
     * @param categoryId 演示产品分类主键
     * @return 演示产品分类
     */
    public BizDemoCategory selectBizDemoCategoryByCategoryId(Long categoryId);

    /**
     * 查询演示产品分类列表
     * 
     * @param bizDemoCategory 演示产品分类
     * @return 演示产品分类集合
     */
    public List<BizDemoCategory> selectBizDemoCategoryList(BizDemoCategory bizDemoCategory);

    /**
     * 新增演示产品分类
     * 
     * @param bizDemoCategory 演示产品分类
     * @return 结果
     */
    public int insertBizDemoCategory(BizDemoCategory bizDemoCategory);

    /**
     * 修改演示产品分类
     * 
     * @param bizDemoCategory 演示产品分类
     * @return 结果
     */
    public int updateBizDemoCategory(BizDemoCategory bizDemoCategory);

    /**
     * 批量删除演示产品分类
     * 
     * @param categoryIds 需要删除的演示产品分类主键集合
     * @return 结果
     */
    public int deleteBizDemoCategoryByCategoryIds(Long[] categoryIds);

    /**
     * 删除演示产品分类信息
     * 
     * @param categoryId 演示产品分类主键
     * @return 结果
     */
    public int deleteBizDemoCategoryByCategoryId(Long categoryId);
}
