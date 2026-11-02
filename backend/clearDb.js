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

const clearDatabase = async () => {
  try {
    console.log('[ClearDB] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[ClearDB] Connected.');

    // Delete all records
    await Promise.all([
      User.deleteMany(),
      Student.deleteMany(),
      Faculty.deleteMany(),
      Class.deleteMany(),
      Subject.deleteMany(),
      Attendance.deleteMany()
    ]);

    console.log('[ClearDB] All collections successfully cleared.');

    // Recreate a clean administrator account so the system remains accessible
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@college.edu',
      password: 'password123',
      role: 'admin',
      isActive: true
    });

    console.log('[ClearDB] Created clean Admin account:');
    console.log('  Email   : admin@college.edu');
    console.log('  Password: password123');

    await mongoose.connection.close();
    console.log('[ClearDB] Done.');
    process.exit(0);
  } catch (err) {
    console.error('[ClearDB Error]:', err);
    process.exit(1);
  }
};

clearDatabase();
