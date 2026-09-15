package @@JAVA_PACKAGE_ROOT@@.storage.minio;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import @@JAVA_PACKAGE_ROOT@@.common.storage.FileStorageService;

/**
 * MinIO 连接配置。对应 application.yml 的 {@code file.storage.minio.*}。
 *
 * <p>只在 {@code file.storage.type=minio} 时才是 bean —— 与
 * {@link MinioFileStorageService}、{@link MinioClientConfig} 条件一致。
 */
@Component
@ConditionalOnProperty(prefix = FileStorageService.PROP_PREFIX, name = "type",
        havingValue = FileStorageService.TYPE_MINIO)
@ConfigurationProperties(prefix = FileStorageService.PROP_PREFIX + ".minio")
public class MinioProperties
{
    /** 服务地址，如 http://127.0.0.1:9002。⚠️ 用 127.0.0.1 而不是 localhost，见 README */
    private String endpoint;

    /** 桶名。默认是「项目标识-files」——桶是**项目之间的隔离边界**，别两个项目共用一个 */
    private String bucket;

    private String accessKey;

    private String secretKey;

    /**
     * 读/删 MinIO 对象失败（NoSuchKey）时，回退到本地磁盘。
     *
     * <p>⚠️ **这是过渡手段，不是终态。** 它让切到 MinIO 之后老图立刻还能看，
     * 但也正因为能看，很容易没人去迁移。等换机器 / 清理 uploadPath / 后端容器化
     * （本地目录不挂载）时，老图会集体 404，而那时已经没人记得曾经有过本地文件。
     *
     * <p>迁移完成后请改 false。迁移命令见 docs/基建/文件存储.md。
     */
    private boolean fallbackLocal = true;

    public String getEndpoint()
    {
        return endpoint;
    }

    public void setEndpoint(String endpoint)
    {
        this.endpoint = endpoint;
    }

    public String getBucket()
    {
        return bucket;
    }

    public void setBucket(String bucket)
    {
        this.bucket = bucket;
    }

    public String getAccessKey()
    {
        return accessKey;
    }

    public void setAccessKey(String accessKey)
    {
        this.accessKey = accessKey;
    }

    public String getSecretKey()
    {
        return secretKey;
    }

    public void setSecretKey(String secretKey)
    {
        this.secretKey = secretKey;
    }

    public boolean isFallbackLocal()
    {
        return fallbackLocal;
    }

    public void setFallbackLocal(boolean fallbackLocal)
    {
        this.fallbackLocal = fallbackLocal;
    }
}
