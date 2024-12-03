const { exec } = require('child_process');

const VM_NAME = "k3s-ml-node";
let api = "192.168.64.56";

// 시간대별 자동차 수 설정
const timeSchedules = {
    //"12m4d":[7,2,0,1,9,33,58,95,93,72,67,66,67,72,72,74,85,100,88,58,44,34,22,13],
    //"12m5d":[7,3,0,2,10,35,60,94,96,74,68,70,69,72,73,78,84,100,91,60,48,34,23,13],
    //"12m6d":[7,2,0,1,9,33,58,95,93,72,67,66,67,72,72,74,85,100,88,58,44,34,22,13],
    //"12m7d":[9,3,0,1,10,36,62,100,99,80,73,76,74,75,75,82,91,100,85,65,48,41,29,16],
    //"12m8d":[9,5,0,2,10,34,59,91,91,74,69,70,73,72,75,81,91,100,88,60,51,40,29,19],

    "12m11d":[8, 4, 1, 3, 13, 39, 64, 94, 100, 76, 70, 69, 69, 71, 74, 76, 83, 98, 88, 56, 44, 33, 24, 12]
}


let responseTime = [];

const fs = require('fs');


class Car {
    constructor(id) {
        this.id = id; // 차량 ID 
        this.intervalId = null; // 타이머 ID
    }

    async apiCall() {
        let API = `http://${api}:8080/hello`;

        const startTime = performance.now();
        try {
            await fetch(API, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const endTime = performance.now();
            const timeTaken = endTime - startTime;
            responseTime.push(timeTaken);
        } catch (error) {
        }
    }
    
    start() {
        if (!this.intervalId) {
            this.intervalId = setInterval(() => this.apiCall(), 1000);
        }
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}
currentMinute = 0; 
cars = []; // 현재 실행 중인 차량 배열
class Simulation {
    constructor(schedules) {
        this.schedules = schedules;
        
        // 현재 스케줄 인덱스
        this.minGap = 60000 * 1
    }

    async start() {

        // 시뮬레이션 실행
        const now = new Date();
        console.log(
            `Simulation started at: ${now.getHours()}h ${now.getMinutes()}m ${now.getSeconds()}s`
        );
/*
        if( [
            "k3s-ml-node",
        ].indexOf(VM_NAME) != -1 ){

            const command = `multipass exec ${VM_NAME} -- nohup python3 "/home/ubuntu/ARIMA.py" > /home/ubuntu/arima.log 2>&1 &`;
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error running py: ${stderr}`);
                    return
                }
            });

            await this.wait(this.minGap);
        }
 */
        // 순회 코드
        for (const [key, values] of Object.entries(timeSchedules)) {
            for (const value of values) {
                this.adjustCars(value); // 차량 수 조정
                await this.wait(this.minGap); // 1분 대기
                currentMinute++;
            }
        }

        console.log("Simulation completed.");

        // 파일에 저장할 문자열로 변환
        const data = JSON.stringify(logs, null, 2); // JSON 문자열로 변환 (2는 들여쓰기 설정)
        // 파일로 저장
        fs.writeFileSync('logs.json', data, 'utf8');
    }

    async adjustCars(targetCount) {
        const currentCount = cars.length;

        if (targetCount > currentCount) {
            // 차량 증가
            const increaseBy = targetCount - currentCount;
            for (let i = 0; i < increaseBy; i++) {
                const newCar = new Car(currentCount + i + 1);
                newCar.start();
                cars.push(newCar);

                // 천천히 증가시키기 위해 딜레이
                await this.wait(2000); // 2초 간격으로 차량 추가
            }
        } else if (targetCount < currentCount) {
            // 차량 감소
            const decreaseBy = currentCount - targetCount;
            for (let i = 0; i < decreaseBy; i++) {
                const carToStop = cars.pop(); // 배열의 마지막 차량을 제거
                if (carToStop) {
                    carToStop.stop();

                    // 천천히 감소시키기 위해 딜레이
                    await this.wait(2000); // 2초 간격으로 차량 제거
                }
            }
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const simulation = new Simulation(timeSchedules);
simulation.start();


function calculateAverage(times) {
    const total = times.reduce((acc, time) => acc + time, 0);
    return (total / times.length) || 0;
}


// HPA의 CPU 사용률과 파드 수 가져오기
async function getHPAUsageAndReplicas() {
    return new Promise((resolve, reject) => {
        const command = `multipass exec ${VM_NAME} -- kubectl get hpa --no-headers`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error fetching HPA metrics: ${stderr}`);
                return reject(error);
            }

            try {
                // HPA 데이터 파싱
                const hpaData = stdout.trim().split('\n')[0]; // 첫 번째 HPA 데이터만 사용
                const parts = hpaData.split(/\s+/); // 공백으로 분리
                // 필요한 값 추출
                const targets = parts[3]; // "cpu: 12%/50%" 형태

                const replicas = parseInt(parts[6]); // 현재 파드 수
                // CPU 사용률 추출
                const currentCPU = targets.split("/")[0];
                // 결과 리턴
                resolve({ currentCPU, replicas });
            } catch (parseError) {
                console.error("Error parsing HPA data:", parseError);
                reject(parseError);
            }
        });
    });
}


async function showAPIAvg(){
    const now = new Date();

    const avg = calculateAverage(responseTime);
    const { currentCPU, replicas } = await getHPAUsageAndReplicas();
    let msg = `${cars.length}|${(avg / 1000).toFixed(3)}|${currentCPU}|${replicas}`;
    console.log( msg )
    responseTime = [];
}

setInterval( () => {
    showAPIAvg();
},1000 * 30)