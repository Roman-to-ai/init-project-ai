package @@JAVA_PACKAGE_ROOT@@.storage.minio;

import java.io.IOException;
import java.io.InputStream;
import org.apache.commons.io.IOUtils;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import @@JAVA_PACKAGE_ROOT@@.common.constant.Constants;
import @@JAVA_PACKAGE_ROOT@@.common.storage.FileStorageService;
import @@JAVA_PACKAGE_ROOT@@.common.utils.StringUtils;
import @@JAVA_PACKAGE_ROOT@@.common.utils.file.FileUtils;
import jakarta.servlet.http.HttpServletResponse;

/**
 * 对象存储模式下的 {@code /profile/**} —— 从 MinIO 读出来转发给浏览器。
 *
 * ── 为什么要有它，而不是让前端直连 MinIO ────────────────────────
 * 对外 URL 形状在两种存储模式下**必须一致**（都是 {@code /profile/...}），因为：
 *   · 数据库里存的就是这个相对路径，改形状等于全量改数据
 *   · 前端有 5 处拼 {@code VITE_APP_BASE_API} 的逻辑，其中 3 处没有 isExternal 兜底，
 *     拿到绝对 URL 会拼成 {@code /dev-apihttps://minio.../x}
 *   · 预签名 URL 会过期，**根本不能入库**
 *   · /profile/** 的匿名放行与防盗链（RefererFilter）是现成的，改形状就都绕过了
 * 而且 {@code vite.config.ts} 本来就只代理 {@code /dev-api}，
 * 也就是说 /profile/** 的流量**本来就全部经过后端** —— 这里不是新增一跳，
 * 只是把那一跳从「读本地文件」换成「读对象存储」。
 *
 * ⚠️ 与 {@code LocalFileResourcesConfig} **互斥**：两者同时注册时，
 * 本类的 @RequestMapping（order 0）会**静默遮蔽** resource handler
 * （order LOWEST_PRECEDENCE-1）—— 不报错，只是本地文件的
 * ETag / 条件 GET / Range 悄悄失效。所以两边的 @ConditionalOnProperty 必须严格互补。
 */
@RestController
@ConditionalOnProperty(prefix = FileStorageService.PROP_PREFIX, name = "type",
        havingValue = FileStorageService.TYPE_MINIO)
public class MinioProfileController
{
    private final FileStorageService fileStorage;

    public MinioProfileController(FileStorageService fileStorage)
    {
        this.fileStorage = fileStorage;
    }

    /**
     * ⚠️ 用 {@code {*path}} 而不是 {@code **}：后者只匹配、不捕获，拿不到剩余路径。
     * 并且 Spring 6 的 PathPattern 里 {@code {*path}} 捕获到的值**带前导斜杠**
     * （{@code /upload/2026/...}），所以下面直接拼接、不要再补一个 "/"。
     */
    @GetMapping(Constants.RESOURCE_PREFIX + "/{*path}")
    public void get(@PathVariable("path") String path, HttpServletResponse response) throws IOException
    {
        // 纵深防御：Tomcat 已会规范化，但不赌
        if (StringUtils.contains(path, ".."))
        {
            response.setStatus(HttpStatus.BAD_REQUEST.value());
            return;
        }

        String relativePath = Constants.RESOURCE_PREFIX + path;
        try (InputStream in = fileStorage.openStream(relativePath))
        {
            if (in == null)
            {
                response.setStatus(HttpStatus.NOT_FOUND.value());
                return;
            }

            // 镜像本地模式（ResourceHttpRequestHandler）的响应头，
            // 否则切换存储模式后浏览器缓存策略会变，且不容易察觉
            MediaType mediaType = MediaTypeFactory.getMediaType(FileUtils.getName(relativePath))
                    .orElse(MediaType.APPLICATION_OCTET_STREAM);
            response.setContentType(mediaType.toString());
            response.setHeader(HttpHeaders.CACHE_CONTROL, "public, max-age=3600");
            IOUtils.copy(in, response.getOutputStream());
        }
    }
}
