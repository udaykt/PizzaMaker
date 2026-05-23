@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF)
@REM Maven Wrapper startup batch script, version 3.3.2
@REM ----------------------------------------------------------------------------
@IF "%__MVNW_ARG0_NAME__%"=="" (SET "MVN_CMD=mvn.cmd") ELSE (SET "MVN_CMD=%__MVNW_ARG0_NAME__%")
@SET MAVEN_WRAPPER_JAR="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
@SET MAVEN_WRAPPER_PROPERTIES="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties"
@SET MVN_REACHABLE_URL=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar

@IF NOT "%MAVEN_PROJECTBASEDIR%"=="" GOTO init

@SET MAVEN_PROJECTBASEDIR=%~dp0
:init

@IF EXIST "%MAVEN_WRAPPER_JAR%" GOTO runMvnw

@ECHO Downloading Maven Wrapper...
@powershell -Command "Invoke-WebRequest -Uri '%MVN_REACHABLE_URL%' -OutFile '%MAVEN_WRAPPER_JAR%'"

:runMvnw
@SET JAVA_HOME_FOUND=
@IF NOT "%JAVA_HOME%"=="" (
    SET "JAVA_HOME_FOUND=%JAVA_HOME%"
    GOTO execute
)
:execute
@IF NOT "%JAVA_HOME_FOUND%"=="" (
    "%JAVA_HOME_FOUND%\bin\java" -jar "%MAVEN_WRAPPER_JAR%" %* --% -f "%MAVEN_PROJECTBASEDIR%\pom.xml" %*
    GOTO :EOF
)
@java -jar "%MAVEN_WRAPPER_JAR%" --% -f "%MAVEN_PROJECTBASEDIR%\pom.xml" %*
