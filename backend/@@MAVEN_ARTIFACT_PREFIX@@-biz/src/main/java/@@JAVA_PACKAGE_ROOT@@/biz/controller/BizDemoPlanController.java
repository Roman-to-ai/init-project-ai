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
import @@JAVA_PACKAGE_ROOT@@.biz.domain.BizDemoPlan;
import @@JAVA_PACKAGE_ROOT@@.biz.service.IBizDemoPlanService;
import @@JAVA_PACKAGE_ROOT@@.common.utils.poi.ExcelUtil;
import @@JAVA_PACKAGE_ROOT@@.common.core.page.TableDataInfo;

/**
 * 演示生产计划Controller
 * 
 * @date 2026-09-14
 */
@RestController
@RequestMapping("/biz/demoPlan")
public class BizDemoPlanController extends BaseController
{
    @Autowired
    private IBizDemoPlanService bizDemoPlanService;

    /**
     * 查询演示生产计划列表
     */
    @PreAuthorize("@ss.hasPermi('biz:demoPlan:list')")
    @GetMapping("/list")
    public TableDataInfo list(BizDemoPlan bizDemoPlan)
    {
        startPage();
        List<BizDemoPlan> list = bizDemoPlanService.selectBizDemoPlanList(bizDemoPlan);
        return getDataTable(list);
    }

    /**
     * 导出演示生产计划列表
     */
    @PreAuthorize("@ss.hasPermi('biz:demoPlan:export')")
    @Log(title = "演示生产计划", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, BizDemoPlan bizDemoPlan)
    {
        List<BizDemoPlan> list = bizDemoPlanService.selectBizDemoPlanList(bizDemoPlan);
        ExcelUtil<BizDemoPlan> util = new ExcelUtil<BizDemoPlan>(BizDemoPlan.class);
        util.exportExcel(response, list, "演示生产计划数据");
    }

    /**
     * 获取演示生产计划详细信息
     */
    @PreAuthorize("@ss.hasPermi('biz:demoPlan:query')")
    @GetMapping(value = "/{planId}")
    public AjaxResult getInfo(@PathVariable("planId") Long planId)
    {
        return success(bizDemoPlanService.selectBizDemoPlanByPlanId(planId));
    }

    /**
     * 新增演示生产计划
     */
    @PreAuthorize("@ss.hasPermi('biz:demoPlan:add')")
    @Log(title = "演示生产计划", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@Validated @RequestBody BizDemoPlan bizDemoPlan)
    {
        return toAjax(bizDemoPlanService.insertBizDemoPlan(bizDemoPlan));
    }

    /**
     * 修改演示生产计划
     */
    @PreAuthorize("@ss.hasPermi('biz:demoPlan:edit')")
    @Log(title = "演示生产计划", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@Validated @RequestBody BizDemoPlan bizDemoPlan)
    {
        return toAjax(bizDemoPlanService.updateBizDemoPlan(bizDemoPlan));
    }

    /**
     * 删除演示生产计划
     */
    @PreAuthorize("@ss.hasPermi('biz:demoPlan:remove')")
    @Log(title = "演示生产计划", businessType = BusinessType.DELETE)
	@DeleteMapping("/{planIds}")
    public AjaxResult remove(@PathVariable Long[] planIds)
    {
        return toAjax(bizDemoPlanService.deleteBizDemoPlanByPlanIds(planIds));
    }
}
