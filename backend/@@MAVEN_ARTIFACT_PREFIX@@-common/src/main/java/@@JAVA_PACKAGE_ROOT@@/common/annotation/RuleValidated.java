package @@JAVA_PACKAGE_ROOT@@.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * 类级校验：按配置的规则校验这个实体上所有标了 {@link RuleField} 的字段。
 *
 * <p>为什么用规则而不是把注解写死在字段上：规则是**前端和后端共同读的那一份**，
 * 改规则不用重新生成代码、不用重新编译。写死注解的话前后端就是两份，
 * 而且像「年龄 0~150」这种业务约束也没法用 &#64;Min/&#64;Max 表达清楚。
 *
 * <p>规则来源由 {@code FieldRuleProvider} 提供（见 @@MAVEN_ARTIFACT_PREFIX@@-generator 的实现，
 * 读 gen_table_column.validation_rule）。**没接实现时不校验**，不会阻断应用启动。
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Constraint(validatedBy = @@JAVA_PACKAGE_ROOT@@.common.core.validate.RuleValidatedValidator.class)
public @interface RuleValidated
{
    /** 数据库表名 */
    String table();

    String message() default "字段校验未通过";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
