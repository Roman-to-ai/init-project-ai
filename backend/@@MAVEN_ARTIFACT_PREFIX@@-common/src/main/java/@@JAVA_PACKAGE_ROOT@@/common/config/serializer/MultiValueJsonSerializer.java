package @@JAVA_PACKAGE_ROOT@@.common.config.serializer;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

/**
 * 多值字段出站：逗号分隔串 → JSON 数组
 * <p>
 * null 与空串都输出 {@code []} —— 前端的 el-checkbox-group / el-select multiple 要求 v-model 是数组，
 * 给 null 会告警。逐段 trim、丢掉空段，顺带把历史脏数据（{@code '1,'} 这种）洗干净。
 * <p>
 * ⚠️ 字段值为 null 时 Jackson 走的是 nullSerializer 那条路，**不会调用这里的 serialize** ——
 * 所以 {@code @MultiValue} 上的 {@code @JsonSerialize} 必须带 {@code nullsUsing}，
 * 由它把 null 也导到本类的 serialize 上（本方法对 null 入参是安全的）。
 */
public class MultiValueJsonSerializer extends JsonSerializer<String>
{
    @Override
    public void serialize(String value, JsonGenerator gen, SerializerProvider serializers) throws IOException
    {
        gen.writeStartArray();
        for (String item : split(value))
        {
            gen.writeString(item);
        }
        gen.writeEndArray();
    }

    /**
     * 逗号串 → 去空、去空白的列表
     */
    static List<String> split(String value)
    {
        List<String> list = new ArrayList<String>();
        if (value == null)
        {
            return list;
        }
        for (String item : value.split(","))
        {
            String trimmed = item.trim();
            if (!trimmed.isEmpty())
            {
                list.add(trimmed);
            }
        }
        return list;
    }
}
