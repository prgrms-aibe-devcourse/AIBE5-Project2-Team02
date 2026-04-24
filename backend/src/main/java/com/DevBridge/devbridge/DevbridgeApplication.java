package com.DevBridge.devbridge;

import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvEntry;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.HashMap;
import java.util.Map;

@SpringBootApplication
@EnableJpaAuditing
public class DevbridgeApplication {
	public static void main(String[] args) {
		// 현재 디렉토리(backend/)에서 .env 탐색, 없으면 상위 디렉토리(프로젝트 루트)에서 재탐색
		Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
		Map<String, Object> envProps = new HashMap<>();
		for (DotenvEntry entry : dotenv.entries()) {
			envProps.put(entry.getKey(), entry.getValue());
		}
		if (envProps.isEmpty()) {
			Dotenv parentDotenv = Dotenv.configure().directory("../").ignoreIfMissing().load();
			for (DotenvEntry entry : parentDotenv.entries()) {
				envProps.put(entry.getKey(), entry.getValue());
			}
		}

		SpringApplication app = new SpringApplication(DevbridgeApplication.class);
		app.setDefaultProperties(envProps);
		app.run(args);
	}
}