package @@JAVA_PACKAGE_ROOT@@.biz.controller;

import java.util.List;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;
import @@JAVA_PACKAGE_ROOT@@.common.annotation.Log;
import @@JAVA_PACKAGE_ROOT@@.common.core.controller.BaseController;
import @@JAVA_PACKAGE_ROOT@@.common.core.domain.AjaxResult;
import @@JAVA_PACKAGE_ROOT@@.common.enums.BusinessType;
import @@JAVA_PACKAGE_ROOT@@.biz.domain.BizDemoOrder;
import @@JAVA_PACKAGE_ROOT@@.biz.service.IBizDemoOrderService;
import @@JAVA_PACKAGE_ROOT@@.common.utils.poi.ExcelUtil;
import @@JAVA_PACKAGE_ROOT@@.common.core.page.TableDataInfo;

/**
 * 演示工单Controller
 * 
 * @date 2026-09-14
 */
@RestController
@RequestMapping("/biz/demoOrder")
public class BizDemoOrderController extends BaseController
{
    @Autowired
    private IBizDemoOrderService bizDemoOrderService;

    /**
     * 查询演示工单列表
     */
    @PreAuthorize("@ss.hasPermi('biz:demoOrder:list')")
    @GetMapping("/list")
    public TableDataInfo list(BizDemoOrder bizDemoOrder)
    {
        startPage();
        List<BizDemoOrder> list = bizDemoOrderService.selectBizDemoOrderList(bizDemoOrder);
        return getDataTable(list);
    }

    /**
     * 导出演示工单列表
     */
    @PreAuthorize("@ss.hasPermi('biz:demoOrder:export')")
    @Log(title = "演示工单", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, BizDemoOrder bizDemoOrder)
    {
        List<BizDemoOrder> list = bizDemoOrderService.selectBizDemoOrderList(bizDemoOrder);
        ExcelUtil<BizDemoOrder> util = new ExcelUtil<BizDemoOrder>(BizDemoOrder.class);
        util.exportExcel(response, list, "演示工单数据");
    }

    /**
     * 获取演示工单详细信息
     */
    @PreAuthorize("@ss.hasPermi('biz:demoOrder:query')")
    @GetMapping(value = "/{orderId}")
    public AjaxResult getInfo(@PathVariable("orderId") Long orderId)
    {
        return success(bizDemoOrderService.selectBizDemoOrderByOrderId(orderId));
    }

    /**
     * 新增演示工单
     */
    @PreAuthorize("@ss.hasPermi('biz:demoOrder:add')")
    @Log(title = "演示工单", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@Validated @RequestBody BizDemoOrder bizDemoOrder)
    {
        return toAjax(bizDemoOrderService.insertBizDemoOrder(bizDemoOrder));
    }

    /**
     * 修改演示工单
     */
    @PreAuthorize("@ss.hasPermi('biz:demoOrder:edit')")
    @Log(title = "演示工单", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@Validated @RequestBody BizDemoOrder bizDemoOrder)
    {
        return toAjax(bizDemoOrderService.updateBizDemoOrder(bizDemoOrder));
    }

    /**
     * 删除演示工单
     */
    @PreAuthorize("@ss.hasPermi('biz:demoOrder:remove')")
    @Log(title = "演示工单", businessType = BusinessType.DELETE)
	@DeleteMapping("/{orderIds}")
    public AjaxResult remove(@PathVariable Long[] orderIds)
    {
        return toAjax(bizDemoOrderService.deleteBizDemoOrderByOrderIds(orderIds));
    }
}
