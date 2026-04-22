package com.DevBridge.devbridge.controller;

import com.DevBridge.devbridge.dto.ClientSummaryResponse;
import com.DevBridge.devbridge.service.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    public List<ClientSummaryResponse> list() {
        return clientService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClientSummaryResponse> detail(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(clientService.findById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}

