package hn.warehouseservice.controller;

import hn.warehouseservice.dto.DashboardDTO;
import hn.warehouseservice.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping({"", "/summary"})
    public DashboardDTO getStats() {
        return dashboardService.getDashboardStats();
    }
}