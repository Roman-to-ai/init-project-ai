package @@JAVA_PACKAGE_ROOT@@.common.core.validate;

import java.math.BigDecimal;
import java.util.regex.Pattern;
import @@JAVA_PACKAGE_ROOT@@.common.utils.StringUtils;

/**
 * 字段校验规则。
 *
 * <p>由 <code>gen_table_column.validation_rule</code>（JSON）反序列化而来，
 * 是**前端表单规则与后端校验的共同来源** —— 规则只写一处，两边都从它派生，
 * 不会出现"前端改了后端没改"。
 *
 * <p>JSON 示例：
 * <pre>
 *   {"required":true,"maxLength":64,"pattern":"^[A-Z0-9-]+$"}
 *   {"min":0,"max":150,"precision":0}          年龄 0~150 的整数
 *   {"min":0,"precision":2}                    金额，不允许负数
 *   {"precision":2}                            金额，允许负数
 *   {"limit":5,"fileSize":5,"fileType":"png,jpg"}  多图（文件类，后端不校验）
 * </pre>
 *
 * <p>不认识键一律忽略 —— 这样前端先支持、后端后支持也不会互相卡住。
 */
public class FieldRule
{
    /** 必填 */
    private boolean required;

    /** 最大长度（字符串） */
    private Integer maxLength;

    /** 正则（字符串），如手机号、邮箱 */
    private String pattern;

    /** 正则不匹配时的提示语 */
    private String patternMessage;

    /** 数值下限 */
    private Integer min;

    /** 数值上限 */
    private Integer max;

    /** 小数位数上限。0 = 只允许整数 */
    private Integer precision;

    /** 是否允许负数。null 视为 true（不额外限制） */
    private Boolean allowNegative;

    // ── 跨字段约束（值是**同类里的 javaField 名**，不是列名）──

    /** 必须大于该字段（如「结束时间」>「开始时间」）。数值与日期都支持 */
    private String gtField;

    /** 必须小于该字段 */
    private String ltField;

    /** 必须等于该字段（如「确认密码」=「密码」） */
    private String eqField;

    /** 必须不等于该字段 */
    private String neField;

    /** 编译后的正则，懒加载（同一条规则会被反复校验） */
    private transient Pattern compiled;

    /**
     * 校验一个值（无跨字段约束时用）。
     *
     * @param value 字段值
     * @return null 表示通过；否则返回给用户看的错误消息
     */
    public String validate(Object value)
    {
        return validate(value, null);
    }

    /**
     * 校验一个值。
     *
     * @param value 字段值
     * @param bean  所在的实体。跨字段约束（gtField 等）要靠它读同类的其它字段；
     *              传 null 时跨字段约束**跳过**（不误报）
     * @return null 表示通过；否则返回给用户看的错误消息
     */
    public String validate(Object value, Object bean)
    {
        boolean blank = isBlank(value);

        if (blank)
        {
            // 必填才拦，非必填直接放行 —— 其余规则对空值没有意义。
            // 跨字段约束也是：对方或自己为空时不比较，否则「留空就报错」很烦人
            return required ? "不能为空" : null;
        }

        String message = validateSelf(value);
        return message != null ? message : validateCrossField(value, bean);
    }

    private String validateSelf(Object value)
    {
        if (value instanceof CharSequence)
        {
            String s = value.toString();
            if (maxLength != null && s.length() > maxLength)
            {
                return "长度不能超过 " + maxLength + " 个字符";
            }
            if (StringUtils.isNotEmpty(pattern) && !pattern().matcher(s).matches())
            {
                return StringUtils.isNotEmpty(patternMessage) ? patternMessage : "格式不正确";
            }
            return null;
        }

        if (value instanceof Number)
        {
            BigDecimal d = toDecimal((Number) value);
            if (!Boolean.TRUE.equals(allowNegative) && d.signum() < 0)
            {
                return "不能为负数";
            }
            if (min != null && d.compareTo(BigDecimal.valueOf(min)) < 0)
            {
                return "不能小于 " + min;
            }
            if (max != null && d.compareTo(BigDecimal.valueOf(max)) > 0)
            {
                return "不能大于 " + max;
            }
            if (precision != null && d.stripTrailingZeros().scale() > precision)
            {
                return precision == 0 ? "必须是整数" : "最多保留 " + precision + " 位小数";
            }
        }
        return null;
    }

