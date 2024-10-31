FROM --platform=linux/amd64 openjdk:17-jdk-alpine
ARG JAR_FILE=demo-0.0.1-SNAPSHOT.jar
COPY ${JAR_FILE} app.jar
# 컨테이너가 사용하는 포트 노출
EXPOSE 1111
ENTRYPOINT ["java", "-jar", "/app.jar"]