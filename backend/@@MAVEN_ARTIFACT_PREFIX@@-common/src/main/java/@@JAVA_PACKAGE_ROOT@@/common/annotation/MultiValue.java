package @@JAVA_PACKAGE_ROOT@@.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import com.fasterxml.jackson.annotation.JacksonAnnotationsInside;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import @@JAVA_PACKAGE_ROOT@@.common.config.serializer.MultiValueJsonDeserializer;
import @@JAVA_PACKAGE_ROOT@@.common.config.serializer.MultiValueJsonSerializer;

/**
 * 多值字段（checkbox / 多选 select、treeselect / 图片 / 附件）
 * <p>
 * 线上形状是 JSON 数组，库里存的是逗号分隔串 —— 这一对转换把差异收在 Jackson 边界上，
 * 于是字段仍然是 String：FieldRule 校验、@Excel 导出、find_in_set 查询、Mapper 全都不用动。
 * <p>
 * 由代码生成器按列的多值判据（见 GenTableColumn#isMultiValue）自动挂上；手写代码也可以直接用。
 * <p>
 * ⚠️ 入站侧**同时接受数组与逗号串**，所以后端先上、前端后上是平滑的；反过来会 400。
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@JacksonAnnotationsInside
@JsonSerialize(using = MultiValueJsonSerializer.class, nullsUsing = MultiValueJsonSerializer.class)
@JsonDeserialize(using = MultiValueJsonDeserializer.class)
public @interface MultiValue
{
}
