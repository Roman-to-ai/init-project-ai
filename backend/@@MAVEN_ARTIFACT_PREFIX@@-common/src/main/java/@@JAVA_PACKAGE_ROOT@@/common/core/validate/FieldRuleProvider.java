package @@JAVA_PACKAGE_ROOT@@.common.core.validate;

/**
 * 规则来源。由具体模块实现并把规则喂给校验器。
 *
 * <p>定义成接口而不是直接读表，是为了让 {@code @@MAVEN_ARTIFACT_PREFIX@@-common} 不依赖任何数据访问层，
 * 也让「规则存哪」可替换 —— 现在读 `gen_table_column`（生成器配置），
 * 将来换成独立的运行时规则表，只要换一个实现。
 */
public interface FieldRuleProvider
{
    /**
     * @param table  数据库表名
     * @param column 数据库列名
     * @return 该列的规则；没配置返回 null（调用方会跳过校验）
     */
    FieldRule getRule(String table, String column);
}
