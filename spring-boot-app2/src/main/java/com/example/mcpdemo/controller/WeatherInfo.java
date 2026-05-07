package com.example.mcpdemo.controller;

public class WeatherInfo {

    private String city;
    private double temperature;
    private String condition;
    private double latitude;
    private double longitude;

    public WeatherInfo(String city, double temperature, String condition,
                       double latitude, double longitude) {
        this.city = city;
        this.temperature = temperature;
        this.condition = condition;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public String getCity() {
        return city;
    }

    public double getTemperature() {
        return temperature;
    }

    public String getCondition() {
        return condition;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }
}