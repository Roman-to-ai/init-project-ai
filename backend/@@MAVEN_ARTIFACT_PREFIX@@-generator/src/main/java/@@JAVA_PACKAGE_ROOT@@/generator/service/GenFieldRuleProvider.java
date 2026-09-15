package @@JAVA_PACKAGE_ROOT@@.generator.service;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import @@JAVA_PACKAGE_ROOT@@.common.core.validate.FieldRule;
import @@JAVA_PACKAGE_ROOT@@.common.core.validate.FieldRuleProvider;
import @@JAVA_PACKAGE_ROOT@@.common.utils.StringUtils;
import @@JAVA_PACKAGE_ROOT@@.generator.domain.GenTableColumn;
import @@JAVA_PACKAGE_ROOT@@.generator.mapper.GenTableColumnMapper;

/**
 * 从 <code>gen_table_column.validation_rule</code> 取校验规则。
 *
 * <p>规则就是生成器的列配置 —— 不在另建运行时表，因为那份数据已经存在，
 * 且前后端本来就该读同一份。将来若要"规则存独立表、与生成器解耦"，
 * 换掉这个实现即可（{@link FieldRuleProvider} 是接口）。
 *
 * <p>带缓存：一条实体保存要校验几十个字段，不缓存就是几十次查库。
 * 规则改动集中在生成器保存配置时，所以在那里 {@link #refresh()} 清缓存，
 * 不用 TTL —— TTL 会让"改了规则等一会儿才生效"变成一个说不清的 bug。
 */
@Component
public class GenFieldRuleProvider implements FieldRuleProvider
{
    private static final Logger log = LoggerFactory.getLogger(GenFieldRuleProvider.class);

    /** (表名.列名) → 规则。Optional 用来缓存"确实没有规则"，避免每次都回查 */
    private final Map<String, Optional<FieldRule>> cache = new ConcurrentHashMap<>();

    @Autowired
    private GenTableColumnMapper genTableColumnMapper;

    @Override
    public FieldRule getRule(String table, String column)
    {
        if (StringUtils.isEmpty(table) || StringUtils.isEmpty(column))
        {
            return null;
        }
        String key = table + "." + column;
        return cache.computeIfAbsent(key, k -> Optional.ofNullable(load(table, column))).orElse(null);
    }

    /** 清缓存。生成器保存配置 / 同步数据库后调用，让规则改动立即生效 */
    public void refresh()
    {
        cache.clear();
    }

    private FieldRule load(String table, String column)
    {
        GenTableColumn c;
        try
        {
            c = genTableColumnMapper.selectRuleByTableAndColumn(table, column);
        }
        catch (Exception e)
        {
            // 查库失败不能让业务请求挂掉 —— 退化成"这条字段不校验"，并留日志
            log.warn("读取 {}.{} 的校验规则失败，本次跳过校验", table, column, e);
            return null;
        }
        if (c == null)
        {
            return null;
        }

        // is_required 是独立的列（生成器界面上那个「必填」勾选框），
        // 规则 JSON 里的 required 若显式写了就以 JSON 为准
        boolean requiredFlag = "1".equals(c.getIsRequired());

        if (StringUtils.isEmpty(c.getValidationRule()))
        {
            return requiredFlag ? requiredOnly() : null;
        }

        try
        {
            JSONObject obj = JSON.parseObject(c.getValidationRule());
            if (obj == null)
            {
                return requiredFlag ? requiredOnly() : null;
            }
            FieldRule rule = obj.toJavaObject(FieldRule.class);
            if (!obj.containsKey("required"))
            {
                rule.setRequired(requiredFlag);
            }
            return rule;
        }
        catch (Exception e)
        {
            log.warn("{}.{} 的 validation_rule 不是合法 JSON，已忽略：{}", table, column, c.getValidationRule(), e);
            return requiredFlag ? requiredOnly() : null;
        }
    }

    private FieldRule requiredOnly()
    {
        FieldRule r = new FieldRule();
        r.setRequired(true);
        return r;
    }
}
