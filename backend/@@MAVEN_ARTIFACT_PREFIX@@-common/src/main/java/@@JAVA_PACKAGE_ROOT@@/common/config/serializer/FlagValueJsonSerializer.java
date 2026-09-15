package @@JAVA_PACKAGE_ROOT@@.common.config.serializer;

import java.io.IOException;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

/**
 * 布尔字段出站：存储形状 → JSON 布尔
 * <p>
 * 库里两种存法都认（这也是为什么转换器写成 {@code Object} 而不是 {@code String}）：
 * <ul>
 *   <li>{@code char(1)} 的 {@code '1'} / {@code '0'} —— 字段是 {@code String}</li>
 *   <li>{@code tinyint(1)} 的 {@code 1} / {@code 0} —— 字段是 {@code Integer}</li>
 * </ul>
 * 真值判定：{@code true}、非 0 的数字、{@code "1"}、{@code "true"}（大小写不敏感）；
 * 其余（含 {@code null}）为假 —— **null 不特殊处理**，由 Jackson 的默认 null 序列化输出 null，
 * 保留「未设置」这个状态（前端 el-switch 拿到 null 就是不动）。
 */
public class FlagValueJsonSerializer extends JsonSerializer<Object>
{
    @Override
    public void serialize(Object value, JsonGenerator gen, SerializerProvider serializers) throws IOException
    {
        gen.writeBoolean(isTrue(value));
    }

    /**
     * 真值判定 —— 兼容两种存储形状与历史脏数据
     */
    static boolean isTrue(Object value)
    {
        if (value == null)
        {
            return false;
        }
        if (value instanceof Boolean)
        {
            return (Boolean) value;
        }
        if (value instanceof Number)
        {
            return ((Number) value).intValue() != 0;
        }
        String text = value.toString().trim();
        return "1".equals(text) || "true".equalsIgnoreCase(text);
    }
}
