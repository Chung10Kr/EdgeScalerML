# 서버 시작 : locust -f locustfile.py
# 확인 : http://localhost:8089

# 부하 테스트 설정 및 실행
#	•	Number of users to simulate: 동시에 시뮬레이션할 사용자 수 (예: 100)
#	•	Spawn rate: 초당 새로운 사용자를 추가하는 속도 (예: 10)

# RPS 모니터링 및 결과 분석
#  테스트가 실행되면 Locust 웹 인터페이스에서 RPS (Requests Per Second)와 응답 시간, 에러율 등을 실시간으로 확인할 수 있습니다.
#	•	Requests/s: 초당 요청 수를 나타내며, 서버가 처리할 수 있는 RPS 한도를 파악하는 데 유용합니다.
#	•	Failures: 서버가 부하를 처리하는 과정에서 발생하는 에러의 수를 확인할 수 있습니다.
#	•	Response Time: 서버의 응답 시간이 일정 기준을 초과할 경우, 요청이 과부하 상태임을 의미할 수 있습니다.