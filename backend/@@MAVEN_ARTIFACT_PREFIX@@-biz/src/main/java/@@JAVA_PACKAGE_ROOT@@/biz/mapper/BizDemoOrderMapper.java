package @@JAVA_PACKAGE_ROOT@@.biz.mapper;

import java.util.List;
import @@JAVA_PACKAGE_ROOT@@.biz.domain.BizDemoOrder;

/**
 * 演示工单Mapper接口
 * 
 * @date 2026-09-14
 */
public interface BizDemoOrderMapper 
{
    /**
     * 查询演示工单
     * 
     * @param orderId 演示工单主键
     * @return 演示工单
     */
    public BizDemoOrder selectBizDemoOrderByOrderId(Long orderId);

    /**
     * 查询演示工单列表
     * 
     * @param bizDemoOrder 演示工单
     * @return 演示工单集合
     */
    public List<BizDemoOrder> selectBizDemoOrderList(BizDemoOrder bizDemoOrder);

    /**
     * 新增演示工单
     * 
     * @param bizDemoOrder 演示工单
     * @return 结果
     */
    public int insertBizDemoOrder(BizDemoOrder bizDemoOrder);

    /**
     * 修改演示工单
     * 
     * @param bizDemoOrder 演示工单
     * @return 结果
     */
    public int updateBizDemoOrder(BizDemoOrder bizDemoOrder);

    /**
     * 删除演示工单
     * 
     * @param orderId 演示工单主键
     * @return 结果
     */
    public int deleteBizDemoOrderByOrderId(Long orderId);

    /**
     * 批量删除演示工单
     * 
     * @param orderIds 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteBizDemoOrderByOrderIds(Long[] orderIds);
}
