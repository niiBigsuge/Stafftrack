import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding StaffTrack database...");

  // 1. Company Attendance Policy
  const policy = await prisma.companyPolicy.upsert({
    where: { id: "default-policy" },
    update: {},
    create: {
      id: "default-policy",
      workStartTime: "08:30:00",
      workEndTime: "17:00:00",
      graceMinutes: 15,
      workingDays: JSON.stringify(["MON", "TUE", "WED", "THU", "FRI"]),
    },
  });
  console.log("Policy initialized:", policy);

  // 2. Departments
  const deptEngineering = await prisma.department.upsert({
    where: { name: "Engineering & Technology" },
    update: {},
    create: { name: "Engineering & Technology" },
  });

  const deptHR = await prisma.department.upsert({
    where: { name: "Human Resources" },
    update: {},
    create: { name: "Human Resources" },
  });

  const deptSales = await prisma.department.upsert({
    where: { name: "Sales & Client Growth" },
    update: {},
    create: { name: "Sales & Client Growth" },
  });

  const deptExecutive = await prisma.department.upsert({
    where: { name: "Executive Leadership" },
    update: {},
    create: { name: "Executive Leadership" },
  });

  // Common password hash for test accounts (Dev-OS universal password: devos123)
  const passwordHash = await bcrypt.hash("devos123", 10);

  // 3. Demo Users
  const users = [
    {
      email: "superadmin@stafftrack.local",
      fullName: "Alexander Vance",
      employeeCode: "EMP-000",
      role: Role.SUPER_ADMIN,
      departmentId: deptExecutive.id,
      jobTitle: "Chief Technology Officer & Super Admin",
    },
    {
      email: "admin@stafftrack.local",
      fullName: "Marcus Sterling",
      employeeCode: "EMP-001",
      role: Role.HR_ADMIN,
      departmentId: deptHR.id,
      jobTitle: "Head of People & HR",
    },
    {
      email: "manager@stafftrack.local",
      fullName: "Elena Rostova",
      employeeCode: "EMP-002",
      role: Role.MANAGER,
      departmentId: deptEngineering.id,
      jobTitle: "Engineering Manager",
    },
    {
      email: "staff@stafftrack.local",
      fullName: "Tariq Adeleke",
      employeeCode: "EMP-003",
      role: Role.STAFF,
      departmentId: deptEngineering.id,
      jobTitle: "Senior Fullstack Engineer",
    },
    {
      email: "sarah.chen@stafftrack.local",
      fullName: "Sarah Chen",
      employeeCode: "EMP-004",
      role: Role.STAFF,
      departmentId: deptEngineering.id,
      jobTitle: "UI/UX Product Designer",
    },
    {
      email: "kwame.mensah@stafftrack.local",
      fullName: "Kwame Mensah",
      employeeCode: "EMP-005",
      role: Role.STAFF,
      departmentId: deptSales.id,
      jobTitle: "Account Executive",
    },
    {
      email: "exec@stafftrack.local",
      fullName: "Victoria Hastings",
      employeeCode: "EMP-006",
      role: Role.EXECUTIVE,
      departmentId: deptExecutive.id,
      jobTitle: "Managing Director",
    },
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash,
        fullName: u.fullName,
        role: u.role,
        departmentId: u.departmentId,
        jobTitle: u.jobTitle,
      },
      create: {
        ...u,
        passwordHash,
      },
    });
    console.log(`Seeded user: ${user.fullName} (${user.role})`);
  }

  // Update Engineering Department Manager reference
  const manager = await prisma.user.findUnique({ where: { email: "manager@stafftrack.local" } });
  if (manager) {
    await prisma.department.update({
      where: { id: deptEngineering.id },
      data: { managerId: manager.id },
    });
  }

  console.log("Database seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
