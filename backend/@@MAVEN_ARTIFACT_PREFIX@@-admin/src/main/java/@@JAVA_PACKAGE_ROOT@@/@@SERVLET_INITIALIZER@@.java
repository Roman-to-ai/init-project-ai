package @@JAVA_PACKAGE_ROOT@@;

import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

/**
 * web容器中进行部署
 */
public class @@SERVLET_INITIALIZER@@ extends SpringBootServletInitializer
{
    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application)
    {
        return application.sources(@@APP_CLASS@@.class);
    }
}
