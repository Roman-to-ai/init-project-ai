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
import @@JAVA_PACKAGE_ROOT@@.biz.domain.BizDemoCategory;
import @@JAVA_PACKAGE_ROOT@@.biz.service.IBizDemoCategoryService;
import @@JAVA_PACKAGE_ROOT@@.common.utils.poi.ExcelUtil;

/**
 * 演示产品分类Controller
 * 
 * @date 2026-09-14
 */
@RestController
@RequestMapping("/biz/demoCategory")
public class BizDemoCategoryController extends BaseController
{
    @Autowired
    private IBizDemoCategoryService bizDemoCategoryService;

    /**
     * 查询演示产品分类列表
     */
    @PreAuthorize("@ss.hasPermi('biz:demoCategory:list')")
    @GetMapping("/list")
    public AjaxResult list(BizDemoCategory bizDemoCategory)
    {
        List<BizDemoCategory> list = bizDemoCategoryService.selectBizDemoCategoryList(bizDemoCategory);
        return success(list);
    }

    /**
     * 导出演示产品分类列表
     */
    @PreAuthorize("@ss.hasPermi('biz:demoCategory:export')")
    @Log(title = "演示产品分类", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, BizDemoCategory bizDemoCategory)
    {
        List<BizDemoCategory> list = bizDemoCategoryService.selectBizDemoCategoryList(bizDemoCategory);
        ExcelUtil<BizDemoCategory> util = new ExcelUtil<BizDemoCategory>(BizDemoCategory.class);
        util.exportExcel(response, list, "演示产品分类数据");
    }

    /**
     * 获取演示产品分类详细信息
     */
    @PreAuthorize("@ss.hasPermi('biz:demoCategory:query')")
    @GetMapping(value = "/{categoryId}")
    public AjaxResult getInfo(@PathVariable("categoryId") Long categoryId)
    {
        return success(bizDemoCategoryService.selectBizDemoCategoryByCategoryId(categoryId));
    }

    /**
     * 新增演示产品分类
     */
    @PreAuthorize("@ss.hasPermi('biz:demoCategory:add')")
    @Log(title = "演示产品分类", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@Validated @RequestBody BizDemoCategory bizDemoCategory)
    {
        return toAjax(bizDemoCategoryService.insertBizDemoCategory(bizDemoCategory));
    }

    /**
     * 修改演示产品分类
     */
    @PreAuthorize("@ss.hasPermi('biz:demoCategory:edit')")
    @Log(title = "演示产品分类", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@Validated @RequestBody BizDemoCategory bizDemoCategory)
    {
        return toAjax(bizDemoCategoryService.updateBizDemoCategory(bizDemoCategory));
    }

    /**
     * 删除演示产品分类
     */
    @PreAuthorize("@ss.hasPermi('biz:demoCategory:remove')")
    @Log(title = "演示产品分类", businessType = BusinessType.DELETE)
	@DeleteMapping("/{categoryIds}")
    public AjaxResult remove(@PathVariable Long[] categoryIds)
    {
        return toAjax(bizDemoCategoryService.deleteBizDemoCategoryByCategoryIds(categoryIds));
    }
}
