package @@JAVA_PACKAGE_ROOT@@.biz.service.impl;

import java.util.List;
import @@JAVA_PACKAGE_ROOT@@.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import @@JAVA_PACKAGE_ROOT@@.biz.mapper.BizDemoOrderMapper;
import @@JAVA_PACKAGE_ROOT@@.biz.domain.BizDemoOrder;
import @@JAVA_PACKAGE_ROOT@@.biz.service.IBizDemoOrderService;

/**
 * 演示工单Service业务层处理
 * 
 * @date 2026-09-14
 */
@Service
public class BizDemoOrderServiceImpl implements IBizDemoOrderService 
{
    @Autowired
    private BizDemoOrderMapper bizDemoOrderMapper;

    /**
     * 查询演示工单
     * 
     * @param orderId 演示工单主键
     * @return 演示工单
     */
    @Override
    public BizDemoOrder selectBizDemoOrderByOrderId(Long orderId)
    {
        return bizDemoOrderMapper.selectBizDemoOrderByOrderId(orderId);
    }

    /**
     * 查询演示工单列表
     * 
     * @param bizDemoOrder 演示工单
     * @return 演示工单
     */
    @Override
    public List<BizDemoOrder> selectBizDemoOrderList(BizDemoOrder bizDemoOrder)
    {
        return bizDemoOrderMapper.selectBizDemoOrderList(bizDemoOrder);
    }

    /**
     * 新增演示工单
     * 
     * @param bizDemoOrder 演示工单
     * @return 结果
     */
    @Override
    public int insertBizDemoOrder(BizDemoOrder bizDemoOrder)
    {
        bizDemoOrder.setCreateTime(DateUtils.getNowDate());
        return bizDemoOrderMapper.insertBizDemoOrder(bizDemoOrder);
    }

    /**
     * 修改演示工单
     * 
     * @param bizDemoOrder 演示工单
     * @return 结果
     */
    @Override
    public int updateBizDemoOrder(BizDemoOrder bizDemoOrder)
    {
        bizDemoOrder.setUpdateTime(DateUtils.getNowDate());
        return bizDemoOrderMapper.updateBizDemoOrder(bizDemoOrder);
    }

    /**
     * 批量删除演示工单
     * 
     * @param orderIds 需要删除的演示工单主键
     * @return 结果
     */
    @Override
    public int deleteBizDemoOrderByOrderIds(Long[] orderIds)
    {
        return bizDemoOrderMapper.deleteBizDemoOrderByOrderIds(orderIds);
    }

    /**
     * 删除演示工单信息
     * 
     * @param orderId 演示工单主键
     * @return 结果
     */
    @Override
    public int deleteBizDemoOrderByOrderId(Long orderId)
    {
        return bizDemoOrderMapper.deleteBizDemoOrderByOrderId(orderId);
    }
}
