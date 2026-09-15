package @@JAVA_PACKAGE_ROOT@@.generator.mapper;

import java.util.List;
import org.apache.ibatis.annotations.Param;
import @@JAVA_PACKAGE_ROOT@@.generator.domain.GenTableColumn;

/**
 * 业务字段 数据层
 */
public interface GenTableColumnMapper
{
    /**
     * 按「表名 + 列名」查询该列的校验规则。
     *
     * <p>供运行时的 {@code GenFieldRuleProvider} 使用 —— 注意这是**按表名列名**查，
     * 不是按 table_id 查：运行时拿到的是实体上的表名/列名字符串，没有 table_id。
     *
     * @param tableName  表名
     * @param columnName 列名
     * @return 只填了 columnName / validationRule / isRequired 的对象；查不到返回 null
     */
    public GenTableColumn selectRuleByTableAndColumn(@Param("tableName") String tableName,
                                                     @Param("columnName") String columnName);

    /**
     * 根据表名称查询列信息
     *
     * @param tableName 表名称
     * @return 列信息
     */
    public List<GenTableColumn> selectDbTableColumnsByName(String tableName);

    /**
     * 查询业务字段列表
     * 
     * @param tableId 业务字段编号
     * @return 业务字段集合
     */
    public List<GenTableColumn> selectGenTableColumnListByTableId(Long tableId);

    /**
     * 新增业务字段
     * 
     * @param genTableColumn 业务字段信息
     * @return 结果
     */
    public int insertGenTableColumn(GenTableColumn genTableColumn);

    /**
     * 修改业务字段
     * 
     * @param genTableColumn 业务字段信息
     * @return 结果
     */
    public int updateGenTableColumn(GenTableColumn genTableColumn);

    /**
     * 删除业务字段
     * 
     * @param genTableColumns 列数据
     * @return 结果
     */
    public int deleteGenTableColumns(List<GenTableColumn> genTableColumns);

    /**
     * 批量删除业务字段
     * 
     * @param ids 需要删除的数据ID
     * @return 结果
     */
    public int deleteGenTableColumnByIds(Long[] ids);
}
