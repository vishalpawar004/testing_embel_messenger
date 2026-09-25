package com.embel.chatmessenger.group.repository;

import com.embel.chatmessenger.group.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupRepository extends JpaRepository<Group, Long> {
}