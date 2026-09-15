package @@JAVA_PACKAGE_ROOT@@.common.storage;

import java.io.IOException;
import java.io.InputStream;
import org.springframework.web.multipart.MultipartFile;
import @@JAVA_PACKAGE_ROOT@@.common.exception.file.FileNameLengthLimitExceededException;
import @@JAVA_PACKAGE_ROOT@@.common.exception.file.FileSizeLimitExceededException;
import @@JAVA_PACKAGE_ROOT@@.common.exception.file.InvalidExtensionException;

/**
 * 文件存储抽象 —— 本地磁盘与对象存储（MinIO）可配置切换。
 *
 * ── 返回值语义（所有实现必须完全一致）──────────────────────────
 * 一律返回「相对路径」，以 {@code Constants.RESOURCE_PREFIX} 开头：
 *
 *     /profile/upload/2026/09/14/photo_1.png
 *
 * 这个值可直接入库、可直接返回前端、可直接喂给 delete/openStream/exists。
 *
 * ⚠️ **任何实现都不允许返回 http(s):// 开头的地址。**
 *    前端的 FileUpload / 富文本 Editor / 用户头像三处是无脑拼
 *    {@code VITE_APP_BASE_API} 的，返回绝对地址会拼成
 *    {@code /dev-apihttps://minio.../x} 而彻底坏掉；
 *    而且预签名 URL 会过期，**根本不能存进数据库**。
 *    读全部走 /profile/** 代理——见 docs/基建/文件存储.md。
 *
 * ── baseDir 语义 ────────────────────────────────────────────────
 * 沿用 {@code @@CONFIG_CLASS@@.getUploadPath()} / {@code getAvatarPath()} /
 * {@code getImportPath()} 这组既有取值（形如 {@code <profile>/upload}）。
 * 实现内部负责把它映射成自己的存储键前缀——**这个映射只允许有一处实现**，
 * 见 {@link FileStoragePath}。baseDir 必须落在
 * {@code @@CONFIG_CLASS@@.getProfile()} 之下，否则抛 IllegalArgumentException。
 */
public interface FileStorageService
{
    /** 配置前缀。三处 @ConditionalOnProperty 都引用它，防拼写漂移 */
    String PROP_PREFIX = "file.storage";

    /** 本地磁盘 */
    String TYPE_LOCAL = "local";

    /** 对象存储 */
    String TYPE_MINIO = "minio";

    /**
     * 上传文件。参数顺序与旧的 FileUploadUtils.upload(...) 保持一致，便于逐个调用点对照改写。
     *
     * <p>⚠️ 校验（文件名长度 / 大小 / 后缀白名单）是**接口契约的一部分**，
     * 每个实现都必须先过 {@code FileUploadUtils.assertUploadable} ——
     * 不允许某个实现绕过它。
     *
     * @param baseDir          存储基目录（getUploadPath() / getAvatarPath() / getImportPath()）
     * @param file             上传的文件
     * @param allowedExtension 后缀白名单，null 表示不校验
     * @param useCustomNaming  true = 日期目录 + UUID + 后缀；false = 日期目录 + 原名_序列 + 后缀
     * @return 相对路径（/profile/...）
     * @throws FileNameLengthLimitExceededException 文件名太长
     * @throws FileSizeLimitExceededException        超出 FileUploadUtils.DEFAULT_MAX_SIZE
     * @throws InvalidExtensionException             后缀不在白名单里
     */
    String upload(String baseDir, MultipartFile file, String[] allowedExtension, boolean useCustomNaming)
            throws IOException, FileNameLengthLimitExceededException, FileSizeLimitExceededException,
            InvalidExtensionException;

    /**
     * 写字节到 baseDir 下。Excel 导入时还原图片单元格走这条（见 ExcelUtil）。
     *
     * @return 相对路径（/profile/...）
     */
    String writeBytes(byte[] data, String baseDir) throws IOException;

    /**
     * 按相对路径打开读流。**调用方负责关闭。**
     *
     * 不存在返回 null（而不是抛异常）—— 让调用方能区分「404」和「存储故障」，
     * 也对齐 {@code ImageUtils.readFile} 既有的「出错返回 null 并 log」契约。
     * 路径不受管（如 http:// 外链、Excel 导出的绝对路径）同样返回 null。
     */
    InputStream openStream(String relativePath) throws IOException;

    /** 是否存在。路径不受管返回 false。 */
    boolean exists(String relativePath);

    /** 删除。不存在、路径不受管、删除失败都返回 false。 */
    boolean delete(String relativePath);

    /**
     * 实现标识（{@link #TYPE_LOCAL} / {@link #TYPE_MINIO}），用于日志与诊断。
     */
    String type();
}
