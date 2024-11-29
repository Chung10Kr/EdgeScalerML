from locust import HttpUser, task, between, events, LoadTestShape
from locust.env import Environment

class MyUser(HttpUser):
    wait_time = between(1, 2)
    host = "http://192.168.64.43:8080"  # 테스트할 서버 URL

    @task
    def load_test(self):
        self.client.get("/hello")  # 테스트할 엔드포인트


# 점진적 부하 증가 설정
class StepLoadShape(LoadTestShape):
    step_time = 60           # 매 60초마다 부하 증가
    step_users = 120          # 매 스텝마다 10명씩 사용자 추가
    max_users = 20000          # 최대 사용자 수
    spawn_rate = 20          # 초당 추가할 사용자 수

    def tick(self):
        run_time = self.get_run_time()
        if run_time < self.step_time * (self.max_users / self.step_users):
            current_step = run_time // self.step_time + 1
            return (current_step * self.step_users, self.spawn_rate)
        else:
            return None

# Locust 명령으로 실행: locust -f locustfile.py