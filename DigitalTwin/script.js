// 시간대별 자동차 수 설정
const timeSchedules = [
    { time: "07:30", count: 10 },
    { time: "09:00", count: 15 },
    { time: "12:00", count: 5 },

    { time: "13:29", count: 20 },
    { time: "13:30", count: 40 },
    { time: "13:31", count: 80 },
    { time: "13:32", count: 100 },

    { time: "14:28", count: 10 },
    { time: "14:29", count: 50 },

    { time: "18:00", count: 20 },
    { time: "22:00", count: 3 }
];


let responseTimesK3s = []; // 모든 자동차의 응답 시간을 저장하는 배열 - k3s
let responseTimesK8s = []; // 모든 자동차의 응답 시간을 저장하는 배열 - k8s
let activeIntervals = {}; // 각 자동차의 setInterval ID를 저장하는 객체
let carIdCounter = 1; // 전역에서 카운터 초기화
document.addEventListener('DOMContentLoaded', () => {
    // Three.js 초기화 설정
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // 카메라 위치를 약간 비스듬히 설정
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);

    // Renderer 설정 및 배경색 설정
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xFFE5B4);
    document.body.appendChild(renderer.domElement);

    // 조명 설정
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7.5);
    scene.add(light);

    // 5차선 원형 도로 생성
    const laneWidth = 0.5;
    const roadRadius = 8;
    const roadMaterial = new THREE.MeshBasicMaterial({ color: 0x808080, side: THREE.DoubleSide });

    for (let i = 0; i < 5; i++) {
        const innerRadius = roadRadius + i * laneWidth;
        const outerRadius = innerRadius + laneWidth;
        const roadGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
        const roadLane = new THREE.Mesh(roadGeometry, roadMaterial);
        roadLane.rotation.x = -Math.PI / 2;
        scene.add(roadLane);
    }

    function createDashedLine(radius) {
        const points = [];
        const segments = 64;
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(radius * Math.cos(theta), 0.01, radius * Math.sin(theta)));
        }

        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.2, gapSize: 0.2 });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        line.computeLineDistances();
        scene.add(line);
    }

    for (let i = 1; i < 5; i++) {
        createDashedLine(roadRadius + i * laneWidth);
    }

    function getRandomColor() {
        return Math.floor(Math.random() * 0xffffff);
    }

    // sleep 함수: 밀리초 단위로 대기 시간을 설정
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function showAPIAvg(){

        const averageResponseTimek3s = calculateAverage(responseTimesK3s);
        if(averageResponseTimek3s){
            console.log(`머신러닝 기반 k3s: ${averageResponseTimek3s.toFixed(2)} ms`);
        }
        const averageResponseTimek8s = calculateAverage(responseTimesK8s);
        if(averageResponseTimek8s){
            console.log(`CPU/MEM 기반 k8s: ${averageResponseTimek8s.toFixed(2)} ms`);
        }
    }

    setInterval(() => {
        showAPIAvg()
    }, 10000);

    // 자동차 데이터를 API로 전송하는 함수
    async function sendK3s(carId, position, speed) {
        const startTime = performance.now();

        try {

            await sleep(100);
            /*
            const response = await fetch('http://your-api-endpoint.com/car-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ carId, position, speed })
            });
            
            const data = await response.json();
            */
            const endTime = performance.now();

            const responseTime = endTime - startTime;
            responseTimesK3s.push(responseTime);
        } catch (error) {
            console.error(`자동차 ${carId} 요청 실패:`, error);
        }
    }

    // 자동차 데이터를 API로 전송하는 함수
    async function sendK8s(carId, position, speed) {
        const startTime = performance.now();

        try {

            await sleep(100);
            /*
            const response = await fetch('http://your-api-endpoint.com/car-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ carId, position, speed })
            });
            
            const data = await response.json();
            */
            const endTime = performance.now();

            const responseTime = endTime - startTime;
            responseTimesK8s.push(responseTime);
        } catch (error) {
            console.error(`자동차 ${carId} 요청 실패:`, error);
        }
    }

    // 평균 응답 시간을 계산하는 함수
    function calculateAverage(times) {
        const total = times.reduce((acc, time) => acc + time, 0);
        return total / times.length;
    }


    function createCar(id, color) {
        const car = new THREE.Group();
        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.3, 1.2);
        const bodyMaterial = new THREE.MeshBasicMaterial({ color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.15;
        car.add(body);

        const windowGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.6);
        const windowMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
        const carWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        carWindow.position.set(0, 0.3, 0);
        car.add(carWindow);

        const wheelGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16);
        const wheelMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
        for (let x of [-0.25, 0.25]) {
            for (let z of [-0.5, 0.5]) {
                const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(x, 0.05, z);
                car.add(wheel);
            }
        }

        scene.add(car);

        // 일정 주기로 API 통신 (5초마다 위치와 속도 전송)
        const intervalId = setInterval(() => {
            const position = { x: car.position.x, y: car.position.y, z: car.position.z };
            const speed = 0.01;
            sendK3s(id, position, speed);
            sendK8s(id, position, speed);
            
        }, 5000);

        activeIntervals[id] = intervalId; // 자동차 ID로 interval 저장

        return car;
    }

    // 나무 생성 함수
    function createTree(x, z) {
        const tree = new THREE.Group();

        // 나무 줄기
        const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5);
        const trunkMaterial = new THREE.MeshBasicMaterial({ color: 0x8b4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 0.25;
        tree.add(trunk);

        // 나무 잎
        const leafGeometry = new THREE.ConeGeometry(0.3, 0.7, 8);
        const leafMaterial = new THREE.MeshBasicMaterial({ color: 0x228b22 });
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        leaf.position.y = 0.75;
        tree.add(leaf);

        tree.position.set(x, 0, z);
        scene.add(tree);
    }
    
    // 원형 도로 바깥쪽에 나무를 배치
    const outerTreeRadius = roadRadius + laneWidth * 5.8; // 도로 바깥쪽 반지름
    const innerTreeRadius = roadRadius - laneWidth * 0.7; // 도로 안쪽 반지름
    const treeCount = 24; // 나무 배치 개수

    for (let i = 0; i < treeCount; i++) {
        const angle = (i / treeCount) * Math.PI * 2;

        // 도로 바깥쪽 나무 배치
        const xOuter = outerTreeRadius * Math.cos(angle);
        const zOuter = outerTreeRadius * Math.sin(angle);
        createTree(xOuter, zOuter);

        // 도로 안쪽 나무 배치
        const xInner = innerTreeRadius * Math.cos(angle);
        const zInner = innerTreeRadius * Math.sin(angle);
        createTree(xInner, zInner);
    }

    const defaultCount = 5; // 기본 자동차 수

    let cars = [];
    const laneRadii = [
        roadRadius + laneWidth * 0.5,
        roadRadius + laneWidth * 1.5,
        roadRadius + laneWidth * 2.5,
        roadRadius + laneWidth * 3.5,
        roadRadius + laneWidth * 4.5
    ];
    //const speeds = [0.01, 0.008, 0.009, 0.007, 0.006];
    const speeds = [0.004];
    

    function addCar() {
        const color = getRandomColor();
        const id = `car-${carIdCounter++}`; // 카운터로 고유 ID 생성
        const car = createCar(id, color);
        cars.push({ car, angle: 0, speed: speeds[cars.length % speeds.length], radius: laneRadii[cars.length % laneRadii.length] });
    }

    // 자동차 제거 함수
    function removeCar() {
        if (cars.length > 0) {
            const carToRemove = cars.pop(); // 가장 최근에 추가된 자동차 제거
            scene.remove(carToRemove.car); // 장면에서 제거

            clearInterval(activeIntervals[carToRemove.id]); // 주기적 요청 중단
            delete activeIntervals[carToRemove.id];
        }
    }

    function adjustCars(targetCount) {
        if (cars.length < targetCount) {
            addCar();
        } else if (cars.length > targetCount) {
            removeCar();
        }
    }

    function updateCarCount() {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const schedule = timeSchedules.find(item => item.time === currentTime);
        const targetCount = schedule ? schedule.count : defaultCount;

        const interval = setInterval(() => {
            adjustCars(targetCount);
            if (cars.length === targetCount) {
                clearInterval(interval);
            }
        }, 500);
    }

    setInterval(updateCarCount, 60000);
    updateCarCount();

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });

    function adjustSpeedForSpacing() {
        for (let i = 0; i < cars.length; i++) {
            const currentCar = cars[i];
            const nextCar = cars[(i + 1) % cars.length]; // 순환형 배열로 마지막 차는 첫 번째 차와 거리 유지
    
            // 현재 자동차와 다음 자동차의 각도 차이 계산
            let angleDifference = nextCar.angle - currentCar.angle;
            if (angleDifference < 0) angleDifference += Math.PI * 2; // 각도 차이를 0 ~ 2π 범위로 유지
    
            // 각도 차이가 일정 이하이면 속도를 줄이고, 아니면 원래 속도로 회복
            const minAngleGap = 0.3; // 자동차 간 최소 각도 간격
            if (angleDifference < minAngleGap) {
                currentCar.speed = Math.max(0.005, currentCar.speed - 0.001); // 속도 줄임 (최소 속도 제한)
            } else {
                currentCar.speed = speeds[i % speeds.length]; // 원래 속도로 회복
            }
        }
    }

    function animate() {
        requestAnimationFrame(animate);

        adjustSpeedForSpacing(); // 매 프레임마다 간격 조정

        cars.forEach((carData) => {
            carData.angle += carData.speed;
            carData.car.position.x = carData.radius * Math.cos(carData.angle);
            carData.car.position.z = carData.radius * Math.sin(carData.angle);
            carData.car.rotation.y = -carData.angle;
        });

        renderer.render(scene, camera);
    }

    animate();
}); 