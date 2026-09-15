@echo off
echo.
echo [��Ϣ] ʹ��Jar��������Web���̡�
echo.

cd %~dp0
cd ../@@MAVEN_ARTIFACT_PREFIX@@-admin/target

set JAVA_OPTS=-Xms256m -Xmx1024m -XX:MetaspaceSize=128m -XX:MaxMetaspaceSize=512m

java -jar %JAVA_OPTS% @@MAVEN_ARTIFACT_PREFIX@@-admin.jar

cd bin
pause