#!/bin/bash

# 로그 파일 초기화
LOG_FILE="hpa_replicas_log.txt"
echo "Timestamp,Replicas" > $LOG_FILE

# 무한 루프를 사용하여 계속해서 HPA 상태 기록
while true
do
  # 현재 시간과 HPA 상태의 REPLICAS 값 추출
  TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
  REPLICAS=$(k3s kubectl get hpa my-spring-hpa -o jsonpath='{.status.currentReplicas}')
  
  # 로그 파일에 기록
  echo "$TIMESTAMP,$REPLICAS" >> $LOG_FILE
  
  # 1분 대기
  sleep 60
done