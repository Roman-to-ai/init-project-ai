package @@JAVA_PACKAGE_ROOT@@.biz.service.impl;

import java.util.List;
import @@JAVA_PACKAGE_ROOT@@.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import @@JAVA_PACKAGE_ROOT@@.biz.mapper.BizDemoTagMapper;
import @@JAVA_PACKAGE_ROOT@@.biz.domain.BizDemoTag;
import @@JAVA_PACKAGE_ROOT@@.biz.service.IBizDemoTagService;

/**
 * æ¼”ç¤ºæ ‡ç­¾Service业务层处理
 * 
 * @date 2026-09-15
 */
@Service
public class BizDemoTagServiceImpl implements IBizDemoTagService 
{
    @Autowired
    private BizDemoTagMapper bizDemoTagMapper;

    /**
     * 查询æ¼”ç¤ºæ ‡ç­¾
     * 
     * @param tagId æ¼”ç¤ºæ ‡ç­¾主键
     * @return æ¼”ç¤ºæ ‡ç­¾
     */
    @Override
    public BizDemoTag selectBizDemoTagByTagId(Long tagId)
    {
        return bizDemoTagMapper.selectBizDemoTagByTagId(tagId);
    }

    /**
     * 查询æ¼”ç¤ºæ ‡ç­¾列表
     * 
     * @param bizDemoTag æ¼”ç¤ºæ ‡ç­¾
     * @return æ¼”ç¤ºæ ‡ç­¾
     */
    @Override
    public List<BizDemoTag> selectBizDemoTagList(BizDemoTag bizDemoTag)
    {
        return bizDemoTagMapper.selectBizDemoTagList(bizDemoTag);
    }

    /**
     * 新增æ¼”ç¤ºæ ‡ç­¾
     * 
     * @param bizDemoTag æ¼”ç¤ºæ ‡ç­¾
     * @return 结果
     */
    @Override
    public int insertBizDemoTag(BizDemoTag bizDemoTag)
    {
        bizDemoTag.setCreateTime(DateUtils.getNowDate());
        return bizDemoTagMapper.insertBizDemoTag(bizDemoTag);
    }

    /**
     * 修改æ¼”ç¤ºæ ‡ç­¾
     * 
     * @param bizDemoTag æ¼”ç¤ºæ ‡ç­¾
     * @return 结果
     */
    @Override
    public int updateBizDemoTag(BizDemoTag bizDemoTag)
    {
        bizDemoTag.setUpdateTime(DateUtils.getNowDate());
        return bizDemoTagMapper.updateBizDemoTag(bizDemoTag);
    }

    /**
     * 批量删除æ¼”ç¤ºæ ‡ç­¾
     * 
     * @param tagIds 需要删除的æ¼”ç¤ºæ ‡ç­¾主键
     * @return 结果
     */
    @Override
    public int deleteBizDemoTagByTagIds(Long[] tagIds)
    {
        return bizDemoTagMapper.deleteBizDemoTagByTagIds(tagIds);
    }

    /**
     * 删除æ¼”ç¤ºæ ‡ç­¾信息
     * 
     * @param tagId æ¼”ç¤ºæ ‡ç­¾主键
     * @return 结果
     */
    @Override
    public int deleteBizDemoTagByTagId(Long tagId)
    {
        return bizDemoTagMapper.deleteBizDemoTagByTagId(tagId);
    }
}
