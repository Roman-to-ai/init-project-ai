package @@JAVA_PACKAGE_ROOT@@.common.config.serializer;

import java.io.IOException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.BeanProperty;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.deser.ContextualDeserializer;

/**
 * 布尔字段入站：JSON 布尔 → 存储形状
 * <p>
 * **返回值必须跟字段类型一致**，所以这里实现了 {@link ContextualDeserializer}，在绑定时先问出
 * 目标字段是 {@code String} 还是 {@code Integer}（库里是 {@code char(1)} 还是 {@code tinyint(1)}），
 * 再决定回 {@code "1"/"0"} 还是 {@code 1/0}。写死成 String 的话，挂到 Integer 字段上会直接报错。
 * <p>
 * 兼容面放宽到四种写法（{@code true/false}、{@code "true"/"false"}、{@code "1"/"0"}、{@code 1/0}）。
 */
public class FlagValueJsonDeserializer extends JsonDeserializer<Object> implements ContextualDeserializer
{
    /** 目标字段类型：库里 char(1) → String，tinyint(1) → Integer */
    private Class<?> targetType = String.class;

    @Override
    public JsonDeserializer<?> createContextual(DeserializationContext ctxt, BeanProperty property)
            throws JsonMappingException
    {
        FlagValueJsonDeserializer contextual = new FlagValueJsonDeserializer();
        contextual.targetType = property == null ? String.class : property.getType().getRawClass();
        return contextual;
    }

    @Override
    public Object deserialize(JsonParser p, DeserializationContext ctxt) throws IOException
    {
        String normalized = normalize(p, ctxt);
        if (normalized == null)
        {
            return null;
        }
        if (Integer.class.equals(targetType) || int.class.equals(targetType))
        {
            return "1".equals(normalized) ? Integer.valueOf(1) : Integer.valueOf(0);
        }
        if (Boolean.class.equals(targetType) || boolean.class.equals(targetType))
        {
            return Boolean.valueOf("1".equals(normalized));
        }
        return normalized;
    }

    /**
     * 各种入参写法归一成 {@code "1"} / {@code "0"}；null 与空串回 null（当作「没填」）
     */
    private String normalize(JsonParser p, DeserializationContext ctxt) throws IOException
    {
        JsonToken token = p.currentToken();
        if (token == JsonToken.VALUE_NULL)
        {
            return null;
        }
        if (token == JsonToken.VALUE_TRUE)
        {
            return "1";
        }
        if (token == JsonToken.VALUE_FALSE)
        {
            return "0";
        }
        if (token == JsonToken.VALUE_STRING)
        {
            String text = p.getText().trim();
            if (text.isEmpty())
            {
                return null;
            }
            if ("1".equals(text) || "true".equalsIgnoreCase(text))
            {
                return "1";
            }
            if ("0".equals(text) || "false".equalsIgnoreCase(text))
            {
                return "0";
            }
        }
        else if (token == JsonToken.VALUE_NUMBER_INT)
        {
            if (p.getIntValue() == 1)
            {
                return "1";
            }
            if (p.getIntValue() == 0)
            {
                return "0";
            }
        }
        ctxt.reportInputMismatch(targetType, "布尔字段只接受 true/false（或 1/0），收到：%s", p.getText());
        return null;
    }
}
