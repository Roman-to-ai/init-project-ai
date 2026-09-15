package @@JAVA_PACKAGE_ROOT@@.biz.service;

import java.util.List;
import @@JAVA_PACKAGE_ROOT@@.biz.domain.BizDemoPlan;

/**
 * 演示生产计划Service接口
 * 
 * @date 2026-09-14
 */
public interface IBizDemoPlanService 
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
     * 批量删除演示生产计划
     * 
     * @param planIds 需要删除的演示生产计划主键集合
     * @return 结果
     */
    public int deleteBizDemoPlanByPlanIds(Long[] planIds);

    /**
     * 删除演示生产计划信息
     * 
     * @param planId 演示生产计划主键
     * @return 结果
     */
    public int deleteBizDemoPlanByPlanId(Long planId);
}
