package @@JAVA_PACKAGE_ROOT@@.common.storage.local;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import @@JAVA_PACKAGE_ROOT@@.common.exception.file.FileNameLengthLimitExceededException;
import @@JAVA_PACKAGE_ROOT@@.common.exception.file.FileSizeLimitExceededException;
import @@JAVA_PACKAGE_ROOT@@.common.exception.file.InvalidExtensionException;
import @@JAVA_PACKAGE_ROOT@@.common.storage.FileStoragePath;
import @@JAVA_PACKAGE_ROOT@@.common.storage.FileStorageService;
import @@JAVA_PACKAGE_ROOT@@.common.utils.DateUtils;
import @@JAVA_PACKAGE_ROOT@@.common.utils.file.FileUploadUtils;
import @@JAVA_PACKAGE_ROOT@@.common.utils.file.FileUtils;
import @@JAVA_PACKAGE_ROOT@@.common.utils.uuid.IdUtils;

/**
 * 本地磁盘存储 —— 写到 {@code @@CONFIG_CLASS@@.getProfile()} 之下，
 * 由 {@code LocalFileResourcesConfig} 把 /profile/** 映射出去。
 *
 * <p>⚠️ **刻意无依赖、可手工 new**：对象存储实现要在「MinIO 里没有这个对象」时
 * 回退到本地读，而本类在 {@code type=minio} 时**不是 Spring bean**
 * （见类上的条件注解），注入不进来。同一份代码两个实例，不存在重复逻辑。
 *
 * @see FileStoragePath 路径映射的唯一实现
 */
@Component
@ConditionalOnProperty(prefix = FileStorageService.PROP_PREFIX, name = "type",
        havingValue = FileStorageService.TYPE_LOCAL, matchIfMissing = true)
public class LocalFileStorageService implements FileStorageService
{
    @Override
    public String upload(String baseDir, MultipartFile file, String[] allowedExtension, boolean useCustomNaming)
            throws IOException, FileNameLengthLimitExceededException, FileSizeLimitExceededException,
            InvalidExtensionException
    {
        // 校验收口在 FileUploadUtils，两种存储实现共用，行为逐字一致
        FileUploadUtils.assertUploadable(file, allowedExtension);

        String fileName = useCustomNaming ? FileUploadUtils.uuidFilename(file)
                : FileUploadUtils.extractFilename(file);
        String relative = FileStoragePath.toRelative(baseDir, fileName);

        File dest = new File(FileStoragePath.toLocalPath(relative));
        if (!dest.getParentFile().exists())
        {
            dest.getParentFile().mkdirs();
        }
        file.transferTo(dest.toPath());
        return relative;
    }

    @Override
    public String writeBytes(byte[] data, String baseDir) throws IOException
    {
        String fileName = DateUtils.datePath() + "/" + IdUtils.fastUUID() + "." + FileUtils.getFileExtendName(data);
        String relative = FileStoragePath.toRelative(baseDir, fileName);

        File dest = new File(FileStoragePath.toLocalPath(relative));
        if (!dest.getParentFile().exists())
        {
            dest.getParentFile().mkdirs();
        }
        try (FileOutputStream fos = new FileOutputStream(dest))
        {
            fos.write(data);
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
        File f = new File(FileStoragePath.toLocalPath(relativePath));
        return f.isFile() ? new FileInputStream(f) : null;
    }

    @Override
    public boolean exists(String relativePath)
    {
        if (!FileStoragePath.managed(relativePath))
        {
            return false;
        }
        return new File(FileStoragePath.toLocalPath(relativePath)).isFile();
    }

    @Override
    public boolean delete(String relativePath)
    {
        if (!FileStoragePath.managed(relativePath))
        {
            return false;
        }
        return FileUtils.deleteFile(FileStoragePath.toLocalPath(relativePath));
    }

    @Override
    public String type()
    {
        return FileStorageService.TYPE_LOCAL;
    }
}
