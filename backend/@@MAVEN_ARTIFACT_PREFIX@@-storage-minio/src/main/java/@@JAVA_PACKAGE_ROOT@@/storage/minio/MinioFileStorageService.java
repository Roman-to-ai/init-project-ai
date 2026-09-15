package @@JAVA_PACKAGE_ROOT@@.storage.minio;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import @@JAVA_PACKAGE_ROOT@@.common.exception.file.FileNameLengthLimitExceededException;
import @@JAVA_PACKAGE_ROOT@@.common.exception.file.FileSizeLimitExceededException;
import @@JAVA_PACKAGE_ROOT@@.common.exception.file.InvalidExtensionException;
import @@JAVA_PACKAGE_ROOT@@.common.storage.FileStoragePath;
import @@JAVA_PACKAGE_ROOT@@.common.storage.FileStorageService;
import @@JAVA_PACKAGE_ROOT@@.common.storage.local.LocalFileStorageService;
import @@JAVA_PACKAGE_ROOT@@.common.utils.DateUtils;
import @@JAVA_PACKAGE_ROOT@@.common.utils.file.FileUploadUtils;
import @@JAVA_PACKAGE_ROOT@@.common.utils.file.FileUtils;
import @@JAVA_PACKAGE_ROOT@@.common.utils.uuid.IdUtils;
import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.errors.ErrorResponseException;

/**
 * MinIO 对象存储实现。只在 {@code file.storage.type=minio} 时是 bean。
 *
 * ── 对象键与对外路径的对应（前端零改动的支点）──────────────────
 *     对外相对路径（入库/返回前端）  /profile/upload/2026/09/14/x.png
 *     对象键（MinIO 里的）           upload/2026/09/14/x.png
 * 两者由 {@link FileStoragePath} 单点推导，所以**数据库不需要因为切换存储改一个字节**。
 *
 * ── 存量本地文件回退 ────────────────────────────────────────────
 * 切到 MinIO 之后，老项目的历史文件还在本地磁盘上、不在 MinIO 里。
 * 读 / 删时若 MinIO 报 NoSuchKey，就委派给本地实现 —— 否则老图会集体 404。
 *
 * ⚠️ **写永远进 MinIO**，回退只作用于读与删。否则新旧数据会持续分叉，
 *    迁移永远做不完。
 * ⚠️ **回退是过渡手段，不是终态**（见 {@link MinioProperties#isFallbackLocal()}）。
 */
@Component
@ConditionalOnProperty(prefix = FileStorageService.PROP_PREFIX, name = "type",
        havingValue = FileStorageService.TYPE_MINIO)
public class MinioFileStorageService implements FileStorageService
{
    private static final Logger log = LoggerFactory.getLogger(MinioFileStorageService.class);

    private final MinioClient client;

    private final MinioProperties props;

    /**
     * 存量文件的本地回退读。**刻意 new 而不是注入** —— 本地实现的条件注解是
     * {@code type=local}，选 minio 时容器里根本没有它的 bean。同一份代码两个实例，
     * 不存在重复逻辑。
     */
    private final LocalFileStorageService localFallback = new LocalFileStorageService();

    public MinioFileStorageService(MinioClient client, MinioProperties props)
    {
        this.client = client;
        this.props = props;
    }

