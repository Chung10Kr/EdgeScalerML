import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
import time
import os
from datetime import datetime

# 초기 데이터
timeSchedules = [
    { "min": "01", "count": 291 },
    { "min": "02", "count": 191 },
    { "min": "03", "count": 141 },
    { "min": "04", "count": 151 },
    { "min": "05", "count": 311 },
    { "min": "06", "count": 780 },
    { "min": "07", "count": 1239 },
    { "min": "08", "count": 1926 },
    { "min": "09", "count": 1907 },
    { "min": "10", "count": 1573 },
    { "min": "11", "count": 1433 },
    { "min": "12", "count": 1489 },
    { "min": "13", "count": 1449 },
    { "min": "14", "count": 1470 },
    { "min": "15", "count": 1469 },
    { "min": "16", "count": 1593 },
    { "min": "17", "count": 1757 },
    { "min": "18", "count": 1932 },
    { "min": "19", "count": 1652 },
    { "min": "20", "count": 1299 },
    { "min": "21", "count": 992 },
    { "min": "22", "count": 862 },
    { "min": "23", "count": 659 },
    { "min": "24", "count": 411 }
]

# 모델 학습용 데이터프레임 생성
df = pd.DataFrame(timeSchedules)
df['ServersNeeded'] = [1, 1, 1, 1, 1, 2, 4, 5, 5, 4, 4, 4, 4, 4, 4, 5, 6, 6, 5, 4, 3, 2, 2, 1]

# 선형 회귀 모델 학습
X = df[['count']]
y = df['ServersNeeded']
model = LinearRegression()
model.fit(X, y)

# 서버 예측 함수
def predict_servers_needed(count):
    predicted_servers = model.predict([[count]]).round()[0]
    return predicted_servers

# 매분마다 현재 시간이 1분에서 24분 사이일 때만 실행하는 함수
def run_time_based_prediction_and_scale():
    while True:
        # 현재 분 확인
        current_minute = int(datetime.now().strftime("%M"))

        # 1분에서 24분 사이인지 확인
        if 56 <= current_minute <= 24:
            # 현재 분에 해당하는 요청 수 데이터 가져오기
            current_schedule = timeSchedules[current_minute - 1]  # 리스트는 0부터 시작하므로 -1
            current_request_count = current_schedule["count"]
            predicted_servers = predict_servers_needed(current_request_count)
            
            # 예측 결과 출력 및 파드 조정
            print(f"{current_schedule['min']}분 요청 수: {current_request_count} -> 예상 서버 수: {predicted_servers}")
            os.system(f"kubectl scale deployment my-spring-app --replicas={int(predicted_servers)}")
            print(f"파드 수를 {predicted_servers}로 조정함")
        
        else:
            # 1분에서 24분이 아닌 시간에는 대기 메시지 출력
            print("1분에서 24분이 아닙니다. 대기 중입니다.")
        
        # 1분 대기 후 다시 확인
        time.sleep(60)

# 함수 실행 (중지하려면 수동으로 중지)
run_time_based_prediction_and_scale()