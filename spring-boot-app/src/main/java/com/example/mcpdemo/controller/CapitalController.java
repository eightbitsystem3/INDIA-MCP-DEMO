package com.example.mcpdemo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/capital")
public class CapitalController {

    private static final Map<String, String> data = Map.of(
            "Rajasthan", "Jaipur",
            "Maharashtra", "Mumbai",
            "Karnataka", "Bengaluru"
    );

    @GetMapping("/{state}")
    public String getCapital(@PathVariable String state) {
        return data.getOrDefault(state, "Not Found");
    }

}

