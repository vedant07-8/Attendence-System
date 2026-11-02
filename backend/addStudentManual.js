/**
 * Manual Student Creator Utility
 * 
 * Usage 1 - Single student via command line:
 *   node addStudentManual.js "Aarav Sharma" "aarav@student.edu" "CS23A01" "TY-CSE-A" "9876543210" "password123"
 * 
 * Usage 2 - Batch insert:
 *   Edit the `studentsToInsert` list below and run:
 *   node addStudentManual.js
 */

const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Student = require('./models/Student');
const Class = require('./models/Class');

// Edit this list if you want to add multiple students at once:
const studentsToInsert = [
  // {
  //   name: 'John Doe',
  //   email: 'john.doe@student.edu',
  //   rollNumber: 'CS23A01',
  //   className: 'TY-CSE-A', // Will find existing class or create it
  //   phone: '+91 9876543210',
  //   password: 'password123'
  // }
];

const addStudent = async (studentData) => {
  const { name, email, rollNumber, className, phone = '', password = 'password123' } = studentData;

  // 1. Find or create the class
  let cls = await Class.findOne({ name: className });
  if (!cls) {
    console.log(`[Class] Class "${className}" not found, creating it...`);
    cls = await Class.create({
      name: className,
      year: 3,
      division: 'A',
      department: 'Computer Engineering'
    });
  }

  // 2. Check if user email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    console.error(`[Error] User with email "${email}" already exists!`);
    return;
  }

  // 3. Check if roll number already exists
  const existingRoll = await Student.findOne({ rollNumber: rollNumber.toUpperCase().trim() });
  if (existingRoll) {
    console.error(`[Error] Student with roll number "${rollNumber}" already exists!`);
    return;
  }

  // 4. Create User document (pre-save hook hashes password with bcrypt)
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: password,
    role: 'student',
    isActive: true
  });

  // 5. Create Student document referencing User and Class
  const student = await Student.create({
    user: user._id,
    rollNumber: rollNumber.toUpperCase().trim(),
    class: cls._id,
    phone: phone ? phone.trim() : ''
  });

  console.log(`[Success] Added student: ${student.rollNumber} - ${user.name} (${user.email}) -> Class: ${cls.name}`);
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Connected to MongoDB]');

    const args = process.argv.slice(2);

    if (args.length >= 4) {
      // CLI mode: name, email, rollNumber, className, [phone], [password]
      const [name, email, rollNumber, className, phone, password] = args;
      await addStudent({
        name,
        email,
        rollNumber,
        className,
        phone: phone || '',
        password: password || 'password123'
      });
    } else if (studentsToInsert.length > 0) {
      // Batch mode
      console.log(`[Batch] Inserting ${studentsToInsert.length} students...`);
      for (const st of studentsToInsert) {
        await addStudent(st);
      }
    } else {
      console.log('\n================ MANUAL STUDENT CREATION ================');
      console.log('Provide arguments:');
      console.log('  node addStudentManual.js "<Name>" "<Email>" "<RollNumber>" "<ClassName>" "[Phone]" "[Password]"');
      console.log('\nExample:');
      console.log('  node addStudentManual.js "Rohan Sharma" "rohan@student.edu" "CS23A01" "TY-CSE-A" "9876543210" "password123"');
      console.log('=========================================================\n');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('[Error]:', err.message);
    process.exit(1);
  }
};

run();
