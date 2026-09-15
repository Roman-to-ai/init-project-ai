package @@JAVA_PACKAGE_ROOT@@.quartz.util;

import org.quartz.JobExecutionContext;
import @@JAVA_PACKAGE_ROOT@@.quartz.domain.SysJob;

/**
 * 定时任务处理（允许并发执行）
 * 
 */
public class QuartzJobExecution extends AbstractQuartzJob
{
    @Override
    protected void doExecute(JobExecutionContext context, SysJob sysJob) throws Exception
    {
        JobInvokeUtil.invokeMethod(sysJob);
    }
}