    /** 跨字段：与同类里另一个字段比较 */
    private String validateCrossField(Object value, Object bean)
    {
        if (bean == null)
        {
            return null;
        }
        if (StringUtils.isNotEmpty(gtField) || StringUtils.isNotEmpty(ltField))
        {
            String otherField = StringUtils.isNotEmpty(gtField) ? gtField : ltField;
            Object other = readField(bean, otherField);
            if (other == null || isBlank(other))
            {
                // 对方没填就不比较 —— 「对方留空」不该让本字段报错
                return null;
            }
            Integer cmp = compare(value, other);
            if (cmp == null)
            {
                return null;
            }
            if (StringUtils.isNotEmpty(gtField) && cmp <= 0)
            {
                return "必须大于「" + labelOf(bean, otherField) + "」";
            }
            if (StringUtils.isNotEmpty(ltField) && cmp >= 0)
            {
                return "必须小于「" + labelOf(bean, otherField) + "」";
            }
        }
        if (StringUtils.isNotEmpty(eqField))
        {
            Object other = readField(bean, eqField);
            if (other != null && !String.valueOf(value).equals(String.valueOf(other)))
            {
                return "必须与「" + labelOf(bean, eqField) + "」一致";
            }
        }
        if (StringUtils.isNotEmpty(neField))
        {
            Object other = readField(bean, neField);
            if (other != null && String.valueOf(value).equals(String.valueOf(other)))
            {
                return "不能与「" + labelOf(bean, neField) + "」相同";
            }
        }
        return null;
    }

    /**
     * 取同类里另一个字段的**中文标签**，用于拼错误消息。
     *
     * <p>直接从那个字段的 {@link @@JAVA_PACKAGE_ROOT@@.common.annotation.RuleField#label()} 上读 ——
     * 生成器已经把列注释填进去了，所以这里**不需要额外的配置**，
     * 消息能是「必须小于「含税单价」」而不是「必须小于「unitPrice」」。
     */
    private static String labelOf(Object bean, String fieldName)
    {
        try
        {
            java.lang.reflect.Field f = bean.getClass().getDeclaredField(fieldName);
            @@JAVA_PACKAGE_ROOT@@.common.annotation.RuleField marker =
                    f.getAnnotation(@@JAVA_PACKAGE_ROOT@@.common.annotation.RuleField.class);
            if (marker != null && StringUtils.isNotEmpty(marker.label()))
            {
                return marker.label();
            }
        }
        catch (Exception e)
        {
            // 取不到就退回字段名，不影响校验本身
        }
        return fieldName;
    }

    /** 反射读同类字段。读不到返回 null（跳过比较，不误报） */
    private static Object readField(Object bean, String name)
    {
        try
        {
            java.lang.reflect.Field f = bean.getClass().getDeclaredField(name);
            f.setAccessible(true);
            return f.get(bean);
        }
        catch (Exception e)
        {
            return null;
        }
    }

    /** 比较两个值。都是数值或都是日期时返回 Integer.compareTo 的结果；类型不支持返回 null */
    private static Integer compare(Object a, Object b)
    {
        if (a instanceof Number && b instanceof Number)
        {
            return toDecimal((Number) a).compareTo(toDecimal((Number) b));
        }
        if (a instanceof java.util.Date && b instanceof java.util.Date)
        {
            return ((java.util.Date) a).compareTo((java.util.Date) b);
        }
        return null;
    }

    private static boolean isBlank(Object value)
    {
        if (value == null)
        {
            return true;
        }
        return value instanceof CharSequence && value.toString().trim().isEmpty();
    }

    /**
     * Number → BigDecimal，走字符串而不是 new BigDecimal(double)。
     * <p>后者会把 0.1 变成 0.1000000000000000055511151231257827…，小数位判断直接失效。
     */
    private static BigDecimal toDecimal(Number n)
    {
        return n instanceof BigDecimal ? (BigDecimal) n : new BigDecimal(n.toString());
    }

    private Pattern pattern()
    {
        if (compiled == null)
        {
            compiled = Pattern.compile(pattern);
        }
        return compiled;
    }

    // ── getter / setter（反序列化用）──

    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }

    public Integer getMaxLength() { return maxLength; }
    public void setMaxLength(Integer maxLength) { this.maxLength = maxLength; }

    public String getPattern() { return pattern; }
    public void setPattern(String pattern) { this.pattern = pattern; this.compiled = null; }

    public String getPatternMessage() { return patternMessage; }
    public void setPatternMessage(String patternMessage) { this.patternMessage = patternMessage; }

    public Integer getMin() { return min; }
    public void setMin(Integer min) { this.min = min; }

    public Integer getMax() { return max; }
    public void setMax(Integer max) { this.max = max; }

    public Integer getPrecision() { return precision; }
    public void setPrecision(Integer precision) { this.precision = precision; }

    public Boolean getAllowNegative() { return allowNegative; }
    public void setAllowNegative(Boolean allowNegative) { this.allowNegative = allowNegative; }

    public String getGtField() { return gtField; }
    public void setGtField(String gtField) { this.gtField = gtField; }

    public String getLtField() { return ltField; }
    public void setLtField(String ltField) { this.ltField = ltField; }

    public String getEqField() { return eqField; }
    public void setEqField(String eqField) { this.eqField = eqField; }

    public String getNeField() { return neField; }
    public void setNeField(String neField) { this.neField = neField; }
}
