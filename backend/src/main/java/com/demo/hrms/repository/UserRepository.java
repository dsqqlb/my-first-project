package com.demo.hrms.repository;

import com.demo.hrms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByLoginName(String loginName);
    boolean existsByLoginName(String loginName);
}
