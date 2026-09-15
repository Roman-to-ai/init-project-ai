package @@JAVA_PACKAGE_ROOT@@.common.utils.file;

import java.util.Objects;
import org.apache.commons.io.FilenameUtils;
import org.springframework.web.multipart.MultipartFile;
import @@JAVA_PACKAGE_ROOT@@.common.exception.file.FileNameLengthLimitExceededException;
import @@JAVA_PACKAGE_ROOT@@.common.exception.file.FileSizeLimitExceededException;
import @@JAVA_PACKAGE_ROOT@@.common.exception.file.InvalidExtensionException;
import @@JAVA_PACKAGE_ROOT@@.common.utils.DateUtils;
import @@JAVA_PACKAGE_ROOT@@.common.utils.StringUtils;
import @@JAVA_PACKAGE_ROOT@@.common.utils.uuid.IdUtils;
import @@JAVA_PACKAGE_ROOT@@.common.utils.uuid.Seq;

/**
 * 文件上传的**校验与命名** —— 与存储方式无关的那一半。
 *
 * <p>落盘与路径拼接已经搬去 {@code @@JAVA_PACKAGE_ROOT@@.common.storage} 下的
 * {@code FileStorageService} 实现（本地磁盘 / 对象存储），
 * 这里只留两种实现**共用**的部分，保证它们的行为逐字一致：
 *
 * <ul>
 *   <li>{@link #assertUploadable} —— 服务端上传校验的唯一入口</li>
 *   <li>{@link #extractFilename} / {@link #uuidFilename} —— 文件名与目录规则</li>
 *   <li>{@link #getExtension} —— 后缀提取</li>
 * </ul>
 *
 * <p>⚠️ 这里**没有**任何 {@code profile} / 磁盘路径的假设 —— 一旦有，
 * 对象存储那条路就会跟着一起歪。
 *
 * @see @@JAVA_PACKAGE_ROOT@@.common.storage.FileStorageService
 */
public class FileUploadUtils
{
    /**
     * 默认大小 50M
     *
     * <p>⚠️ 注意还有**更早**的一道闸门：{@code spring.servlet.multipart.max-file-size}
     * （application.yml，默认 10MB）——它在进入 Controller 之前就把请求拦了。
     * 排障时先确认是哪一道拦的（报错信息不同）。
     */
    public static final long DEFAULT_MAX_SIZE = 50 * 1024 * 1024L;

    /**
     * 默认的文件名最大长度 100
     */
    public static final int DEFAULT_FILE_NAME_LENGTH = 100;

    /**
     * 上传前的服务端校验 —— **两种存储实现都必须先过这一关**。
     *
     * <p>把「文件名长度 + 大小 + 后缀白名单」收在一个方法里，是为了避免
     * 某个实现漏掉其中一项。这也补上了框架原本缺失的服务端校验
     * （生成的 CRUD 后端零校验，绕过前端直接打接口就能写脏数据）。
     *
     * @throws FileNameLengthLimitExceededException 文件名太长
     * @throws FileSizeLimitExceededException        超出 {@link #DEFAULT_MAX_SIZE}
     * @throws InvalidExtensionException             后缀不在白名单里
     */
    public static final void assertUploadable(MultipartFile file, String[] allowedExtension)
            throws FileNameLengthLimitExceededException, FileSizeLimitExceededException,
            InvalidExtensionException
    {
        int fileNameLength = Objects.requireNonNull(file.getOriginalFilename()).length();
        if (fileNameLength > DEFAULT_FILE_NAME_LENGTH)
        {
            throw new FileNameLengthLimitExceededException(DEFAULT_FILE_NAME_LENGTH);
        }
        assertAllowed(file, allowedExtension);
    }

    /**
     * 编码文件名(日期格式目录 + 原文件名 + 序列值 + 后缀)
     */
    public static final String extractFilename(MultipartFile file)
    {
        return StringUtils.format("{}/{}_{}.{}", DateUtils.datePath(), FilenameUtils.getBaseName(file.getOriginalFilename()), Seq.getId(Seq.uploadSeqType), getExtension(file));
    }

    /**
     * 编编码文件名(日期格式目录 + UUID + 后缀)
     */
    public static final String uuidFilename(MultipartFile file)
    {
        return StringUtils.format("{}/{}.{}", DateUtils.datePath(), IdUtils.fastSimpleUUID(), getExtension(file));
    }

    /**
     * 文件大小校验
     *
     * @param file 上传的文件
     * @throws FileSizeLimitExceededException 如果超出最大大小
     * @throws InvalidExtensionException
     */
    public static final void assertAllowed(MultipartFile file, String[] allowedExtension)
            throws FileSizeLimitExceededException, InvalidExtensionException
    {
        long size = file.getSize();
        if (size > DEFAULT_MAX_SIZE)
        {
            throw new FileSizeLimitExceededException(DEFAULT_MAX_SIZE / 1024 / 1024);
        }

        String fileName = file.getOriginalFilename();
        String extension = getExtension(file);
        if (allowedExtension != null && !isAllowedExtension(extension, allowedExtension))
        {
            if (allowedExtension == MimeTypeUtils.IMAGE_EXTENSION)
            {
                throw new InvalidExtensionException.InvalidImageExtensionException(allowedExtension, extension,
                        fileName);
            }
            else if (allowedExtension == MimeTypeUtils.FLASH_EXTENSION)
            {
                throw new InvalidExtensionException.InvalidFlashExtensionException(allowedExtension, extension,
                        fileName);
            }
            else if (allowedExtension == MimeTypeUtils.MEDIA_EXTENSION)
            {
                throw new InvalidExtensionException.InvalidMediaExtensionException(allowedExtension, extension,
                        fileName);
            }
            else if (allowedExtension == MimeTypeUtils.VIDEO_EXTENSION)
            {
                throw new InvalidExtensionException.InvalidVideoExtensionException(allowedExtension, extension,
                        fileName);
            }
            else
            {
                throw new InvalidExtensionException(allowedExtension, extension, fileName);
            }
        }
    }

    /**
     * 判断MIME类型是否是允许的MIME类型
     *
     * @param extension
     * @param allowedExtension
     * @return
     */
    public static final boolean isAllowedExtension(String extension, String[] allowedExtension)
    {
        for (String str : allowedExtension)
        {
            if (str.equalsIgnoreCase(extension))
            {
                return true;
            }
        }
        return false;
    }

    /**
     * 获取文件名的后缀
     *
     * @param file 表单文件
     * @return 后缀名
     */
    public static final String getExtension(MultipartFile file)
    {
        String extension = FilenameUtils.getExtension(file.getOriginalFilename());
        if (StringUtils.isEmpty(extension))
        {
            extension = MimeTypeUtils.getExtension(Objects.requireNonNull(file.getContentType()));
        }
        return extension;
    }
}