    @Override
    public String upload(String baseDir, MultipartFile file, String[] allowedExtension, boolean useCustomNaming)
            throws IOException, FileNameLengthLimitExceededException, FileSizeLimitExceededException,
            InvalidExtensionException
    {
        // 与本地实现同一个校收入口 —— 两种存储的校验行为逐字一致，MinIO 这条路绕不过去
        FileUploadUtils.assertUploadable(file, allowedExtension);

        String fileName = useCustomNaming ? FileUploadUtils.uuidFilename(file)
                : FileUploadUtils.extractFilename(file);
        String relative = FileStoragePath.toRelative(baseDir, fileName);
        String key = FileStoragePath.toKey(relative);

        try (InputStream in = file.getInputStream())
        {
            // size 已知 → 单次 PUT，不走分片
            client.putObject(PutObjectArgs.builder()
                    .bucket(props.getBucket())
                    .object(key)
                    .stream(in, file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());
        }
        catch (Exception e)
        {
            throw new IOException("上传到对象存储失败：" + key, e);
        }
        return relative;
    }

    @Override
    public String writeBytes(byte[] data, String baseDir) throws IOException
    {
        // 目录/文件名规则与本地实现保持一致（本地那边写的是同一组静态方法）
        String extension = FileUtils.getFileExtendName(data);
        String fileName = DateUtils.datePath() + "/" + IdUtils.fastUUID() + "." + extension;
        String relative = FileStoragePath.toRelative(baseDir, fileName);
        String key = FileStoragePath.toKey(relative);

        try (InputStream in = new ByteArrayInputStream(data))
        {
            client.putObject(PutObjectArgs.builder()
                    .bucket(props.getBucket())
                    .object(key)
                    .stream(in, data.length, -1)
                    .build());
        }
        catch (Exception e)
        {
            throw new IOException("写入对象存储失败：" + key, e);
        }
        return relative;
    }

    @Override
    public InputStream openStream(String relativePath) throws IOException
    {
        if (!FileStoragePath.managed(relativePath))
        {
            return null;
        }
        String key = FileStoragePath.toKey(relativePath);
        try
        {
            return client.getObject(GetObjectArgs.builder()
                    .bucket(props.getBucket()).object(key).build());
        }
        catch (ErrorResponseException e)
        {
            if (isNoSuchKey(e))
            {
                return fallback(relativePath, () -> localFallback.openStream(relativePath));
            }
            throw new IOException("读取对象存储失败：" + key, e);
        }
        catch (Exception e)
        {
            throw new IOException("读取对象存储失败：" + key, e);
        }
    }

    @Override
    public boolean exists(String relativePath)
    {
        if (!FileStoragePath.managed(relativePath))
        {
            return false;
        }
        if (existsInMinio(relativePath))
        {
            return true;
        }
        return fallback(relativePath, () -> localFallback.exists(relativePath), false);
    }

    @Override
    public boolean delete(String relativePath)
    {
        if (!FileStoragePath.managed(relativePath))
        {
            return false;
        }
        String key = FileStoragePath.toKey(relativePath);

        // ⚠️ 这里必须用**不回退**的 existsInMinio：若用 exists()，
        //    存量本地文件会因为回退而返回 true，于是只对 MinIO 发一次空操作
        //    removeObject（对不存在的 key 也返回成功），本地文件永远删不掉。
        if (existsInMinio(relativePath))
        {
            try
            {
                client.removeObject(RemoveObjectArgs.builder()
                        .bucket(props.getBucket()).object(key).build());
                return true;
            }
            catch (Exception e)
            {
                log.warn("删除对象存储失败：{}（{}）", key, e.getMessage());
                return false;
            }
        }
        // 不在 MinIO 里 —— 可能是还没迁移的存量本地文件
        return fallback(relativePath, () -> localFallback.delete(relativePath), false);
    }

    @Override
    public String type()
    {
        return FileStorageService.TYPE_MINIO;
    }

    /** 只问 MinIO，**不**回退本地。删除逻辑依赖它来区分「在哪边」。 */
    private boolean existsInMinio(String relativePath)
    {
        try
        {
            client.statObject(StatObjectArgs.builder()
                    .bucket(props.getBucket()).object(FileStoragePath.toKey(relativePath)).build());
            return true;
        }
        catch (ErrorResponseException e)
        {
            if (isNoSuchKey(e))
            {
                return false;
            }
            log.warn("statObject 失败：{}（{}）", relativePath, e.getMessage());
            return false;
        }
        catch (Exception e)
        {
            log.warn("statObject 失败：{}（{}）", relativePath, e.getMessage());
            return false;
        }
    }

    /** 判断是不是「对象不存在」。MinIO 用 S3 的 NoSuchKey 表示。 */
    private boolean isNoSuchKey(ErrorResponseException e)
    {
        String code = e.errorResponse() == null ? null : e.errorResponse().code();
        return "NoSuchKey".equals(code) || "NoSuchObject".equals(code)
                || (e.response() != null && e.response().code() == 404);
    }

    /**
     * 回退到本地磁盘。**日志用 debug** —— 一个列表页 20 张老图会命中 20 次，
     * 打到 info 会刷屏，然后所有人把日志关掉，真有问题的告警也一起被淹。
     */
    private <T> T fallback(String relativePath, FallbackSupplier<T> supplier)
    {
        return fallback(relativePath, supplier, null);
    }

    private <T> T fallback(String relativePath, FallbackSupplier<T> supplier, T whenDisabled)
    {
        if (!props.isFallbackLocal())
        {
            return whenDisabled;
        }
        if (log.isDebugEnabled())
        {
            log.debug("对象存储里没有 {}，回退查本地磁盘", relativePath);
        }
        try
        {
            return supplier.get();
        }
        catch (Exception e)
        {
            log.warn("回退读本地磁盘失败：{}（{}）", relativePath, e.getMessage());
            return whenDisabled;
        }
    }

    @FunctionalInterface
    private interface FallbackSupplier<T>
    {
        T get() throws Exception;
    }
}
