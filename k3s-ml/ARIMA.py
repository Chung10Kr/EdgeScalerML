# 차량의 댓수를 예측하는것은 ARIMA
# 몇대의 차량이 얼만큼의 파드를 필요했는지! 이거는 회귀 분석

from statsmodels.tsa.arima.model import ARIMA
import pandas as pd
import matplotlib.pyplot as plt

# 주어진 데이터 -> 22분마다 측정
data = {
    "2024-12-04": {
        "vehicle_counts": [7,7,2,2,0,0,1,1,2,9,9,17,32,33,33,47,58,58,62,77,92,95,95,93,93,83,72,72,68,67,67,66,66,67,67,72,72,72,72,74,74,79,85,85,94,100,100,91,88,88,76,61,58,58,46,44,44,34,34,31,22,22,16,13,13],
        "pod_counts":     [2,3,2,1,1,1,1,1,1,1,1,2,3,6,8,8,7,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,6,4,3,3]
    },
    "2024-12-05": {
        "vehicle_counts": [7,7,3,3,1,0,0,2,2,10,10,14,29,35,35,44,60,60,60,74,89,94,94,96,96,88,74,74,73,68,68,70,70,69,69,72,72,73,73,76,78,78,84,84,91,100,100,94,91,91,79,65,60,60,49,48,48,35,34,34,23,23,20,13,13],
        "pod_counts": [2,2,2,2,2,1,1,1,1,1,1,1,1,2,4,4,7,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,7,5,4,4,4,4,3,3,3,3]
    },
    "2024-12-06": {
        "vehicle_counts": [7,7,5,2,2,0,0,1,1,9,9,10,25,33,33,40,55,58,58,71,85,95,95,93,93,90,75,72,72,67,67,66,66,67,67,72,72,72,72,73,74,74,85,85,88,100,100,96,88,88,82,67,58,58,52,44,44,37,34,34,23,22,22,13,13],
        "pod_counts": [2,2,1,1,1,1,1,1,1,1,1,1,1,2,4,5,6,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,6,5,4]
    },
    "2024-12-07": {
        "vehicle_counts": [11,9,9,5,5,0,0,2,2,4,10,10,19,34,34,34,49,59,59,64,79,91,91,91,91,88,74,74,73,69,69,70,70,73,73,72,72,75,75,78,81,81,91,91,93,100,100,91,88,88,77,62,60,60,51,51,47,40,40,32,29,29,19,19,17],
        "pod_counts": [4,4,4,3,2,2,1,1,1,1,1,1,1,2,2,4,8,8,8,7,6,6,8,8,8,8,8,8,6,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,6,6,6,5,3,3,2]
    },
    "2024-12-08": {
        "vehicle_counts": [9,9,4,4,2,1,1,2,2,10,10,15,30,36,36,45,60,62,62,75,90,100,100,99,99,95,80,80,80,72,72,76,76,73,73,73,74,74,74,74,81,81,88,90,90,100,100,97,85,85,82,67,65,65,52,48,48,41,41,40,30,29,14,5,1],
        "pod_counts": [2,2,1,1,1,1,1,1,1,1,1,1,1,2,4,4,5,6,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,6,6,4,3,2]
    }
}

# 결과를 저장할 딕셔너리
resampled_data = {}

