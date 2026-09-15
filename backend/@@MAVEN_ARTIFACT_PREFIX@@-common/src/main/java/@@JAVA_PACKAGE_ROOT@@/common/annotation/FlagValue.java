package @@JAVA_PACKAGE_ROOT@@.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import com.fasterxml.jackson.annotation.JacksonAnnotationsInside;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import @@JAVA_PACKAGE_ROOT@@.common.config.serializer.FlagValueJsonDeserializer;
import @@JAVA_PACKAGE_ROOT@@.common.config.serializer.FlagValueJsonSerializer;

/**
 * 布尔（开关）字段
 * <p>
 * 线上形状是 JSON 布尔，库里存的是 char(1) 的 {@code '1'} / {@code '0'} —— 转换收在 Jackson 边界上，
 * 字段仍然是 String，于是 @Excel 的 readConverterExp（按 {@code 0=否 1=是} 写的）、字段校验、
 * 列同步全都不用动。若把字段改成 Boolean，导出会退化成 {@code true/false}。
 * <p>
 * 由代码生成器按 htmlType=switch 自动挂上；手写代码也可以直接用。
 * <p>
 * ⚠️ 查询条件不走 Jackson（GET 走 WebDataBinder，{@code ?x=true} 会绑成字符串 {@code "true"}），
 * 所以生成器的 Mapper 里对这类列另有一段 choose 把 true/false 翻成 '1'/'0'。
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@JacksonAnnotationsInside
@JsonSerialize(using = FlagValueJsonSerializer.class)
@JsonDeserialize(using = FlagValueJsonDeserializer.class)
public @interface FlagValue
{
}
