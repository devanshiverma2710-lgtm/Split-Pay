package com.devanshi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SplitPayApplication {

	public static void main(String[] args) {
		SpringApplication.run(SplitPayApplication.class, args);
	}

}