# 각 날짜별로 처리
for date, values in data.items():
    vehicle_counts = values["vehicle_counts"]
    pod_counts = values["pod_counts"]

    # 데이터프레임으로 변환
    df = pd.DataFrame({
        "vehicle_counts": vehicle_counts,
        "pod_counts": pod_counts
    })

    # 다운샘플링: 22분 -> 1시간 (평균값 사용)
    resampled = df.groupby(df.index // 3).mean()  # 3개씩 평균 계산

    # 파드 수를 반올림 처리
    resampled["pod_counts"] = resampled["pod_counts"].round()


    # 23번째 값 추가 (마지막 값을 반복)
    if len(resampled) == 22:
        last_row = resampled.iloc[-1:]  # 마지막 행을 선택 (DataFrame 형태 유지)
        resampled = pd.concat([resampled, last_row], ignore_index=True)

    # 결과를 저장
    resampled_data[date] = {
        "vehicle_counts": resampled["vehicle_counts"].tolist(),
        "pod_counts": resampled["pod_counts"].tolist()
    }

from statsmodels.tsa.statespace.sarimax import SARIMAX
import pandas as pd

# SARIMA 모델 학습 함수
def train_sarima_model(vehicle_series, seasonal_order=(1, 1, 1, 24)):
    """
    SARIMA 모델을 학습하는 함수.

    Parameters:
    - vehicle_series (pd.Series): 차량 수 시계열 데이터
    - seasonal_order (tuple): 계절적 ARIMA의 계절 파라미터 (P, D, Q, m)

    Returns:
    - model_fit: 학습된 SARIMA 모델
    """
    # SARIMA 모델 설정
    model = SARIMAX(vehicle_series, order=(2, 1, 2), seasonal_order=seasonal_order)
    model_fit = model.fit(disp=False)
    return model_fit

# 특정 시간에 대한 SARIMA 예측 함수
def get_sarima_prediction(model_fit, hours, steps=24):
    """
    특정 시간에 대한 SARIMA 예측값을 반환하는 함수.

    Parameters:
    - model_fit: 학습된 SARIMA 모델
    - hours (list): 예측하고자 하는 시간 리스트 (예: [1, 2, 3])
    - steps (int): 예측할 시간 범위 (기본값 = 24시간)

    Returns:
    - dict: {시간: 예측된 차량 수} 형태의 딕셔너리
    """
    # 예측
    forecast = model_fit.forecast(steps=steps).tolist()  # 리스트로 변환
    predictions = {hour: forecast[hour - 1] for hour in hours}
    return predictions

# 모든 Vehicle Counts 데이터를 하나의 시계열로 병합
vehicle_counts = []
for date, values in resampled_data.items():
    vehicle_counts.extend(values["vehicle_counts"])

# pandas Series로 변환
vehicle_series = pd.Series(vehicle_counts)

# SARIMA 모델 학습
sarima_model = train_sarima_model(vehicle_series)


# 1시, 2시, 3시의 예측값 가져오기
predicted_values = get_sarima_prediction(sarima_model, hours=[1, 2, 3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23])

cars=[];

# 예측 결과 출력
print("SARIMA 예측 값:")
for hour, value in predicted_values.items():
    print(f"{hour}시: {value:.2f}")
    cars.append(value)




from sklearn.linear_model import LinearRegression
import numpy as np

# 1. 데이터 준비
vehicle_data = []
pod_data = []
for date, values in data.items():
    vehicle_data.extend(values["vehicle_counts"])  # 차량 대수
    pod_data.extend(values["pod_counts"])  # 파드 수

# 2. 데이터 배열 변환
vehicle_data = np.array(vehicle_data).reshape(-1, 1)  # 독립 변수 (차량 대수)
pod_data = np.array(pod_data)  # 종속 변수 (파드 수)

# 3. 회귀 모델 학습
regression_model = LinearRegression()
regression_model.fit(vehicle_data, pod_data)


# 5. 테스트: 차량 대수에 따른 파드 수 예측
test_vehicle_counts = np.array(cars).reshape(-1, 1)  # 예측할 차량 대수
predicted_pods = regression_model.predict(test_vehicle_counts)

result_pods = [];
# 6. 예측 결과 출력
print("\n테스트 차량 대수에 따른 예측된 파드 수:")
for count, pods in zip(test_vehicle_counts.flatten(), predicted_pods):
    print(f"차량 대수: {count}대 -> 예측된 파드 수: {round(pods)}개")
    result_pods.append(round(pods))  # 결과: 4


print(result_pods);
import time
import os
# 이전 파드 수 초기화
previous_pod_count = 0

import subprocess

def get_hpa_usage_and_replicas(vm_name):
    try:
        # multipass와 kubectl 명령어 실행
        command = f"kubectl get hpa --no-headers"
        output = subprocess.check_output(command, shell=True, text=True).strip()

        # 첫 번째 HPA 데이터만 사용
        if not output:
            raise ValueError("No HPA data found.")
        print(output);
        hpa_data = output.split("\n")[0]  # 첫 번째 줄 데이터
        parts = hpa_data.split()  # 공백 기준으로 분리

        # 필요한 값 추출
        targets = parts[3]  # "cpu: 12%/50%" 형태
        replicas = int(parts[6])  # 현재 파드 수

        # CPU 사용률 추출
        current_cpu = targets.split("/")[0].replace("cpu:", "").strip()

        # 결과 반환
        return {"currentCPU": current_cpu, "replicas": replicas}

    except subprocess.CalledProcessError as e:
        print(f"Error fetching HPA metrics: {e}")
        return None
    except (IndexError, ValueError) as parse_error:
        print(f"Error parsing HPA data: {parse_error}")
        return None


# 결과 파드 수 배열 순회

# result_pods 배열 순회
for pod_count in result_pods:
    pod_count = round(pod_count)  # 정수로 반올림

    # 현재 파드 수 가져오기
    result = get_hpa_usage_and_replicas("my-spring-app")
    current_pod_count = result['replicas']
    
    print(f"{pod_count} - {current_pod_count}" )
    
    # 파드 수가 이전 단계보다 클 때만 스케일링 실행
    if pod_count > current_pod_count:
        # kubectl 명령어 생성
        os.system(f"kubectl scale deployment my-spring-app --replicas={pod_count}")
        print(f"{pod_count} DONE")
        # 이전 파드 수 갱신
    time.sleep(60 * 1) # 1분 대기
    
