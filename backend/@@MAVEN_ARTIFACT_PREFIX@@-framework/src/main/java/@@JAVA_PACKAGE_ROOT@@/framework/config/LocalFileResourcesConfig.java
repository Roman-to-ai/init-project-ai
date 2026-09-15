package @@JAVA_PACKAGE_ROOT@@.framework.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import @@JAVA_PACKAGE_ROOT@@.common.config.@@CONFIG_CLASS@@;
import @@JAVA_PACKAGE_ROOT@@.common.constant.Constants;
import @@JAVA_PACKAGE_ROOT@@.common.storage.FileStorageService;

/**
 * 本地磁盘模式下把 {@code /profile/**} 映射到 {@code @@CONFIG_CLASS@@.getProfile()}。
 *
 * ── ⚠️ 与对象存储模式**互斥**，这是本类存在的主要理由 ──────────────
 * 对象存储模式下，同一个 {@code /profile/**} 由
 * {@code MinioProfileController} 代理读取。两者**绝不能同时注册**：
 *
 *     @RequestMapping 的 order 是 0，resource handler 是 LOWEST_PRECEDENCE - 1，
 *     所以 controller 会**静默赢过** resource handler。
 *
 * 不报错、不打日志 —— 只是本地文件的 ETag / If-Modified-Since / Range
 * 全部悄悄失效（浏览器每次全量重传），排查时几乎不可能想到是这个原因。
 *
 * 所以三处条件必须**严格互补**，且都引用 {@link FileStorageService} 里的常量、
 * 不写字面量：
 *
 *   · 本类                      —— type=local（matchIfMissing，即不配也是本地）
 *   · LocalFileStorageService   —— type=local
 *   · MinioProfileController    —— type=minio
 *
 * {@code matchIfMissing = true} 保证「没配 file.storage.type」时行为与改造前**完全一致**。
 */
@Configuration
@ConditionalOnProperty(prefix = FileStorageService.PROP_PREFIX, name = "type",
        havingValue = FileStorageService.TYPE_LOCAL, matchIfMissing = true)
public class LocalFileResourcesConfig implements WebMvcConfigurer
{
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry)
    {
        registry.addResourceHandler(Constants.RESOURCE_PREFIX + "/**")
                .addResourceLocations("file:" + @@CONFIG_CLASS@@.getProfile() + "/");
    }
}
