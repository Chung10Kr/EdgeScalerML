import pandas as pd
import numpy as np
import os
import time  # 추가
#import matplotlib.pyplot as plt
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression

# 주어진 데이터
data = {
    "12m 4d": [7, 2, 0, 1, 9, 33, 58, 95, 93, 72, 67, 66, 67, 72, 72, 74, 85, 100, 88, 58, 44, 34, 22, 13],
    "12m 5d": [7, 3, 0, 2, 10, 35, 60, 94, 96, 74, 68, 70, 69, 72, 73, 78, 84, 100, 91, 60, 48, 34, 23, 13],
    "12m 6d": [7, 2, 0, 1, 9, 33, 58, 95, 93, 72, 67, 66, 67, 72, 72, 74, 85, 100, 88, 58, 44, 34, 22, 13],
    "12m 7d": [9, 3, 0, 1, 10, 36, 62, 100, 99, 80, 73, 76, 74, 75, 75, 82, 91, 100, 85, 65, 48, 41, 29, 16],
    "12m 8d": [9, 5, 0, 2, 10, 34, 59, 91, 91, 74, 69, 70, 73, 72, 75, 81, 91, 100, 88, 60, 51, 40, 29, 19]
}

# 데이터프레임으로 변환
df = pd.DataFrame(data)
df["hour"] = list(range(24))  # 시간 추가
df = df.melt(id_vars=["hour"], var_name="date", value_name="vehicle_count")  # long format으로 변환

# 다항식 특성 생성
poly = PolynomialFeatures(degree=12, include_bias=False)  # 다항식 차수 6으로 조정
X = poly.fit_transform(df[["hour"]])  # 모든 데이터를 학습에 사용
y = df["vehicle_count"]

# 모델 학습
model = LinearRegression()
model.fit(X, y)

# 예측값 추가
df["predicted_count"] = model.predict(X)

# 시각화 (시간별 산점도 + 회귀 예측)
#plt.figure(figsize=(12, 8))
#plt.scatter(df["hour"], df["vehicle_count"], color="blue", label="Actual Data", alpha=0.6)

# 예측 곡선
#hour_range = np.linspace(0, 23, 100).reshape(-1, 1)
#hour_poly = poly.transform(hour_range)
#predicted_values = model.predict(hour_poly)
#plt.plot(hour_range, predicted_values, color="red", linewidth=2, label="Regression Line")

#plt.xlabel("Hour")
#plt.ylabel("Vehicle Count")
#plt.title("Vehicle Count Prediction Based on Entire Data")
#plt.legend()
#plt.grid(True)
#plt.show()

# 1분 후 예측 함수
def predict_vehicle_count_next_minute(hour, degree=6):
    """
    1분 후 차량 수를 예측하는 함수.
    
    Parameters:
        hour (float): 현재 시간 (예: 8.5는 8시 30분)
        degree (int): 다항식 차수 (default: 6)
        
    Returns:
        int: 1분 후 예측된 차량 수 (음수인 경우 0으로 반환)
    """
    # 1분 후 시간 계산
    next_time = (hour + 1 ) # 24시간 순환
    
    # 다항식 특성 생성 (기존 poly 재사용)
    next_time_poly = poly.transform([[next_time]])
    
    # 예측
    predicted_count = model.predict(next_time_poly)[0]
    
    # 음수 방지 및 반올림
    return max(0, int(round(predicted_count)))


pre = 0
# 1분 단위로 예측 및 파드 수 조정
def run_minute_based_prediction():
    global pre  # 전역 변수 선언
    current_hour = 0  # 시작 시간 (0시)
    end_hour = 24  # 종료 시간 (24시)

    while current_hour < end_hour:
        # 차량 대수 예측
        predicted_count = predict_vehicle_count_next_minute(current_hour)
        print(f"{current_hour}시 -> 예상 차량 수: {predicted_count}")
        
        # 파드 수 계산 및 조정
        predicted_servers = max(1, int(predicted_count / 12))  # 최소 1개의 파드 유지

        if pre < predicted_servers :
            os.system(f"kubectl scale deployment my-spring-app --replicas={predicted_servers}")
            print(f"파드 수를 {predicted_servers}로 조정함")                

        pre = predicted_servers
        current_hour += 1  # 다음 시간으로 이동
        time.sleep(60 * 2)  # 2분 대기

# 실행
run_minute_based_prediction()