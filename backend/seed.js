const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Student = require('./models/Student');
const Faculty = require('./models/Faculty');
const Class = require('./models/Class');
const Subject = require('./models/Subject');
const Attendance = require('./models/Attendance');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Seed] Connected. Clearing existing collections...');

    await Promise.all([
      User.deleteMany(),
      Student.deleteMany(),
      Faculty.deleteMany(),
      Class.deleteMany(),
      Subject.deleteMany(),
      Attendance.deleteMany()
    ]);
    console.log('[Seed] Database cleared.');

    // 1. Create Admin
    console.log('[Seed] Creating Administrator...');
    const adminUser = await User.create({
      name: 'Dr. Arthur Pendelton',
      email: 'admin@college.edu',
      password: 'password123',
      role: 'admin',
      isActive: true
    });

    // 2. Create Faculty
    console.log('[Seed] Creating Faculty members...');
    const facultyConfigs = [
      {
        name: 'Dr. Alan Turing',
        email: 'alan.turing@college.edu',
        employeeId: 'FAC-CS-001',
        department: 'Computer Engineering'
      },
      {
        name: 'Prof. Grace Hopper',
        email: 'grace.hopper@college.edu',
        employeeId: 'FAC-CS-002',
        department: 'Computer Engineering'
      },
      {
        name: 'Dr. Donald Knuth',
        email: 'donald.knuth@college.edu',
        employeeId: 'FAC-IT-003',
        department: 'Information Technology'
      },
      {
        name: 'Prof. Ada Lovelace',
        email: 'ada.lovelace@college.edu',
        employeeId: 'FAC-AI-004',
        department: 'Computer Engineering'
      }
    ];

    const facultyDocs = [];
    for (const fc of facultyConfigs) {
      const u = await User.create({
        name: fc.name,
        email: fc.email,
        password: 'password123',
        role: 'faculty',
        isActive: true
      });
      const f = await Faculty.create({
        user: u._id,
        employeeId: fc.employeeId,
        department: fc.department
      });
      facultyDocs.push(f);
    }

    // 3. Create Classes
    console.log('[Seed] Creating Classes...');
    const class1 = await Class.create({
      name: 'TY-CSE-A (3rd Year Computer Engineering - Section A)',
      year: 3,
      division: 'A',
      department: 'Computer Engineering'
    });

    const class2 = await Class.create({
      name: 'TY-CSE-B (3rd Year Computer Engineering - Section B)',
      year: 3,
      division: 'B',
      department: 'Computer Engineering'
    });

    const class3 = await Class.create({
      name: 'SY-IT-A (2nd Year Information Technology - Section A)',
      year: 2,
      division: 'A',
      department: 'Information Technology'
    });

    const classes = [class1, class2, class3];

    // 4. Create Subjects per Class
    console.log('[Seed] Creating Subjects and assigning faculty...');
    const subjects = [];

    // Subjects for TY-CSE-A
    const c1Subjects = [
      { name: 'Database Management Systems', code: 'CS301-A', faculty: facultyDocs[0]._id },
      { name: 'Operating Systems', code: 'CS302-A', faculty: facultyDocs[1]._id },
      { name: 'Computer Networks', code: 'CS303-A', faculty: facultyDocs[2]._id },
      { name: 'Software Engineering & Testing', code: 'CS304-A', faculty: facultyDocs[3]._id },
      { name: 'Design & Analysis of Algorithms', code: 'CS305-A', faculty: facultyDocs[0]._id },
      { name: 'Artificial Intelligence & ML', code: 'CS306-A', faculty: facultyDocs[3]._id }
    ];

    for (const s of c1Subjects) {
      const doc = await Subject.create({ ...s, class: class1._id });
      subjects.push(doc);
    }

    // Subjects for TY-CSE-B
    const c2Subjects = [
      { name: 'Database Management Systems', code: 'CS301-B', faculty: facultyDocs[0]._id },
      { name: 'Operating Systems', code: 'CS302-B', faculty: facultyDocs[1]._id },
      { name: 'Computer Networks', code: 'CS303-B', faculty: facultyDocs[2]._id },
      { name: 'Software Engineering & Testing', code: 'CS304-B', faculty: facultyDocs[3]._id },
      { name: 'Design & Analysis of Algorithms', code: 'CS305-B', faculty: facultyDocs[0]._id }
    ];

    for (const s of c2Subjects) {
      const doc = await Subject.create({ ...s, class: class2._id });
      subjects.push(doc);
    }

    // Subjects for SY-IT-A
    const c3Subjects = [
      { name: 'Data Structures & Algorithms', code: 'IT201-A', faculty: facultyDocs[2]._id },
      { name: 'Object Oriented Programming (Java)', code: 'IT202-A', faculty: facultyDocs[1]._id },
      { name: 'Digital Logic & Computer Arch', code: 'IT203-A', faculty: facultyDocs[0]._id },
      { name: 'Discrete Mathematics', code: 'IT204-A', faculty: facultyDocs[3]._id },
      { name: 'Web Development Technologies', code: 'IT205-A', faculty: facultyDocs[2]._id }
    ];

    for (const s of c3Subjects) {
      const doc = await Subject.create({ ...s, class: class3._id });
      subjects.push(doc);
    }

    // 5. Create Students (24 students per class = 72 students)
    console.log('[Seed] Creating 72 students across 3 classes...');
    const firstNames = [
      'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
      'Shaurya', 'Atharv', 'Dhruv', 'Kabir', 'Rohan', 'Diya', 'Saanvi', 'Ananya', 'Aadhya', 'Pari',
      'Anvi', 'Navya', 'Avani', 'Myra', 'Ira', 'Riya', 'Tanvi', 'Sara', 'Meera', 'Sneha'
    ];
    const lastNames = [
      'Sharma', 'Verma', 'Patel', 'Deshmukh', 'Kulkarni', 'Joshi', 'Mehta', 'Nair', 'Iyer', 'Reddy',
      'Chopra', 'Malhotra', 'Gupta', 'Singh', 'Bhat', 'Rao', 'Shinde', 'Pawar', 'Chavan', 'More'
    ];

    const studentDocs = [];
    let studentGlobalIndex = 1;

    for (const cls of classes) {
      const prefix = cls.division === 'A' && cls.year === 3 ? 'CS23A' : (cls.division === 'B' ? 'CS23B' : 'IT24A');
      for (let i = 1; i <= 24; i++) {
        const fn = firstNames[(studentGlobalIndex * 3 + i) % firstNames.length];
        const ln = lastNames[(studentGlobalIndex * 5 + i) % lastNames.length];
        const fullName = `${fn} ${ln}`;
        const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${studentGlobalIndex}@student.edu`;
        const rollNumber = `${prefix}${String(i).padStart(2, '0')}`;

        const u = await User.create({
          name: fullName,
          email,
          password: 'password123',
          role: 'student',
          isActive: true
        });

        const st = await Student.create({
          user: u._id,
          rollNumber,
          class: cls._id,
          phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`
        });

        // Tag an attendance profile index so we deliberately create some defaulters
        // student % 5 === 0 -> Defaulter (55% - 70%)
        // student % 7 === 0 -> Borderline (73% - 76%)
        // others -> Healthy (82% - 96%)
        st.profileType = (studentGlobalIndex % 5 === 0) ? 'defaulter' : ((studentGlobalIndex % 7 === 0) ? 'borderline' : 'good');
        studentDocs.push(st);
        studentGlobalIndex++;
      }
    }

    // 6. Generate 6 weeks of attendance records
    console.log('[Seed] Generating 6 weeks of realistic attendance records (~30 active lecture days)...');
    const attendanceRecords = [];

    // Working back from today over 42 days (6 weeks), skipping weekends
    const today = new Date();
    const lectureDates = [];
    for (let dayOffset = 42; dayOffset >= 1; dayOffset--) {
      const d = new Date(today);
      d.setDate(today.getDate() - dayOffset);
      const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        lectureDates.push(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)));
      }
    }

    // For each class, for each subject of that class, iterate over lecture dates
    for (const cls of classes) {
      const classSubjects = subjects.filter(s => s.class.toString() === cls._id.toString());
      const classStudents = studentDocs.filter(s => s.class.toString() === cls._id.toString());

      // Each subject holds ~2-3 lectures per week. To be realistic, map subjects to specific days
      for (let sIdx = 0; sIdx < classSubjects.length; sIdx++) {
        const subj = classSubjects[sIdx];
        // Select roughly half the available lecture dates for each subject
        const subjDates = lectureDates.filter((_, dIdx) => (dIdx + sIdx) % 2 === 0);

        for (const lectureDate of subjDates) {
          for (const st of classStudents) {
            let presentProbability = 0.90; // default healthy
            if (st.profileType === 'defaulter') {
              presentProbability = 0.62; // Will average ~62% -> Defaulter!
            } else if (st.profileType === 'borderline') {
              presentProbability = 0.74; // Will hover right around 74%
            }

            const isPresent = Math.random() < presentProbability;

            attendanceRecords.push({
              student: st._id,
              subject: subj._id,
              class: cls._id,
              markedBy: subj.faculty,
              date: lectureDate,
              status: isPresent ? 'present' : 'absent'
            });
          }
        }
      }
    }

    console.log(`[Seed] Inserting ${attendanceRecords.length} attendance entries...`);
    // Batch insert attendance in chunks of 1000
    const chunkSize = 1000;
    for (let i = 0; i < attendanceRecords.length; i += chunkSize) {
      await Attendance.insertMany(attendanceRecords.slice(i, i + chunkSize));
    }

    console.log('\n===============================================================');
    console.log('       STUDENT ATTENDANCE SYSTEM - SEEDING SUCCESSFUL          ');
    console.log('===============================================================');
    console.log(' Demo Accounts Created (Password for all: password123):');
    console.log('---------------------------------------------------------------');
    console.log(' 1. ADMIN:');
    console.log('    Email: admin@college.edu');
    console.log('    Role : System Administrator');
    console.log('');
    console.log(' 2. FACULTY:');
    console.log('    Email: alan.turing@college.edu (Dept: Computer Engineering)');
    console.log('    Email: grace.hopper@college.edu (Dept: Computer Engineering)');
    console.log('    Email: donald.knuth@college.edu (Dept: Information Technology)');
    console.log('    Email: ada.lovelace@college.edu (Dept: Computer Engineering)');
    console.log('');
    console.log(' 3. STUDENTS:');
    // Pick the first good student and first defaulter student
    const sampleGood = await Student.findOne({ rollNumber: 'CS23A01' }).populate('user');
    const sampleDefaulter = await Student.findOne({ rollNumber: 'CS23A05' }).populate('user');
    console.log(`    Regular Student  : ${sampleGood.user.email} (Roll: ${sampleGood.rollNumber})`);
    console.log(`    Defaulter (<75%) : ${sampleDefaulter.user.email} (Roll: ${sampleDefaulter.rollNumber})`);
    console.log('===============================================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

seedData();
