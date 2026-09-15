package @@JAVA_PACKAGE_ROOT@@.biz.mapper;

import java.util.List;
import @@JAVA_PACKAGE_ROOT@@.biz.domain.BizDemoPlan;
import @@JAVA_PACKAGE_ROOT@@.biz.domain.BizDemoPlanItem;

/**
 * 演示生产计划Mapper接口
 * 
 * @date 2026-09-14
 */
public interface BizDemoPlanMapper 
{
    /**
     * 查询演示生产计划
     * 
     * @param planId 演示生产计划主键
     * @return 演示生产计划
     */
    public BizDemoPlan selectBizDemoPlanByPlanId(Long planId);

    /**
     * 查询演示生产计划列表
     * 
     * @param bizDemoPlan 演示生产计划
     * @return 演示生产计划集合
     */
    public List<BizDemoPlan> selectBizDemoPlanList(BizDemoPlan bizDemoPlan);

    /**
     * 新增演示生产计划
     * 
     * @param bizDemoPlan 演示生产计划
     * @return 结果
     */
    public int insertBizDemoPlan(BizDemoPlan bizDemoPlan);

    /**
     * 修改演示生产计划
     * 
     * @param bizDemoPlan 演示生产计划
     * @return 结果
     */
    public int updateBizDemoPlan(BizDemoPlan bizDemoPlan);

    /**
     * 删除演示生产计划
     * 
     * @param planId 演示生产计划主键
     * @return 结果
     */
    public int deleteBizDemoPlanByPlanId(Long planId);

    /**
     * 批量删除演示生产计划
     * 
     * @param planIds 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteBizDemoPlanByPlanIds(Long[] planIds);

    /**
     * 批量删除计划明细
     * 
     * @param planIds 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteBizDemoPlanItemByPlanIds(Long[] planIds);
    
    /**
     * 批量新增计划明细
     * 
     * @param bizDemoPlanItemList 计划明细列表
     * @return 结果
     */
    public int batchBizDemoPlanItem(List<BizDemoPlanItem> bizDemoPlanItemList);
    

    /**
     * 通过演示生产计划主键删除计划明细信息
     * 
     * @param planId 演示生产计划ID
     * @return 结果
     */
    public int deleteBizDemoPlanItemByPlanId(Long planId);
}
