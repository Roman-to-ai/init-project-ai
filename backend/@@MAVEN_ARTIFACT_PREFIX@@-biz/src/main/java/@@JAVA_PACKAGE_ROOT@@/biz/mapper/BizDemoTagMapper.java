package @@JAVA_PACKAGE_ROOT@@.biz.mapper;

import java.util.List;
import @@JAVA_PACKAGE_ROOT@@.biz.domain.BizDemoTag;

/**
 * æ¼”ç¤ºæ ‡ç­¾Mapper接口
 * 
 * @date 2026-09-15
 */
public interface BizDemoTagMapper 
{
    /**
     * 查询æ¼”ç¤ºæ ‡ç­¾
     * 
     * @param tagId æ¼”ç¤ºæ ‡ç­¾主键
     * @return æ¼”ç¤ºæ ‡ç­¾
     */
    public BizDemoTag selectBizDemoTagByTagId(Long tagId);

    /**
     * 查询æ¼”ç¤ºæ ‡ç­¾列表
     * 
     * @param bizDemoTag æ¼”ç¤ºæ ‡ç­¾
     * @return æ¼”ç¤ºæ ‡ç­¾集合
     */
    public List<BizDemoTag> selectBizDemoTagList(BizDemoTag bizDemoTag);

    /**
     * 新增æ¼”ç¤ºæ ‡ç­¾
     * 
     * @param bizDemoTag æ¼”ç¤ºæ ‡ç­¾
     * @return 结果
     */
    public int insertBizDemoTag(BizDemoTag bizDemoTag);

    /**
     * 修改æ¼”ç¤ºæ ‡ç­¾
     * 
     * @param bizDemoTag æ¼”ç¤ºæ ‡ç­¾
     * @return 结果
     */
    public int updateBizDemoTag(BizDemoTag bizDemoTag);

    /**
     * 删除æ¼”ç¤ºæ ‡ç­¾
     * 
     * @param tagId æ¼”ç¤ºæ ‡ç­¾主键
     * @return 结果
     */
    public int deleteBizDemoTagByTagId(Long tagId);

    /**
     * 批量删除æ¼”ç¤ºæ ‡ç­¾
     * 
     * @param tagIds 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteBizDemoTagByTagIds(Long[] tagIds);
}
