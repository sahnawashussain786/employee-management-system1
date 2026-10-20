import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import { connectDB, disconnectDB } from "../db.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import { nextEmpId } from "../services/staff.js";
import Department from "../models/Department.js";
import LeaveType from "../models/LeaveType.js";
import Holiday from "../models/Holiday.js";
import CompanySettings from "../models/CompanySettings.js";
import Announcement from "../models/Announcement.js";
import Asset from "../models/Asset.js";
import Job from "../models/Recruitment.js";
import Training from "../models/Training.js";
import Goal from "../models/Goal.js";
import PerformanceReview from "../models/PerformanceReview.js";
import Project from "../models/Project.js";
import Payroll from "../models/Payroll.js";
import Attendance from "../models/Attendance.js";
import Notification from "../models/Notification.js";

dotenv.config();

const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "admin123";
const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD || "user123";

async function seed() {
  console.log("[seed] connecting to database...");
  await connectDB();
  console.log("[seed] connected. clearing existing data...");

  // Clear all collections
  const collections = await mongoose.connection.db.collections();
  for (const coll of collections) {
    await coll.deleteMany({});
  }

  console.log("[seed] creating departments...");
  const departments = await Department.create([
    {
      name: "Engineering",
      code: "ENG",
      description: "Software development and infrastructure",
      location: "Building A",
      budget: 500000,
    },
    {
      name: "Human Resources",
      code: "HR",
      description: "People operations and culture",
      location: "Building A",
      budget: 150000,
    },
    {
      name: "Finance",
      code: "FIN",
      description: "Accounting, payroll, and financial planning",
      location: "Building B",
      budget: 200000,
    },
    {
      name: "Marketing",
      code: "MKT",
      description: "Brand, growth, and communications",
      location: "Building B",
      budget: 180000,
    },
    {
      name: "Sales",
      code: "SALES",
      description: "Revenue generation and customer success",
      location: "Building C",
      budget: 250000,
    },
    {
      name: "Operations",
      code: "OPS",
      description: "Business operations and logistics",
      location: "Building C",
      budget: 120000,
    },
    {
      name: "Design",
      code: "DES",
      description: "Product and brand design",
      location: "Building A",
      budget: 90000,
    },
  ]);

  const engDept = departments[0]._id;
  const hrDept = departments[1]._id;

  console.log("[seed] creating employees and users...");

  // Create admin
  const adminEmployee = await Employee.create({
    empId: await nextEmpId(),
    firstName: "Sarah",
    lastName: "Chen",
    email: "sarah.chen@acme.com",
    phone: "+1-555-0100",
    gender: "female",
    dob: new Date("1985-03-15"),
    maritalStatus: "married",
    nationality: "American",
    address: {
      line1: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      country: "USA",
      zip: "94102",
    },
    emergencyContact: {
      name: "David Chen",
      relationship: "Spouse",
      phone: "+1-555-0101",
    },
    job: {
      designation: "Chief Technology Officer",
      title: "CTO",
      department: null,
      employmentType: "full-time",
      employmentStatus: "active",
      workLocation: "San Francisco",
      workShift: "General (09:00 – 18:00)",
      joiningDate: new Date("2018-01-15"),
    },
    salary: {
      currency: "USD",
      payFrequency: "monthly",
      basic: 180000,
      hra: 30000,
      bank: { bankName: "Chase", accountNumber: "****4567" },
    },
    skills: [
      "Leadership",
      "System Architecture",
      "Python",
      "Distributed Systems",
    ],
    languages: ["English", "Mandarin"],
  });

  const adminUser = await User.create({
    email: "sarah.chen@acme.com",
    password: SEED_ADMIN_PASSWORD,
    role: "admin",
    employee: adminEmployee._id,
    isActive: true,
  });
  adminEmployee.user = adminUser._id;
  await adminEmployee.save();

  // Create HR Manager
  const hrEmployee = await Employee.create({
    empId: await nextEmpId(),
    firstName: "Marcus",
    lastName: "Williams",
    email: "marcus.williams@acme.com",
    phone: "+1-555-0200",
    gender: "male",
    dob: new Date("1982-07-22"),
    maritalStatus: "married",
    nationality: "American",
    address: {
      line1: "456 Oak Avenue",
      city: "San Francisco",
      state: "CA",
      country: "USA",
      zip: "94103",
    },
    emergencyContact: {
      name: "Lisa Williams",
      relationship: "Spouse",
      phone: "+1-555-0201",
    },
    job: {
      designation: "HR Director",
      title: "HR Director",
      department: hrDept,
      employmentType: "full-time",
      employmentStatus: "active",
      workLocation: "San Francisco",
      workShift: "General (09:00 – 18:00)",
      joiningDate: new Date("2019-03-01"),
    },
    salary: {
      currency: "USD",
      payFrequency: "monthly",
      basic: 120000,
      hra: 20000,
    },
    skills: [
      "HR Strategy",
      "Talent Acquisition",
      "Employee Relations",
      "Compliance",
    ],
    languages: ["English"],
  });

  const hrUser = await User.create({
    email: "marcus.williams@acme.com",
    password: SEED_ADMIN_PASSWORD,
    role: "hr",
    employee: hrEmployee._id,
    isActive: true,
  });
  hrEmployee.user = hrUser._id;
  await hrEmployee.save();

  // Create Engineering Manager
  const engMgrEmployee = await Employee.create({
    empId: await nextEmpId(),
    firstName: "Priya",
    lastName: "Sharma",
    email: "priya.sharma@acme.com",
    phone: "+1-555-0300",
    gender: "female",
    dob: new Date("1988-11-08"),
    maritalStatus: "married",
    nationality: "Indian",
    address: {
      line1: "789 Tech Lane",
      city: "San Francisco",
      state: "CA",
      country: "USA",
      zip: "94104",
    },
    job: {
      designation: "Engineering Manager",
      title: "Engineering Manager",
      department: engDept,
      employmentType: "full-time",
      employmentStatus: "active",
      workLocation: "San Francisco",
      workShift: "General (09:00 – 18:00)",
      joiningDate: new Date("2020-06-15"),
    },
    salary: {
      currency: "USD",
      payFrequency: "monthly",
      basic: 145000,
      hra: 24000,
    },
    skills: ["Team Leadership", "React", "Node.js", "System Design", "AWS"],
    languages: ["English", "Hindi"],
  });

  const engMgrUser = await User.create({
    email: "priya.sharma@acme.com",
    password: SEED_ADMIN_PASSWORD,
    role: "manager",
    employee: engMgrEmployee._id,
    isActive: true,
  });
  engMgrEmployee.user = engMgrUser._id;
  await engMgrEmployee.save();

  // Create regular employees
  const employeesData = [
    {
      firstName: "James",
      lastName: " Rodriguez",
      email: "james.rodriguez@acme.com",
      phone: "+1-555-0400",
      gender: "male",
      dob: new Date("1992-05-10"),
      job: {
        department: engDept,
        designation: "Senior Software Engineer",
        employmentType: "full-time",
        employmentStatus: "active",
        workLocation: "San Francisco",
        joiningDate: new Date("2021-02-01"),
      },
      salary: { basic: 120000, hra: 20000 },
      skills: ["JavaScript", "React", "Node.js", "MongoDB"],
      reportingTo: engMgrEmployee._id,
    },
    {
      firstName: "Emily",
      lastName: " Tanaka",
      email: "emily.tanaka@acme.com",
      phone: "+1-555-0401",
      gender: "female",
      dob: new Date("1995-08-22"),
      job: {
        department: engDept,
        designation: "Software Engineer",
        employmentType: "full-time",
        employmentStatus: "active",
        workLocation: "San Francisco",
        joiningDate: new Date("2022-04-15"),
      },
      salary: { basic: 95000, hra: 15000 },
      skills: ["Python", "Django", "PostgreSQL", "Docker"],
      reportingTo: engMgrEmployee._id,
    },
    {
      firstName: "Michael",
      lastName: " Johnson",
      email: "michael.johnson@acme.com",
      phone: "+1-555-0402",
      gender: "male",
      dob: new Date("1989-12-03"),
      job: {
        department: engDept,
        designation: "DevOps Engineer",
        employmentType: "full-time",
        employmentStatus: "active",
        workLocation: "Remote",
        joiningDate: new Date("2021-08-01"),
      },
      salary: { basic: 115000, hra: 18000 },
      skills: ["AWS", "Kubernetes", "Terraform", "Linux", "CI/CD"],
      reportingTo: engMgrEmployee._id,
    },
    {
      firstName: "Aisha",
      lastName: " Patel",
      email: "aisha.patel@acme.com",
      phone: "+1-555-0500",
      gender: "female",
      dob: new Date("1991-03-17"),
      job: {
        department: departments[3]._id,
        designation: "Marketing Manager",
        employmentType: "full-time",
        employmentStatus: "active",
        workLocation: "San Francisco",
        joiningDate: new Date("2020-09-01"),
      },
      salary: { basic: 105000, hra: 17000 },
      skills: [
        "Content Strategy",
        "SEO",
        "Social Media",
        "Analytics",
        "Copywriting",
      ],
      languages: ["English", "Gujarati"],
    },
    {
      firstName: "David",
      lastName: " Kim",
      email: "david.kim@acme.com",
      phone: "+1-555-0501",
      gender: "male",
      dob: new Date("1987-09-25"),
      job: {
        department: departments[4]._id,
        designation: "Sales Manager",
        employmentType: "full-time",
        employmentStatus: "active",
        workLocation: "New York",
        joiningDate: new Date("2019-05-01"),
      },
      salary: {
        basic: 110000,
        hra: 19000,
        allowances: [{ name: "Commission", amount: 2000 }],
      },
      skills: ["Negotiation", "CRM", "B2B Sales", "Pipeline Management"],
      languages: ["English", "Korean"],
    },
    {
      firstName: "Sofia",
      lastName: " Martinez",
      email: "sofia.martinez@acme.com",
      phone: "+1-555-0600",
      gender: "female",
      dob: new Date("1994-06-14"),
      job: {
        department: departments[5]._id,
        designation: "Operations Coordinator",
        employmentType: "full-time",
        employmentStatus: "active",
        workLocation: "San Francisco",
        joiningDate: new Date("2022-01-10"),
      },
      salary: { basic: 75000, hra: 12000 },
      skills: [
        "Process Improvement",
        "Project Management",
        "Excel",
        "Communication",
      ],
      languages: ["English", "Spanish"],
    },
    {
      firstName: "Alex",
      lastName: " Thompson",
      email: "alex.thompson@acme.com",
      phone: "+1-555-0601",
      gender: "male",
      dob: new Date("1993-01-28"),
      job: {
        department: departments[2]._id,
        designation: "Financial Analyst",
        employmentType: "full-time",
        employmentStatus: "active",
        workLocation: "San Francisco",
        joiningDate: new Date("2021-11-01"),
      },
      salary: { basic: 85000, hra: 14000 },
      skills: ["Financial Modeling", "Excel", "SQL", "Tableau", "Budgeting"],
    },
    {
      firstName: "Rachel",
      lastName: " Green",
      email: "rachel.green@acme.com",
      phone: "+1-555-0602",
      gender: "female",
      dob: new Date("1996-04-09"),
      job: {
        department: departments[6]._id,
        designation: "UX Designer",
        employmentType: "full-time",
        employmentStatus: "active",
        workLocation: "Remote",
        joiningDate: new Date("2023-02-01"),
      },
      salary: { basic: 88000, hra: 14000 },
      skills: [
        "Figma",
        "User Research",
        "Prototyping",
        "Design Systems",
        "UI Design",
      ],
      languages: ["English", "Hebrew"],
    },
    {
      firstName: "Kevin",
      lastName: " Nguyen",
      email: "kevin.nguyen@acme.com",
      phone: "+1-555-0700",
      gender: "male",
      dob: new Date("1997-10-20"),
      job: {
        department: engDept,
        designation: "Junior Software Engineer",
        employmentType: "full-time",
        employmentStatus: "active",
        workLocation: "San Francisco",
        joiningDate: new Date("2023-07-01"),
      },
      salary: { basic: 72000, hra: 11000 },
      skills: ["JavaScript", "React", "HTML/CSS"],
      reportingTo: engMgrEmployee._id,
    },
    {
      firstName: "Emma",
      lastName: " Wilson",
      email: "emma.wilson@acme.com",
      phone: "+1-555-0701",
      gender: "female",
      dob: new Date("1990-02-11"),
      job: {
        department: departments[1]._id,
        designation: "HR Specialist",
        employmentType: "full-time",
        employmentStatus: "active",
        workLocation: "San Francisco",
        joiningDate: new Date("2022-03-15"),
      },
      salary: { basic: 68000, hra: 11000 },
      skills: ["Recruitment", "Onboarding", "HRIS", "Employee Engagement"],
      languages: ["English", "French"],
    },
  ];

  const employees = [];
  for (const data of employeesData) {
    const emp = await Employee.create({ ...data, empId: await nextEmpId() });
    const user = await User.create({
      email: data.email,
      password: SEED_USER_PASSWORD,
      role: "employee",
      employee: emp._id,
      isActive: true,
    });
    emp.user = user._id;
    await emp.save();
    employees.push(emp);
  }

  // Set department heads
  await Department.findByIdAndUpdate(engDept, { head: engMgrEmployee._id });
  await Department.findByIdAndUpdate(hrDept, { head: hrEmployee._id });

  console.log("[seed] creating leave types...");
  await LeaveType.create([
    {
      name: "Annual Leave",
      code: "AL",
      daysPerYear: 20,
      isPaid: true,
      color: "#6366f1",
      description: "Paid annual/vacation leave",
      requiresApproval: true,
      carryForwardLimit: 10,
    },
    {
      name: "Sick Leave",
      code: "SL",
      daysPerYear: 10,
      isPaid: true,
      color: "#ef4444",
      description: "Paid sick leave for illness or medical appointments",
      requiresApproval: false,
    },
    {
      name: "Casual Leave",
      code: "CL",
      daysPerYear: 5,
      isPaid: true,
      color: "#f59e0b",
      description: "Short-notice personal leave",
      requiresApproval: true,
    },
    {
      name: "Maternity Leave",
      code: "ML",
      daysPerYear: 90,
      isPaid: true,
      color: "#ec4899",
      description: "Paid maternity leave for new mothers",
      requiresApproval: true,
      carryForwardLimit: 30,
    },
    {
      name: "Paternity Leave",
      code: "PL",
      daysPerYear: 10,
      isPaid: true,
      color: "#3b82f6",
      description: "Paid paternity leave for new fathers",
      requiresApproval: true,
    },
    {
      name: "Unpaid Leave",
      code: "UL",
      daysPerYear: 30,
      isPaid: false,
      color: "#6b7280",
      description: "Unpaid leave for extended personal reasons",
      requiresApproval: true,
    },
    {
      name: "Compensatory Off",
      code: "CO",
      daysPerYear: 10,
      isPaid: true,
      color: "#10b981",
      description: "Compensatory off for working on holidays/weekends",
      requiresApproval: false,
    },
  ]);

  console.log("[seed] creating holidays...");
  const now = new Date();
  const currentYear = now.getFullYear();
  await Holiday.create([
    {
      name: "New Year's Day",
      date: new Date(`${currentYear}-01-01`),
      type: "public",
      description: "Celebrate the start of the new year",
    },
    {
      name: "Martin Luther King Jr. Day",
      date: new Date(`${currentYear}-01-15`),
      type: "public",
      description: "Honoring civil rights leader Martin Luther King Jr.",
    },
    {
      name: "Presidents' Day",
      date: new Date(`${currentYear}-02-19`),
      type: "public",
      description: "Honoring U.S. presidents",
    },
    {
      name: "Memorial Day",
      date: new Date(`${currentYear}-05-27`),
      type: "public",
      description: "Honoring fallen military service members",
    },
    {
      name: "Independence Day",
      date: new Date(`${currentYear}-07-04`),
      type: "public",
      description: "Celebrating U.S. independence",
    },
    {
      name: "Labor Day",
      date: new Date(`${currentYear}-09-02`),
      type: "public",
      description: "Honoring the contributions of workers",
    },
    {
      name: "Thanksgiving Day",
      date: new Date(`${currentYear}-11-26`),
      type: "public",
      description: "Harvest festival and family gathering",
    },
    {
      name: "Christmas Day",
      date: new Date(`${currentYear}-12-25`),
      type: "public",
      description: "Christmas holiday",
    },
    {
      name: "Company Foundation Day",
      date: new Date(`${currentYear}-03-15`),
      type: "company",
      description: "Annual celebration of our company founding",
    },
    {
      name: "Team Building Day",
      date: new Date(`${currentYear}-06-14`),
      type: "company",
      description: "Annual team building event",
    },
  ]);

  console.log("[seed] creating company settings...");
  await CompanySettings.create({
    key: "general",
    companyName: "Acme Corporation",
    legalName: "Acme Corporation Inc.",
    website: "https://acme.com",
    industry: "Technology",
    founded: 2015,
    email: "hr@acme.com",
    phone: "+1-555-0000",
    address: {
      line1: "100 Innovation Drive",
      city: "San Francisco",
      state: "CA",
      country: "USA",
      zip: "94105",
    },
    timezone: "America/Los_Angeles",
    currency: "USD",
    dateFormat: "YYYY-MM-DD",
    workWeek: [1, 2, 3, 4, 5],
    workStartTime: "09:00",
    workEndTime: "18:00",
    lateGraceMinutes: 15,
    standardWorkMinutes: 480,
    overtimeThresholdMinutes: 480,
    fiscalYearStartMonth: 1,
    payrollDay: 1,
    payroll: {
      pfPercent: 12,
      taxPercent: 10,
      professionalTax: 200,
      insurance: 150,
      enablePf: true,
      enableTax: true,
    },
    autoMarkAbsent: true,
    leaveYearStartMonth: 1,
  });

  console.log("[seed] creating announcements...");
  await Announcement.create([
    {
      title: "Welcome to the Team!",
      body: "We are excited to have our new employees join Acme Corporation. Please reach out to HR for onboarding schedules.",
      category: "general",
      audience: "all",
      isPinned: true,
      publishedBy: hrUser._id,
    },
    {
      title: "Office Holiday Schedule",
      body: "The office will be closed on December 25th and January 1st. Please plan your leave accordingly. The last working day before Christmas is December 24th (half-day).",
      category: "policy",
      audience: "all",
      publishedBy: hrUser._id,
    },
    {
      title: "New Benefits Program",
      body: "We are launching a new health benefits program starting next month. Details will be shared in the upcoming all-hands meeting. Dental, vision, and enhanced life insurance options are now available.",
      category: "benefit",
      audience: "all",
      publishedBy: hrUser._id,
    },
    {
      title: "Q1 All-Hands Meeting",
      body: "Join us for the quarterly all-hands meeting where we will discuss company goals, project updates, and recognize outstanding team members. Date: March 10th, 2:00 PM in the main auditorium.",
      category: "event",
      audience: "all",
      publishedBy: adminUser._id,
    },
    {
      title: "Security Update Required",
      body: "All employees must update their workstation security settings by end of this week. Please follow the IT security guidelines document. Contact IT support for assistance.",
      category: "urgent",
      audience: "all",
      publishedBy: adminUser._id,
    },
  ]);

  console.log("[seed] creating assets...");
  await Asset.create([
    {
      name: 'MacBook Pro 16"',
      assetTag: "AST-001",
      assetType: "laptop",
      brand: "Apple",
      model: "MacBook Pro M3",
      serialNumber: "C02XG1ABCDEF",
      status: "assigned",
      purchaseDate: new Date("2023-06-15"),
      purchaseCost: 3499,
      warrantyUntil: new Date("2026-06-15"),
      condition: "good",
      assignedTo: employees[0]._id,
      assignedBy: hrUser._id,
      location: "San Francisco",
      notes: "Primary development machine",
    },
    {
      name: 'Dell UltraSharp 27"',
      assetTag: "AST-002",
      assetType: "monitor",
      brand: "Dell",
      model: "U2723QE",
      serialNumber: "DG7HF2XYZ",
      status: "assigned",
      purchaseDate: new Date("2023-06-15"),
      purchaseCost: 599,
      assignedTo: employees[0]._id,
      assignedBy: hrUser._id,
      location: "San Francisco",
    },
    {
      name: 'MacBook Air 15"',
      assetTag: "AST-003",
      assetType: "laptop",
      brand: "Apple",
      model: "MacBook Air M3",
      serialNumber: "C02XG4GHIJKL",
      status: "assigned",
      purchaseDate: new Date("2023-08-01"),
      purchaseCost: 1999,
      warrantyUntil: new Date("2026-08-01"),
      assignedTo: employees[1]._id,
      assignedBy: hrUser._id,
      location: "San Francisco",
    },
    {
      name: "Dell XPS 15",
      assetTag: "AST-004",
      assetType: "laptop",
      brand: "Dell",
      model: "XPS 15 9530",
      serialNumber: "210300ABC123",
      status: "assigned",
      purchaseDate: new Date("2023-03-10"),
      purchaseCost: 2299,
      warrantyUntil: new Date("2026-03-10"),
      assignedTo: employees[2]._id,
      assignedBy: hrUser._id,
      location: "Remote",
    },
    {
      name: "Logitech MX Master 3S",
      assetTag: "AST-005",
      assetType: "other",
      brand: "Logitech",
      model: "MX Master 3S",
      serialNumber: "LM3S001",
      status: "assigned",
      purchaseDate: new Date("2023-06-15"),
      purchaseCost: 99,
      assignedTo: employees[0]._id,
      assignedBy: hrUser._id,
    },
    {
      name: "Sony WH-1000XM5",
      assetTag: "AST-006",
      assetType: "headset",
      brand: "Sony",
      model: "WH-1000XM5",
      serialNumber: "SNYXM5001",
      status: "available",
      purchaseDate: new Date("2023-09-01"),
      purchaseCost: 399,
      condition: "new",
      location: "Equipment Room A",
    },
    {
      name: "iPhone 15 Pro",
      assetTag: "AST-007",
      assetType: "phone",
      brand: "Apple",
      model: "iPhone 15 Pro",
      serialNumber: "DNQJG1XYZ",
      status: "assigned",
      purchaseDate: new Date("2023-10-01"),
      purchaseCost: 1199,
      assignedTo: employees[4]._id,
      assignedBy: hrUser._id,
      location: "New York",
    },
    {
      name: "Standing Desk",
      assetTag: "AST-008",
      assetType: "furniture",
      brand: "IKEA",
      model: "IDASEN",
      serialNumber: "IKEDESK001",
      status: "assigned",
      purchaseDate: new Date("2023-04-15"),
      purchaseCost: 499,
      assignedTo: employees[3]._id,
      assignedBy: hrUser._id,
      location: "San Francisco",
    },
    {
      name: "Company ID Cards (10 pack)",
      assetTag: "AST-009",
      assetType: "id-card",
      brand: "HID",
      model: "Proxima",
      serialNumber: "HID001",
      status: "available",
      purchaseDate: new Date("2023-01-01"),
      purchaseCost: 200,
      location: "HR Office",
    },
  ]);

  console.log("[seed] creating job postings (recruitment)...");
  await Job.create([
    {
      title: "Senior Frontend Engineer",
      department: engDept,
      location: "San Francisco",
      employmentType: "full-time",
      experienceMin: 5,
      experienceMax: 8,
      salaryMin: 130000,
      salaryMax: 160000,
      openings: 2,
      description:
        "We are looking for an experienced frontend engineer to lead the development of our next-generation user interfaces.",
      requirements: [
        "5+ years of frontend development experience",
        "Expert in React and modern JavaScript",
        "Experience with TypeScript",
        "Strong understanding of web performance",
      ],
      responsibilities: [
        "Lead frontend architecture decisions",
        "Mentor junior developers",
        "Collaborate with design team",
        "Drive frontend best practices",
      ],
      skills: ["React", "TypeScript", "CSS", "Testing"],
      status: "open",
      postedOn: new Date(),
      closingDate: new Date("2026-03-31"),
      hiringManager: engMgrUser._id,
      createdBy: hrUser._id,
    },
    {
      title: "Product Designer",
      department: departments[6]._id,
      location: "Remote",
      employmentType: "full-time",
      experienceMin: 3,
      experienceMax: 6,
      salaryMin: 90000,
      salaryMax: 120000,
      openings: 1,
      description:
        "Join our design team to create beautiful, intuitive user experiences for our products.",
      requirements: [
        "3+ years of product design experience",
        "Portfolio showcasing UI/UX work",
        "Experience with Figma",
        "Understanding of user research methods",
      ],
      responsibilities: [
        "Design user interfaces for web and mobile",
        "Conduct user research and usability testing",
        "Create design systems and style guides",
        "Collaborate with engineering and product teams",
      ],
      skills: ["Figma", "User Research", "Prototyping", "Design Systems"],
      status: "open",
      postedOn: new Date(),
      isRemote: true,
      hiringManager: adminUser._id,
      createdBy: hrUser._id,
    },
    {
      title: "Sales Representative",
      department: departments[4]._id,
      location: "New York",
      employmentType: "full-time",
      experienceMin: 2,
      experienceMax: 5,
      salaryMin: 60000,
      salaryMax: 80000,
      openings: 3,
      description:
        "Join our sales team to drive revenue growth and build lasting customer relationships.",
      requirements: [
        "2+ years of B2B sales experience",
        "Excellent communication skills",
        "Experience with CRM tools",
        "Self-motivated and goal-oriented",
      ],
      responsibilities: [
        "Generate and pursue sales leads",
        "Build and maintain client relationships",
        "Meet and exceed sales targets",
        "Prepare sales reports and forecasts",
      ],
      skills: ["Sales", "Negotiation", "CRM", "Communication"],
      status: "open",
      postedOn: new Date(),
      closingDate: new Date("2026-02-28"),
      hiringManager: hrUser._id,
      createdBy: hrUser._id,
    },
    {
      title: "Data Analyst",
      department: departments[2]._id,
      location: "San Francisco",
      employmentType: "full-time",
      experienceMin: 2,
      experienceMax: 4,
      salaryMin: 75000,
      salaryMax: 95000,
      openings: 1,
      description:
        "Analyze financial data and provide insights to support strategic decision-making.",
      requirements: [
        "2+ years of data analysis experience",
        "Strong SQL and Excel skills",
        "Experience with data visualization tools",
        "Financial acumen",
      ],
      responsibilities: [
        "Analyze financial and operational data",
        "Create reports and dashboards",
        "Support budget planning",
        "Identify trends and insights",
      ],
      skills: ["SQL", "Excel", "Tableau", "Python"],
      status: "open",
      postedOn: new Date(),
      createdBy: hrUser._id,
    },
  ]);

  // Create applications for the first job posting
  const firstJob = await Job.findOne({ title: "Senior Frontend Engineer" });
  if (firstJob) {
    await (
      await import("../models/Recruitment.js")
    ).then(({ Application }) => {
      return Application.create([
        {
          job: firstJob._id,
          candidate: {
            name: "Jordan Lee",
            email: "jordan.lee@email.com",
            phone: "+1-555-1001",
            resumeUrl: "https://resume.example.com/jordan",
            linkedin: "https://linkedin.com/in/jordanlee",
            experienceYears: 6,
            currentCompany: "Tech Corp",
            expectedSalary: 145000,
            skills: ["React", "TypeScript", "Node.js", "GraphQL", "AWS"],
          },
          source: "linkedin",
          stage: "interview",
          stageHistory: [
            { stage: "applied", at: new Date("2026-01-10") },
            { stage: "screening", at: new Date("2026-01-12"), by: hrUser._id },
            {
              stage: "interview",
              at: new Date("2026-01-15"),
              by: engMgrUser._id,
            },
          ],
          rating: 4,
          interview: {
            scheduledAt: new Date("2026-01-20T14:00:00"),
            interviewer: "Priya Sharma",
            mode: "video",
            result: "clear",
          },
          notes: "Strong React experience, good system design knowledge.",
          appliedAt: new Date("2026-01-10"),
        },
        {
          job: firstJob._id,
          candidate: {
            name: "Taylor Brown",
            email: "taylor.brown@email.com",
            phone: "+1-555-1002",
            resumeUrl: "https://resume.example.com/taylor",
            experienceYears: 4,
            currentCompany: "Startup Inc",
            expectedSalary: 130000,
            skills: ["JavaScript", "React", "Vue.js", "CSS", "Webpack"],
          },
          source: "careers-page",
          stage: "screening",
          stageHistory: [{ stage: "applied", at: new Date("2026-01-12") }],
          rating: 3,
          interview: { mode: "video", result: "pending" },
          notes: "Good frontend skills, needs system design improvement.",
          appliedAt: new Date("2026-01-12"),
        },
        {
          job: firstJob._id,
          candidate: {
            name: "Morgan Davis",
            email: "morgan.davis@email.com",
            phone: "+1-555-1003",
            resumeUrl: "https://resume.example.com/morgan",
            experienceYears: 7,
            currentCompany: "Big Tech Co",
            expectedSalary: 155000,
            skills: [
              "React",
              "TypeScript",
              "Next.js",
              "Testing",
              "Performance",
            ],
          },
          source: "referral",
          stage: "applied",
          stageHistory: [{ stage: "applied", at: new Date("2026-01-14") }],
          rating: 0,
          appliedAt: new Date("2026-01-14"),
        },
      ]);
    });
  }

  console.log("[seed] creating training programs...");
  await Training.create([
    {
      title: "New Employee Onboarding",
      code: "ONB-001",
      description:
        "Mandatory onboarding program for all new hires covering company culture, policies, and tools.",
      category: "onboarding",
      provider: "Internal",
      instructor: "Marcus Williams",
      mode: "hybrid",
      durationHours: 16,
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-02-02"),
      capacity: 30,
      passingScore: 70,
      status: "upcoming",
      mandatory: true,
      createdBy: hrUser._id,
    },
    {
      title: "Advanced React Patterns",
      code: "TRN-001",
      description:
        "Deep dive into advanced React patterns including hooks, context, and state management.",
      category: "technical",
      provider: "Third Party",
      instructor: "React Academy",
      mode: "online",
      durationHours: 24,
      startDate: new Date("2026-02-10"),
      endDate: new Date("2026-02-12"),
      capacity: 15,
      passingScore: 75,
      status: "upcoming",
      mandatory: false,
      createdBy: engMgrUser._id,
    },
    {
      title: "Leadership Development Program",
      code: "TRN-002",
      description:
        "Quarterly leadership training for managers and team leads focusing on people management and strategic thinking.",
      category: "leadership",
      provider: "External Consultant",
      instructor: "Dr. Sarah Mitchell",
      mode: "in-person",
      durationHours: 40,
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-03-05"),
      capacity: 20,
      passingScore: 60,
      status: "upcoming",
      mandatory: true,
      createdBy: hrUser._id,
    },
    {
      title: "Cybersecurity Awareness",
      code: "TRN-003",
      description:
        "Annual cybersecurity training covering phishing, data protection, and secure practices.",
      category: "compliance",
      provider: "Internal",
      instructor: "IT Security Team",
      mode: "online",
      durationHours: 4,
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-01-31"),
      capacity: 100,
      passingScore: 80,
      status: "ongoing",
      mandatory: true,
      createdBy: adminUser._id,
    },
    {
      title: "Effective Communication Skills",
      code: "TRN-004",
      description:
        "Workshop on effective written and verbal communication in the workplace.",
      category: "soft-skills",
      provider: "External Consultant",
      instructor: "Communication Pro",
      mode: "in-person",
      durationHours: 8,
      startDate: new Date("2026-02-20"),
      endDate: new Date("2026-02-20"),
      capacity: 25,
      passingScore: 60,
      status: "upcoming",
      mandatory: false,
      createdBy: hrUser._id,
    },
  ]);

  // Enroll some employees
  const trainings = await Training.find();
  if (trainings.length > 0) {
    await Training.findByIdAndUpdate(trainings[3]._id, {
      $push: {
        enrollments: {
          employee: employees[0]._id,
          status: "enrolled",
          progress: 75,
        },
      },
    });
    await Training.findByIdAndUpdate(trainings[3]._id, {
      $push: {
        enrollments: {
          employee: employees[1]._id,
          status: "in-progress",
          progress: 40,
        },
      },
    });
    await Training.findByIdAndUpdate(trainings[3]._id, {
      $push: {
        enrollments: {
          employee: employees[2]._id,
          status: "enrolled",
          progress: 60,
        },
      },
    });
  }

  console.log("[seed] creating goals...");
  await Goal.create([
    {
      employee: employees[0]._id,
      title: "Lead migration to microservices architecture",
      description:
        "Design and implement the migration of the monolith application to microservices, improving scalability and deployment independence.",
      category: "okr",
      priority: "high",
      progress: 45,
      status: "in-progress",
      startDate: new Date("2026-01-01"),
      dueDate: new Date("2026-06-30"),
      createdBy: engMgrUser._id,
    },
    {
      employee: employees[0]._id,
      title: "Mentor 2 junior developers",
      description:
        "Provide regular mentorship sessions and code reviews for 2 junior team members to help them grow.",
      category: "development",
      priority: "medium",
      progress: 60,
      status: "in-progress",
      startDate: new Date("2026-01-01"),
      dueDate: new Date("2026-06-30"),
      createdBy: engMgrUser._id,
    },
    {
      employee: employees[1]._id,
      title: "Complete AWS Solutions Architect certification",
      description:
        "Study for and pass the AWS Solutions Architect Associate certification exam.",
      category: "development",
      priority: "high",
      progress: 30,
      status: "in-progress",
      startDate: new Date("2026-01-15"),
      dueDate: new Date("2026-04-30"),
      createdBy: engMgrUser._id,
    },
    {
      employee: employees[2]._id,
      title: "Implement automated deployment pipeline",
      description:
        "Create a fully automated CI/CD pipeline reducing deployment time by 50%.",
      category: "okr",
      priority: "critical",
      progress: 70,
      status: "in-progress",
      startDate: new Date("2026-01-01"),
      dueDate: new Date("2026-03-31"),
      createdBy: engMgrUser._id,
    },
    {
      employee: employees[3]._id,
      title: "Increase social media engagement by 25%",
      description:
        "Develop and execute a social media strategy to increase engagement rates across all platforms.",
      category: "okr",
      priority: "high",
      progress: 20,
      status: "in-progress",
      startDate: new Date("2026-02-01"),
      dueDate: new Date("2026-06-30"),
      createdBy: hrUser._id,
    },
    {
      employee: employees[4]._id,
      title: "Close $1M in new sales",
      description:
        "Achieve $1 million in new sales revenue for the quarter through new client acquisition and upselling.",
      category: "okr",
      priority: "critical",
      progress: 35,
      status: "in-progress",
      startDate: new Date("2026-01-01"),
      dueDate: new Date("2026-03-31"),
      createdBy: hrUser._id,
    },
    {
      employee: employees[5]._id,
      title: "Optimize inventory management process",
      description:
        "Review and optimize the inventory management workflow to reduce waste and improve efficiency.",
      category: "task",
      priority: "medium",
      progress: 50,
      status: "in-progress",
      startDate: new Date("2026-02-01"),
      dueDate: new Date("2026-04-30"),
      createdBy: hrUser._id,
    },
    {
      employee: employees[0]._id,
      title: "Complete compliance training",
      description:
        "Complete all mandatory compliance and security training modules for the year.",
      category: "compliance",
      priority: "high",
      progress: 80,
      status: "in-progress",
      startDate: new Date("2026-01-01"),
      dueDate: new Date("2026-03-31"),
      createdBy: adminUser._id,
    },
  ]);

  console.log("[seed] creating performance reviews...");
  await PerformanceReview.create([
    {
      employee: employees[0]._id,
      reviewer: engMgrUser._id,
      period: {
        label: "Q4 2025",
        startDate: new Date("2025-10-01"),
        endDate: new Date("2025-12-31"),
      },
      status: "completed",
      ratings: [
        {
          category: "Quality of Work",
          rating: 4,
          comment: "Consistently delivers high-quality code.",
        },
        {
          category: "Productivity",
          rating: 5,
          comment: "Excellent output and efficiency.",
        },
        {
          category: "Communication",
          rating: 4,
          comment: "Good communication with team members.",
        },
        {
          category: "Teamwork",
          rating: 4,
          comment: "Great team player, helps others.",
        },
        {
          category: "Reliability",
          rating: 5,
          comment: "Always reliable and accountable.",
        },
      ],
      overallRating: 4.4,
      strengths:
        "Technical expertise, problem-solving abilities, dedication to quality.",
      improvements:
        "Could take more initiative in leading technical discussions.",
      comments:
        "James is an outstanding senior engineer who consistently delivers excellent work.",
      recommendation: "raise",
      completedAt: new Date("2026-01-10"),
      acknowledgedAt: new Date("2026-01-12"),
    },
    {
      employee: employees[1]._id,
      reviewer: engMgrUser._id,
      period: {
        label: "Q4 2025",
        startDate: new Date("2025-10-01"),
        endDate: new Date("2025-12-31"),
      },
      status: "acknowledged",
      ratings: [
        {
          category: "Quality of Work",
          rating: 4,
          comment: "Good code quality, learning quickly.",
        },
        {
          category: "Productivity",
          rating: 3,
          comment: "Steady progress, improving speed.",
        },
        {
          category: "Communication",
          rating: 4,
          comment: "Communicates well with the team.",
        },
        {
          category: "Teamwork",
          rating: 4,
          comment: "Good collaborative skills.",
        },
        {
          category: "Reliability",
          rating: 4,
          comment: "Reliable and punctual.",
        },
      ],
      overallRating: 3.8,
      strengths: "Quick learner, good attitude, strong fundamentals.",
      improvements:
        "Continue building confidence in independent decision-making.",
      comments:
        "Emily is a promising engineer with great potential. Continue growing!",
      recommendation: "training",
      completedAt: new Date("2026-01-08"),
      acknowledgedAt: new Date("2026-01-10"),
    },
  ]);

  console.log("[seed] creating projects...");
  await Project.create([
    {
      name: "Mobile App Redesign",
      code: "PROJ-001",
      description:
        "Complete redesign of the customer mobile application with modern UI and improved user experience.",
      client: "Acme Internal",
      status: "active",
      priority: "high",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-06-30"),
      deadline: new Date("2026-06-30"),
      budget: 250000,
      billable: false,
      progress: 35,
      members: [
        {
          employee: employees[0]._id,
          role: "Tech Lead",
          allocationPercent: 50,
        },
        {
          employee: employees[1]._id,
          role: "Developer",
          allocationPercent: 70,
        },
        { employee: employees[7]._id, role: "Designer", allocationPercent: 60 },
      ],
      tags: ["mobile", "redesign", "ui-ux"],
      createdBy: adminUser._id,
    },
    {
      name: "Cloud Migration",
      code: "PROJ-002",
      description:
        "Migrate existing on-premise infrastructure to AWS cloud for improved scalability and cost efficiency.",
      client: "Acme Internal",
      status: "active",
      priority: "critical",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-09-30"),
      deadline: new Date("2026-09-30"),
      budget: 500000,
      billable: false,
      progress: 15,
      members: [
        {
          employee: employees[2]._id,
          role: "DevOps Lead",
          allocationPercent: 80,
        },
        {
          employee: employees[0]._id,
          role: "Architect",
          allocationPercent: 30,
        },
      ],
      tags: ["cloud", "aws", "infrastructure", "migration"],
      createdBy: adminUser._id,
    },
    {
      name: "Customer Portal v2",
      code: "PROJ-003",
      description:
        "Build a new customer portal with enhanced features including self-service, ticketing, and analytics dashboard.",
      client: "Acme Internal",
      status: "planned",
      priority: "high",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-10-31"),
      deadline: new Date("2026-10-31"),
      budget: 350000,
      billable: false,
      progress: 0,
      members: [
        {
          employee: employees[0]._id,
          role: "Tech Lead",
          allocationPercent: 40,
        },
        {
          employee: employees[3]._id,
          role: "Product Owner",
          allocationPercent: 50,
        },
      ],
      tags: ["portal", "customer", "web"],
      createdBy: adminUser._id,
    },
    {
      name: "Marketing Campaign - Q1",
      code: "PROJ-004",
      description:
        "Q1 marketing campaign including social media, email marketing, and content creation.",
      client: "Acme Internal",
      status: "active",
      priority: "medium",
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-03-31"),
      deadline: new Date("2026-03-31"),
      budget: 50000,
      billable: false,
      progress: 60,
      members: [
        {
          employee: employees[3]._id,
          role: "Campaign Manager",
          allocationPercent: 70,
        },
      ],
      tags: ["marketing", "campaign", "q1"],
      createdBy: hrUser._id,
    },
  ]);

  console.log("[seed] creating payroll records...");
  const months = [11, 12];
  const years = [2025];
  for (const emp of employees) {
    for (const month of months) {
      for (const year of years) {
        const basic = emp.salary?.basic || 0;
        const hra = emp.salary?.hra || 0;
        const monthlyGross = basic + hra;
        const pf = Math.round(monthlyGross * 0.12);
        const tax = Math.round(monthlyGross * 0.1);
        const professionalTax = 200;
        const insurance = 150;
        const totalDeductions = pf + tax + professionalTax + insurance;
        const net = monthlyGross - totalDeductions;

        await Payroll.create({
          employee: emp._id,
          payslipNo: `PAYS-${year}${String(month).padStart(2, "0")}-${emp.empId}`,
          period: { month, year },
          earnings: { basic, hra, bonus: 0, overtime: 0, arrears: 0 },
          deductions: { pf, tax, professionalTax, insurance, loans: 0 },
          gross: monthlyGross,
          totalDeductions,
          net,
          workingDays: 22,
          paidDays: 22,
          lopDays: 0,
          currency: "USD",
          status: "paid",
          paymentDate: new Date(`${year}-${String(month).padStart(2, "0")}-28`),
          paymentMethod: "Bank transfer",
          generatedBy: hrUser._id,
        });
      }
    }
  }

  console.log("[seed] creating attendance records...");
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  for (const emp of employees) {
    let currentDate = new Date(startOfYear);
    while (currentDate <= today) {
      const dayOfWeek = currentDate.getDay();
      const workWeek = [1, 2, 3, 4, 5]; // Mon-Fri

      // Skip weekends
      if (!workWeek.includes(dayOfWeek)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Check for holidays
      const isHoliday = await Holiday.findOne({ date: currentDate });
      if (isHoliday) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // 85% chance of attendance record
      if (Math.random() < 0.85) {
        const checkInHour = 8 + Math.floor(Math.random() * 2); // 8-9 AM
        const checkInMin = Math.floor(Math.random() * 60);
        const checkOutHour = 17 + Math.floor(Math.random() * 2); // 5-6 PM
        const checkOutMin = Math.floor(Math.random() * 60);

        const checkIn = new Date(currentDate);
        checkIn.setHours(checkInHour, checkInMin, 0, 0);
        const checkOut = new Date(currentDate);
        checkOut.setHours(checkOutHour, checkOutMin, 0, 0);

        const workedMinutes = Math.round((checkOut - checkIn) / 60000);
        const lateBy = checkInHour * 60 + checkInMin - 540; // 9 AM = 540 min
        const status = lateBy > 15 ? "late" : "present";

        await Attendance.create({
          employee: emp._id,
          date: currentDate,
          checkIn,
          checkOut,
          status,
          workedMinutes,
          overtimeMinutes: Math.max(0, workedMinutes - 480),
          lateByMinutes: Math.max(0, lateBy),
          source: "system",
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  console.log("[seed] creating notifications...");
  await Notification.create([
    {
      user: employees[0]._id,
      title: "Welcome to Acme!",
      message: "Welcome aboard! Please complete your onboarding checklist.",
      type: "system",
      read: false,
    },
    {
      user: employees[1]._id,
      title: "Leave Balance Updated",
      message:
        "Your leave balance for 2026 has been updated. You have 20 days of annual leave available.",
      type: "leave",
      read: false,
    },
    {
      user: employees[2]._id,
      title: "New Project Assigned",
      message:
        "You have been assigned to the Cloud Migration project as DevOps Lead.",
      type: "system",
      read: true,
    },
    {
      user: hrUser._id,
      title: "New Leave Request",
      message: "James Rodriguez has requested 3 days of annual leave.",
      type: "leave",
      read: false,
    },
    {
      user: adminUser._id,
      title: "System Update",
      message:
        "The employee management system has been updated to the latest version.",
      type: "system",
      read: true,
    },
  ]);

  console.log("[seed] seeding complete!");
  console.log("");
  console.log("========================================");
  console.log("  ACCOUNT DETAILS");
  console.log("========================================");
  console.log(`  Admin:    sarah.chen@acme.com / ${SEED_ADMIN_PASSWORD}`);
  console.log(`  HR:       marcus.williams@acme.com / ${SEED_ADMIN_PASSWORD}`);
  console.log(`  Manager:  priya.sharma@acme.com / ${SEED_ADMIN_PASSWORD}`);
  console.log(`  Employee: james.rodriguez@acme.com / ${SEED_USER_PASSWORD}`);
  console.log("========================================");
  console.log("");

  await disconnectDB();
  console.log("[seed] done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] error:", err);
  process.exit(1);
});
