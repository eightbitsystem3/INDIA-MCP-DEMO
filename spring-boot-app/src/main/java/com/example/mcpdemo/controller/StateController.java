package com.example.mcpdemo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/states")
public class StateController {

    @GetMapping
    public List<String> getStates() {
        return List.of("Rajasthan", "Maharashtra", "Karnataka");
    }
}