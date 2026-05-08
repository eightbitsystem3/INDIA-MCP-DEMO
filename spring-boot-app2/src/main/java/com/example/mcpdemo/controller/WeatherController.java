package com.example.mcpdemo.controller;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/weather")
public class WeatherController {

    private static final Map<String, WeatherInfo> stateData = Map.of(
            "Rajasthan", new WeatherInfo("Rajasthan", 38.5, "Hot", 26.9124, 75.7873),
            "Maharashtra", new WeatherInfo("Maharashtra", 31.2, "Humid", 19.0760, 72.8777),
            "Karnataka", new WeatherInfo("Karnataka", 27.8, "Pleasant", 12.9716, 77.5946)
    );

    private static final Map<String, WeatherInfo> cityData = Map.of(
            "Jaipur", new WeatherInfo("Jaipur", 38.5, "Hot", 26.9124, 75.7873),
            "Mumbai", new WeatherInfo("Mumbai", 31.2, "Humid", 19.0760, 72.8777),
            "Bengaluru", new WeatherInfo("Bengaluru", 27.8, "Pleasant", 12.9716, 77.5946)
    );

    @GetMapping("/state/{state}")
    public WeatherInfo getWeatherState(@PathVariable String state) {
        return stateData.getOrDefault(
                state,
                new WeatherInfo(state, 0.0, "Not Found", 0.0, 0.0)
        );
    }

    @GetMapping("/city/{city}")
    public WeatherInfo getWeatherCity(@PathVariable String city) {
        return cityData.getOrDefault(
                city,
                new WeatherInfo(city, 0.0, "Not Found", 0.0, 0.0)
        );
    }
}