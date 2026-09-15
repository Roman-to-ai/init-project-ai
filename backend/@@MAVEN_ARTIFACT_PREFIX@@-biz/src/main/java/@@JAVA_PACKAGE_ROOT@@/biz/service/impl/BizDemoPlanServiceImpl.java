package @@JAVA_PACKAGE_ROOT@@.biz.service.impl;

import java.util.List;
import @@JAVA_PACKAGE_ROOT@@.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import @@JAVA_PACKAGE_ROOT@@.common.utils.StringUtils;
import org.springframework.transaction.annotation.Transactional;
import @@JAVA_PACKAGE_ROOT@@.biz.domain.BizDemoPlanItem;
import @@JAVA_PACKAGE_ROOT@@.biz.mapper.BizDemoPlanMapper;
import @@JAVA_PACKAGE_ROOT@@.biz.domain.BizDemoPlan;
import @@JAVA_PACKAGE_ROOT@@.biz.service.IBizDemoPlanService;

/**
 * 演示生产计划Service业务层处理
 * 
 * @date 2026-09-14
 */
@Service
public class BizDemoPlanServiceImpl implements IBizDemoPlanService 
{
    @Autowired
    private BizDemoPlanMapper bizDemoPlanMapper;

    /**
     * 查询演示生产计划
     * 
     * @param planId 演示生产计划主键
     * @return 演示生产计划
     */
    @Override
    public BizDemoPlan selectBizDemoPlanByPlanId(Long planId)
    {
        return bizDemoPlanMapper.selectBizDemoPlanByPlanId(planId);
    }

    /**
     * 查询演示生产计划列表
     * 
     * @param bizDemoPlan 演示生产计划
     * @return 演示生产计划
     */
    @Override
    public List<BizDemoPlan> selectBizDemoPlanList(BizDemoPlan bizDemoPlan)
    {
        return bizDemoPlanMapper.selectBizDemoPlanList(bizDemoPlan);
    }

    /**
     * 新增演示生产计划
     * 
     * @param bizDemoPlan 演示生产计划
     * @return 结果
     */
    @Transactional
    @Override
    public int insertBizDemoPlan(BizDemoPlan bizDemoPlan)
    {
        bizDemoPlan.setCreateTime(DateUtils.getNowDate());
        int rows = bizDemoPlanMapper.insertBizDemoPlan(bizDemoPlan);
        insertBizDemoPlanItem(bizDemoPlan);
        return rows;
    }

    /**
     * 修改演示生产计划
     * 
     * @param bizDemoPlan 演示生产计划
     * @return 结果
     */
    @Transactional
    @Override
    public int updateBizDemoPlan(BizDemoPlan bizDemoPlan)
    {
        bizDemoPlan.setUpdateTime(DateUtils.getNowDate());
        bizDemoPlanMapper.deleteBizDemoPlanItemByPlanId(bizDemoPlan.getPlanId());
        insertBizDemoPlanItem(bizDemoPlan);
        return bizDemoPlanMapper.updateBizDemoPlan(bizDemoPlan);
    }

    /**
     * 批量删除演示生产计划
     * 
     * @param planIds 需要删除的演示生产计划主键
     * @return 结果
     */
    @Transactional
    @Override
    public int deleteBizDemoPlanByPlanIds(Long[] planIds)
    {
        bizDemoPlanMapper.deleteBizDemoPlanItemByPlanIds(planIds);
        return bizDemoPlanMapper.deleteBizDemoPlanByPlanIds(planIds);
    }

    /**
     * 删除演示生产计划信息
     * 
     * @param planId 演示生产计划主键
     * @return 结果
     */
    @Transactional
    @Override
    public int deleteBizDemoPlanByPlanId(Long planId)
    {
        bizDemoPlanMapper.deleteBizDemoPlanItemByPlanId(planId);
        return bizDemoPlanMapper.deleteBizDemoPlanByPlanId(planId);
    }

    /**
     * 新增计划明细信息
     * 
     * @param bizDemoPlan 演示生产计划对象
     */
    public void insertBizDemoPlanItem(BizDemoPlan bizDemoPlan)
    {
        List<BizDemoPlanItem> bizDemoPlanItemList = bizDemoPlan.getBizDemoPlanItemList();
        Long planId = bizDemoPlan.getPlanId();
        if (StringUtils.isNotNull(bizDemoPlanItemList))
        {
            List<BizDemoPlanItem> list = new ArrayList<BizDemoPlanItem>();
            for (BizDemoPlanItem bizDemoPlanItem : bizDemoPlanItemList)
            {
                bizDemoPlanItem.setPlanId(planId);
                list.add(bizDemoPlanItem);
            }
            if (list.size() > 0)
            {
                bizDemoPlanMapper.batchBizDemoPlanItem(list);
            }
        }
    }
}
