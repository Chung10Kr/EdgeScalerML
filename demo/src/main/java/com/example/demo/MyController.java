package com.example.demo;

import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MyController {

    @GetMapping("/hello")
    public String hello() {

        long startTime = System.currentTimeMillis();


        // 디스크 I/O 부하 발생
        try {
            generateDiskIO();
        } catch (IOException e) {
            e.printStackTrace();
        }

        long endTime = System.currentTimeMillis();
        long totalTime = endTime - startTime;

        return "Hello, Kubernetes! -" + totalTime;
    }

    // 디스크 I/O 부하를 발생시키는 메서드
    private void generateDiskIO() throws IOException {
        for (int i = 0; i < 50; i++) { // 여러 개의 파일을 생성
            String filePath = "temp_file_" + i + ".txt";
            
            // 파일에 많은 양의 데이터를 씁니다.
            try (FileWriter writer = new FileWriter(filePath)) {
                for (int j = 0; j < 5000; j++) {  // 쓰기 양 증가
                    writer.write("This is a line of text to generate disk I/O.\n");
                }
            }
            
            // 파일을 삭제합니다.
            Files.delete(Paths.get(filePath));
        }
    }
}