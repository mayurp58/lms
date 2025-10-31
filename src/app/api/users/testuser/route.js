import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db/mysql";
const bcrypt = require('bcryptjs')

export async function GET(request) {
  try {
    const password = "password123";
    const hashedPassword = await bcrypt.hash(password, 12);

    // Test users data
    const testUsers = [
      {
        email: "admin@example.com",
        role: "super_admin",
        first_name: "Super",
        last_name: "Admin",
        phone: "9876543210",
      },
      {
        email: "connector@example.com",
        role: "connector",
        first_name: "Test",
        last_name: "Connector",
        phone: "9876543211",
        city: "Mumbai",
        area: "Andheri",
        commission_percentage: 2.5,
      },
      {
        email: "operator@example.com",
        role: "operator",
        first_name: "Test",
        last_name: "Operator",
        phone: "9876543212",
      },
      {
        email: "banker@example.com",
        role: "banker",
        first_name: "Test",
        last_name: "Banker",
        phone: "9876543213",
        bank_id: 1,
        employee_id: "EMP001",
        designation: "Loan Officer",
        department: "Retail Banking",
        max_approval_limit: 5000000.0,
      },
      // Generic test user
      {
        email: "test@example.com",
        role: "connector",
        first_name: "Test",
        last_name: "User",
        phone: "9876543214",
        city: "Delhi",
        area: "CP",
        commission_percentage: 3.0,
      },
    ];

    for (const user of testUsers) {
      try {
        // Insert user
        const [userResult] = await executeQuery(
          "INSERT IGNORE INTO users (email, password_hash, role) VALUES (?, ?, ?)",
          [user.email, hashedPassword, user.role]
        );

        if (userResult.affectedRows > 0) {
          const userId = userResult.insertId;

          // Insert user profile
          await executeQuery(
            "INSERT INTO user_profiles (user_id, first_name, last_name, phone) VALUES (?, ?, ?, ?)",
            [userId, user.first_name, user.last_name, user.phone]
          );

          // Insert role-specific data
          if (user.role === "connector") {
            const agentCode =
              "AG" +
              Date.now().toString().slice(-6) +
              Math.random().toString(36).substr(2, 3).toUpperCase();
            await executeQuery(
              "INSERT INTO connectors (user_id, agent_code, city, area, commission_percentage) VALUES (?, ?, ?, ?, ?)",
              [
                userId,
                agentCode,
                user.city,
                user.area,
                user.commission_percentage,
              ]
            );
          }

          if (user.role === "banker" && user.bank_id) {
            await executeQuery(
              "INSERT INTO bankers (user_id, bank_id, employee_id, designation, department, max_approval_limit) VALUES (?, ?, ?, ?, ?, ?)",
              [
                userId,
                user.bank_id,
                user.employee_id,
                user.designation,
                user.department,
                user.max_approval_limit,
              ]
            );
          }

          //console.log(`✅ Created test user: ${user.email} (${user.role})`);
        } else {
          //console.log(`ℹ️  User already exists: ${user.email}`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to create user ${user.email}:`, error.message);
      }
    }

    return NextResponse.json({
        success: true,
        testUsers
      })
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
