package @@JAVA_PACKAGE_ROOT@@.quartz.util;

import org.quartz.DisallowConcurrentExecution;
import org.quartz.JobExecutionContext;
import @@JAVA_PACKAGE_ROOT@@.quartz.domain.SysJob;

/**
 * 定时任务处理（禁止并发执行）
 * 
 */
@DisallowConcurrentExecution
public class QuartzDisallowConcurrentExecution extends AbstractQuartzJob
{
    @Override
    protected void doExecute(JobExecutionContext context, SysJob sysJob) throws Exception
    {
        JobInvokeUtil.invokeMethod(sysJob);
    }
}
