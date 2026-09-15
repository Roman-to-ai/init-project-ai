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
import @@JAVA_PACKAGE_ROOT@@.biz.domain.BizDemoTag;
import @@JAVA_PACKAGE_ROOT@@.biz.service.IBizDemoTagService;
import @@JAVA_PACKAGE_ROOT@@.common.utils.poi.ExcelUtil;
import @@JAVA_PACKAGE_ROOT@@.common.core.page.TableDataInfo;

/**
 * æ¼”ç¤ºæ ‡ç­¾Controller
 * 
 * @date 2026-09-15
 */
@RestController
@RequestMapping("/biz/demoTag")
public class BizDemoTagController extends BaseController
{
    @Autowired
    private IBizDemoTagService bizDemoTagService;

    /**
     * 查询æ¼”ç¤ºæ ‡ç­¾列表
     */
    @PreAuthorize("@ss.hasPermi('biz:demoTag:list')")
    @GetMapping("/list")
    public TableDataInfo list(BizDemoTag bizDemoTag)
    {
        startPage();
        List<BizDemoTag> list = bizDemoTagService.selectBizDemoTagList(bizDemoTag);
        return getDataTable(list);
    }

    /**
     * 导出æ¼”ç¤ºæ ‡ç­¾列表
     */
    @PreAuthorize("@ss.hasPermi('biz:demoTag:export')")
    @Log(title = "æ¼”ç¤ºæ ‡ç­¾", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, BizDemoTag bizDemoTag)
    {
        List<BizDemoTag> list = bizDemoTagService.selectBizDemoTagList(bizDemoTag);
        ExcelUtil<BizDemoTag> util = new ExcelUtil<BizDemoTag>(BizDemoTag.class);
        util.exportExcel(response, list, "æ¼”ç¤ºæ ‡ç­¾数据");
    }

    /**
     * 获取æ¼”ç¤ºæ ‡ç­¾详细信息
     */
    @PreAuthorize("@ss.hasPermi('biz:demoTag:query')")
    @GetMapping(value = "/{tagId}")
    public AjaxResult getInfo(@PathVariable("tagId") Long tagId)
    {
        return success(bizDemoTagService.selectBizDemoTagByTagId(tagId));
    }

    /**
     * 新增æ¼”ç¤ºæ ‡ç­¾
     */
    @PreAuthorize("@ss.hasPermi('biz:demoTag:add')")
    @Log(title = "æ¼”ç¤ºæ ‡ç­¾", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@Validated @RequestBody BizDemoTag bizDemoTag)
    {
        return toAjax(bizDemoTagService.insertBizDemoTag(bizDemoTag));
    }

    /**
     * 修改æ¼”ç¤ºæ ‡ç­¾
     */
    @PreAuthorize("@ss.hasPermi('biz:demoTag:edit')")
    @Log(title = "æ¼”ç¤ºæ ‡ç­¾", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@Validated @RequestBody BizDemoTag bizDemoTag)
    {
        return toAjax(bizDemoTagService.updateBizDemoTag(bizDemoTag));
    }

    /**
     * 删除æ¼”ç¤ºæ ‡ç­¾
     */
    @PreAuthorize("@ss.hasPermi('biz:demoTag:remove')")
    @Log(title = "æ¼”ç¤ºæ ‡ç­¾", businessType = BusinessType.DELETE)
	@DeleteMapping("/{tagIds}")
    public AjaxResult remove(@PathVariable Long[] tagIds)
    {
        return toAjax(bizDemoTagService.deleteBizDemoTagByTagIds(tagIds));
    }
}
