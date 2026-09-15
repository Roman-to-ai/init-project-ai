package @@JAVA_PACKAGE_ROOT@@.storage.minio;

import io.minio.BucketExistsArgs;
import io.minio.MinioClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import @@JAVA_PACKAGE_ROOT@@.common.storage.FileStorageService;
import @@JAVA_PACKAGE_ROOT@@.common.utils.StringUtils;

/**
 * MinIO 客户端装配。只在 {@code file.storage.type=minio} 时生效。
 *
 * <p><b>刻意不在这里建桶</b> —— 建桶需要管理权限，若由后端来建，后端的凭据就必须是
 * root 级的。桶由 {@code deploy/docker-compose.yml} 里的 {@code minio-init} 一次性容器创建
 * （见 docs/基建/文件存储.md），后端只用一个被授权的普通凭据即可。
 *
 * <p>代价是「桶不存在」要到第一次上传才暴露（报 {@code NoSuchBucket}）。
 * 所以启动时**探测一次**并给出明确日志 —— 探测失败只警告、不阻断启动：
 * 文件存储是旁路能力，不该让 MinIO 抖动导致整个后台起不来。
 */
@Configuration
@ConditionalOnProperty(prefix = FileStorageService.PROP_PREFIX, name = "type",
        havingValue = FileStorageService.TYPE_MINIO)
public class MinioClientConfig
{
    private static final Logger log = LoggerFactory.getLogger(MinioClientConfig.class);

    private final MinioProperties props;

    public MinioClientConfig(MinioProperties props)
    {
        this.props = props;
    }

    @Bean
    public MinioClient minioClient()
    {
        return MinioClient.builder()
                .endpoint(props.getEndpoint())
                .credentials(props.getAccessKey(), props.getSecretKey())
                .build();
    }

    /**
     * 启动时探测一次连通性与桶是否存在。
     *
     * <p>⚠️ 做成 {@link ApplicationRunner} 而不是 {@code @PostConstruct}：
     * 在 {@code @PostConstruct} 里直接调本类上的 {@code minioClient()} 会走 CGLIB 代理，
     * 等于在自身初始化过程中又请求自己，抛
     * {@code Requested bean is currently in creation}（实跑踩过）。
     * ApplicationRunner 在上下文就绪后执行，由容器把 client 传进来，没有这个问题。
     *
     * <p>⚠️ **只警告不抛异常** —— 文件存储是旁路能力，不该让 MinIO 抖动导致整个后台起不来。
     */
    @Bean
    public ApplicationRunner minioProbe(MinioClient client, MinioProperties properties)
    {
        return args -> {
            if (StringUtils.isEmpty(properties.getEndpoint()) || StringUtils.isEmpty(properties.getBucket()))
            {
                log.error("file.storage.type=minio，但 file.storage.minio.endpoint / bucket 没配全 —— "
                        + "上传功能不可用。见 docs/基建/文件存储.md");
                return;
            }
            try
            {
                boolean exists = client.bucketExists(
                        BucketExistsArgs.builder().bucket(properties.getBucket()).build());
                if (exists)
                {
                    log.info("对象存储就绪：{} / 桶 {}", properties.getEndpoint(), properties.getBucket());
                }
                else
                {
                    log.error("对象存储连上了，但桶 {} 不存在 —— 上传会报 NoSuchBucket。"
                            + "通常是 compose 里的 minio-init 没跑成功，"
                            + "用 docker ps -a | grep minio-init 看它的退出码。", properties.getBucket());
                }
            }
            catch (Exception e)
            {
                log.error("连不上对象存储 {}（{}）—— 上传功能不可用，但应用会继续启动。"
                        + "确认 MinIO 在跑、端口没写错（注意 127.0.0.1 与 localhost 的差别）。",
                        properties.getEndpoint(), e.getMessage());
            }
        };
    }
}
