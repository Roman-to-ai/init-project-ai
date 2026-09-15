package @@JAVA_PACKAGE_ROOT@@.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 标记「这个字段的校验规则在配置里」，本身不做任何校验。
 *
 * <p>要配合类上的 {@link RuleValidated} 使用 —— 表名在类上写一次，
 * 字段上只写列名，避免每个字段重复一遍表名。
 *
 * <pre>
 *   &#64;RuleValidated(table = "biz_demo_product")
 *   public class BizDemoProduct extends BaseEntity {
 *       &#64;RuleField(column = "product_code")
 *       private String productCode;
 *   }
 * </pre>
 *
 * <p>只有**确实配了规则**的字段才需要这个注解；没配的字段不加，
 * 校验器查不到规则就直接跳过，行为与不加完全一致。
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface RuleField
{
    /** 数据库列名。用它去查该列的 validation_rule */
    String column();

    /**
     * 字段的中文标签，用于拼错误消息（如「产品编码不能为空」）。
     * <p>由生成器从列注释填入。不填则退回用列名，消息会难看但不会错。
     */
    String label() default "";
}
