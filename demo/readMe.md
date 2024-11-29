./gradlew clean build
docker build -t my-spring-app-k3s .
docker tag my-spring-app-k3s chung10/my-spring-app-k3s:latest
docker push chung10/my-spring-app-k3s:latest