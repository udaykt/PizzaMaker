@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF)
@REM Maven Wrapper startup batch script, version 3.3.2
@REM ----------------------------------------------------------------------------
@IF "%__MVNW_ARG0_NAME__%"=="" (SET "MVN_CMD=mvn.cmd") ELSE (SET "MVN_CMD=%__MVNW_ARG0_NAME__%")

@IF NOT "%MAVEN_PROJECTBASEDIR%"=="" GOTO stripSlash
@SET MAVEN_PROJECTBASEDIR=%~dp0

:stripSlash
@IF "%MAVEN_PROJECTBASEDIR:~-1%"=="\" SET MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%

@SET MAVEN_WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar
@SET MVN_REACHABLE_URL=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar

@IF EXIST "%MAVEN_WRAPPER_JAR%" GOTO runMvnw

@ECHO Downloading Maven Wrapper...
@powershell -Command "Invoke-WebRequest -Uri '%MVN_REACHABLE_URL%' -OutFile '%MAVEN_WRAPPER_JAR%'"

:runMvnw
@SET JAVA_EXECUTABLE=java
@IF NOT "%JAVA_HOME%"=="" SET JAVA_EXECUTABLE="%JAVA_HOME%\bin\java"

@%JAVA_EXECUTABLE% -classpath "%MAVEN_WRAPPER_JAR%" "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" org.apache.maven.wrapper.MavenWrapperMain %*
