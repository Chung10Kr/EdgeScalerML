// 시간대별 자동차 수 설정
const timeSchedules = [
    { min: "01", count: 291 },
    { min: "02", count: 191 },
    { min: "03", count: 141 },
    { min: "04", count: 151 },
    { min: "05", count: 311 },
    { min: "06", count: 780 },
    { min: "07", count: 1239 },
    { min: "08", count: 1926 },
    { min: "09", count: 1907 },
    { min: "10", count: 1573 },
    { min: "11", count: 1433 },
    { min: "12", count: 1489 },
    { min: "13", count: 1449 },
    { min: "14", count: 1470 },
    { min: "15", count: 1469 },
    { min: "16", count: 1593 },
    { min: "17", count: 1757 },
    { min: "18", count: 1932 },
    { min: "19", count: 1652 },
    { min: "20", count: 1299 },
    { min: "21", count: 992 },
    { min: "22", count: 862 },
    { min: "23", count: 659 },
    { min: "24", count: 411 }
];



let responseTimesK3s_cpu = [];
let responseTimesK3s_ml = [];
let responseTimesK8s = [];

let activeIntervals = {}; // 각 자동차의 setInterval ID를 저장하는 객체
let carIdCounter = 1; // 전역에서 카운터 초기화

let scene, camera, renderer;
let cars = []
const people = [];
const laneWidth = 0.5;
const roadRadius = 8;
const laneRadii = [
    roadRadius + laneWidth * 0.5,
    roadRadius + laneWidth * 1.5,
    roadRadius + laneWidth * 2.5,
    roadRadius + laneWidth * 3.5,
    roadRadius + laneWidth * 4.5
];

const speeds = [0.01, 0.008, 0.009, 0.007, 0.006];
const defaultCount = 5; // 기본 자동차 수

function init() {
    renderBackGround();

    // 사람들이 도로를 따라 원형 경로를 돌도록 설정
    
    
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });

    let msg = `현재 분 | 머신러닝 기반 k3s | CPU/MEM 기반 k3s | CPU/MEM 기반 k8s  (초)`;
    console.log(msg);
    setInterval(() => {
        showAPIAvg()
    }, 60000);

    setInterval(updateCarCount, 60000);
    updateCarCount();

    function animate() {
        requestAnimationFrame(animate);
        animatePeople(people);   // 사람들을 움직이게 함
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
}

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
function createCar(id, color) {
    const car = new THREE.Group();

    // 자동차 본체
    const bodyGeometry = new THREE.BoxGeometry(0.6, 0.3, 1.2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.15;
    car.add(body);

    // 자동차 창
    const windowGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.6);
    const windowMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, opacity: 0.5, transparent: true });
    const carWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    carWindow.position.set(0, 0.3, 0);
    car.add(carWindow);

    // 바퀴
    const wheelGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.5 });

    for (let x of [-0.25, 0.25]) {
        for (let z of [-0.5, 0.5]) {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(x, 0.05, z);
            car.add(wheel);
        }
    }
    scene.add(car);

    // 일정 주기로 API 통신 (1초마다 위치와 속도 전송)
    const intervalId = setInterval(() => {
        apiCall('http://192.168.64.38:8080/hello', responseTimesK3s_cpu)
        
    }, 10000);

    activeIntervals[id] = intervalId; // 자동차 ID로 interval 저장

    return car;
}


// 자동차 데이터를 API로 전송하는 함수
async function apiCall(API, arr) {
    const startTime = performance.now();

    try {
        await fetch(API, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        arr.push(responseTime);
    } catch (error) {
        console.error(`자동차 요청 실패:`, error);
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
    const currentMin = `${String(now.getMinutes()).padStart(2, '0')}`;

    const schedule = timeSchedules.find(item => item.min === currentMin);
    const targetCount = schedule ? schedule.count : defaultCount;

    const interval = setInterval(() => {
        adjustCars(targetCount);
        if (cars.length === targetCount) {
            clearInterval(interval);
        }
    }, 1000);
}

function showAPIAvg() {
    const averageResponseTimek3s_cpu = calculateAverage(responseTimesK3s_cpu);
    const averageResponseTimek3s_ml = calculateAverage(responseTimesK3s_ml);
    const averageResponseTimek8s = calculateAverage(responseTimesK8s);

    const now = new Date();
    const currentMin = `${String(now.getMinutes()).padStart(2, '0')}`;
    let msg = `${currentMin}|${(averageResponseTimek3s_ml / 1000).toFixed(3)}          | ${(averageResponseTimek3s_cpu / 1000).toFixed(3)}          | ${(averageResponseTimek8s / 1000).toFixed(3)}`;
    console.log(msg);

    responseTimesK3s_cpu = [];
    responseTimesK3s_ml = [];
    responseTimesK8s = [];
    
}

function renderBackGround() {
    // Three.js 초기화 설정
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // 카메라 위치를 약간 비스듬히 설정
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);

    // Renderer 설정 및 배경색 설정
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xFFE5B4);
    document.body.appendChild(renderer.domElement);

    // 조명 설정
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7.5);
    scene.add(light);

    // 5차선 원형 도로 생성
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

    // 신호등
    createTrafficLight(4, 3, roadRadius + laneWidth * 2.5 , 1);
    createTrafficLight(14, 13, roadRadius + laneWidth * 3 , 0.67);

    // 횡단보도 생성
    createCrosswalk(5, roadRadius);

    // 간판 생성
    createSign(5, 1, -roadRadius - 2);
    createSign(5, 1.3, -roadRadius - 2);


    const sidewalkRadius = roadRadius + laneWidth * 4 + 0.5; // 사람들이 회전할 반지름 설정
    for (let i = 0; i < 5; i++) {
        const personData = createPerson(sidewalkRadius);
        personData.angle = (i / 5) * Math.PI * 2; // 각 사람의 초기 각도 설정
        people.push(personData);
    }

}

