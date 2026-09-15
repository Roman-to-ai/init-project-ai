package @@JAVA_PACKAGE_ROOT@@.common.config.serializer;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

/**
 * 多值字段入站：JSON 数组 → 逗号分隔串
 * <p>
 * 同时接受数组与逗号串（兼容老前端与手写调用），两种都逐段 trim、丢空段后重新拼接。
 * <p>
 * {@code []} 归一成**空串而不是 null**：Mapper 的 {@code <if test="tags != null">} 还得能看见
 * 「清空」这个动作，归成 null 会让清空在 UPDATE 时被静默丢弃。空串同时让 FieldRule 的
 * required 照常拦得住（空串是空白串）。
 */
public class MultiValueJsonDeserializer extends JsonDeserializer<String>
{
    @Override
    public String deserialize(JsonParser p, DeserializationContext ctxt) throws IOException
    {
        JsonToken token = p.currentToken();
        if (token == JsonToken.VALUE_NULL)
        {
            return null;
        }
        if (token == JsonToken.START_ARRAY)
        {
            List<String> items = new ArrayList<String>();
            while (p.nextToken() != JsonToken.END_ARRAY)
            {
                if (!p.currentToken().isScalarValue())
                {
                    return (String) ctxt.handleUnexpectedToken(String.class, p);
                }
                // 数字与布尔也按字面量收（"1"、"true"），与字典值一致
                String item = p.getValueAsString();
                if (item != null && !item.trim().isEmpty())
                {
                    items.add(item.trim());
                }
            }
            return String.join(",", items);
        }
        if (token == JsonToken.VALUE_STRING)
        {
            return String.join(",", MultiValueJsonSerializer.split(p.getText()));
        }
        return (String) ctxt.handleUnexpectedToken(String.class, p);
    }
}
