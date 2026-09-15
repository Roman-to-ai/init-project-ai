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
import @@JAVA_PACKAGE_ROOT@@.biz.domain.BizDemoProduct;
import @@JAVA_PACKAGE_ROOT@@.biz.service.IBizDemoProductService;
import @@JAVA_PACKAGE_ROOT@@.common.utils.poi.ExcelUtil;
import @@JAVA_PACKAGE_ROOT@@.common.core.page.TableDataInfo;

/**
 * 演示产品Controller
 * 
 * @date 2026-09-14
 */
@RestController
@RequestMapping("/biz/demoProduct")
public class BizDemoProductController extends BaseController
{
    @Autowired
    private IBizDemoProductService bizDemoProductService;

    /**
     * 查询演示产品列表
     */
    @PreAuthorize("@ss.hasPermi('biz:demoProduct:list')")
    @GetMapping("/list")
    public TableDataInfo list(BizDemoProduct bizDemoProduct)
    {
        startPage();
        List<BizDemoProduct> list = bizDemoProductService.selectBizDemoProductList(bizDemoProduct);
        return getDataTable(list);
    }

    /**
     * 导出演示产品列表
     */
    @PreAuthorize("@ss.hasPermi('biz:demoProduct:export')")
    @Log(title = "演示产品", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, BizDemoProduct bizDemoProduct)
    {
        List<BizDemoProduct> list = bizDemoProductService.selectBizDemoProductList(bizDemoProduct);
        ExcelUtil<BizDemoProduct> util = new ExcelUtil<BizDemoProduct>(BizDemoProduct.class);
        util.exportExcel(response, list, "演示产品数据");
    }

    /**
     * 获取演示产品详细信息
     */
    @PreAuthorize("@ss.hasPermi('biz:demoProduct:query')")
    @GetMapping(value = "/{productId}")
    public AjaxResult getInfo(@PathVariable("productId") Long productId)
    {
        return success(bizDemoProductService.selectBizDemoProductByProductId(productId));
    }

    /**
     * 新增演示产品
     */
    @PreAuthorize("@ss.hasPermi('biz:demoProduct:add')")
    @Log(title = "演示产品", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@Validated @RequestBody BizDemoProduct bizDemoProduct)
    {
        return toAjax(bizDemoProductService.insertBizDemoProduct(bizDemoProduct));
    }

    /**
     * 修改演示产品
     */
    @PreAuthorize("@ss.hasPermi('biz:demoProduct:edit')")
    @Log(title = "演示产品", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@Validated @RequestBody BizDemoProduct bizDemoProduct)
    {
        return toAjax(bizDemoProductService.updateBizDemoProduct(bizDemoProduct));
    }

    /**
     * 删除演示产品
     */
    @PreAuthorize("@ss.hasPermi('biz:demoProduct:remove')")
    @Log(title = "演示产品", businessType = BusinessType.DELETE)
	@DeleteMapping("/{productIds}")
    public AjaxResult remove(@PathVariable Long[] productIds)
    {
        return toAjax(bizDemoProductService.deleteBizDemoProductByProductIds(productIds));
    }
}