function createPerson(radius) {
    const person = new THREE.Group();

    // 몸통
    const bodyGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.15;
    person.add(body);

    // 머리
    const headGeometry = new THREE.SphereGeometry(0.1);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffddaa });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.4;
    person.add(head);

    scene.add(person);

    return { person, angle: 0, radius, speed: 0.005 };
}


function animatePeople(people) {
    people.forEach(personData => {
        // 각도 업데이트하여 원형 경로로 이동
        personData.angle += personData.speed;
        personData.person.position.x = personData.radius * Math.cos(personData.angle);
        personData.person.position.z = personData.radius * Math.sin(personData.angle);
        
        // 사람의 회전 방향을 따라가도록 설정
        personData.person.rotation.y = -personData.angle;
    });
}




function createCrosswalk(centerX, radius) {
    const crosswalkWidth = 1;
    const lineLength = 0.2;
    const lineSpacing = 0.15;

    for (let i = -5; i < 5; i++) {
        const lineGeometry = new THREE.PlaneGeometry(lineLength, crosswalkWidth);
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        
        // 횡단보도 선 배치
        line.rotation.x = -Math.PI / 2; // 평면을 지면과 평행하게 배치
        line.rotation.z = Math.PI / 1.5;  // 90도 회전하여 세로 방향으로 배치
        line.position.set(centerX, 0.01, radius + i * (lineLength + lineSpacing));
        
        scene.add(line);
    }
}

function createSign(x, y, z) {
    const sign = new THREE.Group();

    // 간판 기둥
    const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1);
    const poleMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x, y + 0.5, z);
    sign.add(pole);

    // 간판 본체
    const signGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.05);
    const signMaterial = new THREE.MeshBasicMaterial({ color: 0x0055ff });
    const signBox = new THREE.Mesh(signGeometry, signMaterial);
    signBox.position.set(x, y + 1, z);
    sign.add(signBox);

    // 간판 텍스트 (Texture를 사용하여 텍스트를 추가할 수 있습니다)
    // 간단한 텍스트는 TextGeometry를 통해 추가 가능

    scene.add(sign);
}



function createTrafficLight(x, y, z, scale = 1) {
    const trafficLight = new THREE.Group();

    // 신호등 기둥
    const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1);
    const poleMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x, y + 0.5, z);
    trafficLight.add(pole);

    // 신호등 본체
    const lightBoxGeometry = new THREE.BoxGeometry(0.2, 0.5, 0.2);
    const lightBoxMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const lightBox = new THREE.Mesh(lightBoxGeometry, lightBoxMaterial);
    lightBox.position.set(x, y + 1, z);
    trafficLight.add(lightBox);

    // 빨간불, 노란불, 초록불
    const lightColors = [0xff0000, 0xffff00, 0x00ff00];
    lightColors.forEach((color, index) => {
        const lightGeometry = new THREE.CircleGeometry(0.07, 16);
        const lightMaterial = new THREE.MeshBasicMaterial({ color });
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.set(x, y + 1.15 - index * 0.2, z + 0.11);
        trafficLight.add(light);
    });

    // 스케일 조정
    trafficLight.scale.set(scale, scale, scale);

    scene.add(trafficLight);
}


function getRandomColor() {
    return Math.floor(Math.random() * 0xffffff);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateAverage(times) {
    const total = times.reduce((acc, time) => acc + time, 0);
    return (total / times.length) || 0;
}

function adjustSpeedForSpacing() {
    cars.forEach((car, index) => {
        for (let i = 0; i < cars.length; i++) {
            if (i !== index) {
                const otherCar = cars[i];

                // 같은 차선에 있는 차량만 거리를 계산
                if (car.radius === otherCar.radius) {
                    const distance = Math.sqrt(
                        (car.car.position.x - otherCar.car.position.x) ** 2 +
                        (car.car.position.z - otherCar.car.position.z) ** 2
                    );

                    // 최소 거리 미만일 경우 속도 조절
                    if (distance < 2.5) { // 거리를 늘리고 싶다면 이 값을 조정
                        car.speed = Math.max(0.005, car.speed - 0.001); // 속도 줄임
                    } else if (distance > 3.5) { // 거리가 너무 멀면 속도를 늘림
                        car.speed = Math.min(speeds[index % speeds.length], car.speed + 0.001);
                    }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', init); 