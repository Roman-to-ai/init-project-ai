package @@JAVA_PACKAGE_ROOT@@.common.core.validate;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import @@JAVA_PACKAGE_ROOT@@.common.annotation.RuleField;
import @@JAVA_PACKAGE_ROOT@@.common.annotation.RuleValidated;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * {@link RuleValidated} 的实现：把实体上标了 {@link RuleField} 的字段逐个按规则校验。
 *
 * <p>错误会**绑定到具体字段**（`addPropertyNode`），所以接口返回的报错里能看出是哪个字段，
 * 前端也能直接定位到表单项 —— 而不是笼统的一句"参数错误"。
 *
 * <p>一次报**全部**不通过的字段，不是遇到第一个就返回，省得用户改一个提交一次。
 */
public class RuleValidatedValidator implements ConstraintValidator<RuleValidated, Object>
{
    private static final Logger log = LoggerFactory.getLogger(RuleValidatedValidator.class);

    /**
     * 规则来源。**允许为空** —— 项目里没接实现时退化为"不做校验"，
     * 而不是让整个应用起不来或所有请求 500。
     */
    @Autowired(required = false)
    private FieldRuleProvider provider;

    private String table;

    @Override
    public void initialize(RuleValidated annotation)
    {
        this.table = annotation.table();
    }

    @Override
    public boolean isValid(Object bean, ConstraintValidatorContext context)
    {
        if (bean == null || provider == null)
        {
            return true;
        }

        List<String> errors = new ArrayList<>();
        List<String> fields = new ArrayList<>();

        for (Field f : bean.getClass().getDeclaredFields())
        {
            RuleField marker = f.getAnnotation(RuleField.class);
            if (marker == null)
            {
                continue;
            }
            FieldRule rule = provider.getRule(table, marker.column());
            if (rule == null)
            {
                continue;
            }
            Object value;
            try
            {
                f.setAccessible(true);
                value = f.get(bean);
            }
            catch (Exception e)
            {
                // 取不到值就跳过，不因为反射问题把整个请求拦掉
                log.warn("读取字段 {} 失败，跳过校验", f.getName(), e);
                continue;
            }
            // 把 bean 一起传进去 —— 跨字段约束（「结束时间」>「开始时间」）要靠它读同类的其它字段
            String message = rule.validate(value, bean);
            if (message != null)
            {
                // 把字段标签拼进消息 —— 否则用户只看到「不能为空」，不知道说的是哪个字段
                String label = marker.label();
                errors.add((label == null || label.isEmpty() ? f.getName() : label) + message);
                fields.add(f.getName());
            }
        }

        if (errors.isEmpty())
        {
            return true;
        }

        context.disableDefaultConstraintViolation();
        for (int i = 0; i < errors.size(); i++)
        {
            context.buildConstraintViolationWithTemplate(errors.get(i))
                   .addPropertyNode(fields.get(i))
                   .addConstraintViolation();
        }
        return false;
    }
}
