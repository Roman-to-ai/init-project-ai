package @@JAVA_PACKAGE_ROOT@@;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

/**
 * 启动程序
 */
@SpringBootApplication(exclude = { DataSourceAutoConfiguration.class })
public class @@APP_CLASS@@
{
    public static void main(String[] args)
    {
        // System.setProperty("spring.devtools.restart.enabled", "false");
        SpringApplication.run(@@APP_CLASS@@.class, args);
        System.out.println("\n  启动完成。\n"
                + "  · 改了 Java / XML / 生成器模版文件后，必须重新执行 mvn clean install 再重启本 jar，\n"
                + "    直接重启 jar 不会加载新代码。\n"
                + "  · 工程约定见仓库根目录的 CLAUDE.md。\n");
    }
}
