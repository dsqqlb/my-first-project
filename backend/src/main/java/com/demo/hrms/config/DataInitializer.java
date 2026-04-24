package com.demo.hrms.config;

import com.demo.hrms.entity.User;
import com.demo.hrms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    
    private final UserRepository userRepository;
    
    @Override
    public void run(String... args) {
        // 初始化测试用户
        if (userRepository.count() == 0) {
            User admin = new User();
            admin.setLoginName("admin");
            admin.setPassword("admin123");
            admin.setEmployeeName("系统管理员");
            admin.setEmployeeNo("EMP001");
            admin.setEmail("admin@example.com");
            admin.setPhone("13800138000");
            admin.setActive(true);
            userRepository.save(admin);
            
            User user1 = new User();
            user1.setLoginName("zhangsan");
            user1.setPassword("123456");
            user1.setEmployeeName("张三");
            user1.setEmployeeNo("EMP002");
            user1.setEmail("zhangsan@example.com");
            user1.setPhone("13800138001");
            user1.setActive(true);
            userRepository.save(user1);
            
            User user2 = new User();
            user2.setLoginName("lisi");
            user2.setPassword("123456");
            user2.setEmployeeName("李四");
            user2.setEmployeeNo("EMP003");
            user2.setEmail("lisi@example.com");
            user2.setPhone("13800138002");
            user2.setActive(true);
            userRepository.save(user2);
            
            System.out.println("✅ 初始化测试数据完成！");
        }
    }
}
