package @@JAVA_PACKAGE_ROOT@@.web.controller.common;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import @@JAVA_PACKAGE_ROOT@@.common.config.@@CONFIG_CLASS@@;
import @@JAVA_PACKAGE_ROOT@@.common.core.domain.AjaxResult;
import @@JAVA_PACKAGE_ROOT@@.common.storage.FileStorageService;
import @@JAVA_PACKAGE_ROOT@@.common.utils.StringUtils;
import @@JAVA_PACKAGE_ROOT@@.common.utils.file.FileUtils;
import @@JAVA_PACKAGE_ROOT@@.common.utils.file.MimeTypeUtils;
import @@JAVA_PACKAGE_ROOT@@.framework.config.ServerConfig;

/**
 * 通用请求处理
 *
 * <p>上传与资源读取走 {@link FileStorageService}，**存哪儿由
 * {@code file.storage.type} 决定**（本地磁盘 / 对象存储）。
 * 返回给前端的始终是相对路径（{@code /profile/...}），所以前端不需要知道用的是哪种存储。
 */
@RestController
@RequestMapping("/common")
public class CommonController
{
    private static final Logger log = LoggerFactory.getLogger(CommonController.class);

    @Autowired
    private ServerConfig serverConfig;

    @Autowired
    private FileStorageService fileStorage;

    private static final String FILE_DELIMITER = ",";

    /**
     * 通用下载请求
     *
     * <p>⚠️ 读的是 {@code getDownloadPath()} 下的**本地临时文件**（Excel 导出产物，下完即删），
     * 刻意不走 {@link FileStorageService} —— 推进对象存储等于每次导出多两次网络往返、零收益。
     * 代价是**后端多副本时它本来就是坏的**（A 节点写、B 节点下），这是既有问题，
     * 对象存储不修复它。
     *
     * @param fileName 文件名称
     * @param delete 是否删除
     */
    @GetMapping("/download")
    public void fileDownload(String fileName, Boolean delete, HttpServletResponse response, HttpServletRequest request)
    {
        try
        {
            if (!FileUtils.checkAllowDownload(fileName))
            {
                throw new Exception(StringUtils.format("文件名称({})非法，不允许下载。 ", fileName));
            }
            String realFileName = System.currentTimeMillis() + fileName.substring(fileName.indexOf("_") + 1);
            String filePath = @@CONFIG_CLASS@@.getDownloadPath() + fileName;

            response.setContentType(MediaType.APPLICATION_OCTET_STREAM_VALUE);
            FileUtils.setAttachmentResponseHeader(response, realFileName);
            FileUtils.writeBytes(filePath, response.getOutputStream());
            if (delete)
            {
                FileUtils.deleteFile(filePath);
            }
        }
        catch (Exception e)
        {
            log.error("下载文件失败", e);
        }
    }

    /**
     * 通用上传请求（单个）
     */
    @PostMapping("/upload")
    public AjaxResult uploadFile(MultipartFile file) throws Exception
    {
        try
        {
            // 上传文件路径
            String filePath = @@CONFIG_CLASS@@.getUploadPath();
            // 上传并返回新文件名称（相对路径，两种存储模式返回值一致）
            String fileName = fileStorage.upload(filePath, file, MimeTypeUtils.DEFAULT_ALLOWED_EXTENSION, false);
            String url = serverConfig.getUrl() + fileName;
            AjaxResult ajax = AjaxResult.success();
            ajax.put("url", url);
            ajax.put("fileName", fileName);
            ajax.put("newFileName", FileUtils.getName(fileName));
            ajax.put("originalFilename", file.getOriginalFilename());
            return ajax;
        }
        catch (Exception e)
        {
            return AjaxResult.error(e.getMessage());
        }
    }

    /**
     * 通用上传请求（多个）
     */
    @PostMapping("/uploads")
    public AjaxResult uploadFiles(List<MultipartFile> files) throws Exception
    {
        try
        {
            // 上传文件路径
            String filePath = @@CONFIG_CLASS@@.getUploadPath();
            List<String> urls = new ArrayList<String>();
            List<String> fileNames = new ArrayList<String>();
            List<String> newFileNames = new ArrayList<String>();
            List<String> originalFilenames = new ArrayList<String>();
            for (MultipartFile file : files)
            {
                // 上传并返回新文件名称
                String fileName = fileStorage.upload(filePath, file, MimeTypeUtils.DEFAULT_ALLOWED_EXTENSION, false);
                String url = serverConfig.getUrl() + fileName;
                urls.add(url);
                fileNames.add(fileName);
                newFileNames.add(FileUtils.getName(fileName));
                originalFilenames.add(file.getOriginalFilename());
            }
            AjaxResult ajax = AjaxResult.success();
            ajax.put("urls", StringUtils.join(urls, FILE_DELIMITER));
            ajax.put("fileNames", StringUtils.join(fileNames, FILE_DELIMITER));
            ajax.put("newFileNames", StringUtils.join(newFileNames, FILE_DELIMITER));
            ajax.put("originalFilenames", StringUtils.join(originalFilenames, FILE_DELIMITER));
            return ajax;
        }
        catch (Exception e)
        {
            return AjaxResult.error(e.getMessage());
        }
    }

    /**
     * 资源通用下载
     *
     * <p>入参是**受管的相对路径**（{@code /profile/...}），所以两种存储模式都对；
     * 对象存储模式下且对象不存在时，会回退读本地磁盘上的存量文件。
     */
    @GetMapping("/download/resource")
    public void resourceDownload(String resource, HttpServletRequest request, HttpServletResponse response)
            throws Exception
    {
        if (!FileUtils.checkAllowDownload(resource))
        {
            throw new Exception(StringUtils.format("资源文件({})非法，不允许下载。 ", resource));
        }
        // 下载名称
        String downloadName = FileUtils.getName(resource);
        response.setContentType(MediaType.APPLICATION_OCTET_STREAM_VALUE);
        FileUtils.setAttachmentResponseHeader(response, downloadName);

        try (InputStream in = fileStorage.openStream(resource))
        {
            if (in == null)
            {
                response.setStatus(HttpStatus.NOT_FOUND.value());
                return;
            }
            IOUtils.copy(in, response.getOutputStream());
        }
        catch (Exception e)
        {
            log.error("下载文件失败", e);
        }
    }
}
